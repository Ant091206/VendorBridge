import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApprovals } from '../../api/approvalApi';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import ApproveModal from '../../components/ApproveModal';
import RejectModal from '../../components/RejectModal';
import { useAuth } from '../../context/AuthContext';

/**
 * ApprovalQueue Page Component
 * Manager's primary interface to review pending procurement selections.
 */
const ApprovalQueue = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab state: 'pending' | 'approved' | 'rejected' | 'all'
  const [activeTab, setActiveTab] = useState('pending');
  
  // Modal states
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Toast notifications state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllApprovals();
      if (response.status === 'success') {
        setApprovals(response.data);
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
    fetchApprovals();
  }, []);

  // Filter lists based on tab
  const pendingList = approvals.filter(a => a.decision === 'pending');
  const approvedList = approvals.filter(a => a.decision === 'approved');
  const rejectedList = approvals.filter(a => a.decision === 'rejected');

  const getFilteredApprovals = () => {
    switch (activeTab) {
      case 'pending':
        return pendingList;
      case 'approved':
        return approvedList;
      case 'rejected':
        return rejectedList;
      case 'all':
      default:
        return approvals;
    }
  };

  // Indian currency formatter
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
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

  const handleApproveClick = (approval) => {
    setSelectedApproval(approval);
    setShowApproveModal(true);
  };

  const handleRejectClick = (approval) => {
    setSelectedApproval(approval);
    setShowRejectModal(true);
  };

  const handleApproveSuccess = () => {
    setShowApproveModal(false);
    setSelectedApproval(null);
    setToastType('success');
    setToastMessage('Approved! Purchase Order has been generated.');
    fetchApprovals();
  };

  const handleRejectSuccess = () => {
    setShowRejectModal(false);
    setSelectedApproval(null);
    setToastType('success');
    setToastMessage('Procurement request rejected. State reverted.');
    fetchApprovals();
  };

  const filteredApprovals = getFilteredApprovals();

  if (loading && approvals.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedApproval && (
        <ApproveModal
          approvalId={selectedApproval.id}
          rfqTitle={selectedApproval.rfq_title}
          vendorName={selectedApproval.vendor_name}
          grandTotal={parseFloat(selectedApproval.total_price) * 1.18}
          onSuccess={handleApproveSuccess}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedApproval(null);
          }}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <RejectModal
          approvalId={selectedApproval.id}
          rfqTitle={selectedApproval.rfq_title}
          onSuccess={handleRejectSuccess}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedApproval(null);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Approval Workflows</h1>
        <p className="text-sm text-slate-400">
          Review, approve, or reject pending quotation selections from procurement officers.
        </p>
      </div>

      {/* Error Message banner */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex flex-wrap -mb-px gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 text-sm font-semibold border-b-2 transition duration-150 ${
              activeTab === 'pending'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === 'pending'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-4 text-sm font-semibold border-b-2 transition duration-150 ${
              activeTab === 'approved'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {approvedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`pb-4 text-sm font-semibold border-b-2 transition duration-150 ${
              activeTab === 'rejected'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejected
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === 'rejected'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {rejectedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-sm font-semibold border-b-2 transition duration-150 ${
              activeTab === 'all'
                ? 'border-slate-400 text-slate-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-400`}>
              {approvals.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Grid List of approval requests */}
      {filteredApprovals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">
            {activeTab === 'pending'
              ? "No pending approvals. You're all caught up!"
              : `No ${activeTab} approvals found.`}
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            {activeTab === 'pending'
              ? "New procurement requests will appear here once selection takes place."
              : "Try exploring other tabs to view processed requests."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApprovals.map((approval) => {
            const subtotal = parseFloat(approval.total_price);
            const gstAmount = subtotal * 0.18;
            const grandTotal = subtotal + gstAmount;

            return (
              <div
                key={approval.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition duration-200 hover:border-slate-700/80 hover:shadow-xl relative overflow-hidden group"
              >
                {/* Visual glow on group hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

                <div className="relative space-y-4">
                  {/* Title & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-white text-base tracking-tight line-clamp-1 flex-1">
                      {approval.rfq_title}
                    </h3>
                    <Badge status={approval.decision} />
                  </div>

                  <hr className="border-slate-800/80" />

                  {/* Vendor Details */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor details</div>
                    <div className="text-sm font-semibold text-slate-200">{approval.vendor_name}</div>
                    <div className="text-xs text-slate-400">
                      Category: {approval.vendor_category || 'General Supply'}
                    </div>
                  </div>

                  <hr className="border-slate-800/80" />

                  {/* Pricing Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pricing details</div>
                    <div className="grid grid-cols-2 text-xs gap-y-1 text-slate-400">
                      <span>Unit Price:</span>
                      <span className="text-right font-semibold text-slate-300">
                        {formatCurrency(approval.unit_price)}
                      </span>
                      <span>Total Price:</span>
                      <span className="text-right font-semibold text-slate-300">
                        {formatCurrency(subtotal)}
                      </span>
                      <span>Delivery Time:</span>
                      <span className="text-right font-semibold text-slate-300">
                        {approval.delivery_days} days
                      </span>
                      <span>GST (18%):</span>
                      <span className="text-right font-semibold text-slate-300">
                        {formatCurrency(gstAmount)}
                      </span>
                      <span className="text-sm font-bold text-slate-300 mt-1">Grand Total:</span>
                      <span className="text-right text-sm font-bold text-emerald-400 mt-1">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-800/80" />

                  {/* Date details */}
                  <div className="grid grid-cols-2 gap-y-1 text-[11px] text-slate-500">
                    <div>RFQ Deadline:</div>
                    <div className="text-right font-medium text-slate-400">{formatDate(approval.rfq_deadline)}</div>
                    <div>Submitted At:</div>
                    <div className="text-right font-medium text-slate-400">{formatDate(approval.quotation_submitted_at)}</div>
                  </div>

                  {approval.decision !== 'pending' && approval.decided_at && (
                    <>
                      <hr className="border-slate-800/80" />
                      <div className="rounded-lg bg-slate-800/30 p-2.5 text-xs text-slate-400">
                        <div className="flex justify-between font-semibold">
                          <span>Decided by:</span>
                          <span className="text-slate-300">{approval.approver_name || 'System Manager'}</span>
                        </div>
                        <div className="mt-1 line-clamp-2 italic text-slate-400">
                          "{approval.remarks || 'No remarks provided.'}"
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 relative">
                  <Link
                    to={`/approvals/${approval.id}`}
                    className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition duration-150"
                  >
                    View Details
                  </Link>
                  
                  {approval.decision === 'pending' && (user?.role === 'manager' || user?.role === 'admin') && (
                    <>
                      <button
                        onClick={() => handleRejectClick(approval)}
                        className="py-2 px-3.5 text-xs font-semibold rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent transition duration-150"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveClick(approval)}
                        className="py-2 px-3.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition duration-150 shadow-md hover:shadow-emerald-600/10"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
