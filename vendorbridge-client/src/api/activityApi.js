import axiosInstance from './axios';

/**
 * Activity Logs API Functions
 * Provides client-side access to the activity log endpoints.
 */

/**
 * Fetch all activity logs with optional filters.
 * @param {object} params - Query parameters (user_id, entity_type, action, from, to, limit)
 */
export const getAllLogs = async (params) => {
  try {
    const response = await axiosInstance.get('/activity-logs', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve activity logs.');
  }
};

/**
 * Fetch the last 20 activity logs for dashboard feed.
 */
export const getRecentLogs = async () => {
  try {
    const response = await axiosInstance.get('/activity-logs/recent');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve recent activity logs.');
  }
};

/**
 * Fetch the logged-in user's last 30 activity entries.
 */
export const getMyActivity = async () => {
  try {
    const response = await axiosInstance.get('/activity-logs/my-activity');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve your activity history.');
  }
};
