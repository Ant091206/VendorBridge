/**
 * quotationRoutes.js — API routing for Module 4 quotations
 */

import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  getAllQuotations,
  getQuotationById,
  submitQuotation,
  updateQuotation,
  deleteQuotation,
  submitQuotationStatus,
  withdrawQuotationStatus,
  getMyQuotations,
  getQuotationsByRFQ,
  addQuotationItem,
  updateQuotationItem,
  deleteQuotationItem,
  addQuotationAttachment,
  deleteQuotationAttachment
} from '../controllers/quotationController.js';

const router = express.Router();

// ── Vendor specific endpoints ──
router.get('/quotations/my-quotations', verifyToken, restrictTo('vendor'), getMyQuotations);

// ── Officer/Admin specific endpoints ──
router.get('/quotations/rfq/:rfq_id', verifyToken, restrictTo('admin', 'officer'), getQuotationsByRFQ);

// ── General Quotation CRUD endpoints ──
router.get('/quotations', verifyToken, restrictTo('admin', 'officer', 'manager'), getAllQuotations);
router.get('/quotations/:id', verifyToken, getQuotationById);
router.post('/quotations', verifyToken, restrictTo('vendor'), submitQuotation);
router.put('/quotations/:id', verifyToken, restrictTo('vendor'), updateQuotation);
router.delete('/quotations/:id', verifyToken, restrictTo('admin', 'vendor'), deleteQuotation);

// ── Custom quick status actions ──
router.patch('/quotations/:id/submit', verifyToken, restrictTo('vendor'), submitQuotationStatus);
router.patch('/quotations/:id/withdraw', verifyToken, restrictTo('vendor'), withdrawQuotationStatus);

// ── Item sub-resource routes ──
router.post('/quotations/:id/items', verifyToken, restrictTo('vendor'), addQuotationItem);
router.put('/quotation-items/:id', verifyToken, restrictTo('vendor'), updateQuotationItem);
router.delete('/quotation-items/:id', verifyToken, restrictTo('vendor'), deleteQuotationItem);

// ── Attachment sub-resource routes ──
router.post('/quotations/:id/attachments', verifyToken, restrictTo('vendor'), upload.single('file'), addQuotationAttachment);
router.delete('/quotation-attachments/:id', verifyToken, restrictTo('vendor', 'admin'), deleteQuotationAttachment);

export default router;
