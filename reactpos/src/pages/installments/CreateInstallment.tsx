import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreateInstallmentPayload,
  calculateEMI,
  generateRepaymentSchedule,
  createInstallment,
  RepaymentEntry,
} from '../../services/installmentService';
import { getProducts, ProductResponse } from '../../services/productService';
import { getCustomers, Customer } from '../../services/customerService';

const CreateInstallment: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Customer search state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Product search state
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CreateInstallmentPayload>({
    customerId: 0,
    productId: 0,
    downPayment: 0,
    interestRate: 0,
    tenure: 12,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Preview data
  const productPrice = selectedProduct?.price ?? 0;
  const financedAmount = productPrice - form.downPayment;
  const emi = useMemo(
    () => (financedAmount > 0 && form.tenure > 0 ? calculateEMI(financedAmount, form.interestRate, form.tenure) : 0),
    [financedAmount, form.interestRate, form.tenure]
  );
  const totalPayable = form.downPayment + emi * form.tenure;
  const totalInterest = totalPayable - productPrice;
  const schedule: RepaymentEntry[] = useMemo(
    () => (financedAmount > 0 && form.tenure > 0 ? generateRepaymentSchedule(financedAmount, form.interestRate, form.tenure, form.startDate) : []),
    [financedAmount, form.interestRate, form.tenure, form.startDate]
  );

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const set = (field: keyof CreateInstallmentPayload, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (typeof (window as any).feather !== 'undefined') {
      (window as any).feather.replace();
    }
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch {
        setCustomers([]);
      } finally {
        setCustomersLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch products from inventory
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const data = await getProducts();
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setForm((prev) => ({
      ...prev,
      customerId: Number(customer.id),
    }));
  }, []);

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setForm((prev) => ({
      ...prev,
      customerId: 0,
    }));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) =>
      p.productName.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const handleSelectProduct = useCallback((product: ProductResponse) => {
    setSelectedProduct(product);
    setProductSearch(product.productName);
    setShowProductDropdown(false);
    setForm((prev) => ({
      ...prev,
      productId: Number(product.id),
    }));
  }, []);

  const handleClearProduct = useCallback(() => {
    setSelectedProduct(null);
    setProductSearch('');
    setForm((prev) => ({
      ...prev,
      productId: 0,
    }));
  }, []);

  const isValid = form.customerId > 0 && form.productId > 0 && productPrice > 0 && form.downPayment >= 0 && form.downPayment < productPrice && form.tenure > 0 && form.startDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError('');

    try {
      await createInstallment(form);
      navigate('/installment-plans');
    } catch {
      setError('Failed to create installment plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold">Create Installment Plan</h4>
            <h6>Set up a new product installment with repayment schedule</h6>
          </div>
        </div>
        <div className="page-btn">
          <a href="#" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); navigate('/installment-plans'); }}>
            <i className="ti ti-arrow-left me-1"></i>Back to Plans
          </a>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* LEFT: Form */}
          <div className="col-xl-7">
            {/* Customer Information */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0"><i className="ti ti-user me-2"></i>Customer Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label">Search Customer<span className="text-danger ms-1">*</span></label>
                    <div ref={customerSearchRef} style={{ position: 'relative' }}>
                      <div className="input-group">
                        <span className="input-group-text"><i className="ti ti-search"></i></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Type customer name, phone, email or city..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                            if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                              setSelectedCustomer(null);
                              setForm((prev) => ({ ...prev, customerId: 0 }));
                            }
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                        />
                        {selectedCustomer && (
                          <button type="button" className="btn btn-outline-secondary" onClick={handleClearCustomer}>
                            <i className="ti ti-x"></i>
                          </button>
                        )}
                      </div>
                      {showCustomerDropdown && (
                        <div className="border rounded shadow-sm bg-white" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1050, maxHeight: 300, overflowY: 'auto' }}>
                          {customersLoading ? (
                            <div className="text-center p-3"><span className="spinner-border spinner-border-sm text-primary"></span> Loading customers...</div>
                          ) : filteredCustomers.length === 0 ? (
                            <div className="text-center p-3 text-muted">No customers found</div>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                className={`d-flex align-items-center p-2 border-bottom ${selectedCustomer?.id === customer.id ? 'bg-primary-transparent' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSelectCustomer(customer)}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selectedCustomer?.id === customer.id ? '' : '#f8f9fa')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedCustomer?.id === customer.id ? '' : '')}
                              >
                                <span className="avatar avatar-md me-2 bg-primary-transparent text-primary d-flex align-items-center justify-content-center rounded-circle fw-bold">
                                  {customer.name.charAt(0).toUpperCase()}
                                </span>
                                <div className="flex-grow-1">
                                  <h6 className="mb-0 fs-13 fw-medium">{customer.name}</h6>
                                  <small className="text-muted">{customer.phone} &bull; {customer.email || '-'}</small>
                                </div>
                                <div className="text-end">
                                  <small className="text-muted">{customer.city || '-'}</small>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected customer preview */}
                  {selectedCustomer && (
                    <div className="col-12 mb-3">
                      <div className="alert alert-success d-flex align-items-center mb-0" role="alert">
                        <span className="avatar avatar-lg me-3 bg-success-transparent text-success d-flex align-items-center justify-content-center rounded-circle fw-bold fs-20">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold">{selectedCustomer.name}</h6>
                          <div className="d-flex gap-3 flex-wrap">
                            <small><strong>Phone:</strong> {selectedCustomer.phone}</small>
                            <small><strong>Email:</strong> {selectedCustomer.email || '-'}</small>
                            <small><strong>City:</strong> {selectedCustomer.city || '-'}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Customer Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={selectedCustomer?.name ?? ''} readOnly placeholder="Select a customer from search above" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={selectedCustomer?.phone ?? ''} readOnly placeholder="Auto-filled from customer" />
                  </div>
                  <div className="col-12 mb-0">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={2} value={selectedCustomer?.address ?? ''} readOnly placeholder="Auto-filled from customer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0"><i className="ti ti-box me-2"></i>Product Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-12 mb-3">
                    <label className="form-label">Search Product from Inventory<span className="text-danger ms-1">*</span></label>
                    <div ref={productSearchRef} style={{ position: 'relative' }}>
                      <div className="input-group">
                        <span className="input-group-text"><i className="ti ti-search"></i></span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Type product name, SKU, category or brand..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                            if (selectedProduct && e.target.value !== selectedProduct.productName) {
                              setSelectedProduct(null);
                              setForm((prev) => ({ ...prev, productId: 0 }));
                            }
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                        />
                        {selectedProduct && (
                          <button type="button" className="btn btn-outline-secondary" onClick={handleClearProduct}>
                            <i className="ti ti-x"></i>
                          </button>
                        )}
                      </div>
                      {showProductDropdown && (
                        <div className="border rounded shadow-sm bg-white" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1050, maxHeight: 300, overflowY: 'auto' }}>
                          {productsLoading ? (
                            <div className="text-center p-3"><span className="spinner-border spinner-border-sm text-primary"></span> Loading products...</div>
                          ) : filteredProducts.length === 0 ? (
                            <div className="text-center p-3 text-muted">No products found</div>
                          ) : (
                            filteredProducts.map((product) => (
                              <div
                                key={product.id}
                                className={`d-flex align-items-center p-2 border-bottom cursor-pointer ${selectedProduct?.id === product.id ? 'bg-primary-transparent' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSelectProduct(product)}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = selectedProduct?.id === product.id ? '' : '#f8f9fa')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedProduct?.id === product.id ? '' : '')}
                              >
                                <div className="avatar avatar-md me-2">
                                  <img src={product.images?.[0] || '/assets/img/products/stock-img-01.png'} alt={product.productName} />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-0 fs-13 fw-medium">{product.productName}</h6>
                                  <small className="text-muted">{product.sku || '-'} &bull; {product.category || '-'} &bull; {product.brand || '-'}</small>
                                </div>
                                <div className="text-end">
                                  <span className="fw-bold text-primary">Rs {fmt(product.price)}</span>
                                  {product.quantity !== undefined && <br />}
                                  {product.quantity !== undefined && <small className="text-muted">Qty: {product.quantity}</small>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected product preview */}
                  {selectedProduct && (
                    <div className="col-12 mb-3">
                      <div className="alert alert-primary d-flex align-items-center mb-0" role="alert">
                        <div className="avatar avatar-lg me-3">
                          <img src={selectedProduct.images?.[0] || '/assets/img/products/stock-img-01.png'} alt={selectedProduct.productName} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold">{selectedProduct.productName}</h6>
                          <div className="d-flex gap-3 flex-wrap">
                            <small><strong>SKU:</strong> {selectedProduct.sku || '-'}</small>
                            <small><strong>Category:</strong> {selectedProduct.category || '-'}</small>
                            <small><strong>Brand:</strong> {selectedProduct.brand || '-'}</small>
                            <small><strong>Price:</strong> Rs {fmt(selectedProduct.price)}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Product Name<span className="text-danger ms-1">*</span></label>
                    <input type="text" className="form-control" value={selectedProduct?.productName ?? ''} readOnly placeholder="Select a product from search above" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Product Price (Rs)<span className="text-danger ms-1">*</span></label>
                    <input type="number" className="form-control" value={productPrice || ''} readOnly placeholder="Auto-filled from product" />
                  </div>
                </div>
              </div>
            </div>

            {/* Installment Settings */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0"><i className="ti ti-settings me-2"></i>Installment Settings</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Down Payment (Rs)<span className="text-danger ms-1">*</span></label>
                    <input type="number" className="form-control" min={0} step="0.01" value={form.downPayment || ''} onChange={(e) => set('downPayment', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    {productPrice > 0 && <small className="text-muted">{((form.downPayment / productPrice) * 100).toFixed(1)}% of product price</small>}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Interest Rate (% per annum)</label>
                    <input type="number" className="form-control" min={0} max={100} step="0.1" value={form.interestRate || ''} onChange={(e) => set('interestRate', parseFloat(e.target.value) || 0)} placeholder="0" />
                    <small className="text-muted">Set 0 for interest-free plan</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tenure (Months)<span className="text-danger ms-1">*</span></label>
                    <select className="form-select" value={form.tenure} onChange={(e) => set('tenure', parseInt(e.target.value))}>
                      {[3, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60].map((m) => (
                        <option key={m} value={m}>{m} Months</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date<span className="text-danger ms-1">*</span></label>
                    <input type="date" className="form-control" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="col-xl-5">
            {/* Plan Summary */}
            <div className="card border-primary">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0 text-white"><i className="ti ti-calculator me-2"></i>Plan Summary</h5>
              </div>
              <div className="card-body">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr><td className="text-muted">Product Price</td><td className="text-end fw-medium">Rs {fmt(productPrice)}</td></tr>
                    <tr><td className="text-muted">Down Payment</td><td className="text-end fw-medium text-success">- Rs {fmt(form.downPayment)}</td></tr>
                    <tr className="border-top"><td className="text-muted">Financed Amount</td><td className="text-end fw-bold">Rs {fmt(financedAmount)}</td></tr>
                    <tr><td className="text-muted">Interest Rate</td><td className="text-end">{form.interestRate}% p.a.</td></tr>
                    <tr><td className="text-muted">Tenure</td><td className="text-end">{form.tenure} months</td></tr>
                    <tr className="border-top"><td className="text-muted">Monthly EMI</td><td className="text-end fw-bold fs-16 text-primary">Rs {fmt(Math.round(emi * 100) / 100)}</td></tr>
                    <tr><td className="text-muted">Total Interest</td><td className="text-end text-danger">Rs {fmt(Math.round(totalInterest * 100) / 100)}</td></tr>
                    <tr className="border-top"><td className="fw-bold">Total Payable</td><td className="text-end fw-bold fs-16">Rs {fmt(Math.round(totalPayable * 100) / 100)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Repayment Schedule Preview */}
            {schedule.length > 0 && (
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="card-title mb-0"><i className="ti ti-calendar me-2"></i>Repayment Schedule</h5>
                  <span className="badge bg-primary">{schedule.length} installments</span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <table className="table table-sm mb-0">
                      <thead className="thead-light">
                        <tr>
                          <th>#</th>
                          <th>Due Date</th>
                          <th>EMI</th>
                          <th>Principal</th>
                          <th>Interest</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((entry) => (
                          <tr key={entry.installmentNo}>
                            <td>{entry.installmentNo}</td>
                            <td>{entry.dueDate}</td>
                            <td className="fw-medium">{fmt(entry.emiAmount)}</td>
                            <td>{fmt(entry.principal)}</td>
                            <td className="text-danger">{fmt(entry.interest)}</td>
                            <td>{fmt(entry.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-top">
                        <tr className="fw-bold">
                          <td colSpan={2}>Total</td>
                          <td>{fmt(schedule.reduce((s, e) => s + e.emiAmount, 0))}</td>
                          <td>{fmt(schedule.reduce((s, e) => s + e.principal, 0))}</td>
                          <td className="text-danger">{fmt(schedule.reduce((s, e) => s + e.interest, 0))}</td>
                          <td>-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="card">
          <div className="card-body d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/installment-plans')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isValid || submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : <><i className="ti ti-check me-1"></i>Create Installment Plan</>}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreateInstallment;
