import React, { useState, useEffect } from 'react';
import { getAllLogs } from '../api/activityApi';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

/**
 * ActivityLogs Page Component
 * Displays a complete, filterable audit trail of all procurement actions.
 * Admin-only access.
 */

// ── Action icon/color mapping ──
const ACTION_META = {
  RFQ_CREATED:           { icon: '📋', color: 'blue',    label: 'RFQ Created' },
  RFQ_UPDATED:           { icon: '📋', color: 'blue',    label: 'RFQ Updated' },
  RFQ_PUBLISHED:         { icon: '📋', color: 'blue',    label: 'RFQ Published' },
  QUOTATION_SUBMITTED:   { icon: '💬', color: 'teal',    label: 'Quotation Submitted' },
  QUOTATION_UPDATED:     { icon: '💬', color: 'teal',    label: 'Quotation Updated' },
  QUOTATION_SELECTED:    { icon: '💬', color: 'teal',    label: 'Quotation Selected' },
  APPROVAL_APPROVED:     { icon: '✅', color: 'emerald', label: 'Approval Approved' },
  APPROVAL_REJECTED:     { icon: '❌', color: 'rose',    label: 'Approval Rejected' },
  PO_GENERATED:          { icon: '📦', color: 'indigo',  label: 'PO Generated' },
  PO_SENT:               { icon: '📦', color: 'indigo',  label: 'PO Dispatched' },
  PO_COMPLETED:          { icon: '📦', color: 'indigo',  label: 'PO Completed' },
  INVOICE_GENERATED:     { icon: '🧾', color: 'purple',  label: 'Invoice Generated' },
  INVOICE_EMAILED:       { icon: '📧', color: 'amber',   label: 'Invoice Emailed' },
  INVOICE_PAID:          { icon: '🧾', color: 'emerald', label: 'Invoice Paid' },
  INVOICE_SENT:          { icon: '🧾', color: 'amber',   label: 'Invoice Sent' },
  VENDOR_CREATED:        { icon: '🏢', color: 'blue',    label: 'Vendor Created' },
  VENDOR_UPDATED:        { icon: '🏢', color: 'blue',    label: 'Vendor Updated' },
};

const getActionMeta = (action) => {
  return ACTION_META[action] || { icon: '🔔', color: 'slate', label: action.replace(/_/g, ' ') };
};

// ── Color class mapping ──
const colorClasses = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    dot: 'bg-blue-500' },
  teal:    { bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    text: 'text-teal-400',    dot: 'bg-teal-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400',    dot: 'bg-rose-500' },
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20',  text: 'text-indigo-400',  dot: 'bg-indigo-500' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  dot: 'bg-purple-500' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   dot: 'bg-amber-500' },
  slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-700',      text: 'text-slate-400',   dot: 'bg-slate-500' },
};

// ── Time ago formatter ──
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ` at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

// ── Entity type options ──
const ENTITY_TYPES = [
  { value: '', label: 'All Entity Types' },
  { value: 'rfq', label: 'RFQ' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'approval', label: 'Approval' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'vendor', label: 'Vendor' },
];

// ── Action filter options ──
const ACTION_FILTERS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATED', label: 'Created' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'GENERATED', label: 'Generated' },
  { value: 'EMAILED', label: 'Emailed' },
  { value: 'PAID', label: 'Paid' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'SENT', label: 'Sent' },
];

const LIMIT = 50;

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  // Filter state
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Active filters (applied on button click)
  const [activeFilters, setActiveFilters] = useState({});

  const fetchLogs = async (filters = {}, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = {
        limit: LIMIT,
        ...filters
      };
      const response = await getAllLogs(params);
      if (response.status === 'success') {
        if (append) {
          setLogs(prev => [...prev, ...(response.data || [])]);
        } else {
          setLogs(response.data || []);
        }
        setTotal(response.total || 0);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to load activity logs.');
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Apply filters
  const handleApplyFilters = () => {
    const filters = {};
    if (entityType) filters.entity_type = entityType;
    if (actionFilter) filters.action = actionFilter;
    if (dateFrom) filters.from = dateFrom;
    if (dateTo) filters.to = dateTo;
    setActiveFilters(filters);
    fetchLogs(filters);
  };

  // Reset filters
  const handleReset = () => {
    setSearch('');
    setEntityType('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setActiveFilters({});
    fetchLogs();
  };

  // Client-side search filter
  const filteredLogs = search
    ? logs.filter(log =>
        (log.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  // Role badge
  const getRoleBadge = (role) => {
    if (!role) return null;
    const styles = {
      admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      officer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      vendor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[role] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
        {role}
      </span>
    );
  };

  // Select styling
  const selectClass = "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition";
  const inputClass = "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition";

  if (loading && logs.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Activity Logs</h1>
        <p className="mt-1 text-sm text-slate-400">Complete audit trail of all procurement actions</p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by user or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />

          {/* Entity Type */}
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={selectClass}>
            {ENTITY_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={selectClass}>
            {ACTION_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClass}
            placeholder="From date"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputClass}
            placeholder="To date"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition shadow-md shadow-indigo-600/20"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Count bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing <span className="font-bold text-white">{filteredLogs.length}</span> of{' '}
          <span className="font-bold text-white">{total}</span> logs
        </p>
      </div>

      {/* Activity Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800 text-2xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-white">No Activity Logs Found</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            No activity logs match the selected filters. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800" />

          <div className="space-y-1">
            {filteredLogs.map((log) => {
              const meta = getActionMeta(log.action);
              const colors = colorClasses[meta.color] || colorClasses.slate;

              return (
                <div key={log.id} className="relative pl-14 py-3 group">
                  {/* Timeline dot */}
                  <div className={`absolute left-[18px] top-5 h-3 w-3 rounded-full ${colors.dot} ring-4 ring-slate-950 transition group-hover:scale-125`} />

                  {/* Log card */}
                  <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition hover:border-slate-600`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {/* Icon */}
                      <span className="text-lg">{meta.icon}</span>
                      {/* Action badge */}
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.border} ${colors.bg} ${colors.text}`}>
                        {meta.label}
                      </span>
                      {/* Time */}
                      <span className="text-[11px] text-slate-500 font-medium">· {timeAgo(log.created_at)}</span>
                    </div>

                    {/* User info */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-slate-300 font-medium">
                        {log.user_name || 'System'}
                      </span>
                      {log.user_role && getRoleBadge(log.user_role)}
                    </div>

                    {/* Entity reference */}
                    <div className="mt-1 text-xs text-slate-500 font-medium">
                      Entity: <span className="text-slate-400 uppercase">{log.entity_type}</span>{' '}
                      <span className="text-slate-400 font-mono">#{log.entity_id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Load More */}
      {filteredLogs.length < total && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              // We request more logs from the server by increasing the limit
              const newLimit = logs.length + LIMIT;
              fetchLogs({ ...activeFilters, limit: newLimit });
            }}
            disabled={loadingMore}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
