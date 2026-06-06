import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRFQById } from '../../api/rfqApi';
import { submitQuotation } from '../../api/quotationApi';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const SubmitQuote = () => {
  const { rfq_id } = useParams();
  const navigate = useNavigate();

  // Specs read-only states
  const [rfq, setRfq] = useState(null);
  
  // Bidding inputs states
  const [unitPrice, setUnitPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [notes, setNotes] = useState('');

  // Page interaction states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Load RFQ Info
  useEffect(() => {
    const fetchRFQSpecs = async () => {
      try {
        const res = await getRFQById(rfq_id);
        setRfq(res.data);
        
        // Validation check if deadline passed
        if (res.data) {
          const deadline = new Date(res.data.deadline);
          if (deadline < new Date()) {
            setToastType('error');
            setToastMessage('RFQ deadline has passed. Cannot submit quotation.');
          }
        }
      } catch (err) {
        console.error('Failed to load RFQ specifications:', err);
        setToastType('error');
        setToastMessage(err.message || 'Failed to fetch RFQ specifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchRFQSpecs();
  }, [rfq_id]);

  // Real time total price calculation
  const getCalculatedTotal = () => {
    if (!rfq || !unitPrice) return 0;
    const price = Number(unitPrice);
    if (isNaN(price) || price <= 0) return 0;
    return price * rfq.quantity;
  };

  // Format date to DD MMM YYYY
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Input Validation
  const validateForm = () => {
    const errors = {};
    const price = Number(unitPrice);
    if (!unitPrice) {
      errors.unitPrice = 'Unit Price is required.';
    } else if (isNaN(price) || price <= 0) {
      errors.unitPrice = 'Unit Price must be a positive number greater than 0.';
    }

    const days = Number(deliveryDays);
    if (!deliveryDays) {
      errors.deliveryDays = 'Delivery Days estimate is required.';
    } else if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      errors.deliveryDays = 'Delivery Days must be a positive whole integer.';
    }

    if (rfq && new Date(rfq.deadline) < new Date()) {
      errors.deadline = 'RFQ deadline has passed. Cannot submit quotation.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        rfq_id: parseInt(rfq_id),
        unit_price: parseFloat(unitPrice),
        delivery_days: parseInt(deliveryDays),
        notes: notes || null
      };

      await submitQuotation(payload);
      
      setToastType('success');
      setToastMessage('Quotation submitted successfully!');

      setTimeout(() => {
        navigate('/vendor-portal');
      }, 1500);
    } catch (err) {
      console.error('Bidding submission failed:', err);
      setToastType('error');
      
      // Map check validations from server
      let errMessage = err.message || 'An error occurred during submission.';
      if (errMessage.includes('already submitted')) {
        errMessage = 'You have already submitted a quotation for this RFQ. You can edit it instead.';
      } else if (errMessage.includes('deadline')) {
        errMessage = 'RFQ deadline has passed. Cannot submit quotation.';
      }
      setToastMessage(errMessage);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner fullPage={true} />;
  }

  if (!rfq) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-4">Request Specs Not Found</h2>
        <button
          onClick={() => navigate('/vendor-portal')}
          className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-350 hover:text-white"
        >
          Back to Portal
        </button>
      </div>
    );
  }

  const isOverdue = new Date(rfq.deadline) < new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Submission Loader */}
      {submitting && <Spinner fullPage={true} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendor-portal')}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Back to portal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Submit Bidding Quotation</h1>
          <p className="text-sm text-slate-400">Specify pricing rates and delivery schedules for invited RFQ terms.</p>
        </div>
      </div>

      {/* RFQ Info card (Read Only) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">{rfq.title}</h2>
          <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
            {rfq.status}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Required Quantity</span>
            <span className="mt-1 block font-bold text-white text-sm font-mono">{rfq.quantity} units</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Bidding Deadline</span>
            <span className={`mt-1 block font-bold text-sm ${isOverdue ? 'text-rose-500' : 'text-slate-350'}`}>
              {formatDate(rfq.deadline)}
            </span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Invitation ID</span>
            <span className="mt-1 block font-bold text-slate-350 text-sm font-mono">RFQ-{String(rfq.id).padStart(4, '0')}</span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/40 border border-slate-850 p-4">
          <span className="block text-slate-550 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description & specifications</span>
          <p className="text-sm text-slate-350 whitespace-pre-line leading-relaxed">{rfq.description}</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            {/* Unit Price */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Unit Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  disabled={isOverdue}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className={`w-full rounded-lg border bg-slate-950/50 py-3 pl-8 pr-4 text-sm text-white placeholder-slate-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.unitPrice ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Total = Unit Price × Quantity</p>
              {formErrors.unitPrice && <p className="mt-1.5 text-xs text-rose-400">{formErrors.unitPrice}</p>}
            </div>

            {/* Auto calculated Total Price display */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Calculated Total Value
              </span>
              <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-850 text-center select-none">
                <span className="block text-lg font-bold font-mono text-cyan-400">
                  ₹ {getCalculatedTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Delivery days */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Estimated Delivery (Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                disabled={isOverdue}
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                placeholder="e.g. 15"
                min="1"
                step="1"
                className={`w-full rounded-lg border bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.deliveryDays ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'
                }`}
              />
              {formErrors.deliveryDays && <p className="mt-1.5 text-xs text-rose-400">{formErrors.deliveryDays}</p>}
            </div>

            {/* Notes / Special terms */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Notes / Quotation Terms (Optional)
              </label>
              <textarea
                rows={3}
                disabled={isOverdue}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, logistics, warranty cycles, packaging specs, or custom bid details..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-6">
            <button
              type="button"
              onClick={() => navigate('/vendor-portal')}
              className="rounded-lg border border-slate-700 bg-slate-850 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Cancel
            </button>
            
            {!isOverdue && (
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500 transition"
              >
                Submit Quotation
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
};

export default SubmitQuote;
