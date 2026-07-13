import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  archiveNotification,
  deleteNotification
} from '../../api/notificationApi';
import NotificationCard from '../../components/notifications/NotificationCard';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { Bell, CheckSquare, Filter, Search } from 'lucide-react';

/**
 * Notifications Page Component
 * Displays user notification feed categorized by status tabs (unread, read, archived).
 */
const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unread'); // unread, read, archived, all
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        type: type || undefined,
        sort
      };

      if (filter === 'unread') params.status = 'Unread';
      if (filter === 'read') params.status = 'Read';
      if (filter === 'archived') params.status = 'Archived';
      // If admin, they can optionally view all notifications in system
      if (user?.role === 'admin' && filter === 'all') params.all = 'true';

      const res = await getNotifications(params);
      if (res.status === 'success') {
        setNotifications(res.data || []);
        setTotal(res.total || res.data?.length || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to fetch notification list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filter, page, type, sort, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setToastType('success');
      setToastMessage('Notification marked as read.');
      fetchList();
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to mark notification as read.');
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveNotification(id);
      setToastType('success');
      setToastMessage('Notification archived.');
      fetchList();
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to archive notification.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setToastType('success');
      setToastMessage('Notification deleted.');
      fetchList();
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to dismiss notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setToastType('success');
      setToastMessage('All notifications marked as read.');
      fetchList();
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Inboxes</p>
          <h1 className="text-3xl font-black text-slate-950 font-sans">Notification Center</h1>
          <p className="text-sm font-semibold text-slate-500">
            Stay updated with procurement events, quotation submissions, and approval statuses.
          </p>
        </div>
        
        {filter === 'unread' && notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary bg-white px-5 py-3 text-sm font-black text-primary hover:bg-primary hover:text-white transition duration-150 shadow-premium cursor-pointer"
          >
            <CheckSquare size={16} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-premium max-w-sm">
        {[
          { key: 'unread', label: 'Unread' },
          { key: 'read', label: 'Read' },
          { key: 'archived', label: 'Archived' },
          { key: 'all', label: 'All Logs' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key);
              setPage(1);
            }}
            className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition duration-150 cursor-pointer ${
              filter === tab.key
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-premium md:grid-cols-[1fr_180px_180px_auto]"
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input pl-10"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        <div className="relative">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="premium-input pr-10 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="System">System</option>
            <option value="RFQ">RFQ</option>
            <option value="Quotation">Quotation</option>
            <option value="Approval">Approval</option>
            <option value="Purchase Order">Purchase Order</option>
            <option value="Invoice">Invoice</option>
          </select>
          <Filter className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="premium-input cursor-pointer"
        >
          <option value="created_desc">Newest first</option>
          <option value="created_asc">Oldest first</option>
          <option value="type_asc">Type A-Z</option>
          <option value="status_asc">Status A-Z</option>
        </select>

        <button
          type="submit"
          className="rounded-2xl bg-primary px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/10 transition hover:bg-primary-hover"
        >
          Search
        </button>
      </form>

      {/* Content List */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-slate-200/80" />
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-premium">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-500 mx-auto mb-4">
            <Bell size={24} />
          </div>
          <h3 className="text-lg font-black text-slate-900">Notifications Empty</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
            No notifications match your current filter. You're completely up to date!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          {notifications.map(n => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
              onArchive={handleArchive}
              onDelete={handleDelete}
              role={user?.role}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4 text-sm font-bold text-slate-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
