import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createVendor, getVendorCategories, generateVendorCode } from '../../api/vendorApi';
import VendorForm from '../../components/vendors/VendorForm';
import { ArrowLeft } from 'lucide-react';

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
  address: '',
  notes: '',
  status: 'active'
};

const VendorCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch categories
    getVendorCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));

    // Generate Vendor Code
    generateVendorCode()
      .then((res) => {
        if (res.status === 'success' && res.data?.vendor_code) {
          setForm((prev) => ({ ...prev, vendor_code: res.data.vendor_code }));
        }
      })
      .catch((err) => {
        console.error('Failed to generate vendor code:', err);
      });
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await createVendor(formData);
      navigate(`/vendors/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Breadcrumb Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
          <Link to="/vendors" className="hover:text-primary transition-colors">Vendors</Link>
          <span>/</span>
          <span className="text-slate-600">New Vendor</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 font-sans tracking-tight">Add Supplier Company</h1>
            <p className="text-sm text-slate-500 mt-1">Register a new verified vendor profile to the ERP database.</p>
          </div>
          <Link
            to="/vendors"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={16} /> Back to List
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm animate-shake">
          {error}
        </div>
      )}

      <VendorForm
        defaultValues={form}
        categories={categories}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create Vendor"
      />
    </div>
  );
};

export default VendorCreate;
