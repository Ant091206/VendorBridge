import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Lock, Plus, Trash2 } from 'lucide-react';
import { closeRFQ, deleteRFQ, getAllRFQs } from '../../api/rfqApi';
import RFQStatusBadge from '../../components/rfqs/RFQStatusBadge';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const RFQList = () => {
  const [rfqs, setRfqs] = useState([]);
  const [filters, setFilters] = useState({ page: 1, limit: 10, sort: 'created_at' });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllRFQs(filters);
      setRfqs(res.data || []);
      setPagination(res.pagination || { page: 1, total_pages: 1, total: res.results || 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load RFQs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const close = async (id) => {
    await closeRFQ(id);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this RFQ?')) return;
    await deleteRFQ(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D5DFC]">RFQ Management</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Request For Quotations</h1>
        </div>
        <Link to="/rfqs/create" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25">
          <Plus size={18} /> Create RFQ
        </Link>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:grid-cols-[1fr_180px_180px]">
        <input value={filters.search || ''} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-semibold outline-none" placeholder="Search RFQ number, title, product..." />
        <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold outline-none">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filters.sort || 'created_at'} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold outline-none">
          <option value="created_at">Created Date</option>
          <option value="deadline">Deadline</option>
          <option value="title">Title</option>
        </select>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      {loading ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">RFQ Number</th>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Budget</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Deadline</th>
                  <th className="px-5 py-4">Vendors</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-sm font-black text-[#6D5DFC]">{rfq.rfq_number}</td>
                    <td className="px-5 py-4 text-sm font-black text-slate-950">{rfq.title}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{rfq.quantity}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{money(rfq.estimated_budget)}</td>
                    <td className="px-5 py-4"><RFQStatusBadge status={rfq.status} /></td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{date(rfq.deadline)}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{rfq.assigned_vendors_count}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{date(rfq.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/rfqs/${rfq.id}`} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#6D5DFC]"><Eye size={16} /></Link>
                        <Link to={`/rfqs/${rfq.id}/edit`} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#6D5DFC]"><Edit size={16} /></Link>
                        <button onClick={() => close(rfq.id)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#6D5DFC]"><Lock size={16} /></button>
                        <button onClick={() => remove(rfq.id)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600">
        <span>{pagination.total || 0} RFQs</span>
        <div className="flex gap-2">
          <button disabled={(filters.page || 1) <= 1} onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">Previous</button>
          <button disabled={(filters.page || 1) >= (pagination.total_pages || 1)} onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })} className="rounded-xl border border-slate-200 px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
};

export default RFQList;
