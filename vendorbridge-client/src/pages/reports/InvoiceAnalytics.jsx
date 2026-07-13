import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInvoiceStats } from '../../api/analyticsApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { CreditCard, DollarSign, Percent, AlertTriangle } from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#EF4444'];

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(num);
};

const InvoiceAnalytics = () => {
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
      const res = await getInvoiceStats();
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load invoice analytics.');
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

  // Payment Status Chart Data
  const paymentStatusData = stats?.payment_status_breakdown?.map(item => ({
    name: item.payment_status,
    value: item.count
  })) || [];

  const collectionRatioData = [
    { name: 'Paid Balance', amount: stats?.paid_amount || 0 },
    { name: 'Outstanding Balance', amount: stats?.outstanding_amount || 0 }
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Invoices & Payments Analytics" 
          subtitle="Track payment fulfillment, billing distributions, and outstanding collection values"
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
            <CreditCard size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Paid Total</span>
            <span className="text-xl font-black text-emerald-600 truncate max-w-44 block">
              {formatCurrency(stats?.paid_amount)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Outstanding Balance</span>
            <span className="text-xl font-black text-rose-600 truncate max-w-44 block">
              {formatCurrency(stats?.outstanding_amount)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Invoice value</span>
            <span className="text-xl font-black text-slate-950 truncate max-w-44 block">
              {formatCurrency(stats?.average_invoice_value)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-purple-500 shrink-0">
            <Percent size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Collection Rate</span>
            <span className="text-xl font-black text-slate-950">
              {stats?.paid_amount + stats?.outstanding_amount > 0 
                ? ((stats.paid_amount / (stats.paid_amount + stats.outstanding_amount)) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Invoices Payment Status Breakdown</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => {
                      const payColors = {
                        Paid: '#10B981',
                        Unpaid: '#EF4444',
                        Partial: '#3B82F6'
                      };
                      return <Cell key={`cell-${index}`} fill={payColors[entry.name] || COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-semibold text-slate-400">No invoices generated yet.</span>
            )}
          </div>
        </div>

        {/* Collection Values */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Cash Collection Ratio (Paid vs Outstanding)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionRatioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="amount" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Value (INR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Invoice Details Status lists */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
        <h3 className="text-sm font-black text-slate-950">Active Invoice Counters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Draft Invoices</span>
            <span className="text-xl font-black text-slate-900 mt-1">{stats?.draft_invoices || 0}</span>
          </div>
          
          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Sent to Vendor (Unpaid)</span>
            <span className="text-xl font-black text-slate-900 mt-1">{stats?.sent_invoices || 0}</span>
          </div>

          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Cancelled / Void Invoices</span>
            <span className="text-xl font-black text-rose-600 mt-1">{stats?.cancelled_invoices || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceAnalytics;
