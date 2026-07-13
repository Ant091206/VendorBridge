import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getManagerApprovals } from '../../api/approvalApi';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import ApproveModal from '../../components/ApproveModal';
import RejectModal from '../../components/RejectModal';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert, RefreshCw, Search, Check, X, ExternalLink,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const ApprovalQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeTab, setActiveTab]       = useState('pending');
  const [searchTerm, setSearchTerm]     = useState('');
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [stats, setStats]               = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [toast, setToast]               = useState({ message: '', type: '' });

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusMap = {
        pending:  'Pending Approval',
        approved: 'Approved',
        rejected: 'Rejected',
        all:      undefined,
      };
      const response = await getManagerApprovals({
        page,
        limit: 10,
        status: statusMap[activeTab],
        search: searchTerm || undefined,
      });

      if (response.status === 'success') {
        setRequests(response.data || []);
        setStats(response.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
        setTotalPages(response.pagination?.total_pages || 1);
      } else {
        setError('Failed to load approvals queue.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, [activeTab, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const handleRefresh = () => {
    fetchQueue();
    setToast({ message: 'Queue refreshed.', type: 'success' });
  };

  const handleApproveSuccess = () => {
    setShowApproveModal(false);
    setSelectedApproval(null);
    setToast({ message: 'Request approved successfully.', type: 'success' });
    fetchQueue();
  };

  const handleRejectSuccess = () => {
    setShowRejectModal(false);
    setSelectedApproval(null);
    setToast({ message: 'Request rejected.', type: 'success' });
    fetchQueue();
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Access guard
  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-[#E5E7EB] rounded-xl">
        <ShieldAlert size={40} className="text-[#DC2626] mb-3" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-[#111827] mb-1">Access Denied</h2>
        <p className="text-sm text-[#6B7280] mb-5">Only Managers and Administrators can access the approval queue.</p>
        <button
          onClick={() => navigate('/approvals')}
          className="btn-secondary cursor-pointer"
        >
          Go to Approvals
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'pending',  label: 'Pending',      count: stats.pending  },
    { id: 'approved', label: 'Approved',     count: stats.approved },
    { id: 'rejected', label: 'Rejected',     count: stats.rejected },
    { id: 'all',      label: 'All',          count: stats.total    },
  ];

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {/* Approve / Reject Modals */}
      {showApproveModal && selectedApproval && (
        <ApproveModal
          approvalId={selectedApproval.id}
          rfqTitle={selectedApproval.rfq_title}
          vendorName={selectedApproval.vendor_name}
          grandTotal={selectedApproval.grand_total}
          onSuccess={handleApproveSuccess}
          onClose={() => { setShowApproveModal(false); setSelectedApproval(null); }}
        />
      )}
      {showRejectModal && selectedApproval && (
        <RejectModal
          approvalId={selectedApproval.id}
          rfqTitle={selectedApproval.rfq_title}
          onSuccess={handleRejectSuccess}
          onClose={() => { setShowRejectModal(false); setSelectedApproval(null); }}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/approvals"
            className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#16A34A] transition-colors mb-1.5"
          >
            <ChevronLeft size={13} /> Approvals
          </Link>
          <h1 className="text-xl font-semibold text-[#111827]">Approval Queue</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            Review and decide on quotation selections pending your decision.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="btn-secondary cursor-pointer shrink-0"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      {/* ── Tabs + Search ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-4 px-5 border-b border-[#E5E7EB]">
          {/* Tab nav */}
          <nav className="flex items-center gap-0 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors duration-100 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#16A34A] text-[#16A34A]'
                    : 'border-transparent text-[#6B7280] hover:text-[#374151] hover:border-[#E5E7EB]'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-medium min-w-[20px] text-center ${
                    activeTab === tab.id
                      ? 'bg-[#DCFCE7] text-[#15803D]'
                      : 'bg-[#F3F4F6] text-[#9CA3AF]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-[6px] border border-[#E5E7EB] bg-[#F9FAFB] pl-9 pr-3 text-sm text-[#111827] outline-none focus:border-[#16A34A] focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,163,74,0.1)] transition-all duration-150"
            />
          </form>
        </div>

        {/* ── Table ── */}
        {loading && requests.length === 0 ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F6] mx-auto mb-3">
              <Check size={22} strokeWidth={1.5} className="text-[#9CA3AF]" />
            </div>
            <h3 className="text-sm font-semibold text-[#374151]">
              {activeTab === 'pending' ? 'All clear — no pending approvals' : `No ${activeTab} approvals found`}
            </h3>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              {activeTab === 'pending' ? 'New requests will appear here.' : 'Try a different tab or search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="vb-table-header rounded-tl-xl">Approval</th>
                  <th className="vb-table-header">RFQ Title</th>
                  <th className="vb-table-header">Vendor</th>
                  <th className="vb-table-header text-right">Total</th>
                  <th className="vb-table-header">Delivery</th>
                  <th className="vb-table-header">Status</th>
                  <th className="vb-table-header rounded-tr-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item, i) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F9FAFB] transition-colors duration-100 group"
                  >
                    {/* Approval # */}
                    <td className="vb-table-cell">
                      <span className="text-xs font-mono text-[#9CA3AF]">
                        {item.approval_number}
                      </span>
                    </td>

                    {/* RFQ Title */}
                    <td className="vb-table-cell">
                      <p className="font-medium text-[#111827] max-w-[200px] truncate" title={item.rfq_title}>
                        {item.rfq_title}
                      </p>
                      {item.selection_reason && (
                        <p className="text-xs text-[#9CA3AF] italic mt-0.5 max-w-[200px] truncate">
                          "{item.selection_reason}"
                        </p>
                      )}
                    </td>

                    {/* Vendor */}
                    <td className="vb-table-cell">
                      <p className="font-medium text-[#374151]">{item.vendor_name}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">{item.quotation_number}</p>
                    </td>

                    {/* Total */}
                    <td className="vb-table-cell text-right">
                      <span className="font-semibold text-[#111827] font-mono text-sm">
                        {formatCurrency(item.grand_total)}
                      </span>
                    </td>

                    {/* Delivery */}
                    <td className="vb-table-cell">
                      <span className="text-sm text-[#374151]">{item.delivery_days}d</span>
                    </td>

                    {/* Status */}
                    <td className="vb-table-cell">
                      <Badge status={item.status} />
                    </td>

                    {/* Actions */}
                    <td className="vb-table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/approvals/${item.id}`}
                          className="btn-ghost h-8 px-3 text-xs cursor-pointer"
                          title="View details"
                        >
                          <ExternalLink size={13} />
                          <span className="hidden lg:inline">Details</span>
                        </Link>

                        {item.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => { setSelectedApproval(item); setShowRejectModal(true); }}
                              className="h-8 px-3 rounded-[6px] text-xs font-medium border border-[#E5E7EB] text-[#6B7280] hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors duration-100 cursor-pointer flex items-center gap-1"
                              title="Reject"
                            >
                              <X size={13} />
                              <span className="hidden lg:inline">Reject</span>
                            </button>
                            <button
                              onClick={() => { setSelectedApproval(item); setShowApproveModal(true); }}
                              className="btn-primary h-8 px-3 text-xs cursor-pointer"
                              title="Approve"
                            >
                              <Check size={13} />
                              <span className="hidden lg:inline">Approve</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#F3F4F6]">
            <span className="text-sm text-[#9CA3AF]">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn-secondary h-8 w-8 px-0 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page number pills */}
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-[6px] text-sm font-medium transition-colors duration-100 cursor-pointer ${
                      page === pageNum
                        ? 'bg-[#16A34A] text-white'
                        : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="btn-secondary h-8 w-8 px-0 cursor-pointer disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;
