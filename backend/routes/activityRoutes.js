import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { getAllActivity, getActivityById } from '../controllers/activityController.js';

const router = express.Router();

// GET /api/activity - Fetch all activity logs (restricted to admin)
router.get('/activity', verifyToken, restrictTo('admin'), getAllActivity);

// GET /api/activity/:id - Fetch details of a specific log (restricted to admin)
router.get('/activity/:id', verifyToken, restrictTo('admin'), getActivityById);

export default router;
