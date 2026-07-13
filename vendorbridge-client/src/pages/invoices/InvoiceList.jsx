import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllInvoices, sendInvoiceEmail, markInvoicePaid, cancelInvoice, downloadInvoicePDF } from '../../api/invoiceApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Search, Filter, Mail, Download, DollarSign, Eye,
  Plus, ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react';

const STATUS_CONFIG = {
  Draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-600 border-slate-200' },
  Generated: { label: 'Generated', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Sent:      { label: 'Sent',      color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Viewed:    { label: 'Viewed',    color: 'bg-green-50 text-purple-700 border-green-200' },
  Paid:      { label: 'Paid',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(parseFloat(v) || 0);

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUSES = ['', 'Draft', 'Generated', 'Sent', 'Viewed', 'Paid', 'Cancelled'];

const InvoiceList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: 'id_desc' };
      if (status) params.status = status;
      if (search) params.search = search;

      const res = await getAllInvoices(params);
      setInvoices(res.data || []);
      setStats(res.stats || {});
      setPagination(res.pagination || { total: 0, page: 1, limit: 15, total_pages: 1 });
    } catch (e) {
      showToast('Failed to load invoices.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchData(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const setLoading1 = (id, v) => setActionLoading(prev => ({ ...prev, [id]: v }));

  const handleDownload = async (id, num) => {
    setLoading1(`dl-${id}`, true);
    try {
      await downloadInvoicePDF(id, num);
      showToast('PDF downloaded successfully.');
    } catch (e) {
      showToast(e.message || 'Download failed.', 'error');
    } finally { setLoading1(`dl-${id}`, false); }
  };

  const handleConfirm = async () => {
    if (!modal) return;
    const { type, id, label } = modal;
    setModal(null);
    setLoading1(`${type}-${id}`, true);
    try {
      if (type === 'email') {
        await sendInvoiceEmail(id);
        showToast(`Invoice ${label} emailed to vendor successfully.`);
      } else if (type === 'pay') {
        await markInvoicePaid(id, {});
        showToast(`Invoice ${label} marked as Paid.`);
      } else if (type === 'cancel') {
        await cancelInvoice(id, 'Cancelled by procurement officer.');
        showToast(`Invoice ${label} cancelled.`);
      }
      fetchData();
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Action failed.', 'error');
    } finally { setLoading1(`${type}-${id}`, false); }
  };

  // Stats bar
  const statItems = [
    { key: '', label: 'All', val: stats.total || 0 },
    { key: 'Draft', label: 'Draft', val: stats.draft || 0 },
    { key: 'Generated', label: 'Generated', val: stats.generated || 0 },
    { key: 'Sent', label: 'Sent', val: stats.sent || 0 },
    { key: 'Viewed', label: 'Viewed', val: stats.viewed || 0 },
    { key: 'Paid', label: 'Paid', val: stats.paid || 0 },
    { key: 'Cancelled', label: 'Cancelled', val: stats.cancelled || 0 },
  ];

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {modal && (
        <ConfirmModal
          message={
            modal.type === 'email' ? `Send Invoice ${modal.label} as PDF email to the vendor?` :
            modal.type === 'pay'   ? `Mark Invoice ${modal.label} as PAID? This cannot be undone.` :
            `Cancel Invoice ${modal.label}? This will void the invoice.`
          }
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Financials</p>
          <h1 className="text-3xl font-black text-slate-950">Invoice Registry</h1>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            {pagination.total} invoice{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/invoices/create" className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition shadow-sm">
          <Plus size={14} /> Create Invoice
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statItems.map((s) => (
          <button
            key={s.key}
            onClick={() => { setStatus(s.key); setPage(1); }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
              status === s.key
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:text-primary'
            }`}
          >
            {s.label}
            <span className={`rounded-full px-1.5 text-[10px] font-black ${status === s.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {s.val}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by invoice number, vendor, or PO number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="premium-input pl-10 pr-10"
        />
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p className="text-5xl">🧾</p>
          <h3 className="mt-4 text-lg font-black text-slate-900">No Invoices Found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {search || status ? 'Try adjusting your search or filter.' : 'Create invoices from Purchase Order details.'}
          </p>
          <Link to="/invoices/create" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition">
            <Plus size={13} /> Create Invoice
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Invoice #</th>
                  <th className="px-5 py-4">Vendor</th>
                  <th className="px-5 py-4">PO Number</th>
                  <th className="px-5 py-4">Issue Date</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4 text-right">Grand Total</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.map((inv) => {
                  const isOverdue = new Date(inv.due_date) < new Date() && !['Paid', 'Cancelled'].includes(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isOverdue && <AlertTriangle size={12} className="text-rose-500 flex-shrink-0" title="Overdue" />}
                          <Link to={`/invoices/${inv.id}`} className="font-mono font-bold text-primary hover:underline text-xs">
                            {inv.invoice_number}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 max-w-[140px] truncate">{inv.vendor_name}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">{inv.po_number}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{fmtDate(inv.issue_date)}</td>
                      <td className={`px-5 py-3.5 text-xs font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                        {fmtDate(inv.due_date)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-slate-900">{fmt(inv.grand_total)}</td>
                      <td className="px-5 py-3.5 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-primary/20 hover:text-primary transition"
                            title="View"
                          >
                            <Eye size={12} />
                          </Link>
                          <button
                            onClick={() => handleDownload(inv.id, inv.invoice_number)}
                            disabled={actionLoading[`dl-${inv.id}`]}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-primary/20 hover:text-primary transition disabled:opacity-40"
                            title="Download PDF"
                          >
                            <Download size={12} />
                          </button>
                          {['Generated', 'Sent', 'Viewed'].includes(inv.status) && (
                            <button
                              onClick={() => setModal({ type: 'email', id: inv.id, label: inv.invoice_number })}
                              disabled={actionLoading[`email-${inv.id}`]}
                              className="rounded-lg border border-primary/20 bg-primary/5 p-1.5 text-primary hover:bg-primary hover:text-white transition disabled:opacity-40"
                              title="Send Email"
                            >
                              <Mail size={12} />
                            </button>
                          )}
                          {!['Paid', 'Cancelled', 'Draft'].includes(inv.status) && (
                            <button
                              onClick={() => setModal({ type: 'pay', id: inv.id, label: inv.invoice_number })}
                              disabled={actionLoading[`pay-${inv.id}`]}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white transition disabled:opacity-40"
                              title="Mark Paid"
                            >
                              <DollarSign size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-500">
                Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                {[...Array(Math.min(pagination.total_pages, 5))].map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        pg === page ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
