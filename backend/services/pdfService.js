import puppeteer from 'puppeteer';

/**
 * generateInvoicePDF(invoice)
 *
 * Generates a professional A4 PDF invoice for VendorBridge ERP.
 * invoice must have:
 *   - invoice_number, issue_date, due_date, payment_terms, status
 *   - vendor_name, vendor_email, vendor_phone, vendor_address, vendor_gst
 *   - po_number, rfq_title, approval_number
 *   - subtotal, discount_amount, tax_amount, round_off_amount, grand_total
 *   - items[] → {item_name, description, quantity, unit, unit_price, tax_percentage, discount_percentage, line_total}
 *   - created_by_name, created_by_email
 *   - notes
 */
export async function generateInvoicePDF(invoice) {
  const fmt = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 2
    }).format(n);
  };

  const fmtDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const fmtNum = (v) => {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  // Calculate GST components (18% split as CGST 9% + SGST 9%)
  const taxAmt = parseFloat(invoice.tax_amount) || 0;
  const cgst = taxAmt / 2;
  const sgst = taxAmt / 2;

  const subtotal = parseFloat(invoice.subtotal) || 0;
  const discountAmt = parseFloat(invoice.discount_amount) || 0;
  const grandTotal = parseFloat(invoice.grand_total) || 0;
  const roundOff = parseFloat(invoice.round_off_amount) || 0;
  const finalAmount = Math.round(grandTotal);

  // Amount in words helper (simple)
  const numberToWords = (n) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (n === 0) return 'Zero';
    if (n < 0) return 'Negative ' + numberToWords(-n);
    let words = '';
    if (n >= 10000000) { words += numberToWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
    if (n >= 100000)   { words += numberToWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000)     { words += numberToWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100)      { words += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20)       { words += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0)         { words += ones[n] + ' '; }
    return words.trim();
  };

  const amountInWords = `Indian Rupees ${numberToWords(finalAmount)} Only`;

  const itemsHtml = items.length > 0 ? items.map((item, idx) => {
    const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
    const discountVal = lineSubtotal * (parseFloat(item.discount_percentage || 0) / 100);
    const taxVal = (lineSubtotal - discountVal) * (parseFloat(item.tax_percentage || 0) / 100);
    return `
      <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f9fafb'};">
        <td style="padding:10px 12px; font-size:12px; color:#6b7280; text-align:center; border-bottom:1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding:10px 12px; font-size:12px; border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:700; color:#111827;">${item.item_name}</div>
          ${item.description ? `<div style="font-size:11px; color:#6b7280; margin-top:2px;">${item.description}</div>` : ''}
        </td>
        <td style="padding:10px 12px; font-size:12px; text-align:center; color:#374151; border-bottom:1px solid #e5e7eb;">${fmtNum(item.quantity)}</td>
        <td style="padding:10px 12px; font-size:12px; text-align:center; color:#374151; border-bottom:1px solid #e5e7eb;">${item.unit}</td>
        <td style="padding:10px 12px; font-size:12px; text-align:right; color:#374151; border-bottom:1px solid #e5e7eb;">${fmt(item.unit_price)}</td>
        <td style="padding:10px 12px; font-size:12px; text-align:center; color:${parseFloat(item.discount_percentage || 0) > 0 ? '#dc2626' : '#9ca3af'}; border-bottom:1px solid #e5e7eb;">${fmtNum(item.discount_percentage || 0)}%</td>
        <td style="padding:10px 12px; font-size:12px; text-align:center; color:#374151; border-bottom:1px solid #e5e7eb;">${fmtNum(item.tax_percentage || 0)}%</td>
        <td style="padding:10px 12px; font-size:12px; text-align:right; font-weight:700; color:#111827; border-bottom:1px solid #e5e7eb;">${fmt(item.line_total)}</td>
      </tr>
    `;
  }).join('') : `
    <tr>
      <td colspan="8" style="padding:20px; text-align:center; color:#9ca3af; font-size:12px;">No items found</td>
    </tr>
  `;

  const statusColor = {
    'Draft': '#6b7280', 'Generated': '#2563eb', 'Sent': '#d97706',
    'Viewed': '#7c3aed', 'Paid': '#059669', 'Cancelled': '#dc2626'
  }[invoice.status] || '#6b7280';

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice — ${invoice.invoice_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #fff;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
    }
    .page { max-width: 850px; margin: 0 auto; padding: 0; }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 28px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { color: #fff; }
    .brand-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; opacity: 0.75; margin-top: 2px; }
    .invoice-title-block { text-align: right; color: #fff; }
    .invoice-title { font-size: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-num { font-size: 14px; font-weight: 700; opacity: 0.9; margin-top: 4px; }
    .status-badge {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 10px; font-weight: 900; text-transform: uppercase;
      background: rgba(255,255,255,0.2); color: #fff; margin-top: 6px;
      letter-spacing: 0.5px;
    }
    .body { padding: 28px 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .info-card {
      border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;
      background: #fafafa;
    }
    .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase;
      color: #4f46e5; letter-spacing: 0.5px; margin-bottom: 8px;
      padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .card-name { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 4px; }
    .card-row { font-size: 11px; color: #6b7280; line-height: 1.8; }
    .card-row strong { color: #374151; }
    table { width: 100%; border-collapse: collapse; }
    .items-table { margin-bottom: 24px; }
    .items-table thead tr { background: #4f46e5; }
    .items-table thead th {
      padding: 10px 12px; font-size: 10px; font-weight: 800;
      text-transform: uppercase; color: #fff; letter-spacing: 0.5px;
    }
    .totals-section { display: grid; grid-template-columns: 1fr 300px; gap: 24px; margin-bottom: 24px; }
    .totals-table td { padding: 6px 12px; font-size: 12px; }
    .total-row-highlight td { font-size: 15px; font-weight: 900; color: #4f46e5; border-top: 2px solid #4f46e5; padding-top: 10px; }
    .amount-words {
      background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 8px;
      padding: 12px 16px; font-size: 12px; color: #5b21b6; font-weight: 600; line-height: 1.5;
    }
    .sig-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
    .sig-box {
      border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;
      min-height: 80px; display: flex; flex-direction: column; justify-content: space-between;
    }
    .sig-label { font-size: 10px; font-weight: 800; text-transform: uppercase;
      color: #6b7280; letter-spacing: 0.5px; }
    .sig-name { font-size: 13px; font-weight: 700; color: #111827; }
    .sig-title { font-size: 11px; color: #6b7280; }
    .footer {
      border-top: 1px solid #e5e7eb; padding: 16px 32px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-terms { font-size: 10px; color: #9ca3af; max-width: 60%; line-height: 1.6; }
    .footer-brand { font-size: 11px; font-weight: 700; color: #4f46e5; text-align: right; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase;
      color: #4f46e5; letter-spacing: 0.5px; margin-bottom: 12px; }
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; line-height: 1.6; }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-name">🔷 VendorBridge</div>
      <div class="brand-sub">Procurement & Vendor Management ERP</div>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-title">Tax Invoice</div>
      <div class="invoice-num">${invoice.invoice_number}</div>
      <span class="status-badge">${invoice.status}</span>
    </div>
  </div>

  <div class="body">
    <!-- Info Cards Grid -->
    <div class="info-grid">
      <!-- Bill To -->
      <div class="info-card">
        <div class="card-label">Bill To — Vendor</div>
        <div class="card-name">${invoice.vendor_name}</div>
        <div class="card-row">
          <strong>GST:</strong> ${invoice.vendor_gst || 'N/A'}<br>
          <strong>Email:</strong> ${invoice.vendor_email}<br>
          <strong>Phone:</strong> ${invoice.vendor_phone || 'N/A'}<br>
          ${invoice.vendor_address || ''}
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="info-card">
        <div class="card-label">Invoice Details</div>
        <div class="card-row">
          <strong>Invoice #:</strong> ${invoice.invoice_number}<br>
          <strong>PO Number:</strong> ${invoice.po_number}<br>
          <strong>Issue Date:</strong> ${fmtDate(invoice.issue_date)}<br>
          <strong>Due Date:</strong> ${fmtDate(invoice.due_date)}<br>
          <strong>Payment Terms:</strong> ${invoice.payment_terms}
        </div>
      </div>

      <!-- Procurement Info -->
      <div class="info-card">
        <div class="card-label">Procurement Info</div>
        <div class="card-row">
          <strong>RFQ:</strong> ${invoice.rfq_title || 'N/A'}<br>
          <strong>Approval #:</strong> ${invoice.approval_number || 'N/A'}<br>
          <strong>Delivery Days:</strong> ${invoice.delivery_days || 'N/A'} days<br>
          <strong>Created By:</strong> ${invoice.created_by_name || 'N/A'}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="section-title">Line Items</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:4%; text-align:center;">#</th>
          <th style="text-align:left; width:32%;">Item / Description</th>
          <th style="width:8%; text-align:center;">Qty</th>
          <th style="width:7%; text-align:center;">Unit</th>
          <th style="width:13%; text-align:right;">Unit Price</th>
          <th style="width:8%; text-align:center;">Disc %</th>
          <th style="width:8%; text-align:center;">Tax %</th>
          <th style="width:12%; text-align:right;">Line Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <!-- Totals + GST Section -->
    <div class="totals-section">
      <!-- Left: GST Breakdown -->
      <div>
        <div class="section-title">Tax Summary</div>
        <table style="max-width: 360px;">
          <tbody>
            <tr>
              <td style="padding:6px 0; font-size:12px; color:#6b7280;">Taxable Value (Subtotal)</td>
              <td style="padding:6px 0; font-size:12px; text-align:right; font-weight:600; color:#374151;">${fmt(subtotal)}</td>
            </tr>
            ${discountAmt > 0 ? `<tr>
              <td style="padding:6px 0; font-size:12px; color:#dc2626;">Total Discount</td>
              <td style="padding:6px 0; font-size:12px; text-align:right; font-weight:600; color:#dc2626;">- ${fmt(discountAmt)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 0; font-size:12px; color:#6b7280;">CGST (9%)</td>
              <td style="padding:6px 0; font-size:12px; text-align:right; font-weight:600; color:#374151;">${fmt(cgst)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; font-size:12px; color:#6b7280;">SGST (9%)</td>
              <td style="padding:6px 0; font-size:12px; text-align:right; font-weight:600; color:#374151;">${fmt(sgst)}</td>
            </tr>
            ${roundOff !== 0 ? `<tr>
              <td style="padding:6px 0; font-size:12px; color:#6b7280;">Round Off</td>
              <td style="padding:6px 0; font-size:12px; text-align:right; color:#374151;">${roundOff > 0 ? '+' : ''}${roundOff.toFixed(4)}</td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>

      <!-- Right: Totals -->
      <div>
        <div class="section-title">Amount Due</div>
        <table class="totals-table">
          <tbody>
            <tr>
              <td style="color:#6b7280;">Subtotal</td>
              <td style="text-align:right; font-weight:600; color:#374151;">${fmt(subtotal)}</td>
            </tr>
            ${discountAmt > 0 ? `<tr>
              <td style="color:#dc2626;">Discount</td>
              <td style="text-align:right; font-weight:600; color:#dc2626;">- ${fmt(discountAmt)}</td>
            </tr>` : ''}
            <tr>
              <td style="color:#6b7280;">GST (18%)</td>
              <td style="text-align:right; font-weight:600; color:#374151;">${fmt(taxAmt)}</td>
            </tr>
            <tr class="total-row-highlight">
              <td>Grand Total</td>
              <td style="text-align:right;">${fmt(grandTotal)}</td>
            </tr>
            <tr>
              <td style="color:#6b7280; font-size:11px;">Final Amount (Rounded)</td>
              <td style="text-align:right; font-size:13px; font-weight:700; color:#059669;">₹${finalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div class="amount-words">
      <strong>Amount in Words:</strong> ${amountInWords}
    </div>

    ${invoice.notes ? `<hr class="divider"><div class="section-title">Notes</div><div class="notes-box">${invoice.notes}</div>` : ''}

    <!-- Signature Section -->
    <hr class="divider">
    <div class="sig-section">
      <div class="sig-box">
        <div class="sig-label">Issued By</div>
        <div>
          <div class="sig-name">${invoice.created_by_name || 'Procurement Officer'}</div>
          <div class="sig-title">VendorBridge Procurement Team</div>
        </div>
        <div style="border-top: 1px solid #e5e7eb; margin-top: 12px; padding-top: 6px; font-size: 10px; color: #9ca3af;">Authorized Signatory</div>
      </div>
      <div class="sig-box" style="text-align:center; justify-content:center;">
        <div style="font-size: 10px; color:#9ca3af; margin-bottom: 8px;">Vendor Acknowledgement</div>
        <div style="border-bottom: 1px dashed #d1d5db; width: 180px; margin: 0 auto; height: 40px;"></div>
        <div style="font-size: 10px; color: #9ca3af; margin-top: 8px;">Signature & Stamp with Date</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-terms">
      <strong>Terms & Conditions:</strong> Payment due by ${fmtDate(invoice.due_date)}.
      This is a computer-generated invoice. For disputes, contact procurement@vendorbridge.com.
      GST is applicable as per prevailing rates.
    </div>
    <div class="footer-brand">
      🔷 VendorBridge ERP<br>
      <span style="font-size:10px; color:#9ca3af; font-weight:400;">Generated: ${fmtDate(new Date())}</span>
    </div>
  </div>
</div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 30000,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });
    return pdfBuffer;
  } finally {
    try { await browser.close(); } catch (e) {}
  }
}
