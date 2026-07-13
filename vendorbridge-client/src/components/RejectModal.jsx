import React, { useState } from 'react';
import { rejectRequest } from '../api/approvalApi';
import { XCircle, X } from 'lucide-react';

/**
 * RejectModal — Rejects a procurement approval request.
 * Props: approvalId, rfqTitle, onSuccess, onClose
 */
const RejectModal = ({ approvalId, rfqTitle, onSuccess, onClose }) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!remarks.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setLoading(true);
    try {
      await rejectRequest(approvalId, { remarks: remarks.trim() });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to reject procurement request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2]">
              <XCircle size={17} className="text-[#DC2626]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Reject Request</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Reverts selection and notifies the officer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#374151] transition-colors duration-100 mt-0.5 cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* RFQ Summary */}
        <div className="px-5 pt-4 pb-0">
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 flex items-center justify-between gap-4">
            <span className="text-sm text-[#6B7280]">RFQ</span>
            <span className="text-sm font-medium text-[#111827] text-right truncate max-w-[70%]">{rfqTitle}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-sm text-[#DC2626]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-4">
          <div>
            <label htmlFor="reject-remarks" className="block text-sm font-medium text-[#374151] mb-1.5">
              Reason for rejection
              <span className="ml-1 text-[#DC2626]">*</span>
            </label>
            <textarea
              id="reject-remarks"
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Explain why this request is being rejected (e.g. pricing too high, better alternatives available)..."
              className="vb-textarea"
              disabled={loading}
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-danger cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;
