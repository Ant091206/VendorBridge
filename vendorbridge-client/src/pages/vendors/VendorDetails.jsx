import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { getVendorById } from '../../api/vendorApi';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge';

const item = (label, value) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800">{value || '-'}</p>
  </div>
);

const VendorDetails = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getVendorById(id).then((res) => setVendor(res.data)).catch((err) => setError(err.response?.data?.message || 'Unable to load vendor.'));
  }, [id]);

  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>;
  if (!vendor) return <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />;

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] bg-gradient-to-br from-[#6D5DFC] via-[#A855F7] to-[#22D3EE] p-7 text-white shadow-[0_24px_80px_rgba(109,93,252,0.28)]">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">{vendor.vendor_code}</p>
            <h1 className="mt-3 text-4xl font-black">{vendor.vendor_name || vendor.name}</h1>
            <p className="mt-2 text-sm font-bold text-white/80">{vendor.company_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <VendorStatusBadge status={vendor.status} />
            <Link to={`/vendors/${id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-[#6D5DFC]">
              <Edit size={16} /> Edit
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-black text-slate-950">Company Information</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {item('Category', vendor.category_name)}
            {item('GST Number', vendor.gst_number)}
            {item('PAN Number', vendor.pan_number)}
            {item('Created By', vendor.created_by_name)}
          </div>
        </section>
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-black text-slate-950">Contact Details</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {item('Contact Person', vendor.contact_person)}
            {item('Email', vendor.email)}
            {item('Phone', vendor.phone)}
            {item('Alternate Phone', vendor.alternate_phone)}
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Address</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {item('Address Line 1', vendor.address_line1)}
          {item('Address Line 2', vendor.address_line2)}
          {item('City', vendor.city)}
          {item('State', vendor.state)}
          {item('Country', vendor.country)}
          {item('Postal Code', vendor.postal_code)}
        </div>
      </section>
    </div>
  );
};

export default VendorDetails;
