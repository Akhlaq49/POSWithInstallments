import React from 'react';
import PageHeader from '../../components/common/PageHeader';

const BalanceSheet: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Balance Sheet"
        breadcrumbs={[{ title: 'Finance' }]}
      />
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <div className="search-set">
            <div className="search-input">
              <a href="#" className="btn btn-searchset"><i className="ti ti-search fs-14"></i></a>
              <input type="text" className="form-control" placeholder="Search" />
            </div>
          </div>
        </div>
        <div className="card-body">
          <p>Manage your balance sheet here.</p>
        </div>
      </div>
    </>
  );
};

export default BalanceSheet;

