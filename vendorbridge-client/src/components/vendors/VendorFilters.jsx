import React from 'react';
import { Search } from 'lucide-react';

const VendorFilters = ({ filters, categories = [], onChange }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:grid-cols-[1fr_180px_180px_160px]">
      <label className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 text-slate-400">
        <Search size={18} />
        <input
          value={filters.search || ''}
          onChange={(event) => set('search', event.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="Search vendor, company, GST..."
        />
      </label>
      <select value={filters.category_id || ''} onChange={(event) => set('category_id', event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-bold text-slate-700 outline-none">
        <option value="">All Categories</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <select value={filters.status || ''} onChange={(event) => set('status', event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-bold text-slate-700 outline-none">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="blacklisted">Blacklisted</option>
      </select>
      <input
        value={filters.city || ''}
        onChange={(event) => set('city', event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        placeholder="City"
      />
    </div>
  );
};

export default VendorFilters;
