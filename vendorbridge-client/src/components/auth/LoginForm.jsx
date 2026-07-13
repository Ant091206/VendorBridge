import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * LoginForm — Login form with react-hook-form validation.
 */
const LoginForm = ({ onSubmit, loading = false, error = '' }) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#DC2626]">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-[#374151] mb-1.5">
          Email address
        </label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className={`vb-input pl-9 ${errors.email ? 'border-[#DC2626] focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]' : ''}`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
            })}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-[#DC2626]">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-[#374151]">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-[#16A34A] hover:text-[#15803D] transition-colors duration-100"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`vb-input pl-9 pr-10 ${errors.password ? 'border-[#DC2626] focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]' : ''}`}
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors duration-100 cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-[#DC2626]">{errors.password.message}</p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          type="checkbox"
          className="h-4 w-4 rounded border-[#D1D5DB] text-[#16A34A] cursor-pointer accent-[#16A34A]"
          {...register('rememberMe')}
        />
        <label htmlFor="rememberMe" className="text-sm text-[#6B7280] cursor-pointer select-none">
          Remember me for 30 days
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full h-9 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-[#6B7280] pt-2">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-[#16A34A] hover:text-[#15803D] transition-colors duration-100">
          Create account
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
