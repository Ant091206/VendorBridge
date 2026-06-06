import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import Panel from './Panel';

const RecentRFQs = memo(({ items = [] }) => (
  <Panel title="Recent RFQs" action={<Link className="text-xs font-bold text-[#6D5DFC]" to="/rfqs">View all</Link>}>
    {items.length === 0 ? (
      <EmptyState title="No RFQs yet" />
    ) : (
      <div className="space-y-3">
        {items.map((rfq) => (
          <div key={rfq.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4">
              <Link to={`/rfqs/${rfq.id}`} className="min-w-0 truncate text-sm font-black text-slate-950 hover:text-[#6D5DFC]">
                {rfq.title}
              </Link>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-black capitalize text-slate-600 shadow-sm">{rfq.status}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {rfq.invited_vendors || 0} vendors · {rfq.quotations_received || 0} quotes
            </p>
          </div>
        ))}
      </div>
    )}
  </Panel>
));

export default RecentRFQs;
