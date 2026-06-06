import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  closeRFQ,
  createRFQ,
  deleteRFQ,
  getAllRFQs,
  getMyRFQs,
  getRFQById,
  getRFQVendors,
  updateRFQ
} from '../controllers/rfqController.js';

const router = express.Router();

router.get('/rfqs', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getAllRFQs);
router.get('/rfqs/:id', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getRFQById);
router.post('/rfqs', verifyToken, restrictTo('admin', 'officer'), createRFQ);
router.put('/rfqs/:id', verifyToken, restrictTo('admin', 'officer'), updateRFQ);
router.delete('/rfqs/:id', verifyToken, restrictTo('admin', 'officer'), deleteRFQ);
router.post('/rfqs/:id/close', verifyToken, restrictTo('admin', 'officer'), closeRFQ);
router.put('/rfqs/:id/close', verifyToken, restrictTo('admin', 'officer'), closeRFQ);
router.get('/rfqs/:id/vendors', verifyToken, restrictTo('admin', 'officer', 'manager'), getRFQVendors);

router.get('/vendor/my-rfqs', verifyToken, restrictTo('vendor'), getMyRFQs);

export default router;
