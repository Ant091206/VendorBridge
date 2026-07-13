import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getComparison,
  logComparison,
  createSelection,
  getSelection,
  updateSelection,
  getHistory
} from '../controllers/comparisonController.js';

const router = express.Router();

// ── Comparison routes ──
// GET /api/comparisons/rfq/:rfqId
router.get(
  '/comparisons/rfq/:rfqId',
  verifyToken,
  restrictTo('admin', 'officer', 'manager'),
  getComparison
);

// POST /api/comparisons/rfq/:rfqId
router.post(
  '/comparisons/rfq/:rfqId',
  verifyToken,
  restrictTo('admin', 'officer'),
  logComparison
);

// ── Selection routes ──
// POST /api/selections
router.post(
  '/selections',
  verifyToken,
  restrictTo('admin', 'officer'),
  createSelection
);

// GET /api/selections/:rfqId
router.get(
  '/selections/:rfqId',
  verifyToken,
  restrictTo('admin', 'officer', 'manager'),
  getSelection
);

// PATCH /api/selections/:id
router.patch(
  '/selections/:id',
  verifyToken,
  restrictTo('admin', 'officer'),
  updateSelection
);

// ── Comparison History route ──
// GET /api/comparisons/history/:rfqId
router.get(
  '/comparisons/history/:rfqId',
  verifyToken,
  restrictTo('admin', 'officer', 'manager'),
  getHistory
);

export default router;
