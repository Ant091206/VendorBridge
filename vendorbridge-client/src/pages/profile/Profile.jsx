import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import {
  User, Mail, Phone, Shield, Calendar, Clock, Save, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle, Edit3, X, KeyRound, Building2, MapPin, Briefcase
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import { getProfile, updateProfile, changePassword } from '../../api/userApi';
import Spinner from '../../components/Spinner';

const roleLabels = {
  admin: 'Administrator',
  officer: 'Procurement Officer',
  manager: 'Procurement Manager',
  vendor: 'Vendor',
  finance: 'Finance Officer'
};

const roleBadgeColors = {
  admin: 'bg-green-50 text-purple-600 border-green-200',
  officer: 'bg-blue-50 text-blue-600 border-blue-200',
  manager: 'bg-amber-50 text-amber-600 border-amber-200',
  vendor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  finance: 'bg-teal-50 text-teal-600 border-teal-200'
};

/**
 * Profile Page Component
 * Self-service profile management for all authenticated users.
 */
const Profile = () => {
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors }
  } = useForm();

  const {
    register: passwordRegister,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors }
  } = useForm();

  const newPassword = watchPassword('newPassword');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        const data = response.data.data;
        setProfileData(data);
        resetProfile({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          company: data.company || '',
          department: data.department || '',
          address: data.address || ''
        });
      } catch (err) {
        setToast({ message: 'Failed to load profile.', type: 'error' });
      }
    };
    fetchProfile();
  }, [resetProfile]);

  const handleProfileUpdate = async (data) => {
    setProfileLoading(true);
    try {
      const response = await updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        company: data.company || undefined,
        department: data.department || undefined,
        address: data.address || undefined
      });
      const updated = response.data.data;
      setProfileData(updated);
      updateAuthUser({ name: updated.name, email: updated.email });
      setEditMode(false);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (data) => {
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      resetPassword();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setToast({ message: 'Password changed successfully!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="text-3xl font-black text-slate-950 font-sans">Account Profile</h1>
        <p className="text-sm font-semibold text-slate-500">
          Manage your personal information, authorization details, and credentials.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-premium overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 font-sans">Profile Information</h3>
                <p className="text-xs text-slate-500 font-semibold">Your personal details and account info</p>
              </div>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-primary/20 hover:text-primary cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditMode(false);
                  if (profileData) {
                    resetProfile({
                      name: profileData.name,
                      email: profileData.email,
                      phone: profileData.phone || '',
                      company: profileData.company || '',
                      department: profileData.department || '',
                      address: profileData.address || ''
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>

          <div className="p-6">
            {profileData ? (
              editMode ? (
                <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="premium-input pl-10 w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          {...profileRegister('name', { required: 'Name is required' })}
                        />
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                      {profileErrors.name && <p className="mt-1.5 text-xs font-bold text-rose-600">{profileErrors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          className="premium-input pl-10 w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          {...profileRegister('email', {
                            required: 'Email is required',
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' }
                          })}
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                      {profileErrors.email && <p className="mt-1.5 text-xs font-bold text-rose-600">{profileErrors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Phone Number <span className="font-semibold normal-case text-slate-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="+91 9876543210"
                          className="premium-input pl-10 w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          {...profileRegister('phone', {
                            validate: (val) => {
                              if (!val || val.trim() === '') return true;
                              return /^\+?[\d\s\-().]{7,20}$/.test(val.trim()) || 'Please enter a valid phone number';
                            }
                          })}
                        />
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                      {profileErrors.phone && <p className="mt-1.5 text-xs font-bold text-rose-600">{profileErrors.phone.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Company Name <span className="font-semibold normal-case text-slate-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Acme Corp"
                          className="premium-input pl-10 w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          {...profileRegister('company')}
                        />
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Department <span className="font-semibold normal-case text-slate-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. Finance, Procurement"
                          className="premium-input pl-10 w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          {...profileRegister('department')}
                        />
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                        Address <span className="font-semibold normal-case text-slate-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <textarea
                          placeholder="Enter your street address"
                          rows="3"
                          className="premium-input pl-10 w-full rounded-xl border border-slate-200 py-3 pr-4 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          {...profileRegister('address')}
                        />
                        <MapPin className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-black text-white shadow-premium disabled:opacity-60 transition cursor-pointer"
                    >
                      {profileLoading ? (
                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-black text-white shadow-md">
                      {profileData.name ? profileData.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 font-sans">{profileData.name}</h3>
                      <p className="text-sm font-semibold text-slate-500">{profileData.email}</p>
                      {profileData.phone && (
                        <p className="text-sm font-semibold text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />{profileData.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <Shield className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">System Role</p>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider mt-1.5 ${roleBadgeColors[profileData.role] || ''}`}>
                          {roleLabels[profileData.role] || profileData.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <CheckCircle className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Account Status</p>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider mt-1.5 ${
                          profileData.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${profileData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {profileData.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {profileData.company && (
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <Building2 className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Company</p>
                          <p className="text-sm text-slate-900 font-bold mt-1">{profileData.company}</p>
                        </div>
                      </div>
                    )}

                    {profileData.department && (
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <Briefcase className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Department</p>
                          <p className="text-sm text-slate-900 font-bold mt-1">{profileData.department}</p>
                        </div>
                      </div>
                    )}

                    {profileData.address && (
                      <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:col-span-2">
                        <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Address</p>
                          <p className="text-sm text-slate-900 font-bold mt-1 whitespace-pre-line">{profileData.address}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Member Since</p>
                        <p className="text-sm text-slate-900 font-bold mt-1">{formatDate(profileData.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Last Login</p>
                        <p className="text-sm text-slate-900 font-bold mt-1">{formatDateTime(profileData.last_login)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-premium overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-sans">Change Password</h3>
              <p className="text-xs text-slate-500 font-semibold">Update your password to keep your account secure</p>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-5" noValidate>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="premium-input pl-10 pr-11 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    {...passwordRegister('currentPassword', { required: 'Current password is required' })}
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-450 hover:text-slate-700 transition" tabIndex={-1}>
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <p className="mt-1.5 text-xs font-bold text-rose-600">{passwordErrors.currentPassword.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className="premium-input pl-10 pr-11 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      {...passwordRegister('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 8, message: 'Minimum 8 characters' }
                      })}
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-455 hover:text-slate-700 transition" tabIndex={-1}>
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className="mt-1.5 text-xs font-bold text-rose-600">{passwordErrors.newPassword.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      className="premium-input pl-10 pr-11 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      {...passwordRegister('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: v => v === newPassword || 'Passwords do not match'
                      })}
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-455 hover:text-slate-700 transition" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className="mt-1.5 text-xs font-bold text-rose-600">{passwordErrors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-black text-white shadow-premium disabled:opacity-60 transition hover:opacity-90 cursor-pointer"
                >
                  {passwordLoading ? (
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
