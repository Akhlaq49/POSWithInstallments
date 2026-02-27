import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { 
  getPurchases, 
  createPurchase, 
  updatePurchase, 
  deletePurchase,
  Purchase,
  PurchaseItem
} from '../../services/purchaseService';
import { getProducts, ProductResponse } from '../../services/productService';
import { showConfirm, showSuccess, showError } from '../../utils/alertUtils';

const PurchaseList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const editorRef = useRef<any>(null);

  // Products from database for dropdown
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierRef: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Received',
    orderTax: 0,
    discount: 0,
    shipping: 0,
    total: 0,
    paid: 0,
    notes: '',
  });

  const [lineItems, setLineItems] = useState<PurchaseItem[]>([]);
  const [newItem, setNewItem] = useState<{
    productId?: number;
    productName: string;
    quantity: number;
    purchasePrice: number;
    discount: number;
    taxPercentage: number;
    taxAmount: number;
    unitCost: number;
    totalCost: number;
  }>({
    productName: '',
    quantity: 1,
    purchasePrice: 0,
    discount: 0,
    taxPercentage: 0,
    taxAmount: 0,
    unitCost: 0,
    totalCost: 0,
  });

  const suppliers = ['Apex Computers', 'Dazzle Shoes', 'Best Accessories', 'Global Traders'];
  const statuses = ['Received', 'Pending', 'Ordered', 'Cancelled'];

  // Fetch purchases and products on mount
  useEffect(() => {
    loadPurchases();
    loadProducts();
  }, []);

  // Filter purchases when search or status filter changes
  useEffect(() => {
    applyFilters();
  }, [purchases, searchQuery, paymentStatusFilter]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const data = await getPurchases();
      setPurchases(data);
    } catch (error) {
      showError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  // Filtered products for search dropdown
  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const applyFilters = () => {
    let filtered = purchases;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.reference.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (paymentStatusFilter) {
      filtered = filtered.filter((p) => p.paymentStatus === paymentStatusFilter);
    }

    setFilteredPurchases(filtered);
  };

  const handleAddPurchase = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setFormData({
      supplierName: purchase.supplierName,
      supplierRef: purchase.supplierRef || '',
      reference: purchase.reference,
      date: purchase.date.toString().split('T')[0],
      status: purchase.status,
      orderTax: purchase.orderTax,
      discount: purchase.discount,
      shipping: purchase.shipping,
      total: purchase.total,
      paid: purchase.paid,
      notes: purchase.notes || '',
    });
    setLineItems(purchase.items || []);
    setShowEditModal(true);
  };

  const handleDeletePurchase = async (id: number) => {
    const confirmed = await showConfirm(
      'Delete Purchase',
      'Are you sure you want to delete this purchase?',
      'Delete',
      'Cancel'
    );

    if (confirmed.isConfirmed) {
      try {
        await deletePurchase(id);
        showSuccess('Purchase deleted successfully');
        loadPurchases();
      } catch (error) {
        showError('Failed to delete purchase');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      supplierRef: '',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Received',
      orderTax: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      paid: 0,
      notes: '',
    });
    setLineItems([]);
    setNewItem({
      productName: '',
      quantity: 1,
      purchasePrice: 0,
      discount: 0,
      taxPercentage: 0,
      taxAmount: 0,
      unitCost: 0,
      totalCost: 0,
    });
    setProductSearch('');
    setShowProductDropdown(false);
    setSelectedPurchase(null);
  };

  const addLineItem = () => {
    if (!newItem.productName) {
      showError('Please select a product');
      return;
    }

    // Calculate tax amount
    const taxAmount = (newItem.purchasePrice * newItem.taxPercentage) / 100;
    const unitCost = newItem.purchasePrice + (newItem.purchasePrice * newItem.taxPercentage) / 100 - newItem.discount;
    const totalCost = unitCost * newItem.quantity;

    const item: PurchaseItem = {
      ...newItem,
      taxAmount,
      unitCost,
      totalCost,
    };

    setLineItems([...lineItems, item]);
    setNewItem({
      productName: '',
      quantity: 1,
      purchasePrice: 0,
      discount: 0,
      taxPercentage: 0,
      taxAmount: 0,
      unitCost: 0,
      totalCost: 0,
    });
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const itemsTotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
    const total = itemsTotal + formData.orderTax + formData.shipping - formData.discount;
    setFormData({ ...formData, total: Math.max(0, total) });
  };

  useEffect(() => {
    calculateTotal();
  }, [lineItems, formData.orderTax, formData.discount, formData.shipping]);

  const selectProduct = (product: ProductResponse) => {
    setNewItem({
      ...newItem,
      productId: parseInt(product.id),
      productName: product.productName,
      purchasePrice: product.price,
      quantity: 1,
    });
    setProductSearch(product.productName);
    setShowProductDropdown(false);
  };

  const handleSavePurchase = async () => {
    if (!formData.supplierName || !formData.reference) {
      showError('Please fill in supplier name and reference');
      return;
    }

    try {
      const payload = {
        ...formData,
        items: lineItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          discount: item.discount,
          taxPercentage: item.taxPercentage,
          taxAmount: item.taxAmount,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
        })),
      };

      if (selectedPurchase) {
        await updatePurchase(selectedPurchase.id, payload);
        showSuccess('Purchase updated successfully');
      } else {
        await createPurchase(payload);
        showSuccess('Purchase created successfully');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      loadPurchases();
    } catch (error) {
      showError('Failed to save purchase');
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="badge bg-success">Paid</span>;
      case 'Unpaid':
        return <span className="badge bg-danger">Unpaid</span>;
      case 'Partial':
        return <span className="badge bg-warning">Partial</span>;
      case 'Overdue':
        return <span className="badge bg-info">Overdue</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  if (loading && purchases.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <PageHeader title="Purchases" breadcrumbs={[{ title: 'Purchases', path: '/purchases' }]} />
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader title="Purchases" breadcrumbs={[{ title: 'Purchases', path: '/purchases' }]} />

        <div className="row mb-3">
          <div className="col-lg-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by supplier or reference"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="col-lg-3">
            <select
              className="form-control"
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="col-lg-3 text-end">
            <button className="btn btn-primary" onClick={handleAddPurchase}>
              <i className="ti ti-plus me-2"></i>Add Purchase
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.length > 0 ? (
                    paginatedPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{purchase.supplierName}</td>
                        <td>{purchase.reference}</td>
                        <td>{new Date(purchase.date).toLocaleDateString()}</td>
                        <td>{purchase.status}</td>
                        <td>${purchase.total.toFixed(2)}</td>
                        <td>${purchase.paid.toFixed(2)}</td>
                        <td>${(purchase.total - purchase.paid).toFixed(2)}</td>
                        <td>{getPaymentStatusBadge(purchase.paymentStatus)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEditPurchase(purchase)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeletePurchase(purchase.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center">
                        No purchases found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredPurchases.length > itemsPerPage && (
              <nav aria-label="Page navigation" className="mt-3">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>

        {/* Add Purchase Modal */}
        {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Purchase</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Supplier Name <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={formData.supplierName}
                        onChange={(e) =>
                          setFormData({ ...formData, supplierName: e.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {suppliers.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Reference <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.reference}
                        onChange={(e) =>
                          setFormData({ ...formData, reference: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3 position-relative">
                      <label className="form-label">
                        Product <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Product by name or SKU..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                      />
                      {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                        <div className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 1050 }}>
                          {filteredProducts.slice(0, 10).map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="dropdown-item d-flex justify-content-between align-items-center"
                              onClick={() => selectProduct(product)}
                            >
                              <span>{product.productName}</span>
                              <small className="text-muted">
                                {product.sku ? `SKU: ${product.sku}` : ''} | Stock: {product.quantity} | ${product.price}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                      {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                        <div className="dropdown-menu show w-100" style={{ position: 'absolute', zIndex: 1050 }}>
                          <span className="dropdown-item text-muted">No products found</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Qty"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Price($)"
                      value={newItem.purchasePrice}
                      onChange={(e) =>
                        setNewItem({ ...newItem, purchasePrice: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Discount($)"
                      value={newItem.discount}
                      onChange={(e) =>
                        setNewItem({ ...newItem, discount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Tax(%)"
                      value={newItem.taxPercentage}
                      onChange={(e) =>
                        setNewItem({ ...newItem, taxPercentage: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-4">
                    <button className="btn btn-primary w-100" onClick={addLineItem}>
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price($)</th>
                        <th>Discount($)</th>
                        <th>Tax(%)</th>
                        <th>Tax Amt($)</th>
                        <th>Unit Cost($)</th>
                        <th>Total($)</th>
                        <th>Act</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>${item.purchasePrice.toFixed(2)}</td>
                          <td>${item.discount.toFixed(2)}</td>
                          <td>{item.taxPercentage}%</td>
                          <td>${item.taxAmount.toFixed(2)}</td>
                          <td>${item.unitCost.toFixed(2)}</td>
                          <td>${item.totalCost.toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeLineItem(index)}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-3">
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Order Tax</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.orderTax}
                        onChange={(e) =>
                          setFormData({ ...formData, orderTax: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Discount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Shipping</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.shipping}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add purchase notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  ></textarea>
                  <small className="form-text text-muted">Maximum 500 characters</small>
                </div>

                <div className="alert alert-info">
                  <strong>Total Amount:</strong> ${formData.total.toFixed(2)}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSavePurchase}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Edit Purchase Modal */}
        {showEditModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Purchase</h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Supplier Name <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={formData.supplierName}
                        onChange={(e) =>
                          setFormData({ ...formData, supplierName: e.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {suppliers.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Reference <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.reference}
                        onChange={(e) =>
                          setFormData({ ...formData, reference: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-lg-12">
                    <div className="mb-3 position-relative">
                      <label className="form-label">
                        Product <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Product by name or SKU..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                      />
                      {showProductDropdown && productSearch && filteredProducts.length > 0 && (
                        <div className="dropdown-menu show w-100" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 1050 }}>
                          {filteredProducts.slice(0, 10).map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              className="dropdown-item d-flex justify-content-between align-items-center"
                              onClick={() => selectProduct(product)}
                            >
                              <span>{product.productName}</span>
                              <small className="text-muted">
                                {product.sku ? `SKU: ${product.sku}` : ''} | Stock: {product.quantity} | ${product.price}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                      {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                        <div className="dropdown-menu show w-100" style={{ position: 'absolute', zIndex: 1050 }}>
                          <span className="dropdown-item text-muted">No products found</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Qty"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Price($)"
                      value={newItem.purchasePrice}
                      onChange={(e) =>
                        setNewItem({ ...newItem, purchasePrice: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Discount($)"
                      value={newItem.discount}
                      onChange={(e) =>
                        setNewItem({ ...newItem, discount: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Tax(%)"
                      value={newItem.taxPercentage}
                      onChange={(e) =>
                        setNewItem({ ...newItem, taxPercentage: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-lg-4">
                    <button className="btn btn-primary w-100" onClick={addLineItem}>
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price($)</th>
                        <th>Discount($)</th>
                        <th>Tax(%)</th>
                        <th>Tax Amt($)</th>
                        <th>Unit Cost($)</th>
                        <th>Total($)</th>
                        <th>Act</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.quantity}</td>
                          <td>${item.purchasePrice.toFixed(2)}</td>
                          <td>${item.discount.toFixed(2)}</td>
                          <td>{item.taxPercentage}%</td>
                          <td>${item.taxAmount.toFixed(2)}</td>
                          <td>${item.unitCost.toFixed(2)}</td>
                          <td>${item.totalCost.toFixed(2)}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeLineItem(index)}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-3">
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Order Tax</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.orderTax}
                        onChange={(e) =>
                          setFormData({ ...formData, orderTax: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Discount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Shipping</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.shipping}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add purchase notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  ></textarea>
                  <small className="form-text text-muted">Maximum 500 characters</small>
                </div>

                <div className="alert alert-info">
                  <strong>Total Amount:</strong> ${formData.total.toFixed(2)}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSavePurchase}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseList;
