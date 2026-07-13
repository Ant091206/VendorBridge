import express from 'express';
import { register, login, logout, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validate, rules } from '../middleware/validateRequest.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { changePassword } from '../controllers/userController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Public — Self-registration for officer, manager, vendor roles.
 * Admin accounts are created via the admin panel only.
 */
router.post('/register',
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email'),
    rules.required('password'),
    rules.strongPassword('password'),
    rules.required('role'),
    rules.oneOf('role', ['officer', 'manager', 'vendor']),
    rules.phone('phone')
  ]),
  register
);

/**
 * POST /api/auth/login
 * Public — Authenticate and receive JWT token.
 */
router.post('/login',
  validate([
    rules.required('email'),
    rules.email('email'),
    rules.required('password')
  ]),
  login
);

/**
 * POST /api/auth/logout
 * Protected — Acknowledge logout (client clears token).
 */
router.post('/logout', verifyToken, logout);

/**
 * POST /api/auth/forgot-password
 * Public — Request a password reset link via email.
 */
router.post('/forgot-password',
  validate([
    rules.required('email'),
    rules.email('email')
  ]),
  forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Public — Reset password using a valid token.
 */
router.post('/reset-password',
  validate([
    rules.required('token'),
    rules.required('password'),
    rules.strongPassword('password'),
    rules.required('confirmPassword')
  ]),
  resetPassword
);

/**
 * PUT /api/auth/change-password
 * Protected — Change password (requires current password).
 * Alias for /api/profile/change-password as per spec.
 */
router.put('/change-password',
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
