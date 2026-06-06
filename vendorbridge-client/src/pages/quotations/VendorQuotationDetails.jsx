import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Calendar, DollarSign, Clock, FileText, Download, Award, XCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { getQuotationById } from '../../api/quotationApi';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HelpCircle },
  submitted: { label: 'Submitted', color: 'bg-purple-50 text-[#6D5DFC] border-purple-200/50', icon: Clock },
  selected: { label: 'Selected (Winner)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Award },
  rejected: { label: 'Not Selected', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) return <Spinner fullPage={true} />;

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Quotation Not Found</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">We could not retrieve details for this quotation.</p>
        <button onClick={() => navigate('/quotations/vendor')} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Back to Quotations</button>
      </div>
    );
  }

  const status = statusConfig[quotation.status] || { label: quotation.status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: HelpCircle };
  const StatusIcon = status.icon;

  const deadlinePassed = new Date(quotation.rfq_deadline) < new Date();
  const isEditable = (quotation.status === 'draft' || quotation.status === 'submitted') && !deadlinePassed;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
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
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6D5DFC]">Quotation Summary</p>
            <h1 className="text-3xl font-black text-slate-950 mt-1">{quotation.quotation_number || `QTE-${String(quotation.id).padStart(5, '0')}`}</h1>
          </div>
        </div>

        {isEditable && (
          <Link
            to={`/vendor/edit-quote/${quotation.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20"
          >
            Edit Quotation
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details block */}
        <div className="md:col-span-2 space-y-6">
          {/* RFQ Reference Card */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Info size={18} className="text-[#6D5DFC]" /> RFQ Specifications
            </h2>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">RFQ Number</span>
              <span className="block text-sm font-bold text-slate-700">{quotation.rfq_number}</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Title / Product</span>
              <Link to={`/rfqs/${quotation.rfq_id}`} className="block text-base font-black text-slate-900 hover:text-[#6D5DFC] transition-colors">{quotation.rfq_title}</Link>
            </div>
          </div>

          {/* Quotation Details */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-6">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign size={18} className="text-[#6D5DFC]" /> Commercial & Bidding Values
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Unit Price</span>
                <span className="mt-1 block text-lg font-black text-slate-900 font-mono">{formatCurrency(quotation.unit_price)}</span>
                <span className="block text-[10px] text-slate-400 mt-1">Pricing per unit</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Bidding Quantity</span>
                <span className="mt-1 block text-lg font-black text-slate-900 font-mono">{quotation.quantity} units</span>
                <span className="block text-[10px] text-slate-400 mt-1">Contract quantity</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#6D5DFC]/5 border border-slate-100 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Total Contract Value</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Calculated total price</span>
              </div>
              <span className="text-2xl font-black text-[#6D5DFC] font-mono">{formatCurrency(quotation.total_price)}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Delivery Speed</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mt-1">
                  <Clock size={16} className="text-[#6D5DFC]" />
                  <span>{quotation.delivery_days} calendar days</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Submitted At</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mt-1">
                  <Calendar size={16} className="text-[#6D5DFC]" />
                  <span>{formatDate(quotation.submitted_at)}</span>
                </div>
              </div>
            </div>

            {/* Bidding Notes */}
            <div className="space-y-2">
              <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Quotation Remarks / Notes</span>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-650 leading-relaxed text-slate-600 italic whitespace-pre-line">
                {quotation.notes || 'No comments or special logistics remarks provided.'}
              </div>
            </div>
          </div>
        </div>

        {/* Status & Side info */}
        <div className="space-y-6">
          {/* Status Panel */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h3 className="text-base font-black text-slate-950">Quotation Status</h3>
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${status.color}`}>
              <StatusIcon size={24} className="shrink-0" />
              <div>
                <span className="block text-sm font-black">{status.label}</span>
                <span className="block text-[10px] font-bold opacity-80 mt-0.5">Updated: {formatDate(quotation.updated_at || quotation.submitted_at)}</span>
              </div>
            </div>
            {quotation.status === 'selected' && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 leading-relaxed">
                🎉 Congratulations! Your quotation has been successfully chosen by our procurement team. The manager approval workflow is in progress.
              </div>
            )}
          </div>

          {/* Attachment Panel */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h3 className="text-base font-black text-slate-950">Document Attachment</h3>
            {quotation.attachment_url ? (
              <a
                href={quotation.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-red-500" />
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                    {quotation.attachment_url.split('_').pop()}
                  </span>
                </div>
                <Download size={16} className="text-slate-400" />
              </a>
            ) : (
              <div className="text-center rounded-2xl border border-dashed border-slate-200 p-5 text-slate-400 text-xs font-bold">
                No files or PDF sheets attached.
              </div>
            )}
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
