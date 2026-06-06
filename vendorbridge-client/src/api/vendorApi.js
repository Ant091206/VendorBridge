import api from './axios';

const unwrap = (response) => response.data;

export const getAllVendors = async (params = {}) => unwrap(await api.get('/vendors', { params }));
export const getVendorById = async (id) => unwrap(await api.get(`/vendors/${id}`));
export const createVendor = async (payload) => unwrap(await api.post('/vendors', payload));
export const updateVendor = async (id, payload) => unwrap(await api.put(`/vendors/${id}`, payload));
export const deleteVendor = async (id) => unwrap(await api.delete(`/vendors/${id}`));

export const getVendorCategories = async () => unwrap(await api.get('/vendor-categories'));
export const createVendorCategory = async (payload) => unwrap(await api.post('/vendor-categories', payload));
export const updateVendorCategory = async (id, payload) => unwrap(await api.put(`/vendor-categories/${id}`, payload));
export const deleteVendorCategory = async (id) => unwrap(await api.delete(`/vendor-categories/${id}`));

export const getAllCategories = getVendorCategories;
export const createCategory = createVendorCategory;
