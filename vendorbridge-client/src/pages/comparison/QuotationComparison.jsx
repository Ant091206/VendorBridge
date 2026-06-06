import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Info, Calendar, DollarSign, Clock, FileText, Check, Award, ShieldAlert, ArrowUpDown, Filter, X } from 'lucide-react';
import { getComparison, selectVendor } from '../../api/comparisonApi';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const QuotationComparison = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selection, setSelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState('price'); // price, delivery, date, vendor
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Filtering states
  const [vendorSearch, setVendorSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDelivery, setMinDelivery] = useState('');
  const [maxDelivery, setMaxDelivery] = useState('');

  // Selection Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [reason, setReason] = useState('');
  const [modalError, setModalError] = useState('');

  // Toast notifications
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await getComparison(rfqId);
      setRfq(response.data.rfq);
      setQuotations(response.data.quotations || []);
      setSelection(response.data.selection || null);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to load comparison records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [rfqId]);

  // Client-side filtering
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const vendorMatch = q.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
                          q.vendor_company.toLowerCase().includes(vendorSearch.toLowerCase());
      
      const priceVal = Number(q.total_price);
      const minPriceVal = minPrice ? Number(minPrice) : 0;
      const maxPriceVal = maxPrice ? Number(maxPrice) : Infinity;
      const priceMatch = priceVal >= minPriceVal && priceVal <= maxPriceVal;

      const deliveryVal = Number(q.delivery_days);
      const minDeliveryVal = minDelivery ? Number(minDelivery) : 0;
      const maxDeliveryVal = maxDelivery ? Number(maxDelivery) : Infinity;
      const deliveryMatch = deliveryVal >= minDeliveryVal && deliveryVal <= maxDeliveryVal;

      return vendorMatch && priceMatch && deliveryMatch;
    });
  }, [quotations, vendorSearch, minPrice, maxPrice, minDelivery, maxDelivery]);

  // Client-side sorting
  const sortedQuotations = useMemo(() => {
    const sorted = [...filteredQuotations];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'price') {
        comparison = Number(a.total_price) - Number(b.total_price);
      } else if (sortField === 'delivery') {
        comparison = Number(a.delivery_days) - Number(b.delivery_days);
      } else if (sortField === 'date') {
        comparison = new Date(a.submitted_at) - new Date(b.submitted_at);
      } else if (sortField === 'vendor') {
        comparison = a.vendor_name.localeCompare(b.vendor_name);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredQuotations, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenSelectionModal = (quote) => {
    setSelectedQuote(quote);
    setReason('');
    setModalError('');
    setShowModal(true);
  };

  const handleConfirmSelection = async () => {
    if (!reason.trim()) {
      setModalError('Selection reason is required to submit approval workflow.');
      return;
    }

    setSubmitting(true);
    try {
      await selectVendor(rfqId, {
        selected_quotation_id: selectedQuote.id,
        selection_reason: reason.trim()
      });

      setToast({ message: `Vendor "${selectedQuote.vendor_name}" has been selected. Approval workflow generated.`, type: 'success' });
      setShowModal(false);
      
      // Reload comparison data to reflect updated statuses
      setTimeout(() => {
        fetchComparisonData();
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to select winning vendor.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setVendorSearch('');
    setMinPrice('');
    setMaxPrice('');
    setMinDelivery('');
    setMaxDelivery('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <Spinner fullPage={true} />;

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">RFQ Specifications Missing</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">Could not fetch comparison details for this RFQ.</p>
        <button onClick={() => navigate('/rfqs')} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Back to RFQs</button>
      </div>
    );
  }

  const isClosed = rfq.status === 'closed';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/rfqs/${rfqId}`)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6D5DFC]">Procurement Matrix</p>
          <h1 className="text-3xl font-black text-slate-950 mt-1">Bid Comparison Screen</h1>
        </div>
      </div>

      {/* RFQ specs summary */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">{rfq.title}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">RFQ Ref: {rfq.rfq_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-black capitalize ${isClosed ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {rfq.status}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4 text-xs font-bold">
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Requested Qty</span>
            <span className="mt-1 block text-sm font-black text-slate-800 font-mono">{rfq.quantity} units</span>
          </div>
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Estimated Budget</span>
            <span className="mt-1 block text-sm font-black text-slate-800 font-mono">{formatCurrency(rfq.estimated_budget)}</span>
          </div>
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Bidding Deadline</span>
            <span className="mt-1 block text-sm font-black text-slate-800">{formatDate(rfq.deadline)}</span>
          </div>
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Total Received bids</span>
            <span className="mt-1 block text-sm font-black text-slate-800 font-mono">{quotations.length} bids</span>
          </div>
        </div>
      </div>

      {selection && (
        <div className="flex items-start gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
          <Award size={28} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-emerald-950">Winning Vendor Selected</h3>
            <p className="text-sm font-semibold text-emerald-700">
              The procurement officer selected the winning quotation on this RFQ.
            </p>
            <div className="mt-3 text-xs font-bold text-slate-600 space-y-1.5">
              <p>Selected By: <span className="text-slate-900">{selection.selected_by_name}</span></p>
              <p>Selection Reason: <span className="text-slate-900 font-medium italic">"{selection.selection_reason}"</span></p>
              <p>Selected At: <span className="text-slate-900">{formatDate(selection.selected_at)}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Filter size={16} /> Filters & Refinements
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Vendor search */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Search Vendor</label>
            <input
              type="text"
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="e.g. TechVision"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold outline-none transition focus:border-[#6D5DFC] focus:bg-white"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Total Price Range (₹)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#6D5DFC] focus:bg-white"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#6D5DFC] focus:bg-white"
              />
            </div>
          </div>

          {/* Delivery Range */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Delivery Range (Days)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minDelivery}
                onChange={(e) => setMinDelivery(e.target.value)}
                placeholder="Min"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#6D5DFC] focus:bg-white"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                value={maxDelivery}
                onChange={(e) => setMaxDelivery(e.target.value)}
                placeholder="Max"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#6D5DFC] focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      {sortedQuotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white p-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#6D5DFC] mb-5">
            <Info size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-950">No bids to compare</h3>
          <p className="mt-2 text-sm font-bold text-slate-500 max-w-md">
            There are no submitted bids matching the search parameters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('vendor')}>
                    <div className="flex items-center gap-1">
                      <span>Vendor</span> <ArrowUpDown size={14} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('price')}>
                    <div className="flex items-center gap-1">
                      <span>Unit Price</span> <ArrowUpDown size={14} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('price')}>
                    <div className="flex items-center gap-1">
                      <span>Total Price</span> <ArrowUpDown size={14} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('delivery')}>
                    <div className="flex items-center gap-1">
                      <span>Delivery Days</span> <ArrowUpDown size={14} className="text-slate-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Submitted Date</span> <ArrowUpDown size={14} className="text-slate-400" />
                    </div>
                  </th>
                  {!isClosed && !selection && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedQuotations.map((q) => {
                  const isSelected = q.status === 'selected';
                  const isRejected = q.status === 'rejected';

                  return (
                    <tr key={q.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-emerald-50/20' : ''}`}>
                      {/* Vendor name */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="block text-sm font-black text-slate-900">{q.vendor_name}</span>
                          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">{q.vendor_company} · {q.vendor_email}</span>
                          
                          {/* Badges block */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {q.is_lowest_price && (
                              <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                Lowest Price
                              </span>
                            )}
                            {q.is_fastest_delivery && (
                              <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
                                Fastest Delivery
                              </span>
                            )}
                            {q.is_best_value && (
                              <span className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-black text-[#6D5DFC]">
                                Best Value
                              </span>
                            )}
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                <Check size={10} /> Winning Bid
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">{formatCurrency(q.unit_price)}</td>

                      {/* Total Price */}
                      <td className="px-6 py-4 text-sm font-black text-slate-950 font-mono">
                        <span className={q.is_lowest_price ? 'text-emerald-700 font-black' : ''}>
                          {formatCurrency(q.total_price)}
                        </span>
                      </td>

                      {/* Delivery Days */}
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 text-sm font-bold ${q.is_fastest_delivery ? 'text-blue-700 font-black' : 'text-slate-700'}`}>
                          <Clock size={14} className="text-slate-400" />
                          <span>{q.delivery_days} days</span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4">
                        <p className="text-xs font-semibold text-slate-500 max-w-[200px] truncate" title={q.notes}>
                          {q.notes || '—'}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">{formatDate(q.submitted_at)}</td>

                      {/* Actions */}
                      {!isClosed && !selection && (
                        <td className="px-6 py-4 text-right">
                          {isRejected ? (
                            <span className="text-xs font-bold text-slate-400">Rejected</span>
                          ) : (
                            <button
                              onClick={() => handleOpenSelectionModal(q)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-4.5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-500/10 hover:from-[#5b4deb] hover:to-[#9946e6] transition-all"
                            >
                              Award Winner
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
            
            {/* Modal Title */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Select Winning Vendor</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Reference: {selectedQuote.quotation_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                You are selecting <strong className="text-slate-900 font-black">"{selectedQuote.vendor_name}"</strong> as the winning vendor for this RFQ.
              </p>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-xs space-y-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span className="text-slate-800 font-mono">{formatCurrency(selectedQuote.unit_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Contract Amount:</span>
                  <span className="text-slate-800 font-mono">{formatCurrency(selectedQuote.total_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Estimate:</span>
                  <span className="text-slate-800">{selectedQuote.delivery_days} calendar days</span>
                </div>
              </div>

              {/* Selection Reason input */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Selection Justification / Reason <span className="text-rose-500">*</span></label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) setModalError('');
                  }}
                  placeholder="Justify selection (e.g. Lowest overall bid matching tech specifications, or fastest delivery cycle requested by logistics...)"
                  rows={3}
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white resize-none ${modalError ? 'border-rose-500' : 'border-slate-200'}`}
                />
                {modalError && <p className="text-xs font-bold text-rose-600">{modalError}</p>}
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[11px] font-bold text-amber-800 leading-relaxed">
                ⚠️ Confirming this selection will automatically close the RFQ, update all alternative bids to "rejected", and launch the procurement approval workflow.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-500/20 hover:from-[#5b4deb] hover:to-[#9946e6] transition-all disabled:opacity-50"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

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

export default QuotationComparison;
