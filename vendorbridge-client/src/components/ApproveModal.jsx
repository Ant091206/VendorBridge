import React, { useState } from 'react';
import { approveRequest } from '../api/approvalApi';
import { CheckCircle, X } from 'lucide-react';

/**
 * ApproveModal — Confirms procurement approval and generates PO.
 * Props:
 *   - approvalId, rfqTitle, vendorName, grandTotal
 *   - onSuccess, onClose
 */
const ApproveModal = ({ approvalId, rfqTitle, vendorName, grandTotal, onSuccess, onClose }) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await approveRequest(approvalId, { remarks });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to approve procurement request.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7]">
              <CheckCircle size={17} className="text-[#16A34A]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Approve Request</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">This will generate a Purchase Order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#374151] transition-colors duration-100 mt-0.5 cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Summary */}
        <div className="px-5 pt-4 pb-0">
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] divide-y divide-[#F3F4F6]">
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-sm text-[#6B7280]">RFQ</span>
              <span className="text-sm font-medium text-[#111827] text-right max-w-[60%] truncate">{rfqTitle}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-sm text-[#6B7280]">Vendor</span>
              <span className="text-sm font-medium text-[#111827]">{vendorName}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5">
              <span className="text-sm text-[#6B7280]">Grand Total</span>
              <span className="text-sm font-semibold text-[#16A34A] font-mono">{formatCurrency(grandTotal)}</span>
            </div>
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
            <label htmlFor="approve-remarks" className="block text-sm font-medium text-[#374151] mb-1.5">
              Remarks
              <span className="ml-1 text-xs font-normal text-[#9CA3AF]">(optional)</span>
            </label>
            <textarea
              id="approve-remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any comments or instructions for the procurement team..."
              className="vb-textarea"
              disabled={loading}
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
              className="btn-primary cursor-pointer"
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
                'Confirm Approval'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveModal;
