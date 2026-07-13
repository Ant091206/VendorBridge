import db from '../config/db.js';
import { logAndNotify } from '../utils/activityAndNotificationHelper.js';

/**
 * Retrieves RFQ and quotation comparison data.
 * Supports server-side sorting, filtering, and pagination.
 * Computes Lowest Price and Fastest Delivery badges globally across participating quotes.
 */
export const getComparisonData = async (rfqId, query = {}, user) => {
  // 1. Fetch RFQ details
  const [rfqRows] = await db.execute(
    `SELECT id, rfq_number, title, description, status, submission_deadline, created_at
     FROM rfqs WHERE id = ?`,
    [rfqId]
  );

  if (rfqRows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }
  const rfq = rfqRows[0];

  // 2. Fetch all eligible quotations for the RFQ (excluding drafts/withdrawn) to calculate badges globally
  const [allQuotes] = await db.execute(
    `SELECT 
       q.id,
       q.quotation_number,
       q.rfq_id,
       q.vendor_id,
       v.name AS vendor_name,
       v.status AS vendor_status,
       q.subtotal,
       q.tax_amount,
       q.discount_amount,
       q.grand_total,
       q.delivery_days,
       q.notes,
       q.status AS quotation_status,
       q.submission_date,
       q.created_at
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.rfq_id = ? AND q.status NOT IN ('draft', 'withdrawn')`,
    [rfqId]
  );

  // Check comparison eligibility rules:
  // RFQ status = Published (open) or Closed
  // At least 2 quotations exist
  const isValidRFQStatus = ['open', 'published', 'closed'].includes(rfq.status);
  const hasAtLeastTwoQuotes = allQuotes.length >= 2;
  const eligible = isValidRFQStatus && hasAtLeastTwoQuotes;

  let message = '';
  if (!isValidRFQStatus) {
    message = 'RFQ must be in Published (Open) or Closed status to compare quotations.';
  } else if (!hasAtLeastTwoQuotes) {
    message = `Quotation comparison requires at least 2 submitted quotations. Currently, there are only ${allQuotes.length} submitted.`;
  }

  // Calculate lowest price and fastest delivery badges globally across all participating quotations
  if (allQuotes.length > 0) {
    const minPrice = Math.min(...allQuotes.map(q => Number(q.grand_total)));
    const minDelivery = Math.min(...allQuotes.map(q => Number(q.delivery_days)));

    allQuotes.forEach(q => {
      q.is_lowest_price = Number(q.grand_total) === minPrice;
      q.is_fastest_delivery = Number(q.delivery_days) === minDelivery;
      // Future rating & performance metrics placeholders
      q.vendor_rating = null;
      q.vendor_performance_metrics = null;
    });
  }

  // 3. Apply Filters in memory
  let filteredQuotes = [...allQuotes];

  if (query.status) {
    filteredQuotes = filteredQuotes.filter(q => q.quotation_status === query.status);
  }
  if (query.vendor_status) {
    filteredQuotes = filteredQuotes.filter(q => q.vendor_status === query.vendor_status);
  }
  if (query.min_price !== undefined && query.min_price !== '') {
    filteredQuotes = filteredQuotes.filter(q => Number(q.grand_total) >= Number(query.min_price));
  }
  if (query.max_price !== undefined && query.max_price !== '') {
    filteredQuotes = filteredQuotes.filter(q => Number(q.grand_total) <= Number(query.max_price));
  }
  if (query.min_delivery !== undefined && query.min_delivery !== '') {
    filteredQuotes = filteredQuotes.filter(q => q.delivery_days >= Number(query.min_delivery));
  }
  if (query.max_delivery !== undefined && query.max_delivery !== '') {
    filteredQuotes = filteredQuotes.filter(q => q.delivery_days <= Number(query.max_delivery));
  }

  // 4. Apply Sorting
  const sort = query.sort || 'price_asc';
  filteredQuotes.sort((a, b) => {
    switch (sort) {
      case 'price_asc':
        return Number(a.grand_total) - Number(b.grand_total);
      case 'price_desc':
        return Number(b.grand_total) - Number(a.grand_total);
      case 'delivery_asc':
        return a.delivery_days - b.delivery_days;
      case 'delivery_desc':
        return b.delivery_days - a.delivery_days;
      case 'date_desc':
        return new Date(b.submission_date || b.created_at) - new Date(a.submission_date || a.created_at);
      case 'date_asc':
        return new Date(a.submission_date || a.created_at) - new Date(b.submission_date || b.created_at);
      case 'vendor_name':
        return a.vendor_name.localeCompare(b.vendor_name);
      default:
        return Number(a.grand_total) - Number(b.grand_total);
    }
  });

  // 5. Apply Pagination
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 10, 1);
  const offset = (page - 1) * limit;
  const paginatedQuotes = filteredQuotes.slice(offset, offset + limit);

  // 6. Fetch selection recommendation if it exists
  const [selectionRows] = await db.execute(
    `SELECT qs.*, u.name AS selected_by_name, q.quotation_number, v.name AS vendor_name, q.grand_total, q.delivery_days
     FROM quotation_selections qs
     JOIN users u ON qs.selected_by = u.id
     JOIN quotations q ON qs.quotation_id = q.id
     JOIN vendors v ON q.vendor_id = v.id
     WHERE qs.rfq_id = ? LIMIT 1`,
    [rfqId]
  );

  return {
    rfq,
    eligible,
    message,
    total_quotes_count: allQuotes.length,
    filtered_quotes_count: filteredQuotes.length,
    quotations: paginatedQuotes,
    selection: selectionRows[0] || null,
    pagination: {
      page,
      limit,
      total: filteredQuotes.length,
      total_pages: Math.ceil(filteredQuotes.length / limit)
    }
  };
};

