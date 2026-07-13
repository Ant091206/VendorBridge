import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, AlertCircle, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

/**
 * RegisterForm — Reusable registration form component using react-hook-form.
 * Includes: phone field, password strength indicator, role selection.
 */
const roleOptions = [
  { value: 'vendor',  label: 'Vendor',               description: 'Submit quotations and manage orders' },
  { value: 'officer', label: 'Procurement Officer',   description: 'Create RFQs and manage procurement' },
  { value: 'manager', label: 'Procurement Manager',   description: 'Approve quotations and oversee operations' },
  { value: 'finance', label: 'Finance Officer',       description: 'Manage invoices and payments' }
];

/**
 * Password strength checker — returns level 0-4 and individual rule statuses.
 */
const getPasswordStrength = (pw = '') => {
  const rules = [
    { label: 'At least 8 characters',    pass: pw.length >= 8 },
    { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(pw) },
    { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(pw) },
    { label: 'One number (0-9)',          pass: /[0-9]/.test(pw) }
  ];
  const score = rules.filter(r => r.pass).length;
  return { score, rules };
};

const strengthConfig = [
  { label: '',        color: 'bg-slate-200' },
  { label: 'Weak',   color: 'bg-red-400' },
  { label: 'Fair',   color: 'bg-amber-400' },
  { label: 'Good',   color: 'bg-blue-400' },
  { label: 'Strong', color: 'bg-emerald-500' }
];

const RegisterForm = ({ onSubmit, loading = false, error = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStrength, setShowStrength] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'vendor'
    }
  });

  const password = watch('password', '');
  const { score, rules: pwRules } = getPasswordStrength(password);
  const strength = strengthConfig[score];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label htmlFor="register-name" className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Full Name
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            className={`premium-input pl-10 pr-4 ${
              errors.name
                ? 'border-red-300 focus:border-red-400'
                : 'focus:border-primary'
            }`}
            {...register('name', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
          />
        </div>
        {errors.name && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="register-email" className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Email Address
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className={`premium-input pl-10 pr-4 ${
              errors.email
                ? 'border-red-300 focus:border-red-400'
                : 'focus:border-primary'
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
          <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Phone (Optional) */}
      <div>
        <label htmlFor="register-phone" className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Phone Number <span className="font-semibold normal-case text-slate-400">(Optional)</span>
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Phone className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 9876543210"
            className={`premium-input pl-10 pr-4 ${
              errors.phone
                ? 'border-red-300 focus:border-red-400'
                : 'focus:border-primary'
            }`}
            {...register('phone', {
              validate: (val) => {
                if (!val || val.trim() === '') return true;
                return /^\+?[\d\s\-().]{7,20}$/.test(val.trim()) || 'Please enter a valid phone number';
              }
            })}
          />
        </div>
        {errors.phone && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="register-password" className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Password
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
            className={`premium-input pl-10 pr-11 ${
              errors.password
                ? 'border-red-300 focus:border-red-400'
                : 'focus:border-primary'
            }`}
            onFocus={() => setShowStrength(true)}
            {...register('password', {
              required: 'Password is required',
              validate: (val) => {
                if (val.length < 8) return 'Password must be at least 8 characters';
                if (!/[A-Z]/.test(val)) return 'Must contain at least one uppercase letter';
                if (!/[a-z]/.test(val)) return 'Must contain at least one lowercase letter';
                if (!/[0-9]/.test(val)) return 'Must contain at least one number';
                return true;
              }
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

        {/* Password Strength Indicator */}
        {(showStrength || password) && (
          <div className="mt-2 space-y-2">
            {/* Strength bar */}
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1,2,3,4].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i <= score ? strength.color : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              {score > 0 && (
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  score === 4 ? 'text-emerald-600' :
                  score === 3 ? 'text-blue-600' :
                  score === 2 ? 'text-amber-600' : 'text-red-500'
                }`}>{strength.label}</span>
              )}
            </div>
            {/* Rule checklist */}
            <div className="grid grid-cols-2 gap-1">
              {pwRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {rule.pass
                    ? <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                    : <XCircle className="h-3 w-3 text-slate-300 shrink-0" />
                  }
                  <span className={`text-[10px] font-bold ${rule.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.password && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="register-confirm-password" className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Confirm Password
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className={`premium-input pl-10 pr-11 ${
              errors.confirmPassword
                ? 'border-red-300 focus:border-red-400'
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

      {/* Role Selection */}
      <div>
        <label htmlFor="register-role" className="block text-xs font-black uppercase tracking-wider text-slate-400">
          Your Role
        </label>
        <div className="relative mt-2">
          <select
            id="register-role"
            className={`premium-input appearance-none pr-10 cursor-pointer ${
              errors.role
                ? 'border-red-300 focus:border-red-400'
                : 'focus:border-primary'
            }`}
            {...register('role', { required: 'Please select a role' })}
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-white text-slate-800 font-semibold">
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
        <p className="mt-1.5 text-[11px] font-bold text-slate-400">
          Choose the role that matches your system responsibilities
        </p>
        {errors.role && (
          <p className="mt-1 text-xs font-semibold text-red-500">{errors.role.message}</p>
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
            Creating Account...
          </span>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Create Account
          </>
        )}
      </button>

      {/* Login Link */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-sm font-semibold text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:text-primary-hover transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
