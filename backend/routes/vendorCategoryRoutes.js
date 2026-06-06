import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory
} from '../controllers/vendorCategoryController.js';

const router = express.Router();

router.get('/vendor-categories', verifyToken, restrictTo('admin', 'officer', 'manager'), getAllCategories);
router.post('/vendor-categories', verifyToken, restrictTo('admin', 'officer'), createCategory);
router.put('/vendor-categories/:id', verifyToken, restrictTo('admin', 'officer'), updateCategory);
router.delete('/vendor-categories/:id', verifyToken, restrictTo('admin'), deleteCategory);

export default router;
