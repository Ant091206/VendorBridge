import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvoiceById, updateInvoiceStatus, sendInvoiceEmail } from '../../api/invoiceApi';
import { downloadInvoicePDF } from '../../utils/downloadPDF';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';

/**
 * InvoiceDetail Page Component
 * Renders a complete invoice document sheet with actions to print, download, email, or settle invoice payment.
 */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Action loaders
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Confirmation Modals
  const [confirmPay, setConfirmPay] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const loadInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInvoiceById(id);
      if (response.status === 'success') {
        setInvoice(response.data);
      } else {
        setError('Failed to fetch invoice details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  // Indian Currency format
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  // Date format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Triggers browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Triggers Puppeteer render + download
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadInvoicePDF(invoice.id, invoice.invoice_number);
      setToastType('success');
      setToastMessage('Invoice PDF downloaded successfully.');
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Triggers email dispatch
  const handleSendEmail = async () => {
    setConfirmEmail(false);
    setEmailing(true);
    try {
      const response = await sendInvoiceEmail(invoice.id);
      setToastType('success');
      setToastMessage(`Invoice sent to ${invoice.vendor_email} successfully.`);
      loadInvoice(); // Refresh view status
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to dispatch email.');
    } finally {
      setEmailing(false);
    }
  };

  // Triggers Paid status update
  const handleMarkPaid = async () => {
    setConfirmPay(false);
    setProcessing(true);
    try {
      await updateInvoiceStatus(invoice.id, 'paid');
      setToastType('success');
      setToastMessage('Invoice marked as PAID.');
      loadInvoice(); // Refresh status
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to settle invoice status.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !invoice) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error || 'Invoice details could not be found.'}
        </div>
        <button
          onClick={() => navigate(user?.role === 'vendor' ? '/vendor/my-invoices' : '/invoices')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          &larr; Back to Directory
        </button>
      </div>
    );
  }

  const isVendor = user?.role === 'vendor';
  const backLink = isVendor ? '/vendor/my-invoices' : '/invoices';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* CSS print utility embedded directly for reliability */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
        }
      `}</style>

      {/* Toast popup */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Confirmation Modals */}
      {confirmEmail && (
        <ConfirmModal
          message={`Are you sure you want to email Invoice PDF ${invoice.invoice_number} to ${invoice.vendor_email}?`}
          onConfirm={handleSendEmail}
          onCancel={() => setConfirmEmail(false)}
        />
      )}

      {confirmPay && (
        <ConfirmModal
          message={`Are you sure you want to mark Invoice ${invoice.invoice_number} as PAID? This updates ERP payment records.`}
          onConfirm={handleMarkPaid}
          onCancel={() => setConfirmPay(false)}
        />
      )}

      {/* Action Buttons bar (Above invoice details) - Hidden on Print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          &larr; {isVendor ? 'Back to My Invoices' : 'Back to Invoices'}
        </Link>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>

          {/* Send via Email (Staff Only) */}
          {!isVendor && (
            <button
              onClick={() => setConfirmEmail(true)}
              disabled={emailing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {emailing ? 'Sending...' : 'Send via Email'}
            </button>
          )}

          {/* Mark Paid (Staff Only - If not paid) */}
          {!isVendor && invoice.status !== 'paid' && (
            <button
              onClick={() => setConfirmPay(true)}
              disabled={processing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Card Sheet */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-8 print:border-0 print:bg-white print:text-black print:p-0 print:shadow-none print:w-full">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-slate-800/80 print:border-gray-300">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg print:bg-indigo-600 print:text-white">
                V
              </div>
              <span className="text-xl font-bold tracking-tight text-white print:text-black">VendorBridge</span>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-500 font-semibold uppercase tracking-wider">Procurement ERP Division</p>
            <p className="text-xs text-slate-500 print:text-gray-500">vendorbridge@company.com • BKC, Mumbai</p>
          </div>
          
          <div className="text-left sm:text-right space-y-1.5">
            <h1 className="text-2xl font-extrabold text-white tracking-widest uppercase print:text-black">Tax Invoice</h1>
            <div className="font-mono text-sm font-bold text-indigo-400 print:text-indigo-600">{invoice.invoice_number}</div>
            <div className="inline-block"><Badge status={invoice.status} /></div>
          </div>
        </div>

        {/* Info Grid (Bill To vs Invoice Details) */}
        <div className="grid gap-6 sm:grid-cols-2 text-sm">
          {/* Bill To Vendor Details */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/20 p-5 space-y-3 print:bg-gray-100 print:border-gray-300 print:text-black">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider print:text-gray-600">Bill To:</h3>
            <div className="space-y-1 text-slate-300 print:text-black">
              <div className="font-bold text-white text-base print:text-black">{invoice.vendor_name}</div>
              {invoice.vendor_gst && (
                <div className="text-xs font-medium">
                  <span className="text-slate-500 print:text-gray-600">GSTIN:</span> <span className="font-mono uppercase">{invoice.vendor_gst}</span>
                </div>
              )}
              <div className="text-xs"><span className="text-slate-500 print:text-gray-600">Email:</span> {invoice.vendor_email}</div>
              <div className="text-xs"><span className="text-slate-500 print:text-gray-600">Phone:</span> {invoice.vendor_phone}</div>
              <div className="text-xs leading-relaxed mt-2 whitespace-pre-wrap">{invoice.vendor_address}</div>
            </div>
          </div>

          {/* Metadata details */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/20 p-5 space-y-3 print:bg-gray-100 print:border-gray-300 print:text-black">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider print:text-gray-600">Invoice Details:</h3>
            <table className="w-full font-medium text-slate-350 print:text-black">
              <tbody>
                <tr className="h-6">
                  <td className="text-slate-500 print:text-gray-600">Invoice #:</td>
                  <td className="text-right font-mono font-bold text-slate-200 print:text-black">{invoice.invoice_number}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500 print:text-gray-600">Invoice Date:</td>
                  <td className="text-right text-slate-300 print:text-black">{formatDate(invoice.issued_at)}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500 print:text-gray-600">PO Number:</td>
                  <td className="text-right text-slate-300 print:text-black font-mono">{invoice.po_number}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500 print:text-gray-600">Due Date:</td>
                  <td className="text-right text-slate-300 print:text-black">On Receipt</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500 print:text-gray-600">Approved By:</td>
                  <td className="text-right text-slate-300 print:text-black font-semibold">{invoice.approver_name || 'System Manager'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Listing */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider print:text-gray-600">Line Items</h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 print:bg-gray-100 print:text-black print:border-gray-300">
                  <th className="py-3 px-4 w-[8%] text-center">#</th>
                  <th className="py-3 px-4 w-[52%]">Item Description</th>
                  <th className="py-3 px-4 w-[12%] text-center">Quantity</th>
                  <th className="py-3 px-4 w-[14%] text-right">Unit Price</th>
                  <th className="py-3 px-4 w-[14%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300 print:divide-gray-200 print:text-black">
                <tr className="hover:bg-slate-850/10">
                  <td className="py-4 px-4 text-center font-semibold text-slate-500 print:text-gray-500">1</td>
                  <td className="py-4 px-4 font-semibold text-slate-200 print:text-black">
                    <div>{invoice.rfq_title}</div>
                    <div className="text-[10px] text-slate-500 font-medium font-sans mt-0.5">Procurement supply contract, fulfilled in {invoice.delivery_days} days.</div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-200 print:text-black">{invoice.rfq_quantity} units</td>
                  <td className="py-4 px-4 text-right font-medium text-slate-400 print:text-gray-650">{formatCurrency(invoice.unit_price)}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-100 print:text-black">{formatCurrency(invoice.subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations and declaration */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-800/80 print:border-gray-200 print:text-black">
          <div className="text-xs leading-relaxed text-slate-500 print:text-gray-600">
            <span className="font-bold text-slate-300 print:text-black uppercase tracking-widest block mb-1">Declaration</span>
            We declare that this invoice shows the actual price of the goods or services described and that all details provided are correct and complete.
            <div className="mt-4 italic">
              Settlement terms: Payment is due within 30 days of invoice generation.
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm rounded-xl bg-slate-950/20 border border-slate-850 p-4 space-y-2 text-sm print:bg-gray-50 print:border-gray-300">
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600 font-medium">Subtotal:</span>
                <span className="font-semibold text-slate-200 print:text-black">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600 font-medium">GST (18%):</span>
                <span className="font-semibold text-slate-200 print:text-black">{formatCurrency(invoice.tax)}</span>
              </div>
              <hr className="border-slate-800 print:border-gray-300" />
              <div className="flex justify-between text-base pt-1">
                <span className="font-bold text-white print:text-black">Grand Total:</span>
                <span className="font-bold text-lg text-indigo-400 print:text-indigo-600">{formatCurrency(invoice.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Computations stamp signature area */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row sm:justify-between items-center text-xs text-slate-500 gap-4 print:border-gray-300 print:text-black">
          <div className="text-slate-400 print:text-gray-500">
            This is a computer generated document. No physical signature is required.
          </div>
          <div className="text-center sm:text-right">
            <div className="h-10 w-48 border-b border-dashed border-slate-700 print:border-black mx-auto sm:mr-0" />
            <span className="block mt-1 font-semibold text-slate-400 print:text-black uppercase tracking-wider">Authorized Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
