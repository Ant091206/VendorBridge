import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound (404) Page
 * Displayed when a user navigates to a non-existent route.
 */
const NotFound = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center max-w-md px-8">
        {/* VendorBridge logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-green-500/25">
            <span className="text-sm font-black text-white">VB</span>
          </div>
          <span className="text-xl font-bold text-white">Vendor<span className="text-cyan-400">Bridge</span></span>
        </div>

        {/* 404 display */}
        <div className="text-8xl font-black text-green-500/30 leading-none mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="rounded-lg bg-indigo-600 hover:bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition shadow-md shadow-indigo-600/20"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
