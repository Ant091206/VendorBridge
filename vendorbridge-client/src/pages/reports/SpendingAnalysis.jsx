import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getSpendingReport, 
  exportReportCSV, 
  exportReportExcel, 
  exportReportPDF 
} from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';
import { Download, Table, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

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
  const [spending, setSpending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSpendingReport(selectedYear);
      if (res.status === 'success') {
        setSpending(res.data || []);
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
  }, [user, selectedYear]);

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const blob = await exportReportCSV('spending', selectedYear);
      downloadFile(blob, `spending-report-${selectedYear}.csv`);
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
      const blob = await exportReportExcel('spending', selectedYear);
      downloadFile(blob, `spending-report-${selectedYear}.xls`);
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
      const blob = await exportReportPDF('spending', selectedYear);
      downloadFile(blob, `spending-report-${selectedYear}.pdf`);
      setToastType('success');
      setToastMessage('PDF Report downloaded successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to export PDF report.');
    } finally {
      setExportingPDF(false);
    }
  };

  // Calculate totals
  const totalSpend = spending.reduce((sum, item) => sum + item.total_spend, 0);
  const totalPOs = spending.reduce((sum, item) => sum + item.total_purchase_orders, 0);
  const totalRFQs = spending.reduce((sum, item) => sum + item.total_rfqs, 0);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Procurement Spend Analysis" 
          subtitle="Audit procurement spending and export report documents"
        />

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm outline-none cursor-pointer align-self-start sm:align-self-auto"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button onClick={() => navigate('/reports')} className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900">Overview</button>
        <button onClick={() => navigate('/reports/vendors')} className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900">Vendor Performance</button>
        <button onClick={() => navigate('/reports/analytics')} className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900">Procurement Analytics</button>
        <button onClick={() => navigate('/reports/spending')} className="px-5 py-3 text-sm font-black border-b-2 border-[#6D5DFC] text-[#6D5DFC]">Spending Analysis</button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#6D5DFC]">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Spend ({selectedYear})</span>
            <span className="text-xl font-black text-slate-950">{formatCurrency(totalSpend)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500">
            <Calendar size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total RFQs</span>
            <span className="text-xl font-black text-slate-950">{totalRFQs}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <Table size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Purchase Orders Issued</span>
            <span className="text-xl font-black text-slate-950">{totalPOs}</span>
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
          {/* Detailed Spend table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4 text-right">Spend (INR)</th>
                      <th className="px-6 py-4 text-center">RFQs Assigned</th>
                      <th className="px-6 py-4 text-center">POs Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {spending.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">
                          {item.month}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-black text-indigo-600">
                          {formatCurrency(item.total_spend)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {item.total_rfqs}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {item.total_purchase_orders}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Export card options */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 h-fit space-y-5">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Download size={18} className="text-[#6D5DFC]" />
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
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white hover:border-[#6D5DFC] px-4 py-3.5 text-xs font-bold text-slate-700 hover:text-[#6D5DFC] transition duration-150 cursor-pointer disabled:opacity-50"
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
