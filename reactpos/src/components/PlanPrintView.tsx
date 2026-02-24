import React, { useRef } from 'react';
import { InstallmentPlan } from '../services/installmentService';
import { MEDIA_BASE_URL } from '../services/api';

interface PlanPrintViewProps {
  plan: InstallmentPlan;
  onClose: () => void;
}

const PlanPrintView: React.FC<PlanPrintViewProps> = ({ plan, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmt2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalPaid =
    plan.schedule
      .filter((e) => e.status === 'paid' || e.status === 'partial')
      .reduce((s, e) => s + (e.actualPaidAmount || 0) + (e.miscAdjustedAmount || 0), 0) + plan.downPayment;

  const totalRemaining = plan.totalPayable - totalPaid;

  const statusColor = (s: string) => {
    switch (s) {
      case 'paid': return '#28a745';
      case 'partial': return '#17a2b8';
      case 'due': return '#ffc107';
      case 'overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'paid': return 'Paid';
      case 'partial': return 'Partial';
      case 'due': return 'Due';
      case 'overdue': return 'Overdue';
      default: return 'Upcoming';
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installment Plan - ${plan.customerName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #333; }
          .print-wrap { max-width: 800px; margin: 0 auto; padding: 24px; }
          .header { text-align: center; border-bottom: 3px solid #4a90d9; padding-bottom: 16px; margin-bottom: 20px; }
          .header h1 { font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
          .header .sub { font-size: 12px; color: #666; margin-top: 2px; }
          .header .title-badge { display: inline-block; background: #4a90d9; color: #fff; padding: 5px 24px; border-radius: 4px; font-weight: 700; font-size: 14px; margin-top: 10px; }
          .section { margin-bottom: 18px; }
          .section-title { font-weight: 800; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 10px; letter-spacing: 0.5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 24px; }
          .info-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
          .info-row .label { color: #555; font-weight: 600; }
          .info-row .value { font-weight: 500; }
          .guarantor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .guarantor-card { border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
          .guarantor-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
          .guarantor-card p { font-size: 12px; color: #555; margin: 2px 0; }
          .schedule-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .schedule-table th { background: #4a90d9; color: #fff; padding: 7px 6px; text-align: center; font-weight: 700; font-size: 10px; text-transform: uppercase; }
          .schedule-table td { border: 1px solid #ddd; padding: 5px 6px; text-align: center; }
          .schedule-table tr:nth-child(even) { background: #f9f9f9; }
          .schedule-table .down-row { background: #e8f4fd !important; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; color: #fff; }
          .summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          .summary-row .label { font-weight: 600; color: #555; }
          .summary-row .value { font-weight: 700; }
          .footer { text-align: center; border-top: 2px solid #e0e0e0; padding-top: 12px; margin-top: 16px; font-size: 11px; color: #888; }
          .progress-bar-outer { width: 100%; height: 14px; background: #e8e8e8; border-radius: 7px; overflow: hidden; margin: 6px 0; }
          .progress-bar-inner { height: 100%; background: #28a745; border-radius: 7px; text-align: center; color: #fff; font-size: 10px; font-weight: 700; line-height: 14px; }
          @media print { body { padding: 0; } .print-wrap { max-width: 100%; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const progressPct = plan.tenure > 0 ? Math.round((plan.paidInstallments / plan.tenure) * 100) : 0;

  // Inline style helpers (for printable HTML in ref)
  const sTitle: React.CSSProperties = { fontWeight: 800, fontSize: 14, textTransform: 'uppercase', borderBottom: '2px solid #333', paddingBottom: 4, marginBottom: 10, letterSpacing: 0.5 };
  const sRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 };
  const sLabel: React.CSSProperties = { color: '#555', fontWeight: 600 };
  const sValue: React.CSSProperties = { fontWeight: 500 };
  const sTh: React.CSSProperties = { background: '#4a90d9', color: '#fff', padding: '7px 6px', textAlign: 'center', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' };
  const sTd: React.CSSProperties = { border: '1px solid #ddd', padding: '5px 6px', textAlign: 'center', fontSize: 11 };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex={-1} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white py-2">
            <h6 className="modal-title fw-bold mb-0"><i className="ti ti-file-text me-2"></i>Full Repayment Plan</h6>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light" onClick={handlePrint} title="Print">
                <i className="ti ti-printer me-1"></i>Print
              </button>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
          </div>
          <div className="modal-body p-0" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div ref={printRef}>
              <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: '#333' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '3px solid #4a90d9', paddingBottom: 16, marginBottom: 20 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>Asyentyx</h1>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Lahore</div>
                  <div style={{ display: 'inline-block', background: '#4a90d9', color: '#fff', padding: '5px 24px', borderRadius: 4, fontWeight: 700, fontSize: 14, marginTop: 10 }}>
                    INSTALLMENT PLAN DETAILS
                  </div>
                </div>

                {/* Customer + Product side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 18 }}>
                  {/* Customer */}
                  <div>
                    <div style={sTitle}>CUSTOMER INFORMATION</div>
                    <div style={sRow}><span style={sLabel}>Name:</span><span style={sValue}>{plan.customerName}</span></div>
                    {plan.customerSo && <div style={sRow}><span style={sLabel}>S/O:</span><span style={sValue}>{plan.customerSo}</span></div>}
                    <div style={sRow}><span style={sLabel}>Mobile:</span><span style={sValue}>{plan.customerPhone || '-'}</span></div>
                    {plan.customerCnic && <div style={sRow}><span style={sLabel}>CNIC:</span><span style={sValue}>{plan.customerCnic}</span></div>}
                    <div style={sRow}><span style={sLabel}>Address:</span><span style={sValue}>{plan.customerAddress || '-'}</span></div>
                  </div>

                  {/* Product */}
                  <div>
                    <div style={sTitle}>PRODUCT INFORMATION</div>
                    <div style={sRow}><span style={sLabel}>Product:</span><span style={sValue}>{plan.productName}</span></div>
                    <div style={sRow}><span style={sLabel}>Price:</span><span style={sValue}>Rs {fmt(plan.productPrice)}</span></div>
                    {plan.financeAmount != null && plan.financeAmount > 0 && plan.financeAmount !== plan.productPrice && (
                      <div style={sRow}><span style={sLabel}>Finance Amount:</span><span style={sValue}>Rs {fmt(plan.financeAmount)}</span></div>
                    )}
                    <div style={sRow}><span style={sLabel}>Down Payment:</span><span style={sValue}>Rs {fmt(plan.downPayment)}</span></div>
                    <div style={sRow}><span style={sLabel}>Financed:</span><span style={sValue}>Rs {fmt(plan.financedAmount)}</span></div>
                  </div>
                </div>

                {/* Plan Details */}
                <div style={{ marginBottom: 18 }}>
                  <div style={sTitle}>PLAN DETAILS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' }}>
                    <div style={sRow}><span style={sLabel}>Start Date:</span><span style={sValue}>{plan.startDate}</span></div>
                    <div style={sRow}><span style={sLabel}>Tenure:</span><span style={sValue}>{plan.tenure} months</span></div>
                    <div style={sRow}><span style={sLabel}>Interest Rate:</span><span style={sValue}>{plan.interestRate}% p.a.</span></div>
                    <div style={sRow}><span style={sLabel}>Monthly EMI:</span><span style={{ fontWeight: 700, color: '#4a90d9' }}>Rs {fmt(plan.emiAmount)}</span></div>
                    <div style={sRow}><span style={sLabel}>Total Interest:</span><span style={{ fontWeight: 600, color: '#dc3545' }}>Rs {fmt(plan.totalInterest)}</span></div>
                    <div style={sRow}><span style={sLabel}>Total Payable:</span><span style={{ fontWeight: 700 }}>Rs {fmt(plan.totalPayable)}</span></div>
                    <div style={sRow}><span style={sLabel}>Total Paid:</span><span style={{ fontWeight: 700, color: '#28a745' }}>Rs {fmt(totalPaid)}</span></div>
                    <div style={sRow}><span style={sLabel}>Outstanding:</span><span style={{ fontWeight: 700, color: totalRemaining > 0 ? '#dc3545' : '#28a745' }}>Rs {fmt(totalRemaining > 0 ? totalRemaining : 0)}</span></div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                      <span>Repayment Progress</span>
                      <span>{plan.paidInstallments} / {plan.tenure} installments ({progressPct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 14, background: '#e8e8e8', borderRadius: 7, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: '#28a745', borderRadius: 7, textAlign: 'center', color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: '14px' }}>
                        {progressPct > 10 ? `${progressPct}%` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guarantors */}
                {plan.guarantors && plan.guarantors.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={sTitle}>GUARANTOR{plan.guarantors.length > 1 ? 'S' : ''} ({plan.guarantors.length})</div>
                    <div style={{ display: 'grid', gridTemplateColumns: plan.guarantors.length > 1 ? '1fr 1fr' : '1fr', gap: 12 }}>
                      {plan.guarantors.map((g) => (
                        <div key={g.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            {g.picture ? (
                              <img src={`${MEDIA_BASE_URL}${g.picture}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #4a90d9' }} />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4a90d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                                {g.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                              {g.relationship && <div style={{ fontSize: 11, color: '#4a90d9', fontWeight: 600 }}>{g.relationship}</div>}
                            </div>
                          </div>
                          {g.so && <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>S/O: {g.so}</div>}
                          {g.phone && <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>Phone: {g.phone}</div>}
                          {g.cnic && <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>CNIC: {g.cnic}</div>}
                          {g.address && <div style={{ fontSize: 12, color: '#555' }}>Address: {g.address}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repayment Schedule */}
                <div style={{ marginBottom: 18 }}>
                  <div style={sTitle}>REPAYMENT SCHEDULE</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={sTh}>#</th>
                        <th style={sTh}>Due Date</th>
                        <th style={sTh}>EMI</th>
                        <th style={sTh}>Principal</th>
                        <th style={sTh}>Interest</th>
                        <th style={sTh}>Paid</th>
                        <th style={sTh}>Balance</th>
                        <th style={sTh}>Status</th>
                        <th style={sTh}>Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Down payment row */}
                      <tr style={{ background: '#e8f4fd' }}>
                        <td style={sTd}>—</td>
                        <td style={sTd}>{plan.startDate}</td>
                        <td style={{ ...sTd, fontWeight: 600 }}>Rs {fmt(plan.downPayment)}</td>
                        <td style={sTd}>Rs {fmt(plan.downPayment)}</td>
                        <td style={sTd}>—</td>
                        <td style={{ ...sTd, color: '#28a745', fontWeight: 700 }}>Rs {fmt(plan.downPayment)}</td>
                        <td style={sTd}>Rs {fmt(plan.financedAmount)}</td>
                        <td style={sTd}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, color: '#fff', background: '#28a745' }}>Down Payment</span>
                        </td>
                        <td style={sTd}>{plan.startDate}</td>
                      </tr>
                      {plan.schedule.map((e) => {
                        const paidAmt = (e.actualPaidAmount || 0) + (e.miscAdjustedAmount || 0);
                        const bgColor = e.status === 'overdue' ? '#fff5f5' : e.status === 'due' ? '#fffbe6' : e.status === 'partial' ? '#e8f8fd' : 'transparent';
                        return (
                          <tr key={e.installmentNo} style={{ background: bgColor }}>
                            <td style={{ ...sTd, fontWeight: 600 }}>{e.installmentNo}</td>
                            <td style={sTd}>{e.dueDate}</td>
                            <td style={{ ...sTd, fontWeight: 600 }}>Rs {fmt2(e.emiAmount)}</td>
                            <td style={sTd}>Rs {fmt2(e.principal)}</td>
                            <td style={{ ...sTd, color: '#dc3545' }}>Rs {fmt2(e.interest)}</td>
                            <td style={{ ...sTd, color: paidAmt > 0 ? '#28a745' : '#999', fontWeight: paidAmt > 0 ? 700 : 400 }}>
                              {paidAmt > 0 ? `Rs ${fmt2(paidAmt)}` : '—'}
                            </td>
                            <td style={sTd}>Rs {fmt2(e.balance)}</td>
                            <td style={sTd}>
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 700, color: '#fff', background: statusColor(e.status) }}>
                                {statusLabel(e.status)}
                              </span>
                            </td>
                            <td style={sTd}>{e.paidDate || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f5f5f5', fontWeight: 700 }}>
                        <td style={{ ...sTd, fontWeight: 700 }} colSpan={2}>TOTAL</td>
                        <td style={{ ...sTd, fontWeight: 700 }}>Rs {fmt2(plan.schedule.reduce((s, e) => s + e.emiAmount, 0))}</td>
                        <td style={{ ...sTd, fontWeight: 700 }}>Rs {fmt2(plan.schedule.reduce((s, e) => s + e.principal, 0))}</td>
                        <td style={{ ...sTd, fontWeight: 700, color: '#dc3545' }}>Rs {fmt2(plan.schedule.reduce((s, e) => s + e.interest, 0))}</td>
                        <td style={{ ...sTd, fontWeight: 700, color: '#28a745' }}>Rs {fmt2(plan.schedule.filter(e => e.status === 'paid' || e.status === 'partial').reduce((s, e) => s + (e.actualPaidAmount || 0) + (e.miscAdjustedAmount || 0), 0))}</td>
                        <td style={sTd} colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 10 }}>
                  <div style={{ textAlign: 'center', border: '1px solid #ddd', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Payable</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>Rs {fmt(plan.totalPayable)}</div>
                  </div>
                  <div style={{ textAlign: 'center', border: '1px solid #ddd', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Paid</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#28a745' }}>Rs {fmt(totalPaid)}</div>
                  </div>
                  <div style={{ textAlign: 'center', border: '1px solid #ddd', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Outstanding</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: totalRemaining > 0 ? '#dc3545' : '#28a745' }}>Rs {fmt(totalRemaining > 0 ? totalRemaining : 0)}</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', borderTop: '2px solid #e0e0e0', paddingTop: 12, marginTop: 16, fontSize: 11, color: '#888' }}>
                  Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &bull; Plan #{plan.id} &bull; {plan.customerName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
