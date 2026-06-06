import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getRFQById } from '../../api/rfqApi';
import { getQuotationsByRFQ, selectQuotation } from '../../api/quotationApi';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import ConfirmModal from '../../components/ConfirmModal';
import Toast from '../../components/Toast';

const QuotationComparison = () => {
  const { rfq_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Specs states
  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stats summary variables
  const [lowestPrice, setLowestPrice] = useState(0);
  const [lowestPriceVendor, setLowestPriceVendor] = useState('N/A');
  const [fastestDelivery, setFastestDelivery] = useState(0);
  const [fastestDeliveryVendor, setFastestDeliveryVendor] = useState('N/A');

  // Sorting and selection states
  const [sortBy, setSortBy] = useState('price_asc');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const isOfficer = user?.role === 'officer';

  const loadComparisonData = async () => {
    try {
      const [rfqRes, quotesRes] = await Promise.all([
        getRFQById(rfq_id),
        getQuotationsByRFQ(rfq_id)
      ]);

      setRfq(rfqRes.data);
      
      const quotesList = quotesRes.data || [];
      setQuotations(quotesList);

      // Compute statistics client side
      if (quotesList.length > 0) {
        // Lowest price
        const minPrice = quotesRes.lowest_price || Math.min(...quotesList.map(q => Number(q.unit_price)));
        setLowestPrice(minPrice);
        const lowQuote = quotesList.find(q => Number(q.unit_price) === minPrice);
        setLowestPriceVendor(lowQuote ? lowQuote.vendor_name : 'N/A');

        // Fastest delivery
        const minDays = quotesRes.fastest_delivery || Math.min(...quotesList.map(q => Number(q.delivery_days)));
        setFastestDelivery(minDays);
        const fastQuote = quotesList.find(q => Number(q.delivery_days) === minDays);
        setFastestDeliveryVendor(fastQuote ? fastQuote.vendor_name : 'N/A');
      } else {
        setLowestPrice(0);
        setLowestPriceVendor('N/A');
        setFastestDelivery(0);
        setFastestDeliveryVendor('N/A');
      }

    } catch (err) {
      console.error('Failed to load comparison data:', err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to fetch comparison records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, [rfq_id]);

  // Handle Quotation Selection Triggers
  const handleSelectTrigger = (quoteItem) => {
    setSelectedQuote(quoteItem);
    setShowConfirm(true);
  };

  const handleSelectConfirm = async () => {
    setShowConfirm(false);
    setProcessing(true);
    try {
      await selectQuotation(selectedQuote.id);
      setToastType('success');
      setToastMessage(`Vendor ${selectedQuote.vendor_name} has been selected! Winning notifications sent via email.`);
      
      // Reload page details to update status
      loadComparisonData();
    } catch (err) {
      console.error('Failed to select vendor quote:', err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to process vendor selection.');
    } finally {
      setProcessing(false);
    }
  };

  // Client side sorting logic
  const getSortedQuotations = () => {
    const sorted = [...quotations];
    if (sortBy === 'price_asc') {
      return sorted.sort((a, b) => Number(a.unit_price) - Number(b.unit_price));
    } else if (sortBy === 'price_desc') {
      return sorted.sort((a, b) => Number(b.unit_price) - Number(a.unit_price));
    } else if (sortBy === 'delivery_asc') {
      return sorted.sort((a, b) => Number(a.delivery_days) - Number(b.delivery_days));
    }
    return sorted;
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

  if (loading) {
    return <Spinner fullPage={true} />;
  }

  if (!rfq) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-4">RFQ specifications not found</h2>
        <button
          onClick={() => navigate('/rfqs')}
          className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-350 hover:text-white"
        >
          Back to RFQs
        </button>
      </div>
    );
  }

  const sortedQuotes = getSortedQuotations();
  const isRFQOpen = rfq.status === 'open';
  const hasWinnerSelected = quotations.some(q => q.status === 'selected');

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Select Confirm Modal */}
      {showConfirm && selectedQuote && (
        <ConfirmModal
          message={`Are you sure you want to select ${selectedQuote.vendor_name} for ₹ ${Number(selectedQuote.total_price).toLocaleString('en-IN')}? This will automatically reject all other submissions and close the RFQ.`}
          onConfirm={handleSelectConfirm}
          onCancel={() => setShowConfirm(null)}
        />
      )}

      {processing && <Spinner fullPage={true} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/rfqs/${rfq.id}`)}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Back to RFQ Detail"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Bids Comparison Matrix</h1>
          <p className="text-sm text-slate-400 font-medium">Compare supplier quotations side-by-side to select the ideal contract vendor.</p>
        </div>
      </div>

      {/* Top Section — RFQ Summary Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-0.5">Specifications File</span>
            <h2 className="text-base font-bold text-white">{rfq.title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              rfq.status === 'open'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : rfq.status === 'draft'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              {rfq.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Required Quantity</span>
            <span className="mt-1 block font-bold text-white font-mono text-sm">{rfq.quantity} units</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Bidding Deadline</span>
            <span className="mt-1 block font-bold text-slate-350 text-sm">{formatDate(rfq.deadline)}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Invitations Issued</span>
            <span className="mt-1 block font-bold text-slate-350 text-sm font-mono">RFQ-{String(rfq.id).padStart(4, '0')}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500 uppercase tracking-wider">Quotations Received</span>
            <span className="mt-1 block font-bold text-cyan-400 text-sm font-mono">{quotations.length} quotes</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {quotations.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          
          {/* lowest price card */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Lowest Price Quote</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-white font-mono">
                ₹ {lowestPrice.toLocaleString('en-IN')}
              </span>
              <span className="block text-[11px] font-semibold text-emerald-400 truncate mt-1">
                by {lowestPriceVendor}
              </span>
            </div>
          </div>

          {/* fastest delivery card */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">Fastest Delivery Time</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-white font-mono">
                {fastestDelivery} days
              </span>
              <span className="block text-[11px] font-semibold text-cyan-400 truncate mt-1">
                by {fastestDeliveryVendor}
              </span>
            </div>
          </div>

          {/* total bids count */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Bidders</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-white font-mono">
                {quotations.length}
              </span>
              <span className="block text-[11px] font-medium text-slate-400 mt-1">
                Suppliers submitted bids
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Bids Main list Table */}
      {quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-white">No Quotations Received Yet</h4>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            We haven't received any quotes for this RFQ from invited suppliers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Sorting controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/20 border border-slate-850 p-4 rounded-xl">
            <span className="text-xs font-semibold text-slate-400">Order by specifications:</span>
            <div className="flex gap-2 text-xs font-semibold">
              <button
                onClick={() => setSortBy('price_asc')}
                className={`rounded px-3 py-1.5 transition ${
                  sortBy === 'price_asc'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/15'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Price (Low to High)
              </button>
              <button
                onClick={() => setSortBy('price_desc')}
                className={`rounded px-3 py-1.5 transition ${
                  sortBy === 'price_desc'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/15'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Price (High to Low)
              </button>
              <button
                onClick={() => setSortBy('delivery_asc')}
                className={`rounded px-3 py-1.5 transition ${
                  sortBy === 'delivery_asc'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/15'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Delivery (Fastest first)
              </button>
            </div>
          </div>

          {/* Matrix table (responsive, horizontally scrollable on mobile) */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20 shadow-md">
            <table className="w-full border-collapse text-left text-sm text-slate-300 min-w-[800px]">
              <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Vendor Name</th>
                  <th scope="col" className="px-6 py-4">Unit Price</th>
                  <th scope="col" className="px-6 py-4">Total Price</th>
                  <th scope="col" className="px-6 py-4">Delivery Time</th>
                  <th scope="col" className="px-6 py-4 max-w-[200px]">Bidding Notes</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {sortedQuotes.map((q) => {
                  const isLowest = Number(q.unit_price) === lowestPrice;
                  const isFastest = Number(q.delivery_days) === fastestDelivery;
                  const isWinner = q.status === 'selected';
                  const isRejected = q.status === 'rejected';

                  // Row highlight priority checks (green takes priority over blue if same vendor has both)
                  let rowHighlight = 'border-l-4 border-transparent';
                  if (isLowest) {
                    rowHighlight = 'border-l-4 border-emerald-500 bg-emerald-500/5';
                  } else if (isFastest) {
                    rowHighlight = 'border-l-4 border-cyan-500 bg-cyan-500/5';
                  }

                  return (
                    <tr key={q.id} className={`hover:bg-slate-900/30 transition ${rowHighlight}`}>
                      
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-white block">{q.vendor_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono block mt-0.5 select-all">{q.vendor_email}</span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="px-6 py-4 font-semibold text-white font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>₹ {Number(q.unit_price).toLocaleString('en-IN')}</span>
                          {isLowest && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                              Lowest ✓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="px-6 py-4 text-slate-300 font-semibold font-mono">
                        ₹ {Number(q.total_price).toLocaleString('en-IN')}
                      </td>

                      {/* Delivery Days */}
                      <td className="px-6 py-4 font-semibold text-slate-350">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{q.delivery_days} days</span>
                          {isFastest && (
                            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/25">
                              Fastest ✓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={q.notes || ''}>
                        {q.notes || '-'}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isWinner
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isRejected
                            ? 'bg-slate-800 text-slate-500 border-slate-700'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isWinner ? 'Selected' : isRejected ? 'Rejected' : 'Pending'}
                        </span>
                      </td>

                      {/* Action columns */}
                      <td className="px-6 py-4 text-right">
                        {isOfficer && isRFQOpen && !hasWinnerSelected ? (
                          <button
                            onClick={() => handleSelectTrigger(q)}
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-md shadow-indigo-600/10"
                          >
                            Select Vendor
                          </button>
                        ) : isWinner ? (
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3">Winner Selected</span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 select-none px-3">-</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

export default QuotationComparison;
