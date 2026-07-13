import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getVendors,
  getRFQs,
  getQuotations,
  getApprovals,
  getPurchaseOrders,
  getInvoices,
  getSpending,
  getProcurementSummary,
  getAuditActivity,
  getHistory,
  exportCSVReport,
  exportExcelReport,
  exportPDFReport,
  getSummaryReport,
  getVendorsReport,
  getSpendingReport
} from '../controllers/reportController.js';

const router = express.Router();

// Report listing endpoints (staff roles only)
router.get('/reports/vendors', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getVendors);
router.get('/reports/rfqs', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getRFQs);
router.get('/reports/quotations', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getQuotations);
router.get('/reports/approvals', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getApprovals);
router.get('/reports/purchase-orders', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getPurchaseOrders);
router.get('/reports/invoices', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getInvoices);
router.get('/reports/spending', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getSpending);
router.get('/reports/procurement-summary', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getProcurementSummary);
router.get('/reports/audit-activity', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getAuditActivity);

// Export history
router.get('/reports/history', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), getHistory);

// Dynamic Document Exports
router.get('/reports/export/pdf', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), exportPDFReport);
router.get('/reports/export/excel', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), exportExcelReport);
router.get('/reports/export/csv', verifyToken, restrictTo('admin', 'officer', 'manager', 'finance'), exportCSVReport);

// ── Backward Compatibility Routes for old frontend layouts ──
router.get('/reports/summary', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), getSummaryReport);
router.get('/reports/export/csv', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), exportCSVReport);
router.get('/reports/export/excel', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), exportExcelReport);
router.get('/reports/export/pdf', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor', 'finance'), exportPDFReport);

export default router;
