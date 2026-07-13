import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllPOs } from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Plus, 
  TrendingUp, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';

const POList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, issued: 0, pending_acknowledgement: 0, fulfilled: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering, searching & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('id_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        sort: sortBy
      };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await getAllPOs(params);
      if (response.status === 'success') {
        setPurchaseOrders(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
        if (response.pagination) {
          setTotalPages(response.pagination.total_pages || 1);
          setTotalRecords(response.pagination.total || 0);
        }
      } else {
        setError('Failed to fetch purchase orders.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, [page, statusFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPurchaseOrders();
  };

  const handleRefresh = () => {
    fetchPurchaseOrders();
    setToast({ message: 'Purchase orders list refreshed.', type: 'success' });
  };

  // Format currency
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status badge style helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 border border-slate-200">
            Draft
          </span>
        );
      case 'Issued':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
            <Send className="h-3 w-3" /> Issued
          </span>
        );
      case 'Acknowledged':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200">
            <Clock className="h-3 w-3" /> Acknowledged
          </span>
        );
      case 'Partially Fulfilled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            Partially Fulfilled
          </span>
        );
      case 'Fulfilled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Fulfilled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link to="/purchase-orders/dashboard" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Dashboard View
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans mt-1">Purchase Orders</h1>
          <p className="text-sm font-semibold text-slate-500">
            Track generated procurement agreements, manage draft items, and monitor dispatch status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-650 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {user?.role !== 'manager' && (
            <Link
              to="/purchase-orders/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition"
            >
              <Plus className="h-4 w-4" /> Create PO
            </Link>
          )}
        </div>
      </div>

      {/* Mini-Stats Card Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${!statusFilter ? 'border-indigo-600 bg-green-50/20' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Total POs</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Issued'); setPage(1); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Issued' ? 'border-blue-650 bg-blue-50/20' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Issued</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.issued}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Acknowledged'); setPage(1); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Acknowledged' ? 'border-indigo-600 bg-green-50/25' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Acknowledged</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.pending_acknowledgement}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Fulfilled'); setPage(1); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Fulfilled' ? 'border-emerald-600 bg-emerald-50/20' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Fulfilled</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.fulfilled}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Cancelled'); setPage(1); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Cancelled' ? 'border-rose-600 bg-rose-50/20' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Cancelled</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.cancelled}</h4>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Filters & Search Controls */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-premium sm:grid-cols-4 items-center">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO Number or Vendor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input pl-10"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="premium-input pr-10 cursor-pointer text-slate-650"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Issued">Issued</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Partially Fulfilled">Partially Fulfilled</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-450">
            <Filter className="h-4 w-4" />
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="premium-input pr-10 cursor-pointer text-slate-650"
          >
            <option value="id_desc">Newest First</option>
            <option value="id_asc">Oldest First</option>
            <option value="date_asc">Issue Date (Oldest)</option>
            <option value="date_desc">Issue Date (Newest)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-450">
            <Settings className="h-4 w-4" />
          </div>
        </div>
      </form>

      {/* PO Table */}
      {loading && purchaseOrders.length === 0 ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="No Purchase Orders Found"
          message={searchTerm || statusFilter 
            ? "No PO numbers or supplier names match your active filter parameters."
            : "Generate purchase orders by selecting quotations and obtaining manager approvals."}
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm text-slate-650">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                    <th className="py-4 px-6">PO Number</th>
                    <th className="py-4 px-6">RFQ Title</th>
                    <th className="py-4 px-6">Vendor</th>
                    <th className="py-4 px-6 text-right">Grand Total</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6">Issue Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">{po.po_number}</td>
                      <td className="py-4 px-6 max-w-[200px] truncate font-bold text-slate-900" title={po.rfq_title}>
                        {po.rfq_title}
                      </td>
                      <td className="py-4 px-6 text-slate-900">{po.vendor_name}</td>
                      <td className="py-4 px-6 text-right font-black text-slate-900">{formatCurrency(po.grand_total)}</td>
                      <td className="py-4 px-6 text-center">{getStatusBadge(po.status)}</td>
                      <td className="py-4 px-6 text-slate-500">{formatDate(po.issue_date)}</td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/purchase-orders/${po.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:border-indigo-650 hover:text-green-600 hover:bg-green-50/10 transition"
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <span className="text-xs font-bold text-slate-500">
                Showing page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({totalRecords} records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default POList;
