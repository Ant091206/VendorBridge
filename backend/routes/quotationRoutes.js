import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getAllQuotations,
  getQuotationById,
  submitQuotation,
  updateQuotation,
  deleteQuotation,
  getMyQuotations,
  getQuotationsByRFQ
} from '../controllers/quotationController.js';

const router = express.Router();

// ── Vendor specific endpoints (Must be vendor role) ──
router.get('/quotations/my-quotations', verifyToken, restrictTo('vendor'), getMyQuotations);

// ── Officer/Admin specific endpoints ──
router.get('/quotations/rfq/:rfq_id', verifyToken, restrictTo('admin', 'officer'), getQuotationsByRFQ);

// ── Generic CRUD endpoints with custom path-level auth guards ──
router.get('/quotations', verifyToken, restrictTo('admin', 'officer'), getAllQuotations);
router.get('/quotations/:id', verifyToken, getQuotationById);
router.post('/quotations', verifyToken, restrictTo('vendor'), submitQuotation);
router.put('/quotations/:id', verifyToken, restrictTo('vendor'), updateQuotation);
router.delete('/quotations/:id', verifyToken, restrictTo('admin', 'vendor'), deleteQuotation);

export default router;
