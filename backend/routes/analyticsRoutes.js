import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getDashboard,
  getProcurement,
  getVendors,
  getSpending,
  getApprovals,
  getPurchaseOrders,
  getInvoices,
  getTrends
} from '../controllers/analyticsController.js';

const router = express.Router();

// Executive/Overview Dashboard (vendor allowed but scoped)
router.get('/analytics/dashboard', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), getDashboard);

// Sub-analytics views (staff roles only)
router.get('/analytics/procurement', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getProcurement);
router.get('/analytics/vendors', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getVendors);
router.get('/analytics/spending', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getSpending);
router.get('/analytics/approvals', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getApprovals);
router.get('/analytics/purchase-orders', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getPurchaseOrders);
router.get('/analytics/invoices', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getInvoices);
router.get('/analytics/trends', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getTrends);

// ── Backward Compatibility Routes for old frontend layouts ──
router.get('/reports/rfq-status', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), getProcurement);
router.get('/reports/approvals', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), getApprovals);
router.get('/reports/monthly-trends', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), getTrends);

export default router;
