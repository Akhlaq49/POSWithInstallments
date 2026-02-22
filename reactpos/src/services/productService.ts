import api from './api';

export interface ProductPayload {
  store: string;
  warehouse: string;
  productName: string;
  slug: string;
  sku: string;
  sellingType: string;
  category: string;
  subCategory: string;
  brand: string;
  unit: string;
  barcodeSymbology: string;
  itemBarcode: string;
  description: string;
  // Pricing & Stock
  productType: 'single' | 'variable';
  quantity: number;
  price: number;
  taxType: string;
  tax: string;
  discountType: string;
  discountValue: number;
  quantityAlert: number;
  // Custom fields
  warranty: string;
  manufacturer: string;
  manufacturedDate: string;
  expiryDate: string;
  // Images
  images: File[];
}

export interface ProductResponse {
  id: string;
  store: string;
  warehouse: string;
  productName: string;
  slug: string;
  sku: string;
  sellingType: string;
  category: string;
  subCategory: string;
  brand: string;
  unit: string;
  barcodeSymbology: string;
  itemBarcode: string;
  description: string;
  productType: string;
  quantity: number;
  price: number;
  taxType: string;
  tax: string;
  discountType: string;
  discountValue: number;
  quantityAlert: number;
  warranty: string;
  manufacturer: string;
  manufacturedDate: string;
  expiryDate: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DropdownOption {
  value: string;
  label: string;
}

// Product CRUD
export const createProduct = async (data: ProductPayload): Promise<ProductResponse> => {
  const formData = new FormData();

  // Append all text fields
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'images') {
      formData.append(key, String(value));
    }
  });

  // Append images
  if (data.images && data.images.length > 0) {
    data.images.forEach((file) => {
      formData.append('images', file);
    });
  }

  const response = await api.post<ProductResponse>('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getProducts = async (): Promise<ProductResponse[]> => {
  const response = await api.get<ProductResponse[]>('/products');
  return response.data;
};

export const getProductById = async (id: string): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (id: string, data: Partial<ProductPayload>): Promise<ProductResponse> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'images') {
      formData.append(key, String(value));
    }
  });
  if (data.images && data.images.length > 0) {
    data.images.forEach((file) => {
      formData.append('images', file);
    });
  }
  const response = await api.put<ProductResponse>(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

// Dropdown data fetchers
export const getStores = async (): Promise<DropdownOption[]> => {
  try {
    const response = await api.get<DropdownOption[]>('/stores');
    return response.data;
  } catch {
    // Fallback defaults if API not available
    return [
      { value: 'electro-mart', label: 'Electro Mart' },
      { value: 'quantum-gadgets', label: 'Quantum Gadgets' },
      { value: 'gadget-world', label: 'Gadget World' },
      { value: 'volt-vault', label: 'Volt Vault' },
      { value: 'elite-retail', label: 'Elite Retail' },
      { value: 'prime-mart', label: 'Prime Mart' },
      { value: 'neotech-store', label: 'NeoTech Store' },
    ];
  }
};

export const getWarehouses = async (): Promise<DropdownOption[]> => {
  try {
    const response = await api.get<DropdownOption[]>('/warehouses');
    return response.data;
  } catch {
    return [
      { value: 'lavish', label: 'Lavish Warehouse' },
      { value: 'quaint', label: 'Quaint Warehouse' },
      { value: 'traditional', label: 'Traditional Warehouse' },
      { value: 'cool', label: 'Cool Warehouse' },
      { value: 'overflow', label: 'Overflow Warehouse' },
      { value: 'nova', label: 'Nova Storage Hub' },
      { value: 'retail', label: 'Retail Supply Hub' },
      { value: 'edgeware', label: 'EdgeWare Solutions' },
    ];
  }
};

export const getCategories = async (): Promise<DropdownOption[]> => {
  try {
    const response = await api.get<DropdownOption[]>('/categories');
    return response.data;
  } catch {
    return [
      { value: 'computers', label: 'Computers' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'shoe', label: 'Shoe' },
      { value: 'cosmetics', label: 'Cosmetics' },
      { value: 'groceries', label: 'Groceries' },
      { value: 'furniture', label: 'Furniture' },
      { value: 'bags', label: 'Bags' },
      { value: 'phone', label: 'Phone' },
    ];
  }
};

export const getSubCategories = async (): Promise<DropdownOption[]> => {
  try {
    const response = await api.get<DropdownOption[]>('/sub-categories');
    return response.data;
  } catch {
    return [
      { value: 'laptop', label: 'Laptop' },
      { value: 'desktop', label: 'Desktop' },
      { value: 'sneakers', label: 'Sneakers' },
      { value: 'formals', label: 'Formals' },
      { value: 'wearables', label: 'Wearables' },
      { value: 'speakers', label: 'Speakers' },
      { value: 'handbags', label: 'Handbags' },
      { value: 'travel', label: 'Travel' },
      { value: 'sofa', label: 'Sofa' },
    ];
  }
};

export const getBrands = async (): Promise<DropdownOption[]> => {
  try {
    const response = await api.get<DropdownOption[]>('/brands');
    return response.data;
  } catch {
    return [
      { value: 'lenovo', label: 'Lenevo' },
      { value: 'beats', label: 'Beats' },
      { value: 'nike', label: 'Nike' },
      { value: 'apple', label: 'Apple' },
      { value: 'amazon', label: 'Amazon' },
      { value: 'woodmart', label: 'Woodmart' },
    ];
  }
};

export const getUnits = async (): Promise<DropdownOption[]> => {
  try {
    const response = await api.get<DropdownOption[]>('/units');
    return response.data;
  } catch {
    return [
      { value: 'kg', label: 'Kg' },
      { value: 'pcs', label: 'Pcs' },
      { value: 'l', label: 'L' },
      { value: 'dz', label: 'dz' },
      { value: 'bx', label: 'bx' },
    ];
  }
};
