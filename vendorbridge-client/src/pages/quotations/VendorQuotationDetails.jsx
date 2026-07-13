import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Calendar, DollarSign, Clock, FileText, Download, Award, XCircle, CheckCircle, HelpCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { getQuotationById } from '../../api/quotationApi';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HelpCircle },
  submitted: { label: 'Submitted', color: 'bg-green-50 text-[#22C55E] border-green-200/50', icon: Clock },
  withdrawn: { label: 'Withdrawn', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: ShieldAlert },
  selected: { label: 'Selected (Winner)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Award },
  rejected: { label: 'Not Selected', color: 'bg-slate-50 text-slate-400 border-slate-250', icon: XCircle }
};

const VendorQuotationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await getQuotationById(id);
        setQuotation(res.data);
      } catch (err) {
        console.error(err);
        setToast({ message: err.message || 'Failed to fetch quotation details.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currencyCode = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR'
    }).format(amount);
  };

  const getFileUrl = (filePath) => {
    const host = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${host}${filePath}`;
  };

  if (loading) return <Spinner fullPage={true} />;

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Quotation Not Found</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">We could not retrieve details for this quotation.</p>
        <button onClick={() => navigate('/quotations/vendor')} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Back to My Quotes</button>
      </div>
    );
  }

  const status = statusConfig[quotation.status] || { label: quotation.status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HelpCircle };
  const StatusIcon = status.icon;

  const deadlinePassed = quotation.rfq_deadline && new Date(quotation.rfq_deadline) < new Date();
  const isEditable = (quotation.status === 'draft' || quotation.status === 'submitted') && !deadlinePassed;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotations/vendor')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Quotation Details</p>
            <h1 className="text-3xl font-black text-slate-950 mt-1">{quotation.quotation_number}</h1>
          </div>
        </div>

        {isEditable && (
          <Link
            to={`/vendor/edit-quote/${quotation.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-500/20"
          >
            Edit Quotation
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details block */}
        <div className="md:col-span-2 space-y-6">
          {/* RFQ Reference Card */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Info size={18} className="text-primary" /> RFQ Reference
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">RFQ Number</span>
                <span className="block text-sm font-black text-slate-800">{quotation.rfq_number}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">Title / Scope</span>
                <Link to={`/rfqs/${quotation.rfq_id}`} className="block text-sm font-black text-primary hover:text-primary-hover">{quotation.rfq_title}</Link>
              </div>
            </div>
          </div>

          {/* Quoted Items Matrix */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign size={18} className="text-primary" /> Line Item Quotations
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-2.5">Item Name</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5">Unit</th>
                    <th className="py-2.5 text-right">Tax %</th>
                    <th className="py-2.5 text-right">Disc %</th>
                    <th className="py-2.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                  {(quotation.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-bold text-slate-800">
                        {item.item_name}
                        {item.rfq_item_desc && (
                          <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{item.rfq_item_desc}</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-800">{formatCurrency(item.unit_price, quotation.currency)}</td>
                      <td className="py-3 text-right font-mono text-slate-800">{item.quantity}</td>
                      <td className="py-3 text-slate-500">{item.unit}</td>
                      <td className="py-3 text-right font-mono text-slate-500">{item.tax_percentage}%</td>
                      <td className="py-3 text-right font-mono text-slate-500">{item.discount_percentage}%</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(item.total_amount, quotation.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Banner */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-500">
                <span>Subtotal (Base value)</span>
                <span className="font-mono">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-500">
                <span>Discount amount (-)</span>
                <span className="font-mono text-rose-650">{formatCurrency(quotation.discount_amount, quotation.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-500">
                <span>Tax amount (+)</span>
                <span className="font-mono text-emerald-650">{formatCurrency(quotation.tax_amount, quotation.currency)}</span>
              </div>
              <div className="border-t border-slate-200/60 my-2 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Quotation Grand Total</span>
                <span className="text-[#22C55E] font-mono text-lg">{formatCurrency(quotation.grand_total, quotation.currency)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Logistics details */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock size={18} className="text-primary" /> Delivery & Terms
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">Estimated Delivery Days</span>
                <span className="block text-sm font-black text-slate-850">{quotation.delivery_days} calendar days</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400">Currency</span>
                <span className="block text-sm font-black text-slate-850">{quotation.currency || 'INR'}</span>
              </div>
              {quotation.notes && (
                <div className="sm:col-span-2 space-y-1">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Supplier Comments / Remarks</span>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 italic text-slate-600 leading-relaxed font-semibold">
                    {quotation.notes}
                  </div>
                </div>
              )}
              {quotation.terms_conditions && (
                <div className="sm:col-span-2 space-y-1">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Quotation Terms & Conditions</span>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 italic text-slate-600 leading-relaxed font-semibold">
                    {quotation.terms_conditions}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status & Side Panels */}
        <div className="space-y-6">
          {/* Status Badge panel */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-premium space-y-4">
            <h3 className="text-base font-black text-slate-950">Quotation Status</h3>
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${status.color}`}>
              <StatusIcon size={24} className="shrink-0" />
              <div>
                <span className="block text-sm font-black">{status.label}</span>
                <span className="block text-[10px] font-bold opacity-80 mt-0.5">Updated: {formatDate(quotation.updated_at)}</span>
              </div>
            </div>
            {quotation.status === 'selected' && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 leading-relaxed">
                🏆 Congratulations! This bid was selected as the winner. Standard PO generation is in progress.
              </div>
            )}
            {deadlinePassed && quotation.status === 'submitted' && (
              <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 text-xs font-bold text-orange-850 leading-relaxed">
                ⌛ Note: RFQ Deadline has passed. This quotation is now locked and under review by the procurement team.
              </div>
            )}
          </div>

          {/* Attachments panel */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-premium space-y-4">
            <h3 className="text-base font-black text-slate-950">Attachments</h3>
            {(quotation.attachments || []).length > 0 ? (
              <div className="space-y-2">
                {quotation.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={getFileUrl(att.file_path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 hover:bg-slate-50 transition cursor-pointer"
                    title={`Download ${att.file_name}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={18} className="text-red-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{att.file_name}</span>
                    </div>
                    <Download size={16} className="text-slate-400 shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center rounded-2xl border border-dashed border-slate-200 p-5 text-slate-400 text-xs font-bold">
                No technical drawings or proposal files attached.
              </div>
            )}
          </div>

          {/* Submission History timeline */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-premium space-y-4">
            <h3 className="text-base font-black text-slate-950">Bidding Timeline</h3>
            <div className="space-y-4 text-xs font-semibold text-slate-500 relative pl-4 border-l border-slate-200">
              <div className="relative">
                <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created At</span>
                <span className="block text-slate-800 mt-0.5">{formatDate(quotation.created_at)}</span>
              </div>
              {quotation.submission_date && (
                <div className="relative">
                  <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submitted Bid</span>
                  <span className="block text-slate-800 mt-0.5">{formatDate(quotation.submission_date)}</span>
                </div>
              )}
              {quotation.status === 'withdrawn' && (
                <div className="relative">
                  <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Withdrawn Bid</span>
                  <span className="block text-slate-800 mt-0.5">{formatDate(quotation.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default VendorQuotationDetails;
