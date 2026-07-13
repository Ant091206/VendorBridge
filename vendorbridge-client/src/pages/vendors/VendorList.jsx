import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, ShieldCheck, ShieldAlert, AlertTriangle, X, Trash2, ArrowUpDown } from 'lucide-react';
import { deleteVendor, getAllVendors, getVendorCategories } from '../../api/vendorApi';
import { useAuth } from '../../context/AuthContext';
import VendorFilters from '../../components/vendors/VendorFilters';
import VendorTable from '../../components/vendors/VendorTable';
import VendorCard from '../../components/vendors/VendorCard';
import Toast from '../../components/Toast';

const VendorList = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ page: 1, limit: 10, sort: 'created_at', order: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stats state
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blacklisted: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Toast & Modal state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const query = useMemo(() => filters, [filters]);

  const loadStats = async () => {
    try {
      const [totalRes, activeRes, inactiveRes, blacklistedRes] = await Promise.all([
        getAllVendors({ limit: 1 }),
        getAllVendors({ status: 'active', limit: 1 }),
        getAllVendors({ status: 'inactive', limit: 1 }),
        getAllVendors({ status: 'blacklisted', limit: 1 })
      ]);
      setStats({
        total: totalRes.pagination?.total || 0,
        active: activeRes.pagination?.total || 0,
        inactive: inactiveRes.pagination?.total || 0,
        blacklisted: blacklistedRes.pagination?.total || 0
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadVendors = async () => {
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
    loadStats();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadVendors();
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSort = (field) => {
    const isSameField = filters.sort === field;
    const order = isSameField && filters.order === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sort: field, order, page: 1 });
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTargetId);
      setToastMessage('Vendor archived successfully.');
      setToastType('success');
      setDeleteTargetId(null);
      loadVendors();
      loadStats();
    } catch (err) {
      setToastMessage(err.message || 'Error archiving vendor.');
      setToastType('error');
    } finally {
      setDeleting(false);
    }
  };

  const isWritable = ['admin', 'officer'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Vendor Management</p>
          <h1 className="text-3xl font-black text-slate-950 font-sans">Suppliers & Companies</h1>
          <p className="text-sm font-semibold text-slate-500">
            Onboard suppliers, manage verification statuses, and monitor active categories.
          </p>
        </div>
        {isWritable && (
          <Link 
            to="/vendors/add" 
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-black text-white hover:opacity-95 shadow-premium hover:shadow-premium-hover transition-all duration-300 cursor-pointer"
          >
            <Plus size={18} /> Add Vendor
          </Link>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Vendors */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center justify-between hover:shadow-premium-hover transition duration-200">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Vendors</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {statsLoading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-200" /> : stats.total}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-primary rounded-2xl">
            <Building2 size={24} />
          </div>
        </div>

        {/* Active Vendors */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center justify-between hover:shadow-premium-hover transition duration-200">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Active (Verified)</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {statsLoading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-200" /> : stats.active}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
        </div>

        {/* Inactive Vendors */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center justify-between hover:shadow-premium-hover transition duration-200">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Inactive</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {statsLoading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-200" /> : stats.inactive}
            </p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <ShieldAlert size={24} />
          </div>
        </div>

        {/* Blacklisted Vendors */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center justify-between hover:shadow-premium-hover transition duration-200">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Blacklisted</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {statsLoading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-slate-200" /> : stats.blacklisted}
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <VendorFilters filters={filters} categories={categories} onChange={setFilters} />

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Table Data Grid */}
      {loading && vendors.length === 0 ? (
        <div className="h-96 animate-pulse rounded-3xl bg-slate-200/80" />
      ) : vendors.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-premium">
          <p className="text-4xl">🏢</p>
          <h3 className="mt-4 text-lg font-black text-slate-900">No Vendors Found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your filtering queries or onboard a new vendor using the Add Vendor button.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <VendorTable 
              vendors={vendors} 
              onDelete={(id) => setDeleteTargetId(id)} 
              userRole={user?.role}
              currentSort={filters.sort}
              currentOrder={filters.order}
              onSort={handleSort}
            />
          </div>
          <div className="grid gap-4 lg:hidden">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-550 shadow-premium">
        <span>Showing {vendors.length} of {pagination.total || 0} vendors</span>
        <div className="flex gap-2">
          <button 
            disabled={(filters.page || 1) <= 1 || loading} 
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })} 
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-550 disabled:pointer-events-none cursor-pointer"
          >
            Previous
          </button>
          <button 
            disabled={(filters.page || 1) >= (pagination.total_pages || 1) || loading} 
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })} 
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-550 disabled:pointer-events-none cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={18} className="text-rose-500" /> Confirm Archival
              </h3>
              <button 
                onClick={() => setDeleteTargetId(null)}
                className="text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                Are you sure you want to archive this supplier? This will change their status to <strong className="text-slate-900">inactive</strong> and restrict procurement capabilities.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white hover:bg-rose-700 transition shadow-sm cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 size={14} /> {deleting ? 'Archiving...' : 'Archive Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;
