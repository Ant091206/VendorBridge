import React, { memo } from 'react';
import EmptyState from './EmptyState';
import Panel from './Panel';

const relativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diff = (Date.now() - date.getTime()) / 1000; // seconds
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const actionColors = {
  create:  { bg: '#DCFCE7', text: '#15803D' },
  update:  { bg: '#DBEAFE', text: '#1D4ED8' },
  delete:  { bg: '#FEE2E2', text: '#B91C1C' },
  approve: { bg: '#DCFCE7', text: '#15803D' },
  reject:  { bg: '#FEE2E2', text: '#B91C1C' },
  submit:  { bg: '#DBEAFE', text: '#1D4ED8' },
};

const getActionColor = (action = '') => {
  const key = action.toLowerCase().split('_')[0];
  return actionColors[key] || { bg: '#F3F4F6', text: '#6B7280' };
};

const ActivityFeed = memo(({ items = [] }) => (
  <Panel title="Recent Activity">
    {items.length === 0 ? (
      <EmptyState title="No activity recorded" />
    ) : (
      <div className="space-y-0 -mx-5 -mb-5">
        {items.map((item, i) => {
          const colors = getActionColor(item.action);
          const initials = (item.user_name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-5 py-3 ${i < items.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
            >
              {/* User avatar */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold mt-0.5"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#374151]">
                  <span className="font-medium text-[#111827]">
                    {item.user_name || 'System'}
                  </span>
                  {' '}
                  <span className="text-[#6B7280]">
                    {item.action?.replaceAll('_', ' ').toLowerCase()}
                  </span>
                  {item.entity_type && (
                    <span className="text-[#9CA3AF]"> · {item.entity_type}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-[#9CA3AF]">
                  {relativeTime(item.created_at || item.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Panel>
));

export default ActivityFeed;
