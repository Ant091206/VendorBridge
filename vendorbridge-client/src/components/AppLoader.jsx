import React from 'react';

/**
 * AppLoader Component
 * Full-screen loading screen displayed while auth state is being determined
 * on initial app load.
 */
const AppLoader = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 gap-6">
      {/* Animated logo */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-xl shadow-green-500/30">
        <span className="text-lg font-black text-white">VB</span>
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 animate-ping opacity-20" />
      </div>

      {/* Brand name */}
      <div className="text-xl font-bold text-white">
        Vendor<span className="text-cyan-400">Bridge</span>
      </div>

      {/* Spinner */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      <p className="text-xs text-slate-500 font-medium">Loading your workspace...</p>
    </div>
  );
};

export default AppLoader;
