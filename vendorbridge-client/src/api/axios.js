import axios from 'axios';

// Create axios instance using Vite environment variable
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ── Request Interceptor ──
// Auto-attach the JWT token from persistent or session storage to every request header
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

// ── Response Interceptor ──
// Handle 401 Unauthorized globally: clear session and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials
      localStorage.removeItem('vendorbridge_token');
      localStorage.removeItem('vendorbridge_user');
      localStorage.removeItem('vendorbridge_remember');
      sessionStorage.removeItem('vendorbridge_token');
      sessionStorage.removeItem('vendorbridge_user');

      // Show session expired message via custom event
      window.dispatchEvent(new CustomEvent('vb:session-expired', {
        detail: { message: 'Session expired. Please login again.' }
      }));

      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
