import api from './api.js';

export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (payload) => api.post('/auth/reset-password', payload);
export const getProfile = () => api.get('/profile');
export const updateProfile = (payload) => api.put('/profile', payload);
export const changePassword = (payload) => api.put('/profile/change-password', payload);

export default {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
};
