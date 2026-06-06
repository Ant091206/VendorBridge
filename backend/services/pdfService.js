import puppeteer from 'puppeteer';

/**
 * Generates a PDF Buffer from invoice details using Puppeteer.
 * Compiles a self-contained HTML document styled with pure CSS.
 * 
 * @param {object} invoice - Complete invoice data joined from DB tables
 * @returns {Promise<Buffer>} The generated PDF buffer
 */
export async function generateInvoicePDF(invoice) {
  // Indian currency formatting helper
  const formatCurrency = (amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(parsed);
  };

  // Date formatting helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const subtotalVal = parseFloat(invoice.subtotal) || 0;
  const taxVal = parseFloat(invoice.tax) || 0;
  const grandTotalVal = parseFloat(invoice.grand_total) || 0;
  const unitPriceVal = parseFloat(invoice.unit_price) || 0;

  // Fully inline styled HTML invoice template matching requirements
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice ${invoice.invoice_number}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #4F46E5;
      color: #ffffff;
      margin-bottom: 30px;
    }
    .header-table td {
      padding: 24px;
      vertical-align: middle;
    }
    .brand-title {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 12px;
      opacity: 0.85;
      margin: 4px 0 0 0;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: right;
      margin: 0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .info-table td {
      width: 50%;
      vertical-align: top;
      padding: 0 10px;
    }
    .info-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 18px;
      background-color: #f9fafb;
      min-height: 160px;
    }
    .card-title {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      color: #4F46E5;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }
    .vendor-name {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #111827;
    }
    .details-row {
      font-size: 13px;
      line-height: 1.6;
      color: #4b5563;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background-color: #4F46E5;
      color: #ffffff;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 12px;
      border: 1px solid #4F46E5;
    }
    .items-table td {
      padding: 14px 12px;
      font-size: 13px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    .items-table tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 35px;
    }
    .totals-table td {
      padding: 6px 12px;
      font-size: 13px;
      color: #4b5563;
    }
    .grand-total-row td {
      font-size: 16px;
      font-weight: bold;
      color: #4F46E5;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      margin-top: 40px;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.5;
    }
    .footer-title {
      font-weight: bold;
      color: #6b7280;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td>
          <div class="brand-title">🔷 VendorBridge</div>
          <div class="brand-subtitle">Procurement ERP • vendorbridge@company.com</div>
        </td>
        <td>
          <div class="invoice-title">Tax Invoice</div>
        </td>
      </tr>
    </table>

    <!-- Info Row -->
    <table class="info-table">
      <tr>
        <td style="padding-left: 0;">
          <div class="info-card">
            <div class="card-title">Bill To</div>
            <div class="vendor-name">${invoice.vendor_name}</div>
            <div class="details-row">
              <strong>GST:</strong> ${invoice.vendor_gst || 'N/A'}<br>
              <strong>Email:</strong> ${invoice.vendor_email}<br>
              <strong>Phone:</strong> ${invoice.vendor_phone}<br>
              ${invoice.vendor_address}
            </div>
          </div>
        </td>
        <td style="padding-right: 0;">
          <div class="info-card">
            <div class="card-title">Invoice Details</div>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr style="height: 24px;">
                <td style="color:#6b7280; padding:0;">Invoice #:</td>
                <td style="text-align:right; font-weight:bold; color:#111827; padding:0;">${invoice.invoice_number}</td>
              </tr>
              <tr style="height: 24px;">
                <td style="color:#6b7280; padding:0;">Date:</td>
                <td style="text-align:right; font-weight:600; color:#374151; padding:0;">${formatDate(invoice.issued_at)}</td>
              </tr>
              <tr style="height: 24px;">
                <td style="color:#6b7280; padding:0;">PO #:</td>
                <td style="text-align:right; font-weight:600; color:#374151; padding:0;">${invoice.po_number}</td>
              </tr>
              <tr style="height: 24px;">
                <td style="color:#6b7280; padding:0;">Due:</td>
                <td style="text-align:right; font-weight:600; color:#374151; padding:0;">On Receipt</td>
              </tr>
              <tr style="height: 24px;">
                <td style="color:#6b7280; padding:0;">Status:</td>
                <td style="text-align:right; font-weight:bold; color:#4F46E5; text-transform:uppercase; padding:0;">${invoice.status}</td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">#</th>
          <th style="width: 52%; text-align: left;">Item Description</th>
          <th style="width: 12%; text-align: center;">Qty</th>
          <th style="width: 14%; text-align: right;">Unit Price</th>
          <th style="width: 14%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center" style="font-weight: bold; color: #9ca3af;">1</td>
          <td style="font-weight: 600; color: #111827;">
            ${invoice.rfq_title}
            <div style="font-size: 11px; color: #6b7280; font-weight: normal; margin-top: 4px;">Deliverable per Purchase Order specifications.</div>
          </td>
          <td class="text-center" style="font-weight: 600;">${invoice.rfq_quantity}</td>
          <td class="text-right">${formatCurrency(unitPriceVal)}</td>
          <td class="text-right" style="font-weight: bold; color: #111827;">${formatCurrency(subtotalVal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals Area -->
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 55%; vertical-align: top; padding: 0;">
          <div style="font-size: 11px; color: #9ca3af; line-height: 1.5; padding-right: 40px;">
            <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
          </div>
        </td>
        <td style="width: 45%; vertical-align: top; padding: 0;">
          <table class="totals-table" style="width: 100%;">
            <tr>
              <td style="text-align: left; padding-left: 0;">Subtotal:</td>
              <td style="text-align: right; padding-right: 0; font-weight: 600; color: #111827;">${formatCurrency(subtotalVal)}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding-left: 0;">GST (18%):</td>
              <td style="text-align: right; padding-right: 0; font-weight: 600; color: #111827;">${formatCurrency(taxVal)}</td>
            </tr>
            <tr class="grand-total-row">
              <td style="text-align: left; padding-left: 0; font-weight: bold;">Grand Total:</td>
              <td style="text-align: right; padding-right: 0; font-weight: bold;">${formatCurrency(grandTotalVal)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-title">Terms & Conditions:</div>
      1. Payment is due within 30 days of invoice generation.<br>
      2. This is a computer generated invoice and requires no physical signature.<br>
      3. Please check details and contact procurement@vendorbridge.com in case of disputes.<br>
      <div style="text-align: center; margin-top: 30px; font-weight: bold; color: #4F46E5; font-size: 12px;">
        Thank you for your business!
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Launch Puppeteer headless browser with essential args to avoid sandboxing crashes
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-networking',
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      timeout: 30000, // 30 seconds max timeout
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    return pdfBuffer;
  } finally {
    try { await browser.close(); } catch (e) { /* ignore close errors */ }
  }
}
