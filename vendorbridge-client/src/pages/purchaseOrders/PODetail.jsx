import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPOById, updatePOStatus } from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

/**
 * PODetail Page Component
 * Renders an invoice-style printable Purchase Order document with action state triggers.
 */
const PODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadPODetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPOById(id);
      if (response.status === 'success') {
        setPo(response.data);
      } else {
        setError('Failed to fetch purchase order details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading purchase order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPODetails();
  }, [id]);

  // Handle status update transitions
  const handleStatusTransition = async (nextStatus) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await updatePOStatus(id, nextStatus);
      if (response.status === 'success') {
        setToastType('success');
        setToastMessage(`Purchase order updated to "${nextStatus}" status.`);
        // Reload details to update views
        loadPODetails();
      } else {
        setError('Failed to update purchase order status.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during status transition.');
    } finally {
      setActionLoading(false);
    }
  };

  // Indian currency formatting
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Printable action
  const handlePrint = () => {
    window.print();
  };

  if (loading && !po) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error || 'Purchase order details could not be found.'}
        </div>
        <button
          onClick={() => navigate(user?.role === 'vendor' ? '/vendor/my-orders' : '/purchase-orders')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
        >
          &larr; Back to Directory
        </button>
      </div>
    );
  }

  // Determine back navigation path
  const backPath = user?.role === 'vendor' ? '/vendor/my-orders' : '/purchase-orders';

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

      {/* Action Controls & Navigation (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <button
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          &larr; Back to List
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print PO
          </button>
          
          {user?.role !== 'vendor' && (
            <>
              {po.status === 'generated' && (
                <button
                  onClick={() => handleStatusTransition('sent')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  Mark as Sent
                </button>
              )}
              {po.status === 'sent' && (
                <>
                  {po.invoice_id ? (
                    <button
                      onClick={() => navigate(`/invoices/${po.invoice_id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                    >
                      View Invoice
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/invoices/new/${po.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20"
                    >
                      Generate Invoice
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusTransition('completed')}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    Mark as Completed
                  </button>
                </>
              )}
              {po.status === 'completed' && (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 text-sm font-semibold text-emerald-400"
                >
                  Order Completed
                </button>
              )}
            </>
          )}

          {user?.role === 'vendor' && po.status === 'sent' && (
            <span className="inline-flex items-center rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
              Awaiting Delivery Coordinator
            </span>
          )}
        </div>
      </div>

      {/* Invoice-Style PO Document */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-8 print:border-0 print:bg-white print:text-black print:p-0 print:shadow-none">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 print:text-black">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md print:bg-black print:from-black print:to-black">
                V
              </div>
              <span className="text-xl font-bold tracking-tight text-white print:text-black">VendorBridge ERP</span>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-500 font-medium">Procurement & Order Dispatch Services</p>
          </div>
          
          <div className="text-right space-y-1 sm:text-right">
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider print:text-black">Purchase Order</h1>
            <div className="font-mono text-sm font-bold text-cyan-400 print:text-black">{po.po_number}</div>
            <div className="text-xs text-slate-400 print:text-gray-500">Issued Date: {formatDate(po.created_at)}</div>
          </div>
        </div>

        {/* Status indicator banner */}
        <div className="rounded-xl bg-slate-950/40 border border-slate-850 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:bg-gray-100 print:border-gray-300 print:text-black">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-gray-600">Order Status:</span>
              <span className="uppercase text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-md border border-slate-700 print:bg-gray-200 print:text-black print:border-gray-400">
                {po.status}
              </span>
            </div>
            {po.invoice_number && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 print:text-gray-600 font-semibold uppercase">Invoice:</span>
                <Link to={`/invoices/${po.invoice_id}`} className="font-mono font-bold text-cyan-400 hover:text-cyan-300 hover:underline print:text-indigo-650">
                  {po.invoice_number}
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 print:text-gray-600 font-semibold uppercase">Authorized Manager:</span>
            <span className="text-slate-300 print:text-black font-semibold">{po.approver_name || 'System Administrator'}</span>
          </div>
        </div>

        {/* Bid/RFQ metadata details */}
        <div className="grid gap-6 sm:grid-cols-2 text-sm border-t border-slate-800/80 pt-6 print:border-gray-200 print:text-black">
          {/* Supplier Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider print:text-gray-600">Supplier coordinates</h3>
            <div className="space-y-1 text-slate-300 print:text-black">
              <div className="font-bold text-white text-base print:text-black">{po.vendor_name}</div>
              {po.vendor_gst && (
                <div className="text-xs">
                  <span className="text-slate-500 print:text-gray-600">GSTIN:</span> <span className="font-mono uppercase">{po.vendor_gst}</span>
                </div>
              )}
              <div className="text-xs">{po.vendor_email}</div>
              <div className="text-xs">{po.vendor_phone}</div>
              <div className="text-xs whitespace-pre-wrap leading-relaxed mt-1">{po.vendor_address}</div>
            </div>
          </div>
          
          {/* Shipping/Billing addresses */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider print:text-gray-600">Deliver To</h3>
            <div className="space-y-1 text-slate-300 print:text-black">
              <div className="font-bold text-white text-base print:text-black">VendorBridge Corporate Offices</div>
              <div className="text-xs"><span className="text-slate-500 print:text-gray-600">GSTIN:</span> <span className="font-mono">27AAAAA1111A1Z1</span></div>
              <div className="text-xs">procurement@vendorbridge.com</div>
              <div className="text-xs">+91 22 5555 0199</div>
              <div className="text-xs leading-relaxed mt-1">
                401, Tech Park-B, Bandra Kurla Complex,<br />
                Mumbai, Maharashtra - 400051, India
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider print:text-gray-600">Line Items</h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-gray-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black print:border-gray-300">
                  <th className="py-3 px-4 w-[8%] text-center">#</th>
                  <th className="py-3 px-4 w-[52%]">Item Description</th>
                  <th className="py-3 px-4 w-[12%] text-center">Quantity</th>
                  <th className="py-3 px-4 w-[14%] text-right">Unit Price</th>
                  <th className="py-3 px-4 w-[14%] text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300 print:divide-gray-200 print:text-black">
                {po.line_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/10">
                    <td className="py-4 px-4 text-center font-semibold text-slate-500 print:text-gray-500">{idx + 1}</td>
                    <td className="py-4 px-4 font-medium text-slate-200 print:text-black">
                      <div>{item.description}</div>
                      <div className="text-xs text-slate-500 print:text-gray-500 mt-0.5">Specifications matched to select quotation</div>
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-200 print:text-black">{item.quantity} units</td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-300 print:text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="py-4 px-4 text-right font-bold text-slate-100 print:text-black">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing calculations details */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-800/85 print:border-gray-200 print:text-black">
          {/* Notes and delivery details */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-400 print:text-gray-600">
            <div>
              <span className="font-bold text-slate-300 print:text-black uppercase tracking-wider block mb-1">Expected Delivery timeline</span>
              Should be completed within <strong>{po.quotation_delivery_days} calendar days</strong> from issue date ({formatDate(new Date(new Date(po.created_at).getTime() + po.quotation_delivery_days * 24 * 60 * 60 * 1000))}).
            </div>
            {po.quotation_notes && (
              <div className="pt-1">
                <span className="font-bold text-slate-300 print:text-black uppercase tracking-wider block mb-1">Remarks / Terms</span>
                <span className="italic">"{po.quotation_notes}"</span>
              </div>
            )}
          </div>

          {/* Totals computation table */}
          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm rounded-xl bg-slate-950/20 border border-slate-850 p-4 space-y-2 text-sm print:bg-gray-50 print:border-gray-300">
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Subtotal:</span>
                <span className="font-semibold text-slate-200 print:text-black">{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">GST (18%):</span>
                <span className="font-semibold text-slate-200 print:text-black">{formatCurrency(po.tax_amount)}</span>
              </div>
              <hr className="border-slate-800 print:border-gray-300" />
              <div className="flex justify-between text-base pt-1">
                <span className="font-bold text-white print:text-black">Grand Total:</span>
                <span className="font-bold text-emerald-400 print:text-emerald-700">{formatCurrency(po.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Approval section signatures */}
        <div className="grid gap-6 sm:grid-cols-2 pt-8 border-t border-slate-800/80 text-xs text-slate-400 print:border-gray-300 print:text-black">
          <div className="space-y-1">
            <span className="font-semibold uppercase tracking-wider block text-slate-500">Operational approval</span>
            <div className="text-slate-200 print:text-black font-semibold">Authorized by {po.approver_name || 'ERP Manager'}</div>
            <div>Timestamp: {formatDate(po.approval_decided_at)}</div>
            {po.approval_remarks && (
              <div className="italic text-slate-400 print:text-gray-500 mt-1">"Remarks: {po.approval_remarks}"</div>
            )}
          </div>
          
          <div className="flex flex-col justify-end items-end sm:text-right">
            <div className="h-10 w-40 border-b border-dashed border-slate-700 print:border-black" />
            <span className="font-semibold uppercase tracking-wider text-slate-500 mt-1">Receiver Signature / Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PODetail;
