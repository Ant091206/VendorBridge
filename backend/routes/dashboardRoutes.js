import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getAdminDashboard,
  getOfficerDashboard,
  getManagerDashboard,
  getVendorDashboard
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/dashboard/admin', verifyToken, restrictTo('admin'), getAdminDashboard);
router.get('/dashboard/officer', verifyToken, restrictTo('officer', 'admin'), getOfficerDashboard);
router.get('/dashboard/manager', verifyToken, restrictTo('manager', 'admin'), getManagerDashboard);
router.get('/dashboard/vendor', verifyToken, restrictTo('vendor', 'admin'), getVendorDashboard);

export default router;
