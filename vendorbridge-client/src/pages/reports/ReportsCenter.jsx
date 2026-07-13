import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getExportHistory, 
  exportReportCSV, 
  exportReportExcel, 
  exportReportPDF 
} from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { Download, FileText, Calendar, Filter, Database, FileSpreadsheet, RotateCcw } from 'lucide-react';

const ReportsCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Filter states
  const [reportType, setReportType] = useState('summary');
  const [format, setFormat] = useState('pdf');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState('');
  const [quarter, setQuarter] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [vendorId, setVendorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rfqType, setRfqType] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [poStatus, setPoStatus] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');

  const [generating, setGenerating] = useState(false);
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

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getExportHistory();
      if (res.status === 'success') {
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setMonth('');
    setQuarter('');
    setYear(new Date().getFullYear().toString());
    setVendorId('');
    setCategoryId('');
    setRfqType('');
    setApprovalStatus('');
    setPoStatus('');
    setInvoiceStatus('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const filters = {
        from: from || undefined,
        to: to || undefined,
        month: month || undefined,
        quarter: quarter || undefined,
        year: year || undefined,
        vendor: vendorId || undefined,
        category: categoryId || undefined,
        rfq_type: rfqType || undefined,
        approval_status: approvalStatus || undefined,
        po_status: poStatus || undefined,
        invoice_status: invoiceStatus || undefined
      };

      let blob;
      let filename = `report-${reportType}-${Date.now()}`;

      if (format === 'csv') {
        blob = await exportReportCSV(reportType, filters);
        filename += '.csv';
      } else if (format === 'excel') {
        blob = await exportReportExcel(reportType, filters);
        filename += '.xls';
      } else {
        blob = await exportReportPDF(reportType, filters);
        filename += '.pdf';
      }

      // Trigger browser download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setToastType('success');
      setToastMessage('Report generated and downloaded successfully!');
      
      // Refresh download history
      fetchHistory();
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
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
          title="Reports & Export Center" 
          subtitle="Generate audit-ready spreadsheets, summaries, and PDF documents"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Filter Form */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-6 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <Filter size={18} className="text-[#22C55E]" />
              <span>Report Parameters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Report Document Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="premium-input cursor-pointer font-bold text-xs"
                >
                  <option value="summary">Procurement Summary Report</option>
                  <option value="vendors">Vendor Directory Report</option>
                  <option value="vendor-performance">Vendor Performance Report</option>
                  <option value="spending">Procurement Spending Report</option>
                  <option value="rfqs">Request for Quotations (RFQ) Log</option>
                  <option value="quotations">Vendor Quotations Log</option>
                  <option value="approvals">Approval Workflow Log</option>
                  <option value="purchase-orders">Purchase Orders Summary</option>
                  <option value="invoices">Invoices & Payments Summary</option>
                  {user?.role === 'admin' && <option value="audit-activity">Audit Activity Log</option>}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['pdf', 'excel', 'csv'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3.5 transition duration-150 cursor-pointer ${
                        format === fmt
                          ? 'border-[#22C55E] bg-green-50/30 text-primary font-bold'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350'
                      }`}
                    >
                      {fmt === 'pdf' ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                      <span className="text-[10px] font-black uppercase mt-1.5">{fmt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Time Range Filters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Year</label>
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
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Quarter</label>
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
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="premium-input cursor-pointer text-xs"
                  >
                    <option value="">Any Month</option>
                    {Array.from({ length: 12 }, (_, idx) => {
                      const mNum = idx + 1;
                      const dateObj = new Date(2025, idx, 1);
                      const mName = dateObj.toLocaleString('en-IN', { month: 'long' });
                      return <option key={mNum} value={mNum.toString()}>{mName}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Date Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="premium-input text-xs"
                    />
                    <span className="text-xs text-slate-400 font-bold">to</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="premium-input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Categorization & Scope Filters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Vendor Scope ID</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="premium-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Vendor Category ID</label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="premium-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">RFQ Type</label>
                  <select
                    value={rfqType}
                    onChange={(e) => setRfqType(e.target.value)}
                    className="premium-input cursor-pointer text-xs"
                  >
                    <option value="">Any Type</option>
                    {['Hardware', 'Software', 'Services', 'Logistics', 'Stationery', 'Other'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Approval Status</label>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value)}
                    className="premium-input cursor-pointer text-xs"
                  >
                    <option value="">Any Status</option>
                    {['Draft', 'Pending Approval', 'Approved', 'Rejected'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">PO Status</label>
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value)}
                    className="premium-input cursor-pointer text-xs"
                  >
                    <option value="">Any Status</option>
                    {['Draft', 'Generated', 'Sent', 'Acknowledged', 'Shipped', 'Delivered', 'Fulfilled', 'Closed', 'Cancelled'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Invoice Status</label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value)}
                    className="premium-input cursor-pointer text-xs"
                  >
                    <option value="">Any Status</option>
                    {['Draft', 'Generated', 'Sent', 'Viewed', 'Paid', 'Cancelled'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-6 py-4 text-sm font-black text-white hover:scale-[1.01] transition shadow-md shadow-green-600/15 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Spinner size={16} />
                  <span>Compiling Document...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Compile and Generate Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Download History */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-base font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Database size={18} className="text-cyan-500" />
            <span>Download History</span>
          </h3>

          {loadingHistory ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-xs font-semibold text-slate-400">
              No recent report exports found.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {history.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-100 p-3.5 hover:border-slate-250 transition space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 capitalize font-black">{log.report_type.replace(/-/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                      log.export_format === 'pdf' ? 'border-pink-200 bg-pink-50 text-pink-600' : 'border-emerald-250 bg-emerald-50 text-emerald-600'
                    }`}>{log.export_format}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{new Date(log.created_at).toLocaleString('en-IN')}</div>
                  <p className="text-[10px] truncate text-slate-500 font-mono bg-slate-50 p-1 rounded">{log.filename}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsCenter;
