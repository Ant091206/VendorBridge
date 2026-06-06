import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data yet', message = 'Dashboard data will appear as records are created.' }) => (
  <div className="flex min-h-36 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
      <Inbox size={20} />
    </div>
    <p className="mt-3 text-sm font-bold text-slate-800">{title}</p>
    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{message}</p>
  </div>
);

export default EmptyState;
