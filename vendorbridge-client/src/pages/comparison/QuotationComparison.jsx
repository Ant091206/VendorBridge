import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Info, 
  Clock, 
  Check, 
  Award, 
  ShieldAlert, 
  ArrowUpDown, 
  Filter, 
  X, 
  History, 
  TrendingDown, 
  Zap, 
  User, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  getComparison, 
  logComparison, 
  recommendQuotation, 
  updateSelectionStatus, 
  getComparisonHistory 
} from '../../api/comparisonApi';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const QuotationComparison = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core comparison states
  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selection, setSelection] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tab State: 'compare' | 'history'
  const [activeTab, setActiveTab] = useState('compare');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filtering states
  const [quoteStatus, setQuoteStatus] = useState('');
  const [vendorStatus, setVendorStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minDelivery, setMinDelivery] = useState('');
  const [maxDelivery, setMaxDelivery] = useState('');

  // Sorting state
  // Supported sorts: price_asc, price_desc, delivery_asc, delivery_desc, date_desc, date_asc, vendor_name
  const [sortBy, setSortBy] = useState('price_asc');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Recommendation Modal states
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [reasonOption, setReasonOption] = useState('Lowest Cost');
  const [customReason, setCustomReason] = useState('');
  const [modalError, setModalError] = useState('');

  // Toast notification
  const [toast, setToast] = useState({ message: '', type: '' });

  // Role Checks
  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isManager = user?.role === 'manager';
  const isVendor = user?.role === 'vendor';
  const canManage = isAdmin || isOfficer;

  // 1. Fetch Comparison Data (with filters, sorting, pagination)
  const fetchComparisonData = async (shouldLog = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        status: quoteStatus || undefined,
        vendor_status: vendorStatus || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        min_delivery: minDelivery || undefined,
        max_delivery: maxDelivery || undefined,
        sort: sortBy
      };

      const response = await getComparison(rfqId, params);
      setRfq(response.data.rfq);
      setQuotations(response.data.quotations || []);
      setSelection(response.data.selection || null);
      setEligible(response.data.eligible);
      setEligibilityMessage(response.data.message || '');
      setTotalQuotes(response.data.total_quotes_count);
      setTotalPages(response.data.pagination?.total_pages || 1);

      // Log comparison view for admins/officers once on initial load
      if (shouldLog && (isAdmin || isOfficer)) {
        logComparison(rfqId).catch((err) => console.error('Failed to log comparison view event:', err));
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to load comparison records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Comparison Audit History
  const fetchHistoryData = async () => {
    setLoadingHistory(true);
    try {
      const response = await getComparisonHistory(rfqId);
      setHistory(response.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to load comparison audit history.', type: 'error' });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Triggers reload when page/filters/sorting change
  useEffect(() => {
    if (isVendor) return; // Block vendor checks
    fetchComparisonData(false);
  }, [page, sortBy, quoteStatus, vendorStatus]);

  // Initial load
  useEffect(() => {
    if (isVendor) return;
    fetchComparisonData(true);
  }, [rfqId]);

  // Load history when tab is clicked
  useEffect(() => {
    if (activeTab === 'history' && !isVendor) {
      fetchHistoryData();
    }
  }, [activeTab]);

  // Handle Search/Filter Submit
  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComparisonData(false);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setQuoteStatus('');
    setVendorStatus('');
    setMinPrice('');
    setMaxPrice('');
    setMinDelivery('');
    setMaxDelivery('');
    setPage(1);
    // Explicitly refetch
    setTimeout(() => fetchComparisonData(false), 50);
  };

  // Open Award winner modal
  const handleOpenRecommendModal = (quote) => {
    setSelectedQuote(quote);
    setReasonOption('Lowest Cost');
    setCustomReason('');
    setModalError('');
    setShowRecommendModal(true);
  };

  // Confirm and Recommend Vendor
  const handleConfirmRecommendation = async () => {
    let finalReason = reasonOption;
    if (reasonOption === 'Custom Reason') {
      if (!customReason.trim()) {
        setModalError('Custom reason is required.');
        return;
      }
      finalReason = customReason.trim();
    }

    setSubmitting(true);
    try {
      await recommendQuotation(rfqId, selectedQuote.id, finalReason);
      setToast({ message: `Vendor "${selectedQuote.vendor_name}" recommended successfully.`, type: 'success' });
      setShowRecommendModal(false);
      fetchComparisonData(false);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to recommend vendor.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Change Selection status (e.g. Recommended -> SentForApproval)
  const handleSendForApproval = async () => {
    if (!selection) return;
    setSubmitting(true);
    try {
      await updateSelectionStatus(selection.id, 'SentForApproval');
      setToast({ message: 'Quotation recommendation sent for approval successfully.', type: 'success' });
      fetchComparisonData(false);
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to update selection status.', type: 'error' });
    } finally {
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
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle unauthorized view
  if (isVendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">Vendors are not permitted to view quotation comparison or selection records.</p>
        <button onClick={() => navigate('/quotations/vendor')} className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">Go to My Quotations</button>
      </div>
    );
  }

  if (loading && !rfq) return <Spinner fullPage={true} />;

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white border border-slate-200 rounded-[24px] shadow-sm">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h2 className="text-xl font-black text-slate-900 mb-2">RFQ Details Missing</h2>
        <p className="text-sm font-semibold text-slate-500 mb-6">Could not fetch comparison details for this RFQ.</p>
        <button onClick={() => navigate('/rfqs')} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">Back to RFQs</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast popup */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {submitting && <Spinner fullPage={true} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/rfqs/${rfqId}`)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#22C55E]">Procurement Matrix</p>
            <h1 className="text-2xl font-black text-slate-950 mt-0.5">Quotation Comparison & Selection</h1>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'compare'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase size={14} />
            <span>Comparison Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={14} />
            <span>Selection History</span>
          </button>
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
            <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-black capitalize ${
              rfq.status === 'closed'
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {rfq.status}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-xs font-bold">
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Bidding Deadline</span>
            <span className="mt-1 block text-sm font-black text-slate-800">{formatDate(rfq.submission_deadline)}</span>
          </div>
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Total Received bids</span>
            <span className="mt-1 block text-sm font-black text-slate-800 font-mono">{totalQuotes} bids submitted</span>
          </div>
          <div>
            <span className="block text-slate-400 uppercase tracking-wider">Eligibility Status</span>
            <span className={`mt-1 inline-flex items-center gap-1 text-sm font-black ${eligible ? 'text-emerald-600' : 'text-amber-600'}`}>
              {eligible ? 'Eligible for Selection' : 'Selection Blocked'}
            </span>
          </div>
        </div>
      </div>

      {/* Warnings & Active Selection recommendation blocks */}
      {!eligible && (
        <div className="flex items-start gap-3.5 rounded-[24px] border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-black text-amber-950">Quotation Comparison Ineligible</h4>
            <p className="text-xs font-semibold text-amber-800 mt-1 leading-relaxed">
              {eligibilityMessage || 'RFQ must have at least 2 submitted quotations to participate in comparison.'}
            </p>
          </div>
        </div>
      )}

      {selection && activeTab === 'compare' && (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm shrink-0">
              <Award size={24} />
            </div>
            <div className="space-y-1 grow">
              <h3 className="text-base font-black text-emerald-950">Winning Vendor Selection Recommendation</h3>
              <p className="text-xs font-semibold text-emerald-700 leading-relaxed">
                This RFQ has an active vendor recommendation awaiting approval decision.
              </p>
            </div>
            
            {/* Action flow for recommendation status */}
            {canManage && selection.status === 'Recommended' && (
              <button
                onClick={handleSendForApproval}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white px-5 py-2.5 shadow-md shadow-emerald-500/10 transition"
              >
                Send for Approval
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-4 border-t border-emerald-100 pt-4 text-xs font-bold text-slate-600">
            <div>
              <span className="block text-slate-400 uppercase tracking-wider">Recommended Vendor</span>
              <span className="mt-1 block text-slate-900 font-black">{selection.vendor_name}</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase tracking-wider">Bid Amount (Grand Total)</span>
              <span className="mt-1 block text-slate-900 font-mono font-black">{formatCurrency(selection.grand_total)}</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase tracking-wider">Delivery Commitment</span>
              <span className="mt-1 block text-slate-900">{selection.delivery_days} calendar days</span>
            </div>
            <div>
              <span className="block text-slate-400 uppercase tracking-wider">Current Selection Status</span>
              <span className={`mt-1 inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase ${
                selection.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : selection.status === 'Rejected'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : selection.status === 'SentForApproval'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {selection.status}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-100 p-4 text-xs">
            <span className="block font-bold text-slate-400 uppercase tracking-wider">Recommendation Justification / Reason</span>
            <p className="mt-1.5 text-slate-700 font-semibold italic">"{selection.selection_reason}"</p>
            <div className="mt-3 border-t border-slate-100 pt-2 flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>Selected By: {selection.selected_by_name}</span>
              <span>Selection Date: {formatDate(selection.selection_date)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Area */}
      {activeTab === 'compare' ? (
        <div className="space-y-6">
          {/* Filters card */}
          {eligible && (
            <form onSubmit={handleApplyFilters} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Filter size={16} /> Filter & Search Bids
              </h3>
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4">
                {/* Quotation Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Quotation Status</label>
                  <select
                    value={quoteStatus}
                    onChange={(e) => setQuoteStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold outline-none transition focus:border-[#22C55E] focus:bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Vendor Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Vendor Status</label>
                  <select
                    value={vendorStatus}
                    onChange={(e) => setVendorStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold outline-none transition focus:border-[#22C55E] focus:bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                </div>

                {/* Price limits */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Price Range (₹)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#22C55E] focus:bg-white"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#22C55E] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Delivery limits */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Delivery Range (Days)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minDelivery}
                      onChange={(e) => setMinDelivery(e.target.value)}
                      placeholder="Min"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#22C55E] focus:bg-white"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="number"
                      value={maxDelivery}
                      onChange={(e) => setMaxDelivery(e.target.value)}
                      placeholder="Max"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-[#22C55E] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                {/* Sorting options */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none transition focus:border-[#22C55E] focus:bg-white"
                  >
                    <option value="price_asc">Price (Lowest to Highest)</option>
                    <option value="price_desc">Price (Highest to Lowest)</option>
                    <option value="delivery_asc">Delivery (Fastest first)</option>
                    <option value="delivery_desc">Delivery (Slowest first)</option>
                    <option value="date_desc">Submission (Latest first)</option>
                    <option value="date_asc">Submission (Oldest first)</option>
                    <option value="vendor_name">Vendor Name (A-Z)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Matrix table */}
          {quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white p-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E] mb-5">
                <Info size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-950">No Quotations Found</h3>
              <p className="mt-2 text-sm font-bold text-slate-500 max-w-md">
                There are no submitted vendor quotations that match the active filters or this RFQ.
              </p>
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left border-collapse">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Vendor Particulars</th>
                      <th className="px-6 py-4">Quotation Number</th>
                      <th className="px-6 py-4">Financials (INR)</th>
                      <th className="px-6 py-4">Tax / Discounts</th>
                      <th className="px-6 py-4">Delivery Estimate</th>
                      <th className="px-6 py-4">Submission Details</th>
                      <th className="px-6 py-4">Status</th>
                      {canManage && !selection && <th className="px-6 py-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {quotations.map((q) => {
                      const isWinner = q.quotation_status === 'selected';
                      const isRejected = q.quotation_status === 'rejected';

                      // Highlights
                      let highlightClass = '';
                      if (q.is_lowest_price && q.is_fastest_delivery) {
                        highlightClass = 'bg-gradient-to-r from-emerald-50/10 to-blue-50/10';
                      } else if (q.is_lowest_price) {
                        highlightClass = 'bg-emerald-50/20';
                      } else if (q.is_fastest_delivery) {
                        highlightClass = 'bg-blue-50/20';
                      }

                      if (isWinner) {
                        highlightClass = 'bg-emerald-50/45';
                      }

                      return (
                        <tr key={q.id} className={`hover:bg-slate-50/70 transition-colors ${highlightClass}`}>
                          {/* Vendor Particulars */}
                          <td className="px-6 py-4">
                            <div>
                              <span className="block text-sm font-black text-slate-900">{q.vendor_name}</span>
                              <span className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                q.vendor_status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : q.vendor_status === 'blacklisted'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-100'
                              }`}>
                                Vendor Status: {q.vendor_status}
                              </span>
                              
                              {/* Future Rating/Performance score placeholders */}
                              <div className="flex gap-2 mt-1.5 text-[9px] font-bold text-slate-400">
                                <span>Rating: —</span>
                                <span>Performance Score: —</span>
                              </div>
                            </div>
                          </td>

                          {/* Quotation Number */}
                          <td className="px-6 py-4 font-mono font-bold text-slate-600 text-sm">
                            {q.quotation_number}
                          </td>

                          {/* Grand Total */}
                          <td className="px-6 py-4">
                            <div>
                              <span className="block text-sm font-black text-slate-900 font-mono">
                                {formatCurrency(q.grand_total)}
                              </span>
                              
                              {/* Highlights badges */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {q.is_lowest_price && (
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 uppercase tracking-wider">
                                    <TrendingDown size={10} /> Lowest Price
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Tax and Discount amount */}
                          <td className="px-6 py-4 font-semibold text-slate-500 font-mono space-y-1">
                            <p>Tax: {formatCurrency(q.tax_amount)}</p>
                            <p>Discount: {formatCurrency(q.discount_amount)}</p>
                          </td>

                          {/* Delivery days */}
                          <td className="px-6 py-4">
                            <div>
                              <span className="inline-flex items-center gap-1 text-slate-800 text-sm font-bold">
                                <Clock size={12} className="text-slate-400" />
                                {q.delivery_days} Days
                              </span>
                              <div className="mt-1">
                                {q.is_fastest_delivery && (
                                  <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-black text-blue-800 uppercase tracking-wider">
                                    <Zap size={10} /> Fastest Delivery
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Submission details */}
                          <td className="px-6 py-4 font-semibold text-slate-500">
                            {formatDate(q.submission_date || q.created_at)}
                          </td>

                          {/* Quotation status badge */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isWinner
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : isRejected
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {q.quotation_status}
                            </span>
                          </td>

                          {/* Action columns */}
                          {canManage && !selection && (
                            <td className="px-6 py-4 text-right">
                              {eligible && (
                                <button
                                  onClick={() => handleOpenRecommendModal(q)}
                                  className="rounded-xl bg-slate-900 text-white px-3.5 py-2 font-bold hover:bg-slate-800 transition"
                                >
                                  Recommend
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

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center border-t border-slate-100 bg-slate-50 px-6 py-4 font-bold text-xs">
                  <span className="text-slate-500">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* History tab content */
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <History size={20} className="text-slate-500" /> Comparison & Selection Logs
          </h3>

          {loadingHistory ? (
            <div className="py-12 flex justify-center">
              <Spinner size={32} />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-semibold">
              No comparison audit logs recorded yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 pl-6 space-y-6 ml-3">
              {history.map((h, i) => (
                <div key={i} className="relative">
                  {/* Timeline icon dot */}
                  <span className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                    h.type === 'vendor_selected'
                      ? 'border-emerald-500 text-emerald-500'
                      : 'border-slate-400 text-slate-400'
                  }`} />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-900 font-sans">
                        {h.type === 'vendor_selected' ? 'Vendor Recommended' : 'Quotation Matrix Viewed'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {formatDate(h.event_date)}
                      </span>
                    </div>
                    
                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      <span>{h.user_name} ({h.user_role})</span>
                    </p>

                    {h.details && (
                      <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-3 max-w-lg text-xs">
                        <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Remarks / Justification</span>
                        <p className="text-slate-700 italic">"{h.details}"</p>
                        {h.status && (
                          <div className="mt-2 text-[9px] font-bold flex items-center gap-1">
                            <span className="text-slate-400 uppercase">Status:</span>
                            <span className="text-[#22C55E]">{h.status}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Award winner recommendation modal */}
      {showRecommendModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Recommend Winning Bid</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Reference Quote: {selectedQuote.quotation_number}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                You are recommending <strong className="text-slate-900 font-black">"{selectedQuote.vendor_name}"</strong> as the winning vendor for this RFQ contract.
              </p>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-xs space-y-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Vendor Name:</span>
                  <span className="text-slate-800">{selectedQuote.vendor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grand Total:</span>
                  <span className="text-slate-800 font-mono">{formatCurrency(selectedQuote.grand_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Estimate:</span>
                  <span className="text-slate-800">{selectedQuote.delivery_days} calendar days</span>
                </div>
              </div>

              {/* Justification selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Selection Justification / Remarks <span className="text-rose-500">*</span></label>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Lowest Cost',
                    'Best Delivery Time',
                    'Existing Vendor Relationship',
                    'Best Commercial Terms',
                    'Custom Reason'
                  ].map((option) => (
                    <label key={option} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition text-xs font-semibold">
                      <input
                        type="radio"
                        name="reasonOption"
                        checked={reasonOption === option}
                        onChange={() => {
                          setReasonOption(option);
                          setModalError('');
                        }}
                        className="text-[#22C55E] focus:ring-[#22C55E]"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {reasonOption === 'Custom Reason' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      if (e.target.value.trim()) setModalError('');
                    }}
                    placeholder="Enter custom justification remarks..."
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#22C55E] focus:bg-white resize-none"
                  />
                )}
                
                {modalError && <p className="text-xs font-bold text-rose-600">{modalError}</p>}
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[11px] font-bold text-amber-800 leading-relaxed">
                ⚠️ Recommending this bid will flag the quotation as "selected" in comparison and lock the selection. PO is not automatically created. Selection must undergo approvals workflow.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowRecommendModal(false)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRecommendation}
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-green-500/20 hover:from-[#16A34A] hover:to-[#9946e6] transition-all disabled:opacity-50"
              >
                Confirm Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationComparison;
