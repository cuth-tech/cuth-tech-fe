import React from 'react';
import { Link } from 'react-router-dom';

// 1. Define the component with the correct name
const AdminDashboardPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-darkgray mb-6">Admin Dashboard</h1>
      <p className="mb-8 text-lg text-mediumgray">Welcome to the admin area. From here you can manage all aspects of your store.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* NEW: Link to the Manage Products page */}
        <Link to="/admin/products" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-primary">Manage Products</h2>
          <p className="text-mediumgray mt-2">View, search, and edit all products in your store.</p>
        </Link>
        
        {/* Existing Link */}
        <Link to="/admin/products/new" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-primary">Add New Product</h2>
          <p className="text-mediumgray mt-2">Create a new product listing for your store.</p>
        </Link>
        
        {/* Existing Link */}
        <Link to="/admin/invoices" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-primary">Manage Invoices</h2>
          <p className="text-mediumgray mt-2">View, search, and manage all generated invoices.</p>
        </Link>

        {/* Existing Link */}
        <Link to="/admin/categories" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold text-primary">Manage Categories</h2>
          <p className="text-mediumgray mt-2">Organize your products by adding or editing categories.</p>
        </Link>
      </div>
    </div>
  );
};

// 2. Export the component as the default
export default AdminDashboardPage;
