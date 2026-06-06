import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/userController.js';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import { validate, rules } from '../middleware/validateRequest.js';

const router = express.Router();

// ══════════════════════════════════════════════
//  ADMIN USER MANAGEMENT ROUTES
//  All routes require: verifyToken + restrictTo('admin')
// ══════════════════════════════════════════════

/**
 * GET /api/users
 * Admin — List all users with pagination, search, and filters.
 */
router.get('/users', verifyToken, restrictTo('admin'), getAllUsers);

/**
 * GET /api/users/:id
 * Admin — Get a single user by ID.
 */
router.get('/users/:id', verifyToken, restrictTo('admin'), getUserById);

/**
 * POST /api/users
 * Admin — Create a new user (can assign any role including admin).
 */
router.post('/users',
  verifyToken,
  restrictTo('admin'),
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email'),
    rules.required('password'),
    rules.minLength('password', 8),
    rules.required('role'),
    rules.oneOf('role', ['admin', 'officer', 'manager', 'vendor'])
  ]),
  createUser
);

/**
 * PUT /api/users/:id
 * Admin — Update an existing user.
 */
router.put('/users/:id',
  verifyToken,
  restrictTo('admin'),
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email'),
    rules.required('role'),
    rules.oneOf('role', ['admin', 'officer', 'manager', 'vendor'])
  ]),
  updateUser
);

/**
 * DELETE /api/users/:id
 * Admin — Soft-delete (deactivate) a user.
 */
router.delete('/users/:id', verifyToken, restrictTo('admin'), deleteUser);

// ══════════════════════════════════════════════
//  PROFILE ROUTES (Self-service)
//  All routes require: verifyToken (any authenticated user)
// ══════════════════════════════════════════════

/**
 * GET /api/profile
 * Authenticated — Get own profile information.
 */
router.get('/profile', verifyToken, getProfile);

/**
 * PUT /api/profile
 * Authenticated — Update own name and email.
 */
router.put('/profile',
  verifyToken,
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email')
  ]),
  updateProfile
);

/**
 * PUT /api/profile/change-password
 * Authenticated — Change own password (requires current password).
 */
router.put('/profile/change-password',
  verifyToken,
  validate([
    rules.required('currentPassword'),
    rules.required('newPassword'),
    rules.minLength('newPassword', 8),
    rules.required('confirmPassword')
  ]),
  changePassword
);

export default router;
