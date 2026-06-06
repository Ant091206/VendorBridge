import React, { useEffect } from 'react';

/**
 * Reusable Toast Notification Component
 * Triggers a popup message that auto-dismisses after 3 seconds.
 * Props:
 *   - message: String to display
 *   - type: 'success' | 'error' | 'info'
 *   - onClose: Callback function triggered when toast is dismissed
 */
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  let styles = 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/50';
  let iconColor = 'text-cyan-400';

  if (type === 'success') {
    styles = 'bg-slate-900 border-emerald-800/40 text-emerald-200 shadow-emerald-950/20';
    iconColor = 'text-emerald-400';
  } else if (type === 'error') {
    styles = 'bg-slate-900 border-rose-800/40 text-rose-200 shadow-rose-950/20';
    iconColor = 'text-rose-400';
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 scale-100 ${styles}`}>
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950/40 ${iconColor}`}>
        {type === 'success' ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : type === 'error' ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
