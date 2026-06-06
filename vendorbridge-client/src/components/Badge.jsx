import React from 'react';

/**
 * Reusable Badge Component
 * Maps statuses to colored pills.
 * Supported statuses: active, inactive, blacklisted, pending, approved, rejected
 */
const Badge = ({ status }) => {
  if (!status) return null;
  
  const statusLower = status.toLowerCase();
  
  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (statusLower === 'active' || statusLower === 'approved') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (statusLower === 'inactive') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (statusLower === 'blacklisted' || statusLower === 'rejected') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (statusLower === 'pending') {
    styles = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
};

export default Badge;
