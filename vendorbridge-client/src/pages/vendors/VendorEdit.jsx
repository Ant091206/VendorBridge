import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getVendorById, getVendorCategories, updateVendor } from '../../api/vendorApi';
import VendorForm from '../../components/vendors/VendorForm';
import { ArrowLeft } from 'lucide-react';

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

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      await updateVendor(id, formData);
      navigate(`/vendors/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Premium Breadcrumb Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
          <Link to="/vendors" className="hover:text-primary transition-colors">Vendors</Link>
          <span>/</span>
          <Link to={`/vendors/${id}`} className="hover:text-primary transition-colors">{form.vendor_name || form.name}</Link>
          <span>/</span>
          <span className="text-slate-600">Edit</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 font-sans tracking-tight">Edit Supplier</h1>
            <p className="text-sm text-slate-500 mt-1">Modify information for {form.vendor_name || form.name}.</p>
          </div>
          <Link
            to={`/vendors/${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-primary transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={16} /> Cancel & Exit
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      <VendorForm
        defaultValues={form}
        categories={categories}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save Vendor Changes"
      />
    </div>
  );
};

export default VendorEdit;
