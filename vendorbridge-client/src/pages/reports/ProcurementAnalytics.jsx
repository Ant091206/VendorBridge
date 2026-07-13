import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProcurementStats } from '../../api/analyticsApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, AlertCircle, ShoppingBag, FileText, Filter, RotateCcw } from 'lucide-react';

const CHART_COLORS = ['#22C55E', '#22D3EE', '#F59E0B', '#EF4444', '#10B981', '#EC4899'];

const ProcurementAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rfqType, setRfqType] = useState('');

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
      const filters = {
        from: from || undefined,
        to: to || undefined,
        vendor: vendorId || undefined,
        category: categoryId || undefined,
        rfq_type: rfqType || undefined
      };
      const res = await getProcurementStats(filters);
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load procurement analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setVendorId('');
    setCategoryId('');
    setRfqType('');
    // Trigger reload
    setTimeout(loadData, 50);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const rfqStatusPieData = [
    { name: 'Open / Published', value: stats?.rfqs_published || 0 },
    { name: 'Closed', value: stats?.rfqs_closed || 0 },
    { name: 'Cancelled', value: stats?.rfqs_cancelled || 0 },
    { name: 'Draft', value: (stats?.rfqs_created || 0) - (stats?.rfqs_published || 0) - (stats?.rfqs_closed || 0) - (stats?.rfqs_cancelled || 0) }
  ].filter(item => item.value > 0);

  const ratesData = [
    { name: 'Quotation Submission Rate', value: stats?.quotation_submission_rate || 0 },
    { name: 'Vendor Selection Rate', value: stats?.vendor_selection_rate || 0 },
    { name: 'Approval Success Rate', value: stats?.approval_success_rate || 0 },
    { name: 'PO Generation Rate', value: stats?.purchase_order_generation_rate || 0 },
    { name: 'Invoice Generation Rate', value: stats?.invoice_generation_rate || 0 }
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Procurement Metrics & Analytics" 
          subtitle="Enterprise approval pipelines, bidding success ratios, and document generation metrics"
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

      {/* Filter Options Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="premium-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="premium-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Vendor Scope ID</label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="premium-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">RFQ Type</label>
            <select
              value={rfqType}
              onChange={(e) => setRfqType(e.target.value)}
              className="premium-input cursor-pointer text-xs"
            >
              <option value="">Any Type</option>
              {['Hardware', 'Software', 'Services', 'Logistics', 'Stationery', 'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-end">
            <button
              onClick={loadData}
              className="flex-1 rounded-2xl bg-primary hover:bg-primary-hover py-2.5 text-xs font-black text-white transition duration-150 shadow-md shadow-indigo-600/10 cursor-pointer h-[42px]"
            >
              Apply
            </button>
            <button
              onClick={handleResetFilters}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer transition"
              title="Reset Filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E] shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">RFQ Bidding Success Rate</span>
            <span className="text-xl font-black text-slate-950">
              {stats?.approval_success_rate || 0}%
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total RFQs Created</span>
            <span className="text-xl font-black text-slate-950">{stats?.rfqs_created || 0}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-purple-500 shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Participation Rate</span>
            <span className="text-xl font-black text-slate-950">{stats?.vendor_participation_rate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* RFQ Status Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
            <span>RFQ status breakdown</span>
          </h3>
          <div className="h-72 w-full">
            {rfqStatusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rfqStatusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rfqStatusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No RFQs tracked in this query.
              </div>
            )}
          </div>
        </div>

        {/* Process rates breakdown list */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4 flex flex-col justify-center">
          <h3 className="text-sm font-black text-slate-950">Procurement Process Conversion Pipeline</h3>
          <div className="space-y-4">
            {ratesData.map((rate, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>{rate.name}</span>
                  <span className="text-green-600 font-black">{rate.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-green-505 bg-[#22C55E] rounded-full" style={{ width: `${rate.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementAnalytics;
