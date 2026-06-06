import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllVendors } from '../../api/vendorApi';
import { createRFQ } from '../../api/rfqApi';
import RFQForm from '../../components/rfqs/RFQForm';

const initialForm = {
  title: '',
  description: '',
  product_name: '',
  product_details: '',
  quantity: '',
  estimated_budget: '',
  deadline: '',
  status: 'open',
  vendor_ids: []
};

const RFQCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllVendors({ status: 'active', limit: 100 }).then((res) => setVendors(res.data || [])).catch(() => setVendors([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await createRFQ(form);
      navigate(`/rfqs/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create RFQ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D5DFC]">New RFQ</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Create Request For Quotation</h1>
      </div>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
      <RFQForm form={form} vendors={vendors} vendorSearch={vendorSearch} setVendorSearch={setVendorSearch} onChange={setForm} onSubmit={handleSubmit} submitting={submitting} submitLabel="Create RFQ" />
    </div>
  );
};

export default RFQCreate;
