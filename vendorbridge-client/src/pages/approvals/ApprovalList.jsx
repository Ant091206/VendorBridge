import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getApprovals, 
  createApproval 
} from '../../api/approvalApi';
import { getAllQuotations } from '../../api/quotationApi';
import { getUsers } from '../../api/userApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  Plus, 
  X, 
  FileText, 
  AlertCircle,
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const ApprovalList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scoped list states
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states for creating request
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [managers, setManagers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Create form inputs
  const [formQuoteId, setFormQuoteId] = useState('');
  const [formManagerId, setFormManagerId] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: '' });

  const isOfficer = user?.role === 'officer';
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canCreate = isOfficer || isAdmin;

  // 1. Fetch approval requests
  const fetchApprovalsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        sort: sortBy
      };

      const response = await getApprovals(params);
      if (response.status === 'success') {
        setRequests(response.data || []);
        setStats(response.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setTotalPages(response.pagination?.total_pages || 1);
      } else {
        setError('Failed to fetch approval requests.');
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
  }, [page, statusFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApprovalsList();
  };

  const handleRefresh = () => {
    fetchApprovalsList();
    setToast({ message: 'Approvals list refreshed.', type: 'success' });
  };

  // 2. Open Create Request Modal
  const handleOpenCreateModal = async () => {
    setFormQuoteId('');
    setFormManagerId('');
    setFormReason('');
    setFormRemarks('');
    setFormError('');
    setModalLoading(true);
    setShowCreateModal(true);

    try {
      // Fetch selected quotations & users
      const [quotesRes, usersRes] = await Promise.all([
        getAllQuotations({ status: 'selected' }),
        getUsers()
      ]);

      // Filter quotations where status === 'selected' (just in case backend doesn't filter perfectly)
      const selectedBids = (quotesRes.data || []).filter(q => q.status === 'selected');
      
      // Filter out quotes that already have active approval requests
      // Note: we can look at the current requests table, or just keep them
      // We will let the backend validate strictly, but client-side we can filter out from our loaded requests
      const usedQuoteIds = requests.map(r => r.quotation_id);
      const availableQuotes = selectedBids.filter(q => !usedQuoteIds.includes(q.id));

      setSelectedQuotes(availableQuotes);

      // Filter users who are managers/admins
      const activeApprovers = (usersRes.data || []).filter(
        u => (u.role === 'manager' || u.role === 'admin') && u.status === 'active'
      );
      setManagers(activeApprovers);
    } catch (err) {
      console.error(err);
      setFormError('Failed to load selected quotations or managers list.');
    } finally {
      setModalLoading(false);
    }
  };

  // Pre-fill reason from quotation notes when selected
  useEffect(() => {
    if (formQuoteId) {
      const selected = selectedQuotes.find(q => q.id === parseInt(formQuoteId));
      if (selected) {
        setFormReason(selected.notes || 'Lowest Cost Bid matching required technical specs.');
      }
    }
  }, [formQuoteId]);

  // 3. Create Approval Request
  const handleCreateApprovalRequest = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formQuoteId || !formManagerId || !formReason.trim()) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    const selectedQ = selectedQuotes.find(q => q.id === parseInt(formQuoteId));
    if (!selectedQ) {
      setFormError('Invalid quotation selection.');
      return;
    }

    setSubmittingRequest(true);
    try {
      await createApproval({
        rfq_id: selectedQ.rfq_id,
        quotation_id: selectedQ.id,
        vendor_id: selectedQ.vendor_id,
        assigned_to: parseInt(formManagerId),
        selection_reason: formReason.trim(),
        remarks: formRemarks ? formRemarks.trim() : ''
      });

      setToast({ message: 'Approval request created successfully in Draft status.', type: 'success' });
      setShowCreateModal(false);
      fetchApprovalsList();
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to initialize approval request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Pending Approval':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Cancelled':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Popup */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#22C55E]">Workflow Dashboard</p>
          <h1 className="text-3xl font-black text-slate-950 font-sans mt-0.5">Approvals Management</h1>
          <p className="text-sm font-semibold text-slate-500">
            Monitor, submit, and review quotation selection approvals in the procurement cycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw size={18} />
          </button>
          
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-5 py-3 text-sm font-black text-white hover:from-[#16A34A] hover:to-[#9946e6] transition-all shadow-md shadow-green-500/10 cursor-pointer"
            >
              <Plus size={16} /> Create Request
            </button>
          )}

          {isManager && (
            <button
              onClick={() => navigate('/approvals/queue')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 text-sm font-black hover:bg-slate-800 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 size={16} /> My Queue
            </button>
          )}
        </div>
      </div>

      {/* Stats Dashboard Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Pending card */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/20 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Pending Decisions</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block font-mono">{stats.pending}</span>
          </div>
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Approved card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">Approved Requests</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block font-mono">{stats.approved}</span>
          </div>
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ThumbsUp size={20} />
          </div>
        </div>

        {/* Rejected card */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">Rejected Requests</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block font-mono">{stats.rejected}</span>
          </div>
          <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <ThumbsDown size={20} />
          </div>
        </div>

        {/* Total card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/20 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Total Requests</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block font-mono">{stats.total}</span>
          </div>
          <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Filters Form */}
      <form onSubmit={handleSearchSubmit} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:grid-cols-4">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <input
            type="text"
            placeholder="Search by APR Number, RFQ or Vendor Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold outline-none transition focus:border-[#22C55E] focus:bg-white"
          />
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold outline-none transition focus:border-[#22C55E] focus:bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
            <Filter size={14} />
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold outline-none transition focus:border-[#22C55E] focus:bg-white cursor-pointer"
          >
            <option value="date_desc">Request Date (Newest first)</option>
            <option value="date_asc">Request Date (Oldest first)</option>
            <option value="amount_desc">Amount (Highest first)</option>
            <option value="amount_asc">Amount (Lowest first)</option>
          </select>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="rounded-[24px] bg-rose-50 border border-rose-100 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Data Table */}
      {loading && requests.length === 0 ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />
      ) : requests.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900">No Requests Found</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500 max-w-sm mx-auto">
            There are no approval requests matching your search queries or role accessibility scope.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Approval No.</th>
                  <th className="py-4 px-6">RFQ Title</th>
                  <th className="py-4 px-6">Vendor Name</th>
                  <th className="py-4 px-6 text-right">Grand Total</th>
                  <th className="py-4 px-6">Requested By</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Request Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {item.approval_number}
                    </td>
                    <td className="py-4 px-6 max-w-[200px] truncate font-bold text-slate-900" title={item.rfq_title}>
                      {item.rfq_title}
                    </td>
                    <td className="py-4 px-6 text-slate-800">{item.vendor_name}</td>
                    <td className="py-4 px-6 text-right font-black text-slate-950 font-mono">
                      {formatCurrency(item.grand_total)}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {item.requester_name}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDate(item.request_date)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/approvals/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-[#22C55E] transition"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-slate-100 bg-slate-50 px-6 py-4 font-bold text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Approval Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl space-y-6 animate-zoom-in">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#22C55E]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create Approval Request</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Initialize a procurement review request</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs font-bold text-rose-600">
                {formError}
              </div>
            )}

            {modalLoading ? (
              <div className="py-12 flex justify-center"><Spinner size={32} /></div>
            ) : (
              <form onSubmit={handleCreateApprovalRequest} className="space-y-4">
                {/* Quotation Selection */}
                <div>
                  <label htmlFor="quoteSelect" className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Selected Quotation <span className="text-rose-500">*</span></label>
                  <select
                    id="quoteSelect"
                    value={formQuoteId}
                    onChange={(e) => setFormQuoteId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#22C55E] focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Selected Quotation --</option>
                    {selectedQuotes.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.quotation_number} — {q.vendor_name} ({formatCurrency(q.grand_total)})
                      </option>
                    ))}
                  </select>
                  {selectedQuotes.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1">
                      ⚠️ No eligible selected quotations found. A quote must be marked as "Selected" first.
                    </p>
                  )}
                </div>

                {/* Manager Selection */}
                <div>
                  <label htmlFor="managerSelect" className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Assign Approver (Manager/Admin) <span className="text-rose-500">*</span></label>
                  <select
                    id="managerSelect"
                    value={formManagerId}
                    onChange={(e) => setFormManagerId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#22C55E] focus:bg-white cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Manager --</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selection Justification Reason */}
                <div>
                  <label htmlFor="reason" className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Selection Justification / Reason <span className="text-rose-500">*</span></label>
                  <textarea
                    id="reason"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    rows={3}
                    placeholder="Enter selection reason/justification comments..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#22C55E] focus:bg-white resize-none"
                    required
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label htmlFor="remarks" className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Officer Remarks <span className="text-slate-400 font-normal text-[10px]">(Optional)</span></label>
                  <textarea
                    id="remarks"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    rows={2}
                    placeholder="Provide any additional comments/instructions..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#22C55E] focus:bg-white resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest || selectedQuotes.length === 0}
                    className="rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-500/20 hover:from-[#16A34A] hover:to-[#9946e6] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingRequest ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalList;
