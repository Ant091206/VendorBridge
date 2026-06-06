import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getApprovalById } from '../../api/approvalApi';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import ApproveModal from '../../components/ApproveModal';
import RejectModal from '../../components/RejectModal';
import { useAuth } from '../../context/AuthContext';

/**
 * ApprovalDetails Page Component
 * Renders full analytical details of a procurement selection request.
 */
const ApprovalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals status
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Toast notifications status
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadApprovalDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovalById(id);
      if (response.status === 'success') {
        setApproval(response.data);
      } else {
        setError('Failed to fetch approval request details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovalDetails();
  }, [id]);

  // Indian Currency formatter
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0';
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApproveSuccess = () => {
    setShowApproveModal(false);
    setToastType('success');
    setToastMessage('Approved! Purchase Order has been generated.');
    loadApprovalDetails();
  };

  const handleRejectSuccess = () => {
    setShowRejectModal(false);
    setToastType('success');
    setToastMessage('Procurement request rejected. State reverted.');
    loadApprovalDetails();
  };

  if (loading && !approval) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error || 'Approval request details could not be found.'}
        </div>
        <button
          onClick={() => navigate('/approvals')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          &larr; Back to Approvals List
        </button>
      </div>
    );
  }

  const subtotal = parseFloat(approval.total_price);
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;

  // Destructure comparison variables
  const { total_vendors, lowest_price, difference, percentage_difference } = approval.comparison_summary || {};
  const isLowest = difference <= 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Toast Popups */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <ApproveModal
          approvalId={approval.id}
          rfqTitle={approval.rfq_title}
          vendorName={approval.vendor_name}
          grandTotal={grandTotal}
          onSuccess={handleApproveSuccess}
          onClose={() => setShowApproveModal(false)}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          approvalId={approval.id}
          rfqTitle={approval.rfq_title}
          onSuccess={handleRejectSuccess}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/approvals')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          &larr; Back to Approvals List
        </button>
        <Badge status={approval.decision} />
      </div>

      {/* Page Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight leading-normal font-sans">
          Procurement Review: {approval.rfq_title}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review comparisons and pricing matrices before making approval decisions.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Summary and Vendor Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section 1 — Procurement Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              RFQ Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Quantity</span>
                <span className="text-slate-200 font-semibold text-base">{approval.rfq_quantity} units</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Submission Deadline</span>
                <span className="text-slate-200 font-semibold text-base">{new Date(approval.rfq_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Detailed Specifications</span>
              <p className="text-sm text-slate-300 bg-slate-950/40 rounded-lg p-3 border border-slate-800/60 leading-relaxed whitespace-pre-wrap">
                {approval.rfq_description}
              </p>
            </div>
          </div>

          {/* Section 2 — Selected Vendor Profile */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Vendor Profile & Proposal Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Company Name</span>
                <span className="font-semibold text-slate-200">{approval.vendor_name}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Email Contact</span>
                <span className="font-semibold text-slate-200">{approval.vendor_email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">GST Registration</span>
                <span className="font-semibold text-slate-200 uppercase">{approval.vendor_gst || 'Not Provided'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Category</span>
                <span className="font-semibold text-slate-200">{approval.vendor_category || 'IT & General Supplies'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Proposed Delivery Time</span>
                <span className="font-semibold text-slate-200">{approval.delivery_days} calendar days</span>
              </div>
            </div>

            {approval.vendor_notes && (
              <div className="space-y-1 pt-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Vendor Proposal Notes</span>
                <p className="text-sm text-slate-400 bg-slate-950/30 rounded-lg p-3 italic border border-slate-800/40">
                  "{approval.vendor_notes}"
                </p>
              </div>
            )}
          </div>

          {/* Section 3 — Price Analysis card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Quotations & Bidding Analytics
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-lg bg-slate-950/40 border border-slate-800/80 p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Selected Bid</span>
                <div className="text-base font-bold text-slate-200 mt-1">{formatCurrency(subtotal)}</div>
              </div>
              <div className="rounded-lg bg-slate-950/40 border border-slate-800/80 p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Lowest Quote</span>
                <div className="text-base font-bold text-emerald-400 mt-1">{formatCurrency(lowest_price)}</div>
              </div>
              <div className="rounded-lg bg-slate-950/40 border border-slate-800/80 p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cost Difference</span>
                <div className={`text-base font-bold mt-1 ${isLowest ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isLowest ? 'Lowest Bid' : `+${formatCurrency(difference)}`}
                </div>
              </div>
              <div className="rounded-lg bg-slate-950/40 border border-slate-800/80 p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Bidders</span>
                <div className="text-base font-bold text-slate-200 mt-1">{total_vendors} Vendors</div>
              </div>
            </div>

            {/* Analysis details */}
            {!isLowest && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3.5 flex gap-3 text-amber-400 text-xs leading-relaxed">
                <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <span className="font-bold">Price Warning:</span> This quotation is <strong>{percentage_difference}%</strong> higher than the lowest submitted offer (which was {formatCurrency(lowest_price)}). Ensure vendor specifications or delivery guidelines justify the cost delta.
                </div>
              </div>
            )}
            
            {isLowest && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex gap-3 text-emerald-400 text-xs leading-relaxed">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-bold">Highly Optimized Selection:</span> This proposal represents the **lowest cost** bidder among all {total_vendors} quotation submissions.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice cost breakdown and action controls */}
        <div className="space-y-6">
          
          {/* Section 4 — Cost Breakdown Invoice */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Cost Breakdown</h2>
            
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-semibold text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GST (18% standard):</span>
                <span className="font-semibold text-slate-200">{formatCurrency(gstAmount)}</span>
              </div>
              <hr className="border-slate-800" />
              <div className="flex justify-between pt-1">
                <span className="font-bold text-white">Grand Total:</span>
                <span className="font-bold text-lg text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Section 5 — Decision Context Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">Workflow Actions</h2>
            
            {approval.decision === 'pending' ? (
              <div className="flex flex-col gap-3">
                {(user?.role === 'manager' || user?.role === 'admin') ? (
                  <>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/10 text-center cursor-pointer"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full py-3 px-4 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-sm border border-rose-500/20 hover:border-transparent transition text-center cursor-pointer"
                    >
                      Reject Request
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    Only users with manager role can process pending requests.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="rounded-lg bg-slate-950/45 p-4 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decision Status:</span>
                    <span className="font-bold uppercase"><Badge status={approval.decision} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decided By:</span>
                    <span className="font-medium text-slate-300">{approval.approver_name || 'System Manager'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decided At:</span>
                    <span className="font-medium text-slate-300">{formatDate(approval.decided_at)}</span>
                  </div>
                  <hr className="border-slate-800" />
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block">Decision Remarks:</span>
                    <span className="italic text-slate-300 leading-normal block">"{approval.remarks || 'No remarks provided.'}"</span>
                  </div>
                </div>

                {approval.decision === 'approved' && approval.po_id && (
                  <Link
                    to={`/purchase-orders/${approval.po_id}`}
                    className="block w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-center text-sm transition shadow-lg shadow-cyan-600/10"
                  >
                    View Purchase Order
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetails;
