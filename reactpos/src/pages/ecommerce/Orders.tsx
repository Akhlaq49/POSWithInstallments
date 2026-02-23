import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { mediaUrl } from '../../services/api';

/* ---------- Types ---------- */
interface OrderItemDto { id: number; productId: number; productName: string; quantity: number; price: number; }
interface OrderDto {
  id: number; orderNumber: string; customerId: number | null; customerName: string;
  customerImage: string | null; paymentType: string; amount: number; status: string;
  orderDate: string; items: OrderItemDto[];
}
interface CustomerResult { id: number; name: string; phone?: string; }
interface ProductResult { id: string; productName: string; sku: string; category: string; price: number; images: string[]; }

interface LocalItem { productId: number; productName: string; quantity: number; price: number; }

const PAYMENT_TYPES = ['PayPal', 'Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'];
const STATUS_OPTIONS = ['Pending', 'Processing', 'Completed', 'Cancelled'];

const statusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'completed') return 'bg-success';
  if (s === 'pending') return 'bg-cyan';
  if (s === 'processing') return 'bg-purple';
  if (s === 'cancelled') return 'bg-danger';
  return 'bg-secondary';
};

/* ---------- Component ---------- */
const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerResult[]>([]);
  const [products, setProducts] = useState<ProductResult[]>([]);

  /* filters */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  /* select */
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* add/edit modal */
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ customerId: null as number | null, customerName: '', customerImage: '', paymentType: '', status: 'Pending' });
  const [items, setItems] = useState<LocalItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  /* view modal */
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<OrderDto | null>(null);

  /* delete modal */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ---- Fetch ---- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, cRes, pRes] = await Promise.all([
        api.get<OrderDto[]>('/orders'),
        api.get<CustomerResult[]>('/customers'),
        api.get<ProductResult[]>('/products'),
      ]);
      setOrders(oRes.data);
      setCustomers(cRes.data);
      setProducts(pRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (typeof (window as any).feather !== 'undefined') (window as any).feather.replace(); });

  /* ---- Click-away ---- */
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) setShowProductDropdown(false);
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) setShowCustomerDropdown(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  /* ---- Filters ---- */
  const filtered = orders
    .filter((o) => {
      const s = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || o.orderNumber.includes(s) || o.customerName.toLowerCase().includes(s) || o.paymentType.toLowerCase().includes(s);
      const matchPayment = !filterPayment || o.paymentType === filterPayment;
      const matchStatus = !filterStatus || o.status === filterStatus;
      return matchSearch && matchPayment && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'asc') return a.amount - b.amount;
      if (sortBy === 'desc') return b.amount - a.amount;
      return 0;
    });

  /* ---- Select ---- */
  const handleSelectAll = (checked: boolean) => { setSelectAll(checked); setSelectedIds(checked ? new Set(filtered.map((o) => o.id)) : new Set()); };
  const handleSelectOne = (id: number, checked: boolean) => { setSelectedIds((prev) => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; }); };

  /* ---- Product search ---- */
  const searchProducts = (term: string) =>
    term.trim().length > 0
      ? products.filter((p) => p.productName.toLowerCase().includes(term.toLowerCase()) || p.sku.toLowerCase().includes(term.toLowerCase())).slice(0, 8)
      : [];

  const handleProductSelect = (p: ProductResult) => {
    const pid = parseInt(p.id);
    if (items.some((i) => i.productId === pid)) {
      setItems((prev) => prev.map((i) => i.productId === pid ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems((prev) => [...prev, { productId: pid, productName: p.productName, quantity: 1, price: p.price || 0 }]);
    }
    setProductSearchTerm('');
  };

  /* ---- Customer search ---- */
  const searchCustomers = (term: string) =>
    term.trim().length > 0
      ? customers.filter((c) => c.name.toLowerCase().includes(term.toLowerCase())).slice(0, 8)
      : [];

  /* ---- Add/Edit ---- */
  const resetModal = () => {
    setForm({ customerId: null, customerName: '', customerImage: '', paymentType: '', status: 'Pending' });
    setItems([]);
    setProductSearchTerm('');
    setCustomerSearchTerm('');
    setEditingId(null);
  };

  const openAddModal = () => { resetModal(); setShowModal(true); };

  const openEditModal = (o: OrderDto) => {
    setEditingId(o.id);
    setForm({ customerId: o.customerId, customerName: o.customerName, customerImage: o.customerImage || '', paymentType: o.paymentType, status: o.status });
    setItems(o.items.map((i) => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, price: i.price })));
    setCustomerSearchTerm(o.customerName);
    setProductSearchTerm('');
    setShowModal(true);
  };

  const calcAmount = () => items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const handleSave = async () => {
    if (!form.customerName || !form.paymentType || items.length === 0) return;
    const payload = { ...form, amount: calcAmount(), items: items.map((i) => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, price: i.price })) };
    try {
      if (editingId) await api.put(`/orders/${editingId}`, payload);
      else await api.post('/orders', payload);
      await fetchData();
    } catch { /* ignore */ }
    setShowModal(false);
    resetModal();
  };

  /* ---- View ---- */
  const openViewModal = (o: OrderDto) => { setViewOrder(o); setShowViewModal(true); };

  /* ---- Delete ---- */
  const openDeleteModal = (id: number) => { setDeleteId(id); setShowDeleteModal(true); };
  const handleDelete = async () => {
    if (deleteId == null) return;
    try { await api.delete(`/orders/${deleteId}`); await fetchData(); } catch { /* ignore */ }
    setShowDeleteModal(false); setDeleteId(null);
  };

  /* ---- Unique values for filters ---- */
  const uniquePayments = [...new Set(orders.map((o) => o.paymentType))];
  const uniqueStatuses = [...new Set(orders.map((o) => o.status))];

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold">Order List</h4>
            <h6>Manage your orders</h6>
          </div>
        </div>
        <ul className="table-top-head">
          <li><a href="#" data-bs-placement="top" title="Pdf" onClick={(e) => e.preventDefault()}><img src="/assets/img/icons/pdf.svg" alt="img" /></a></li>
          <li><a href="#" data-bs-placement="top" title="Excel" onClick={(e) => e.preventDefault()}><img src="/assets/img/icons/excel.svg" alt="img" /></a></li>
          <li><a href="#" data-bs-placement="top" title="Refresh" onClick={(e) => { e.preventDefault(); fetchData(); }}><i className="ti ti-refresh"></i></a></li>
          <li><a href="#" data-bs-placement="top" title="Collapse" onClick={(e) => e.preventDefault()}><i className="ti ti-chevron-up"></i></a></li>
        </ul>
        <div className="page-btn">
          <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); openAddModal(); }}>
            <i className="ti ti-circle-plus me-1"></i>Add Order
          </a>
        </div>
      </div>

      {/* Card */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="search-set">
            <div className="search-input">
              <span className="btn-searchset"><i className="ti ti-search fs-14 feather-search"></i></span>
              <input type="text" className="form-control" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
            {/* Payment Type filter */}
            <div className="dropdown me-2">
              <a href="#" className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown" onClick={(e) => e.preventDefault()}>
                {filterPayment || 'Payment Type'}
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterPayment(''); }}>All</a></li>
                {uniquePayments.map((p) => (
                  <li key={p}><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterPayment(p); }}>{p}</a></li>
                ))}
              </ul>
            </div>
            {/* Status filter */}
            <div className="dropdown me-2">
              <a href="#" className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown" onClick={(e) => e.preventDefault()}>
                {filterStatus || 'Status'}
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(''); }}>All</a></li>
                {uniqueStatuses.map((s) => (
                  <li key={s}><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setFilterStatus(s); }}>{s}</a></li>
                ))}
              </ul>
            </div>
            {/* Sort */}
            <div className="dropdown">
              <a href="#" className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown" onClick={(e) => e.preventDefault()}>
                Sort By : {sortBy === 'recent' ? 'Recently Added' : sortBy === 'asc' ? 'Amount Asc' : 'Amount Desc'}
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSortBy('recent'); }}>Recently Added</a></li>
                <li><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSortBy('asc'); }}>Amount Ascending</a></li>
                <li><a href="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSortBy('desc'); }}>Amount Descending</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <label className="checkboxs"><input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} /><span className="checkmarks"></span></label>
                    </th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Payment Type</th>
                    <th>Amount</th>
                    <th>Date &amp; Time</th>
                    <th>Status</th>
                    <th className="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <label className="checkboxs"><input type="checkbox" checked={selectedIds.has(o.id)} onChange={(e) => handleSelectOne(o.id, e.target.checked)} /><span className="checkmarks"></span></label>
                      </td>
                      <td>{o.orderNumber}</td>
                      <td>
                        <div className="userimgname">
                          <span className="avatar avatar-md me-2">
                            <img src={o.customerImage ? mediaUrl(o.customerImage) : '/assets/img/users/user-30.jpg'} alt="customer" />
                          </span>
                          <span>{o.customerName}</span>
                        </div>
                      </td>
                      <td>{o.paymentType}</td>
                      <td>${o.amount.toFixed(2)}</td>
                      <td>{o.orderDate}</td>
                      <td>
                        <span className={`${statusBadge(o.status)} fs-10 text-white p-1 rounded`}>
                          <i className="ti ti-point-filled me-1"></i>{o.status}
                        </span>
                      </td>
                      <td className="d-flex">
                        <div className="edit-delete-action d-flex align-items-center">
                          <a className="me-2 edit-icon d-flex align-items-center border rounded p-2" href="#" onClick={(e) => { e.preventDefault(); openViewModal(o); }}>
                            <i data-feather="eye" className="feather-eye"></i>
                          </a>
                          <a className="me-2 p-2 d-flex align-items-center border rounded" href="#" onClick={(e) => { e.preventDefault(); openEditModal(o); }}>
                            <i data-feather="edit" className="feather-edit"></i>
                          </a>
                          <a className="p-2 d-flex align-items-center border rounded" href="#" onClick={(e) => { e.preventDefault(); openDeleteModal(o.id); }}>
                            <i data-feather="trash-2" className="feather-trash-2"></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ====== Add / Edit Order Modal ====== */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <div className="page-title"><h4>{editingId ? 'Edit Order' : 'Add Order'}</h4></div>
                <button type="button" className="close" onClick={() => { setShowModal(false); resetModal(); }} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Customer search */}
                  <div className="col-lg-6">
                    <div className="mb-3" ref={customerSearchRef as React.RefObject<HTMLDivElement>}>
                      <label className="form-label">Customer<span className="text-danger ms-1">*</span></label>
                      <div className="position-relative">
                        <input type="text" className="form-control" placeholder="Search Customer" value={customerSearchTerm}
                          onChange={(e) => { setCustomerSearchTerm(e.target.value); setShowCustomerDropdown(true); }}
                          onFocus={() => setShowCustomerDropdown(true)} />
                      </div>
                      {showCustomerDropdown && searchCustomers(customerSearchTerm).length > 0 && (
                        <div className="dropdown-menu w-100 h-auto rounded-1 mt-1 show" style={{ display: 'block', position: 'absolute', zIndex: 1050 }}>
                          <ul className="list-unstyled mb-0 p-2">
                            {searchCustomers(customerSearchTerm).map((c) => (
                              <li key={c.id} className="fs-14 mb-1 px-2 py-1 rounded" style={{ cursor: 'pointer' }}
                                onMouseDown={() => {
                                  setForm((p) => ({ ...p, customerId: c.id, customerName: c.name }));
                                  setCustomerSearchTerm(c.name);
                                  setShowCustomerDropdown(false);
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                {c.name} {c.phone ? `(${c.phone})` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Payment type */}
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Payment Type<span className="text-danger ms-1">*</span></label>
                      <select className="form-select" value={form.paymentType} onChange={(e) => setForm((p) => ({ ...p, paymentType: e.target.value }))}>
                        <option value="">Select</option>
                        {PAYMENT_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Status<span className="text-danger ms-1">*</span></label>
                      <select className="form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Product search */}
                  <div className="col-lg-6">
                    <div className="search-form mb-3" ref={productSearchRef as React.RefObject<HTMLDivElement>}>
                      <label className="form-label">Add Product<span className="text-danger ms-1">*</span></label>
                      <div className="position-relative">
                        <input type="text" className="form-control" placeholder="Search Product" value={productSearchTerm}
                          onChange={(e) => { setProductSearchTerm(e.target.value); setShowProductDropdown(true); }}
                          onFocus={() => setShowProductDropdown(true)} />
                        <i data-feather="search" className="feather-search"></i>
                      </div>
                      {showProductDropdown && searchProducts(productSearchTerm).length > 0 && (
                        <div className="dropdown-menu w-100 h-auto rounded-1 mt-1 show" style={{ display: 'block', position: 'absolute', zIndex: 1050 }}>
                          <ul className="list-unstyled mb-0 p-2">
                            {searchProducts(productSearchTerm).map((p) => (
                              <li key={p.id} className="fs-14 mb-1 px-2 py-1 rounded" style={{ cursor: 'pointer' }}
                                onMouseDown={() => { handleProductSelect(p); setShowProductDropdown(false); }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                {p.productName} {p.sku ? `(${p.sku})` : ''} — ${p.price?.toFixed(2) || '0.00'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Items table */}
                  {items.length > 0 && (
                    <div className="col-lg-12 mb-3">
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.productId}>
                                <td>{item.productName}</td>
                                <td>
                                  <input type="number" className="form-control form-control-sm" style={{ width: 90 }} value={item.price} min={0} step="0.01"
                                    onChange={(e) => setItems((prev) => prev.map((i) => i.productId === item.productId ? { ...i, price: parseFloat(e.target.value) || 0 } : i))} />
                                </td>
                                <td>
                                  <div className="product-quantity bg-gray-transparent border-0">
                                    <span className="quantity-btn" style={{ cursor: 'pointer' }} onClick={() => setItems((prev) => prev.map((i) => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}>
                                      <i data-feather="minus-circle" className="feather-search"></i>
                                    </span>
                                    <input type="text" className="quntity-input bg-transparent" value={item.quantity}
                                      onChange={(e) => setItems((prev) => prev.map((i) => i.productId === item.productId ? { ...i, quantity: Math.max(1, parseInt(e.target.value) || 1) } : i))} />
                                    <span className="quantity-btn" style={{ cursor: 'pointer' }} onClick={() => setItems((prev) => prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))}>
                                      <i data-feather="plus-circle" className="plus-circle"></i>
                                    </span>
                                  </div>
                                </td>
                                <td>${(item.price * item.quantity).toFixed(2)}</td>
                                <td>
                                  <a className="p-2 border rounded d-flex align-items-center" href="#" onClick={(e) => { e.preventDefault(); setItems((prev) => prev.filter((i) => i.productId !== item.productId)); }}>
                                    <i data-feather="trash-2" className="feather-trash-2"></i>
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr><td colSpan={3} className="text-end fw-bold">Total:</td><td className="fw-bold">${calcAmount().toFixed(2)}</td><td></td></tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary me-2" onClick={() => { setShowModal(false); resetModal(); }}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Order'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== View Order Modal ====== */}
      {showViewModal && viewOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div className="page-title"><h4>Order #{viewOrder.orderNumber}</h4></div>
                <button type="button" className="close" onClick={() => setShowViewModal(false)} aria-label="Close"><span aria-hidden="true">&times;</span></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-4"><strong>Customer:</strong> {viewOrder.customerName}</div>
                  <div className="col-md-4"><strong>Payment:</strong> {viewOrder.paymentType}</div>
                  <div className="col-md-4"><strong>Status:</strong> <span className={`${statusBadge(viewOrder.status)} fs-10 text-white p-1 rounded`}><i className="ti ti-point-filled me-1"></i>{viewOrder.status}</span></div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-4"><strong>Date:</strong> {viewOrder.orderDate}</div>
                  <div className="col-md-4"><strong>Total:</strong> ${viewOrder.amount.toFixed(2)}</div>
                </div>
                {viewOrder.items.length > 0 && (
                  <div className="table-responsive">
                    <table className="table">
                      <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {viewOrder.items.map((i) => (
                          <tr key={i.id}><td>{i.productName}</td><td>${i.price.toFixed(2)}</td><td>{i.quantity}</td><td>${(i.price * i.quantity).toFixed(2)}</td></tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr><td colSpan={3} className="text-end fw-bold">Total:</td><td className="fw-bold">${viewOrder.amount.toFixed(2)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Delete Modal ====== */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body p-0">
                <div className="success-wrap text-center p-5">
                  <div className="icon-success bg-danger-transparent text-danger mb-2"><i className="ti ti-trash"></i></div>
                  <h3 className="mb-2">Delete Order</h3>
                  <p className="fs-16 mb-3">Are you sure you want to delete order from order list?</p>
                  <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                    <button type="button" className="btn btn-md btn-secondary" onClick={() => setShowDeleteModal(false)}>No, Cancel</button>
                    <button type="button" className="btn btn-md btn-primary" onClick={handleDelete}>Yes, Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;

