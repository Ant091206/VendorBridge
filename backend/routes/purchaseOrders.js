import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { validate, rules } from '../middleware/validateRequest.js';
import {
  getAllPurchaseOrders,
  getMyPurchaseOrders,
  getPurchaseOrderById,
  updatePOStatus
} from '../controllers/purchaseOrderController.js';

const router = express.Router();

// GET /api/purchase-orders - Return all POs (officer, admin, and manager only)
router.get('/purchase-orders', verifyToken, restrictTo('officer', 'admin', 'manager'), getAllPurchaseOrders);

// GET /api/purchase-orders/vendor/my-orders - Return vendor-specific POs (vendor only)
// Note: Placed above /purchase-orders/:id to prevent parameter collision
router.get('/purchase-orders/vendor/my-orders', verifyToken, restrictTo('vendor'), getMyPurchaseOrders);

// GET /api/purchase-orders/:id - Return details of a single PO (officer, admin, manager, or owner vendor)
router.get('/purchase-orders/:id', verifyToken, getPurchaseOrderById);

// PUT /api/purchase-orders/:id/status - Update PO status (officer, admin, and manager only)
router.put('/purchase-orders/:id/status', 
  verifyToken, 
  restrictTo('officer', 'admin', 'manager'), 
  validate([
    rules.required('status'),
    rules.oneOf('status', ['sent', 'completed'])
  ]),
  updatePOStatus
);

export default router;
