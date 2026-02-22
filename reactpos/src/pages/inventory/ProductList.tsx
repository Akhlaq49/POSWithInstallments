import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';

const products = [
  { sku: 'PT001', name: 'Lenovo IdeaPad 3', img: 'stock-img-01.png', category: 'Computers', brand: 'Lenovo', price: '$600.00', unit: 'Pc', qty: 100, createdBy: 'Admin' },
  { sku: 'PT002', name: 'Beats Pro', img: 'stock-img-02.png', category: 'Electronics', brand: 'Beats', price: '$160.00', unit: 'Pc', qty: 140, createdBy: 'Admin' },
  { sku: 'PT003', name: 'Nike Jordan', img: 'stock-img-03.png', category: 'Shoe', brand: 'Nike', price: '$110.00', unit: 'Pc', qty: 300, createdBy: 'Admin' },
  { sku: 'PT004', name: 'Apple Series 5 Watch', img: 'stock-img-04.png', category: 'Electronics', brand: 'Apple', price: '$120.00', unit: 'Pc', qty: 450, createdBy: 'Admin' },
  { sku: 'PT005', name: 'Amazon Echo Dot', img: 'stock-img-05.png', category: 'Electronics', brand: 'Amazon', price: '$80.00', unit: 'Pc', qty: 320, createdBy: 'Admin' },
  { sku: 'PT006', name: 'Sanford Chair Sofa', img: 'stock-img-06.png', category: 'Furnitures', brand: 'Modern Wave', price: '$320.00', unit: 'Pc', qty: 650, createdBy: 'Admin' },
  { sku: 'PT007', name: 'Red Premium Satchel', img: 'stock-img-01.png', category: 'Bags', brand: 'Dior', price: '$60.00', unit: 'Pc', qty: 700, createdBy: 'Admin' },
  { sku: 'PT008', name: 'iPhone 14 Pro', img: 'stock-img-02.png', category: 'Phone', brand: 'Apple', price: '$540.00', unit: 'Pc', qty: 630, createdBy: 'Admin' },
  { sku: 'PT009', name: 'Gaming Chair', img: 'stock-img-03.png', category: 'Furniture', brand: 'Arlime', price: '$200.00', unit: 'Pc', qty: 410, createdBy: 'Admin' },
  { sku: 'PT010', name: 'Borealis Backpack', img: 'stock-img-04.png', category: 'Bags', brand: 'The North Face', price: '$45.00', unit: 'Pc', qty: 550, createdBy: 'Admin' },
];

const ProductList: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Product List"
        breadcrumbs={[{ title: 'Inventory' }, { title: 'Product List' }]}
        actions={
          <>
            <Link to="/add-product" className="btn btn-primary">
              <i className="ti ti-circle-plus me-1"></i>Add Product
            </Link>
          </>
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
            <div className="dropdown me-2">
              <a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                Category
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1">Computers</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Electronics</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Shoe</a></li>
              </ul>
            </div>
            <div className="dropdown">
              <a href="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                Brand
              </a>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li><a href="#" className="dropdown-item rounded-1">Lenovo</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Beats</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Nike</a></li>
                <li><a href="#" className="dropdown-item rounded-1">Apple</a></li>
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
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Created By</th>
                  <th className="no-sort">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.sku}>
                    <td>
                      <label className="checkboxs"><input type="checkbox" /><span className="checkmarks"></span></label>
                    </td>
                    <td>{product.sku}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <a href="#" className="avatar avatar-md me-2">
                          <img src={`/assets/img/products/${product.img}`} alt={product.name} />
                        </a>
                        <Link to="/product-details">{product.name}</Link>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>{product.price}</td>
                    <td>{product.unit}</td>
                    <td>{product.qty}</td>
                    <td>
                      <span className="user-add-hash">
                        <span className="avatar avatar-sm me-1"><img src="/assets/img/profiles/avator1.jpg" alt="" /></span>
                        {product.createdBy}
                      </span>
                    </td>
                    <td className="action-table-data">
                      <div className="edit-delete-action d-flex align-items-center gap-2">
                        <Link to="/product-details" className="btn btn-icon btn-sm">
                          <i className="ti ti-eye text-blue"></i>
                        </Link>
                        <Link to="/edit-product" className="btn btn-icon btn-sm">
                          <i className="ti ti-edit text-blue"></i>
                        </Link>
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
    </>
  );
};

export default ProductList;
