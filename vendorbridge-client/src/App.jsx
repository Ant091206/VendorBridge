import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AppLoader from './components/AppLoader';

// ── Eagerly loaded (critical path — auth pages) ──
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// ── Lazily loaded pages — Main ──
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const VendorPortal = lazy(() => import('./pages/VendorPortal'));
const NotFound     = lazy(() => import('./pages/NotFound'));
const ActivityLogs = lazy(() => import('./pages/activity/ActivityLogs'));
const ActivityDetails = lazy(() => import('./pages/activity/ActivityDetails'));
const Notifications = lazy(() => import('./pages/notifications/Notifications'));
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));
const VendorPerformance = lazy(() => import('./pages/reports/VendorPerformance'));
const ProcurementAnalytics = lazy(() => import('./pages/reports/ProcurementAnalytics'));
const SpendingAnalysis = lazy(() => import('./pages/reports/SpendingAnalysis'));

// ── Lazily loaded pages — User Management (Module 1) ──
const UserList   = lazy(() => import('./pages/users/UserList'));
const UserCreate = lazy(() => import('./pages/users/UserCreate'));
const UserEdit   = lazy(() => import('./pages/users/UserEdit'));
const Profile    = lazy(() => import('./pages/profile/Profile'));

// ── Lazily loaded pages — Vendor Module ──
const VendorList   = lazy(() => import('./pages/vendors/VendorList'));
const AddVendor    = lazy(() => import('./pages/vendors/AddVendor'));
const EditVendor   = lazy(() => import('./pages/vendors/EditVendor'));
const VendorDetail = lazy(() => import('./pages/vendors/VendorDetail'));

// ── Lazily loaded pages — RFQ Module ──
const RFQList    = lazy(() => import('./pages/rfqs/RFQList'));
const CreateRFQ  = lazy(() => import('./pages/rfqs/CreateRFQ'));
const EditRFQ    = lazy(() => import('./pages/rfqs/EditRFQ'));
const RFQDetail  = lazy(() => import('./pages/rfqs/RFQDetail'));

// ── Lazily loaded pages — Quotation Module ──
const QuotationList       = lazy(() => import('./pages/quotations/QuotationList'));
const QuotationComparison = lazy(() => import('./pages/comparison/QuotationComparison'));
const VendorQuotationList = lazy(() => import('./pages/quotations/VendorQuotationList'));
const VendorQuotationCreate = lazy(() => import('./pages/quotations/VendorQuotationCreate'));
const VendorQuotationEdit = lazy(() => import('./pages/quotations/VendorQuotationEdit'));
const VendorQuotationDetails = lazy(() => import('./pages/quotations/VendorQuotationDetails'));

// ── Lazily loaded pages — Approval Module ──
const ApprovalQueue  = lazy(() => import('./pages/approvals/ApprovalQueue'));
const ApprovalDetail = lazy(() => import('./pages/approvals/ApprovalDetail'));

// ── Lazily loaded pages — Purchase Order Module ──
const POList      = lazy(() => import('./pages/purchaseOrders/POList'));
const PODetail    = lazy(() => import('./pages/purchaseOrders/PODetail'));
const VendorPOList = lazy(() => import('./pages/vendor/VendorPOList'));

// ── Lazily loaded pages — Invoice Module ──
const InvoiceList     = lazy(() => import('./pages/invoices/InvoiceList'));
const InvoiceDetail   = lazy(() => import('./pages/invoices/InvoiceDetail'));
const GenerateInvoice = lazy(() => import('./pages/invoices/GenerateInvoice'));
const VendorInvoices  = lazy(() => import('./pages/vendor/VendorInvoices'));

/**
 * Route protection guard. Ensures user is logged in
 * and optionally matches allowed roles.
 */
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
            {/* ── PUBLIC AUTH ROUTES ── */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── DASHBOARD ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── VENDOR PORTAL (vendor role only) ── */}
            <Route
              path="/vendor-portal"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Layout><VendorPortal /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── USER MANAGEMENT MODULE (admin only) ── */}
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

            {/* ── PROFILE (all authenticated users) ── */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── VENDOR MODULE ── */}
            <Route
              path="/vendors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><VendorList /></Layout>
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

            {/* ── RFQ MODULE ── */}
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

            {/* ── QUOTATION MODULE ── */}
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
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><QuotationComparison /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/comparison/:rfqId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
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

            {/* ── APPROVAL MODULE ── */}
            <Route
              path="/approvals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Layout><ApprovalQueue /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Layout><ApprovalDetail /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── PURCHASE ORDER MODULE ── */}
            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
                  <Layout><POList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
                  <Layout><PODetail /></Layout>
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

            {/* ── INVOICE MODULE ── */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><InvoiceList /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
                  <Layout><InvoiceDetail /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/generate/:poId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer']}>
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

            {/* ── ACTIVITY LOGS ── */}
            <Route
              path="/activity-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><ActivityLogs /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-logs/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout><ActivityDetails /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── NOTIFICATIONS ── */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><Notifications /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── REPORTS & ANALYTICS ── */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><ReportsDashboard /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/vendors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><VendorPerformance /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><ProcurementAnalytics /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/spending"
              element={
                <ProtectedRoute allowedRoles={['admin', 'officer', 'manager', 'vendor']}>
                  <Layout><SpendingAnalysis /></Layout>
                </ProtectedRoute>
              }
            />

            {/* ── 404 NOT FOUND ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
