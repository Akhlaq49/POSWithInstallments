import api from './api';

export interface GuarantorDto {
  id: number;
  name: string;
  so?: string;
  phone?: string;
  cnic?: string;
  address?: string;
  relationship?: string;
  picture?: string;
}

export interface InstallmentPlan {
  id: string;
  customerName: string;
  customerSo?: string;
  customerCnic?: string;
  customerPhone: string;
  customerAddress: string;
  customerImage?: string;
  productName: string;
  productImage: string;
  productPrice: number;
  financeAmount?: number;
  downPayment: number;
  financedAmount: number;
  interestRate: number; // annual %
  tenure: number; // months
  emiAmount: number;
  totalPayable: number;
  totalInterest: number;
  startDate: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  paidInstallments: number;
  remainingInstallments: number;
  nextDueDate: string;
  createdAt: string;
  schedule: RepaymentEntry[];
  guarantors: GuarantorDto[];
}

export interface RepaymentEntry {
  installmentNo: number;
  dueDate: string;
  emiAmount: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'paid' | 'due' | 'overdue' | 'upcoming';
  paidDate?: string;
}

export interface CreateInstallmentPayload {
  customerId: number;
  productId: number;
  financeAmount?: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
  startDate: string;
}

// EMI = [P × r × (1+r)^n] / [(1+r)^n – 1]
export function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12 / 100;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export function generateRepaymentSchedule(
  financedAmount: number,
  annualRate: number,
  tenure: number,
  startDate: string
): RepaymentEntry[] {
  const schedule: RepaymentEntry[] = [];
  const emi = calculateEMI(financedAmount, annualRate, tenure);
  const r = annualRate / 12 / 100;
  let balance = financedAmount;
  const start = new Date(startDate);
  const today = new Date();

  for (let i = 1; i <= tenure; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);

    const interest = annualRate === 0 ? 0 : balance * r;
    const principal = emi - interest;
    balance = Math.max(0, balance - principal);

    let status: RepaymentEntry['status'] = 'upcoming';
    if (dueDate < today) {
      status = 'overdue';
    } else if (
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    ) {
      status = 'due';
    }

    schedule.push({
      installmentNo: i,
      dueDate: dueDate.toISOString().split('T')[0],
      emiAmount: Math.round(emi * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      status,
    });
  }

  return schedule;
}

export interface BuildPlanParams {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productPrice: number;
  downPayment: number;
  interestRate: number;
  tenure: number;
  startDate: string;
}

export function buildInstallmentPlan(params: BuildPlanParams, productImage?: string): InstallmentPlan {
  const financedAmount = params.productPrice - params.downPayment;
  const emi = calculateEMI(financedAmount, params.interestRate, params.tenure);
  const totalPayable = params.downPayment + emi * params.tenure;
  const totalInterest = totalPayable - params.productPrice;
  const schedule = generateRepaymentSchedule(financedAmount, params.interestRate, params.tenure, params.startDate);

  const nextDue = schedule.find((s) => s.status === 'due' || s.status === 'upcoming');

  return {
    id: Date.now().toString(),
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerAddress: params.customerAddress,
    productName: params.productName,
    productImage: productImage || '/assets/img/products/stock-img-01.png',
    productPrice: params.productPrice,
    downPayment: params.downPayment,
    financedAmount,
    interestRate: params.interestRate,
    tenure: params.tenure,
    emiAmount: Math.round(emi * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    startDate: params.startDate,
    status: 'active',
    paidInstallments: 0,
    remainingInstallments: params.tenure,
    nextDueDate: nextDue?.dueDate || '',
    createdAt: new Date().toISOString().split('T')[0],
    schedule,
  };
}

// API calls
export async function getInstallmentPlans(): Promise<InstallmentPlan[]> {
  const response = await api.get<InstallmentPlan[]>('/installments');
  return response.data;
}

export async function getInstallmentById(id: string): Promise<InstallmentPlan> {
  const response = await api.get<InstallmentPlan>(`/installments/${id}`);
  return response.data;
}

export async function createInstallment(payload: CreateInstallmentPayload): Promise<InstallmentPlan> {
  const response = await api.post<InstallmentPlan>('/installments', payload);
  return response.data;
}

export async function markInstallmentPaid(planId: string, installmentNo: number): Promise<void> {
  await api.put(`/installments/${planId}/pay/${installmentNo}`);
}

export async function cancelInstallment(id: string): Promise<void> {
  await api.delete(`/installments/${id}`);
}

// Guarantor API calls
export async function addGuarantor(planId: string, data: FormData): Promise<GuarantorDto> {
  const response = await api.post<GuarantorDto>(`/installments/${planId}/guarantors`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateGuarantor(guarantorId: number, data: FormData): Promise<GuarantorDto> {
  const response = await api.put<GuarantorDto>(`/installments/guarantors/${guarantorId}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteGuarantor(guarantorId: number): Promise<void> {
  await api.delete(`/installments/guarantors/${guarantorId}`);
}
