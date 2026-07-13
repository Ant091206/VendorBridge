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
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  return { valid: true, message: '' };
};

export const register = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { name, email, phone, password, role, company, department, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, password, and role are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
    }

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ status: 'error', message: pwCheck.message });
    }

    const validRoles = ['officer', 'vendor', 'manager', 'finance', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Allowed roles for registration are: ${validRoles.join(', ')}`
      });
    }

    const [existingByEmail] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingByEmail.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
    }

    let phoneClean = null;
    if (phone && phone.trim() !== '') {
      phoneClean = phone.trim();
      if (!/^\+?[\d\s\-().]{7,20}$/.test(phoneClean)) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide a valid phone number.'
        });
      }
      const [existingByPhone] = await conn.execute(
        'SELECT user_id FROM profiles WHERE phone = ?',
        [phoneClean]
      );
      if (existingByPhone.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'A user with this phone number already exists.'
        });
      }
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO users (full_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role]
    );

    const newUserId = result.insertId;

    await conn.execute(
      `INSERT INTO profiles (user_id, phone, company, department, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        newUserId,
        phoneClean,
        company ? company.trim() : null,
        department ? department.trim() : null,
        address ? address.trim() : null
      ]
    );

    await conn.commit();

    const payload = {
      id: newUserId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      status: 'active'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    try {
      await logAndNotify(newUserId, {
        action: 'USER_REGISTERED',
        module: 'Authentication',
        entityType: 'user',
        entityId: newUserId,
        description: `New user ${name.trim()} registered with role: ${role}`,
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully.',
      token,
      user: payload
    });
  } catch (error) {
    await conn.rollback();
    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error occurred during registration.'
    });
  } finally {
    conn.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Both email and password are required.'
      });
    }

    const [users] = await db.execute(
      'SELECT id, full_name, email, password_hash, role, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    if (!user.status || user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been suspended. Please contact an administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    const [sessionResult] = await db.execute(
      'INSERT INTO sessions (user_id, login_time) VALUES (?, NOW())',
      [user.id]
    );
    const sessionId = sessionResult.insertId;

    // Longer token expiry when "remember me" is enabled
    const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const payload = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      sessionId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    try {
      await logAndNotify(user.id, {
        action: 'USER_LOGGED_IN',
        module: 'Authentication',
        entityType: 'user',
        entityId: user.id,
        description: `User ${user.full_name} logged in successfully`,
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

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

export const logout = async (req, res) => {
  try {
    if (req.user) {
      await db.execute(
        'UPDATE sessions SET logout_time = NOW() WHERE user_id = ? AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1',
        [req.user.id]
      );

      try {
        await logAndNotify(req.user.id, {
          action: 'USER_LOGGED_OUT',
          module: 'Authentication',
          entityType: 'user',
          entityId: req.user.id,
          description: `User ${req.user.name} logged out`,
          ipAddress: req.ip
        });
      } catch (logErr) {
        console.warn('Audit log failed (non-fatal):', logErr.message);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Logout failed.'
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required.'
      });
    }

    const [users] = await db.execute(
      'SELECT id, full_name as name, email, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    // Always return success to prevent email enumeration
    if (users.length === 0 || users[0].status === 'inactive' || users[0].status === 'suspended') {
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];
    const token = generateResetToken();
    await storeResetToken(user.id, token);
    await sendPasswordResetEmail(user.email, user.name, token);

    try {
      await logAndNotify(user.id, {
        action: 'PASSWORD_RESET_REQUESTED',
        module: 'Authentication',
        entityType: 'user',
        entityId: user.id,
        description: `Password reset requested for ${user.email}`,
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

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

export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Reset token is required.' });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Both password and confirm password are required.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'Passwords do not match.' });
    }

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return res.status(400).json({ status: 'error', message: pwCheck.message });
    }

    const tokenRecord = await validateResetToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, tokenRecord.user_id]
    );

    await invalidateResetToken(token);

    try {
      await logAndNotify(tokenRecord.user_id, {
        action: 'PASSWORD_RESET_COMPLETED',
        module: 'Authentication',
        entityType: 'user',
        entityId: tokenRecord.user_id,
        description: 'Password was successfully reset via reset link',
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

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
