import React from 'react';
import { Search, Filter, MapPin, ArrowUpDown } from 'lucide-react';

const VendorFilters = ({ filters, categories = [], onChange }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  const handleSortChange = (event) => {
    const val = event.target.value;
    if (!val) {
      onChange({ ...filters, sort: '', order: '', page: 1 });
      return;
    }
    // E.g. vendor_name_asc -> sort = vendor_name, order = asc
    // Note: created_at_desc has multiple underscores, so split accordingly
    const parts = val.split('_');
    const order = parts.pop(); // last part: asc/desc
    const sort = parts.join('_'); // rest of the parts
    onChange({ ...filters, sort, order, page: 1 });
  };

  const currentSortVal = filters.sort && filters.order ? `${filters.sort}_${filters.order}` : '';

  return (
    <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-premium grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-center">
      {/* Search Bar */}
      <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
        <input
          value={filters.search || ''}
          onChange={(event) => set('search', event.target.value)}
          className="premium-input pl-10"
          placeholder="Search name, code, GST..."
        />
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Category Dropdown */}
      <div className="relative">
        <select 
          value={filters.category_id || ''} 
          onChange={(event) => set('category_id', event.target.value)} 
          className="premium-input pr-10 cursor-pointer text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
          <Filter className="h-4 w-4" />
        </div>
      </div>

      {/* Status Dropdown */}
      <div className="relative">
        <select 
          value={filters.status || ''} 
          onChange={(event) => set('status', event.target.value)} 
          className="premium-input pr-10 cursor-pointer text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
          <Filter className="h-4 w-4" />
        </div>
      </div>

      {/* City Input */}
      <div className="relative">
        <input
          value={filters.city || ''}
          onChange={(event) => set('city', event.target.value)}
          className="premium-input pl-10"
          placeholder="City"
        />
        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* State Input */}
      <div className="relative">
        <input
          value={filters.state || ''}
          onChange={(event) => set('state', event.target.value)}
          className="premium-input pl-10"
          placeholder="State"
        />
        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <select 
          value={currentSortVal} 
          onChange={handleSortChange} 
          className="premium-input pr-10 cursor-pointer text-slate-700"
        >
          <option value="">Sort By</option>
          <option value="created_at_desc">Newest Registered</option>
          <option value="created_at_asc">Oldest Registered</option>
          <option value="vendor_name_asc">Name (A-Z)</option>
          <option value="vendor_name_desc">Name (Z-A)</option>
          <option value="company_name_asc">Company (A-Z)</option>
          <option value="city_asc">City (A-Z)</option>
          <option value="state_asc">State (A-Z)</option>
          <option value="status_asc">Status</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
          <ArrowUpDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export default VendorFilters;
