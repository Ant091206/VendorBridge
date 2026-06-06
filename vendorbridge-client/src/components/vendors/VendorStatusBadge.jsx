import React from 'react';

const classes = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  blacklisted: 'bg-rose-100 text-rose-700'
};

const VendorStatusBadge = ({ status = 'active' }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black capitalize ${classes[status] || classes.inactive}`}>
    {status}
  </span>
);

export default VendorStatusBadge;