/**
 * Log when a Procurement Officer or Admin views the comparison details.
 */
export const logComparisonEvent = async (rfqId, userId) => {
  const [rfqRows] = await db.execute('SELECT id FROM rfqs WHERE id = ?', [rfqId]);
  if (rfqRows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.execute(
    `INSERT INTO quotation_comparisons (rfq_id, compared_by) VALUES (?, ?)`,
    [rfqId, userId]
  );

  // Log in Activity Logs
  await logAndNotify(userId, {
    action: 'COMPARISON_VIEWED',
    module: 'Quotation Comparison',
    entityType: 'rfq',
    entityId: rfqId,
    description: `Quotation comparison viewed for RFQ #${rfqId}`,
    ipAddress: null
  });

  return { success: true };
};

/**
 * Creates a quotation selection (recommendation) for an RFQ.
 */
export const createQuotationSelection = async (payload, userId) => {
  const { rfq_id, quotation_id, selection_reason } = payload;

  if (!rfq_id || !quotation_id || !selection_reason?.trim()) {
    const error = new Error('RFQ ID, quotation ID, and selection reason are required.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Retrieve and validate RFQ
  const [rfqRows] = await db.execute('SELECT status, title FROM rfqs WHERE id = ?', [rfq_id]);
  if (rfqRows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }
  const rfq = rfqRows[0];
  if (!['open', 'published', 'closed'].includes(rfq.status)) {
    const error = new Error(`RFQ selection is blocked. The RFQ status is: ${rfq.status}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate comparison conditions: minimum 2 submitted quotations
  const [allQuotes] = await db.execute(
    `SELECT id FROM quotations WHERE rfq_id = ? AND status NOT IN ('draft', 'withdrawn')`,
    [rfq_id]
  );
  if (allQuotes.length < 2) {
    const error = new Error('Quotation selection requires at least 2 submitted quotations for comparison.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Retrieve and validate the target quotation
  const [quoteRows] = await db.execute(
    `SELECT q.*, v.name AS vendor_name, v.email AS vendor_email 
     FROM quotations q 
     JOIN vendors v ON q.vendor_id = v.id 
     WHERE q.id = ? AND q.rfq_id = ? AND q.status NOT IN ('draft', 'withdrawn')`,
    [quotation_id, rfq_id]
  );
  if (quoteRows.length === 0) {
    const error = new Error('Quotation not found, is draft/withdrawn, or does not belong to this RFQ.');
    error.statusCode = 404;
    throw error;
  }

  // 4. Verify unique selection per RFQ
  const [existingSelection] = await db.execute(
    `SELECT id FROM quotation_selections WHERE rfq_id = ?`,
    [rfq_id]
  );
  if (existingSelection.length > 0) {
    const error = new Error('A quotation selection has already been recommended for this RFQ.');
    error.statusCode = 400;
    throw error;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // A. Update target quotation status to 'selected'
    await conn.execute("UPDATE quotations SET status = 'selected' WHERE id = ?", [quotation_id]);

    // B. Create selection entry in quotation_selections with status 'Recommended'
    const [result] = await conn.execute(
      `INSERT INTO quotation_selections (rfq_id, quotation_id, selected_by, selection_reason, status)
       VALUES (?, ?, ?, ?, 'Recommended')`,
      [rfq_id, quotation_id, userId, selection_reason.trim()]
    );
    const selectionId = result.insertId;

    // C. Log activity audit
    await logAndNotify(userId, {
      action: 'VENDOR_SELECTED',
      module: 'Quotation Comparison',
      entityType: 'quotation_selection',
      entityId: selectionId,
      description: `Quotation recommended/selected for RFQ #${rfq_id}. Reason: ${selection_reason}`,
      ipAddress: null
    });

    await conn.commit();
    conn.release();

    return {
      id: selectionId,
      rfq_id,
      quotation_id,
      selected_by: userId,
      selection_reason: selection_reason.trim(),
      status: 'Recommended'
    };
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }
};

/**
 * Fetch selection recommendation for a given RFQ.
 */
export const getQuotationSelectionByRFQ = async (rfqId) => {
  const [selectionRows] = await db.execute(
    `SELECT qs.*, u.name AS selected_by_name, q.quotation_number, v.name AS vendor_name, q.grand_total, q.delivery_days
     FROM quotation_selections qs
     JOIN users u ON qs.selected_by = u.id
     JOIN quotations q ON qs.quotation_id = q.id
     JOIN vendors v ON q.vendor_id = v.id
     WHERE qs.rfq_id = ? LIMIT 1`,
    [rfqId]
  );
  return selectionRows[0] || null;
};

/**
 * Update selection status (e.g. Recommended -> SentForApproval) or update remarks.
 */
export const updateQuotationSelectionStatus = async (selectionId, status, payload = {}, userId) => {
  const { selection_reason } = payload;

  const [selections] = await db.execute(
    `SELECT * FROM quotation_selections WHERE id = ?`,
    [selectionId]
  );
  if (selections.length === 0) {
    const error = new Error('Quotation selection not found.');
    error.statusCode = 404;
    throw error;
  }
  const selection = selections[0];

  const allowedStatuses = ['Recommended', 'SentForApproval', 'Approved', 'Rejected'];
  if (status && !allowedStatuses.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (selection_reason !== undefined) {
    updates.push('selection_reason = ?');
    params.push(selection_reason.trim());
  }

  if (updates.length === 0) {
    return selection;
  }

  params.push(selectionId);
  await db.execute(
    `UPDATE quotation_selections SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  if (status) {
    await logAndNotify(userId, {
      action: 'SELECTION_STATUS_UPDATED',
      module: 'Quotation Comparison',
      entityType: 'quotation_selection',
      entityId: selectionId,
      description: `Quotation selection status updated to "${status}"`,
      ipAddress: null
    });
  }

  const [updated] = await db.execute(
    `SELECT qs.*, u.name AS selected_by_name, q.quotation_number, v.name AS vendor_name, q.grand_total, q.delivery_days
     FROM quotation_selections qs
     JOIN users u ON qs.selected_by = u.id
     JOIN quotations q ON qs.quotation_id = q.id
     JOIN vendors v ON q.vendor_id = v.id
     WHERE qs.id = ? LIMIT 1`,
    [selectionId]
  );

  return updated[0];
};

/**
 * Fetch comparison audit log and selection changes.
 */
export const getComparisonHistory = async (rfqId) => {
  const [views] = await db.execute(
    `SELECT 'comparison_viewed' AS type, qc.id, qc.compared_by AS user_id, u.name AS user_name, u.role AS user_role, qc.comparison_date AS event_date, NULL AS details, NULL AS status
     FROM quotation_comparisons qc
     JOIN users u ON qc.compared_by = u.id
     WHERE qc.rfq_id = ?`,
    [rfqId]
  );

  const [selections] = await db.execute(
    `SELECT 'vendor_selected' AS type, qs.id, qs.selected_by AS user_id, u.name AS user_name, u.role AS user_role, qs.selection_date AS event_date, qs.selection_reason AS details, qs.status
     FROM quotation_selections qs
     JOIN users u ON qs.selected_by = u.id
     WHERE qs.rfq_id = ?`,
    [rfqId]
  );

  const history = [...views, ...selections].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
  return history;
};
