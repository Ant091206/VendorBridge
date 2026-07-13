import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getPOById, 
  getVendorPOById, 
  issuePO, 
  cancelPO, 
  acknowledgePO, 
  updatePOStatusManual, 
  deletePO 
} from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Send, 
  Clock, 
  FileText,
  AlertTriangle,
  User,
  Settings,
  MoreVertical,
  CheckCircle2,
  Trash2
} from 'lucide-react';

const PODetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAckModal, setShowAckModal] = useState(false);

  // Form states inside modals
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [ackRemarks, setAckRemarks] = useState('');
  const [manualStatus, setManualStatus] = useState('Partially Fulfilled');
  const [statusRemarks, setStatusRemarks] = useState('');

  const loadPODetails = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (user?.role === 'vendor') {
        response = await getVendorPOById(id);
      } else {
        response = await getPOById(id);
      }
      
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

  const handleIssue = async () => {
    if (!window.confirm('Are you sure you want to officially issue this Purchase Order? Once issued, line items will be locked.')) return;
    setActionLoading(true);
    try {
      const response = await issuePO(id);
      if (response.status === 'success') {
        setToast({ message: 'Purchase Order officially issued!', type: 'success' });
        loadPODetails();
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to issue PO.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await cancelPO(id, cancelRemarks);
      if (response.status === 'success') {
        setToast({ message: 'Purchase Order cancelled successfully.', type: 'success' });
        setShowCancelModal(false);
        setCancelRemarks('');
        loadPODetails();
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to cancel PO.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAckSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await acknowledgePO(id, ackRemarks);
      if (response.status === 'success') {
        setToast({ message: 'Purchase Order acknowledged!', type: 'success' });
        setShowAckModal(false);
        setAckRemarks('');
        loadPODetails();
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to acknowledge PO.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const response = await updatePOStatusManual(id, manualStatus, statusRemarks);
      if (response.status === 'success') {
        setToast({ message: `Status updated to ${manualStatus}!`, type: 'success' });
        setShowStatusModal(false);
        setStatusRemarks('');
        loadPODetails();
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to update status.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this Draft Purchase Order? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const response = await deletePO(id);
      if (response.status === 'success') {
        setToast({ message: 'Purchase Order deleted successfully.', type: 'success' });
        setTimeout(() => {
          navigate('/purchase-orders');
        }, 1000);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete PO.', type: 'error' });
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 border border-slate-200">
            Draft
          </span>
        );
      case 'Issued':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <Send className="h-3 w-3" /> Issued
          </span>
        );
      case 'Acknowledged':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200">
            <Clock className="h-3 w-3" /> Acknowledged
          </span>
        );
      case 'Partially Fulfilled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            Partially Fulfilled
          </span>
        );
      case 'Fulfilled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Fulfilled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
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
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-bold text-rose-700">
          {error || 'Purchase Order details could not be found.'}
        </div>
        <button
          onClick={() => navigate(user?.role === 'vendor' ? '/vendor/my-orders' : '/purchase-orders')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-650 hover:bg-slate-50 transition"
        >
          &larr; Back to Directory
        </button>
      </div>
    );
  }

  const backPath = user?.role === 'vendor' ? '/vendor/my-orders' : '/purchase-orders';

  // State Timeline steps mapping
  const timelineSteps = [
    { label: 'Draft', active: ['Draft', 'Issued', 'Acknowledged', 'Partially Fulfilled', 'Fulfilled'].includes(po.status) },
    { label: 'Issued', active: ['Issued', 'Acknowledged', 'Partially Fulfilled', 'Fulfilled'].includes(po.status) },
    { label: 'Acknowledged', active: ['Acknowledged', 'Partially Fulfilled', 'Fulfilled'].includes(po.status) },
    { label: 'Partially Fulfilled', active: ['Partially Fulfilled', 'Fulfilled'].includes(po.status) },
    { label: 'Fulfilled', active: po.status === 'Fulfilled' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Toast Alert */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {/* Navigation Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-550 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </button>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <Printer className="h-4 w-4" /> Print PO
          </button>
          
          {/* Officer/Admin Actions */}
          {user?.role !== 'vendor' && user?.role !== 'manager' && (
            <>
              {po.status === 'Draft' && (
                <>
                  <Link
                    to={`/purchase-orders/edit/${po.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-green-50/50 hover:bg-green-50 px-4 py-2.5 text-xs font-bold text-green-600 transition"
                  >
                    <Edit className="h-4 w-4" /> Edit Draft
                  </Link>
                  <button
                    onClick={handleIssue}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Issue PO
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2.5 text-xs font-bold text-rose-700 transition disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete PO
                  </button>
                </>
              )}

              {['Issued', 'Acknowledged', 'Partially Fulfilled'].includes(po.status) && (
                <>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Cancel PO
                  </button>
                </>
              )}

              {['Acknowledged', 'Partially Fulfilled'].includes(po.status) && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                >
                  <Settings className="h-4 w-4" /> Update Status
                </button>
              )}
            </>
          )}

          {/* Vendor Actions */}
          {user?.role === 'vendor' && po.status === 'Issued' && (
            <button
              onClick={() => setShowAckModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" /> Acknowledge PO
            </button>
          )}
        </div>
      </div>

      {/* Visual Timeline (Hidden on Print & Cancelled POs) */}
      {po.status !== 'Cancelled' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:hidden space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Lifecycle Timeline</h3>
          <div className="relative flex items-center justify-between mt-4">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -translate-y-1/2 -z-10" />
            <div 
              className="absolute left-0 top-1/2 h-1 bg-indigo-600 -translate-y-1/2 -z-10 transition-all duration-500" 
              style={{ 
                width: po.status === 'Draft' ? '0%' : 
                       po.status === 'Issued' ? '25%' : 
                       po.status === 'Acknowledged' ? '50%' : 
                       po.status === 'Partially Fulfilled' ? '75%' : '100%' 
              }} 
            />
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border-4 transition ${step.active ? 'bg-indigo-600 border-indigo-100 text-white' : 'bg-white border-slate-200 text-slate-450'}`}>
                  {idx + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${step.active ? 'text-green-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Banner if cancelled */}
      {po.status === 'Cancelled' && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 flex gap-4 items-center">
          <div className="rounded-2xl bg-rose-100 p-3 text-rose-650">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-950">This Purchase Order has been Cancelled</h3>
            <p className="text-xs text-rose-700 font-semibold mt-1">
              Refer to the action history trail below for cancellations remarks and reasons.
            </p>
          </div>
        </div>
      )}

      {/* Invoice-Style PO Document Sheet */}
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-premium space-y-8 print:border-0 print:p-0 print:shadow-none">
        
        {/* Logo and metadata Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md">
                VB
              </div>
              <span className="text-xl font-black tracking-tight">VendorBridge ERP</span>
            </div>
            <p className="text-[10px] text-slate-450 font-black uppercase tracking-widest">Procurement Dispatch Office</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Purchase Order</h1>
            <div className="font-mono text-sm font-black text-green-600">{po.po_number}</div>
            <div className="text-xs text-slate-450 font-bold">Issue Date: {formatDate(po.issue_date)}</div>
          </div>
        </div>

        {/* Dynamic Status & linking Info row */}
        <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-semibold text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-450">PO Status:</span>
              {getStatusBadge(po.status)}
            </div>
            {po.invoice_number && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-450">Invoice Link:</span>
                <Link to={`/invoices/${po.invoice_id}`} className="font-mono font-bold text-green-600 hover:underline">
                  {po.invoice_number}
                </Link>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500">
            <span className="font-black uppercase text-slate-450 mr-2">Approval Ref:</span>
            <span className="font-mono font-bold text-slate-800">{po.approval_number}</span>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid gap-8 sm:grid-cols-2 text-sm pt-4 border-t border-slate-50">
          {/* Supplier Coordinates */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Supplier (Vendor)</h3>
            <div className="space-y-1 font-semibold text-slate-650">
              <div className="font-black text-slate-900 text-lg">{po.vendor_name}</div>
              {po.vendor_gst && (
                <div className="text-xs">
                  <span className="text-slate-400">GSTIN:</span> <span className="font-mono font-black uppercase text-slate-800">{po.vendor_gst}</span>
                </div>
              )}
              <div className="text-xs">{po.vendor_email}</div>
              <div className="text-xs">{po.vendor_phone}</div>
              <div className="text-xs whitespace-pre-wrap leading-relaxed mt-2 text-slate-500">{po.vendor_address}</div>
            </div>
          </div>

          {/* Delivery coordinates */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Ship To (Corporate)</h3>
            <div className="space-y-1 font-semibold text-slate-650">
              <div className="font-black text-slate-900 text-lg">Hari Krupa Engineering</div>
              <div className="text-xs"><span className="text-slate-400">GSTIN:</span> <span className="font-mono font-black text-slate-800">27AAAAA1111A1Z1</span></div>
              <div className="text-xs">procurement@harikrupa.com</div>
              <div className="text-xs">+91 22 5555 0199</div>
              <div className="text-xs whitespace-pre-wrap leading-relaxed mt-2 text-slate-550">{po.delivery_address}</div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3 pt-6 border-t border-slate-50">
          <h3 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Line Items</h3>
          
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 w-[6%] text-center">#</th>
                  <th className="py-3 px-4 w-[48%]">Item & Description</th>
                  <th className="py-3 px-4 w-[12%] text-center">Qty</th>
                  <th className="py-3 px-4 w-[12%] text-right">Unit Price (₹)</th>
                  <th className="py-3 px-4 w-[8%] text-center">Tax (%)</th>
                  <th className="py-3 px-4 w-[8%] text-center">Disc (%)</th>
                  <th className="py-3 px-4 text-right w-[14%]">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {(po.line_items || []).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      <div>{item.item_name}</div>
                      {item.description && (
                        <div className="text-[10px] text-slate-450 mt-0.5 font-semibold leading-relaxed">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right">{parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-center">{item.tax_percentage}%</td>
                    <td className="py-3.5 px-4 text-center">{item.discount_percentage}%</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delivery Notes and totals summary */}
        <div className="grid gap-8 sm:grid-cols-2 pt-6 border-t border-slate-100 font-semibold text-xs leading-relaxed">
          {/* Notes and delivery details */}
          <div className="space-y-4 text-slate-500">
            <div>
              <span className="font-black text-slate-800 uppercase tracking-wider block mb-1">Expected Delivery timeline</span>
              Required to be completed within <strong>{po.expected_delivery_date ? formatDate(po.expected_delivery_date) : 'N/A'}</strong>.
            </div>
            {po.delivery_method && (
              <div>
                <span className="font-black text-slate-800 uppercase tracking-wider block mb-1">Shipping Mode</span>
                {po.delivery_method}
              </div>
            )}
            {po.notes && (
              <div>
                <span className="font-black text-slate-800 uppercase tracking-wider block mb-1">Procurement Remarks</span>
                <span className="italic">"{po.notes}"</span>
              </div>
            )}
            {po.terms_conditions && (
              <div>
                <span className="font-black text-slate-800 uppercase tracking-wider block mb-1">Terms & Conditions</span>
                <span className="whitespace-pre-line leading-relaxed">{po.terms_conditions}</span>
              </div>
            )}
          </div>

          {/* Pricing calculations */}
          <div className="flex flex-col items-end justify-start">
            <div className="w-full max-w-sm rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-2.5 text-sm font-semibold">
              <div className="flex justify-between text-slate-500">
                <span className="text-xs uppercase tracking-wider font-bold">Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(po.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="text-xs uppercase tracking-wider font-bold">Discount:</span>
                <span className="font-bold text-rose-600">- {formatCurrency(po.discount_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="text-xs uppercase tracking-wider font-bold">Tax Amount (GST):</span>
                <span className="font-bold text-slate-800">{formatCurrency(po.tax_amount)}</span>
              </div>
              <hr className="border-slate-200" />
              <div className="flex justify-between text-base pt-1">
                <span className="font-black text-slate-900">Grand Total:</span>
                <span className="font-black text-emerald-600 text-lg">{formatCurrency(po.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Signature section */}
        <div className="grid gap-6 sm:grid-cols-2 pt-8 border-t border-slate-100 text-xs text-slate-400 font-bold">
          <div className="space-y-1">
            <span className="font-black uppercase tracking-wider block text-slate-500">Approval validation</span>
            <div className="text-slate-800 font-black">Approved by {po.approver_name || 'System Manager'}</div>
            <div>Decided Date: {formatDate(po.approval_decided_at)}</div>
            {po.approval_remarks && (
              <div className="italic text-slate-500 font-semibold mt-1">"Manager Remarks: {po.approval_remarks}"</div>
            )}
          </div>
          
          <div className="flex flex-col justify-end items-end sm:text-right">
            <div className="h-10 w-40 border-b border-dashed border-slate-300" />
            <span className="font-black uppercase tracking-wider text-slate-400 mt-1">Authorized signature / stamp</span>
          </div>
        </div>

      </div>

      {/* History Audit Trail timeline logs */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-premium space-y-6 print:hidden">
        <h3 className="text-base font-bold text-slate-900">Action History & Timeline Logs</h3>
        
        <div className="relative border-l border-slate-200 pl-6 ml-4 space-y-6">
          {(po.history || []).map((h) => (
            <div key={h.id} className="relative flex flex-col gap-1">
              <span className="absolute -left-[31px] top-0.5 rounded-full bg-white border border-slate-300 p-1 text-slate-400">
                <User className="h-3 w-3" />
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{h.action_by_name}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {h.action_by_role}
                </span>
                <span className="text-[10px] text-slate-400 font-bold ml-auto">{new Date(h.action_date).toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mt-0.5">{h.action_type}</p>
              {h.remarks && (
                <p className="text-xs text-slate-500 font-semibold italic mt-0.5">"{h.remarks}"</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL: CANCEL PO ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="text-rose-600 h-5 w-5" /> Cancel Purchase Order
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Please enter the cancellation remarks/reasons. This change is permanent.
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <textarea
                rows="3"
                value={cancelRemarks}
                onChange={(e) => setCancelRemarks(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="premium-input text-xs"
                required
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                >
                  Cancel Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: UPDATE STATUS MANUAL ── */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="text-green-600 h-5 w-5" /> Update Order Status
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Transition the Purchase Order delivery state.
            </p>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Target Status
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="premium-input cursor-pointer"
                >
                  <option value="Partially Fulfilled">Partially Fulfilled</option>
                  <option value="Fulfilled">Fulfilled (Completed)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                  Status Notes / Remarks
                </label>
                <textarea
                  rows="3"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Enter comments about deliveries received..."
                  className="premium-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ACKNOWLEDGE PO (VENDOR) ── */}
      {showAckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="text-green-600 h-5 w-5" /> Confirm Acknowledge
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Confirm you have received and accepted this Purchase Order from procurement.
            </p>
            <form onSubmit={handleAckSubmit} className="space-y-4">
              <textarea
                rows="3"
                value={ackRemarks}
                onChange={(e) => setAckRemarks(e.target.value)}
                placeholder="Enter confirmation notes or remarks (optional)..."
                className="premium-input text-xs"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAckModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-650 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                >
                  Acknowledge Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PODetail;
