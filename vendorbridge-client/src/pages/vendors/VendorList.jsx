import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { deleteVendor, getAllVendors, getVendorCategories } from '../../api/vendorApi';
import VendorFilters from '../../components/vendors/VendorFilters';
import VendorTable from '../../components/vendors/VendorTable';
import VendorCard from '../../components/vendors/VendorCard';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ page: 1, limit: 10, sort: 'created_at' });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => filters, [filters]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [vendorRes, categoryRes] = await Promise.all([
        getAllVendors(query),
        getVendorCategories()
      ]);
      setVendors(vendorRes.data || []);
      setPagination(vendorRes.pagination || { page: 1, total_pages: 1, total: vendorRes.results || 0 });
      setCategories(categoryRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this vendor?')) return;
    await deleteVendor(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D5DFC]">Vendor Management</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Suppliers & Companies</h1>
        </div>
        <Link to="/vendors/add" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25">
          <Plus size={18} /> Add Vendor
        </Link>
      </div>

      <VendorFilters filters={filters} categories={categories} onChange={setFilters} />

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      {loading ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />
      ) : vendors.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-sm font-bold text-slate-500">No vendors match the current filters.</div>
      ) : (
        <>
          <div className="hidden lg:block">
            <VendorTable vendors={vendors} onDelete={handleDelete} />
          </div>
          <div className="grid gap-4 lg:hidden">
            {vendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
          </div>
        </>
      )}

      <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600">
        <span>{pagination.total || 0} vendors</span>
        <div className="flex gap-2">
          <button disabled={(filters.page || 1) <= 1} onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">Previous</button>
          <button disabled={(filters.page || 1) >= (pagination.total_pages || 1)} onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
};

export default VendorList;
