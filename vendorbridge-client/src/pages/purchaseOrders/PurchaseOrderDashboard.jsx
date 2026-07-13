import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllPOs } from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ArrowRight,
  Plus,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

const PurchaseOrderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, issued: 0, pending_acknowledgement: 0, fulfilled: 0, cancelled: 0 });
  const [recentPOs, setRecentPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllPOs({ page: 1, limit: 5 });
      if (response.status === 'success') {
        setRecentPOs(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
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

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">Purchase Order Dashboard</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Real-time procurement statuses, order KPIs, and quick management links.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchDashboardData();
              setToast({ message: 'Dashboard metrics refreshed.', type: 'success' });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-650 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {user?.role !== 'manager' && (
            <Link
              to="/purchase-orders/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition"
            >
              <Plus className="h-4 w-4" /> New Purchase Order
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* KPI Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total POs */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Purchase Orders</span>
            <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Generated all-time</p>
          </div>
        </div>

        {/* Issued POs */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Issued POs</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-500">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{stats.issued}</h3>
            <p className="text-xs font-semibold text-slate-450 mt-1">Dispatched to suppliers</p>
          </div>
        </div>

        {/* Pending Acknowledgement */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Pending Ack.</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{stats.pending_acknowledgement}</h3>
            <p className="text-xs font-semibold text-slate-450 mt-1">Awaiting confirmation</p>
          </div>
        </div>

        {/* Fulfilled POs */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Fulfilled Orders</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{stats.fulfilled}</h3>
            <p className="text-xs font-semibold text-slate-450 mt-1">Deliveries completed</p>
          </div>
        </div>

        {/* Cancelled POs */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Cancelled POs</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{stats.cancelled}</h3>
            <p className="text-xs font-semibold text-slate-450 mt-1">Revoked agreements</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent POs list and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent POs Table */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Purchase Orders</h2>
            <Link to="/purchase-orders" className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-650">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-black uppercase text-slate-450">
                  <th className="pb-3 pr-4">PO Number</th>
                  <th className="pb-3 pr-4">Vendor</th>
                  <th className="pb-3 pr-4 text-right">Grand Total</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold">
                {recentPOs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 pr-4 font-mono font-bold text-green-600">
                        <Link to={`/purchase-orders/${po.id}`} className="hover:underline">
                          {po.po_number}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-900 truncate max-w-[150px]" title={po.vendor_name}>
                        {po.vendor_name}
                      </td>
                      <td className="py-3.5 pr-4 text-right font-black text-slate-900">
                        {formatCurrency(po.grand_total)}
                      </td>
                      <td className="py-3.5 text-center">
                        {getStatusBadge(po.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Guidelines */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            {user?.role !== 'manager' && (
              <>
                <Link
                  to="/purchase-orders/create"
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-4 transition text-left"
                >
                  <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Create PO</h4>
                    <p className="text-xs text-slate-450 font-medium">Generate PO from approved quotation</p>
                  </div>
                </Link>

                <Link
                  to="/approvals"
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-4 transition text-left"
                >
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-650">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Approval Requests</h4>
                    <p className="text-xs text-slate-450 font-medium">View pending or approved requests</p>
                  </div>
                </Link>
              </>
            )}

            <Link
              to="/purchase-orders"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 p-4 transition text-left"
            >
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-650">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Purchase Orders List</h4>
                <p className="text-xs text-slate-450 font-medium">Search, filter, and edit orders</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDashboard;
