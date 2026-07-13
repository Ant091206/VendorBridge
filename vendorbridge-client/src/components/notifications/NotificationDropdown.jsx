import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BellRing } from 'lucide-react';
import NotificationCard from './NotificationCard';

const NotificationDropdown = ({ 
  notifications, 
  unreadCount, 
  onMarkRead, 
  onMarkAllRead, 
  onClose,
  role
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h4 className="text-sm font-black text-slate-950">Notifications</h4>
          {unreadCount > 0 && (
            <p className="text-[11px] text-[#22C55E] font-bold mt-0.5">
              You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-green-50/50 px-2.5 py-1.5 text-xs font-bold text-[#22C55E] transition hover:bg-[#22C55E] hover:text-white"
          >
            <Check size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto p-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3">
              <BellRing size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-400">All caught up!</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">No new notifications received.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} onClick={onClose}>
              <NotificationCard 
                notification={n} 
                onMarkRead={onMarkRead}
                role={role}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center">
        <button
          onClick={handleViewAll}
          className="w-full text-xs font-bold text-[#22C55E] transition hover:text-[#16A34A]"
        >
          View All Notifications →
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
