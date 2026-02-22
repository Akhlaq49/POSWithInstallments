import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  InstallmentPlan,
  RepaymentEntry,
  getInstallmentById,
  markInstallmentPaid,
} from '../../services/installmentService';

const InstallmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingNo, setPayingNo] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInstNo, setPayInstNo] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const result = await getInstallmentById(id || '');
        setPlan(result);
      } catch {
        setPlan(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [id]);

  useEffect(() => {
    if (typeof (window as any).feather !== 'undefined') {
      (window as any).feather.replace();
    }
  });

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalPaid = useMemo(() => {
    if (!plan) return 0;
    return plan.schedule.filter((e) => e.status === 'paid').reduce((s, e) => s + e.emiAmount, 0) + plan.downPayment;
  }, [plan]);

  const totalRemaining = useMemo(() => {
    if (!plan) return 0;
    return plan.schedule.filter((e) => e.status !== 'paid').reduce((s, e) => s + e.emiAmount, 0);
  }, [plan]);

  const progressPercent = useMemo(() => {
    if (!plan) return 0;
    return Math.round((plan.paidInstallments / plan.tenure) * 100);
  }, [plan]);

  const openPayModal = (instNo: number) => {
    setPayInstNo(instNo);
    setShowPayModal(true);
  };

  const handlePay = async () => {
    if (!plan || payInstNo === null) return;
    setPayingNo(payInstNo);
    await markInstallmentPaid(plan.id, payInstNo);

    // Update local state
    const updatedSchedule = plan.schedule.map((entry) =>
      entry.installmentNo === payInstNo ? { ...entry, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] } : entry
    );
    const paidCount = updatedSchedule.filter((e) => e.status === 'paid').length;
    const nextDue = updatedSchedule.find((e) => e.status !== 'paid');

    setPlan({
      ...plan,
      schedule: updatedSchedule,
      paidInstallments: paidCount,
      remainingInstallments: plan.tenure - paidCount,
      nextDueDate: nextDue?.dueDate || '',
      status: paidCount === plan.tenure ? 'completed' : plan.status,
    });
    setPayingNo(null);
    setShowPayModal(false);
    setPayInstNo(null);
  };

  const statusBadgeEntry = (status: RepaymentEntry['status']) => {
    const map: Record<string, { cls: string; label: string }> = {
      paid: { cls: 'bg-success', label: 'Paid' },
      due: { cls: 'bg-warning', label: 'Due Now' },
      overdue: { cls: 'bg-danger', label: 'Overdue' },
      upcoming: { cls: 'bg-secondary', label: 'Upcoming' },
    };
    const m = map[status] || map.upcoming;
    return <span className={`badge fw-medium fs-10 ${m.cls}`}>{m.label}</span>;
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center p-5">
        <h4>Plan not found</h4>
        <Link to="/installment-plans" className="btn btn-primary mt-3">Back to Plans</Link>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="add-item d-flex">
          <div className="page-title">
            <h4 className="fw-bold">Installment Details</h4>
            <h6>Plan #{plan.id} &mdash; {plan.customerName}</h6>
          </div>
        </div>
        <div className="page-btn d-flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/installment-plans')}>
            <i className="ti ti-arrow-left me-1"></i>Back
          </button>
          <button className="btn btn-outline-primary" onClick={() => window.print()}>
            <i className="ti ti-printer me-1"></i>Print
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="row mb-3">
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-body text-center">
              <p className="mb-1 text-muted">Product Price</p>
              <h4 className="fw-bold">Rs {fmt(plan.productPrice)}</h4>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-body text-center">
              <p className="mb-1 text-muted">Monthly EMI</p>
              <h4 className="fw-bold text-primary">Rs {fmt(plan.emiAmount)}</h4>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-body text-center">
              <p className="mb-1 text-muted">Total Paid</p>
              <h4 className="fw-bold text-success">Rs {fmt(totalPaid)}</h4>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-sm-6">
          <div className="card">
            <div className="card-body text-center">
              <p className="mb-1 text-muted">Remaining</p>
              <h4 className="fw-bold text-danger">Rs {fmt(totalRemaining)}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left: Customer & Product Details */}
        <div className="col-xl-4">
          {/* Customer Card */}
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0"><i className="ti ti-user me-2"></i>Customer</h5></div>
            <div className="card-body">
              <p className="mb-2"><strong>Name:</strong> {plan.customerName}</p>
              <p className="mb-2"><strong>Phone:</strong> {plan.customerPhone}</p>
              <p className="mb-0"><strong>Address:</strong> {plan.customerAddress}</p>
            </div>
          </div>

          {/* Product Card */}
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0"><i className="ti ti-box me-2"></i>Product</h5></div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <a className="avatar avatar-lg me-3"><img src={plan.productImage} alt="product" /></a>
                <div>
                  <h6 className="fw-bold mb-1">{plan.productName}</h6>
                  <span className="text-muted">Rs {fmt(plan.productPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Card */}
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0"><i className="ti ti-settings me-2"></i>Plan Details</h5></div>
            <div className="card-body">
              <table className="table table-borderless table-sm mb-0">
                <tbody>
                  <tr><td className="text-muted">Down Payment</td><td className="text-end">Rs {fmt(plan.downPayment)}</td></tr>
                  <tr><td className="text-muted">Financed Amount</td><td className="text-end">Rs {fmt(plan.financedAmount)}</td></tr>
                  <tr><td className="text-muted">Interest Rate</td><td className="text-end">{plan.interestRate}% p.a.</td></tr>
                  <tr><td className="text-muted">Tenure</td><td className="text-end">{plan.tenure} months</td></tr>
                  <tr><td className="text-muted">Monthly EMI</td><td className="text-end fw-bold text-primary">Rs {fmt(plan.emiAmount)}</td></tr>
                  <tr className="border-top"><td className="text-muted">Total Interest</td><td className="text-end text-danger">Rs {fmt(plan.totalInterest)}</td></tr>
                  <tr><td className="fw-bold">Total Payable</td><td className="text-end fw-bold">Rs {fmt(plan.totalPayable)}</td></tr>
                  <tr><td className="text-muted">Start Date</td><td className="text-end">{plan.startDate}</td></tr>
                  <tr><td className="text-muted">Status</td><td className="text-end">
                    <span className={`badge fw-medium fs-10 ${plan.status === 'active' ? 'bg-success' : plan.status === 'completed' ? 'bg-info' : 'bg-secondary'}`}>
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </span>
                  </td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Progress */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-medium">Repayment Progress</span>
                <span className="fw-bold">{plan.paidInstallments}/{plan.tenure}</span>
              </div>
              <div className="progress" style={{ height: 12 }}>
                <div className="progress-bar bg-success" style={{ width: `${progressPercent}%` }}>{progressPercent}%</div>
              </div>
              {plan.nextDueDate && <p className="mt-2 mb-0 text-muted"><small>Next due: <strong>{plan.nextDueDate}</strong></small></p>}
            </div>
          </div>
        </div>

        {/* Right: Repayment Schedule */}
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0"><i className="ti ti-calendar me-2"></i>Repayment Schedule</h5>
              <div>
                <span className="badge bg-success me-1">Paid: {plan.paidInstallments}</span>
                <span className="badge bg-secondary">Remaining: {plan.remainingInstallments}</span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th>#</th>
                      <th>Due Date</th>
                      <th>EMI Amount</th>
                      <th>Principal</th>
                      <th>Interest</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Paid Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Down payment row */}
                    <tr className="table-light">
                      <td>-</td>
                      <td>{plan.startDate}</td>
                      <td className="fw-medium">Rs {fmt(plan.downPayment)}</td>
                      <td>Rs {fmt(plan.downPayment)}</td>
                      <td>-</td>
                      <td>Rs {fmt(plan.financedAmount)}</td>
                      <td><span className="badge bg-success fw-medium fs-10">Down Payment</span></td>
                      <td>{plan.startDate}</td>
                      <td></td>
                    </tr>
                    {plan.schedule.map((entry) => (
                      <tr key={entry.installmentNo} className={entry.status === 'overdue' ? 'table-danger' : entry.status === 'due' ? 'table-warning' : ''}>
                        <td className="fw-medium">{entry.installmentNo}</td>
                        <td>{entry.dueDate}</td>
                        <td className="fw-medium">Rs {fmt(entry.emiAmount)}</td>
                        <td>Rs {fmt(entry.principal)}</td>
                        <td className="text-danger">Rs {fmt(entry.interest)}</td>
                        <td>Rs {fmt(entry.balance)}</td>
                        <td>{statusBadgeEntry(entry.status)}</td>
                        <td>{entry.paidDate || '-'}</td>
                        <td>
                          {(entry.status === 'due' || entry.status === 'overdue') && plan.status === 'active' && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={payingNo === entry.installmentNo}
                              onClick={() => openPayModal(entry.installmentNo)}
                            >
                              {payingNo === entry.installmentNo ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <><i className="ti ti-check me-1"></i>Pay</>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-top fw-bold">
                    <tr>
                      <td colSpan={2}>Total</td>
                      <td>Rs {fmt(plan.schedule.reduce((s, e) => s + e.emiAmount, 0))}</td>
                      <td>Rs {fmt(plan.schedule.reduce((s, e) => s + e.principal, 0))}</td>
                      <td className="text-danger">Rs {fmt(plan.schedule.reduce((s, e) => s + e.interest, 0))}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Confirmation Modal */}
      {showPayModal && payInstNo !== null && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content p-5 px-3 text-center">
                  <span className="rounded-circle d-inline-flex p-2 bg-success-transparent mb-2"><i className="ti ti-check fs-24 text-success"></i></span>
                  <h4 className="fs-20 fw-bold mb-2 mt-1">Confirm Payment</h4>
                  <p className="mb-1 fs-16">Mark installment <strong>#{payInstNo}</strong> as paid?</p>
                  <p className="mb-0 text-muted">Amount: <strong>Rs {fmt(plan.schedule.find((e) => e.installmentNo === payInstNo)?.emiAmount || 0)}</strong></p>
                  <div className="modal-footer-btn mt-3 d-flex justify-content-center">
                    <button type="button" className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none" onClick={() => setShowPayModal(false)}>Cancel</button>
                    <button type="button" className="btn btn-success fs-13 fw-medium p-2 px-3" onClick={handlePay}>Confirm Payment</button>
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

export default InstallmentDetails;
