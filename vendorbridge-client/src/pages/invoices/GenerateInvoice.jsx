import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPOById } from '../../api/poApi';
import { generateInvoice } from '../../api/invoiceApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

/**
 * GenerateInvoice Page Component
 * Shows a draft preview of the invoice with watermark and handles invoice generation.
 */
const GenerateInvoice = () => {
  const { po_id } = useParams();
  const navigate = useNavigate();
  
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [existingInvoiceId, setExistingInvoiceId] = useState(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const loadPOData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPOById(po_id);
        if (response.status === 'success') {
          setPo(response.data);
        } else {
          setError('Failed to retrieve purchase order details.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred while fetching PO data.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPOData();
  }, [po_id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await generateInvoice(po_id);
      if (response.status === 'success') {
        setToastType('success');
        setToastMessage(`Invoice generated successfully!`);
        // Redirect to detail page after a tiny pause to show the toast
        setTimeout(() => {
          navigate(`/invoices/${response.data.id}`);
        }, 1000);
      } else {
        setError('Failed to generate invoice.');
      }
    } catch (err) {
      console.error(err);
      if (err.invoice_id) {
        // Invoice already exists case
        setExistingInvoiceId(err.invoice_id);
        setError(err.message || 'An invoice has already been generated for this PO.');
      } else {
        setError(err.message || 'An error occurred during invoice generation.');
      }
    } finally {
      setGenerating(false);
    }
  };

  // Indian Currency formatter
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error && !po && !existingInvoiceId) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          &larr; Back to Purchase Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Header and navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Generate Invoice</h1>
          <p className="text-sm text-slate-400 mt-1">Review the Purchase Order details and generate the Tax Invoice.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/purchase-orders/${po_id}`}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Cancel
          </Link>
          
          {!existingInvoiceId && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {generating ? 'Generating Invoice...' : 'Generate Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* If Invoice already generated notification */}
      {existingInvoiceId && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5 space-y-4 text-amber-400">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-bold text-base">Invoice Already Generated</h4>
              <p className="text-sm text-amber-500/90 mt-1">
                A billing document has already been created for Purchase Order <strong>{po?.po_number}</strong>. Double invoice creation is prevented by the system.
              </p>
            </div>
          </div>
          <div className="flex justify-start pl-8">
            <button
              onClick={() => navigate(`/invoices/${existingInvoiceId}`)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition"
            >
              View Existing Invoice
            </button>
          </div>
        </div>
      )}

      {/* If standard generation error */}
      {error && !existingInvoiceId && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Invoice Draft Preview Sheet */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-8 overflow-hidden">
        
        {/* PREVIEW Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-[0.03] rotate-12">
          <div className="text-8xl font-black uppercase text-slate-350 tracking-widest">
            Draft Preview
          </div>
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                V
              </div>
              <span className="text-xl font-bold tracking-tight text-white">VendorBridge</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Procurement ERP Division</p>
            <p className="text-xs text-slate-500">vendorbridge@company.com • BKC, Mumbai</p>
          </div>
          
          <div className="text-left sm:text-right space-y-1.5">
            <h1 className="text-2xl font-extrabold text-slate-400 tracking-widest uppercase">Tax Invoice</h1>
            <div className="font-mono text-sm font-bold text-slate-500">INV-YYYY-XXXX (Draft)</div>
            <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
              Draft Preview
            </span>
          </div>
        </div>

        {/* Supplier details info */}
        <div className="grid gap-6 sm:grid-cols-2 text-sm">
          {/* Bill To */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/20 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Bill To:</h3>
            <div className="space-y-1 text-slate-300">
              <div className="font-bold text-white text-base">{po?.vendor_name}</div>
              {po?.vendor_gst && (
                <div className="text-xs font-medium">
                  <span className="text-slate-500">GSTIN:</span> <span className="font-mono uppercase">{po?.vendor_gst}</span>
                </div>
              )}
              <div className="text-xs"><span className="text-slate-500">Email:</span> {po?.vendor_email}</div>
              <div className="text-xs"><span className="text-slate-500">Phone:</span> {po?.vendor_phone}</div>
              <div className="text-xs leading-relaxed mt-2 whitespace-pre-wrap">{po?.vendor_address}</div>
            </div>
          </div>

          {/* Invoice detail parameters */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/20 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Invoice Details:</h3>
            <table className="w-full font-medium text-slate-350">
              <tbody>
                <tr className="h-6">
                  <td className="text-slate-500">Invoice #:</td>
                  <td className="text-right font-mono font-bold text-slate-400">Pending Approval</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500">Invoice Date:</td>
                  <td className="text-right text-slate-300">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500">PO Number:</td>
                  <td className="text-right text-slate-300 font-mono">{po?.po_number}</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500">Due Date:</td>
                  <td className="text-right text-slate-300">On Receipt</td>
                </tr>
                <tr className="h-6">
                  <td className="text-slate-500">PO Approved By:</td>
                  <td className="text-right text-slate-300 font-semibold">{po?.approver_name || 'System Manager'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Line Items</h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 w-[8%] text-center">#</th>
                  <th className="py-3 px-4 w-[52%]">Item Description</th>
                  <th className="py-3 px-4 w-[12%] text-center">Quantity</th>
                  <th className="py-3 px-4 w-[14%] text-right">Unit Price</th>
                  <th className="py-3 px-4 w-[14%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                <tr className="hover:bg-slate-850/10">
                  <td className="py-4 px-4 text-center font-semibold text-slate-500">1</td>
                  <td className="py-4 px-4 font-semibold text-slate-200">
                    <div>{po?.rfq_title}</div>
                    <div className="text-[10px] text-slate-500 font-medium font-sans mt-0.5">Specifications mapped to Purchase Order: {po?.po_number}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-200">{po?.rfq_quantity} units</td>
                  <td className="py-4 px-4 text-right font-medium text-slate-400">{formatCurrency(po?.quotation_unit_price)}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-100">{formatCurrency(po?.subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Price Calculations */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-800/80">
          <div className="text-xs leading-relaxed text-slate-500">
            <span className="font-bold text-slate-300 uppercase tracking-widest block mb-1">Declaration</span>
            This document represents a system-generated invoice draft. Once generated, details will lock and be transmitted to the supplier.
          </div>
          
          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm rounded-xl bg-slate-950/20 border border-slate-850 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Subtotal:</span>
                <span className="font-semibold text-slate-200">{formatCurrency(po?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">GST (18%):</span>
                <span className="font-semibold text-slate-200">{formatCurrency(po?.tax_amount)}</span>
              </div>
              <hr className="border-slate-800" />
              <div className="flex justify-between text-base pt-1">
                <span className="font-bold text-white">Grand Total:</span>
                <span className="font-bold text-lg text-indigo-400">{formatCurrency(po?.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateInvoice;
