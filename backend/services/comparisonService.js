import db from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendEmail } from './emailService.js';

export const getRFQComparisonData = async (rfqId, user) => {
  // 1. Fetch RFQ details
  const [rfqRows] = await db.execute(
    `SELECT id, rfq_number, title, quantity, status, deadline, estimated_budget 
     FROM rfqs WHERE id = ?`,
    [rfqId]
  );

  if (rfqRows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }

  const rfq = rfqRows[0];

  // 2. Fetch all quotations for the RFQ (excluding drafts)
  const [quotations] = await db.execute(
    `SELECT 
       q.id,
       q.quotation_number,
       q.rfq_id,
       q.vendor_id,
       v.name AS vendor_name,
       v.email AS vendor_email,
       COALESCE(v.company_name, v.name) AS vendor_company,
       q.unit_price,
       q.quantity,
       q.total_price,
       q.delivery_days,
       q.notes,
       q.attachment_url,
       q.status,
       q.submitted_at
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.rfq_id = ? AND q.status != 'draft'
     ORDER BY q.submitted_at DESC`,
    [rfqId]
  );

  // 3. Compute Highlight Badges (Lowest Price, Fastest Delivery, Best Value)
  if (quotations.length > 0) {
    const minPrice = Math.min(...quotations.map(q => Number(q.total_price)));
    const minDelivery = Math.min(...quotations.map(q => Number(q.delivery_days)));

    // Calculate Ranks for Best Value: Score = 0.6 * PriceRank + 0.4 * DeliveryRank
    const sortedByPrice = [...quotations].sort((a, b) => Number(a.total_price) - Number(b.total_price));
    const sortedByDelivery = [...quotations].sort((a, b) => Number(a.delivery_days) - Number(b.delivery_days));

    const priceRanks = new Map();
    sortedByPrice.forEach((q, index) => {
      // Handle duplicates by assigning the same rank
      if (index > 0 && Number(q.total_price) === Number(sortedByPrice[index - 1].total_price)) {
        priceRanks.set(q.id, priceRanks.get(sortedByPrice[index - 1].id));
      } else {
        priceRanks.set(q.id, index + 1);
      }
    });

    const deliveryRanks = new Map();
    sortedByDelivery.forEach((q, index) => {
      if (index > 0 && Number(q.delivery_days) === Number(sortedByDelivery[index - 1].delivery_days)) {
        deliveryRanks.set(q.id, deliveryRanks.get(sortedByDelivery[index - 1].id));
      } else {
        deliveryRanks.set(q.id, index + 1);
      }
    });

    let bestValueQuoteId = null;
    let lowestScore = Infinity;

    quotations.forEach(q => {
      const pRank = priceRanks.get(q.id) || 1;
      const dRank = deliveryRanks.get(q.id) || 1;
      const score = (0.6 * pRank) + (0.4 * dRank);
      
      if (score < lowestScore) {
        lowestScore = score;
        bestValueQuoteId = q.id;
      }
    });

    quotations.forEach(q => {
      q.is_lowest_price = Number(q.total_price) === minPrice;
      q.is_fastest_delivery = Number(q.delivery_days) === minDelivery;
      q.is_best_value = q.id === bestValueQuoteId;
    });
  }

  // 4. Fetch comparison if already selected
  const [selectedRows] = await db.execute(
    `SELECT qc.*, u.name AS selected_by_name
     FROM quotation_comparisons qc
     JOIN users u ON qc.selected_by = u.id
     WHERE qc.rfq_id = ? LIMIT 1`,
    [rfqId]
  );

  return {
    rfq,
    quotations,
    selection: selectedRows[0] || null
  };
};

