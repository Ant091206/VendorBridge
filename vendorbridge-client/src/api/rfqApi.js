import api from './axios';

const unwrap = (response) => response.data;

export const getAllRFQs = async (params = {}) => unwrap(await api.get('/rfqs', { params }));
export const getRFQById = async (id) => unwrap(await api.get(`/rfqs/${id}`));
export const createRFQ = async (payload) => unwrap(await api.post('/rfqs', payload));
export const updateRFQ = async (id, payload) => unwrap(await api.put(`/rfqs/${id}`, payload));
export const deleteRFQ = async (id) => unwrap(await api.delete(`/rfqs/${id}`));
export const closeRFQ = async (id) => unwrap(await api.post(`/rfqs/${id}/close`));
export const getRFQVendors = async (id) => unwrap(await api.get(`/rfqs/${id}/vendors`));
export const getMyRFQs = async (params = {}) => unwrap(await api.get('/vendor/my-rfqs', { params }));
