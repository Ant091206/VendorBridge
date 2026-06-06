import React, { useState } from 'react';
import { approveRequest } from '../api/approvalApi';

/**
 * ApproveModal Component
 * Props:
 *   - approvalId: ID of the approval request
 *   - rfqTitle: Title of the RFQ
 *   - vendorName: Name of the selected vendor
 *   - grandTotal: Grand total price (formatted or numeric)
 *   - onSuccess: Callback to trigger after approval succeeds
 *   - onClose: Callback to close the modal
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
      console.error(err);
      setError(err.message || 'Failed to approve procurement request.');
    } finally {
      setLoading(false);
    }
  };

  // Format amount as INR
  const formatCurrency = (val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return val;
      val = parsed;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Approve Procurement Request</h3>
            <p className="text-xs text-slate-400">Review selection and auto-generate Purchase Order</p>
          </div>
        </div>

        {/* Procurement Summary */}
        <div className="mt-5 rounded-xl bg-slate-800/40 border border-slate-800/60 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">RFQ Title:</span>
            <span className="font-semibold text-slate-200 text-right max-w-[70%] truncate">{rfqTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Vendor:</span>
            <span className="font-semibold text-slate-200">{vendorName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Grand Total:</span>
            <span className="font-bold text-emerald-400">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-slate-300 mb-1.5">
              Remarks / Approval Comments <span className="text-slate-500 text-xs">(Optional)</span>
            </label>
            <textarea
              id="remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide any additional comments or instructions for the procurement officer..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm Approve'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveModal;
