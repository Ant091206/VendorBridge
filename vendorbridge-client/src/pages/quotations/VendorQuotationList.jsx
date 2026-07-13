import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, Eye, FileText, Calendar, DollarSign, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMyQuotations } from '../../api/quotationApi';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';

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

  const formatCurrency = (amount, currencyCode = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quotations"
        subtitle="Manage, review, and edit your submitted bids for assigned RFQs."
      />

      {/* Filter panel */}
      <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-premium md:grid-cols-[1fr_200px]">
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
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#22C55E] focus:bg-white"
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
            className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm font-bold text-slate-800 outline-none transition focus:border-[#22C55E] focus:bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="expired">Expired</option>
            <option value="selected">Selected (Won)</option>
            <option value="rejected">Not Selected</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-100" />
      ) : quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white p-16 text-center shadow-premium">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E] mb-5">
            <FileText size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-950 font-sans">No Quotations Found</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500 max-w-md">
            You haven't submitted any quotations matching the filters yet. Invited RFQs can be bid on via the Vendor Portal dashboard.
          </p>
          <Link
            to="/vendor-portal"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-500/20"
          >
            Go to Vendor Portal
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Quotation Number</th>
                  <th className="px-6 py-4">RFQ Details</th>
                  <th className="px-6 py-4 text-center">Items Quoted</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                  <th className="px-6 py-4">Delivery Speed</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {quotations.map((q) => {
                  const isDraft = q.status === 'draft';
                  const isSubmitted = q.status === 'submitted';
                  const isEditable = (isDraft || isSubmitted) && !(q.rfq_deadline && new Date(q.rfq_deadline) < new Date());

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-sm font-black text-primary">
                        <Link to={`/vendor/quotation-details/${q.id}`} className="hover:underline">
                          {q.quotation_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <Link to={`/rfqs/${q.rfq_id}`} className="text-sm font-black text-slate-950 hover:text-primary transition-colors">{q.rfq_title}</Link>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{q.rfq_number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-slate-700 font-mono">{q.items_count || 1}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900 font-mono">{formatCurrency(q.grand_total, q.currency)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-750">
                          <Clock size={14} className="text-slate-400" />
                          <span>{q.delivery_days} days</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">{formatDate(q.submission_date || q.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-black ${statusBadgeColors[q.status] || ''}`}>
                          {statusLabels[q.status] || q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/vendor/quotation-details/${q.id}`}
                            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-purple-250 hover:bg-green-50/50 hover:text-primary transition-colors"
                            title="View Bid Details"
                          >
                            <Eye size={16} />
                          </Link>
                          {isEditable && (
                            <Link
                              to={`/vendor/edit-quote/${q.id}`}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-primary hover:border-green-200 hover:bg-green-50 transition-all"
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