export const selectWinningVendor = async (rfqId, payload, user) => {
  const { selected_quotation_id, selection_reason } = payload;

  if (!selected_quotation_id || !selection_reason?.trim()) {
    const error = new Error('Selected quotation ID and selection reason are required.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Retrieve and validate RFQ
  const [rfqRows] = await db.execute('SELECT status, title FROM rfqs WHERE id = ?', [rfqId]);
  if (rfqRows.length === 0) {
    const error = new Error('RFQ not found.');
    error.statusCode = 404;
    throw error;
  }
  const rfq = rfqRows[0];
  if (rfq.status !== 'open') {
    const error = new Error(`RFQ selection is blocked. The RFQ status is: ${rfq.status}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Retrieve and validate quotation
  const [quoteRows] = await db.execute(
    `SELECT q.*, v.name AS vendor_name, v.email AS vendor_email 
     FROM quotations q 
     JOIN vendors v ON q.vendor_id = v.id 
     WHERE q.id = ? AND q.rfq_id = ?`,
    [selected_quotation_id, rfqId]
  );
  if (quoteRows.length === 0) {
    const error = new Error('Quotation not found or does not belong to this RFQ.');
    error.statusCode = 404;
    throw error;
  }
  const selectedQuote = quoteRows[0];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // A. Update winning quotation to 'selected'
    await conn.execute("UPDATE quotations SET status = 'selected' WHERE id = ?", [selected_quotation_id]);

    // B. Set other bids to 'rejected'
    await conn.execute("UPDATE quotations SET status = 'rejected' WHERE rfq_id = ? AND id != ?", [rfqId, selected_quotation_id]);

    // C. Close RFQ status
    await conn.execute("UPDATE rfqs SET status = 'closed' WHERE id = ?", [rfqId]);

    // D. Insert into quotation_comparisons
    await conn.execute(
      `INSERT INTO quotation_comparisons (rfq_id, selected_quotation_id, selected_by, selection_reason, selected_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [rfqId, selected_quotation_id, user.id, selection_reason]
    );

    // E. Create pending approval workflow entry
    const approvalSql = `
      INSERT INTO approvals (quotation_id, approver_id, decision, remarks, decided_at)
      VALUES (?, ?, 'pending', ?, NULL)
    `;
    await conn.execute(approvalSql, [selected_quotation_id, user.id, selection_reason]);

    // F. Log activity audits
    await logActivity(conn, user.id, 'quotation', selected_quotation_id, 'QUOTATION_SELECTED');
    await logActivity(conn, user.id, 'rfq', rfqId, 'RFQ_CLOSED_SELECTION');

    await conn.commit();
    conn.release();

    // Asynchronously dispatch emails in the background
    const rfqTitle = rfq.title;
    const winnerName = selectedQuote.vendor_name;
    const winnerEmail = selectedQuote.vendor_email;

    // Send Winner Email
    const winSubject = 'Your Quotation Has Been Selected — VendorBridge';
    const winHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-top: 0;">Award Notification</h2>
        <p>Dear <strong>${winnerName}</strong>,</p>
        <p>Congratulations! Your quotation for the following RFQ has been successfully selected:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <strong>RFQ Title:</strong> ${rfqTitle}<br>
          <strong>Quotation #:</strong> ${selectedQuote.quotation_number || 'N/A'}<br>
          <strong>Unit Price:</strong> ₹ ${Number(selectedQuote.unit_price).toLocaleString('en-IN')}<br>
          <strong>Delivery Days:</strong> ${selectedQuote.delivery_days} days
        </div>
        <p>An approval request has been initiated with the management team. You will be notified once the Purchase Order is generated.</p>
        <p style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b;">
          Regards,<br><strong>VendorBridge Procurement Team</strong>
        </p>
      </div>
    `;
    sendEmail(winnerEmail, winSubject, winHtml).catch(err => console.error('Winner notification failed:', err));

    // Fetch and Notify Rejected Vendors
    const [rejectedQuotes] = await db.execute(
      `SELECT DISTINCT v.name, v.email
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       WHERE q.rfq_id = ? AND q.id != ?`,
      [rfqId, selected_quotation_id]
    );

    const rejectSubject = 'Quotation Update — VendorBridge';
    rejectedQuotes.forEach(vendor => {
      const rejectHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 25px;">
          <h2 style="color: #64748b; border-bottom: 2px solid #64748b; padding-bottom: 12px; margin-top: 0;">Bidding Registry Update</h2>
          <p>Dear <strong>${vendor.name}</strong>,</p>
          <p>Thank you for submitting your quotation for the Request for Quotation: <strong>${rfqTitle}</strong>.</p>
          <p>After careful review of all submissions, we have selected another vendor for this requirement.</p>
          <p>We look forward to working with you on future bidding opportunities.</p>
          <p style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #64748b;">
            Regards,<br><strong>VendorBridge Procurement Team</strong>
          </p>
        </div>
      `;
      sendEmail(vendor.email, rejectSubject, rejectHtml).catch(err => console.error('Rejected notification failed:', err));
    });

    return {
      success: true,
      message: 'Vendor selected successfully and approval workflow triggered.',
      data: {
        rfq_id: rfqId,
        selected_quotation_id,
        status: 'selected'
      }
    };
  } catch (error) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    throw error;
  }
};
