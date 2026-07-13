import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  submitRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  getHistory,
  getManagerQueue,
  getManagerPendingQueue
} from '../controllers/approvalController.js';

const router = express.Router();

// ── Approval Request Operations ──

// POST /api/approvals - Create Approval Request (Admin, Officer)
router.post(
  '/approvals',
  verifyToken,
  restrictTo('admin', 'officer'),
  createRequest
);

// GET /api/approvals - List Approval Requests (Admin, Officer, Manager)
router.get(
  '/approvals',
  verifyToken,
  restrictTo('admin', 'officer', 'manager'),
  getRequests
);

// GET /api/approvals/:id - Get Single Approval Details (Admin, Officer, Manager)
router.get(
  '/approvals/:id',
  verifyToken,
  restrictTo('admin', 'officer', 'manager'),
  getRequestById
);

// PUT /api/approvals/:id - Update Draft Approval Request (Admin, Officer)
router.put(
  '/approvals/:id',
  verifyToken,
  restrictTo('admin', 'officer'),
  updateRequest
);

// PATCH /api/approvals/:id/submit - Submit Request (Admin, Officer)
router.patch(
  '/approvals/:id/submit',
  verifyToken,
  restrictTo('admin', 'officer'),
  submitRequest
);

// PATCH /api/approvals/:id/approve - Approve Request (Admin, Manager)
router.patch(
  '/approvals/:id/approve',
  verifyToken,
  restrictTo('admin', 'manager'),
  approveRequest
);

// PATCH /api/approvals/:id/reject - Reject Request (Admin, Manager)
router.patch(
  '/approvals/:id/reject',
  verifyToken,
  restrictTo('admin', 'manager'),
  rejectRequest
);

// PATCH /api/approvals/:id/cancel - Cancel Request (Admin, Officer)
router.patch(
  '/approvals/:id/cancel',
  verifyToken,
  restrictTo('admin', 'officer'),
  cancelRequest
);

// GET /api/approvals/:id/history - Get Timeline History (Admin, Officer, Manager)
router.get(
  '/approvals/:id/history',
  verifyToken,
  restrictTo('admin', 'officer', 'manager'),
  getHistory
);

// ── Manager Queue Operations ──

// GET /api/manager/approvals - List Assigned Approvals (Admin, Manager)
router.get(
  '/manager/approvals',
  verifyToken,
  restrictTo('admin', 'manager'),
  getManagerQueue
);

// GET /api/manager/approvals/pending - List Assigned Pending Approvals (Admin, Manager)
router.get(
  '/manager/approvals/pending',
  verifyToken,
  restrictTo('admin', 'manager'),
  getManagerPendingQueue
);

export default router;
