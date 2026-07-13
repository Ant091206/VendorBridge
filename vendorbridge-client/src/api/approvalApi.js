import axiosInstance from './axios';

export const createApproval = async (payload) => {
  try {
    const response = await axiosInstance.post('/approvals', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to create approval request.');
  }
};

export const getApprovals = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/approvals', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve approvals.');
  }
};

export const getApprovalById = async (id) => {
  try {
    const response = await axiosInstance.get(`/approvals/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve approval details for ID: ${id}`);
  }
};

export const updateApproval = async (id, payload) => {
  try {
    const response = await axiosInstance.put(`/approvals/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to update approval request.');
  }
};

export const submitApproval = async (id) => {
  try {
    const response = await axiosInstance.patch(`/approvals/${id}/submit`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to submit approval request.');
  }
};

export const approveApproval = async (id, remarks) => {
  try {
    const response = await axiosInstance.patch(`/approvals/${id}/approve`, { remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to approve request ID: ${id}`);
  }
};

export const rejectApproval = async (id, remarks) => {
  try {
    const response = await axiosInstance.patch(`/approvals/${id}/reject`, { remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to reject request ID: ${id}`);
  }
};

export const cancelApproval = async (id) => {
  try {
    const response = await axiosInstance.patch(`/approvals/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to cancel request ID: ${id}`);
  }
};

export const getApprovalHistory = async (id) => {
  try {
    const response = await axiosInstance.get(`/approvals/${id}/history`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve approval history for ID: ${id}`);
  }
};

export const getManagerApprovals = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/manager/approvals', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve manager approvals queue.');
  }
};

export const getManagerPendingApprovals = async () => {
  try {
    const response = await axiosInstance.get('/manager/approvals/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve manager pending approvals queue.');
  }
};

export const getAllApprovals = getApprovals;
export const getPendingApprovals = getManagerPendingApprovals;
export const approveRequest = (id, data = {}) => approveApproval(id, data.remarks);
export const rejectRequest = (id, data = {}) => rejectApproval(id, data.remarks);
