import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { getPurchases, Purchase, createPurchase, updatePurchase, deletePurchase, CreatePurchasePayload, UpdatePurchasePayload } from '../../services/purchaseService';
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
  const [selectedPurchases, setSelectedPurchases] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    supplierName: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Received',
    total: 0,
    paid: 0,
    notes: '',
  });

  // Fetch purchases on mount
  useEffect(() => {
    loadPurchases();
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

  const applyFilters = () => {
    let filtered = purchases;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.supplierName.toLowerCase().includes(query) ||
          p.reference.toLowerCase().includes(query)
      );
    }

    // Filter by payment status
    if (paymentStatusFilter) {
      filtered = filtered.filter((p) => p.paymentStatus === paymentStatusFilter);
    }

    setFilteredPurchases(filtered);
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: CreatePurchasePayload = {
        ...formData,
        total: parseFloat(formData.total.toString()),
        paid: parseFloat(formData.paid.toString()),
      };

      const result = await createPurchase(payload);
      if (result) {
        showSuccess('Purchase added successfully');
        setShowAddModal(false);
        resetForm();
        loadPurchases();
      } else {
        showError('Failed to add purchase');
      }
    } catch (error) {
      showError('Error adding purchase');
    }
  };

  const handleEditPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPurchase) return;

    try {
      const payload: UpdatePurchasePayload = {
        id: selectedPurchase.id,
        ...formData,
        total: parseFloat(formData.total.toString()),
        paid: parseFloat(formData.paid.toString()),
      };

      const result = await updatePurchase(payload);
      if (result) {
        showSuccess('Purchase updated successfully');
        setShowEditModal(false);
        resetForm();
        loadPurchases();
      } else {
        showError('Failed to update purchase');
      }
    } catch (error) {
      showError('Error updating purchase');
    }
  };

  const handleDeletePurchase = async (id: string) => {
    const result = await showConfirm(
      'Delete Purchase',
      'Are you sure you want to delete this purchase?',
      'Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      const success = await deletePurchase(id);
      if (success) {
        showSuccess('Purchase deleted successfully');
        loadPurchases();
      } else {
        showError('Failed to delete purchase');
      }
    }
  };

  const openEditModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setFormData({
      supplierName: purchase.supplierName,
      reference: purchase.reference,
      date: purchase.date,
      status: purchase.status,
      total: purchase.total,
      paid: purchase.paid,
      notes: purchase.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Received',
      total: 0,
      paid: 0,
      notes: '',
    });
    setSelectedPurchase(null);
  };

  const toggleSelectAll = () => {
    if (selectedPurchases.size === filteredPurchases.length) {
      setSelectedPurchases(new Set());
    } else {
      setSelectedPurchases(new Set(filteredPurchases.map((p) => p.id)));
    }
  };

  const togglePurchaseSelect = (id: string) => {
    const newSelected = new Set(selectedPurchases);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPurchases(newSelected);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'text-success bg-success-transparent';
      case 'Unpaid':
        return 'text-danger bg-danger-transparent';
      case 'Overdue':
        return 'text-warning bg-warning-transparent';
      case 'Partial':
        return 'text-info bg-info-transparent';
      default:
        return 'text-secondary bg-secondary-transparent';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Received':
        return 'badges status-badge fs-10 p-1 px-2 rounded-1';
      case 'Pending':
        return 'badges status-badge badge-pending fs-10 p-1 px-2 rounded-1';
      case 'Ordered':
        return 'badges status-badge bg-warning fs-10 p-1 px-2 rounded-1';
      default:
        return 'badges status-badge fs-10 p-1 px-2 rounded-1';
    }
  };

  const calculateDue = (total: number, paid: number) => {
    return Math.max(0, total - paid);
  };

  return (
    <>
      <PageHeader
        title="Purchase"
        breadcrumbs={[{ title: 'Purchases', href: '/purchase-list' }]}
      />

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="page-title">
            <h6 className="fw-bold mb-0">Manage Purchases</h6>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="btn btn-primary"
            >
              <i className="ti ti-circle-plus me-1"></i> Add Purchase
            </button>
          </div>
        </div>

        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="search-set">
            <div className="search-input">
              <span className="btn-searchset">
                <i className="ti ti-search fs-14"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by supplier or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="dropdown">
            <button
              className="btn btn-white btn-md d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              Payment Status
            </button>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li>
                <button
                  className={`dropdown-item rounded-1 ${!paymentStatusFilter ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('')}
                >
                  All
                </button>
              </li>
              <li>
                <button
                  className={`dropdown-item rounded-1 ${paymentStatusFilter === 'Paid' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('Paid')}
                >
                  Paid
                </button>
              </li>
              <li>
                <button
                  className={`dropdown-item rounded-1 ${paymentStatusFilter === 'Unpaid' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('Unpaid')}
                >
                  Unpaid
                </button>
              </li>
              <li>
                <button
                  className={`dropdown-item rounded-1 ${paymentStatusFilter === 'Overdue' ? 'active' : ''}`}
                  onClick={() => setPaymentStatusFilter('Overdue')}
                >
                  Overdue
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center p-5">
              <p className="text-muted">No purchases found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th className="no-sort">
                      <label className="checkboxs">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectedPurchases.size === filteredPurchases.length && filteredPurchases.length > 0}
                          onChange={toggleSelectAll}
                        />
                        <span className="checkmarks"></span>
                      </label>
                    </th>
                    <th>Supplier Name</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Payment Status</th>
                    <th className="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>
                        <label className="checkboxs">
                          <input
                            type="checkbox"
                            checked={selectedPurchases.has(purchase.id)}
                            onChange={() => togglePurchaseSelect(purchase.id)}
                          />
                          <span className="checkmarks"></span>
                        </label>
                      </td>
                      <td>{purchase.supplierName}</td>
                      <td>{purchase.reference}</td>
                      <td>{new Date(purchase.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td>
                        <span className={getStatusBadge(purchase.status)}>
                          {purchase.status}
                        </span>
                      </td>
                      <td>${purchase.total.toFixed(2)}</td>
                      <td>${purchase.paid.toFixed(2)}</td>
                      <td>${calculateDue(purchase.total, purchase.paid).toFixed(2)}</td>
                      <td>
                        <span className={`p-1 pe-2 rounded-1 fs-10 ${getPaymentStatusBadge(purchase.paymentStatus)}`}>
                          <i className="ti ti-point-filled me-1 fs-11"></i>
                          {purchase.paymentStatus}
                        </span>
                      </td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <button
                            className="me-2 p-2 btn btn-sm btn-light"
                            onClick={() => openEditModal(purchase)}
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className="p-2 btn btn-sm btn-light"
                            onClick={() => handleDeletePurchase(purchase.id)}
                          >
                            <i className="ti ti-trash-2"></i>
                          </button>
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

      {/* Add Purchase Modal */}
      <div
        className={`modal fade ${showAddModal ? 'show' : ''}`}
        style={{ display: showAddModal ? 'block' : 'none' }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Purchase</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAddModal(false)}
              ></button>
            </div>
            <form onSubmit={handleAddPurchase}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Total Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Paid Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.paid}
                    onChange={(e) => setFormData({ ...formData, paid: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Purchase Modal */}
      <div
        className={`modal fade ${showEditModal ? 'show' : ''}`}
        style={{ display: showEditModal ? 'block' : 'none' }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Purchase</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <form onSubmit={handleEditPurchase}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Total Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Paid Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.paid}
                    onChange={(e) => setFormData({ ...formData, paid: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop for modals */}
      {(showAddModal || showEditModal) && (
        <div
          className="modal-backdrop fade show"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
        ></div>
      )}
    </>
  );
};

export default PurchaseList;
