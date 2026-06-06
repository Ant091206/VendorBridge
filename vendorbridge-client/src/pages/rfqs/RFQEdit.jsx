import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllVendors } from '../../api/vendorApi';
import { getRFQById, updateRFQ } from '../../api/rfqApi';
import RFQForm from '../../components/rfqs/RFQForm';

const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const RFQEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getRFQById(id), getAllVendors({ status: 'active', limit: 100 })])
      .then(([rfqRes, vendorRes]) => {
        const rfq = rfqRes.data;
        setForm({
          ...rfq,
          deadline: toLocalInput(rfq.deadline),
          vendor_ids: (rfq.assigned_vendors || []).map((vendor) => vendor.id)
        });
        setVendors(vendorRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load RFQ.'));
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateRFQ(id, form);
      navigate(`/rfqs/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update RFQ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D5DFC]">Edit RFQ</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{form.title}</h1>
      </div>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
      <RFQForm form={form} vendors={vendors} vendorSearch={vendorSearch} setVendorSearch={setVendorSearch} onChange={setForm} onSubmit={handleSubmit} submitting={submitting} submitLabel="Save RFQ" />
    </div>
  );
};

export default RFQEdit;
