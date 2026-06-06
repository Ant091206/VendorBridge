import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { validate, rules } from '../middleware/validateRequest.js';
import {
  submitQuotation,
  updateQuotation,
  getMyQuotations,
  getQuotationsByRFQ,
  getQuotationById,
  selectQuotation,
  getAllQuotations
} from '../controllers/quotationController.js';

const router = express.Router();

// POST /api/quotations - Vendor submits a new quotation (vendor only)
router.post('/quotations', 
  verifyToken, 
  restrictTo('vendor'), 
  validate([
    rules.required('rfq_id'),
    rules.required('unit_price'),
    rules.positiveNumber('unit_price'),
    rules.required('delivery_days'),
    rules.positiveNumber('delivery_days')
  ]),
  submitQuotation
);

// PUT /api/quotations/:id - Vendor updates their quotation details (vendor only)
router.put('/quotations/:id', 
  verifyToken, 
  restrictTo('vendor'), 
  validate([
    rules.required('unit_price'),
    rules.positiveNumber('unit_price'),
    rules.required('delivery_days'),
    rules.positiveNumber('delivery_days')
  ]),
  updateQuotation
);

// GET /api/quotations/my-quotations - Returns list of quotations submitted by logged-in vendor (vendor only)
router.get('/quotations/my-quotations', verifyToken, restrictTo('vendor'), getMyQuotations);

// GET /api/quotations/rfq/:rfq_id - Returns all bids submitted for a specific RFQ (admin, officer only)
router.get('/quotations/rfq/:rfq_id', verifyToken, restrictTo('admin', 'officer'), getQuotationsByRFQ);

// GET /api/quotations - Returns all quotations in the system (admin, officer only)
router.get('/quotations', verifyToken, restrictTo('admin', 'officer'), getAllQuotations);

// GET /api/quotations/:id - Returns details of a single quotation (admin, officer, or submitting vendor)
router.get('/quotations/:id', verifyToken, getQuotationById);

// PUT /api/quotations/:id/select - Officer marks quotation as chosen winner (officer only)
router.put('/quotations/:id/select', verifyToken, restrictTo('officer'), selectQuotation);


export default router;
