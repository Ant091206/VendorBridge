import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { getRFQById } from '../../api/rfqApi';
import RFQStatusBadge from '../../components/rfqs/RFQStatusBadge';

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const item = (label, value) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800">{value || '-'}</p>
  </div>
);

const RFQDetails = () => {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getRFQById(id).then((res) => setRfq(res.data)).catch((err) => setError(err.response?.data?.message || 'Unable to load RFQ.'));
  }, [id]);

  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>;
  if (!rfq) return <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />;

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] bg-gradient-to-br from-[#6D5DFC] via-[#A855F7] to-[#22D3EE] p-7 text-white shadow-[0_24px_80px_rgba(109,93,252,0.28)]">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">{rfq.rfq_number}</p>
            <h1 className="mt-3 text-4xl font-black">{rfq.title}</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold text-white/80">{rfq.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <RFQStatusBadge status={rfq.status} />
            <Link to={`/rfqs/${id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#6D5DFC]">
              <Edit size={16} /> Edit
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-black text-slate-950">RFQ Information</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {item('Product Name', rfq.product_name)}
            {item('Quantity', rfq.quantity)}
            {item('Estimated Budget', money(rfq.estimated_budget))}
            {item('Vendor Count', rfq.assigned_vendors_count)}
            {item('Created By', rfq.created_by_name)}
            {item('Created Date', date(rfq.created_at))}
            {item('Deadline', date(rfq.deadline))}
          </div>
        </section>
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-black text-slate-950">Product Details</h2>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{rfq.product_details}</p>
        </section>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Assigned Vendors</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(rfq.assigned_vendors || []).map((vendor) => (
            <div key={vendor.id} className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="font-black text-slate-950">{vendor.vendor_name}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{vendor.company_name} · {vendor.email}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RFQDetails;
