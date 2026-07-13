import React from 'react';

const classes = {
  draft: 'bg-slate-50 border-slate-200 text-slate-700',
  published: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  open: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  closed: 'bg-green-50 border-indigo-200 text-green-700',
  cancelled: 'bg-rose-50 border-rose-200 text-rose-700'
};

const dotClasses = {
  draft: 'bg-slate-400',
  published: 'bg-emerald-500',
  open: 'bg-emerald-500',
  closed: 'bg-green-500',
  cancelled: 'bg-rose-500'
};

const RFQStatusBadge = ({ status = 'draft' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${classes[status] || classes.draft}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[status] || dotClasses.draft}`} />
    {status}
  </span>
);

export default RFQStatusBadge;
