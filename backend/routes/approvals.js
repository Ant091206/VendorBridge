import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { validate, rules } from '../middleware/validateRequest.js';
import {
  getAllApprovals,
  getPendingApprovals,
  getApprovalById,
  approveRequest,
  rejectRequest
} from '../controllers/approvalController.js';

const router = express.Router();

// GET /api/approvals - Return all approvals (manager and admin only)
router.get('/approvals', verifyToken, restrictTo('manager', 'admin'), getAllApprovals);

// GET /api/approvals/pending - Return pending approvals only (manager and admin only)
// Note: Placed above /approvals/:id to prevent parameter collision
router.get('/approvals/pending', verifyToken, restrictTo('manager', 'admin'), getPendingApprovals);

// GET /api/approvals/:id - Return details of a single approval (manager and admin only)
router.get('/approvals/:id', verifyToken, restrictTo('manager', 'admin'), getApprovalById);

// PUT /api/approvals/:id/approve - Approve request & auto-generate PO (manager and admin only)
router.put('/approvals/:id/approve', verifyToken, restrictTo('manager', 'admin'), approveRequest);

// PUT /api/approvals/:id/reject - Reject request & revert statuses (manager and admin only)
router.put('/approvals/:id/reject', 
  verifyToken, 
  restrictTo('manager', 'admin'), 
  validate([
    rules.required('remarks')
  ]),
  rejectRequest
);

export default router;
