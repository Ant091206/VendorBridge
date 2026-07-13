import api from './axios';

const unwrap = (response) => response.data;

export const getAllRFQs = async (params = {}) => unwrap(await api.get('/rfqs', { params }));
export const getRFQById = async (id) => unwrap(await api.get(`/rfqs/${id}`));
export const createRFQ = async (payload) => unwrap(await api.post('/rfqs', payload));
export const updateRFQ = async (id, payload) => unwrap(await api.put(`/rfqs/${id}`, payload));
export const deleteRFQ = async (id) => unwrap(await api.delete(`/rfqs/${id}`));
export const patchRFQStatus = async (id, status) => unwrap(await api.patch(`/rfqs/${id}/status`, { status }));

// Backwards compatibility / shortcuts
export const closeRFQ = async (id) => unwrap(await api.post(`/rfqs/${id}/close`));
export const getRFQVendors = async (id) => unwrap(await api.get(`/rfqs/${id}/vendors`));
export const getMyRFQs = async (params = {}) => unwrap(await api.get('/vendor/my-rfqs', { params }));

// Sub-resource: Items
export const addRFQItem = async (rfqId, item) => unwrap(await api.post(`/rfqs/${rfqId}/items`, item));
export const updateRFQItem = async (id, item) => unwrap(await api.put(`/rfq-items/${id}`, item));
export const deleteRFQItem = async (id) => unwrap(await api.delete(`/rfq-items/${id}`));

// Sub-resource: Vendors
export const assignRFQVendors = async (rfqId, vendorIds) => unwrap(await api.post(`/rfqs/${rfqId}/vendors`, { vendor_ids: vendorIds }));
export const removeRFQVendor = async (rfqId, vendorId) => unwrap(await api.delete(`/rfqs/${rfqId}/vendors/${vendorId}`));

// Sub-resource: Attachments
export const uploadRFQAttachment = async (rfqId, formData) => {
  return unwrap(
    await api.post(`/rfqs/${rfqId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  );
};
export const deleteRFQAttachment = async (id) => unwrap(await api.delete(`/rfq-attachments/${id}`));
