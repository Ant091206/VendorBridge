import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllApprovals } from '../../api/approvalApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, RefreshCw, Eye } from 'lucide-react';

const ApprovalList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchApprovalsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.decision = statusFilter;
      
      const response = await getAllApprovals(params);
      if (response.status === 'success') {
        setApprovals(response.data || []);
      } else {
        setError('Failed to fetch approvals.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalsList();
  }, [statusFilter]);

  const handleRefresh = () => {
    fetchApprovalsList();
    setToastType('success');
    setToastMessage('Approvals list refreshed.');
  };

  // Indian currency formatting
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

  // Client-side search filtering
  const filteredApprovals = approvals.filter(item => {
    const rfqTitle = item.rfq_title || '';
    const vendorName = item.vendor_name || '';
    const approverName = item.approver_name || '';
    const requestedBy = item.requested_by_name || '';
    const approvalId = String(item.id);

    const matchesSearch = 
      rfqTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approvalId.includes(searchTerm);

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Procurement Approvals Audit" 
          subtitle="Audit trail of quotation selection decisions and PO authorization requests"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 cursor-pointer text-slate-500"
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
          
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <button
              onClick={() => navigate('/approvals/queue')}
              className="rounded-2xl bg-[#6D5DFC] hover:bg-[#5b4deb] px-5 py-2.5 text-xs font-black text-white transition duration-150 shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              Open Approval Queue
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, RFQ, Vendor or Requested By..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#6D5DFC] focus:bg-white focus:outline-none transition font-semibold"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative min-w-[180px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-bold text-slate-600 focus:border-[#6D5DFC] focus:outline-none transition appearance-none cursor-pointer"
          >
            <option value="">All Decisions</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
            <Filter size={14} />
          </div>
        </div>
      </div>

      {/* Content Table */}
      {loading && approvals.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <Spinner />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#6D5DFC]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-black text-slate-900">No Approvals Found</h3>
          <p className="mt-2 text-xs text-slate-500 max-w-sm font-semibold">
            There are no approval requests corresponding to the search terms or decision status.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Approval ID</th>
                <th className="py-4 px-6">RFQ Number / Title</th>
                <th className="py-4 px-6">Vendor</th>
                <th className="py-4 px-6 text-right">Quotation Amount</th>
                <th className="py-4 px-6">Requested By</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600 font-semibold">
              {filteredApprovals.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition duration-150 group">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">AP-{String(item.id).padStart(4, '0')}</td>
                  <td className="py-3.5 px-6 max-w-[200px] truncate font-bold text-slate-900" title={item.rfq_title}>
                    {item.rfq_title}
                  </td>
                  <td className="py-3.5 px-6 text-slate-900">{item.vendor_name}</td>
                  <td className="py-3.5 px-6 text-right font-black text-indigo-600">{formatCurrency(item.total_price)}</td>
                  <td className="py-3.5 px-6 text-slate-500">{item.requested_by_name || 'Procurement Officer'}</td>
                  <td className="py-3.5 px-6 text-center">
                    <Badge status={item.decision} />
                  </td>
                  <td className="py-3.5 px-6 text-slate-400 font-semibold">{formatDate(item.decided_at || item.quotation_submitted_at)}</td>
                  <td className="py-3.5 px-6 text-right">
                    <Link
                      to={`/approvals/${item.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-[#6D5DFC]/10 text-slate-700 hover:text-[#6D5DFC] px-3.5 py-2 text-xs font-bold transition duration-150"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </Link>
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

export default ApprovalList;
