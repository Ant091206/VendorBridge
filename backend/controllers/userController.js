import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

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

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR p.phone LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role && ['admin', 'officer', 'manager', 'vendor', 'finance'].includes(role)) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      whereClause += ' AND u.status = ?';
      params.push(status);
    }

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users u LEFT JOIN profiles p ON u.id = p.user_id ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [users] = await db.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status, u.created_at, u.updated_at,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, String(limit), String(offset)]
    );

    return res.status(200).json({
      status: 'success',
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve users.' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status, u.created_at, u.updated_at,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    return res.status(200).json({ status: 'success', data: users[0] });
  } catch (error) {
    console.error('getUserById error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve user.' });
  }
};

export const createUser = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { name, email, phone, password, role, status: userStatus, company, department, address } = req.body;

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

    const validRoles = ['admin', 'officer', 'manager', 'vendor', 'finance'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    const finalStatus = userStatus || 'active';
    if (!['active', 'inactive', 'suspended'].includes(finalStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be active, inactive, or suspended.'
      });
    }

    const [existingByEmail] = await conn.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if (existingByEmail.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
    }

    const phoneValue = (phone && phone.trim() !== '') ? phone.trim() : null;
    if (phoneValue) {
      const [existingByPhone] = await conn.execute(
        'SELECT user_id FROM profiles WHERE phone = ?',
        [phoneValue]
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
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role, finalStatus]
    );

    const newUserId = result.insertId;

    await conn.execute(
      `INSERT INTO profiles (user_id, phone, company, department, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        newUserId,
        phoneValue,
        company ? company.trim() : null,
        department ? department.trim() : null,
        address ? address.trim() : null
      ]
    );

    await conn.commit();

    const [newUser] = await db.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status, u.created_at, u.updated_at,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [newUserId]
    );

    try {
      await logAndNotify(req.user.id, {
        action: 'USER_CREATED',
        module: 'User Management',
        entityType: 'user',
        entityId: newUserId,
        description: `Admin ${req.user.name} created user ${name.trim()} with role: ${role}`,
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

    return res.status(201).json({
      status: 'success',
      message: 'User created successfully.',
      data: newUser[0]
    });
  } catch (error) {
    await conn.rollback();
    console.error('createUser error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to create user.' });
  } finally {
    conn.release();
  }
};

export const updateUser = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { name, email, phone, role, status: userStatus, password, company, department, address } = req.body;

    const [existing] = await conn.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    if (!name || !email || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and role are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
    }

    const validRoles = ['admin', 'officer', 'manager', 'vendor', 'finance'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    const finalStatus = userStatus || 'active';
    if (!['active', 'inactive', 'suspended'].includes(finalStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be active, inactive, or suspended.'
      });
    }

    const emailClean = email.toLowerCase().trim();

    if (emailClean !== existing[0].email) {
      const [emailCheck] = await conn.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [emailClean, id]
      );
      if (emailCheck.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'A user with this email address already exists.'
        });
      }
    }

    const phoneValue = (phone && phone.trim() !== '') ? phone.trim() : null;
    if (phoneValue && phoneValue !== existing[0].phone) {
      const [phoneCheck] = await conn.execute(
        'SELECT user_id FROM profiles WHERE phone = ? AND user_id != ?',
        [phoneValue, id]
      );
      if (phoneCheck.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'A user with this phone number already exists.'
        });
      }
    }

    await conn.beginTransaction();

    let updateQuery = 'UPDATE users SET full_name = ?, email = ?, role = ?, status = ?';
    const updateParams = [name.trim(), emailClean, role, finalStatus];

    if (password && password.trim()) {
      const pwCheck = validatePasswordStrength(password);
      if (!pwCheck.valid) {
        await conn.rollback();
        return res.status(400).json({ status: 'error', message: pwCheck.message });
      }
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      updateQuery += ', password_hash = ?';
      updateParams.push(passwordHash);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await conn.execute(updateQuery, updateParams);

    await conn.execute(
      `INSERT INTO profiles (user_id, phone, company, department, address)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       phone = VALUES(phone), company = VALUES(company), department = VALUES(department), address = VALUES(address)`,
      [id, phoneValue, company || null, department || null, address || null]
    );

    await conn.commit();

    const [updated] = await db.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status, u.created_at, u.updated_at,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [id]
    );

    try {
      await logAndNotify(req.user.id, {
        action: 'USER_UPDATED',
        module: 'User Management',
        entityType: 'user',
        entityId: parseInt(id),
        description: `Admin ${req.user.name} updated user ${name.trim()}`,
        ipAddress: req.ip,
        oldValue: existing[0],
        newValue: {
          id: parseInt(id),
          name: name.trim(),
          email: emailClean,
          phone: phoneValue,
          role,
          status: finalStatus
        }
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    await conn.rollback();
    console.error('updateUser error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update user.' });
  } finally {
    conn.release();
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot deactivate your own account.'
      });
    }

    const [existing] = await db.execute(
      'SELECT id, full_name AS name, status FROM users WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    await db.execute(
      "UPDATE users SET status = 'inactive' WHERE id = ?",
      [id]
    );

    try {
      await logAndNotify(req.user.id, {
        action: 'USER_DEACTIVATED',
        module: 'User Management',
        entityType: 'user',
        entityId: parseInt(id),
        description: `Admin ${req.user.name} deactivated user ${existing[0].name}`,
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

    return res.status(200).json({
      status: 'success',
      message: `User "${existing[0].name}" has been deactivated.`
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to deactivate user.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status, u.created_at, u.updated_at,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User profile not found.' });
    }

    return res.status(200).json({ status: 'success', data: users[0] });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve profile.' });
  }
};

export const updateProfile = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const userId = req.user.id;
    const { name, email, phone, company, department, address } = req.body;

    const [existingRows] = await conn.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    if (!name || !email) {
      return res.status(400).json({ status: 'error', message: 'Name and email are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
    }

    const emailClean = email.toLowerCase().trim();

    const [emailCheck] = await conn.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [emailClean, userId]
    );
    if (emailCheck.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
    }

    const phoneValue = (phone && phone.trim() !== '') ? phone.trim() : null;
    if (phoneValue) {
      const [phoneCheck] = await conn.execute(
        'SELECT user_id FROM profiles WHERE phone = ? AND user_id != ?',
        [phoneValue, userId]
      );
      if (phoneCheck.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'A user with this phone number already exists.'
        });
      }
    }

    await conn.beginTransaction();

    await conn.execute(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [name.trim(), emailClean, userId]
    );

    await conn.execute(
      `INSERT INTO profiles (user_id, phone, company, department, address)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       phone = VALUES(phone), company = VALUES(company), department = VALUES(department), address = VALUES(address)`,
      [userId, phoneValue, company || null, department || null, address || null]
    );

    await conn.commit();

    const [updated] = await db.execute(
      `SELECT u.id, u.full_name, u.full_name AS name, u.email, u.role, u.status, u.created_at, u.updated_at,
              p.phone, p.company, p.department, p.address
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    try {
      await logAndNotify(userId, {
        action: 'PROFILE_UPDATED',
        module: 'Profile',
        entityType: 'user',
        entityId: userId,
        description: `User ${updated[0].full_name} updated their profile`,
        ipAddress: req.ip,
        oldValue: existingRows[0],
        newValue: {
          id: userId,
          name: name.trim(),
          email: emailClean,
          phone: phoneValue,
          role: existingRows[0].role,
          status: existingRows[0].status
        }
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    await conn.rollback();
    console.error('updateProfile error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  } finally {
    conn.release();
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password, new password, and confirm password are all required.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password and confirm password do not match.'
      });
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({ status: 'error', message: pwCheck.message });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be different from your current password.'
      });
    }

    const [users] = await db.execute(
      'SELECT password_hash, full_name AS name FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    try {
      await logAndNotify(userId, {
        action: 'PASSWORD_CHANGED',
        module: 'Profile',
        entityType: 'user',
        entityId: userId,
        description: `User ${users[0].name} changed their password`,
        ipAddress: req.ip
      });
    } catch (logErr) {
      console.warn('Audit log failed (non-fatal):', logErr.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to change password.' });
  }
};
