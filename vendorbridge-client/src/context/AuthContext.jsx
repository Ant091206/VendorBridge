import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the context
const AuthContext = createContext(null);

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user credentials from storage on initial render
  useEffect(() => {
    try {
      // Check localStorage first (rememberMe), then sessionStorage
      let storedToken = localStorage.getItem('vendorbridge_token');
      let storedUser = localStorage.getItem('vendorbridge_user');

      if (!storedToken) {
        storedToken = sessionStorage.getItem('vendorbridge_token');
        storedUser = sessionStorage.getItem('vendorbridge_user');
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to parse user details from storage:', err);
      localStorage.removeItem('vendorbridge_token');
      localStorage.removeItem('vendorbridge_user');
      sessionStorage.removeItem('vendorbridge_token');
      sessionStorage.removeItem('vendorbridge_user');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save session details and update states.
   * @param {string} newToken - JWT token
   * @param {object} userData - User payload
   * @param {boolean} rememberMe - Whether to persist across browser sessions
   */
  const login = useCallback((newToken, userData, rememberMe = false) => {
    setToken(newToken);
    setUser(userData);

    // Clear both storages first
    localStorage.removeItem('vendorbridge_token');
    localStorage.removeItem('vendorbridge_user');
    sessionStorage.removeItem('vendorbridge_token');
    sessionStorage.removeItem('vendorbridge_user');

    // Choose storage based on rememberMe.
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('vendorbridge_token', newToken);
    storage.setItem('vendorbridge_user', JSON.stringify(userData));
    localStorage.setItem('vendorbridge_remember', String(rememberMe));
  }, []);

  /**
   * Clear session details and reset states.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vendorbridge_token');
    localStorage.removeItem('vendorbridge_user');
    localStorage.removeItem('vendorbridge_remember');
    sessionStorage.removeItem('vendorbridge_token');
    sessionStorage.removeItem('vendorbridge_user');
  }, []);

  /**
   * Update stored user data (e.g., after profile edit).
   * @param {object} updatedUserData - Updated user fields
   */
  const updateUser = useCallback((updatedUserData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedUserData };
      // Update in whichever storage has it
      if (localStorage.getItem('vendorbridge_user')) {
        localStorage.setItem('vendorbridge_user', JSON.stringify(newUser));
      }
      if (sessionStorage.getItem('vendorbridge_user')) {
        sessionStorage.setItem('vendorbridge_user', JSON.stringify(newUser));
      }
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook to consume authentication status
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider');
  }
  return context;
};
