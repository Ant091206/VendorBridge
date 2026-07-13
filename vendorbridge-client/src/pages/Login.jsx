import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Persist to Context & Local Storage
      login(token, user);

      // Role-based routing redirection
      if (user.role === 'vendor') {
        navigate('/vendor-portal');
      } else {
        // admin, officer, manager redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error response:', err);
      const apiMessage = err.response?.data?.message || 'Invalid email credentials or password. Please try again.';
      setErrorMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper to prefill roles for hackathon evaluation ease
  const handlePrefill = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background Ambient Decorative Lights */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-green-500/20 blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-md">
        {/* Logo and Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-green-500/30">
            <span className="text-2xl font-black text-white tracking-wider">VB</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Vendor<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Bridge</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enterprise Procurement & Vendor Management ERP
          </p>
        </div>

        {/* Login Card Wrapper (Glassmorphism Effect) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="mb-6 text-xl font-semibold text-white">Sign In to Your Workspace</h2>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition duration-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
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

          {/* Quick-fill Helper for Demos */}
          <div className="mt-6 border-t border-slate-800/80 pt-6">
            <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 text-center">
              Quick Accounts for testing
            </span>
            <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
              <button
                type="button"
                onClick={() => handlePrefill('admin@vendorbridge.com', 'admin123')}
                className="rounded-md border border-slate-850 bg-slate-950/40 p-2 text-slate-400 hover:bg-slate-950/80 hover:text-cyan-400 transition"
              >
                Admin (Staff)
              </button>
              <button
                type="button"
                onClick={() => handlePrefill('vendor@acme.com', 'vendor123')}
                className="rounded-md border border-slate-850 bg-slate-950/40 p-2 text-slate-400 hover:bg-slate-950/80 hover:text-cyan-400 transition"
              >
                Vendor Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
