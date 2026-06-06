import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllActivity } from '../../api/activityApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  Search, Filter, RotateCcw, Calendar, Table, Activity, ChevronRight 
} from 'lucide-react';

const ROLE_COLORS = {
  admin: 'bg-rose-50 text-rose-600 border-rose-100',
  officer: 'bg-blue-50 text-blue-600 border-blue-100',
  manager: 'bg-amber-50 text-amber-600 border-amber-100',
  vendor: 'bg-emerald-50 text-emerald-600 border-emerald-100'
};

const MODULE_COLORS = {
  'Authentication': 'bg-slate-100 text-slate-700',
  'Vendor Management': 'bg-cyan-50 text-cyan-700',
  'RFQ Management': 'bg-indigo-50 text-indigo-700',
  'Quotation Management': 'bg-teal-50 text-teal-700',
  'Approval Workflow': 'bg-emerald-50 text-emerald-700',
  'Purchase Orders': 'bg-purple-50 text-purple-700',
  'Invoices': 'bg-pink-50 text-pink-700'
};

const getActionMeta = (action) => {
  const act = action.toUpperCase();
  if (act.includes('APPROVE') || act.includes('REJECT') || act.includes('DECISION') || act.includes('SELECT') || act.includes('WIN')) {
    return {
      dot: 'border-purple-500 text-purple-500 bg-purple-500',
      badge: 'bg-purple-50 text-purple-700 border-purple-100',
      text: 'text-purple-600'
    };
  }
  if (act.includes('CREATE') || act.includes('SUBMIT') || act.includes('REGISTER') || act.includes('GENERATE') || act.includes('ADD') || act.includes('NEW')) {
    return {
      dot: 'border-emerald-500 text-emerald-500 bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      text: 'text-emerald-600'
    };
  }
  if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY') || act.includes('STATUS') || act.includes('SEND') || act.includes('MAIL') || act.includes('CHANGE')) {
    return {
      dot: 'border-blue-500 text-blue-500 bg-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-100',
      text: 'text-blue-600'
    };
  }
  if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CLOSE') || act.includes('CANCEL') || act.includes('DEACTIVATE')) {
    return {
      dot: 'border-rose-500 text-rose-500 bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-100',
      text: 'text-rose-600'
    };
  }
  return {
    dot: 'border-slate-500 text-slate-500 bg-slate-500',
    badge: 'bg-slate-50 text-slate-700 border-slate-100',
    text: 'text-slate-600'
  };
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'Authentication', label: 'Authentication' },
  { value: 'Vendor Management', label: 'Vendor Management' },
  { value: 'RFQ Management', label: 'RFQ Management' },
  { value: 'Quotation Management', label: 'Quotation Management' },
  { value: 'Approval Workflow', label: 'Approval Workflow' },
  { value: 'Purchase Orders', label: 'Purchase Orders' },
  { value: 'Invoices', label: 'Invoices' }
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'officer', label: 'Officer' },
  { value: 'manager', label: 'Manager' },
  { value: 'vendor', label: 'Vendor' }
];

const ActivityLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('table'); // table or timeline
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  // Filters
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [role, setRole] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogsList = async () => {
    setLoading(true);
    try {
      const filters = {
        page,
        limit: 50,
        search: search.trim() || undefined,
        module: module || undefined,
        role: role || undefined,
        from: from || undefined,
        to: to || undefined
      };
      
      const res = await getAllActivity(filters);
      if (res.status === 'success') {
        setLogs(res.data || []);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsList();
  }, [page, module, role, from, to]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogsList();
  };

  const handleReset = () => {
    setSearch('');
    setModule('');
    setRole('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Audit Trail Logs" 
          subtitle="Real-time system transaction logs and operations tracker"
        />

        {/* View Switcher */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shrink-0">
          <button
            onClick={() => setViewType('table')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
              viewType === 'table'
                ? 'bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table size={14} />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewType('timeline')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
              viewType === 'timeline'
                ? 'bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} />
            <span>Timeline View</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by action, user or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/55 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6D5DFC] focus:bg-white"
            />
          </div>

          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/55 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#6D5DFC] focus:bg-white"
          >
            {MODULE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/55 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#6D5DFC] focus:bg-white"
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3.5 py-2">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-600 outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-600 outline-none"
              />
            </div>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 transition duration-150 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>

          <button
            onClick={fetchLogsList}
            className="rounded-2xl bg-[#6D5DFC] hover:bg-[#5b4deb] px-5 py-2.5 text-xs font-black text-white transition duration-150 shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            Apply Query
          </button>
        </div>
      </div>

      {/* Table / Timeline Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <h3 className="text-lg font-black text-slate-900">No Logs Found</h3>
          <p className="mt-2 text-sm text-slate-500">
            No system logs match the chosen search criteria.
          </p>
        </div>
      ) : viewType === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                {logs.map((log) => {
                  const actionMeta = getActionMeta(log.action);
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => navigate(`/activity-logs/${log.id}`)}
                      className="hover:bg-slate-50/50 transition cursor-pointer group"
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-slate-900 font-black">{formatDate(log.created_at)}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">{formatTime(log.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">
                      {log.user_name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.role ? (
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${ROLE_COLORS[log.role]}`}>
                          {log.role}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-black text-slate-400">
                          SYSTEM
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-bold ${MODULE_COLORS[log.module] || 'bg-slate-100 text-slate-700'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide font-mono ${actionMeta.badge}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-500">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition" />
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-xs font-semibold text-slate-500">
                Page {page} of {totalPages} ({total} entries)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="relative max-w-3xl mx-auto py-4">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          <div className="space-y-6">
            {logs.map((log) => {
              const actionMeta = getActionMeta(log.action);
              return (
                <div key={log.id} className="relative pl-14 group">
                  {/* Visual Connector Dot */}
                  <div className={`absolute left-[19px] top-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border-2 ${actionMeta.dot.split(' ')[0]} shadow-sm transition group-hover:scale-125 z-10`} />

                  {/* Timeline Card */}
                  <div 
                    onClick={() => navigate(`/activity-logs/${log.id}`)}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#6D5DFC] hover:shadow-md cursor-pointer"
                  >
                    <div className="flex flex-col gap-3">
                      {/* User Action (Color-coded badge) */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <span className={`inline-flex rounded-xl border px-3 py-1 text-xs font-black uppercase tracking-wide font-mono ${actionMeta.badge}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        
                        <span className={`inline-flex rounded-xl px-2.5 py-0.5 text-[10px] font-bold ${MODULE_COLORS[log.module] || 'bg-slate-100 text-slate-700'}`}>
                          {log.module}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <span>{formatDate(log.created_at)}</span>
                        <span>at</span>
                        <span>{formatTime(log.created_at)}</span>
                      </div>

                      {/* Description */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed">{log.description}</p>
                          <p className="text-xs text-slate-400">
                            Performed by: <strong className="text-slate-700">{log.user_name || 'System'}</strong> 
                            {log.role && ` (${log.role})`}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-[#6D5DFC] transition shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
