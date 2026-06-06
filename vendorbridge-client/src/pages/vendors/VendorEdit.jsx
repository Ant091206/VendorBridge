import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVendorById, getVendorCategories, updateVendor } from '../../api/vendorApi';
import VendorForm from '../../components/vendors/VendorForm';

const VendorEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getVendorById(id), getVendorCategories()])
      .then(([vendorRes, categoryRes]) => {
        setForm(vendorRes.data);
        setCategories(categoryRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load vendor.'));
  }, [id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateVendor(id, form);
      navigate(`/vendors/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D5DFC]">Edit Vendor</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{form.vendor_name || form.name}</h1>
      </div>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
      <VendorForm form={form} categories={categories} onChange={setForm} onSubmit={handleSubmit} submitting={submitting} submitLabel="Save Vendor" />
    </div>
  );
};

export default VendorEdit;
