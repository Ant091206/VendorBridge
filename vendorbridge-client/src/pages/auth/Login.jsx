import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';

/**
 * Login Page — Split-panel SaaS-style authentication page.
 * Uses AuthLayout for branding and LoginForm for the form.
 */
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });

      const { token, user } = response.data;

      // Persist to Context & Storage
      login(token, user, data.rememberMe);

      // Module 2 uses a role-based dashboard for every authenticated user.
      navigate('/dashboard');
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign In to Your Workspace"
      subtitle="Enter your credentials to access the VendorBridge ERP platform."
    >
      <LoginForm
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </AuthLayout>
  );
};

export default Login;
