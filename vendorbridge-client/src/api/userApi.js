import axiosInstance from './axios';

// ══════════════════════════════════════════════
//  AUTH API
// ══════════════════════════════════════════════

/**
 * Request a password reset link via email.
 * @param {string} email
 */
export const forgotPassword = (email) => {
  return axiosInstance.post('/auth/forgot-password', { email });
};

/**
 * Reset password using a valid token.
 * @param {{ token: string, password: string, confirmPassword: string }} data
 */
export const resetPassword = (data) => {
  return axiosInstance.post('/auth/reset-password', data);
};

// ══════════════════════════════════════════════
//  USER MANAGEMENT API (Admin)
// ══════════════════════════════════════════════

/**
 * Get all users with optional pagination, search, and filters.
 * @param {{ page?: number, limit?: number, search?: string, role?: string, status?: string }} params
 */
export const getUsers = (params = {}) => {
  return axiosInstance.get('/users', { params });
};

/**
 * Get a single user by ID.
 * @param {number|string} id
 */
export const getUserById = (id) => {
  return axiosInstance.get(`/users/${id}`);
};

/**
 * Create a new user (admin only).
 * @param {{ name: string, email: string, password: string, role: string, status?: string }} data
 */
export const createUser = (data) => {
  return axiosInstance.post('/users', data);
};

/**
 * Update an existing user (admin only).
 * @param {number|string} id
 * @param {{ name: string, email: string, role: string, status?: string, password?: string }} data
 */
export const updateUser = (id, data) => {
  return axiosInstance.put(`/users/${id}`, data);
};

/**
 * Soft-delete (deactivate) a user (admin only).
 * @param {number|string} id
 */
export const deleteUser = (id) => {
  return axiosInstance.delete(`/users/${id}`);
};

// ══════════════════════════════════════════════
//  PROFILE API (Self-service)
// ══════════════════════════════════════════════

/**
 * Get authenticated user's profile.
 */
export const getProfile = () => {
  return axiosInstance.get('/profile');
};

/**
 * Update own profile (name, email).
 * @param {{ name: string, email: string }} data
 */
export const updateProfile = (data) => {
  return axiosInstance.put('/profile', data);
};

/**
 * Change own password.
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} data
 */
export const changePassword = (data) => {
  return axiosInstance.put('/profile/change-password', data);
};
