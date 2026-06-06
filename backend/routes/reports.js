import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getMonthlySpending,
  getVendorPerformance,
  getRFQAnalytics,
  getSpendingByCategory,
  getTopVendors,
  exportVendorsCSV,
  exportPurchaseOrdersCSV,
  exportInvoicesCSV
} from '../controllers/reportController.js';

const router = express.Router();

/**
 * Reports & Analytics Routes
 * All endpoints restricted to admin and/or officer roles.
 */

// Dashboard aggregate statistics
router.get('/reports/dashboard-stats', verifyToken, restrictTo('admin', 'officer'), getDashboardStats);

// Monthly spending breakdown
router.get('/reports/monthly-spending', verifyToken, restrictTo('admin', 'officer'), getMonthlySpending);

// Vendor performance metrics
router.get('/reports/vendor-performance', verifyToken, restrictTo('admin', 'officer'), getVendorPerformance);

// RFQ conversion analytics
router.get('/reports/rfq-analytics', verifyToken, restrictTo('admin', 'officer'), getRFQAnalytics);

// Spending grouped by vendor category
router.get('/reports/spending-by-category', verifyToken, restrictTo('admin', 'officer'), getSpendingByCategory);

// Top 5 vendors by business value
router.get('/reports/top-vendors', verifyToken, restrictTo('admin', 'officer'), getTopVendors);

// CSV Export endpoints
router.get('/reports/export/vendors', verifyToken, restrictTo('admin'), exportVendorsCSV);
router.get('/reports/export/purchase-orders', verifyToken, restrictTo('admin', 'officer'), exportPurchaseOrdersCSV);
router.get('/reports/export/invoices', verifyToken, restrictTo('admin', 'officer'), exportInvoicesCSV);

export default router;
