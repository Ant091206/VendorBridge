import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import Panel from './Panel';
import StatusBadge from './StatusBadge';

const RecentRFQs = memo(({ items = [] }) => (
  <Panel
    title="Recent RFQs"
    action={
      <Link
        to="/rfqs"
        className="text-xs font-medium text-[#16A34A] hover:text-[#15803D] transition-colors duration-100"
      >
        View all →
      </Link>
    }
  >
    {items.length === 0 ? (
      <EmptyState title="No RFQs yet" message="RFQs you create will appear here." />
    ) : (
      <div className="divide-y divide-[#F3F4F6] -mx-5 -mb-5">
        {items.map((rfq) => (
          <Link
            key={rfq.id}
            to={`/rfqs/${rfq.id}`}
            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F9FAFB] transition-colors duration-100 group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111827] group-hover:text-[#16A34A] truncate transition-colors duration-100">
                {rfq.title}
              </p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {rfq.invited_vendors || 0} vendors · {rfq.quotations_received || 0} quotes
              </p>
            </div>
            <StatusBadge status={rfq.status} />
          </Link>
        ))}
      </div>
    )}
  </Panel>
));

export default RecentRFQs;
