import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { getComparison, selectVendor } from '../controllers/comparisonController.js';

const router = express.Router();

// ── Comparison endpoints (Admin, Officer, or Manager roles can view) ──
router.get('/rfqs/:id/comparison', verifyToken, restrictTo('admin', 'officer', 'manager'), getComparison);

// ── Selection endpoints (Only Officers or Admin can choose the winner) ──
router.post('/rfqs/:id/select-vendor', verifyToken, restrictTo('admin', 'officer'), selectVendor);

export default router;
