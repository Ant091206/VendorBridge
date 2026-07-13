import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  getAllRFQs,
  getRFQById,
  createRFQ,
  updateRFQ,
  deleteRFQ,
  closeRFQ,
  patchRFQStatusController,
  getRFQVendors,
  getMyRFQs,
  addRFQItem,
  updateRFQItem,
  deleteRFQItem,
  assignRFQVendors,
  removeRFQVendor,
  addRFQAttachment,
  deleteRFQAttachment
} from '../controllers/rfqController.js';

const router = express.Router();

// General RFQ routes
router.get('/rfqs', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getAllRFQs);
router.get('/vendor/my-rfqs', verifyToken, restrictTo('vendor'), getMyRFQs);
router.get('/vendor/rfqs', verifyToken, restrictTo('vendor'), getMyRFQs);
router.get('/vendor/rfqs/:id', verifyToken, restrictTo('vendor'), getRFQById);
router.get('/rfqs/:id', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getRFQById);

router.post('/rfqs', verifyToken, restrictTo('admin', 'officer'), createRFQ);
router.put('/rfqs/:id', verifyToken, restrictTo('admin', 'officer'), updateRFQ);
router.delete('/rfqs/:id', verifyToken, restrictTo('admin'), deleteRFQ);
router.patch('/rfqs/:id/status', verifyToken, restrictTo('admin', 'officer'), patchRFQStatusController);

// Item sub-resource routes
router.post('/rfqs/:id/items', verifyToken, restrictTo('admin', 'officer'), addRFQItem);
router.put('/rfq-items/:id', verifyToken, restrictTo('admin', 'officer'), updateRFQItem);
router.delete('/rfq-items/:id', verifyToken, restrictTo('admin', 'officer'), deleteRFQItem);

// Vendor assignment sub-resource routes
router.get('/rfqs/:id/vendors', verifyToken, restrictTo('admin', 'officer', 'manager'), getRFQVendors);
router.post('/rfqs/:id/vendors', verifyToken, restrictTo('admin', 'officer'), assignRFQVendors);
router.delete('/rfqs/:id/vendors/:vendorId', verifyToken, restrictTo('admin', 'officer'), removeRFQVendor);

// Attachment sub-resource routes
router.post('/rfqs/:id/attachments', verifyToken, restrictTo('admin', 'officer'), upload.single('file'), addRFQAttachment);
router.delete('/rfq-attachments/:id', verifyToken, restrictTo('admin', 'officer'), deleteRFQAttachment);

// Backward compatibility or quick action routes
router.post('/rfqs/:id/close', verifyToken, restrictTo('admin', 'officer'), closeRFQ);
router.put('/rfqs/:id/close', verifyToken, restrictTo('admin', 'officer'), closeRFQ);

export default router;
