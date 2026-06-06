import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, Eye, FileText, Calendar, DollarSign, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMyQuotations } from '../../api/quotationApi';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

const statusBadgeColors = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-purple-50 text-[#6D5DFC] border-purple-200/50',
  selected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200'
};

const VendorQuotationList = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const fetchQuotations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await getMyQuotations(params);
      setQuotations(response.data || []);
      setPagination(response.pagination || {
        page,
        limit: 10,
        total: response.results || 0,
        totalPages: Math.ceil((response.results || 0) / 10)
      });
    } catch (error) {
      console.error(error);
      setToast({ message: error.message || 'Failed to load quotations.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchQuotations(1);
  }, [fetchQuotations]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuotations(1);
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
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quotations"
        subtitle="Manage, review, and edit your submitted bids for assigned RFQs."
      />

      {/* Filter panel */}
      <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:grid-cols-[1fr_200px]">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by RFQ number, title, quotation number..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white"
          />
        </form>

        {/* Status Filter */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter size={16} className="text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm font-bold text-slate-800 outline-none transition focus:border-[#6D5DFC] focus:bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="selected">Selected (Won)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-100" />
      ) : quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white p-16 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-[#6D5DFC] mb-5">
            <FileText size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-950">No Quotations Found</h3>
          <p className="mt-2 text-sm font-bold text-slate-500 max-w-md">
            You haven't submitted any quotations matching the filters yet. Invited RFQs can be bid on via the Vendor Portal dashboard.
          </p>
          <Link
            to="/vendor-portal"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20"
          >
            Go to Vendor Portal
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Quotation Number</th>
                  <th className="px-6 py-4">RFQ Details</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Total Value</th>
                  <th className="px-6 py-4">Delivery Speed</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => {
                  const isSubmitted = q.status === 'submitted';
                  const deadlinePassed = q.rfq_deadline ? new Date(q.rfq_deadline) < new Date() : false;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-sm font-black text-[#6D5DFC]">{q.quotation_number || `QTE-${String(q.id).padStart(5, '0')}`}</td>
                      <td className="px-6 py-4">
                        <div>
                          <Link to={`/rfqs/${q.rfq_id}`} className="text-sm font-black text-slate-950 hover:text-[#6D5DFC] transition-colors">{q.rfq_title}</Link>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{q.rfq_number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">{q.quantity}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">{formatCurrency(q.unit_price)}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900 font-mono">{formatCurrency(q.total_price)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                          <Clock size={14} className="text-slate-400" />
                          <span>{q.delivery_days} days</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">{formatDate(q.submitted_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-black capitalize ${statusBadgeColors[q.status] || ''}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/vendor/quotation-details/${q.id}`}
                            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:border-purple-200 hover:bg-purple-50 hover:text-[#6D5DFC] transition-colors"
                            title="View Bid Specifications"
                          >
                            <Eye size={16} />
                          </Link>
                          {isSubmitted && !deadlinePassed && (
                            <Link
                              to={`/vendor/edit-quote/${q.id}`}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#6D5DFC] hover:border-purple-200 hover:bg-purple-50 transition-all"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-500">
              <span>Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bids</span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchQuotations(pagination.page - 1)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchQuotations(pagination.page + 1)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

export default VendorQuotationList;
