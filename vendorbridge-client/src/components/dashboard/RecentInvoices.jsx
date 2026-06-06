import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import Panel from './Panel';

const currency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value || 0));

const RecentInvoices = memo(({ items = [] }) => (
  <Panel title="Recent Invoices" action={<Link className="text-xs font-bold text-[#6D5DFC]" to="/invoices">View all</Link>}>
    {items.length === 0 ? (
      <EmptyState title="No invoices" />
    ) : (
      <div className="space-y-3">
        {items.map((invoice) => (
          <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 hover:bg-slate-100">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{invoice.invoice_number}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{invoice.vendor_name || invoice.po_number}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-slate-900">{currency(invoice.grand_total)}</p>
              <p className="mt-1 text-[11px] font-bold capitalize text-slate-500">{invoice.status}</p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </Panel>
));

export default RecentInvoices;
