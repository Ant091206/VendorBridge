import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPurchaseOrderStats } from '../../api/analyticsApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, RefreshCw, FileText, CheckCircle2, TrendingUp } from 'lucide-react';

const COLORS = ['#22C55E', '#3B82F6', '#10B981', '#EF4444', '#94A3B8'];

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(num);
};

const PurchaseOrderAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const tabs = [
    { label: 'Overview', path: '/reports' },
    { label: 'Vendor Performance', path: '/reports/vendors' },
    { label: 'Procurement Analytics', path: '/reports/analytics' },
    { label: 'Spending Analysis', path: '/reports/spending' },
    { label: 'Approvals', path: '/reports/approvals' },
    { label: 'Purchase Orders', path: '/reports/pos' },
    { label: 'Invoices', path: '/reports/invoices' },
    { label: 'Reports Center', path: '/reports/center' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPurchaseOrderStats();
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load purchase order analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const statusPieData = [
    { name: 'Issued/Sent', value: stats?.issued_pos || 0 },
    { name: 'Acknowledged', value: stats?.acknowledged_pos || 0 },
    { name: 'Fulfilled', value: stats?.fulfilled_pos || 0 },
    { name: 'Cancelled', value: stats?.cancelled_pos || 0 },
    { name: 'Draft', value: stats?.draft_pos || 0 }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Purchase Order Analytics" 
          subtitle="Monitor issued orders, values, and vendor delivery fulfillment success"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0 overflow-x-auto scrollbar-none whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-5 py-3 text-sm transition-all duration-150 cursor-pointer ${
              location.pathname === tab.path
                ? 'font-black border-b-2 border-[#22C55E] text-[#22C55E]'
                : 'font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E] shrink-0">
            <ShoppingCart size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total PO Value</span>
            <span className="text-xl font-black text-slate-950 truncate max-w-44 block">
              {formatCurrency(stats?.total_po_value)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Average Order Value</span>
            <span className="text-xl font-black text-slate-950 truncate max-w-44 block">
              {formatCurrency(stats?.average_po_value)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Fulfillment Rate</span>
            <span className="text-xl font-black text-slate-950">{stats?.vendor_fulfillment_rate || 0}%</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-purple-500 shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Fulfilled POs</span>
            <span className="text-xl font-black text-slate-950">{stats?.fulfilled_pos || 0} Orders</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">PO Status Distribution</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-semibold text-slate-400">No POs issued yet.</span>
            )}
          </div>
        </div>

        {/* PO Status count details list */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4 flex flex-col justify-center">
          <h3 className="text-sm font-black text-slate-950">Order Quantities Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500">Draft Orders (Awaiting Issue)</span>
              <span className="text-sm font-black text-slate-900">{stats?.draft_pos || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500">Issued / Dispatched to Vendor</span>
              <span className="text-sm font-black text-slate-900">{stats?.issued_pos || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500">Acknowledged by Vendor</span>
              <span className="text-sm font-black text-slate-900">{stats?.acknowledged_pos || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500">Fulfilled & Received</span>
              <span className="text-sm font-black text-emerald-600">{stats?.fulfilled_pos || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Cancelled / Void Orders</span>
              <span className="text-sm font-black text-rose-600">{stats?.cancelled_pos || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Fulfillment Performance */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
          <RefreshCw size={18} className="text-[#22C55E]" />
          <span>Vendor PO Delivery Fulfillment rates</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Vendor Partner</th>
                <th className="px-6 py-4 text-center">Total Orders Received</th>
                <th className="px-6 py-4 text-center">Fulfilled Successfully</th>
                <th className="px-6 py-4 text-right">Fulfillment Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
              {stats?.vendor_fulfillment_list?.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">{v.vendor_name}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">{v.total_pos}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap text-emerald-600 font-bold">{v.fulfilled_pos}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-black text-green-600">{v.fulfillment_rate}%</td>
                </tr>
              ))}
              {(!stats?.vendor_fulfillment_list || stats.vendor_fulfillment_list.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs font-semibold text-slate-400">
                    No vendor fulfillment stats available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderAnalytics;
