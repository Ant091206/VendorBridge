import api from './axios';

const unwrap = (response) => response.data;

/**
 * Fetch side-by-side comparison matrix of bids for a specific RFQ.
 * Protected: Admin, Officer, Manager
 */
export const getComparison = async (rfqId) => {
  return unwrap(await api.get(`/rfqs/${rfqId}/comparison`));
};

/**
 * Choose a winning quotation for an RFQ.
 * Protected: Admin, Officer
 */
export const selectVendor = async (rfqId, payload) => {
  return unwrap(await api.post(`/rfqs/${rfqId}/select-vendor`, payload));
};
