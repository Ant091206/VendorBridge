import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Edit, ArrowLeft, Building2, Tag, Calendar, User, Mail, Phone, MapPin, FileText, CheckCircle, Clock, ShoppingBag, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { getVendorById, patchVendorStatus } from '../../api/vendorApi';
import { useAuth } from '../../context/AuthContext';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge';
import Toast from '../../components/Toast';

const item = (label, value) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col justify-between">
    <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{value || '-'}</p>
  </div>
);

const VendorDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadVendor = () => {
    getVendorById(id)
      .then((res) => setVendor(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load vendor.'));
  };

  useEffect(() => {
    loadVendor();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await patchVendorStatus(id, newStatus);
      if (res.status === 'success' && res.data) {
        setVendor(res.data);
      } else {
        loadVendor();
      }
      setToastMessage(`Vendor status changed to ${newStatus}.`);
      setToastType('success');
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Error updating status.');
      setToastType('error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <Link to="/vendors" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Vendors
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">{error}</div>
      </div>
    );
  }

  if (!vendor) return <div className="h-[450px] animate-pulse rounded-[32px] bg-slate-200/80 max-w-6xl mx-auto" />;

  const isWritable = ['admin', 'officer'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
          <Link to="/vendors" className="hover:text-primary transition-colors">Vendors</Link>
          <span>/</span>
          <span className="text-slate-600">{vendor.vendor_code}</span>
        </div>
        <div className="flex items-center justify-between">
          <Link to="/vendors" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to List
          </Link>
          <div className="flex items-center gap-3">
            {/* Quick Edit */}
            {isWritable && (
              <Link
                to={`/vendors/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-2.5 text-xs font-black text-slate-700 hover:text-primary hover:border-primary/20 transition-all"
              >
                <Edit size={14} /> Edit Profile
              </Link>
            )}

            {/* Quick Status Patch Dropdown (Admin Only) */}
            {isAdmin && (
              <div className="relative">
                <select
                  disabled={updatingStatus}
                  value={vendor.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm pl-4 pr-10 py-2.5 text-xs font-black text-slate-700 hover:border-primary/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-50"
                >
                  <option value="active">Set Active</option>
                  <option value="inactive">Set Inactive</option>
                  <option value="blacklisted">Set Blacklisted</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
                  <Clock size={12} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Profile Card */}
      <section className="rounded-[32px] bg-gradient-to-br from-primary via-purple-600 to-indigo-650 p-8 text-white shadow-premium-hover relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-1/4 translate-y-1/4 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
        
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="flex gap-4 items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg shrink-0">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-[0.16em] bg-white/15 px-2.5 py-1 rounded-full border border-white/10">
                  {vendor.vendor_code}
                </span>
                <span className="text-xs font-black uppercase tracking-[0.16em] bg-green-500/30 px-2.5 py-1 rounded-full border border-purple-400/20">
                  {vendor.category_name || 'General Supplier'}
                </span>
              </div>
              <h1 className="mt-3.5 text-3xl md:text-4xl font-black tracking-tight">{vendor.vendor_name || vendor.name}</h1>
              <p className="mt-1 text-sm font-semibold text-white/70">{vendor.company_name}</p>
            </div>
          </div>
          <div className="shrink-0 flex items-center self-start bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
            <span className="mr-2 text-xs font-bold text-white/60">Status:</span>
            <VendorStatusBadge status={vendor.status} />
          </div>
        </div>
      </section>

      {/* Main Info Columns */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          {/* Company & Contact Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <Building2 size={18} className="text-primary" /> Company Details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {item('Vendor Name', vendor.vendor_name)}
              {item('Company Brand Name', vendor.company_name)}
              {item('GST Identification (GSTIN)', vendor.gst_number)}
              {item('Permanent Account Number (PAN)', vendor.pan_number)}
            </div>
          </section>

          {/* Contact Details Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <Mail size={18} className="text-primary" /> Contacts & Verification
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {item('Primary Representative', vendor.contact_person)}
              {item('Email Address', vendor.email)}
              {item('Phone Number', vendor.phone)}
              {item('Alternate Phone', vendor.alternate_phone)}
              {item('Created By', vendor.created_by_name)}
              {item('Last Updated By', vendor.updated_by_name || vendor.created_by_name)}
            </div>
          </section>

          {/* Address Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <MapPin size={18} className="text-primary" /> Location Details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {item('Address Line 1', vendor.address_line1)}
              {item('Address Line 2', vendor.address_line2)}
              {item('City', vendor.city)}
              {item('State', vendor.state)}
              {item('Country', vendor.country)}
              {item('Postal / PIN Code', vendor.postal_code || vendor.pincode)}
            </div>
            <div className="mt-4">
              {item('Complete Composite Address', vendor.address)}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Procurement Statistics (Placeholder KPI Metrics) */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <ShoppingBag size={18} className="text-primary" /> Procurement Statistics
            </h2>
            
            <div className="mt-5 grid gap-4 grid-cols-2">
              {/* Total RFQs Assigned */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black uppercase tracking-wider">RFQs Assigned</span>
                  <FileSpreadsheet size={16} />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">0</p>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Active RFQ linkages</span>
              </div>

              {/* Quotations Submitted */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black uppercase tracking-wider">Quotes Sent</span>
                  <Clock size={16} />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">0</p>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Submitted responses</span>
              </div>

              {/* Purchase Orders */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black uppercase tracking-wider">POs Awarded</span>
                  <Award size={16} />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">0</p>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Fulfillment orders</span>
              </div>

              {/* Spends */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black uppercase tracking-wider">Total Spends</span>
                  <span className="text-xs font-bold font-mono">₹</span>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">₹0.00</p>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Processed accounts</span>
              </div>
            </div>
          </section>

          {/* Notes Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <FileText size={18} className="text-primary" /> Procurement Evaluation Notes
            </h2>
            <div className="mt-4 bg-green-50/40 rounded-2xl p-5 border border-purple-100/50 text-slate-700 text-sm font-semibold leading-relaxed min-h-[140px] whitespace-pre-wrap">
              {vendor.notes || (
                <span className="text-slate-400 italic">No notes or evaluations registered for this supplier profile. Click Edit to add procurement logs.</span>
              )}
            </div>
          </section>

          {/* Activity Timeline Card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
              <Clock size={18} className="text-primary" /> Profile Audit Log
            </h2>
            
            <div className="mt-5 space-y-6 pl-4 border-l border-slate-150 relative">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white ring-2 ring-primary/20" />
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">Profile Registered</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Supplier company added to ERP database.</p>
                  {vendor.created_at && (
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      {new Date(vendor.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Event 2 */}
              {vendor.updated_at && vendor.updated_at !== vendor.created_at && (
                <div className="relative">
                  <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white ring-2 ring-purple-500/20" />
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400">Profile Edited</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Vendor details updated by staff.</p>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      {new Date(vendor.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
