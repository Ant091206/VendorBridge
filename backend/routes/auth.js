import express from 'express';
import { register, login, logout, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validate, rules } from '../middleware/validateRequest.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Public — Self-registration for officer, manager, vendor roles.
 */
router.post('/register',
  validate([
    rules.required('name'),
    rules.required('email'),
    rules.email('email'),
    rules.required('password'),
    rules.minLength('password', 8),
    rules.required('role'),
    rules.oneOf('role', ['officer', 'manager', 'vendor'])
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
    rules.minLength('password', 8),
    rules.required('confirmPassword')
  ]),
  resetPassword
);

export default router;
