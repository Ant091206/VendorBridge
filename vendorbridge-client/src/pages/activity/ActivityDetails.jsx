import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getActivityById } from '../../api/activityApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  ArrowLeft, User, Shield, Compass, Network, Calendar, Layers, ExternalLink 
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
  'RFQ Management': 'bg-green-50 text-green-700',
  'Quotation Management': 'bg-teal-50 text-teal-700',
  'Approval Workflow': 'bg-emerald-50 text-emerald-700',
  'Purchase Orders': 'bg-green-50 text-purple-700',
  'Invoices': 'bg-pink-50 text-pink-700'
};

const ActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchLogDetail = async () => {
      try {
        const res = await getActivityById(id);
        if (res.status === 'success') {
          setLog(res.data);
        }
      } catch (err) {
        setToastMessage(err.message || 'Failed to load log detail.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="space-y-4">
        {toastMessage && (
          <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
        )}
        <button
          onClick={() => navigate('/activity-logs')}
          className="flex items-center gap-2 text-sm text-[#22C55E] font-bold"
        >
          <ArrowLeft size={16} />
          <span>Back to logs</span>
        </button>
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500 font-bold">Activity log not found.</p>
        </div>
      </div>
    );
  }

  // Derive link to actual entity
  const getEntityLink = () => {
    if (!log.entity_type || !log.entity_id) return null;
    
    switch (log.entity_type.toLowerCase()) {
      case 'rfq':
        return `/rfqs/${log.entity_id}`;
      case 'quotation':
        return '/quotations';
      case 'approval':
        return `/approvals/${log.entity_id}`;
      case 'purchase_order':
        return `/purchase-orders/${log.entity_id}`;
      case 'invoice':
        return `/invoices/${log.entity_id}`;
      case 'vendor':
        return `/vendors/${log.entity_id}`;
      default:
        return null;
    }
  };

  const entityPath = getEntityLink();
  const resolvedAction = log.action_type || log.action || '';
  const resolvedModule = log.module_name || log.module || '';

  // Parse JSON values if stringified
  const parseJsonValue = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  };

  const parsedOldVal = parseJsonValue(log.old_value);
  const parsedNewVal = parseJsonValue(log.new_value);

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/activity-logs')}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm shrink-0"
      >
        <ArrowLeft size={15} />
        <span>Back to Activity Logs</span>
      </button>

      <PageHeader 
        title="Log Audit Detail" 
        subtitle={`System Audit Trail Record ID #${id}`}
      />

      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#22C55E]/10 via-[#16A34A]/10 to-indigo-500/5 px-6 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Action Type</span>
            <h3 className="text-md font-mono font-black text-green-600 uppercase mt-1">
              {resolvedAction.replace(/_/g, ' ')}
            </h3>
          </div>

          <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black ${MODULE_COLORS[resolvedModule] || 'bg-slate-100 text-slate-700'}`}>
            {resolvedModule}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 divide-y divide-slate-100">
          {/* Description */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description / Log Entry</span>
            <p className="mt-2 text-sm font-bold text-slate-800 leading-relaxed bg-slate-50 border border-slate-100 rounded-2xl p-4">
              {log.description}
            </p>
          </div>

          {/* Details Metadata */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col */}
            <div className="space-y-4">
              {/* User */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                  <User size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Actor</span>
                  <span className="text-sm font-black text-slate-900">{log.user_name || 'System / Auto'}</span>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                  <Shield size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Role Permission</span>
                  {log.role ? (
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide mt-0.5 ${ROLE_COLORS[log.role]}`}>
                      {log.role}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[9px] font-black text-slate-400 mt-0.5">
                      SYSTEM
                    </span>
                  )}
                </div>
              </div>

              {/* IP Address */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                  <Network size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">IP Address</span>
                  <span className="text-sm font-bold text-slate-600 font-mono">{log.ip_address || '0.0.0.0 (Internal)'}</span>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-4">
              {/* Timestamp */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Timestamp</span>
                  <span className="text-sm font-black text-slate-800">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Linked entity */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                  <Layers size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Affected Record</span>
                  {log.entity_type ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-slate-600 uppercase">{log.entity_type} #{log.entity_id}</span>
                      {entityPath && (
                        <Link 
                          to={entityPath}
                          className="inline-flex items-center gap-1 text-[11px] font-black text-[#22C55E] hover:underline"
                        >
                          <span>Open Record</span>
                          <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">None</span>
                  )}
                </div>
              </div>

              {/* Device / Browser Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                  <Compass size={16} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Device / Browser</span>
                  <span className="text-xs font-semibold text-slate-650 truncate max-w-xs block" title={log.device_info || 'Unknown'}>
                    {log.device_info || 'Unknown / Not recorded'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Values Audit (Old vs New Values) */}
          {(parsedOldVal || parsedNewVal) && (
            <div className="pt-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">Audited Changes (Previous vs New Value)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Previous State (old_value)</span>
                  {parsedOldVal ? (
                    <pre className="overflow-x-auto text-slate-600 max-h-60 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(parsedOldVal, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-400 italic">No previous state recorded</span>
                  )}
                </div>
                
                <div className="rounded-2xl border border-indigo-150 bg-green-50/20 p-4 font-mono text-xs">
                  <span className="block text-[10px] font-bold text-green-500 uppercase mb-2">Updated State (new_value)</span>
                  {parsedNewVal ? (
                    <pre className="overflow-x-auto text-indigo-950 max-h-60 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(parsedNewVal, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-400 italic">No new state recorded</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;
