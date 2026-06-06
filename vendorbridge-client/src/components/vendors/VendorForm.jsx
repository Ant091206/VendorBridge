import React from 'react';

const fieldClass = 'h-12 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-semibold text-slate-800 outline-none focus:border-[#6D5DFC]';
const areaClass = 'min-h-28 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#6D5DFC]';

const VendorForm = ({ form, categories = [], onChange, onSubmit, submitting, submitLabel }) => {
  const set = (key, value) => onChange({ ...form, [key]: value });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Company Details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className={fieldClass} value={form.vendor_code || ''} onChange={(e) => set('vendor_code', e.target.value)} placeholder="Vendor Code" required />
          <input className={fieldClass} value={form.vendor_name || ''} onChange={(e) => set('vendor_name', e.target.value)} placeholder="Vendor Name" required />
          <input className={fieldClass} value={form.company_name || ''} onChange={(e) => set('company_name', e.target.value)} placeholder="Company Name" required />
          <select className={fieldClass} value={form.category_id || ''} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input className={fieldClass} value={form.gst_number || ''} onChange={(e) => set('gst_number', e.target.value)} placeholder="GST Number" required />
          <input className={fieldClass} value={form.pan_number || ''} onChange={(e) => set('pan_number', e.target.value)} placeholder="PAN Number" />
          <select className={fieldClass} value={form.status || 'active'} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-slate-950">Contact & Address</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className={fieldClass} value={form.contact_person || ''} onChange={(e) => set('contact_person', e.target.value)} placeholder="Contact Person" />
          <input className={fieldClass} type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="Email" required />
          <input className={fieldClass} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" />
          <input className={fieldClass} value={form.alternate_phone || ''} onChange={(e) => set('alternate_phone', e.target.value)} placeholder="Alternate Phone" />
          <input className={fieldClass} value={form.address_line1 || ''} onChange={(e) => set('address_line1', e.target.value)} placeholder="Address Line 1" />
          <input className={fieldClass} value={form.address_line2 || ''} onChange={(e) => set('address_line2', e.target.value)} placeholder="Address Line 2" />
          <input className={fieldClass} value={form.city || ''} onChange={(e) => set('city', e.target.value)} placeholder="City" />
          <input className={fieldClass} value={form.state || ''} onChange={(e) => set('state', e.target.value)} placeholder="State" />
          <input className={fieldClass} value={form.country || 'India'} onChange={(e) => set('country', e.target.value)} placeholder="Country" />
          <input className={fieldClass} value={form.postal_code || ''} onChange={(e) => set('postal_code', e.target.value)} placeholder="Postal Code" />
        </div>
        <textarea className={`${areaClass} mt-4 w-full`} value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Full Address" />
      </section>

      <div className="flex justify-end">
        <button disabled={submitting} className="rounded-2xl bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;
