import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AppLoader from './components/AppLoader';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

const Dashboard             = lazy(() => import('./pages/Dashboard'));
const VendorPortal          = lazy(() => import('./pages/VendorPortal'));
const NotFound              = lazy(() => import('./pages/NotFound'));
const ActivityLogs          = lazy(() => import('./pages/activity/ActivityLogs'));
const ActivityDetails       = lazy(() => import('./pages/activity/ActivityDetails'));
const Notifications         = lazy(() => import('./pages/notifications/Notifications'));
const ReportsDashboard      = lazy(() => import('./pages/reports/ReportsDashboard'));
const VendorPerformance     = lazy(() => import('./pages/reports/VendorPerformance'));
const ProcurementAnalytics  = lazy(() => import('./pages/reports/ProcurementAnalytics'));
const SpendingAnalysis      = lazy(() => import('./pages/reports/SpendingAnalysis'));
const ApprovalAnalytics     = lazy(() => import('./pages/reports/ApprovalAnalytics'));
const PurchaseOrderAnalytics = lazy(() => import('./pages/reports/PurchaseOrderAnalytics'));
const InvoiceAnalytics      = lazy(() => import('./pages/reports/InvoiceAnalytics'));
const ReportsCenter         = lazy(() => import('./pages/reports/ReportsCenter'));

const UserList   = lazy(() => import('./pages/users/UserList'));
const UserCreate = lazy(() => import('./pages/users/UserCreate'));
const UserEdit   = lazy(() => import('./pages/users/UserEdit'));
const Profile    = lazy(() => import('./pages/profile/Profile'));

const VendorList       = lazy(() => import('./pages/vendors/VendorList'));
const VendorCategories = lazy(() => import('./pages/vendors/VendorCategories'));
const AddVendor        = lazy(() => import('./pages/vendors/AddVendor'));
const EditVendor       = lazy(() => import('./pages/vendors/EditVendor'));
const VendorDetail     = lazy(() => import('./pages/vendors/VendorDetail'));

const RFQList   = lazy(() => import('./pages/rfqs/RFQList'));
const CreateRFQ = lazy(() => import('./pages/rfqs/CreateRFQ'));
const EditRFQ   = lazy(() => import('./pages/rfqs/EditRFQ'));
const RFQDetail = lazy(() => import('./pages/rfqs/RFQDetail'));

const QuotationList        = lazy(() => import('./pages/quotations/QuotationList'));
const QuotationComparison  = lazy(() => import('./pages/comparison/QuotationComparison'));
const VendorQuotationList  = lazy(() => import('./pages/quotations/VendorQuotationList'));
const VendorQuotationCreate = lazy(() => import('./pages/quotations/VendorQuotationCreate'));
const VendorQuotationEdit  = lazy(() => import('./pages/quotations/VendorQuotationEdit'));
const VendorQuotationDetails = lazy(() => import('./pages/quotations/VendorQuotationDetails'));

const ApprovalList    = lazy(() => import('./pages/approvals/ApprovalList'));
const ApprovalQueue   = lazy(() => import('./pages/approvals/ApprovalQueue'));
const ApprovalDetails = lazy(() => import('./pages/approvals/ApprovalDetails'));

const POList       = lazy(() => import('./pages/purchaseOrders/POList'));
const PODetail     = lazy(() => import('./pages/purchaseOrders/PODetail'));
const POPreview    = lazy(() => import('./pages/purchaseOrders/POPreview'));
const VendorPOList = lazy(() => import('./pages/vendor/VendorPOList'));
const CreatePO     = lazy(() => import('./pages/purchaseOrders/CreatePurchaseOrder'));
const PODashboard  = lazy(() => import('./pages/purchaseOrders/PurchaseOrderDashboard'));

const InvoiceList     = lazy(() => import('./pages/invoices/InvoiceList'));
const InvoiceDetail   = lazy(() => import('./pages/invoices/InvoiceDetail'));
const InvoicePreview  = lazy(() => import('./pages/invoices/InvoicePreview'));
const GenerateInvoice = lazy(() => import('./pages/invoices/GenerateInvoice'));
const VendorInvoices  = lazy(() => import('./pages/vendor/VendorInvoices'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor-portal"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorPortal /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><UserList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/create"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><UserCreate /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><UserEdit /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><VendorList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor-categories"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><VendorCategories /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors/add"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><AddVendor /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><EditVendor /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><VendorDetail /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/rfqs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><RFQList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rfqs/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><CreateRFQ /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rfqs/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><EditRFQ /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rfqs/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><RFQDetail /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quotations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><QuotationList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/vendor"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorQuotationList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations/compare/:rfqId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
                  <Layout><QuotationComparison /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comparison/:rfqId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
                  <Layout><QuotationComparison /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/submit-quote/:rfqId"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorQuotationCreate /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/edit-quote/:id"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorQuotationEdit /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/quotation-details/:id"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorQuotationDetails /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
                  <Layout><ApprovalList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/queue"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Layout><ApprovalQueue /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
                  <Layout><ApprovalDetails /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'finance']}>
                  <Layout><POList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'finance']}>
                  <Layout><PODashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><CreatePO /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/create/:approvalId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><CreatePO /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/edit/:poId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><CreatePO /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><PODetail /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/:id/preview"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <POPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/my-orders"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorPOList /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance']}>
                  <Layout><InvoiceList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance']}>
                  <Layout><InvoiceDetail /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id/preview"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance', 'vendor']}>
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/generate/:poId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance']}>
                  <Layout><GenerateInvoice /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/my-invoices"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorInvoices /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/activity-logs"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><ActivityLogs /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-logs/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><ActivityDetails /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><Notifications /></Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><ReportsDashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/vendors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><VendorPerformance /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><ProcurementAnalytics /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/spending"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor', 'finance']}>
                  <Layout><SpendingAnalysis /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'finance']}>
                  <Layout><ApprovalAnalytics /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/pos"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'finance']}>
                  <Layout><PurchaseOrderAnalytics /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance']}>
                  <Layout><InvoiceAnalytics /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/center"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'finance']}>
                  <Layout><ReportsCenter /></Layout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
