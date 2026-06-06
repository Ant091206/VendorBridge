import axiosInstance from './axios';

/**
 * Notifications API Functions
 */

export const getNotifications = async (params) => {
  try {
    const response = await axiosInstance.get('/notifications', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve notifications.');
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve unread notification count.');
  }
};

export const markAsRead = async (id) => {
  try {
    const response = await axiosInstance.post(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to mark notification as read.');
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await axiosInstance.post('/notifications/read-all');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to mark all notifications as read.');
  }
};
