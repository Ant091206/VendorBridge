import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { validate, rules } from '../middleware/validateRequest.js';
import {
  generateInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicePDF,
  sendInvoiceEmail,
  updateInvoiceStatus,
  getMyInvoices
} from '../controllers/invoiceController.js';

const router = express.Router();

// POST /api/invoices/generate/:po_id - Generate invoice from PO (officer and admin only)
router.post('/invoices/generate/:po_id', verifyToken, restrictTo('officer', 'admin'), generateInvoice);

// GET /api/invoices - Return all invoices (officer and admin only)
router.get('/invoices', verifyToken, restrictTo('officer', 'admin'), getAllInvoices);

// GET /api/invoices/vendor/my-invoices - Return invoices for logged-in vendor (vendor only)
// Note: Placed above /invoices/:id to prevent parameter capture
router.get('/invoices/vendor/my-invoices', verifyToken, restrictTo('vendor'), getMyInvoices);

// GET /api/invoices/:id - Return single invoice full details (officer, admin, or owning vendor)
router.get('/invoices/:id', verifyToken, getInvoiceById);

// GET /api/invoices/:id/pdf - Stream invoice PDF file download (officer, admin, or owning vendor)
router.get('/invoices/:id/pdf', verifyToken, getInvoicePDF);

// POST /api/invoices/:id/send-email - Email invoice PDF to vendor (officer and admin only)
router.post('/invoices/:id/send-email', verifyToken, restrictTo('officer', 'admin'), sendInvoiceEmail);

// PUT /api/invoices/:id/status - Update invoice status (officer and admin only)
router.put('/invoices/:id/status', 
  verifyToken, 
  restrictTo('officer', 'admin'), 
  validate([
    rules.required('status'),
    rules.oneOf('status', ['sent', 'paid'])
  ]),
  updateInvoiceStatus
);

export default router;
