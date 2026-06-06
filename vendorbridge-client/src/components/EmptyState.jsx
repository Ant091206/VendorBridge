import React from 'react';

/**
 * EmptyState Component
 * Reusable empty state display for tables/lists with no data.
 *
 * Props:
 *   icon        {string}   — Emoji icon (e.g. '📋')
 *   title       {string}   — Heading text
 *   message     {string}   — Description text
 *   actionLabel {string}   — Label for the action button (optional)
 *   onAction    {function} — Click handler for the action button (optional)
 */
const EmptyState = ({ icon = '📂', title = 'No Data Found', message, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 text-3xl mb-5 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {message && (
        <p className="mt-2 text-sm text-slate-400 max-w-sm">{message}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition shadow-md shadow-indigo-600/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
