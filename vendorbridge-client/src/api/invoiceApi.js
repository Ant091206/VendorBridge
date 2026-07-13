import api from './axios';

export const createInvoice = (data) =>
  api.post('/invoices', data).then((r) => r.data);

export const getAllInvoices = (params = {}) =>
  api.get('/invoices', { params }).then((r) => r.data);

export const getInvoiceById = (id) =>
  api.get(`/invoices/${id}`).then((r) => r.data);

export const updateInvoice = (id, data) =>
  api.put(`/invoices/${id}`, data).then((r) => r.data);

export const deleteInvoice = (id) =>
  api.delete(`/invoices/${id}`).then((r) => r.data);

export const generateInvoice = (id) =>
  api.patch(`/invoices/${id}/generate`).then((r) => r.data);

export const cancelInvoice = (id, remarks) =>
  api.patch(`/invoices/${id}/cancel`, { remarks }).then((r) => r.data);

export const markInvoicePaid = (id, data) =>
  api.patch(`/invoices/${id}/mark-paid`, data).then((r) => r.data);

export const downloadInvoicePDF = async (id, invoiceNumber) => {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getInvoicePDFBlobUrl = async (id) => {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  return window.URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' })
  );
};

export const sendInvoiceEmail = (id) =>
  api.post(`/invoices/${id}/send-email`).then((r) => r.data);

export const getInvoiceHistory = (id) =>
  api.get(`/invoices/${id}/history`).then((r) => r.data);

export const getEmailHistory = (id) =>
  api.get(`/invoices/${id}/email-history`).then((r) => r.data);

export const getMyInvoices = (params = {}) =>
  api.get('/invoices/vendor/my-invoices', { params }).then((r) => r.data);
