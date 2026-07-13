import React from 'react';

const classes = {
  active: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  inactive: 'bg-slate-50 border-slate-200 text-slate-600',
  blacklisted: 'bg-rose-50 border-rose-200 text-rose-700'
};

const dotClasses = {
  active: 'bg-emerald-500',
  inactive: 'bg-slate-450',
  blacklisted: 'bg-rose-500'
};

const VendorStatusBadge = ({ status = 'active' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${classes[status] || classes.inactive}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[status] || dotClasses.inactive}`} />
    {status}
  </span>
);

export default VendorStatusBadge;
