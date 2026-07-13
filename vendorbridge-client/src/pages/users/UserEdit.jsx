import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, User, Mail, Phone, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import Toast from '../../components/Toast';
import { getUserById, updateUser } from '../../api/userApi';

/**
 * UserEdit Page — Admin form to edit an existing user.
 * Pre-populates fields from the server. Password field is optional.
 */
const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'officer', label: 'Procurement Officer' },
  { value: 'manager', label: 'Manager' },
  { value: 'vendor', label: 'Vendor' }
];

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserById(id);
        const user = response.data.data;
        reset({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.status,
          password: ''
        });
      } catch (err) {
        setToast({ message: 'Failed to load user data.', type: 'error' });
        setTimeout(() => navigate('/users'), 2000);
      } finally {
        setPageLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate, reset]);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      // Build payload — only include password if provided
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        role: data.role,
        status: data.status
      };
      if (data.password && data.password.trim()) {
        payload.password = data.password;
      }

      await updateUser(id, payload);
      setToast({ message: 'User updated successfully!', type: 'success' });
      setTimeout(() => navigate('/users'), 1500);
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to update user.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div>
        <PageHeader title="Edit User" subtitle="Loading user data..." />
        <div className="mx-auto max-w-2xl">
          <LoadingSkeleton rows={6} cols={2} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit User"
        subtitle="Update user information, role, or status."
        actions={
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </button>
        }
      />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl backdrop-blur">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="edit-name" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="edit-name"
                  type="text"
                  placeholder="Enter full name"
                  className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
                    errors.name ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="edit-email" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="edit-email"
                  type="email"
                  placeholder="name@company.com"
                  className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
                    errors.email ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
                  })}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="edit-phone" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Phone Number <span className="font-normal normal-case text-slate-600">(Optional)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="edit-phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
                    errors.phone ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  {...register('phone', {
                    validate: (val) => {
                      if (!val || val.trim() === '') return true;
                      return /^\+?[\d\s\-().]{7,20}$/.test(val.trim()) || 'Please enter a valid phone number';
                    }
                  })}
                />
              </div>
              {errors.phone && <p className="mt-1.5 text-xs text-red-400">{errors.phone.message}</p>}
            </div>

            {/* Password (Optional) */}
            <div>
              <label htmlFor="edit-password" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                New Password <span className="normal-case text-slate-600">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (optional)"
                  className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
                    errors.password ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  {...register('password', {
                    validate: (val) => {
                      if (!val || val.trim() === '') return true; // optional on edit
                      if (val.length < 8) return 'Minimum 8 characters';
                      if (!/[A-Z]/.test(val)) return 'Must contain an uppercase letter';
                      if (!/[a-z]/.test(val)) return 'Must contain a lowercase letter';
                      if (!/[0-9]/.test(val)) return 'Must contain a number';
                      return true;
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Role & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Role */}
              <div>
                <label htmlFor="edit-role" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Shield className="h-4 w-4 text-slate-500" />
                  </div>
                  <select
                    id="edit-role"
                    className="block w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white shadow-inner outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                    {...register('role', { required: 'Role is required' })}
                  >
                    {roleOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="edit-status" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Status
                </label>
                <select
                  id="edit-status"
                  className="block w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/70 py-3 px-4 text-sm text-white shadow-inner outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  {...register('status')}
                >
                  <option value="active" className="bg-slate-900">Active</option>
                  <option value="inactive" className="bg-slate-900">Inactive</option>
                  <option value="suspended" className="bg-slate-900">Suspended</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      )}
    </div>
  );
};

export default UserEdit;
