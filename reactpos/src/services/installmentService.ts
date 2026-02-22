import api from './api';

export interface InstallmentPlan {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productImage: string;
  productPrice: number;
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
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productId: string;
  productName: string;
  productPrice: number;
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

export function buildInstallmentPlan(payload: CreateInstallmentPayload, productImage?: string): InstallmentPlan {
  const financedAmount = payload.productPrice - payload.downPayment;
  const emi = calculateEMI(financedAmount, payload.interestRate, payload.tenure);
  const totalPayable = payload.downPayment + emi * payload.tenure;
  const totalInterest = totalPayable - payload.productPrice;
  const schedule = generateRepaymentSchedule(financedAmount, payload.interestRate, payload.tenure, payload.startDate);

  const nextDue = schedule.find((s) => s.status === 'due' || s.status === 'upcoming');

  return {
    id: Date.now().toString(),
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerAddress: payload.customerAddress,
    productName: payload.productName,
    productImage: productImage || '/assets/img/products/stock-img-01.png',
    productPrice: payload.productPrice,
    downPayment: payload.downPayment,
    financedAmount,
    interestRate: payload.interestRate,
    tenure: payload.tenure,
    emiAmount: Math.round(emi * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    startDate: payload.startDate,
    status: 'active',
    paidInstallments: 0,
    remainingInstallments: payload.tenure,
    nextDueDate: nextDue?.dueDate || '',
    createdAt: new Date().toISOString().split('T')[0],
    schedule,
  };
}

// API calls with fallback
export async function getInstallmentPlans(): Promise<InstallmentPlan[]> {
  try {
    const response = await api.get<InstallmentPlan[]>('/installments');
    return response.data;
  } catch {
    return [];
  }
}

export async function getInstallmentById(id: string): Promise<InstallmentPlan | null> {
  try {
    const response = await api.get<InstallmentPlan>(`/installments/${id}`);
    return response.data;
  } catch {
    return null;
  }
}

export async function createInstallment(payload: CreateInstallmentPayload): Promise<InstallmentPlan | null> {
  try {
    const response = await api.post<InstallmentPlan>('/installments', payload);
    return response.data;
  } catch {
    return null;
  }
}

export async function markInstallmentPaid(planId: string, installmentNo: number): Promise<boolean> {
  try {
    await api.put(`/installments/${planId}/pay/${installmentNo}`);
    return true;
  } catch {
    return false;
  }
}

export async function cancelInstallment(id: string): Promise<boolean> {
  try {
    await api.delete(`/installments/${id}`);
    return true;
  } catch {
    return false;
  }
}
