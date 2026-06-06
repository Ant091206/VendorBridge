import React, { useState, useEffect, useRef } from 'react';
import {
  getDashboardStats,
  getMonthlySpending,
  getVendorPerformance,
  getRFQAnalytics,
  getSpendingByCategory,
  getTopVendors,
  exportVendors,
  exportPurchaseOrders,
  exportInvoices
} from '../api/reportApi';
import { downloadCSV } from '../utils/downloadCSV';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

/**
 * Reports & Analytics Page Component
 * Four-tab layout: Overview | Vendor Performance | RFQ Analytics | Export Data
 */

// ── Chart color palette ──
const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// ── Currency formatter ──
const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹ 0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

// ── Animated counter hook ──
const useCountUp = (target, duration = 1000) => {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target === 0 || target === null || target === undefined) { setValue(0); return; }
    let start = 0;
    const startTime = performance.now();
    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    ref.current = requestAnimationFrame(step);
    return () => ref.current && cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return value;
};

// ── KPI Card with counter ──
const KPICard = ({ label, value, isCurrency = false, color = 'indigo' }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animatedVal = useCountUp(isCurrency ? Math.round(numericValue) : numericValue);

  const colorMap = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colorMap[color] || colorMap.indigo} p-5 shadow-sm`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-2 text-2xl font-bold text-white">
        {isCurrency ? formatCurrency(animatedVal) : animatedVal.toLocaleString('en-IN')}
      </div>
    </div>
  );
};

// ── Loading skeleton ──
const SkeletonCard = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm animate-pulse">
    <div className="h-3 w-24 bg-slate-700 rounded mb-3" />
    <div className="h-7 w-20 bg-slate-700 rounded" />
  </div>
);

// ── Custom tooltip for bar chart ──
const MonthlyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl text-sm">
        <p className="font-bold text-white mb-1">{label}</p>
        <p className="text-slate-300">Spend: <span className="text-indigo-400 font-bold">{formatCurrency(payload[0].value)}</span></p>
        <p className="text-slate-400">POs: <span className="text-white font-semibold">{payload[0].payload.po_count}</span></p>
      </div>
    );
  }
  return null;
};

// ── Custom tooltip for pie chart ──
const CategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl text-sm">
        <p className="font-bold text-white mb-1">{payload[0].name}</p>
        <p className="text-slate-300">Spend: <span className="text-indigo-400 font-bold">{formatCurrency(payload[0].value)}</span></p>
        <p className="text-slate-400">Share: <span className="text-white font-semibold">{payload[0].payload.percentage}%</span></p>
      </div>
    );
  }
  return null;
};


const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // ── Overview tab state ──
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryData, setCategoryData] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // ── Vendor Performance tab state ──
  const [vendorPerf, setVendorPerf] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [sortField, setSortField] = useState('total_business_value');
  const [sortDir, setSortDir] = useState('desc');
  const [vendorLoading, setVendorLoading] = useState(true);

  // ── RFQ Analytics tab state ──
  const [rfqData, setRfqData] = useState(null);
  const [rfqLoading, setRfqLoading] = useState(true);

  // ── Export tab state ──
  const [exportingVendors, setExportingVendors] = useState(false);
  const [exportingPOs, setExportingPOs] = useState(false);
  const [exportingInvoices, setExportingInvoices] = useState(false);

  // ── Load Overview data ──
  const loadOverview = async () => {
    setOverviewLoading(true);
    try {
      const [statsRes, monthRes, catRes, topRes] = await Promise.all([
        getDashboardStats(),
        getMonthlySpending(selectedYear),
        getSpendingByCategory(),
        getTopVendors()
      ]);
      if (statsRes.status === 'success') setStats(statsRes.data);
      if (monthRes.status === 'success') setMonthlyData(monthRes.data || []);
      if (catRes.status === 'success') setCategoryData(catRes.data || []);
      if (topRes.status === 'success') setTopVendors(topRes.data || []);
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to load overview data.');
    } finally {
      setOverviewLoading(false);
    }
  };

  // ── Load Vendor Performance ──
  const loadVendorPerf = async () => {
    setVendorLoading(true);
    try {
      const res = await getVendorPerformance();
      if (res.status === 'success') setVendorPerf(res.data || []);
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to load vendor performance data.');
    } finally {
      setVendorLoading(false);
    }
  };

  // ── Load RFQ Analytics ──
  const loadRFQAnalytics = async () => {
    setRfqLoading(true);
    try {
      const res = await getRFQAnalytics();
      if (res.status === 'success') setRfqData(res.data);
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to load RFQ analytics.');
    } finally {
      setRfqLoading(false);
    }
  };

  // Load data per active tab
  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'vendor') loadVendorPerf();
    if (activeTab === 'rfq') loadRFQAnalytics();
  }, [activeTab]);

  // Reload monthly data when year changes
  useEffect(() => {
    if (activeTab === 'overview') {
      getMonthlySpending(selectedYear).then(res => {
        if (res.status === 'success') setMonthlyData(res.data || []);
      }).catch(console.error);
    }
  }, [selectedYear]);

  // ── CSV Export handlers ──
  const handleExportVendors = async () => {
    setExportingVendors(true);
    try {
      await downloadCSV(exportVendors(), `vendors-${new Date().getFullYear()}.csv`);
      localStorage.setItem('vb_last_export_vendors', new Date().toISOString());
      setToastType('success');
      setToastMessage('Vendor CSV downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export vendors.');
    } finally {
      setExportingVendors(false);
    }
  };

  const handleExportPOs = async () => {
    setExportingPOs(true);
    try {
      await downloadCSV(exportPurchaseOrders(), `purchase-orders-${new Date().getFullYear()}.csv`);
      localStorage.setItem('vb_last_export_pos', new Date().toISOString());
      setToastType('success');
      setToastMessage('Purchase Orders CSV downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export purchase orders.');
    } finally {
      setExportingPOs(false);
    }
  };

  const handleExportInvoices = async () => {
    setExportingInvoices(true);
    try {
      await downloadCSV(exportInvoices(), `invoices-${new Date().getFullYear()}.csv`);
      localStorage.setItem('vb_last_export_invoices', new Date().toISOString());
      setToastType('success');
      setToastMessage('Invoices CSV downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export invoices.');
    } finally {
      setExportingInvoices(false);
    }
  };

  // ── Vendor sort handler ──
  const handleVendorSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedVendors = [...vendorPerf]
    .filter(v => vendorSearch ? v.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()) : true)
    .sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // ── Tab rendering ──
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'vendor', label: 'Vendor Performance' },
    { key: 'rfq', label: 'RFQ Analytics' },
    { key: 'export', label: 'Export Data' },
  ];

  const formatLastExport = (key) => {
    const val = localStorage.getItem(key);
    if (!val) return 'Never';
    const d = new Date(val);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── Sortable header component ──
  const SortHeader = ({ field, children }) => (
    <th
      scope="col"
      className="px-4 py-3 cursor-pointer hover:text-slate-200 transition select-none"
      onClick={() => handleVendorSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Comprehensive procurement intelligence and data exports</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-800 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold transition-all duration-150 border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-indigo-400 border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════ TAB 1: OVERVIEW ════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Summary Cards */}
          {overviewLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <KPICard label="Total Spend" value={stats.total_spend} isCurrency color="indigo" />
              <KPICard label="This Month Spend" value={stats.this_month_spend} isCurrency color="emerald" />
              <KPICard label="Total POs" value={stats.total_purchase_orders} color="cyan" />
              <KPICard label="Active Vendors" value={stats.active_vendors} color="purple" />
              <KPICard label="Avg Quotes/RFQ" value={stats.avg_quotations_per_rfq} color="amber" />
            </div>
          ) : null}

          {/* Monthly Spending Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Monthly Procurement Spend</h3>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:border-indigo-500 outline-none"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip content={<MonthlyTooltip />} />
                  <Bar dataKey="total_spend" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60 text-slate-500 text-sm">No spending data for {selectedYear}.</div>
            )}
          </div>

          {/* Spending by Category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Spend by Vendor Category</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total_spend"
                      nameKey="category_name"
                      cx="50%" cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ category_name, percentage }) => `${percentage}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CategoryTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-slate-500 text-sm">No category data available.</div>
              )}
            </div>

            {/* Category Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Category Breakdown</h3>
              {categoryData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Spend</th>
                        <th className="px-4 py-3 text-center">POs</th>
                        <th className="px-4 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {categoryData.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            {cat.category_name}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(cat.total_spend)}</td>
                          <td className="px-4 py-3 text-center">{cat.po_count}</td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-400">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No data.</div>
              )}
            </div>
          </div>

          {/* Top 5 Vendors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Top 5 Vendors by Value</h3>
            {topVendors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {topVendors.map((v) => (
                  <div key={v.rank} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 hover:border-indigo-500/30 transition">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-sm font-black text-indigo-400">
                        #{v.rank}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{v.category}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{v.vendor_name}</h4>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between"><span>Orders</span><span className="font-bold text-white">{v.total_orders}</span></div>
                      <div className="flex justify-between"><span>Value</span><span className="font-bold text-emerald-400">{formatCurrency(v.total_value)}</span></div>
                      <div className="flex justify-between"><span>Win Rate</span><span className="font-bold text-amber-400">{v.win_rate}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No vendor data available.</div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ TAB 2: VENDOR PERFORMANCE ════════════ */}
      {activeTab === 'vendor' && (
        <div className="space-y-6">
          {vendorLoading ? (
            <div className="flex h-60 items-center justify-center"><Spinner /></div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard label="Total Active Vendors" value={vendorPerf.length} color="indigo" />
                <KPICard
                  label="Avg Win Rate"
                  value={vendorPerf.length > 0 ? parseFloat((vendorPerf.reduce((s, v) => s + v.win_rate, 0) / vendorPerf.length).toFixed(1)) : 0}
                  color="emerald"
                />
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-600/20 to-amber-600/5 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Performer</span>
                  <div className="mt-2 text-lg font-bold text-white truncate">
                    {vendorPerf.length > 0 ? vendorPerf[0].vendor_name : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search vendor name..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:border-indigo-500 outline-none"
              />

              {/* Performance Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <SortHeader field="vendor_name">Vendor</SortHeader>
                      <th className="px-4 py-3">Category</th>
                      <SortHeader field="total_rfqs_invited">Invited</SortHeader>
                      <SortHeader field="total_quotes_submitted">Quoted</SortHeader>
                      <SortHeader field="quotes_selected">Selected</SortHeader>
                      <SortHeader field="win_rate">Win Rate</SortHeader>
                      <SortHeader field="avg_unit_price">Avg Price</SortHeader>
                      <SortHeader field="total_business_value">Total Value</SortHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {sortedVendors.map((v, idx) => {
                      const wrColor = v.win_rate > 50 ? 'bg-emerald-500' : v.win_rate >= 25 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <tr key={v.vendor_id} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-bold text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-white">{v.vendor_name}</td>
                          <td className="px-4 py-3 text-slate-400">{v.category_name}</td>
                          <td className="px-4 py-3 text-center">{v.total_rfqs_invited}</td>
                          <td className="px-4 py-3 text-center">{v.total_quotes_submitted}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-400">{v.quotes_selected}</td>
                          <td className="px-4 py-3 w-36">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div className={`h-full rounded-full ${wrColor}`} style={{ width: `${Math.min(v.win_rate, 100)}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-300 w-10 text-right">{v.win_rate}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{formatCurrency(v.avg_unit_price)}</td>
                          <td className="px-4 py-3 font-bold text-indigo-400">{formatCurrency(v.total_business_value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sortedVendors.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No vendors match the search criteria.</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════ TAB 3: RFQ ANALYTICS ════════════ */}
      {activeTab === 'rfq' && (
        <div className="space-y-8">
          {rfqLoading ? (
            <div className="flex h-60 items-center justify-center"><Spinner /></div>
          ) : rfqData ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard label="Total RFQs" value={rfqData.total_rfqs} color="indigo" />
                <KPICard label="Open" value={rfqData.open_rfqs} color="cyan" />
                <KPICard label="Closed" value={rfqData.closed_rfqs} color="purple" />
                <KPICard label="Converted to PO" value={rfqData.rfqs_converted_to_po} color="emerald" />
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-600/20 to-amber-600/5 p-5 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion Rate</span>
                  <div className="mt-2 text-2xl font-bold text-amber-400">{rfqData.conversion_rate}%</div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Conversion Funnel</h3>
                <div className="flex flex-col sm:flex-row items-stretch gap-0">
                  {[
                    { label: 'RFQs Created', value: rfqData.total_rfqs, color: 'from-blue-600 to-blue-700' },
                    { label: 'Quotations Received', value: rfqData.total_rfqs > 0 ? Math.round(rfqData.avg_quotes_per_rfq * rfqData.total_rfqs) : 0, color: 'from-teal-600 to-teal-700' },
                    { label: 'Closed / Decided', value: rfqData.closed_rfqs, color: 'from-purple-600 to-purple-700' },
                    { label: 'POs Generated', value: rfqData.rfqs_converted_to_po, color: 'from-indigo-600 to-indigo-700' },
                  ].map((step, idx) => (
                    <div key={idx} className="flex-1 relative">
                      <div className={`bg-gradient-to-r ${step.color} p-4 text-center ${idx === 0 ? 'rounded-l-xl' : ''} ${idx === 3 ? 'rounded-r-xl' : ''}`}>
                        <div className="text-2xl font-black text-white">{step.value}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-1">{step.label}</div>
                      </div>
                      {idx < 3 && (
                        <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-950 border border-slate-700 text-[10px] text-slate-400">
                          →
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RFQ Status Donut + Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">RFQ Status Distribution</h3>
                  {rfqData.rfqs_by_status && rfqData.rfqs_by_status.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={rfqData.rfqs_by_status.map(s => ({ name: s.status, value: s.count }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%" cy="50%"
                          outerRadius={90}
                          innerRadius={55}
                          paddingAngle={4}
                          label={({ name, value }) => `${name} (${value})`}
                          labelLine={false}
                        >
                          {rfqData.rfqs_by_status.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend formatter={(value) => <span className="text-xs text-slate-300 capitalize">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-60 text-slate-500 text-sm">No RFQ data available.</div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
                  <h3 className="text-lg font-semibold text-white">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4 text-center">
                      <div className="text-2xl font-black text-indigo-400">{rfqData.avg_quotes_per_rfq}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Avg Quotes/RFQ</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4 text-center">
                      <div className="text-2xl font-black text-cyan-400">{rfqData.avg_time_to_close}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Avg Days to Close</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4 text-center">
                      <div className="text-2xl font-black text-emerald-400">{rfqData.conversion_rate}%</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Conversion Rate</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4 text-center">
                      <div className="text-2xl font-black text-amber-400">{rfqData.closed_rfqs}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Total Closures</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ════════════ TAB 4: EXPORT DATA ════════════ */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vendor Export Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 hover:border-indigo-500/30 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Export Vendors</h3>
            <p className="text-sm text-slate-400">Download complete vendor list with all details</p>
            <p className="text-[11px] text-slate-500">Last exported: {formatLastExport('vb_last_export_vendors')}</p>
            <button
              onClick={handleExportVendors}
              disabled={exportingVendors}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {exportingVendors ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>

          {/* PO Export Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 hover:border-emerald-500/30 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Export Purchase Orders</h3>
            <p className="text-sm text-slate-400">Download all POs with vendor and amount details</p>
            <p className="text-[11px] text-slate-500">Last exported: {formatLastExport('vb_last_export_pos')}</p>
            <button
              onClick={handleExportPOs}
              disabled={exportingPOs}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {exportingPOs ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>

          {/* Invoice Export Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 hover:border-amber-500/30 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m0-7v.01M12 22a9 9 0 110-18 9 9 0 010 18z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Export Invoices</h3>
            <p className="text-sm text-slate-400">Download all invoices with payment status</p>
            <p className="text-[11px] text-slate-500">Last exported: {formatLastExport('vb_last_export_invoices')}</p>
            <button
              onClick={handleExportInvoices}
              disabled={exportingInvoices}
              className="w-full rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition shadow-md shadow-amber-600/20 disabled:opacity-50"
            >
              {exportingInvoices ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
