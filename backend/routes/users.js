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
    rules.strongPassword('password'),
    rules.required('role'),
    rules.oneOf('role', ['admin', 'officer', 'manager', 'vendor']),
    rules.phone('phone')
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
    rules.oneOf('role', ['admin', 'officer', 'manager', 'vendor']),
    rules.phone('phone')
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
 * GET /api/users/profile
 * Authenticated — Alias for /api/profile (spec compliance).
 */
router.get('/users/profile', verifyToken, getProfile);

/**
 * PUT /api/profile
 * Authenticated — Update own name, email, and phone.
 */
router.put('/profile',
  verifyToken,
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email'),
    rules.phone('phone')
  ]),
  updateProfile
);

/**
 * PUT /api/users/profile
 * Authenticated — Alias for /api/profile (spec compliance).
 */
router.put('/users/profile',
  verifyToken,
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email'),
    rules.phone('phone')
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
    rules.strongPassword('newPassword'),
    rules.required('confirmPassword')
  ]),
  changePassword
);

export default router;
