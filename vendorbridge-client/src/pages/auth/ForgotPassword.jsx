import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { forgotPassword } from '../../api/userApi';

/**
 * ForgotPassword Page — Email input to request a password reset link.
 * Shows a success state after submission.
 */
const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      await forgotPassword(data.email);
      setSentEmail(data.email);
      setEmailSent(true);
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={emailSent ? undefined : 'Forgot Password'}
      subtitle={emailSent ? undefined : "Enter your email and we'll send you a reset link."}
    >
      {emailSent ? (
        /* ── Success State ── */
        <div className="text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Check Your Email</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-2">
            We've sent a password reset link to:
          </p>
          <p className="text-sm font-semibold text-cyan-400 mb-6">{sentEmail}</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-8">
            If you don't see the email, check your spam folder. The link expires in 1 hour.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => { setEmailSent(false); setError(''); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Send className="h-4 w-4" />
              Resend Email
            </button>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-cyan-400 hover:to-indigo-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        /* ── Email Input Form ── */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="forgot-email" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
                  errors.email
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reset Link
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors"
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

export default ForgotPassword;
