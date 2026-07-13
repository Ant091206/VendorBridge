import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllActivity } from '../../api/activityApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, Filter, RotateCcw, Calendar, Table, Activity, ChevronRight, Layers, User 
} from 'lucide-react';

const ROLE_COLORS = {
  admin: 'bg-rose-50 text-rose-600 border-rose-100',
  officer: 'bg-blue-50 text-blue-600 border-blue-100',
  manager: 'bg-amber-50 text-amber-600 border-amber-100',
  vendor: 'bg-emerald-50 text-emerald-600 border-emerald-100'
};

const MODULE_COLORS = {
  'Authentication': 'bg-slate-100 text-slate-700',
  'Vendor Management': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'RFQ Management': 'bg-green-50 text-green-700 border-indigo-100',
  'Quotation Management': 'bg-teal-50 text-teal-700 border-teal-100',
  'Quotation Comparison': 'bg-sky-50 text-sky-700 border-sky-100',
  'Approval Workflow': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Purchase Orders': 'bg-green-50 text-purple-700 border-purple-100',
  'Invoices': 'bg-pink-50 text-pink-700 border-pink-100'
};

const getActionMeta = (action) => {
  if (!action) return {
    dot: 'border-slate-500 text-slate-500 bg-slate-500',
    badge: 'bg-slate-50 text-slate-700 border-slate-150/40',
    text: 'text-slate-600'
  };

  const act = action.toUpperCase();
  if (act.includes('APPROVE') || act.includes('REJECT') || act.includes('DECISION') || act.includes('SELECT') || act.includes('WIN')) {
    return {
      dot: 'border-purple-500 text-purple-500 bg-green-500',
      badge: 'bg-green-50 text-purple-700 border-purple-150/40',
      text: 'text-purple-600'
    };
  }
  if (act.includes('CREATE') || act.includes('SUBMIT') || act.includes('REGISTER') || act.includes('GENERATE') || act.includes('ADD') || act.includes('NEW')) {
    return {
      dot: 'border-emerald-500 text-emerald-500 bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-150/40',
      text: 'text-emerald-600'
    };
  }
  if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY') || act.includes('STATUS') || act.includes('SEND') || act.includes('MAIL') || act.includes('CHANGE')) {
    return {
      dot: 'border-blue-500 text-blue-500 bg-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-150/40',
      text: 'text-blue-600'
    };
  }
  if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('CLOSE') || act.includes('CANCEL') || act.includes('DEACTIVATE')) {
    return {
      dot: 'border-rose-500 text-rose-500 bg-rose-500',
      badge: 'bg-rose-50 text-rose-700 border-rose-150/40',
      text: 'text-rose-600'
    };
  }
  return {
    dot: 'border-slate-500 text-slate-500 bg-slate-500',
    badge: 'bg-slate-50 text-slate-700 border-slate-150/40',
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
  { value: 'Quotation Comparison', label: 'Quotation Comparison' },
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

const getModuleOptions = (role) => {
  if (role === 'admin') return MODULE_OPTIONS;
  if (role === 'officer') {
    return [
      { value: '', label: 'All Modules' },
      { value: 'Vendor Management', label: 'Vendor Management' },
      { value: 'RFQ Management', label: 'RFQ Management' },
      { value: 'Quotation Management', label: 'Quotation Management' },
      { value: 'Quotation Comparison', label: 'Quotation Comparison' },
      { value: 'Purchase Orders', label: 'Purchase Orders' },
      { value: 'Invoices', label: 'Invoices' }
    ];
  }
  if (role === 'manager') {
    return [
      { value: '', label: 'All Modules' },
      { value: 'Approval Workflow', label: 'Approval Workflow' },
      { value: 'Purchase Orders', label: 'Purchase Orders' }
    ];
  }
  return [
    { value: '', label: 'All Modules' },
    { value: 'Quotation Management', label: 'Quotation Management' },
    { value: 'Purchase Orders', label: 'Purchase Orders' },
    { value: 'Invoices', label: 'Invoices' }
  ];
};

/**
 * ActivityLogs Component
 * Overhauled with light premium aesthetics, supporting Table & Timeline views.
 */
const ActivityLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('table');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [role, setRole] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogsList = async () => {
    setLoading(true);
    try {
      const filters = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        module: module || undefined,
        role: role || undefined,
        from: from || undefined,
        to: to || undefined,
        sort
      };
      
      const res = await getAllActivity(filters);
      if (res.status === 'success') {
        setLogs(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
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
  }, [page, module, role, from, to, sort]);

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
    setSort('created_desc');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">
            {user?.role === 'vendor' ? 'My Activity' : 'System'}
          </p>
          <h1 className="text-3xl font-black text-slate-950 font-sans">
            {user?.role === 'vendor' ? 'My Activity History' : 'Audit Trail Logs'}
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            {user?.role === 'vendor' 
              ? 'Chronological list of actions performed by your user account.'
              : 'Real-time system transaction logs and operations tracker.'}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-premium shrink-0">
          <button
            onClick={() => setViewType('table')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
              viewType === 'table'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table size={14} />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setViewType('timeline')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition duration-150 cursor-pointer ${
              viewType === 'timeline'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} />
            <span>Timeline View</span>
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards */}
      <div className={`grid grid-cols-1 gap-4 ${user?.role === 'admin' ? 'sm:grid-cols-3' : 'sm:grid-cols-1 max-w-sm'}`}>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-500 border border-indigo-100 shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
              {user?.role === 'admin' ? 'Total Audit Events' : 'Total Activity Events'}
            </span>
            <span className="text-2xl font-black text-slate-900 leading-none mt-1 block">{total}</span>
          </div>
        </div>
        
        {user?.role === 'admin' && (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 border border-teal-100 shrink-0">
                <Layers size={22} />
              </div>
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">Traced Modules</span>
                <span className="text-2xl font-black text-slate-900 leading-none mt-1 block">8 Active</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shrink-0">
                <User size={22} />
              </div>
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">Unique Actors</span>
                <span className="text-2xl font-black text-slate-900 leading-none mt-1 block">13 Accounts</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
        <form onSubmit={handleSearchSubmit} className={`grid grid-cols-1 gap-4 ${
          user?.role === 'admin' 
            ? 'md:grid-cols-4' 
            : (user?.role === 'vendor' ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3')
        }`}>
          <div className={`relative ${user?.role === 'admin' ? 'md:col-span-2' : ''}`}>
            <input
              type="text"
              placeholder="Search by action, user or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input pl-10"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          </div>

          {user?.role !== 'vendor' && (
            <div className="relative">
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="premium-input pr-10 cursor-pointer"
              >
                {getModuleOptions(user?.role).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="premium-input pr-10 cursor-pointer"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
            </div>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3.5 py-1 bg-white">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-650 outline-none h-9 py-1"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-650 outline-none h-9 py-1"
              />
            </div>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="premium-input max-w-52 cursor-pointer text-xs font-bold"
          >
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="module_asc">Module A-Z</option>
            <option value="action_asc">Action A-Z</option>
            <option value="user_asc">User A-Z</option>
          </select>

          <button
            onClick={fetchLogsList}
            className="rounded-2xl bg-primary hover:bg-primary-hover px-5 py-2.5 text-xs font-black text-white transition duration-150 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Apply Query
          </button>
        </div>
      </div>

      {/* Table / Timeline Content */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-slate-200/80" />
      ) : logs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-premium">
          <p className="text-4xl">📄</p>
          <h3 className="mt-4 text-lg font-black text-slate-900">No Logs Found</h3>
          <p className="mt-2 text-sm text-slate-500">
            No system logs match the chosen search criteria.
          </p>
        </div>
      ) : viewType === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-3xl border border-slate-200 bg-white shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <th className="py-4 px-6">Timestamp</th>
                  {user?.role !== 'vendor' && <th className="py-4 px-6">User</th>}
                  {user?.role !== 'vendor' && <th className="py-4 px-6">Role</th>}
                  <th className="py-4 px-6">Module</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 font-semibold text-sm text-slate-650">
                {logs.map((log) => {
                  const resolvedAction = log.action_type || log.action;
                  const resolvedModule = log.module_name || log.module;
                  const actionMeta = getActionMeta(resolvedAction);
                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => navigate(`/activity-logs/${log.id}`)}
                      className="hover:bg-slate-50/50 transition cursor-pointer group"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-xs text-slate-900 font-black">{formatDate(log.created_at)}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{formatTime(log.created_at)}</div>
                      </td>
                      {user?.role !== 'vendor' && (
                        <td className="py-4 px-6 whitespace-nowrap text-slate-900 font-bold">
                          {log.user_name || 'System'}
                        </td>
                      )}
                      {user?.role !== 'vendor' && (
                        <td className="py-4 px-6 whitespace-nowrap">
                          {log.role ? (
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${ROLE_COLORS[log.role]}`}>
                              {log.role}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-black text-slate-400">
                              SYSTEM
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex rounded-xl border px-2.5 py-1 text-xs font-bold ${MODULE_COLORS[resolvedModule] || 'bg-slate-100 text-slate-700'}`}>
                          {resolvedModule}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-mono">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${actionMeta.badge}`}>
                          {resolvedAction}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-xs text-slate-500 font-semibold">
                        {log.description}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end">
                          <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm font-bold text-slate-500">
              <span>
                Page {page} of {totalPages} ({total} entries)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:pointer-events-none"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:pointer-events-none"
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
              const resolvedAction = log.action_type || log.action;
              const resolvedModule = log.module_name || log.module;
              const actionMeta = getActionMeta(resolvedAction);
              return (
                <div key={log.id} className="relative pl-14 group">
                  {/* Connector Dot */}
                  <div className={`absolute left-[19px] top-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white border-2 ${actionMeta.dot.split(' ')[0]} shadow-sm transition group-hover:scale-125 z-10`} />

                  {/* Card */}
                  <div 
                    onClick={() => navigate(`/activity-logs/${log.id}`)}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium hover:shadow-premium-hover hover:border-primary/40 transition duration-150 cursor-pointer"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <span className={`inline-flex rounded-xl border px-3 py-1 text-xs font-black uppercase tracking-wide font-mono ${actionMeta.badge}`}>
                          {resolvedAction ? resolvedAction.replace(/_/g, ' ') : ''}
                        </span>
                        
                        <span className={`inline-flex rounded-xl border px-2.5 py-0.5 text-[10px] font-bold ${MODULE_COLORS[resolvedModule] || 'bg-slate-100 text-slate-700'}`}>
                          {resolvedModule}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                        <span>{formatDate(log.created_at)}</span>
                        <span>at</span>
                        <span>{formatTime(log.created_at)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700 leading-relaxed">{log.description}</p>
                          <p className="text-xs text-slate-400 font-semibold">
                            {user?.role === 'vendor' ? (
                              <span>Performed by: <strong className="text-slate-700">You</strong></span>
                            ) : (
                              <span>
                                Performed by: <strong className="text-slate-700">{log.user_name || 'System'}</strong> 
                                {log.role && ` (${log.role})`}
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-primary transition shrink-0" />
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
