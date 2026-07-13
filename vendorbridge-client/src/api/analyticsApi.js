import axiosInstance from './axios';

/**
 * Analytics API Functions
 * Provides client-side access to all dashboard/analytics charts data.
 */

export const getDashboardStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/dashboard', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve dashboard statistics.');
  }
};

export const getProcurementStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/procurement', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve procurement analytics.');
  }
};

export const getVendorPerformanceStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/vendors', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve vendor performance analytics.');
  }
};

export const getSpendingStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/spending', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve spending analytics.');
  }
};

export const getApprovalsStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/approvals', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve approvals analytics.');
  }
};

export const getPurchaseOrderStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/purchase-orders', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve purchase order analytics.');
  }
};

export const getInvoiceStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/invoices', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve invoice analytics.');
  }
};

export const getTrendsStats = async (filters = {}) => {
  try {
    const response = await axiosInstance.get('/analytics/trends', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve trend analytics.');
  }
};
