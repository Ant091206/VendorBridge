import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById } from '../../api/invoiceApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await getInvoiceById(id);
        if (res.status === 'success') {
          setInvoice(res.data);
        } else {
          setError('Failed to load invoice preview.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700 max-w-md text-center">
          {error || 'Invoice not found.'}
        </div>
        <button onClick={() => navigate(-1)} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage('')} />
      )}

      {/* Preview Controls (Hidden on Print) */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-500 uppercase">Invoice Preview:</span>
          <span className="font-mono text-xs font-black text-[#6D5DFC] bg-indigo-50 px-2.5 py-1 rounded-lg">
            {invoice.invoice_number}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Close Preview
          </button>
          
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-[#6D5DFC] hover:bg-[#5b4deb] px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Official Tax Invoice Sheet */}
      <div className="mx-auto max-w-4xl bg-white border border-slate-200 p-12 rounded-3xl shadow-xl shadow-slate-900/5 space-y-8 print:border-0 print:shadow-none print:p-0 print:bg-white print:text-black">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-slate-200 print:border-slate-300">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#6D5DFC] flex items-center justify-center text-white font-bold text-lg print:bg-black">
                VB
              </div>
              <span className="text-xl font-black tracking-tight text-slate-950 print:text-black">VendorBridge ERP</span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Procurement ERP Division</p>
            <p className="text-xs text-slate-500">vendorbridge@company.com • BKC, Mumbai</p>
          </div>
          
          <div className="text-left sm:text-right space-y-1.5">
            <h1 className="text-2xl font-black text-slate-950 tracking-widest uppercase print:text-black">Tax Invoice</h1>
            <div className="font-mono text-sm font-bold text-[#6D5DFC] print:text-black">{invoice.invoice_number}</div>
            <span className="inline-flex rounded-lg bg-indigo-50 border border-indigo-150 text-[#6D5DFC] font-black uppercase text-[10px] px-2.5 py-1 tracking-wider print:bg-white print:text-black">
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-6 sm:grid-cols-2 text-sm">
          {/* Bill To Vendor Details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3 print:bg-slate-50 print:border-slate-350 print:text-black">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bill To:</h3>
            <div className="space-y-0.5 text-slate-600 print:text-black font-semibold">
              <div className="font-bold text-slate-900 text-base print:text-black">{invoice.vendor_name}</div>
              {invoice.vendor_gst && (
                <div className="text-xs text-slate-500">
                  <span>GSTIN:</span> <span className="font-mono font-black uppercase">{invoice.vendor_gst}</span>
                </div>
              )}
              <div className="text-xs"><span className="text-slate-400 font-bold uppercase mr-1">Email:</span> {invoice.vendor_email}</div>
              <div className="text-xs"><span className="text-slate-400 font-bold uppercase mr-1">Phone:</span> {invoice.vendor_phone}</div>
              <div className="text-xs leading-relaxed mt-2 text-slate-400 print:text-black whitespace-pre-wrap">{invoice.vendor_address}</div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3 print:bg-slate-50 print:border-slate-350 print:text-black">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Invoice Details:</h3>
            <table className="w-full text-slate-600 print:text-black font-semibold">
              <tbody>
                <tr className="h-6">
                  <td className="text-slate-400 font-bold uppercase text-xs">Invoice #:</td>
                  <td className="text-right font-mono font-bold text-slate-900 print:text-black">{invoice.invoice_number}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-400 font-bold uppercase text-xs">Invoice Date:</td>
                  <td className="text-right text-slate-900 print:text-black">{formatDate(invoice.issued_at)}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-400 font-bold uppercase text-xs">PO Number:</td>
                  <td className="text-right text-slate-900 print:text-black font-mono">{invoice.po_number}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-400 font-bold uppercase text-xs">Due Date:</td>
                  <td className="text-right text-slate-900 print:text-black">On Receipt</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Line Items</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 print:bg-slate-100">
                  <th className="py-3 px-4 w-[8%] text-center">#</th>
                  <th className="py-3 px-4 w-[52%]">Description</th>
                  <th className="py-3 px-4 w-[12%] text-center">Quantity</th>
                  <th className="py-3 px-4 w-[14%] text-right">Unit Price</th>
                  <th className="py-3 px-4 w-[14%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-semibold print:text-black print:divide-slate-200">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400">1</td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">
                    <div>{invoice.rfq_title}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Fulfillment items matched to PO details.</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{invoice.rfq_quantity} units</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-500">{formatCurrency(invoice.unit_price)}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatCurrency(invoice.subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations and declaration */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-100 print:text-black">
          <div className="text-xs leading-relaxed text-slate-400 font-semibold print:text-slate-600">
            <span className="font-black text-slate-800 print:text-black uppercase tracking-wider block mb-1">Declaration</span>
            We declare that this invoice shows the actual price of the goods or services described and that all details provided are correct and complete.
            <div className="mt-4 italic">
              Settlement terms: Payment is due within 30 days of invoice generation.
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-xs font-semibold print:bg-slate-50 print:border-slate-350">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Subtotal:</span>
                <span className="font-black text-slate-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">GST (18%):</span>
                <span className="font-black text-slate-900">{formatCurrency(invoice.tax)}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-sm pt-1">
                <span className="font-black text-slate-900">Grand Total:</span>
                <span className="font-black text-emerald-600">{formatCurrency(invoice.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footers */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between items-center text-xs text-slate-400 font-bold gap-4 print:text-black">
          <div>
            This is a computer generated document. No physical signature is required.
          </div>
          <div className="text-center sm:text-right">
            <div className="h-10 w-48 border-b border-dashed border-slate-300 print:border-black mx-auto sm:mr-0" />
            <span className="block mt-1 font-black text-slate-400 print:text-black uppercase tracking-wider">Authorized Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
