import React from 'react';
import { Building2, Mail, MapPin } from 'lucide-react';
import VendorStatusBadge from './VendorStatusBadge';

const VendorCard = ({ vendor }) => (
  <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DFC] to-[#A855F7] text-white">
          <Building2 size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-black text-slate-950">{vendor.vendor_name || vendor.name}</p>
          <p className="mt-1 truncate text-xs font-bold text-slate-500">{vendor.vendor_code}</p>
        </div>
      </div>
      <VendorStatusBadge status={vendor.status} />
    </div>
    <div className="mt-5 space-y-2 text-sm font-semibold text-slate-600">
      <p className="flex items-center gap-2"><Mail size={15} /> {vendor.email}</p>
      <p className="flex items-center gap-2"><MapPin size={15} /> {[vendor.city, vendor.state].filter(Boolean).join(', ') || 'Location not set'}</p>
    </div>
  </article>
);

export default VendorCard;
