import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import {
  User, Mail, Shield, Calendar, Clock, Save, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle, Edit3, X
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import { getProfile, updateProfile, changePassword } from '../../api/userApi';

/**
 * Profile Page — Self-service profile management for all authenticated users.
 * Two card sections: Profile Information (editable name/email) and Change Password.
 */

const roleLabels = {
  admin: 'Administrator',
  officer: 'Procurement Officer',
  manager: 'Manager',
  vendor: 'Vendor'
};

const roleBadgeColors = {
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  officer: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  manager: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  vendor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
};

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

  // Profile form
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors }
  } = useForm();

  // Password form
  const {
    register: passwordRegister,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors }
  } = useForm();

  const newPassword = watchPassword('newPassword');

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        const data = response.data.data;
        setProfileData(data);
        resetProfile({ name: data.name, email: data.email });
      } catch (err) {
        setToast({ message: 'Failed to load profile.', type: 'error' });
      }
    };
    fetchProfile();
  }, [resetProfile]);

  const handleProfileUpdate = async (data) => {
    setProfileLoading(true);
    try {
      const response = await updateProfile({ name: data.name, email: data.email });
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and security settings."
      />

      <div className="mx-auto max-w-3xl space-y-6">
        {/* ── Profile Information Card ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl backdrop-blur overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20">
                <User className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Profile Information</h3>
                <p className="text-xs text-slate-500">Your personal details and account info</p>
              </div>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500/30 hover:bg-slate-800 hover:text-cyan-400"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditMode(false);
                  if (profileData) resetProfile({ name: profileData.name, email: profileData.email });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/30 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>

          {/* Card Body */}
          <div className="p-6">
            {profileData ? (
              editMode ? (
                /* ── Edit Mode ── */
                <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                          type="text"
                          className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition ${
                            profileErrors.name ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                          }`}
                          {...profileRegister('name', { required: 'Name is required' })}
                        />
                      </div>
                      {profileErrors.name && <p className="mt-1.5 text-xs text-red-400">{profileErrors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <Mail className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                          type="email"
                          className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition ${
                            profileErrors.email ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                          }`}
                          {...profileRegister('email', {
                            required: 'Email is required',
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                          })}
                        />
                      </div>
                      {profileErrors.email && <p className="mt-1.5 text-xs text-red-400">{profileErrors.email.message}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50"
                    >
                      {profileLoading ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                /* ── View Mode ── */
                <div className="space-y-5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/20 text-2xl font-bold text-cyan-400">
                      {profileData.name ? profileData.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{profileData.name}</h3>
                      <p className="text-sm text-slate-400">{profileData.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-950/30 p-4">
                      <Shield className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Role</p>
                        <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold mt-1 ${roleBadgeColors[profileData.role] || ''}`}>
                          {roleLabels[profileData.role] || profileData.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-950/30 p-4">
                      <CheckCircle className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold mt-1 ${
                          profileData.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${profileData.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {profileData.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-950/30 p-4">
                      <Calendar className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Member Since</p>
                        <p className="text-sm text-white font-medium mt-0.5">{formatDate(profileData.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-950/30 p-4">
                      <Clock className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Last Login</p>
                        <p className="text-sm text-white font-medium mt-0.5">{formatDateTime(profileData.last_login)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center py-12">
                <svg className="h-6 w-6 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* ── Change Password Card ── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl backdrop-blur overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4 bg-slate-950/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/20">
              <Lock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Change Password</h3>
              <p className="text-xs text-slate-500">Update your password to keep your account secure</p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-5" noValidate>
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition ${
                      passwordErrors.currentPassword ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                    }`}
                    {...passwordRegister('currentPassword', { required: 'Current password is required' })}
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <p className="mt-1.5 text-xs text-red-400">{passwordErrors.currentPassword.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition ${
                        passwordErrors.newPassword ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                      }`}
                      {...passwordRegister('newPassword', {
                        required: 'New password is required',
                        minLength: { value: 8, message: 'Minimum 8 characters' }
                      })}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className="mt-1.5 text-xs text-red-400">{passwordErrors.newPassword.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      className={`block w-full rounded-xl border bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition ${
                        passwordErrors.confirmPassword ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                      }`}
                      {...passwordRegister('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: v => v === newPassword || 'Passwords do not match'
                      })}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{passwordErrors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-400 hover:to-orange-500 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

      {/* Toast */}
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      )}
    </div>
  );
};

export default Profile;
