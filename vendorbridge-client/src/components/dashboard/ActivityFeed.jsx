import React, { memo } from 'react';
import EmptyState from './EmptyState';
import Panel from './Panel';

const ActivityFeed = memo(({ items = [] }) => (
  <Panel title="Recent Activity">
    {items.length === 0 ? (
      <EmptyState title="No activity recorded" />
    ) : (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#6D5DFC] shadow-[0_0_0_6px_rgba(109,93,252,0.10)]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{item.action?.replaceAll('_', ' ')}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.user_name || 'System'} · {item.entity_type}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </Panel>
));

export default ActivityFeed;
