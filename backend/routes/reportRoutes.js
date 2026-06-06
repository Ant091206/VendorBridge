import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getSummaryReport,
  getVendorsReport,
  getSpendingReport,
  exportCSVReport,
  exportExcelReport,
  exportPDFReport
} from '../controllers/reportController.js';

const router = express.Router();

// Report data endpoints
router.get('/reports/summary', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getSummaryReport);
router.get('/reports/vendors', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getVendorsReport);
router.get('/reports/spending', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getSpendingReport);

// Exports
router.get('/reports/export/csv', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), exportCSVReport);
router.get('/reports/export/excel', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), exportExcelReport);
router.get('/reports/export/pdf', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), exportPDFReport);

export default router;
