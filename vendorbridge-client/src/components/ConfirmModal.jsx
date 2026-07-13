import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal — Reusable confirmation dialog.
 * Props:
 *   - title: Dialog title (optional)
 *   - message: Body text
 *   - confirmLabel: Confirm button label (default: 'Confirm')
 *   - danger: If true, confirm button is red (default: true)
 *   - onConfirm: Callback on confirm
 *   - onCancel: Callback on cancel
 */
const ConfirmModal = ({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className="modal-panel max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF2F2]">
              <AlertTriangle size={17} className="text-[#DC2626]" />
            </div>
            <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-[#9CA3AF] hover:text-[#374151] transition-colors duration-100 mt-0.5 cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-[#6B7280] leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-5 pb-5">
          <button
            onClick={onCancel}
            className="btn-secondary cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger cursor-pointer' : 'btn-primary cursor-pointer'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
