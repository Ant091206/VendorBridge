import React from 'react';

/**
 * Badge — unified status badge, light-theme, dot indicator.
 * Accepts both old dark-mode-style statuses and new ones.
 */
const statusConfig = {
  active:       { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  approved:     { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  awarded:      { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  completed:    { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  paid:         { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  sent:         { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  issued:       { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },

  pending:      { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' },
  'pending approval': { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' },
  inactive:     { bg: '#FEF3C7', text: '#B45309', dot: '#D97706' },

  open:         { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB' },
  invited:      { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB' },
  submitted:    { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB' },
  under_review: { bg: '#DBEAFE', text: '#1D4ED8', dot: '#2563EB' },
  draft:        { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  selected:     { bg: '#F3E8FF', text: '#7C3AED', dot: '#8B5CF6' },

  rejected:     { bg: '#FEE2E2', text: '#B91C1C', dot: '#DC2626' },
  cancelled:    { bg: '#FEE2E2', text: '#B91C1C', dot: '#DC2626' },
  blacklisted:  { bg: '#FEE2E2', text: '#B91C1C', dot: '#DC2626' },
  overdue:      { bg: '#FEE2E2', text: '#B91C1C', dot: '#DC2626' },
  expired:      { bg: '#FEE2E2', text: '#B91C1C', dot: '#DC2626' },
  closed:       { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

const Badge = ({ status }) => {
  if (!status) return null;

  const key = status.toLowerCase().replace(/_/g, ' ');
  const config = statusConfig[key] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dot }}
      />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default Badge;
