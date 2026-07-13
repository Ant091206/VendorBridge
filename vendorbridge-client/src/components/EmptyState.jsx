import React from 'react';
import { InboxIcon } from 'lucide-react';

/**
 * EmptyState — Reusable empty placeholder for tables/lists.
 *
 * Props:
 *   icon        — Lucide icon component (defaults to InboxIcon)
 *   title       — Heading text
 *   message     — Description text
 *   actionLabel — Button label (optional)
 *   onAction    — Button click handler (optional)
 */
const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No data found',
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#9CA3AF] mb-3">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-[#374151]">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-[#9CA3AF] max-w-xs">{message}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-[6px] bg-[#16A34A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#15803D] transition-colors duration-100 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
