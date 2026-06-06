import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVendor, getVendorCategories } from '../../api/vendorApi';
import VendorForm from '../../components/vendors/VendorForm';

const initialForm = {
  vendor_code: '',
  vendor_name: '',
  company_name: '',
  category_id: '',
  gst_number: '',
  pan_number: '',
  contact_person: '',
  email: '',
  phone: '',
  alternate_phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  country: 'India',
  postal_code: '',
  status: 'active'
};

const VendorCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getVendorCategories().then((res) => setCategories(res.data || [])).catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await createVendor(form);
      navigate(`/vendors/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D5DFC]">New Vendor</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Add Supplier Company</h1>
      </div>
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
      <VendorForm form={form} categories={categories} onChange={setForm} onSubmit={handleSubmit} submitting={submitting} submitLabel="Create Vendor" />
    </div>
  );
};

export default VendorCreate;
