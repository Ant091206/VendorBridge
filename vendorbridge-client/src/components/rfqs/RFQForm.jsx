import React, { useMemo } from 'react';
import { Search, Filter, Calendar, Tag, Package, FileText, CheckSquare, Square } from 'lucide-react';

const RFQForm = ({ form, vendors = [], vendorSearch, setVendorSearch, onChange, onSubmit, submitting, submitLabel }) => {
  const set = (key, value) => onChange({ ...form, [key]: value });
  const selected = new Set((form.vendor_ids || []).map(Number));
  
  const filteredVendors = useMemo(() => {
    const term = vendorSearch.toLowerCase();
    return vendors.filter((vendor) => 
      `${vendor.vendor_name || vendor.name} ${vendor.company_name} ${vendor.gst_number}`.toLowerCase().includes(term)
    );
  }, [vendors, vendorSearch]);

  const toggleVendor = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set('vendor_ids', [...next]);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Details Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={18} className="text-primary" />
          <h2 className="text-lg font-black text-slate-900 font-sans">Basic Details</h2>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">RFQ Title *</label>
            <input 
              className="premium-input" 
              value={form.title || ''} 
              onChange={(e) => set('title', e.target.value)} 
              placeholder="e.g. Server Procurement, Office Desktop Supplies" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Description *</label>
            <textarea 
              className="premium-input min-h-[100px] resize-y" 
              value={form.description || ''} 
              onChange={(e) => set('description', e.target.value)} 
              placeholder="Write a clear statement of request..." 
              required 
            />
          </div>
        </div>
      </section>

      {/* Product Information Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex items-center gap-2 mb-5">
          <Package size={18} className="text-primary" />
          <h2 className="text-lg font-black text-slate-900 font-sans">Product Information</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Product Name</label>
            <input 
              className="premium-input" 
              value={form.product_name || ''} 
              onChange={(e) => set('product_name', e.target.value)} 
              placeholder="e.g. Dell Latitude laptops" 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Quantity Required *</label>
            <input 
              className="premium-input" 
              type="number" 
              min="1" 
              value={form.quantity || ''} 
              onChange={(e) => set('quantity', e.target.value)} 
              placeholder="Quantity" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Estimated Budget (INR)</label>
            <input 
              className="premium-input" 
              type="number" 
              min="0" 
              value={form.estimated_budget || ''} 
              onChange={(e) => set('estimated_budget', e.target.value)} 
              placeholder="Budget estimate" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Product Details / Specs *</label>
            <textarea 
              className="premium-input min-h-[100px]" 
              value={form.product_details || ''} 
              onChange={(e) => set('product_details', e.target.value)} 
              placeholder="Detail technical requirements (e.g. Core i7, 16GB RAM, 512GB SSD)..." 
              required 
            />
          </div>
        </div>
      </section>

      {/* Procurement Details Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={18} className="text-primary" />
          <h2 className="text-lg font-black text-slate-900 font-sans">Procurement Details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Submission Deadline *</label>
            <input 
              className="premium-input" 
              type="datetime-local" 
              value={form.deadline || ''} 
              onChange={(e) => set('deadline', e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">RFQ Status</label>
            <div className="relative">
              <select 
                className="premium-input pr-10 cursor-pointer" 
                value={form.status || 'open'} 
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                <Tag size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Assignment Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-primary" />
            <h2 className="text-lg font-black text-slate-900 font-sans">Vendor Assignment</h2>
          </div>
          <div className="relative md:w-80">
            <input 
              value={vendorSearch} 
              onChange={(e) => setVendorSearch(e.target.value)} 
              className="premium-input pl-10" 
              placeholder="Search active vendors..." 
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>
        
        <div className="mt-5 grid max-h-[300px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {filteredVendors.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm font-semibold">
              No matching active vendors found.
            </div>
          ) : (
            filteredVendors.map((vendor) => {
              const isSelected = selected.has(vendor.id);
              return (
                <label 
                  key={vendor.id} 
                  className={`flex items-start gap-3.5 cursor-pointer rounded-2xl border p-4 transition duration-150 select-none ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleVendor(vendor.id)} 
                    className="sr-only" 
                  />
                  <div className="mt-0.5 shrink-0 text-primary">
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{vendor.vendor_name || vendor.name}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {vendor.company_name} · <span className="font-mono text-[10px]">{vendor.vendor_code}</span>
                    </p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </section>

      {/* Form Submission Button */}
      <div className="flex justify-end gap-3">
        <button 
          type="submit" 
          disabled={submitting} 
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-black text-white hover:opacity-90 shadow-premium disabled:opacity-60 transition cursor-pointer"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default RFQForm;
