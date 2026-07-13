import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vendorbridge_token') || sessionStorage.getItem('vendorbridge_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vendorbridge_token');
      localStorage.removeItem('vendorbridge_user');
      localStorage.removeItem('vendorbridge_remember');
      sessionStorage.removeItem('vendorbridge_token');
      sessionStorage.removeItem('vendorbridge_user');

      window.dispatchEvent(new CustomEvent('vb:session-expired', {
        detail: { message: 'Session expired. Please login again.' }
      }));

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
