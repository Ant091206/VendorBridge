import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Lock, Plus, Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';
import { closeRFQ, deleteRFQ, getAllRFQs } from '../../api/rfqApi';
import { useAuth } from '../../context/AuthContext';
import RFQStatusBadge from '../../components/rfqs/RFQStatusBadge';
import Toast from '../../components/Toast';

const date = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const priorityColors = {
  Low: 'bg-slate-50 border-slate-200 text-slate-700',
  Medium: 'bg-blue-50 border-blue-200 text-blue-700',
  High: 'bg-amber-50 border-amber-200 text-amber-700',
  Urgent: 'bg-rose-50 border-rose-200 text-rose-700'
};

const RFQList = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [filters, setFilters] = useState({ page: 1, limit: 10, sort: 'created_at', order: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const query = useMemo(() => filters, [filters]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllRFQs(query);
      setRfqs(res.data || []);
      setPagination(res.pagination || { page: 1, total_pages: 1, total: res.results || 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load RFQs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      load();
    }, 150);
    return () => clearTimeout(handler);
  }, [query]);

  const handleClose = async (id) => {
    try {
      await closeRFQ(id);
      setToastMessage('RFQ closed successfully.');
      setToastType('success');
      load();
    } catch (err) {
      setToastMessage(err.response?.data?.message || err.message || 'Error closing RFQ.');
      setToastType('error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this RFQ?')) return;
    try {
      await deleteRFQ(id);
      setToastMessage('RFQ deleted successfully.');
      setToastType('success');
      load();
    } catch (err) {
      setToastMessage(err.response?.data?.message || err.message || 'Error deleting RFQ.');
      setToastType('error');
    }
  };

  const handleSortChange = (event) => {
    const val = event.target.value;
    if (!val) {
      setFilters({ ...filters, sort: 'created_at', order: 'desc', page: 1 });
      return;
    }
    const parts = val.split('_');
    const order = parts.pop();
    const sort = parts.join('_');
    setFilters({ ...filters, sort, order, page: 1 });
  };

  const currentSortVal = filters.sort && filters.order ? `${filters.sort}_${filters.order}` : '';

  const isWritable = ['admin', 'officer'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

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
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">RFQ Management</p>
          <h1 className="text-3xl font-black text-slate-950 font-sans">Request For Quotations</h1>
          <p className="text-sm font-semibold text-slate-500">
            Publish procurement requirements, view vendor feedback, and manage deadlines.
          </p>
        </div>
        {isWritable && (
          <Link 
            to="/rfqs/create" 
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-black text-white hover:opacity-95 shadow-premium transition duration-150 cursor-pointer"
          >
            <Plus size={18} /> Create RFQ
          </Link>
        )}
      </div>

      {/* Filters & Search Controls */}
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-premium sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-center">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
          <input 
            value={filters.search || ''} 
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} 
            className="premium-input pl-10 text-xs py-2.5" 
            placeholder="Search RFQ no, title..." 
          />
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select 
            value={filters.status || ''} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} 
            className="premium-input pr-10 cursor-pointer text-xs py-2.5 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
            <Filter className="h-3 w-3" />
          </div>
        </div>

        {/* Priority Dropdown */}
        <div className="relative">
          <select 
            value={filters.priority || ''} 
            onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })} 
            className="premium-input pr-10 cursor-pointer text-xs py-2.5 text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
            <Filter className="h-3 w-3" />
          </div>
        </div>

        {/* Type Dropdown */}
        <div className="relative">
          <select 
            value={filters.type || ''} 
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })} 
            className="premium-input pr-10 cursor-pointer text-xs py-2.5 text-slate-700"
          >
            <option value="">All Types</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Equipment">Equipment</option>
            <option value="Services">Services</option>
            <option value="Software">Software</option>
            <option value="Logistics">Logistics</option>
            <option value="Other">Other</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
            <Filter className="h-3 w-3" />
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="relative">
          <select 
            value={currentSortVal} 
            onChange={handleSortChange} 
            className="premium-input pr-10 cursor-pointer text-xs py-2.5 text-slate-700"
          >
            <option value="">Sort By</option>
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="submission_deadline_asc">Deadline (Asc)</option>
            <option value="submission_deadline_desc">Deadline (Desc)</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="rfq_number_asc">RFQ No (Asc)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
            <ArrowUpDown className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Table Data Grid */}
      {loading && rfqs.length === 0 ? (
        <div className="h-96 animate-pulse rounded-3xl bg-slate-200/80" />
      ) : rfqs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-premium">
          <p className="text-4xl">📄</p>
          <h3 className="mt-4 text-lg font-black text-slate-900">No RFQs Found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {filters.search || filters.status || filters.priority 
              ? "Try adjusting search queries or checking other filters."
              : "Launch your first procurement request by clicking the Create RFQ button."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <th className="py-4 px-6">RFQ Number</th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-center">Priority</th>
                  <th className="py-4 px-6 text-center">Items</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6">Deadline</th>
                  {user?.role !== 'vendor' && <th className="py-4 px-6 text-center">Vendors</th>}
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 font-semibold text-sm text-slate-650">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-slate-50/30 transition duration-150">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{rfq.rfq_number}</td>
                    <td className="py-4 px-6 max-w-[220px] truncate font-bold text-slate-900" title={rfq.title}>
                      {rfq.title}
                    </td>
                    <td className="py-4 px-6 text-slate-900">{rfq.type}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${priorityColors[rfq.priority] || priorityColors.Medium}`}>
                        {rfq.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-900">{rfq.items_count || 0}</td>
                    <td className="py-4 px-6 text-center">
                      <RFQStatusBadge status={rfq.status} />
                    </td>
                    <td className="py-4 px-6 text-slate-500">{date(rfq.submission_deadline)}</td>
                    {user?.role !== 'vendor' && <td className="py-4 px-6 text-center text-slate-900">{rfq.assigned_vendors_count}</td>}
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/rfqs/${rfq.id}`} 
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                        
                        {isWritable && rfq.status === 'draft' && (
                          <Link 
                            to={`/rfqs/${rfq.id}/edit`} 
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm"
                            title="Edit RFQ"
                          >
                            <Edit size={14} />
                          </Link>
                        )}
                        
                        {isWritable && (rfq.status === 'published' || rfq.status === 'open') && (
                          <button 
                            onClick={() => handleClose(rfq.id)} 
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm cursor-pointer"
                            title="Close RFQ"
                          >
                            <Lock size={14} />
                          </button>
                        )}
                        
                        {isAdmin && rfq.status === 'draft' && (
                          <button 
                            onClick={() => handleDelete(rfq.id)} 
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-550 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm cursor-pointer"
                            title="Delete RFQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-550 shadow-premium">
        <span>Showing {rfqs.length} of {pagination.total || 0} RFQs</span>
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
    </div>
  );
};

export default RFQList;
