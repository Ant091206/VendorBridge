import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit, ArrowLeft, Calendar, FileText, User, Tag, Clock, Users, Paperclip, Download, AlertCircle } from 'lucide-react';
import { getRFQById, patchRFQStatus } from '../../api/rfqApi';
import { useAuth } from '../../context/AuthContext';
import RFQStatusBadge from '../../components/rfqs/RFQStatusBadge';
import Toast from '../../components/Toast';

const date = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));

const itemField = (label, value) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col justify-between">
    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{value || '-'}</p>
  </div>
);

const priorityColors = {
  Low: 'bg-slate-50 border-slate-200 text-slate-700',
  Medium: 'bg-blue-50 border-blue-200 text-blue-700',
  High: 'bg-amber-50 border-amber-200 text-amber-700',
  Urgent: 'bg-rose-50 border-rose-200 text-rose-700'
};

const RFQDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [rfq, setRfq] = useState(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadRFQ = () => {
    getRFQById(id)
      .then((res) => setRfq(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load RFQ.'));
  };

  useEffect(() => {
    loadRFQ();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await patchRFQStatus(id, newStatus);
      if (res.status === 'success' && res.data) {
        setRfq(res.data);
      } else {
        loadRFQ();
      }
      setToastMessage(`RFQ status changed to "${newStatus}" successfully.`);
      setToastType('success');
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Error updating RFQ status.');
      setToastType('error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <Link to="/rfqs" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to RFQs
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">{error}</div>
      </div>
    );
  }

  if (!rfq) return <div className="h-[450px] animate-pulse rounded-[32px] bg-slate-200/80 max-w-6xl mx-auto" />;

  const isWritable = ['admin', 'officer'].includes(user?.role);
  const isVendor = user?.role === 'vendor';

  const getFileUrl = (filePath) => {
    const host = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${host}${filePath}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
          <Link to="/rfqs" className="hover:text-primary transition-colors">RFQs</Link>
          <span>/</span>
          <span className="text-slate-600">{rfq.rfq_number}</span>
        </div>
        <div className="flex items-center justify-between">
          <Link to="/rfqs" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to List
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Quick Edit */}
            {isWritable && rfq.status === 'draft' && (
              <Link
                to={`/rfqs/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-2.5 text-xs font-black text-slate-700 hover:text-primary hover:border-primary/20 transition-all"
              >
                <Edit size={14} /> Edit Configuration
              </Link>
            )}

            {/* Status transitions (Publish, Close, Cancel buttons shown to authorized roles) */}
            {isWritable && (
              <div className="flex gap-2">
                {rfq.status === 'draft' && (
                  <>
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('published')}
                      className="rounded-2xl bg-primary px-4 py-2.5 text-xs font-black text-white hover:opacity-95 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      Publish RFQ
                    </button>
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('cancelled')}
                      className="rounded-2xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel RFQ
                    </button>
                  </>
                )}
                {rfq.status === 'published' && (
                  <>
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('closed')}
                      className="rounded-2xl bg-indigo-650 px-4 py-2.5 text-xs font-black text-white hover:opacity-95 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      Close RFQ
                    </button>
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('cancelled')}
                      className="rounded-2xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-black text-slate-650 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel RFQ
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Profile Card */}
      <section className="rounded-[32px] bg-gradient-to-br from-primary via-indigo-600 to-purple-650 p-8 text-white shadow-premium-hover relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="flex gap-4 items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-[0.16em] bg-white/15 px-2.5 py-1 rounded-full border border-white/10">
                  {rfq.rfq_number}
                </span>
                <span className="text-xs font-black uppercase tracking-[0.16em] bg-green-500/30 px-2.5 py-1 rounded-full border border-purple-400/20">
                  {rfq.type}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black capitalize ${priorityColors[rfq.priority] || priorityColors.Medium}`}>
                  {rfq.priority} Priority
                </span>
              </div>
              <h1 className="mt-3.5 text-3xl font-black tracking-tight">{rfq.title}</h1>
              <p className="mt-1 text-sm font-semibold text-white/70">{rfq.description}</p>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center self-start bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
            <span className="mr-2 text-xs font-bold text-white/60">Status:</span>
            <RFQStatusBadge status={rfq.status} />
          </div>
        </div>
      </section>

      {/* Main Info Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {/* RFQ Meta details */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <FileText size={18} className="text-primary" /> Basic Information
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {itemField('RFQ Number', rfq.rfq_number)}
              {itemField('Type Classification', rfq.type)}
              {itemField('Priority Severity', rfq.priority)}
              {itemField('Submission Deadline', date(rfq.submission_deadline))}
              {itemField('Issue Date', date(rfq.issue_date))}
              {itemField('Created By Staff', rfq.created_by_name)}
            </div>
          </section>

          {/* Line Items List */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <List size={18} className="text-primary" /> Line Items ({rfq.items?.length || 0})
            </h2>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Specs / Details</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4">Unit</th>
                    {user?.role !== 'vendor' && <th className="py-3 px-4 text-right">Expected Target</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rfq.items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.item_name}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{item.description || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                      {user?.role !== 'vendor' && (
                        <td className="py-3 px-4 text-right font-black text-slate-950">
                          {item.expected_price ? money(item.expected_price) : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Procurement notes */}
          {rfq.notes && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
                <Info size={18} className="text-primary" /> Procurement Terms & Notes
              </h2>
              <div className="mt-4 bg-slate-50 rounded-2xl p-5 border border-slate-100 text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                {rfq.notes}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Assigned Vendors (Procurement/Admins only) */}
          {!isVendor && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
                <Users size={18} className="text-primary" /> Assigned Vendors ({rfq.assigned_vendors?.length || 0})
              </h2>
              <div className="mt-4 max-h-[240px] overflow-y-auto space-y-2 pr-1">
                {rfq.assigned_vendors?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No vendors assigned to this request.</p>
                ) : (
                  rfq.assigned_vendors?.map((v) => (
                    <div key={v.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{v.vendor_name}</p>
                        <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5">{v.company_name}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-slate-250 text-slate-650 px-2 py-0.5 rounded shrink-0 font-mono">
                        {v.vendor_code}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Attachments Section */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <Paperclip size={18} className="text-primary" /> Attachments & Docs ({rfq.attachments?.length || 0})
            </h2>
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {rfq.attachments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No document attachments registered.</p>
              ) : (
                rfq.attachments?.map((att) => (
                  <div key={att.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs font-semibold">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-slate-450 shrink-0" />
                      <span className="text-slate-700 truncate font-bold" title={att.file_name}>
                        {att.file_name}
                      </span>
                    </div>
                    <a
                      href={getFileUrl(att.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-black text-primary bg-white border border-slate-150 hover:border-primary/20 px-2.5 py-1.5 rounded-xl shadow-sm transition"
                    >
                      <Download size={12} /> Download
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Simple Timeline Status History */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <Clock size={18} className="text-primary" /> Status History Timeline
            </h2>
            
            <div className="mt-5 space-y-6 pl-4 border-l border-slate-150 relative text-xs">
              <div className="relative">
                <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-slate-350 border-2 border-white ring-2 ring-slate-200/50" />
                <div>
                  <p className="font-black text-slate-500 uppercase tracking-wider">RFQ Created</p>
                  <p className="font-semibold text-slate-800 mt-0.5">Procurement configuration initialized.</p>
                  {rfq.created_at && (
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      {new Date(rfq.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {rfq.status !== 'draft' && (
                <div className="relative">
                  <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20" />
                  <div>
                    <p className="font-black text-emerald-600 uppercase tracking-wider">RFQ Published</p>
                    <p className="font-semibold text-slate-800 mt-0.5">Assigned lines distributed to selected suppliers.</p>
                    {rfq.issue_date && (
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        {new Date(rfq.issue_date).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {rfq.status === 'closed' && (
                <div className="relative">
                  <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white ring-2 ring-indigo-500/20" />
                  <div>
                    <p className="font-black text-green-600 uppercase tracking-wider">RFQ Closed</p>
                    <p className="font-semibold text-slate-800 mt-0.5">Bidding suspended. Selected bids moving to review.</p>
                    {rfq.updated_at && (
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        {new Date(rfq.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {rfq.status === 'cancelled' && (
                <div className="relative">
                  <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/20" />
                  <div>
                    <p className="font-black text-rose-600 uppercase tracking-wider">RFQ Cancelled</p>
                    <p className="font-semibold text-slate-800 mt-0.5">Request terminated by procurement staff.</p>
                    {rfq.updated_at && (
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        {new Date(rfq.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RFQDetails;
