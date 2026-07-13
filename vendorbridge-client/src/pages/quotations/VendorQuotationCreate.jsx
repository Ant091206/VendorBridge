import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Calendar, DollarSign, Clock, FileText, Upload, AlertCircle, Plus, Trash2, X } from 'lucide-react';
import { getRFQById } from '../../api/rfqApi';
import { submitQuotation, uploadQuotationAttachment } from '../../api/quotationApi';
import { calculateQuotationAmounts } from '../../utils/priceCalculator';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const VendorQuotationCreate = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [items, setItems] = useState([]);
  const [deliveryDays, setDeliveryDays] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  
  // File attachments state
  const [newFiles, setNewFiles] = useState([]);

  // Page interaction states
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchRFQ = async () => {
      try {
        const res = await getRFQById(rfqId);
        setRfq(res.data);
        if (res.data) {
          // Pre-populate quotation items from RFQ items list
          const rfqItems = res.data.items || [];
          const initialItems = rfqItems.map((ri) => ({
            rfq_item_id: ri.id,
            item_name: ri.item_name,
            description: ri.description || '',
            unit: ri.unit,
            quantity: Number(ri.quantity) || 1,
            unit_price: ri.expected_price ? Number(ri.expected_price) : '',
            tax_percentage: 0,
            discount_percentage: 0,
            total_amount: 0
          }));
          setItems(initialItems);
        }
      } catch (err) {
        console.error(err);
        setToast({ message: err.response?.data?.message || 'Failed to fetch RFQ details.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRFQ();
  }, [rfqId]);

  // Central calculations whenever items list updates
  const calculations = React.useMemo(() => {
    return calculateQuotationAmounts(items);
  }, [items]);

  const handleItemFieldChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        // Perform calculation for single item total
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.unit_price) || 0;
        const taxPct = parseFloat(updated.tax_percentage) || 0;
        const discPct = parseFloat(updated.discount_percentage) || 0;

        const base = qty * price;
        const disc = base * (discPct / 100);
        const taxable = base - disc;
        const tax = taxable * (taxPct / 100);
        updated.total_amount = Number((taxable + tax).toFixed(2));
        return updated;
      })
    );
  };

  // Drag-and-drop file uploaders
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      const invalidFiles = filesArr.filter((f) => f.size > 10 * 1024 * 1024); // 10MB limit
      if (invalidFiles.length > 0) {
        setToast({ message: 'One or more files exceed the 10MB size limit.', type: 'error' });
        return;
      }
      setNewFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleRemoveNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const validateForm = () => {
    const newErrors = {};

    const days = Number(deliveryDays);
    if (!deliveryDays) {
      newErrors.deliveryDays = 'Delivery timeline is required.';
    } else if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      newErrors.deliveryDays = 'Delivery timeline must be a positive integer greater than 0.';
    }

    if (items.length === 0) {
      newErrors.items = 'At least one item quotation response is required.';
    } else {
      items.forEach((item, index) => {
        const price = Number(item.unit_price);
        if (item.unit_price === '' || isNaN(price) || price <= 0) {
          newErrors[`item_${index}_price`] = 'Unit price must be > 0';
        }
        const qty = Number(item.quantity);
        if (item.quantity === '' || isNaN(qty) || qty <= 0) {
          newErrors[`item_${index}_qty`] = 'Quantity must be > 0';
        }
      });
    }

    if (rfq && rfq.status !== 'published' && rfq.status !== 'open') {
      newErrors.rfq = `Quotation is disabled: RFQ is currently ${rfq.status}. Only Published RFQs are eligible.`;
    }

    if (rfq && rfq.submission_deadline && new Date(rfq.submission_deadline) < new Date()) {
      newErrors.rfq = 'Quotation is disabled: RFQ deadline has passed.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (status) => {
    if (!validateForm()) {
      setToast({ message: 'Please fix validation errors before submitting.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // Create request payload
      const payload = {
        rfq_id: parseInt(rfqId),
        delivery_days: parseInt(deliveryDays),
        currency,
        notes: notes || null,
        terms_conditions: termsConditions || null,
        status, // 'draft' or 'submitted'
        items: items.map((item) => ({
          rfq_item_id: item.rfq_item_id,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          tax_percentage: parseFloat(item.tax_percentage) || 0,
          discount_percentage: parseFloat(item.discount_percentage) || 0
        }))
      };

      const res = await submitQuotation(payload);
      const quoteId = res.data?.id;

      if (!quoteId) {
        throw new Error('Failed to retrieve quotation ID from creation response.');
      }

      // Upload file attachments if any
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          await uploadQuotationAttachment(quoteId, fileFormData);
        }
      }

      setToast({ message: status === 'submitted' ? 'Quotation submitted successfully!' : 'Quotation draft saved.', type: 'success' });
      setTimeout(() => {
        navigate('/quotations/vendor');
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to submit quotation.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
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

  const isDeadlinePassed = rfq.submission_deadline && new Date(rfq.submission_deadline) < new Date();
  const isClosed = rfq.status !== 'published' && rfq.status !== 'open';
  const isBlocked = isDeadlinePassed || isClosed;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendor-portal')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Procurement Bidding</p>
          <h1 className="text-3xl font-black text-slate-950 mt-1">Submit Bidding Quotation</h1>
        </div>
      </div>

      {isBlocked && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            {isClosed
              ? `Bidding is disabled because the RFQ is not in Published state (${rfq.status}).`
              : 'Bidding is disabled because the RFQ deadline has passed.'}
          </span>
        </div>
      )}

      {errors.rfq && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {errors.rfq}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Section 1: RFQ Summary */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Info size={18} className="text-primary" /> RFQ Information
            </h2>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <h3 className="text-base font-black text-slate-900">{rfq.title}</h3>
              <p className="text-sm font-semibold text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{rfq.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-xs font-bold text-slate-500">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">RFQ Number</span>
                <span className="mt-1 block text-sm font-black text-slate-800">{rfq.rfq_number}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Priority</span>
                <span className="mt-1 block text-sm font-black text-slate-800">{rfq.priority}</span>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deadline</span>
                <span className="mt-1 block text-sm font-black text-slate-800">
                  {rfq.submission_deadline ? new Date(rfq.submission_deadline).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Quoted Items */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign size={18} className="text-primary" /> Quoted Items & Pricing
            </h2>
            
            {errors.items && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                {errors.items}
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="rounded-2xl border border-slate-150 p-4 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="text-xs font-black text-slate-800">
                      Item #{index + 1}: <span className="text-primary">{item.item_name}</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
                      Unit: {item.unit}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 font-bold mb-2">Specs: {item.description}</p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Unit Price (₹) *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemFieldChange(index, 'unit_price', e.target.value)}
                        disabled={isBlocked}
                        placeholder="0.00"
                        className={`premium-input text-xs py-2 ${errors[`item_${index}_price`] ? 'border-rose-400' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Bidding Qty *</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                        disabled={isBlocked}
                        className={`premium-input text-xs py-2 ${errors[`item_${index}_qty`] ? 'border-rose-400' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Tax (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.tax_percentage}
                        onChange={(e) => handleItemFieldChange(index, 'tax_percentage', e.target.value)}
                        disabled={isBlocked}
                        className="premium-input text-xs py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discount_percentage}
                        onChange={(e) => handleItemFieldChange(index, 'discount_percentage', e.target.value)}
                        disabled={isBlocked}
                        className="premium-input text-xs py-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 text-xs font-bold text-slate-500">
                    Calculated Item Total: <span className="text-slate-800 font-black ml-1.5 font-mono">{formatCurrency(item.total_amount || 0)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Banner */}
            <div className="rounded-2xl border border-slate-100 bg-primary/5 p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-500">
                <span>Subtotal (Base Price)</span>
                <span className="font-mono">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-500">
                <span>Discount Amount (-)</span>
                <span className="font-mono text-rose-650">{formatCurrency(calculations.discount_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-500">
                <span>Tax Amount (+)</span>
                <span className="font-mono text-emerald-650">{formatCurrency(calculations.tax_amount)}</span>
              </div>
              <div className="border-t border-slate-200/60 my-2 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Calculated Grand Total</span>
                <span className="text-[#22C55E] font-mono text-lg">{formatCurrency(calculations.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Information */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock size={18} className="text-primary" /> Delivery Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Estimated Delivery Days *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                  disabled={isBlocked}
                  placeholder="e.g. 14"
                  className={`premium-input ${errors.deliveryDays ? 'border-rose-400' : ''}`}
                />
                {errors.deliveryDays && <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.deliveryDays}</p>}
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isBlocked}
                  className="premium-input cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Notes and Terms */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={18} className="text-primary" /> Terms & Comments
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Technical / Commercial Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isBlocked}
                  placeholder="Provide logistics comments, packaging parameters, pricing logic, warranty details etc..."
                  rows={3}
                  className="premium-input min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Terms & Conditions</label>
                <textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  disabled={isBlocked}
                  placeholder="Specify payment timelines, validity period of quotation rates, and compliance certificates..."
                  rows={3}
                  className="premium-input min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Attachments */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-premium space-y-4">
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload size={18} className="text-primary" /> Quotation Attachments
            </h2>
            
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-3xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition relative group cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isBlocked}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <Upload size={28} className="text-slate-400 group-hover:text-primary transition-colors" />
                <p className="text-sm font-bold text-slate-700">Click or drag proposal documents here</p>
                <p className="text-xs font-semibold">Supports PDFs, Excel, Zip and Images up to 10MB each.</p>
              </div>
            </div>

            {newFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Selected Files ({newFiles.length})</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {newFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-green-50/10 text-xs font-semibold">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-primary shrink-0" />
                        <span className="text-slate-750 truncate" title={file.name}>{file.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/vendor-portal')}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {!isBlocked && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFormSubmit('draft')}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFormSubmit('submitted')}
                  className="rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-500/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Submit Quotation
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-premium space-y-4">
            <h3 className="text-base font-black text-slate-950">Closing Details</h3>
            <div className="flex items-start gap-3 text-sm font-semibold">
              <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Bid Deadline</span>
                <span className={`block mt-0.5 ${isDeadlinePassed ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                  {rfq.submission_deadline ? new Date(rfq.submission_deadline).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-premium space-y-3">
            <h3 className="text-base font-black text-slate-950">Bidding Rules</h3>
            <ul className="list-disc list-inside text-xs font-bold text-slate-500 space-y-2.5 leading-relaxed">
              <li>Assigned vendors may submit only ONE quotation per RFQ invitation.</li>
              <li>Bids can be edited or withdrawn until the deadline.</li>
              <li>Calculations are verified in real time according to the ERP pricing system.</li>
              <li>Files are restricted to 10MB size limit.</li>
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
