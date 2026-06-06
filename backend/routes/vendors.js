import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createVendor,
  deleteVendor,
  getAllVendors,
  getVendorById,
  updateVendor
} from '../controllers/vendorController.js';

const router = express.Router();

router.get('/vendors', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getAllVendors);
router.get('/vendors/:id', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getVendorById);
router.post('/vendors', verifyToken, restrictTo('admin', 'officer'), createVendor);
router.put('/vendors/:id', verifyToken, restrictTo('admin', 'officer'), updateVendor);
router.delete('/vendors/:id', verifyToken, restrictTo('admin'), deleteVendor);

export default router;
