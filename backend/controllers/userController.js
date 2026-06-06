import bcrypt from 'bcryptjs';
import db from '../config/db.js';

/**
 * Get all users with pagination, search, and filtering.
 * Route: GET /api/users
 * Access: Admin only
 *
 * Query params:
 *   page     - Page number (default: 1)
 *   limit    - Items per page (default: 10)
 *   search   - Search by name or email
 *   role     - Filter by role (admin, officer, manager, vendor)
 *   status   - Filter by status (active, inactive)
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const { search, role, status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    if (role && ['admin', 'officer', 'manager', 'vendor'].includes(role)) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    if (status && ['active', 'inactive'].includes(status)) {
      whereClause += ' AND u.status = ?';
      params.push(status);
    }

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated users
    const [users] = await db.execute(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.last_login, u.created_at, u.updated_at
       FROM users u
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
    console.error('Get all users error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users.'
    });
  }
};

/**
 * Get a single user by ID.
 * Route: GET /api/users/:id
 * Access: Admin only
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.execute(
      `SELECT id, name, email, role, status, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: users[0]
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user.'
    });
  }
};

/**
 * Create a new user (Admin panel).
 * Route: POST /api/users
 * Access: Admin only
 *
 * Unlike self-registration, admin can assign any role including 'admin'.
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status: userStatus } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, password, and role are required.'
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

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Validate role — admin can assign any role
    const validRoles = ['admin', 'officer', 'manager', 'vendor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    // Validate status
    const finalStatus = userStatus || 'active';
    if (!['active', 'inactive'].includes(finalStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either active or inactive.'
      });
    }

    // Check for duplicate email
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, role, finalStatus]
    );

    // Fetch the created user (without password_hash)
    const [newUser] = await db.execute(
      `SELECT id, name, email, role, status, created_at, updated_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      status: 'success',
      message: 'User created successfully.',
      data: newUser[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create user.'
    });
  }
};

/**
 * Update a user (Admin panel).
 * Route: PUT /api/users/:id
 * Access: Admin only
 *
 * Admin can update name, email, role, status.
 * Password update is optional (blank = no change).
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status: userStatus, password } = req.body;

    // Verify user exists
    const [existing] = await db.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and role are required.'
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

    // Validate role
    const validRoles = ['admin', 'officer', 'manager', 'vendor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    // Validate status
    const finalStatus = userStatus || 'active';
    if (!['active', 'inactive'].includes(finalStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either active or inactive.'
      });
    }

    // Check for email uniqueness (exclude current user)
    if (email !== existing[0].email) {
      const [emailCheck] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(409).json({
          status: 'error',
          message: 'A user with this email address already exists.'
        });
      }
    }

    // Build update query
    let updateQuery = 'UPDATE users SET name = ?, email = ?, role = ?, status = ?';
    const updateParams = [name, email, role, finalStatus];

    // If password is provided, hash and include it
    if (password && password.trim()) {
      if (password.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters long.'
        });
      }
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);
      updateQuery += ', password_hash = ?';
      updateParams.push(passwordHash);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await db.execute(updateQuery, updateParams);

    // Fetch updated user
    const [updated] = await db.execute(
      `SELECT id, name, email, role, status, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user.'
    });
  }
};

/**
 * Soft-delete a user (set status to inactive).
 * Route: DELETE /api/users/:id
 * Access: Admin only
 *
 * We use soft-delete because users are referenced via FK in many tables.
 * Prevents data integrity issues from hard deletion.
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot deactivate your own account.'
      });
    }

    // Verify user exists
    const [existing] = await db.execute(
      'SELECT id, name, status FROM users WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }

    // Soft-delete: set status to inactive
    await db.execute(
      "UPDATE users SET status = 'inactive' WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      status: 'success',
      message: `User "${existing[0].name}" has been deactivated.`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate user.'
    });
  }
};

/**
 * Get authenticated user's profile.
 * Route: GET /api/profile
 * Access: Any authenticated user
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.execute(
      `SELECT id, name, email, role, status, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile.'
    });
  }
};

/**
 * Update authenticated user's profile.
 * Route: PUT /api/profile
 * Access: Any authenticated user
 *
 * Users can update their own name and email.
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and email are required.'
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

    // Check email uniqueness (exclude current user)
    const [emailCheck] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    if (emailCheck.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A user with this email address already exists.'
      });
    }

    // Update profile
    await db.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );

    // Fetch updated profile
    const [updated] = await db.execute(
      `SELECT id, name, email, role, status, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: updated[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update profile.'
    });
  }
};

/**
 * Change authenticated user's password.
 * Route: PUT /api/profile/change-password
 * Access: Any authenticated user
 *
 * Requires current password verification before setting new password.
 */
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

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters long.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password and confirm password do not match.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be different from your current password.'
      });
    }

    // Fetch current password hash
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to change password.'
    });
  }
};
