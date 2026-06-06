import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Info, Calendar, DollarSign, Clock, FileText, Upload, AlertCircle } from 'lucide-react';
import { getRFQById } from '../../api/rfqApi';
import { submitQuotation } from '../../api/quotationApi';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const VendorQuotationCreate = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  // DB specifications state
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState('');

  // Page interaction states
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchRFQ = async () => {
      try {
        const res = await getRFQById(rfqId);
        setRfq(res.data);
        if (res.data) {
          // Pre-populate quantity from RFQ
          setQuantity(res.data.quantity || '');
        }
      } catch (err) {
        console.error(err);
        setToast({ message: err.response?.data?.message || 'Failed to fetch RFQ specifications.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRFQ();
  }, [rfqId]);

  // Real-time calculated total price
  const totalPrice = Number(unitPrice) * Number(quantity);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, attachment: 'Only PDF documents are allowed.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, attachment: 'Document size must be less than 5MB.' }));
        return;
      }
      setAttachment(file);
      setAttachmentName(file.name);
      setErrors(prev => ({ ...prev, attachment: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const price = Number(unitPrice);
    if (!unitPrice) {
      newErrors.unitPrice = 'Unit Price is required.';
    } else if (isNaN(price) || price <= 0) {
      newErrors.unitPrice = 'Unit Price must be a positive number greater than 0.';
    }

    const qty = Number(quantity);
    if (!quantity) {
      newErrors.quantity = 'Quantity is required.';
    } else if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      newErrors.quantity = 'Quantity must be a positive whole integer.';
    } else if (rfq && qty > rfq.quantity) {
      newErrors.quantity = `Quantity cannot exceed the RFQ requested quantity of ${rfq.quantity}.`;
    }

    const days = Number(deliveryDays);
    if (!deliveryDays) {
      newErrors.deliveryDays = 'Delivery Days estimate is required.';
    } else if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      newErrors.deliveryDays = 'Delivery Days must be a positive whole integer.';
    }

    if (rfq && rfq.status !== 'open') {
      newErrors.rfq = 'Quotation is blocked: RFQ is not open.';
    }

    if (rfq && new Date(rfq.deadline) < new Date()) {
      newErrors.rfq = 'Quotation is blocked: RFQ deadline has passed.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Create request payload
      // In production, attachment can be uploaded to S3/Cloudinary first
      const payload = {
        rfq_id: parseInt(rfqId),
        unit_price: parseFloat(unitPrice),
        quantity: parseInt(quantity),
        delivery_days: parseInt(deliveryDays),
        notes: notes || null,
        attachment_url: attachmentName ? `/uploads/attachments/${Date.now()}_${attachmentName}` : null
      };

      await submitQuotation(payload);
      setToast({ message: 'Quotation submitted successfully!', type: 'success' });
      setTimeout(() => {
        navigate('/vendor-portal');
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to submit quotation.', type: 'error' });
      setSubmitting(false);
    }
  };

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

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">RFQ Details Not Found</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">We could not retrieve the specifications for this RFQ.</p>
        <button onClick={() => navigate('/vendor-portal')} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Back to Portal</button>
      </div>
    );
  }

  const isOverdue = new Date(rfq.deadline) < new Date();
  const isClosed = rfq.status !== 'open';
  const isBlocked = isOverdue || isClosed;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendor-portal')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6D5DFC]">RFQ ID: {rfq.rfq_number}</p>
          <h1 className="text-3xl font-black text-slate-950 mt-1">Submit Bidding Quotation</h1>
        </div>
      </div>

      {isBlocked && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{isClosed ? `Bidding is disabled because the RFQ is closed (${rfq.status}).` : 'Bidding is disabled because the RFQ deadline has passed.'}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: RFQ Summary */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
              <Info size={18} className="text-[#6D5DFC]" /> Section 1: RFQ Summary
            </h2>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="text-base font-black text-slate-900">{rfq.title}</h3>
              <p className="text-sm font-semibold text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{rfq.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Quantity</span>
                <span className="mt-1 block text-sm font-black text-slate-800 font-mono">{rfq.quantity} units</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</span>
                <span className="mt-1 block text-sm font-black capitalize text-slate-800">{rfq.status}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Budget</span>
                <span className="mt-1 block text-sm font-black text-slate-800 font-mono">{formatCurrency(rfq.estimated_budget)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
              <DollarSign size={18} className="text-[#6D5DFC]" /> Section 2: Pricing
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Unit Price (₹) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    disabled={isBlocked}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className={`h-12 w-full rounded-2xl border bg-slate-50 pl-8 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white disabled:opacity-60 ${errors.unitPrice ? 'border-rose-500' : 'border-slate-200'}`}
                  />
                </div>
                {errors.unitPrice && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.unitPrice}</p>}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Bidding Quantity <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isBlocked}
                  placeholder={rfq.quantity}
                  step="1"
                  min="1"
                  className={`h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white disabled:opacity-60 ${errors.quantity ? 'border-rose-500' : 'border-slate-200'}`}
                />
                {errors.quantity && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.quantity}</p>}
              </div>
            </div>

            {/* Auto Calculate Total Value */}
            <div className="rounded-2xl border border-slate-100 bg-[#6D5DFC]/5 px-5 py-4 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500">Calculated Total Value</span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">Auto computed (Unit Price × Quantity)</span>
              </div>
              <span className="text-2xl font-black text-[#6D5DFC] font-mono">
                {formatCurrency(totalPrice || 0)}
              </span>
            </div>
          </div>

          {/* Section 3: Delivery */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
              <Clock size={18} className="text-[#6D5DFC]" /> Section 3: Delivery
            </h2>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Estimated Delivery Days <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="number"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  disabled={isBlocked}
                  placeholder="e.g., 15"
                  step="1"
                  min="1"
                  className={`h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white disabled:opacity-60 ${errors.deliveryDays ? 'border-rose-500' : 'border-slate-200'}`}
                />
              </div>
              {errors.deliveryDays && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.deliveryDays}</p>}
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
              <FileText size={18} className="text-[#6D5DFC]" /> Section 4: Notes
            </h2>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Additional Comments / Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isBlocked}
                placeholder="Logistics terms, packaging specifications, warranty policies, etc."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white disabled:opacity-60 resize-none"
              />
            </div>
          </div>

          {/* Section 5: Attachment */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
              <Upload size={18} className="text-[#6D5DFC]" /> Section 5: Attachment
            </h2>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Upload Quotation Document (Optional PDF)</label>
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isBlocked}
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Upload size={28} className="text-slate-400 mb-3" />
                <span className="text-sm font-black text-slate-800">
                  {attachmentName ? attachmentName : 'Drag and drop or click to upload'}
                </span>
                <span className="text-xs font-bold text-slate-400 mt-1">PDF file, maximum 5MB size limit.</span>
              </div>
              {errors.attachment && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.attachment}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => navigate('/vendor-portal')}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            {!isBlocked && (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:from-[#5b4deb] hover:to-[#9946e6] transition-all disabled:opacity-50"
              >
                Submit Quotation
              </button>
            )}
          </div>
        </form>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
            <h3 className="text-base font-black text-slate-950">Closing Details</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider text-slate-400">Deadline</span>
                  <span className="mt-0.5 block font-bold text-slate-800">{formatDate(rfq.deadline)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-3">
            <h3 className="text-base font-black text-slate-950">Terms & Rules</h3>
            <ul className="list-disc list-inside text-xs font-bold text-slate-500 space-y-2.5 leading-relaxed">
              <li>Assigned vendors may submit only ONE quotation per RFQ invitation.</li>
              <li>Bids can be edited or withdrawn until the deadline.</li>
              <li>Submission is fully disabled after the RFQ deadline.</li>
              <li>Unit pricing and delivery schedules must be positive whole values.</li>
            </ul>
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
      {submitting && <Spinner fullPage={true} />}
    </div>
  );
};

export default VendorQuotationCreate;
