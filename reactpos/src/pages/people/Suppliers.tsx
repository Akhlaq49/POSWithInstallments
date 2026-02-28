import React, { useState } from 'react';
import { createParty, updateParty, deleteParty, Party, CreatePartyPayload } from '../../services/partyService';
import { showSuccess, showError } from '../../utils/alertUtils';
import { useServerPagination } from '../../hooks/useServerPagination';
import ServerPagination from '../../components/ServerPagination';

const ROLE = 'Supplier';

const Suppliers: React.FC = () => {
  const {
    data: items,
    loading,
    search: searchTerm,
    setSearch: setSearchTerm,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    refresh,
  } = useServerPagination<Party>({ endpoint: '/parties', defaultPageSize: 10, extraParams: { role: ROLE } });

  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const emptyForm: CreatePartyPayload = { fullName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', country: '', postalCode: '', code: '', role: ROLE, status: 'active', isActive: true };
  const [form, setForm] = useState<CreatePartyPayload>({ ...emptyForm });

  const handleSelectAll = (checked: boolean) => { setSelectAll(checked); setSelectedIds(checked ? new Set(items.map(i => i.id)) : new Set()); };
  const handleSelectOne = (id: number, checked: boolean) => { const next = new Set(selectedIds); if (checked) next.add(id); else next.delete(id); setSelectedIds(next); setSelectAll(next.size === items.length); };

  const openAddModal = () => { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); };
  const openEditModal = (p: Party) => {
    setEditingId(p.id);
    setForm({ fullName: p.fullName, lastName: p.lastName || '', email: p.email || '', phone: p.phone || '', address: p.address || '', city: p.city || '', state: p.state || '', country: p.country || '', postalCode: p.postalCode || '', code: p.code || '', role: ROLE, status: p.status, isActive: p.isActive });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.fullName) { showError('First Name is required'); return; }
    try { if (editingId) await updateParty(editingId, form); else await createParty(form); setShowModal(false); showSuccess(editingId ? 'Supplier updated' : 'Supplier created'); refresh(); }
    catch { showError('Failed to save supplier'); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try { await deleteParty(deleteId); setShowDeleteModal(false); setDeleteId(null); showSuccess('Supplier deleted'); refresh(); }
    catch { showError('Failed to delete'); }
  };

  const statusBadge = (s: string) => s === 'active' ? 'badge-success' : 'badge-danger';

  return (
    <>
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title"><h4>Suppliers</h4><h6>Manage your suppliers</h6></div>
        </div>
        <div className="page-btn">
          <a href="#" className="btn btn-primary" onClick={e => { e.preventDefault(); openAddModal(); }}><i className="ti ti-circle-plus me-1"></i>Add Supplier</a>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="search-set">
            <div className="search-input">
              <a href="#" className="btn btn-searchset"><i className="ti ti-search fs-14"></i></a>
              <input type="text" className="form-control" placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div> : (
            <div className="table-responsive">
              <table className="table datanew">
                <thead>
                  <tr>
                    <th className="no-sort"><label className="checkboxs"><input type="checkbox" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)} /><span className="checkmarks"></span></label></th>
                    <th>Code</th><th>Supplier</th><th>Email</th><th>Phone</th><th>Country</th><th>Status</th><th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? <tr><td colSpan={8} className="text-center py-4">No suppliers found</td></tr> : items.map(p => (
                    <tr key={p.id}>
                      <td><label className="checkboxs"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={e => handleSelectOne(p.id, e.target.checked)} /><span className="checkmarks"></span></label></td>
                      <td>{p.code}</td>
                      <td><div className="d-flex align-items-center"><a href="#" className="avatar avatar-md me-2"><img src={p.picture || '/assets/img/users/user-01.jpg'} alt="" /></a><a href="#">{p.fullName}{p.lastName ? ` ${p.lastName}` : ''}</a></div></td>
                      <td>{p.email}</td><td>{p.phone}</td><td>{p.country}</td>
                      <td><span className={`badge ${statusBadge(p.status)} d-inline-flex align-items-center badge-xs`}><i className="ti ti-point-filled me-1"></i>{p.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                      <td className="text-center">
                        <a className="action-set" href="#" data-bs-toggle="dropdown" aria-expanded="false"><i className="fa fa-ellipsis-v" aria-hidden="true"></i></a>
                        <ul className="dropdown-menu">
                          <li><a className="dropdown-item" href="#" onClick={e => { e.preventDefault(); openEditModal(p); }}><i data-feather="edit" className="info-img"></i>Edit</a></li>
                          <li><a className="dropdown-item mb-0" href="#" onClick={e => { e.preventDefault(); setDeleteId(p.id); setShowDeleteModal(true); }}><i data-feather="trash-2" className="info-img"></i>Delete</a></li>
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <ServerPagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h4>
                <button type="button" className="close" onClick={() => setShowModal(false)}><span>&times;</span></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6"><div className="mb-3"><label className="form-label">First Name<span className="text-danger ms-1">*</span></label><input type="text" className="form-control" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div></div>
                  <div className="col-lg-6"><div className="mb-3"><label className="form-label">Last Name</label><input type="text" className="form-control" value={form.lastName || ''} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div></div>
                  <div className="col-lg-12"><div className="mb-3"><label className="form-label">Email<span className="text-danger ms-1">*</span></label><input type="email" className="form-control" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div></div>
                  <div className="col-lg-12"><div className="mb-3"><label className="form-label">Phone<span className="text-danger ms-1">*</span></label><input type="text" className="form-control" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div></div>
                  <div className="col-lg-12"><div className="mb-3"><label className="form-label">Address</label><input type="text" className="form-control" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div></div>
                  <div className="col-lg-6"><div className="mb-3"><label className="form-label">City</label><input type="text" className="form-control" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} /></div></div>
                  <div className="col-lg-6"><div className="mb-3"><label className="form-label">State</label><input type="text" className="form-control" value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} /></div></div>
                  <div className="col-lg-6"><div className="mb-3"><label className="form-label">Country</label><input type="text" className="form-control" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} /></div></div>
                  <div className="col-lg-6"><div className="mb-3"><label className="form-label">Postal Code</label><input type="text" className="form-control" value={form.postalCode || ''} onChange={e => setForm({ ...form, postalCode: e.target.value })} /></div></div>
                  <div className="col-md-12"><div className="mb-3 d-flex align-items-center"><label className="form-label me-3 mb-0">Status</label><div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked, status: e.target.checked ? 'active' : 'inactive' })} /></div></div></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn me-2 btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>{editingId ? 'Save Changes' : 'Submit'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-5">
              <div className="modal-body text-center p-0">
                <div className="mb-3"><i className="ti ti-trash-x fs-36 text-danger"></i></div>
                <h4>Delete Supplier</h4>
                <p className="text-muted">Are you sure you want to delete this supplier?</p>
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Suppliers;

