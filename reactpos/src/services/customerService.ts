import api from './api';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: 'active' | 'inactive';
}

const fallbackCustomers: Customer[] = [
  { id: '1', name: 'Ahmed Khan', phone: '0300-1234567', email: 'ahmed@example.com', address: '123 Main St, Karachi', city: 'Karachi', status: 'active' },
  { id: '2', name: 'Sara Ali', phone: '0321-9876543', email: 'sara@example.com', address: '45 Garden Ave, Lahore', city: 'Lahore', status: 'active' },
  { id: '3', name: 'Bilal Ahmed', phone: '0333-5551234', email: 'bilal@example.com', address: '78 City Rd, Islamabad', city: 'Islamabad', status: 'active' },
  { id: '4', name: 'Fatima Noor', phone: '0345-7778899', email: 'fatima@example.com', address: '12 Lake View, Faisalabad', city: 'Faisalabad', status: 'active' },
  { id: '5', name: 'Usman Tariq', phone: '0312-4445566', email: 'usman@example.com', address: '90 Block B, Multan', city: 'Multan', status: 'active' },
  { id: '6', name: 'Ayesha Malik', phone: '0301-2223344', email: 'ayesha@example.com', address: '56 Park Lane, Rawalpindi', city: 'Rawalpindi', status: 'active' },
  { id: '7', name: 'Hassan Raza', phone: '0334-6667788', email: 'hassan@example.com', address: '33 Hill Top, Peshawar', city: 'Peshawar', status: 'active' },
  { id: '8', name: 'Zainab Hussain', phone: '0315-8889900', email: 'zainab@example.com', address: '67 River View, Quetta', city: 'Quetta', status: 'active' },
  { id: '9', name: 'Ali Abbas', phone: '0322-1112233', email: 'ali@example.com', address: '101 Market Rd, Sialkot', city: 'Sialkot', status: 'active' },
  { id: '10', name: 'Maria Sharif', phone: '0346-3334455', email: 'maria@example.com', address: '22 Mall Rd, Gujranwala', city: 'Gujranwala', status: 'active' },
];

export async function getCustomers(): Promise<Customer[]> {
  try {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  } catch {
    return fallbackCustomers;
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  } catch {
    return fallbackCustomers.find((c) => c.id === id) || null;
  }
}

export async function createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
  try {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  } catch {
    return { ...data, id: Date.now().toString() };
  }
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  try {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  } catch {
    return null;
  }
}

export async function deleteCustomer(id: string): Promise<boolean> {
  try {
    await api.delete(`/customers/${id}`);
    return true;
  } catch {
    return false;
  }
}
