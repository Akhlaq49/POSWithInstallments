import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { getInstallmentSalesSummary, InstallmentSalesSummary } from '../../services/reportService';

const InstallmentSalesSummaryReport: React.FC = () => {
  const [data, setData] = useState<InstallmentSalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try { setData(await getInstallmentSalesSummary(fromDate || undefined, toDate || undefined)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <>
      <PageHeader title="Installment Sales Summary" breadcrumbs={[{ title: 'Installment Reports' }, { title: 'Sales' }]} />

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">From Date</label>
              <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">To Date</label>
              <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary" onClick={fetchData}>Apply Filter</button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : data ? (
        <>
          {/* Contract Summary */}
          <div className="row mb-4">
            {[
              { label: 'Total Contracts', value: data.totalContracts, color: 'primary' },
              { label: 'Active', value: data.activeContracts, color: 'success' },
              { label: 'Completed', value: data.completedContracts, color: 'info' },
              { label: 'Cancelled', value: data.cancelledContracts, color: 'danger' },
            ].map((c, i) => (
              <div className="col-md-3 mb-3" key={i}>
                <div className={`card border-${c.color}`}>
                  <div className="card-body text-center">
                    <h6 className="text-muted">{c.label}</h6>
                    <h3 className={`text-${c.color}`}>{c.value}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="row mb-4">
            {[
              { label: 'Total Down Payments', value: data.totalDownPayments },
              { label: 'Total Financed', value: data.totalFinancedAmount },
              { label: 'Total Revenue', value: data.totalRevenue },
            ].map((c, i) => (
              <div className="col-md-4 mb-3" key={i}>
                <div className="card">
                  <div className="card-body text-center">
                    <h6 className="text-muted">{c.label}</h6>
                    <h4>Rs {c.value.toLocaleString()}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tenure Breakdown */}
          <div className="card mb-4">
            <div className="card-header"><h5 className="card-title mb-0">Tenure Breakdown</h5></div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr><th>Tenure</th><th>Contracts</th><th>Total Amount</th></tr>
                  </thead>
                  <tbody>
                    {data.tenureBreakdown.map((t, i) => (
                      <tr key={i}>
                        <td>{t.tenureLabel}</td>
                        <td>{t.count}</td>
                        <td>Rs {t.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {data.tenureBreakdown.length === 0 && (
                      <tr><td colSpan={3} className="text-center text-muted">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Monthly Sales */}
          <div className="card">
            <div className="card-header"><h5 className="card-title mb-0">Monthly Sales Trend</h5></div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr><th>Month</th><th>Contracts</th><th>Down Payments</th><th>Financed Amount</th></tr>
                  </thead>
                  <tbody>
                    {data.monthlySales.map((m, i) => (
                      <tr key={i}>
                        <td>{m.month}</td>
                        <td>{m.contracts}</td>
                        <td>Rs {m.downPayments.toLocaleString()}</td>
                        <td>Rs {m.financedAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {data.monthlySales.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-warning">Failed to load report data.</div>
      )}
    </>
  );
};

export default InstallmentSalesSummaryReport;
