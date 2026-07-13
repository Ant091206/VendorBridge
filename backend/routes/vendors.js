import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createVendor,
  deleteVendor,
  generateCode,
  getAllVendors,
  getVendorById,
  patchVendorStatusController,
  updateVendor
} from '../controllers/vendorController.js';

const router = express.Router();

router.get('/vendors', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getAllVendors);
router.get('/vendors/generate-code', verifyToken, restrictTo('admin', 'officer'), generateCode);
router.get('/vendors/:id', verifyToken, restrictTo('admin', 'officer', 'manager', 'vendor'), getVendorById);
router.post('/vendors', verifyToken, restrictTo('admin', 'officer'), createVendor);
router.put('/vendors/:id', verifyToken, restrictTo('admin', 'officer'), updateVendor);
router.patch('/vendors/:id/status', verifyToken, restrictTo('admin'), patchVendorStatusController);
router.delete('/vendors/:id', verifyToken, restrictTo('admin'), deleteVendor);

export default router;
