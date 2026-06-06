import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notificationApi';
import NotificationCard from '../../components/notifications/NotificationCard';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { Bell, CheckSquare } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unread') params.is_read = 'false';
      if (filter === 'read') params.is_read = 'true';

      const res = await getNotifications(params);
      if (res.status === 'success') {
        setNotifications(res.data || []);
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
  }, [filter, user]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      // Re-fetch list if currently filtering for unread
      if (filter === 'unread') {
        fetchList();
      }
    } catch (err) {
      setToastType('error');
      setToastMessage('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
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
      {/* Toast notifications */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Notification Center" 
          subtitle="Stay updated with procurement events and approval requests"
        />
        
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#6D5DFC] bg-white px-4 py-2.5 text-sm font-bold text-[#6D5DFC] transition duration-150 hover:bg-[#6D5DFC] hover:text-white"
          >
            <CheckSquare size={16} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm max-w-sm">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'read', label: 'Read' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition duration-150 cursor-pointer ${
              filter === tab.key
                ? 'bg-gradient-to-r from-[#6D5DFC] to-[#A855F7] text-white shadow-md shadow-indigo-500/10'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-4 animate-bounce">
            <Bell size={24} />
          </div>
          <h3 className="text-lg font-black text-slate-900">Notifications Empty</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-xs">
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
              role={user?.role}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
