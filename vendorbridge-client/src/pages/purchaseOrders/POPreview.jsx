import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPOById } from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

const POPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchPO = async () => {
      try {
        const res = await getPOById(id);
        if (res.status === 'success') {
          setPo(res.data);
        } else {
          setError('Failed to load PO preview.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
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

  if (error || !po) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700 max-w-md text-center">
          {error || 'Purchase Order not found.'}
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
          <span className="text-xs font-black text-slate-500 uppercase">Document Preview:</span>
          <span className="font-mono text-xs font-black text-[#6D5DFC] bg-indigo-50 px-2.5 py-1 rounded-lg">
            {po.po_number}
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
            <span>Print Document</span>
          </button>
        </div>
      </div>

      {/* Official PO Document Sheet */}
      <div className="mx-auto max-w-4xl bg-white border border-slate-200 p-12 rounded-3xl shadow-xl shadow-slate-900/5 space-y-8 print:border-0 print:shadow-none print:p-0 print:bg-white print:text-black">
        
        {/* Company Logo Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-950">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-[#6D5DFC] flex items-center justify-center text-white font-bold text-base print:bg-black print:from-black print:to-black">
                VB
              </div>
              <span className="text-lg font-black tracking-tight print:text-black">VendorBridge ERP</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Purchase Order Dispatch Office</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h1 className="text-xl font-black text-slate-950 uppercase tracking-widest print:text-black">Purchase Order</h1>
            <div className="font-mono text-xs font-black text-[#6D5DFC] print:text-black">{po.po_number}</div>
            <div className="text-[11px] text-slate-400 font-bold">Issue Date: {formatDate(po.created_at)}</div>
          </div>
        </div>

        {/* Status indicator bar */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:bg-slate-100 print:text-black print:border-slate-350">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase">Status:</span>
            <span className="inline-flex rounded-lg bg-indigo-50 border border-indigo-155 text-[#6D5DFC] font-black uppercase text-[10px] px-2.5 py-1 tracking-wider print:bg-white print:text-black">
              {po.status}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            <span className="font-bold uppercase text-slate-400 mr-2">Authorized By:</span>
            <strong className="text-slate-800 font-black">{po.approver_name || 'System Manager'}</strong>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid gap-8 sm:grid-cols-2 text-sm border-t border-slate-100 pt-6 print:text-black">
          {/* Vendor Details */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Vendor (Supplier)</h3>
            <div className="space-y-0.5 text-slate-600 print:text-black font-semibold">
              <div className="font-bold text-slate-900 text-base print:text-black">{po.vendor_name}</div>
              {po.vendor_gst && (
                <div className="text-xs text-slate-500">
                  <span>GSTIN:</span> <span className="font-mono uppercase font-black">{po.vendor_gst}</span>
                </div>
              )}
              <div className="text-xs">{po.vendor_email}</div>
              <div className="text-xs">{po.vendor_phone}</div>
              <div className="text-xs whitespace-pre-wrap leading-relaxed mt-1 text-slate-400 print:text-black font-semibold">{po.vendor_address}</div>
            </div>
          </div>

          {/* Delivery coordinates */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Deliver To</h3>
            <div className="space-y-0.5 text-slate-600 print:text-black font-semibold">
              <div className="font-bold text-slate-900 text-base print:text-black">VendorBridge Corporate BKC</div>
              <div className="text-xs text-slate-500"><span>GSTIN:</span> <span className="font-mono font-black">27AAAAA1111A1Z1</span></div>
              <div className="text-xs">procurement@vendorbridge.com</div>
              <div className="text-xs">+91 22 5555 0199</div>
              <div className="text-xs leading-relaxed mt-1 text-slate-400 print:text-black font-semibold">
                401, Tech Park-B, Bandra Kurla Complex,<br />
                Mumbai, Maharashtra - 400051, India
              </div>
            </div>
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
                  <th className="py-3 px-4 w-[52%]">Item Details</th>
                  <th className="py-3 px-4 w-[12%] text-center">Quantity</th>
                  <th className="py-3 px-4 w-[14%] text-right">Unit Price</th>
                  <th className="py-3 px-4 w-[14%] text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-semibold print:text-black print:divide-slate-200">
                {po.line_items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      <div>{item.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">{item.quantity} units</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-500">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing calculations */}
        <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-100 print:text-black">
          {/* Notes and delivery details */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-400 font-semibold print:text-slate-600">
            <div>
              <span className="font-black text-slate-800 print:text-black uppercase tracking-wider block mb-1">Expected Delivery timeline</span>
              Required to be completed within <strong>{po.quotation_delivery_days} calendar days</strong> from issue date.
            </div>
            {po.quotation_notes && (
              <div className="pt-1">
                <span className="font-black text-slate-800 print:text-black uppercase tracking-wider block mb-1">Remarks / Terms</span>
                <span className="italic">"{po.quotation_notes}"</span>
              </div>
            )}
          </div>

          {/* Totals Table */}
          <div className="flex flex-col items-end">
            <div className="w-full max-w-sm rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-xs font-semibold print:bg-slate-50 print:border-slate-350">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Subtotal:</span>
                <span className="font-black text-slate-900">{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">GST (18% standard):</span>
                <span className="font-black text-slate-900">{formatCurrency(po.tax_amount)}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-sm pt-1">
                <span className="font-black text-slate-900">Grand Total:</span>
                <span className="font-black text-emerald-600">{formatCurrency(po.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid gap-6 sm:grid-cols-2 pt-8 border-t border-slate-100 text-xs text-slate-400 font-bold print:text-black">
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block text-slate-500">Procurement Authorization</span>
            <div className="text-slate-900 print:text-black font-black">Authorized by {po.approver_name || 'System Manager'}</div>
            <div>Timestamp: {formatDate(po.approval_decided_at)}</div>
            {po.approval_remarks && (
              <div className="italic text-slate-500 font-medium">Remarks: "{po.approval_remarks}"</div>
            )}
          </div>
          
          <div className="flex flex-col justify-end items-end sm:text-right">
            <div className="h-10 w-40 border-b border-dashed border-slate-300 print:border-black" />
            <span className="font-black uppercase tracking-wider text-slate-400 mt-1">Receiver Signature / Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POPreview;
