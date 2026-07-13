import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, Edit, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { getUsers, deleteUser } from '../../api/userApi';

/**
 * UserList Page — Admin-only user management table.
 * Features: search, role filter, status filter, pagination, activate/deactivate actions.
 */

const roleBadgeColors = {
  admin: 'bg-red-50 text-red-600 border-red-200',
  officer: 'bg-primary/5 text-primary border-primary/20',
  manager: 'bg-amber-50 text-amber-600 border-amber-200',
  vendor: 'bg-emerald-50 text-emerald-600 border-emerald-200'
};

const roleLabels = {
  admin: 'Admin',
  officer: 'Procurement Officer',
  manager: 'Manager',
  vendor: 'Vendor'
};

const statusBadgeColors = {
  active:    'bg-emerald-50 text-emerald-600 border-emerald-100',
  inactive:  'bg-slate-50 text-slate-500 border-slate-200',
  suspended: 'bg-amber-50 text-amber-600 border-amber-200'
};

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await getUsers(params);
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      setToast({ message: 'Failed to load users.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Are you sure you want to deactivate "${user.name}"?`)) return;

    try {
      await deleteUser(user.id);
      setToast({ message: `"${user.name}" has been deactivated.`, type: 'success' });
      fetchUsers(pagination.page);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to deactivate user.';
      setToast({ message: msg, type: 'error' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Administration</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 font-sans">User Management</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Manage all system users, roles, and access permissions.
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/users/create')}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-500/10 hover:opacity-95 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-premium sm:grid-cols-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="premium-input pl-10"
          />
        </form>

        {/* Role Filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="premium-input pr-10 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="officer">Procurement Officer</option>
            <option value="manager">Manager</option>
            <option value="vendor">Vendor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            <Filter size={14} />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="premium-input cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-[24px] bg-slate-200/80" />
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Users Found"
          message={search || roleFilter || statusFilter
            ? 'No users match your current filters. Try adjusting your search criteria.'
            : 'No users have been created yet. Click "Create User" to add the first one.'
          }
          actionLabel="Create User"
          onAction={() => navigate('/users/create')}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                    {/* Name with Avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-extrabold text-white uppercase shadow-md shadow-purple-500/10">
                          {user.name ? user.name[0] : 'U'}
                        </div>
                        <span className="font-bold text-slate-900">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-slate-650">{user.email}</td>

                    {/* Role Badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${roleBadgeColors[user.role] || ''}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadgeColors[user.status] || statusBadgeColors.inactive}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'suspended' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        {user.status === 'active' ? 'Active' : user.status === 'suspended' ? 'Suspended' : 'Inactive'}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-primary/20 hover:text-primary cursor-pointer"
                          title="Edit User"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleDeactivate(user)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Deactivate User"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Deactivate
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400">
                            <UserCheck className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 bg-slate-50/30">
              <p className="text-xs font-bold text-slate-400">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400 text-xs">…</span>
                      )}
                      <button
                        onClick={() => fetchUsers(p)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer ${
                          p === pagination.page
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))
                }
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      )}
    </div>
  );
};

export default UserList;
