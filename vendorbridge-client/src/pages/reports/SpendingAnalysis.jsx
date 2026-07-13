import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getSpendingStats 
} from '../../api/analyticsApi';
import { 
  exportReportCSV, 
  exportReportExcel, 
  exportReportPDF 
} from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar 
} from 'recharts';
import { Download, Table, TrendingUp, Calendar, AlertCircle, RotateCcw } from 'lucide-react';

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(num);
};

const SpendingAnalysis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState('');
  const [month, setMonth] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

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
        year: year || undefined,
        quarter: quarter || undefined,
        month: month || undefined,
        vendor: vendorId || undefined,
        category: categoryId || undefined
      };
      const res = await getSpendingStats(filters);
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to load spending analysis.');
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
    setYear(new Date().getFullYear().toString());
    setQuarter('');
    setMonth('');
    setVendorId('');
    setCategoryId('');
    setTimeout(loadData, 50);
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const getActiveFilters = () => ({
    from: from || undefined,
    to: to || undefined,
    year: year || undefined,
    quarter: quarter || undefined,
    month: month || undefined,
    vendor: vendorId || undefined,
    category: categoryId || undefined
  });

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const blob = await exportReportCSV('spending', getActiveFilters());
      downloadFile(blob, `spending-report-${Date.now()}.csv`);
      setToastType('success');
      setToastMessage('CSV Report downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export CSV report.');
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const blob = await exportReportExcel('spending', getActiveFilters());
      downloadFile(blob, `spending-report-${Date.now()}.xls`);
      setToastType('success');
      setToastMessage('Excel Report downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export Excel report.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const blob = await exportReportPDF('spending', getActiveFilters());
      downloadFile(blob, `spending-report-${Date.now()}.pdf`);
      setToastType('success');
      setToastMessage('PDF Report downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export PDF report.');
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Procurement Spend Analysis" 
          subtitle="Audit organizational procurement spending patterns and export report documents"
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

      {/* Advanced Filter Selector */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="premium-input cursor-pointer text-xs"
            >
              <option value="">Any Year</option>
              {['2024', '2025', '2026'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Quarter</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="premium-input cursor-pointer text-xs"
            >
              <option value="">Any Quarter</option>
              {['1', '2', '3', '4'].map(q => (
                <option key={q} value={q}>Q{q}</option>
              ))}
            </select>
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
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category Scope ID</label>
            <input
              type="number"
              placeholder="e.g. 2"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="premium-input text-xs"
            />
          </div>

          <div className="flex gap-2 items-end md:col-span-2">
            <button
              onClick={loadData}
              className="flex-1 rounded-2xl bg-primary hover:bg-primary-hover py-2.5 text-xs font-black text-white transition duration-150 shadow-md shadow-indigo-600/10 cursor-pointer h-[42px]"
            >
              Apply Query
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E] shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Spend Value</span>
            <span className="text-xl font-black text-slate-950 truncate max-w-48 block">{formatCurrency(stats?.total_spend)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500 shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Average Order Value (PO)</span>
            <span className="text-xl font-black text-slate-950 truncate max-w-48 block">{formatCurrency(stats?.average_order_value)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-purple-500 shrink-0">
            <Table size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Orders Issued</span>
            <span className="text-xl font-black text-slate-950">{stats?.po_count || 0} POs</span>
          </div>
        </div>
      </div>

      {/* Content panel */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
          {/* Detailed Spend Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor-wise spend chart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
              <h3 className="text-sm font-black text-slate-950">Vendor-wise Spend Distribution (Top 10)</h3>
              <div className="h-80 w-full">
                {stats?.vendor_wise?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.vendor_wise} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="vendor_name" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="total_spend" fill="#22C55E" radius={[6, 6, 0, 0]} name="Spend Value (INR)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    No vendor spend logs found.
                  </div>
                )}
              </div>
            </div>

            {/* Category-wise spend chart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
              <h3 className="text-sm font-black text-slate-950">Category-wise Spend Distribution</h3>
              <div className="h-80 w-full">
                {stats?.category_wise?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.category_wise} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="category_name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="total_spend" fill="#22D3EE" radius={[6, 6, 0, 0]} name="Spend Value (INR)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    No category spend logs found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export card options */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 h-fit space-y-5">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Download size={18} className="text-[#22C55E]" />
              <span>Document Export Options</span>
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Export spend breakdowns, vendor response audits, and procurement transactions in standardized formats for reporting.
            </p>

            <div className="space-y-3 pt-2">
              {/* CSV */}
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white hover:border-[#22C55E] px-4 py-3.5 text-xs font-bold text-slate-700 hover:text-[#22C55E] transition duration-150 cursor-pointer disabled:opacity-50"
              >
                <span>Export as CSV File</span>
                <Download size={14} />
              </button>

              {/* Excel */}
              <button
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white hover:border-cyan-500 px-4 py-3.5 text-xs font-bold text-slate-700 hover:text-cyan-600 transition duration-150 cursor-pointer disabled:opacity-50"
              >
                <span>Export as MS Excel (XLS)</span>
                <Download size={14} />
              </button>

              {/* PDF */}
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white hover:border-pink-500 px-4 py-3.5 text-xs font-bold text-slate-700 hover:text-pink-600 transition duration-150 cursor-pointer disabled:opacity-50"
              >
                <span>Export as Print PDF Document</span>
                <Download size={14} />
              </button>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/50 border border-amber-100 p-3 text-[11px] text-amber-600">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> PDF documents are dynamically generated and may require a few seconds to compile.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingAnalysis;
