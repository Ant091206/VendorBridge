import React from 'react';
import { Building2, Mail, MapPin, Phone, Tag } from 'lucide-react';
import VendorStatusBadge from './VendorStatusBadge';

const VendorCard = ({ vendor }) => (
  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium hover:shadow-premium-hover transition duration-200">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md">
          <Building2 size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{vendor.vendor_name || vendor.name}</p>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-500 font-mono">{vendor.vendor_code}</p>
        </div>
      </div>
      <VendorStatusBadge status={vendor.status} />
    </div>
    <div className="mt-5 space-y-2.5 text-sm font-semibold text-slate-650">
      {vendor.category_name && (
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-slate-400" />
          <span className="bg-green-50 text-primary text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wide">
            {vendor.category_name}
          </span>
        </div>
      )}
      <p className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition">
        <Mail size={14} className="text-slate-400" /> 
        <span className="truncate">{vendor.email}</span>
      </p>
      <p className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition">
        <Phone size={14} className="text-slate-400" /> 
        <span>{vendor.phone || 'No phone number'}</span>
      </p>
      <p className="flex items-center gap-2 text-slate-500">
        <MapPin size={14} className="text-slate-400" /> 
        <span>{[vendor.city, vendor.state].filter(Boolean).join(', ') || 'Location not set'}</span>
      </p>
    </div>
  </article>
);

export default VendorCard;
