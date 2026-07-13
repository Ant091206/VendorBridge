import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createPO,
  getAllPOs,
  getPOById,
  updatePO,
  deletePO,
  issuePO,
  cancelPO,
  acknowledgePO,
  updateStatusManual,
  getHistoryTimeline
} from '../controllers/purchaseOrderController.js';

const router = express.Router();

// ── Vendor Scoped Routes (Placed above parameter routes to prevent collision) ──
router.get(
  '/vendor/purchase-orders',
  verifyToken,
  restrictTo('vendor'),
  getAllPOs
);

router.get(
  '/vendor/purchase-orders/:id',
  verifyToken,
  restrictTo('vendor'),
  getPOById
);

// ── Standard Purchase Order Routes ──
router.post(
  '/purchase-orders',
  verifyToken,
  restrictTo('officer', 'admin'),
  createPO
);

router.get(
  '/purchase-orders',
  verifyToken,
  restrictTo('officer', 'admin', 'manager', 'finance'),
  getAllPOs
);

router.get(
  '/purchase-orders/:id',
  verifyToken,
  restrictTo('officer', 'admin', 'manager', 'finance', 'vendor'),
  getPOById
);

router.put(
  '/purchase-orders/:id',
  verifyToken,
  restrictTo('officer', 'admin'),
  updatePO
);

router.delete(
  '/purchase-orders/:id',
  verifyToken,
  restrictTo('officer', 'admin'),
  deletePO
);

router.patch(
  '/purchase-orders/:id/issue',
  verifyToken,
  restrictTo('officer', 'admin'),
  issuePO
);

router.patch(
  '/purchase-orders/:id/cancel',
  verifyToken,
  restrictTo('officer', 'admin'),
  cancelPO
);

router.patch(
  '/purchase-orders/:id/status',
  verifyToken,
  restrictTo('officer', 'admin'),
  updateStatusManual
);

router.patch(
  '/purchase-orders/:id/acknowledge',
  verifyToken,
  restrictTo('vendor'),
  acknowledgePO
);

router.get(
  '/purchase-orders/:id/history',
  verifyToken,
  restrictTo('officer', 'admin', 'manager', 'finance', 'vendor'),
  getHistoryTimeline
);

export default router;
