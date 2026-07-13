import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, FileText, Calendar, DollarSign, Clock, Download, Award, XCircle, CheckCircle, HelpCircle, ShieldAlert, X } from 'lucide-react';
import { getAllQuotations, getQuotationById } from '../../api/quotationApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

const statusBadgeColors = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-green-50 text-[#22C55E] border-green-200/50',
  withdrawn: 'bg-rose-50 text-rose-600 border-rose-200',
  expired: 'bg-orange-50 text-orange-600 border-orange-200',
  selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-slate-50 text-slate-400 border-slate-250'
};

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  selected: 'Selected',
  rejected: 'Not Selected'
};

const QuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Searching states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected Quote details modal states
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
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
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getFileUrl = (filePath) => {
    const host = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${host}${filePath}`;
  };

  const handleOpenDetails = async (quote) => {
    setModalLoading(true);
    setShowModal(true);
    try {
      const res = await getQuotationById(quote.id);
      setSelectedQuote(res.data);
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to fetch quotation details.');
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedQuote(null);
  };

  // Filter items client-side
  const filteredQuotes = quotations.filter((q) => {
    const rfqTitleMatch = q.rfq_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const vendorNameMatch = q.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const quoteNumMatch = q.quotation_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const rfqNumMatch = q.rfq_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatch = rfqTitleMatch || vendorNameMatch || quoteNumMatch || rfqNumMatch;

    const statusMatch = statusFilter === '' || q.status === statusFilter;

    return queryMatch && statusMatch;
  });

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
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Registry</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 font-sans">Vendor Quotations</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Monitor incoming bids, compare unit pricing options, and view delivery commitments across all RFQs.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-premium sm:grid-cols-2">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Search Bid</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by quote, RFQ, or supplier name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Bid Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="premium-input pr-10 cursor-pointer"
          >
            <option value="">All Bid Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="expired">Expired</option>
            <option value="selected">Selected (Winner)</option>
            <option value="rejected">Not Selected</option>
          </select>
        </div>
      </div>

      {/* Main Quotation Table Grid */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />
      ) : filteredQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-premium">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-black text-slate-900 font-sans">No Quotations Found</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500 max-w-sm">
            {quotations.length === 0 
              ? "There are no quotations submitted in the ERP yet." 
              : "No quotations match your filters. Try search keywords or choosing a different status."
            }
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600 min-w-[950px]">
              <thead className="bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/60 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-4">Quotation Number</th>
                  <th scope="col" className="px-6 py-4">RFQ Title</th>
                  <th scope="col" className="px-6 py-4">Vendor Name</th>
                  <th scope="col" className="px-6 py-4 text-center">Items</th>
                  <th scope="col" className="px-6 py-4 text-right">Grand Total</th>
                  <th scope="col" className="px-6 py-4">Delivery</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent font-semibold">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="px-6 py-4 text-sm font-black text-primary">
                      {quote.quotation_number}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-950">
                      <Link to={`/rfqs/${quote.rfq_id}`} className="text-primary hover:text-primary-hover transition">
                        {quote.rfq_title}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{quote.rfq_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{quote.vendor_name}</span>
                        <span className="text-[11px] text-slate-500 font-bold block mt-0.5">{quote.vendor_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-slate-700">{quote.items_count || 1}</td>
                    <td className="px-6 py-4 font-black text-slate-900 text-right font-mono">
                      {formatCurrency(quote.grand_total, quote.currency)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">
                      {quote.delivery_days} days
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        statusBadgeColors[quote.status] || ''
                      }`}>
                        {statusLabels[quote.status] || quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(quote)}
                          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:text-primary hover:border-primary/20 transition cursor-pointer"
                          title="View Quotation Details"
                        >
                          <Eye size={16} />
                        </button>

                        <Link
                          to={`/quotations/compare/${quote.rfq_id}`}
                          className="inline-flex items-center rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white transition"
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
        </div>
      )}

      {/* Details View Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-premium-lg space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-950">Quotation Specifications</h3>
                {selectedQuote && (
                  <p className="text-xs font-bold text-slate-400 mt-1">Number: {selectedQuote.quotation_number}</p>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex justify-center items-center h-60">
                <Spinner fullPage={false} />
              </div>
            ) : selectedQuote ? (
              <div className="space-y-5 text-sm font-semibold">
                {/* RFQ Header Block */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Linked Request (RFQ)</span>
                  <Link 
                    to={`/rfqs/${selectedQuote.rfq_id}`} 
                    onClick={handleCloseModal}
                    className="mt-1 block text-base font-black text-primary hover:underline"
                  >
                    {selectedQuote.rfq_title}
                  </Link>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-xs font-bold text-slate-500">
                    <div>RFQ Number: <span className="text-slate-950">{selectedQuote.rfq_number}</span></div>
                    <div>Bid Deadline: <span className="text-slate-950">{formatDate(selectedQuote.rfq_deadline)}</span></div>
                  </div>
                </div>

                {/* Vendor & Status Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-black text-slate-400 uppercase tracking-wider">Supplier Profile</span>
                    <span className="mt-1 block font-black text-slate-900 text-base leading-tight">{selectedQuote.vendor_name}</span>
                    <span className="block text-[11px] text-slate-400 font-bold font-mono mt-0.5">{selectedQuote.vendor_code}</span>
                    <span className="block text-xs text-slate-500 font-bold truncate mt-1">{selectedQuote.vendor_email}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Bid Status</span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                      statusBadgeColors[selectedQuote.status] || ''
                    }`}>
                      {statusLabels[selectedQuote.status] || selectedQuote.status}
                    </span>
                  </div>
                </div>

                {/* Items Quoted */}
                <div className="border-t border-slate-100 pt-4">
                  <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Items Response Breakdown</span>
                  <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-150 text-slate-500 font-black uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Item</th>
                          <th className="p-3 text-right">Unit Rate</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3 text-right">Tax</th>
                          <th className="p-3 text-right">Disc</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuote.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-bold text-slate-800">{item.item_name}</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(item.unit_price, selectedQuote.currency)}</td>
                            <td className="p-3 text-right font-mono">{item.quantity}</td>
                            <td className="p-3 text-slate-500">{item.unit}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{item.tax_percentage}%</td>
                            <td className="p-3 text-right font-mono text-slate-500">{item.discount_percentage}%</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-800">{formatCurrency(item.total_amount, selectedQuote.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total breakdowns */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(selectedQuote.subtotal, selectedQuote.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount (-):</span>
                      <span className="font-mono font-bold text-rose-600">{formatCurrency(selectedQuote.discount_amount, selectedQuote.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (+):</span>
                      <span className="font-mono font-bold text-emerald-600">{formatCurrency(selectedQuote.tax_amount, selectedQuote.currency)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-end border-l border-slate-200/60 pl-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Contract Total</span>
                    <span className="text-xl font-black text-primary font-mono mt-1">{formatCurrency(selectedQuote.grand_total, selectedQuote.currency)}</span>
                  </div>
                </div>

                {/* Delivery and logistics remarks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-black text-slate-400 uppercase tracking-wider">Estimated Delivery Speed</span>
                    <span className="mt-1 block font-bold text-slate-800">{selectedQuote.delivery_days} calendar days</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-400 uppercase tracking-wider">Date Submitted</span>
                    <span className="mt-1 block font-bold text-slate-800 text-xs">{formatDate(selectedQuote.submission_date || selectedQuote.created_at)}</span>
                  </div>
                  {selectedQuote.notes && (
                    <div className="col-span-2">
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-wider">Supplier Comments</span>
                      <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs italic text-slate-600 font-semibold whitespace-pre-wrap">
                        {selectedQuote.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Document proposal attachments */}
                <div className="border-t border-slate-100 pt-4">
                  <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Proposal Documents</span>
                  {selectedQuote.attachments.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedQuote.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={getFileUrl(att.file_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition cursor-pointer"
                          title="Download document file"
                        >
                          <div className="flex items-center gap-2 min-w-0 text-xs">
                            <FileText size={16} className="text-red-500 shrink-0" />
                            <span className="text-slate-700 truncate max-w-[150px] font-bold">{att.file_name}</span>
                          </div>
                          <Download size={14} className="text-slate-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs italic text-slate-400 p-2">No documents attached.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">Failed to retrieve quote specifications.</div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={handleCloseModal}
                className="rounded-2xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close Details
              </button>
              {selectedQuote && (
                <Link
                  to={`/quotations/compare/${selectedQuote.rfq_id}`}
                  onClick={handleCloseModal}
                  className="rounded-2xl bg-primary hover:bg-primary-hover px-5 py-2.5 text-sm font-bold text-white transition shadow-md shadow-indigo-600/10"
                >
                  Bids Comparison Matrix
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationList;
