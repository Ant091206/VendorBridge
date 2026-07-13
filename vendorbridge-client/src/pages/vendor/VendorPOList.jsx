import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVendorPOs } from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';

const VendorPOList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, issued: 0, pending_acknowledgement: 0, fulfilled: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchVendorOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await getVendorPOs(params);
      if (response.status === 'success') {
        setOrders(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
      } else {
        setError('Failed to fetch purchase orders.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders();
  }, [statusFilter, searchTerm]);

  // Currency formatter
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
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200 animate-pulse">
            <Send className="h-3 w-3" /> Action Required (Issued)
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Orders Issued to Me</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review contracts, shipping parameters, and transaction totals. Action outstanding items.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              fetchVendorOrders();
              setToast({ message: 'Orders refreshed.', type: 'success' });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-650 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => { setStatusFilter(''); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${!statusFilter ? 'border-indigo-650 bg-indigo-55/10' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Total Assigned POs</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Issued'); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Issued' ? 'border-blue-650 bg-blue-55/10' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 font-sans">Awaiting Acknowledge</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.pending_acknowledgement}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Fulfilled'); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Fulfilled' ? 'border-emerald-650 bg-emerald-55/10' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Completed (Fulfilled)</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.fulfilled}</h4>
        </button>

        <button
          onClick={() => { setStatusFilter('Cancelled'); }}
          className={`rounded-2xl border p-4 text-left shadow-sm transition ${statusFilter === 'Cancelled' ? 'border-rose-650 bg-rose-55/10' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400">Cancelled</p>
          <h4 className="text-2xl font-black text-slate-900 mt-1">{stats.cancelled}</h4>
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-premium sm:grid-cols-3 items-center">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by PO number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="premium-input pl-10"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); }}
            className="premium-input pr-10 cursor-pointer text-slate-650"
          >
            <option value="">All Statuses</option>
            <option value="Issued">Issued (Action Required)</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Partially Fulfilled">Partially Fulfilled</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-450">
            <Filter className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="No Purchase Orders Assigned"
          message={searchTerm || statusFilter 
            ? "No PO numbers match your active search filter parameters."
            : "Any purchase orders issued by procurement will appear here."}
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-premium">
          <table className="w-full text-left border-collapse text-sm text-slate-650">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">PO Number</th>
                <th className="py-4 px-6">RFQ Contract Title</th>
                <th className="py-4 px-6 text-right">Order Amount</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6">Issue Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {orders.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  className="hover:bg-slate-50/50 cursor-pointer transition duration-150 group"
                >
                  <td className="py-4 px-6 font-mono font-bold text-slate-900 group-hover:text-green-600 transition">
                    {po.po_number}
                  </td>
                  <td className="py-4 px-6 max-w-[240px] truncate font-bold text-slate-900" title={po.rfq_title}>
                    {po.rfq_title}
                  </td>
                  <td className="py-4 px-6 text-right font-black text-slate-900">
                    {formatCurrency(po.grand_total)}
                  </td>
                  <td className="py-4 px-6 text-center">{getStatusBadge(po.status)}</td>
                  <td className="py-4 px-6 text-slate-500">{formatDate(po.issue_date)}</td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:border-indigo-650 hover:text-green-600 hover:bg-green-50/10 transition"
                    >
                      <Eye className="h-4 w-4" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorPOList;
