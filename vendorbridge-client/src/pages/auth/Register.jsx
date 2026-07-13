import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AuthLayout from '../../components/auth/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';
import Toast from '../../components/Toast';

/**
 * Register Page — Split-panel SaaS-style registration page.
 * Uses AuthLayout for branding and RegisterForm for the form.
 */
const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      await axiosInstance.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        role: data.role
      });

      setToast({
        message: 'Account created successfully! Redirecting to login...',
        type: 'success'
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Create Your Account"
        subtitle="Join VendorBridge to start managing your procurement workflow."
      >
        <RegisterForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </AuthLayout>

      {/* Toast Notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}
    </>
  );
};

export default Register;
