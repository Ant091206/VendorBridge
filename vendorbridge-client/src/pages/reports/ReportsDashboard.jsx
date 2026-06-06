import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getSummaryReport, 
  getSpendingReport, 
  getMonthlyTrendsAnalytics 
} from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { 
  TrendingUp, Users, FileText, ClipboardList, 
  ShoppingCart, Receipt, ShieldAlert 
} from 'lucide-react';

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(num);
};

const ReportsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [spending, setSpending] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, spendRes, trendRes] = await Promise.all([
        getSummaryReport(),
        getSpendingReport(selectedYear),
        getMonthlyTrendsAnalytics()
      ]);

      if (sumRes.status === 'success') setSummary(sumRes.data);
      if (spendRes.status === 'success') setSpending(spendRes.data || []);
      if (trendRes.status === 'success') setTrends(trendRes.data || []);
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load report dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedYear]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Define tab navigation buttons
  const isVendor = user?.role === 'vendor';

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Procurement Dashboard" 
          subtitle="Enterprise analytics, purchasing growth, and spend tracking"
        />

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm outline-none cursor-pointer"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => navigate('/reports')}
          className="px-5 py-3 text-sm font-black border-b-2 border-[#6D5DFC] text-[#6D5DFC]"
        >
          Overview
        </button>
        <button
          onClick={() => navigate('/reports/vendors')}
          className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900"
        >
          Vendor Performance
        </button>
        <button
          onClick={() => navigate('/reports/analytics')}
          className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900"
        >
          Procurement Analytics
        </button>
        <button
          onClick={() => navigate('/reports/spending')}
          className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900"
        >
          Spending Analysis
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {/* Card 1 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#6D5DFC]">
              <TrendingUp size={18} />
            </div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Procurement Spend</span>
            <div className="text-lg font-black text-slate-950 mt-1 truncate">
              {formatCurrency(summary.total_spend)}
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-500">
              <Users size={18} />
            </div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">
              {isVendor ? 'Profile' : 'Total Vendors'}
            </span>
            <div className="text-lg font-black text-slate-950 mt-1">
              {summary.total_vendors}
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              <FileText size={18} />
            </div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Total RFQs</span>
            <div className="text-lg font-black text-slate-950 mt-1">
              {summary.total_rfqs}
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
              <ClipboardList size={18} />
            </div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Quotations</span>
            <div className="text-lg font-black text-slate-950 mt-1">
              {summary.total_quotations}
            </div>
          </div>

          {/* Card 5 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
              <ShoppingCart size={18} />
            </div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Purchase Orders</span>
            <div className="text-lg font-black text-slate-950 mt-1">
              {summary.total_purchase_orders}
            </div>
          </div>

          {/* Card 6 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
              <Receipt size={18} />
            </div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Invoices</span>
            <div className="text-lg font-black text-slate-950 mt-1">
              {summary.total_invoices}
            </div>
          </div>
        </div>
      )}

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spend Line Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Monthly Procurement Spend ({selectedYear})</h3>
          <div className="h-80 w-full">
            {spending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spending} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Spend']} />
                  <Legend />
                  <Line type="monotone" dataKey="total_spend" stroke="#6D5DFC" strokeWidth={3} activeDot={{ r: 8 }} name="Spend (INR)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No spending data recorded for this period.
              </div>
            )}
          </div>
        </div>

        {/* Growth Area Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Procurement Activity Trends (Last 6 Months)</h3>
          <div className="h-80 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRfq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6D5DFC" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6D5DFC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="rfq_growth" stroke="#6D5DFC" strokeWidth={2} fillOpacity={1} fill="url(#colorRfq)" name="RFQs Created" />
                  <Area type="monotone" dataKey="procurement_growth" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorProc)" name="Value (INR)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No activity trend logs found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
