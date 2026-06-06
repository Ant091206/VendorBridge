import React from 'react';

/**
 * Reusable Confirmation Dialog Modal Component
 * Props:
 *   - message: Custom question or prompt text
 *   - onConfirm: Callback executed on Confirm selection
 *   - onCancel: Callback executed on Cancel selection
 */
const ConfirmModal = ({ message = 'Are you sure you want to perform this action?', onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-905 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Are you sure?</h3>
        </div>
        
        <p className="mt-3 text-sm text-slate-400 leading-relaxed pl-13">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3 pl-13">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-850 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/20"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
