import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Trash2 } from 'lucide-react';
import VendorStatusBadge from './VendorStatusBadge';

const VendorTable = ({ vendors = [], onDelete }) => (
  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-4">Vendor</th>
            <th className="px-5 py-4">Company</th>
            <th className="px-5 py-4">GST</th>
            <th className="px-5 py-4">Category</th>
            <th className="px-5 py-4">City</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <p className="font-black text-slate-950">{vendor.vendor_name || vendor.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{vendor.vendor_code}</p>
              </td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-700">{vendor.company_name}</td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-700">{vendor.gst_number}</td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-700">{vendor.category_name || 'Uncategorized'}</td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-700">{vendor.city || '-'}</td>
              <td className="px-5 py-4"><VendorStatusBadge status={vendor.status} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Link to={`/vendors/${vendor.id}`} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#6D5DFC]"><Eye size={16} /></Link>
                  <Link to={`/vendors/${vendor.id}/edit`} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#6D5DFC]"><Edit size={16} /></Link>
                  <button onClick={() => onDelete(vendor.id)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default VendorTable;
