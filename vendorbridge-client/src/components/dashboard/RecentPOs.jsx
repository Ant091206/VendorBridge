import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import Panel from './Panel';

const currency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const RecentPOs = memo(({ items = [] }) => (
  <Panel title="Recent Purchase Orders" action={<Link className="text-xs font-bold text-[#6D5DFC]" to="/purchase-orders">View all</Link>}>
    {items.length === 0 ? (
      <EmptyState title="No purchase orders" />
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        {items.map((po) => (
          <Link key={po.id} to={`/purchase-orders/${po.id}`} className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 bg-white px-4 py-3 last:border-b-0 hover:bg-slate-50">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{po.po_number}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{po.vendor_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-900">{currency(po.grand_total)}</p>
              <p className="mt-1 text-[11px] font-bold capitalize text-slate-500">{po.status}</p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </Panel>
));

export default RecentPOs;
