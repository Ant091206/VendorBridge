import React from 'react';

const classes = {
  draft: 'bg-slate-100 text-slate-700',
  open: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-indigo-100 text-indigo-700',
  cancelled: 'bg-rose-100 text-rose-700'
};

const RFQStatusBadge = ({ status = 'draft' }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black capitalize ${classes[status] || classes.draft}`}>
    {status}
  </span>
);

export default RFQStatusBadge;
