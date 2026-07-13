import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle, AlertCircle, ArrowLeft, XCircle } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { resetPassword } from '../../api/userApi';

/**
 * ResetPassword Page — Token-based password reset form.
 * Token is extracted from URL query parameter: ?token=xxx
 */
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  // If no token present, show error immediately
  if (!token) {
    return (
      <AuthLayout title="Invalid Link">
        <div className="text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-100 mb-6">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Invalid Reset Link</h3>
          <p className="text-sm font-semibold text-slate-500 mb-6">
            This password reset link is invalid or has been tampered with. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/10 transition hover:opacity-95"
          >
            Request New Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={success ? undefined : 'Reset Your Password'}
      subtitle={success ? undefined : 'Enter your new password below.'}
    >
      {success ? (
        /* ── Success State ── */
        <div className="text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Password Reset Successfully</h3>
          <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/10 transition hover:opacity-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      ) : (
        /* ── Password Reset Form ── */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="reset-password" className="block text-xs font-black uppercase tracking-wider text-slate-400">
              New Password
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`premium-input pl-10 pr-11 ${
                  errors.password
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                    : 'focus:border-primary'
                }`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.password.message}</p>
            ) : (
              <p className="mt-1.5 text-xs font-bold text-slate-400">Minimum 8 characters</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs font-black uppercase tracking-wider text-slate-400">
              Confirm New Password
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`premium-input pl-10 pr-11 ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-400'
                    : 'focus:border-primary'
                }`}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match'
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/10 transition-all duration-200 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting...
              </span>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Reset Password
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
