import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getApprovalById, 
  getApprovalHistory, 
  submitApproval, 
  cancelApproval 
} from '../../api/approvalApi';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import ApproveModal from '../../components/ApproveModal';
import RejectModal from '../../components/RejectModal';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  User, 
  Award, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  History,
  CheckCircle2,
  Trash2,
  Send,
  Briefcase
} from 'lucide-react';

const ApprovalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Toast notifications status
  const [toast, setToast] = useState({ message: '', type: '' });

  const loadApprovalDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApprovalById(id);
      if (response.status === 'success') {
        setRequest(response.data);
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

  const loadHistoryTimeline = async () => {
    setLoadingHistory(true);
    try {
      const response = await getApprovalHistory(id);
      if (response.status === 'success') {
        setHistoryList(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load history timeline:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadApprovalDetails();
    loadHistoryTimeline();
  }, [id]);

  const handleApproveSuccess = () => {
    setShowApproveModal(false);
    setToast({ message: 'Quotation selection has been APPROVED successfully.', type: 'success' });
    loadApprovalDetails();
    loadHistoryTimeline();
  };

  const handleRejectSuccess = () => {
    setShowRejectModal(false);
    setToast({ message: 'Quotation selection has been REJECTED. RFQ state reverted.', type: 'success' });
    loadApprovalDetails();
    loadHistoryTimeline();
  };

  const handleSubmitRequest = async () => {
    setProcessingAction(true);
    try {
      await submitApproval(id);
      setToast({ message: 'Approval request submitted successfully.', type: 'success' });
      loadApprovalDetails();
      loadHistoryTimeline();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to submit request.', type: 'error' });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelRequest = async () => {
    setProcessingAction(true);
    try {
      await cancelApproval(id);
      setToast({ message: 'Approval request cancelled successfully. RFQ state reverted.', type: 'success' });
      loadApprovalDetails();
      loadHistoryTimeline();
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to cancel request.', type: 'error' });
    } finally {
      setProcessingAction(false);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !request) {
    return <Spinner fullPage={true} />;
  }

  if (error || !request) {
    return (
      <div className="space-y-4 text-center max-w-lg mx-auto py-12">
        <div className="rounded-[24px] bg-rose-50 border border-rose-100 p-6 text-xs font-bold text-rose-600">
          {error || 'Approval request details could not be found.'}
        </div>
        <button
          onClick={() => navigate('/approvals')}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  const isCreator = request.requested_by === user.id;
  const isApprover = request.assigned_to === user.id || user.role === 'admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Toast Alert */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {processingAction && <Spinner fullPage={true} />}

      {/* Modals */}
      {showApproveModal && (
        <ApproveModal
          approvalId={request.id}
          rfqTitle={request.rfq_title}
          vendorName={request.vendor_name}
          grandTotal={request.grand_total}
          onSuccess={handleApproveSuccess}
          onClose={() => setShowApproveModal(false)}
        />
      )}

      {showRejectModal && (
        <RejectModal
          approvalId={request.id}
          rfqTitle={request.rfq_title}
          onSuccess={handleRejectSuccess}
          onClose={() => setShowRejectModal(false)}
        />
      )}

      {/* Navigation and status badge */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/approvals')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#22C55E] transition"
        >
          <ArrowLeft size={16} /> Back to Approvals Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Decision status:</span>
          <Badge status={request.status.toLowerCase()} />
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#22C55E] font-mono">Reference No: {request.approval_number}</span>
        <h1 className="text-2xl font-black text-slate-900 mt-1 leading-normal font-sans">
          Quotation Selection Review: {request.rfq_title}
        </h1>
      </div>

      {/* Summary grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Details summaries */}
        <div className="md:col-span-2 space-y-6">
          {/* RFQ specs summary */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-[#22C55E]" />
              RFQ Specifications
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
              <div>
                <span>RFQ Number</span>
                <span className="mt-1 block font-black text-slate-900 font-mono text-sm">{request.rfq_number}</span>
              </div>
              <div>
                <span>Required Quantity</span>
                <span className="mt-1 block font-black text-slate-900 font-mono text-sm">{request.rfq_quantity} units</span>
              </div>
              <div className="col-span-2">
                <span>Detailed Description</span>
                <p className="mt-1.5 text-slate-650 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 leading-relaxed font-semibold">
                  {request.rfq_description}
                </p>
              </div>
            </div>
          </div>

          {/* Selected Vendor Profile */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Briefcase size={18} className="text-[#22C55E]" />
              Vendor Profile & Proposal Notes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-bold text-slate-500">
              <div>
                <span>Vendor Corporate Name</span>
                <span className="mt-1 block text-slate-900 font-black text-sm">{request.vendor_name}</span>
              </div>
              <div>
                <span>Email Address</span>
                <span className="mt-1 block text-slate-900 text-sm font-mono">{request.vendor_email}</span>
              </div>
              <div>
                <span>Phone Contact</span>
                <span className="mt-1 block text-slate-900 text-sm font-mono">{request.vendor_phone}</span>
              </div>
              <div>
                <span>Corporate Address</span>
                <span className="mt-1 block text-slate-900 text-sm">{request.vendor_address || 'India'}</span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-3">
                <span>Quotation proposal notes</span>
                <p className="mt-1.5 text-slate-650 italic leading-relaxed font-semibold bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  {request.vendor_notes ? `"${request.vendor_notes}"` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Selection reasoning remarks */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-3">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-[#22C55E]" />
              Recommendation Justification
            </h2>
            <div className="text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Selection Reason remarks</span>
              <p className="mt-1.5 font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-2xl p-4 italic leading-relaxed">
                "{request.selection_reason}"
              </p>
            </div>
          </div>

          {/* Stepper Timeline History */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-6">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <History size={18} className="text-[#22C55E]" />
              Approval Workflow Timeline
            </h2>

            {loadingHistory ? (
              <div className="py-6 flex justify-center"><Spinner size={24} /></div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-6 text-slate-500 font-bold text-xs">No timeline events recorded.</div>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-6 space-y-6 ml-3 text-xs">
                {historyList.map((h, i) => (
                  <div key={i} className="relative">
                    {/* Stepper Dot */}
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white border-[#22C55E]" />
                    
                    <div className="space-y-1 font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900 text-sm">{h.action_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(h.action_date)}</span>
                      </div>
                      <p className="text-slate-500 flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        <span>{h.user_name} ({h.user_role})</span>
                      </p>
                      {h.remarks && (
                        <p className="text-slate-600 bg-slate-50 rounded-xl p-2.5 mt-1 border border-slate-100 italic">
                          "{h.remarks}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoicing breakdown and actions */}
        <div className="space-y-6">
          {/* Cost breakdown invoice card */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Proposal Breakdown</h2>
            <div className="space-y-2.5 text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>Quotation No:</span>
                <span className="text-slate-800 font-mono text-sm">{request.quotation_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-slate-800 font-mono">{formatCurrency(request.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount Amount:</span>
                <span className="text-rose-600 font-mono">- {formatCurrency(request.discount_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount (GST):</span>
                <span className="text-slate-800 font-mono">{formatCurrency(request.tax_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery days:</span>
                <span className="text-slate-800">{request.delivery_days} calendar days</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between pt-1 text-sm">
                <span className="font-black text-slate-900">Grand Total:</span>
                <span className="font-black text-base text-emerald-600 font-mono">{formatCurrency(request.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Workflow Action buttons */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_45px_rgba(15,23,42,0.04)] space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Workflow Controls</h2>

            {/* If Draft, Officer can submit */}
            {request.status === 'Draft' && (
              <div className="space-y-2">
                {isCreator ? (
                  <button
                    onClick={handleSubmitRequest}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-5 py-3 text-xs font-black text-white hover:from-[#16A34A] hover:to-[#9946e6] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 cursor-pointer"
                  >
                    <Send size={14} /> Submit Request
                  </button>
                ) : (
                  <p className="text-[10px] font-bold text-slate-400 text-center italic">
                    Waiting for the procurement officer to submit this request.
                  </p>
                )}
              </div>
            )}

            {/* If Pending Approval, Manager can Approve/Reject, Officer can Cancel */}
            {request.status === 'Pending Approval' && (
              <div className="space-y-3">
                {isApprover && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white transition shadow-md shadow-emerald-500/10 cursor-pointer text-center"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-rose-50 border border-rose-250 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-transparent text-xs font-bold transition cursor-pointer text-center"
                    >
                      Reject Request
                    </button>
                  </div>
                )}

                {isCreator && (
                  <button
                    onClick={handleCancelRequest}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-50 border border-amber-250 text-amber-600 hover:bg-amber-600 hover:text-white hover:border-transparent text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} /> Cancel Request
                  </button>
                )}

                {!isApprover && !isCreator && (
                  <p className="text-[10px] font-bold text-slate-400 text-center italic">
                    Assigned to approver: {request.approver_name}
                  </p>
                )}
              </div>
            )}

            {/* Completed states */}
            {['Approved', 'Rejected', 'Cancelled'].includes(request.status) && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5 text-xs font-bold text-slate-500">
                <div className="flex justify-between">
                  <span>Processed By:</span>
                  <span className="text-slate-800">{request.approver_name || 'System Approver'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Process Date:</span>
                  <span className="text-slate-800 font-mono text-[10px]">
                    {formatDate(request.approved_at || request.rejected_at || request.updated_at)}
                  </span>
                </div>
                {request.remarks && (
                  <div className="space-y-1.5 border-t border-slate-150 pt-2.5">
                    <span>Approver remarks / comments:</span>
                    <p className="italic font-semibold text-slate-700 block bg-white border border-slate-100 rounded-xl p-3 leading-normal">
                      "{request.remarks}"
                    </p>
                  </div>
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
