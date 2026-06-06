import crypto from 'crypto';
import db from '../config/db.js';
import { sendEmail } from './emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a cryptographically secure random token for password reset.
 * @returns {string} 64-character hex token
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Store a password reset token in the database.
 * Invalidates any previous unused tokens for the same user.
 *
 * @param {number} userId - The user's ID
 * @param {string} token - The generated reset token
 * @returns {Promise<void>}
 */
export const storeResetToken = async (userId, token) => {
  // Invalidate any existing unused tokens for this user
  await db.execute(
    'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE',
    [userId]
  );

  // Calculate expiry (1 hour from now)
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.execute(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
};

/**
 * Validate a password reset token.
 * Checks existence, expiry, and whether it has already been used.
 *
 * @param {string} token - The reset token to validate
 * @returns {Promise<object|null>} Token record with user_id, or null if invalid
 */
export const validateResetToken = async (token) => {
  const [rows] = await db.execute(
    `SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email, u.name
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = ?`,
    [token]
  );

  if (rows.length === 0) {
    return null;
  }

  const record = rows[0];

  // Check if token has been used
  if (record.used) {
    return null;
  }

  // Check if token has expired
  if (new Date(record.expires_at) < new Date()) {
    return null;
  }

  return record;
};

/**
 * Mark a password reset token as used (single-use enforcement).
 *
 * @param {string} token - The reset token to invalidate
 * @returns {Promise<void>}
 */
export const invalidateResetToken = async (token) => {
  await db.execute(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
    [token]
  );
};

/**
 * Send a password reset email to the user.
 * In development mode, the reset link is logged to the console.
 *
 * @param {string} email - Recipient email address
 * @param {string} name - User's display name
 * @param {string} token - The reset token
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  // Always log the reset link in development for easy testing
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n══════════════════════════════════════════════');
    console.log('  PASSWORD RESET LINK (Development Mode)');
    console.log('══════════════════════════════════════════════');
    console.log(`  User:  ${name} (${email})`);
    console.log(`  Link:  ${resetLink}`);
    console.log(`  Token: ${token}`);
    console.log(`  Expires: ${TOKEN_EXPIRY_HOURS} hour(s)`);
    console.log('══════════════════════════════════════════════\n');
  }

  const subject = 'Password Reset Request — VendorBridge';
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
          Vendor<span style="opacity: 0.9;">Bridge</span>
        </h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">
          Procurement & Vendor Management ERP
        </p>
      </div>
      
      <div style="padding: 32px 24px; color: #e2e8f0;">
        <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px;">Password Reset Request</h2>
        <p style="margin: 0 0 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
        <p style="margin: 0 0 24px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
          This link will expire in <strong>${TOKEN_EXPIRY_HOURS} hour</strong>.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #ffffff; 
                    text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset My Password
          </a>
        </div>
        
        <p style="margin: 24px 0 8px; font-size: 13px; color: #94a3b8;">
          If the button doesn't work, copy and paste this URL into your browser:
        </p>
        <p style="margin: 0; font-size: 12px; word-break: break-all; color: #06b6d4;">
          ${resetLink}
        </p>
        
        <hr style="border: none; border-top: 1px solid #1e293b; margin: 32px 0;" />
        
        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will remain unchanged.
        </p>
      </div>
      
      <div style="background: #020617; padding: 16px 24px; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #475569;">
          © ${new Date().getFullYear()} VendorBridge ERP. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return sendEmail(email, subject, htmlBody);
};
