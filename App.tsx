import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Header, Footer, PageWrapper } from './components/Layout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import BulkUploadPage from './pages/admin/BulkUploadPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminTagManagementPage from './pages/admin/AdminTagManagementPage'; 
import AdminDiscountManagementPage from './pages/admin/AdminDiscountManagementPage';
import AdminUsersManagementPage from './pages/admin/AdminUsersManagementPage';
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage';
import BulkDeletePage from './pages/admin/BulkDeletePage';
import AdminInvoiceManagementPage from './pages/admin/AdminInvoiceManagementPage';
import AdminReceiptManagementPage from './pages/admin/AdminReceiptManagementPage';
import AdminRefreshPreviewPage from './pages/admin/AdminRefreshPreviewPage';
import HomePage from './pages/user/HomePage'; 
import ProductBrowsePage from './pages/user/ProductBrowsePage'; 
import CartPage from './pages/user/CartPage'; 
import CheckoutPage from './pages/user/CheckoutPage';
import { useAuth } from './hooks/useAuth';
import { AdminRole } from './types';
import { ADMIN_ROLES } from './constants';
import { initializeProductsFromSheet, getProducts } from './services/apiService';
import { Spinner } from './components/ui/Spinner';
import AdminProductListPage from './pages/admin/AdminProductListPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { loggedInUser, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && loggedInUser && !allowedRoles.includes(loggedInUser.role)) {
    alert("Access Denied: You do not have permission to view this page.");
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    const initApp = async () => {
      try {
        if (!paypalClientId) {
            throw new Error("PayPal Client ID is not configured in the environment variables.");
        }
        const existingProducts = await getProducts();

        if (Array.isArray(existingProducts) && existingProducts.length === 0) {
          console.log("No backend products found, seeding from Google Sheet for the first time...");
          const result = await initializeProductsFromSheet();
          if (!result.success) {
            setInitError(result.message || 'Failed to initialize the application data from the source sheet.');
          }
        } else if (!Array.isArray(existingProducts)) {
            console.error("Failed to load initial product data. The response was not an array.");
            setInitError('Failed to load initial product data. The store may not function correctly.');
        }
      } catch (error: any) {
        console.error("Critical error during app initialization:", error);
        setInitError(error.message || 'A critical error occurred while starting the app.');
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, [paypalClientId]);

  if (isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-lightgray">
        <Spinner size="lg" />
        <p className="mt-4 text-xl text-darkgray">Loading Store...</p>
      </div>
    );
  }

  if (initError || !paypalClientId) {
    return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4" role="alert">
            <p className="font-bold">Application Error</p>
            <p>{initError || "PayPal Client ID is missing. The application cannot start."}</p>
        </div>
    );
  }

  const initialPayPalOptions = {
    clientId: paypalClientId,
    currency: "USD",
    locale: "en_ZA"
  };

  return (
    <PayPalScriptProvider options={initialPayPalOptions}>
        <HashRouter>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                <PageWrapper>
                    <Routes>
                    {/* User Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductBrowsePage />} />
                    <Route path="/category/:categoryName" element={<ProductBrowsePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route 
                        path="/admin" 
                        element={
                        <ProtectedRoute>
                            <Navigate to="/admin/dashboard" replace />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/dashboard" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER, ADMIN_ROLES.EDITOR]}>
                            <AdminDashboardPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/products" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER, ADMIN_ROLES.EDITOR]}>
                            <AdminProductListPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/products/new" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER, ADMIN_ROLES.EDITOR]}>
                            <ProductFormPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/products/edit/:productId" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER, ADMIN_ROLES.EDITOR]}>
                            <ProductFormPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/categories" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <CategoryManagementPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/tags" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <AdminTagManagementPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/discounts" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <AdminDiscountManagementPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/invoices" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <AdminInvoiceManagementPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/receipts" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <AdminReceiptManagementPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/bulk-upload" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER, ADMIN_ROLES.EDITOR]}>
                            <BulkUploadPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/refresh-preview" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <AdminRefreshPreviewPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/bulk-delete" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.MANAGER]}>
                            <BulkDeletePage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/settings" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN]}>
                            <AdminSettingsPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/users" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN]}>
                            <AdminUsersManagementPage />
                        </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/audit-logs" 
                        element={
                        <ProtectedRoute allowedRoles={[ADMIN_ROLES.SUPERADMIN]}>
                            <AdminAuditLogPage />
                        </ProtectedRoute>
                        } 
                    />
                    
                    <Route path="*" element={<Navigate to="/" />} /> 
                    </Routes>
                </PageWrapper>
                </main>
                <Footer />
            </div>
        </HashRouter>
    </PayPalScriptProvider>
  );
};

export default App;
