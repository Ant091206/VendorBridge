import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, Contact, MapPin, Tag, FileText, Lock } from 'lucide-react';

const VendorForm = ({ defaultValues, categories = [], onSubmit, submitting, submitLabel }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues
  });

  // Reset defaultValues when they change (e.g. when loading vendor details in Edit mode)
  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Company Details Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-green-50 text-primary rounded-xl">
            <Building2 size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">Company Details</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Vendor Code (Read-Only) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              Vendor Code <Lock size={12} className="text-slate-400" />
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                {...register('vendor_code')}
                className="premium-input font-mono font-bold bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                placeholder="Auto-generating..."
              />
            </div>
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Vendor Name *</label>
            <input
              type="text"
              {...register('vendor_name', { required: 'Vendor name is required' })}
              className={`premium-input ${errors.vendor_name ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="Legal name of business"
            />
            {errors.vendor_name && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.vendor_name.message}</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Company Name *</label>
            <input
              type="text"
              {...register('company_name', { required: 'Company name is required' })}
              className={`premium-input ${errors.company_name ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="Operating brand name"
            />
            {errors.company_name && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.company_name.message}</p>
            )}
          </div>

          {/* Supplier Category */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Supplier Category *</label>
            <div className="relative">
              <select
                {...register('category_id', { required: 'Supplier category is required' })}
                className={`premium-input pr-10 cursor-pointer text-slate-700 ${
                  errors.category_id ? 'border-rose-400 focus:ring-rose-200' : ''
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                <Tag size={16} />
              </div>
            </div>
            {errors.category_id && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.category_id.message}</p>
            )}
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">GST Number *</label>
            <input
              type="text"
              {...register('gst_number', {
                required: 'GST number is required',
                pattern: {
                  value: /^[a-zA-Z0-9]{15}$/,
                  message: 'GST number must be exactly 15 characters alphanumeric'
                }
              })}
              className={`premium-input font-mono ${errors.gst_number ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="15-digit GSTIN"
            />
            {errors.gst_number && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.gst_number.message}</p>
            )}
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">PAN Number</label>
            <input
              type="text"
              {...register('pan_number', {
                pattern: {
                  value: /^[a-zA-Z0-9]{10}$/,
                  message: 'PAN number must be exactly 10 characters alphanumeric'
                }
              })}
              className={`premium-input font-mono ${errors.pan_number ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="10-digit PAN"
            />
            {errors.pan_number && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.pan_number.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Verification Status</label>
            <div className="relative">
              <select
                {...register('status')}
                className="premium-input pr-10 cursor-pointer text-slate-700"
              >
                <option value="active">Active (Verified)</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                <Tag size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-green-50 text-primary rounded-xl">
            <Contact size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">Contact Details</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Person */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Contact Person</label>
            <input
              type="text"
              {...register('contact_person')}
              className="premium-input"
              placeholder="Primary contact name"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Email Address *</label>
            <input
              type="email"
              {...register('email', {
                required: 'Vendor email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              })}
              className={`premium-input ${errors.email ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="contact@company.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Phone Number *</label>
            <input
              type="text"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[0-9\s\-()]{10,20}$/,
                  message: 'Phone number must be between 10 and 20 digits'
                }
              })}
              className={`premium-input ${errors.phone ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="Primary phone number"
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Alternate Phone */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Alternate Phone</label>
            <input
              type="text"
              {...register('alternate_phone', {
                pattern: {
                  value: /^\+?[0-9\s\-()]{10,20}$/,
                  message: 'Alternate phone number is invalid'
                }
              })}
              className={`premium-input ${errors.alternate_phone ? 'border-rose-400 focus:ring-rose-200' : ''}`}
              placeholder="Secondary phone number"
            />
            {errors.alternate_phone && (
              <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.alternate_phone.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Address Details Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-green-50 text-primary rounded-xl">
            <MapPin size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">Address Information</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Address Line 1 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Address Line 1</label>
            <input
              type="text"
              {...register('address_line1')}
              className="premium-input"
              placeholder="Street, building details"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Address Line 2</label>
            <input
              type="text"
              {...register('address_line2')}
              className="premium-input"
              placeholder="Apartment, suite, unit details"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">City</label>
            <input
              type="text"
              {...register('city')}
              className="premium-input"
              placeholder="City"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">State</label>
            <input
              type="text"
              {...register('state')}
              className="premium-input"
              placeholder="State"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Country</label>
            <input
              type="text"
              {...register('country')}
              className="premium-input"
              placeholder="Country"
            />
          </div>

          {/* Postal Code (pincode alias handled in parent/service) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Postal / PIN Code</label>
            <input
              type="text"
              {...register('postal_code')}
              className="premium-input"
              placeholder="ZIP / PIN Code"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Composite/Full Address</label>
          <textarea
            {...register('address')}
            className="premium-input min-h-[90px]"
            placeholder="Full address (auto-compiled from parts if left blank)..."
          />
        </div>
      </section>

      {/* Notes Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-green-50 text-primary rounded-xl">
            <FileText size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-900 font-sans tracking-wide">Procurement Notes</h2>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Internal Notes / Comments</label>
          <textarea
            {...register('notes', {
              maxLength: {
                value: 2000,
                message: 'Notes cannot exceed 2000 characters'
              }
            })}
            className={`premium-input min-h-[120px] ${errors.notes ? 'border-rose-400 focus:ring-rose-200' : ''}`}
            placeholder="Internal evaluation notes, past performance ratings, critical terms..."
          />
          {errors.notes && (
            <p className="mt-1.5 text-xs font-bold text-rose-600">{errors.notes.message}</p>
          )}
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 text-sm font-black text-white hover:opacity-95 shadow-premium hover:shadow-premium-hover disabled:opacity-60 transition-all duration-300 cursor-pointer"
        >
          {submitting ? 'Saving changes...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;
