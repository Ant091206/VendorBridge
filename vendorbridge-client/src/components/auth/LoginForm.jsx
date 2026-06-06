import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

/**
 * LoginForm — Reusable login form component using react-hook-form.
 *
 * Props:
 *   onSubmit   {function}  — Called with form data { email, password, rememberMe }
 *   loading    {boolean}   — Shows loading state on the submit button
 *   error      {string}    — Error message to display
 */
const LoginForm = ({ onSubmit, loading = false, error = '' }) => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  return (
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
        <label htmlFor="login-email" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
          Email Address
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Mail className="h-4 w-4 text-slate-500" />
          </div>
          <input
            id="login-email"
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

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            Password
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Lock className="h-4 w-4 text-slate-500" />
          </div>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 ${
              errors.password
                ? 'border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
            }`}
            {...register('password', {
              required: 'Password is required'
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
        {errors.password && (
          <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
          {...register('rememberMe')}
        />
        <label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer select-none">
          Remember me for 30 days
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Authenticating...
          </span>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign In
          </>
        )}
      </button>

      {/* Register Link */}
      <div className="pt-4 border-t border-slate-800/80 text-center">
        <p className="text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Create Account
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
