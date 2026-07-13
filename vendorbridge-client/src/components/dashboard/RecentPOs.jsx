import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import Panel from './Panel';
import StatusBadge from './StatusBadge';

const currency = (v) => {
  const num = Number(v || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

const RecentPOs = memo(({ items = [] }) => (
  <Panel
    title="Recent Purchase Orders"
    action={
      <Link
        to="/purchase-orders"
        className="text-xs font-medium text-[#16A34A] hover:text-[#15803D] transition-colors duration-100"
      >
        View all →
      </Link>
    }
  >
    {items.length === 0 ? (
      <EmptyState title="No purchase orders" message="Purchase orders will appear here." />
    ) : (
      <div className="divide-y divide-[#F3F4F6] -mx-5 -mb-5">
        {items.map((po) => (
          <Link
            key={po.id}
            to={`/purchase-orders/${po.id}`}
            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F9FAFB] transition-colors duration-100 group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111827] group-hover:text-[#16A34A] truncate transition-colors duration-100">
                {po.po_number}
              </p>
              <p className="mt-0.5 text-xs text-[#9CA3AF] truncate">{po.vendor_name}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold text-[#374151] font-mono">
                {currency(po.grand_total)}
              </span>
              <StatusBadge status={po.status} />
            </div>
          </Link>
        ))}
      </div>
    )}
  </Panel>
));

export default RecentPOs;
