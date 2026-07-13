import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createInvoiceHandler,
  getAllInvoicesHandler,
  getInvoiceByIdHandler,
  updateInvoiceHandler,
  deleteInvoiceHandler,
  generateInvoiceHandler,
  cancelInvoiceHandler,
  markPaidHandler,
  downloadPDFHandler,
  sendEmailHandler,
  getHistoryHandler,
  getEmailHistoryHandler,
  getMyInvoicesHandler
} from '../controllers/invoiceController.js';

const router = express.Router();

// ── Vendor-scoped routes ──────────────────────────────────────────────────────
// GET /api/invoices/vendor/my-invoices
router.get('/invoices/vendor/my-invoices',
  verifyToken, restrictTo('vendor'), getMyInvoicesHandler);

// ── Core CRUD ─────────────────────────────────────────────────────────────────
// POST /api/invoices — Create draft invoice from PO
router.post('/invoices',
  verifyToken, restrictTo('finance', 'admin'), createInvoiceHandler);

// GET /api/invoices — List all invoices (paginated, filtered)
router.get('/invoices',
  verifyToken, restrictTo('finance', 'admin'), getAllInvoicesHandler);

// GET /api/invoices/:id — Full invoice detail
router.get('/invoices/:id',
  verifyToken, restrictTo('finance', 'admin', 'vendor'), getInvoiceByIdHandler);

// PUT /api/invoices/:id — Update draft invoice
router.put('/invoices/:id',
  verifyToken, restrictTo('finance', 'admin'), updateInvoiceHandler);

// DELETE /api/invoices/:id — Delete draft invoice
router.delete('/invoices/:id',
  verifyToken, restrictTo('finance', 'admin'), deleteInvoiceHandler);

// ── Workflow Actions ──────────────────────────────────────────────────────────
// PATCH /api/invoices/:id/generate — Finalize draft → Generated
router.patch('/invoices/:id/generate',
  verifyToken, restrictTo('finance', 'admin'), generateInvoiceHandler);

// PATCH /api/invoices/:id/cancel — Cancel invoice
router.patch('/invoices/:id/cancel',
  verifyToken, restrictTo('finance', 'admin'), cancelInvoiceHandler);

// PATCH /api/invoices/:id/mark-paid — Mark invoice as paid
router.patch('/invoices/:id/mark-paid',
  verifyToken, restrictTo('finance', 'admin'), markPaidHandler);

// ── Document Operations ───────────────────────────────────────────────────────
// GET /api/invoices/:id/pdf — Download PDF (officer, admin, owning vendor)
router.get('/invoices/:id/pdf',
  verifyToken, restrictTo('finance', 'admin', 'vendor'), downloadPDFHandler);

// POST /api/invoices/:id/send-email — Email invoice to vendor
router.post('/invoices/:id/send-email',
  verifyToken, restrictTo('finance', 'admin'), sendEmailHandler);

// ── History & Audit ───────────────────────────────────────────────────────────
// GET /api/invoices/:id/history — Audit timeline
router.get('/invoices/:id/history',
  verifyToken, restrictTo('finance', 'admin'), getHistoryHandler);

// GET /api/invoices/:id/email-history — Email dispatch log
router.get('/invoices/:id/email-history',
  verifyToken, restrictTo('finance', 'admin'), getEmailHistoryHandler);

export default router;
