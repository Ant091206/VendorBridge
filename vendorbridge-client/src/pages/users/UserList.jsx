import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, Edit, UserX, UserCheck, ChevronLeft, ChevronRight, Users } from 'lucide-react';
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
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  officer: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  manager: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  vendor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
};

const roleLabels = {
  admin: 'Admin',
  officer: 'Procurement Officer',
  manager: 'Manager',
  vendor: 'Vendor'
};

const statusBadgeColors = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/20'
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all system users, roles, and access permissions."
        actions={
          <button
            onClick={() => navigate('/users/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-cyan-400 hover:to-indigo-500 hover:shadow-indigo-500/30"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="block w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </form>

        {/* Role Filter */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-slate-500" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-9 pr-8 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="officer">Procurement Officer</option>
            <option value="manager">Manager</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="appearance-none rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 px-4 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Data Table */}
      {loading ? (
        <LoadingSkeleton rows={8} cols={6} />
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
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3.5 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-800/30">
                    {/* Name with Avatar */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 text-sm font-bold text-white uppercase border border-slate-700/50">
                          {user.name ? user.name[0] : 'U'}
                        </div>
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-slate-400">{user.email}</td>

                    {/* Role Badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${roleBadgeColors[user.role] || ''}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadgeColors[user.status] || ''}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {user.status === 'active' ? 'Active' : 'Inactive'}
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500/30 hover:bg-slate-800 hover:text-cyan-400"
                          title="Edit User"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleDeactivate(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/30 hover:bg-red-950/20 hover:text-red-400"
                            title="Deactivate User"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Deactivate
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/50 bg-slate-900/30 px-3 py-1.5 text-xs font-medium text-slate-600">
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
            <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3.5 bg-slate-950/30">
              <p className="text-xs text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-600">…</span>
                      )}
                      <button
                        onClick={() => fetchUsers(p)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                          p === pagination.page
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'border border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white'
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
                  className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
