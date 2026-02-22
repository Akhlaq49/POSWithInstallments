import React from 'react';
import PageHeader from '../../components/common/PageHeader';

const customers = [
  { code: 'CU001', name: 'Carl Evans', avatar: 'avatar-01.jpg', email: 'carlevans@example.com', phone: '+12163547758', country: 'Germany', status: 'Active' },
  { code: 'CU002', name: 'Minerva Rameriz', avatar: 'avatar-02.jpg', email: 'rameriz@example.com', phone: '+11367529510', country: 'Japan', status: 'Active' },
  { code: 'CU003', name: 'Robert Lamon', avatar: 'avatar-03.jpg', email: 'robert@example.com', phone: '+15362789414', country: 'USA', status: 'Active' },
  { code: 'CU004', name: 'Patricia Lewis', avatar: 'avatar-04.jpg', email: 'patricia@example.com', phone: '+18513094627', country: 'Austria', status: 'Active' },
  { code: 'CU005', name: 'Mark Joslyn', avatar: 'avatar-05.jpg', email: 'markjoslyn@example.com', phone: '+14678219025', country: 'Turkey', status: 'Active' },
  { code: 'CU006', name: 'Marsha Betts', avatar: 'avatar-06.jpg', email: 'marshabetts@example.com', phone: '+10913278319', country: 'Mexico', status: 'Active' },
  { code: 'CU007', name: 'Daniel Jude', avatar: 'avatar-07.jpg', email: 'danieljude@example.com', phone: '+19125852947', country: 'France', status: 'Active' },
  { code: 'CU008', name: 'Emma Bates', avatar: 'avatar-08.jpg', email: 'emmabates@example.com', phone: '+13671835209', country: 'Greece', status: 'Active' },
  { code: 'CU009', name: 'Richard Fralick', avatar: 'avatar-09.jpg', email: 'richard@example.com', phone: '+19756194733', country: 'Italy', status: 'Active' },
  { code: 'CU010', name: 'Michelle Robison', avatar: 'avatar-10.jpg', email: 'robinson@example.com', phone: '+19167850925', country: 'China', status: 'Active' },
];

const Customers: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Customers"
        breadcrumbs={[{ title: 'Peoples' }, { title: 'Customers' }]}
        actions={
          <a href="#" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-customer">
            <i className="ti ti-circle-plus me-1"></i>Add Customer
          </a>
        }
      />

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="search-set">
            <div className="search-input">
              <a href="#" className="btn btn-searchset"><i className="ti ti-search fs-14"></i></a>
              <input type="text" className="form-control" placeholder="Search" />
            </div>
          </div>
          <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
            <div className="dropdown">
              <a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                Status
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1">Active</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Inactive</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table datatable">
              <thead className="thead-light">
                <tr>
                  <th className="no-sort">
                    <label className="checkboxs"><input type="checkbox" /><span className="checkmarks"></span></label>
                  </th>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th className="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <label className="checkboxs"><input type="checkbox" /><span className="checkmarks"></span></label>
                    </td>
                    <td>{c.code}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="avatar avatar-md me-2">
                          <img src={`/assets/img/profiles/${c.avatar}`} alt={c.name} className="rounded-circle" />
                        </span>
                        {c.name}
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{c.country}</td>
                    <td><span className="badge badge-xs bg-success-light text-success">{c.status}</span></td>
                    <td className="action-table-data">
                      <div className="edit-delete-action d-flex align-items-center gap-2">
                        <a href="#" className="btn btn-icon btn-sm"><i className="ti ti-eye text-blue"></i></a>
                        <a href="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-bs-target="#edit-customer">
                          <i className="ti ti-edit text-blue"></i>
                        </a>
                        <a href="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-bs-target="#delete-modal">
                          <i className="ti ti-trash text-danger"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      <div className="modal fade" id="add-customer" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Customer</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="row">
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">First Name</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="col-lg-6 mb-3">
                    <label className="form-label">Country</label>
                    <select className="form-select">
                      <option>Choose</option>
                      <option>Germany</option>
                      <option>USA</option>
                      <option>Japan</option>
                    </select>
                  </div>
                  <div className="col-lg-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3}></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Customers;
