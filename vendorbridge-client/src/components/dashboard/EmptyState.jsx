import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Dashboard-specific EmptyState (used inside panels)
 */
const EmptyState = ({ title = 'No data yet', message }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F4F6] mb-2.5">
      <Inbox size={17} strokeWidth={1.5} className="text-[#9CA3AF]" />
    </div>
    <p className="text-sm font-medium text-[#374151]">{title}</p>
    {message && (
      <p className="mt-1 text-xs text-[#9CA3AF] max-w-xs">{message}</p>
    )}
  </div>
);

export default EmptyState;
