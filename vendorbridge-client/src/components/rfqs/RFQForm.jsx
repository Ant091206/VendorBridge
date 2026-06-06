import React, { useMemo } from 'react';
import { Search } from 'lucide-react';

const fieldClass = 'h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-semibold text-slate-800 outline-none focus:border-[#6D5DFC]';
const areaClass = 'min-h-28 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#6D5DFC]';

const RFQForm = ({ form, vendors = [], vendorSearch, setVendorSearch, onChange, onSubmit, submitting, submitLabel }) => {
  const set = (key, value) => onChange({ ...form, [key]: value });
  const selected = new Set((form.vendor_ids || []).map(Number));
  const filteredVendors = useMemo(() => {
    const term = vendorSearch.toLowerCase();
    return vendors.filter((vendor) => `${vendor.vendor_name || vendor.name} ${vendor.company_name} ${vendor.gst_number}`.toLowerCase().includes(term));
  }, [vendors, vendorSearch]);

  const toggleVendor = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set('vendor_ids', [...next]);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Basic Details</h2>
        <div className="mt-5 grid gap-4">
          <input className={fieldClass} value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="RFQ Title" required />
          <textarea className={areaClass} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Description" required />
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Product Information</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className={fieldClass} value={form.product_name || ''} onChange={(e) => set('product_name', e.target.value)} placeholder="Product Name" />
          <input className={fieldClass} type="number" min="1" value={form.quantity || ''} onChange={(e) => set('quantity', e.target.value)} placeholder="Quantity" required />
          <input className={fieldClass} type="number" min="0" value={form.estimated_budget || ''} onChange={(e) => set('estimated_budget', e.target.value)} placeholder="Estimated Budget" />
          <textarea className={`${areaClass} md:col-span-2`} value={form.product_details || ''} onChange={(e) => set('product_details', e.target.value)} placeholder="Product Details" required />
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Procurement Details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className={fieldClass} type="datetime-local" value={form.deadline || ''} onChange={(e) => set('deadline', e.target.value)} required />
          <select className={fieldClass} value={form.status || 'open'} onChange={(e) => set('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="text-lg font-black text-slate-950">Vendor Assignment</h2>
          <label className="flex h-11 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 text-slate-400 md:w-80">
            <Search size={17} />
            <input value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" placeholder="Search vendors" />
          </label>
        </div>
        <div className="mt-5 grid max-h-96 gap-3 overflow-y-auto md:grid-cols-2">
          {filteredVendors.map((vendor) => (
            <label key={vendor.id} className={`cursor-pointer rounded-2xl border p-4 ${selected.has(vendor.id) ? 'border-[#6D5DFC] bg-[#6D5DFC]/5' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(vendor.id)} onChange={() => toggleVendor(vendor.id)} className="mt-1" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{vendor.vendor_name || vendor.name}</p>
                  <p className="mt-1 truncate text-xs font-bold text-slate-500">{vendor.company_name} · {vendor.city || 'No city'}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button disabled={submitting} className="rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default RFQForm;
