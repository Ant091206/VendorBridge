import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import { createUser } from '../../api/userApi';

/**
 * UserCreate Page — Admin form to create a new user.
 * Can assign any role including admin.
 */
const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'officer', label: 'Procurement Officer' },
  { value: 'manager', label: 'Manager' },
  { value: 'vendor', label: 'Vendor' }
];

const UserCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'officer',
      status: 'active'
    }
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      await createUser(data);
      setToast({ message: 'User created successfully!', type: 'success' });
      setTimeout(() => navigate('/users'), 1500);
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to create user.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create User"
        subtitle="Add a new user to the system."
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
              <label htmlFor="create-name" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="create-name"
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
              <label htmlFor="create-email" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="create-email"
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
              <label htmlFor="create-phone" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Phone Number <span className="font-normal normal-case text-slate-500">(Optional)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="create-phone"
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

            {/* Password */}
            <div>
              <label htmlFor="create-password" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
                    errors.password ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                    validate: (val) => {
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
                <label htmlFor="create-role" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Role
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Shield className="h-4 w-4 text-slate-500" />
                  </div>
                  <select
                    id="create-role"
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
                <label htmlFor="create-status" className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Status
                </label>
                <select
                  id="create-status"
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
                    Creating...
                  </span>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create User
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

export default UserCreate;
