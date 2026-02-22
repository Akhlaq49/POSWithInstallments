import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <>
      {/* Welcome Banner */}
      <div className="welcome-wrap mb-4">
        <h2 className="mb-1 text-white">Welcome Back, Adrian</h2>
        <p className="text-light">14 New Companies Subscribed Today !!!</p>
        <Link to="/companies" className="btn btn-dark btn-md me-2 mb-2">Companies</Link>
        <Link to="/packages" className="btn btn-light btn-md mb-2">All Packages</Link>
      </div>

      {/* KPI Cards */}
      <div className="row">
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card dash-widget w-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="mb-2">Total Companies</p>
                <h2 className="mb-0">5,468</h2>
              </div>
              <div className="dash-widget-icon bg-primary-light">
                <i className="ti ti-building fs-24"></i>
              </div>
            </div>
            <div className="card-footer">
              <p className="mb-0"><span className="text-success"><i className="ti ti-arrow-up me-1"></i>2.5%</span> vs last month</p>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card dash-widget w-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="mb-2">Active Companies</p>
                <h2 className="mb-0">4,598</h2>
              </div>
              <div className="dash-widget-icon bg-success-light">
                <i className="ti ti-building-community fs-24"></i>
              </div>
            </div>
            <div className="card-footer">
              <p className="mb-0"><span className="text-success"><i className="ti ti-arrow-up me-1"></i>3.2%</span> vs last month</p>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card dash-widget w-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="mb-2">Total Subscribers</p>
                <h2 className="mb-0">3,698</h2>
              </div>
              <div className="dash-widget-icon bg-warning-light">
                <i className="ti ti-users-group fs-24"></i>
              </div>
            </div>
            <div className="card-footer">
              <p className="mb-0"><span className="text-danger"><i className="ti ti-arrow-down me-1"></i>1.2%</span> vs last month</p>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6 d-flex">
          <div className="card dash-widget w-100">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="mb-2">Total Earnings</p>
                <h2 className="mb-0">$89,878</h2>
              </div>
              <div className="dash-widget-icon bg-info-light">
                <i className="ti ti-wallet fs-24"></i>
              </div>
            </div>
            <div className="card-footer">
              <p className="mb-0"><span className="text-success"><i className="ti ti-arrow-up me-1"></i>5.1%</span> vs last month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row">
        <div className="col-xxl-4 col-lg-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Companies</h5>
              <div className="dropdown">
                <a href="#" className="dropdown-toggle btn btn-white btn-sm" data-bs-toggle="dropdown">This Year</a>
              </div>
            </div>
            <div className="card-body">
              <div id="company-chart" style={{ minHeight: 250 }}>
                <div className="text-center py-5">
                  <div className="d-flex justify-content-center mb-3">
                    <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'conic-gradient(#FE9F43 0% 65%, #28C76F 65% 85%, #EA5455 85% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="fw-bold fs-5">5,468</span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-center gap-4">
                    <span><i className="ti ti-circle-filled text-primary me-1"></i>Active (4,598)</span>
                    <span><i className="ti ti-circle-filled text-success me-1"></i>New (548)</span>
                    <span><i className="ti ti-circle-filled text-danger me-1"></i>Inactive (322)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-lg-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Revenue</h5>
              <div className="dropdown">
                <a href="#" className="dropdown-toggle btn btn-white btn-sm" data-bs-toggle="dropdown">This Year</a>
              </div>
            </div>
            <div className="card-body">
              <div id="revenue-chart" style={{ minHeight: 250 }}>
                <div className="text-center py-5">
                  <div className="d-flex justify-content-end gap-2 align-items-end" style={{ height: 200 }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                      <div key={month} className="text-center">
                        <div style={{ width: 24, height: [80, 120, 95, 140, 110, 160, 130, 150, 100, 170, 125, 155][i], background: i === 9 ? '#FE9F43' : '#E8E8E8', borderRadius: 4 }}></div>
                        <small className="text-muted">{month}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-lg-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Top Plans</h5>
              <div className="dropdown">
                <a href="#" className="dropdown-toggle btn btn-white btn-sm" data-bs-toggle="dropdown">This Year</a>
              </div>
            </div>
            <div className="card-body">
              <div className="plan-list">
                {[
                  { name: 'Enterprise', count: 2450, pct: 45, color: 'primary' },
                  { name: 'Professional', count: 1800, pct: 33, color: 'success' },
                  { name: 'Starter', count: 1218, pct: 22, color: 'warning' },
                ].map(plan => (
                  <div key={plan.name} className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h6 className="mb-1">{plan.name}</h6>
                      <p className="mb-0">{plan.count} Subscribers</p>
                    </div>
                    <div className="text-end">
                      <span className={`badge bg-${plan.color}-light text-${plan.color}`}>{plan.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="row">
        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recent Transactions</h5>
              <Link to="/purchase-transaction" className="btn btn-sm btn-primary">View All</Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-borderless">
                  <tbody>
                    {[
                      { name: 'Starter Plan', date: '15 Jan 2025', amount: '$29', status: 'Completed', statusClass: 'success' },
                      { name: 'Professional', date: '12 Jan 2025', amount: '$99', status: 'Pending', statusClass: 'warning' },
                      { name: 'Enterprise', date: '10 Jan 2025', amount: '$199', status: 'Completed', statusClass: 'success' },
                      { name: 'Starter Plan', date: '08 Jan 2025', amount: '$29', status: 'Failed', statusClass: 'danger' },
                      { name: 'Professional', date: '05 Jan 2025', amount: '$99', status: 'Completed', statusClass: 'success' },
                    ].map((t, i) => (
                      <tr key={i}>
                        <td><h6 className="fs-14 fw-medium mb-1">{t.name}</h6><p className="fs-12 mb-0">{t.date}</p></td>
                        <td className="text-end"><h6 className="fs-14 fw-medium mb-1">{t.amount}</h6><span className={`badge badge-xs bg-${t.statusClass}-light text-${t.statusClass}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recently Registered</h5>
              <Link to="/companies" className="btn btn-sm btn-primary">View All</Link>
            </div>
            <div className="card-body">
              {[
                { avatar: 'avatar-01.jpg', name: 'Tech Solutions Inc.', plan: 'Enterprise', date: '15 Jan 2025' },
                { avatar: 'avatar-02.jpg', name: 'Digital Marketing Pro', plan: 'Professional', date: '12 Jan 2025' },
                { avatar: 'avatar-03.jpg', name: 'Creative Studio', plan: 'Starter', date: '10 Jan 2025' },
                { avatar: 'avatar-04.jpg', name: 'Cloud Services Ltd', plan: 'Enterprise', date: '08 Jan 2025' },
                { avatar: 'avatar-05.jpg', name: 'Smart Analytics', plan: 'Professional', date: '05 Jan 2025' },
              ].map((c, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-md me-2">
                      <img src={`/assets/img/profiles/${c.avatar}`} alt="" className="rounded-circle" />
                    </span>
                    <div>
                      <h6 className="fs-14 fw-medium mb-1">{c.name}</h6>
                      <p className="fs-12 mb-0">{c.plan} • {c.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-xxl-4 col-xl-6 d-flex">
          <div className="card flex-fill">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recent Plan Expired</h5>
              <Link to="/subscription" className="btn btn-sm btn-primary">View All</Link>
            </div>
            <div className="card-body">
              {[
                { avatar: 'avatar-06.jpg', name: 'Alpha Corp', plan: 'Starter', date: '14 Jan 2025' },
                { avatar: 'avatar-07.jpg', name: 'Beta Industries', plan: 'Professional', date: '11 Jan 2025' },
                { avatar: 'avatar-08.jpg', name: 'Gamma Ltd', plan: 'Enterprise', date: '09 Jan 2025' },
                { avatar: 'avatar-09.jpg', name: 'Delta Systems', plan: 'Starter', date: '07 Jan 2025' },
                { avatar: 'avatar-10.jpg', name: 'Epsilon Tech', plan: 'Professional', date: '04 Jan 2025' },
              ].map((c, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-md me-2">
                      <img src={`/assets/img/profiles/${c.avatar}`} alt="" className="rounded-circle" />
                    </span>
                    <div>
                      <h6 className="fs-14 fw-medium mb-1">{c.name}</h6>
                      <p className="fs-12 mb-0">{c.plan} • Expired {c.date}</p>
                    </div>
                  </div>
                  <span className="badge badge-xs bg-danger-light text-danger">Expired</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
