import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllQuotations } from '../../api/quotationApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

const QuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Searching states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected Quote for Details Modal
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchQuotationsList = async () => {
    setLoading(true);
    try {
      const response = await getAllQuotations();
      setQuotations(response.data || []);
    } catch (err) {
      console.error('Failed to load global quotations:', err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to fetch quotation records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationsList();
  }, []);

  // Format Date to DD MMM YYYY
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

  // Filter items client-side
  const filteredQuotes = quotations.filter((q) => {
    const rfqTitleMatch = q.rfq_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const vendorNameMatch = q.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatch = rfqTitleMatch || vendorNameMatch;

    const statusMatch = statusFilter === '' || q.status === statusFilter;

    return queryMatch && statusMatch;
  });

  const handleOpenDetails = (quote) => {
    setSelectedQuote(quote);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Vendor Quotations Registry</h1>
          <p className="text-sm text-slate-400">
            Monitor incoming bids, compare unit pricing options, and view delivery commitments across all RFQs.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm sm:grid-cols-2">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Search Bid</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by RFQ title or vendor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Bid Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">All Bid Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="selected">Selected (Winner)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Quotation Table Grid */}
      {loading ? (
        <Spinner fullPage={false} />
      ) : filteredQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white font-sans">No Quotations Found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            {quotations.length === 0 
              ? "There are no quotations submitted in the ERP yet." 
              : "No quotations match your filters. Try search keywords or choosing a different status."
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20 shadow-md">
          <table className="w-full border-collapse text-left text-sm text-slate-300 min-w-[900px]">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4">RFQ Title</th>
                <th scope="col" className="px-6 py-4">Vendor Name</th>
                <th scope="col" className="px-6 py-4">Unit Price</th>
                <th scope="col" className="px-6 py-4">Total Price</th>
                <th scope="col" className="px-6 py-4">Delivery</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-transparent">
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-900/40 transition">
                  {/* RFQ Title */}
                  <td className="px-6 py-4 font-semibold text-white">
                    <Link to={`/rfqs/${quote.rfq_id}`} className="hover:text-cyan-400 transition">
                      {quote.rfq_title}
                    </Link>
                  </td>
                  {/* Vendor Name */}
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-semibold text-slate-200 block">{quote.vendor_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">{quote.vendor_email}</span>
                    </div>
                  </td>
                  {/* Unit Price */}
                  <td className="px-6 py-4 font-mono text-white font-semibold">
                    ₹ {Number(quote.unit_price).toLocaleString('en-IN')}
                  </td>
                  {/* Total Price */}
                  <td className="px-6 py-4 font-mono text-slate-350 font-semibold">
                    ₹ {Number(quote.total_price).toLocaleString('en-IN')}
                  </td>
                  {/* Delivery Days */}
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {quote.delivery_days} days
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      quote.status === 'selected'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : quote.status === 'rejected'
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenDetails(quote)}
                        className="rounded bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        title="View Quotation Details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <Link
                        to={`/quotations/compare/${quote.rfq_id}`}
                        className="inline-flex items-center rounded-lg bg-indigo-600/15 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                        title="Compare bids side-by-side"
                      >
                        Compare
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details View Modal */}
      {showModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Quotation Specifications</h3>
                <p className="text-xs text-slate-500">Ref ID: QTE-{String(selectedQuote.id).padStart(4, '0')}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedQuote(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="space-y-4 text-sm">
              {/* RFQ Header Block */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Linked Request (RFQ)</span>
                <Link 
                  to={`/rfqs/${selectedQuote.rfq_id}`} 
                  onClick={() => setShowModal(false)}
                  className="mt-1 block text-base font-bold text-cyan-400 hover:underline"
                >
                  {selectedQuote.rfq_title}
                </Link>
                <div className="grid grid-cols-2 gap-4 mt-2 text-xs font-medium text-slate-400">
                  <div>Required: <span className="text-white">{selectedQuote.quantity} units</span></div>
                  <div>Bid Deadline: <span className="text-white">{formatDate(selectedQuote.rfq_deadline)}</span></div>
                </div>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-2 gap-4">
                {/* Vendor Details */}
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Details</span>
                  <span className="mt-1 block font-bold text-white text-base">{selectedQuote.vendor_name}</span>
                  <span className="block text-xs text-slate-400 font-mono truncate select-all">{selectedQuote.vendor_email}</span>
                </div>
                {/* Status Indicator */}
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Bid Status</span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mt-1.5 ${
                    selectedQuote.status === 'selected'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : selectedQuote.status === 'rejected'
                      ? 'bg-slate-800 text-slate-500 border-slate-700'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {selectedQuote.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-850 my-2 pt-2"></div>

              {/* Price Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900/10 p-3 rounded-lg border border-slate-850">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Pricing</span>
                  <span className="mt-1 block font-mono font-bold text-white text-base">₹ {Number(selectedQuote.unit_price).toLocaleString('en-IN')}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Per Unit Quantity</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contract Value</span>
                  <span className="mt-1 block font-mono font-bold text-emerald-400 text-base">₹ {Number(selectedQuote.total_price).toLocaleString('en-IN')}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Total for {selectedQuote.quantity} units</span>
                </div>
              </div>

              {/* Delivery Speed */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Timeframe</span>
                  <span className="mt-1 block font-bold text-white">{selectedQuote.delivery_days} calendar days</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Bidding Date</span>
                  <span className="mt-1 block font-bold text-slate-350 font-mono text-xs">{formatDate(selectedQuote.submitted_at)}</span>
                </div>
              </div>

              {/* Bidding Notes */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Bidding Remarks</span>
                <div className="mt-1.5 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 italic min-h-[60px] whitespace-pre-wrap">
                  {selectedQuote.notes || "No special notes or remarks provided by the supplier."}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-850 pt-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedQuote(null);
                }}
                className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-350 hover:bg-slate-800 hover:text-white transition"
              >
                Close View
              </button>
              <Link
                to={`/quotations/compare/${selectedQuote.rfq_id}`}
                onClick={() => {
                  setShowModal(false);
                  setSelectedQuote(null);
                }}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition shadow-md shadow-indigo-600/10"
              >
                Go to Comparison Matrix
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationList;
