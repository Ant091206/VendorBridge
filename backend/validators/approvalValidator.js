/**
 * approvalValidator.js — Validators for Module 6: Approval Request & Workflow Actions
 */

export const validateApprovalRequest = (payload) => {
  const errors = [];

  const rfqId = Number(payload.rfq_id);
  if (isNaN(rfqId) || rfqId <= 0) {
    errors.push('A valid RFQ ID is required.');
  }

  const quotationId = Number(payload.quotation_id);
  if (isNaN(quotationId) || quotationId <= 0) {
    errors.push('A valid Quotation ID is required.');
  }

  const vendorId = Number(payload.vendor_id);
  if (isNaN(vendorId) || vendorId <= 0) {
    errors.push('A valid Vendor ID is required.');
  }

  const assignedTo = Number(payload.assigned_to);
  if (isNaN(assignedTo) || assignedTo <= 0) {
    errors.push('Please assign the approval request to a valid approver/manager.');
  }

  if (!payload.selection_reason || !payload.selection_reason.trim()) {
    errors.push('Selection reason is required to initialize approval request.');
  }

  return errors;
};

export const validateRejectionPayload = (payload) => {
  const errors = [];
  if (!payload.remarks || !payload.remarks.trim()) {
    errors.push('Rejection remarks are mandatory.');
  }
  return errors;
};
