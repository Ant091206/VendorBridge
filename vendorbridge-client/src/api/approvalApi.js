import axiosInstance from './axios';

/**
 * Fetch all approvals in the system.
 * @param {object} params - Optional search/filter parameters (e.g. { decision: 'pending' })
 */
export const getAllApprovals = async (params) => {
  try {
    const response = await axiosInstance.get('/approvals', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve approvals.');
  }
};

/**
 * Fetch only pending approvals for the manager queue.
 */
export const getPendingApprovals = async () => {
  try {
    const response = await axiosInstance.get('/approvals/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Failed to retrieve pending approvals.');
  }
};

/**
 * Fetch detailed information for a single approval.
 * @param {number|string} id - Approval record ID
 */
export const getApprovalById = async (id) => {
  try {
    const response = await axiosInstance.get(`/approvals/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to retrieve approval details for ID: ${id}`);
  }
};

/**
 * Approve a procurement request, generating a Purchase Order.
 * @param {number|string} id - Approval record ID
 * @param {object} data - Optional body containing remarks (e.g. { remarks: '...' })
 */
export const approveRequest = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/approvals/${id}/approve`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to approve request ID: ${id}`);
  }
};

/**
 * Reject a procurement request, reverting the quotation and RFQ state.
 * @param {number|string} id - Approval record ID
 * @param {object} data - Required body containing remarks (e.g. { remarks: '...' })
 */
export const rejectRequest = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/approvals/${id}/reject`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error(`Failed to reject request ID: ${id}`);
  }
};
