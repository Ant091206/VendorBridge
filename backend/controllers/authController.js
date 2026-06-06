import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import {
  generateResetToken,
  storeResetToken,
  validateResetToken,
  invalidateResetToken,
  sendPasswordResetEmail
} from '../services/authService.js';
import dotenv from 'dotenv';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Handle user registration (Sign Up)
 * Route: POST /api/auth/register
 *
 * Self-registration allows roles: officer, manager, vendor.
 * Admin accounts can only be created via the admin user management panel.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required inputs
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields (name, email, password, role) are required.'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
    }

    // Validate password minimum length
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Validate role — prevent self-registration as admin
    const validRoles = ['officer', 'vendor', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Allowed roles for self-registration are: ${validRoles.join(', ')}`
      });
    }

    // Check for duplicate email
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into database
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [name, email, passwordHash, role]
    );

    const newUserId = result.insertId;

    // Generate JWT Token
    const payload = {
      id: newUserId,
      name,
      email,
      role,
      status: 'active'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error occurred during registration.'
    });
  }
};

/**
 * Handle user login (Sign In)
 * Route: POST /api/auth/login
 *
 * Validates credentials, checks account status, updates last_login timestamp.
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate required inputs
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Both email and password are required.'
      });
    }

    // Fetch user from DB
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Check account status
    if (!user.status || user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    // Update last_login timestamp
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT Token — longer expiry if "remember me" is checked
    const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    // Log Activity
    await logAndNotify(user.id, {
      action: 'USER_LOGGED_IN',
      module: 'Authentication',
      entityType: 'user',
      entityId: user.id,
      description: `User ${user.name} logged in successfully`,
      ipAddress: req.ip
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error occurred during login.'
    });
  }
};

/**
 * Handle user logout
 * Route: POST /api/auth/logout
 *
 * Since JWT is stateless, the server acknowledges the logout.
 * The client is responsible for clearing the stored token.
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.'
  });
};

/**
 * Handle forgot password request
 * Route: POST /api/auth/forgot-password
 *
 * Generates a password reset token and sends an email.
 * Always returns success to prevent email enumeration attacks.
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required.'
      });
    }

    // Lookup user
    const [users] = await db.execute(
      'SELECT id, name, email, status FROM users WHERE email = ?',
      [email]
    );

    // Always return the same response to prevent email enumeration
    if (users.length === 0 || users[0].status !== 'active') {
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];

    // Generate and store reset token
    const token = generateResetToken();
    await storeResetToken(user.id, token);

    // Send reset email (logs to console in development)
    await sendPasswordResetEmail(user.email, user.name, token);

    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred processing your request. Please try again later.'
    });
  }
};

/**
 * Handle password reset
 * Route: POST /api/auth/reset-password
 *
 * Validates the reset token and updates the user's password.
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token is required.'
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Both password and confirm password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match.'
      });
    }

    // Validate the reset token
    const tokenRecord = await validateResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update the user's password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, tokenRecord.user_id]
    );

    // Invalidate the used token
    await invalidateResetToken(token);

    return res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred resetting your password. Please try again later.'
    });
  }
};
