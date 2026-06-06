import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/reportApi';
import { getRecentLogs } from '../api/activityApi';

/**
 * NotificationBell Component
 * Shows a bell icon with a badge count and a dropdown of recent notifications.
 * Auto-refreshes every 60 seconds.
 */

// ── Time ago formatter ──
const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isManager = user?.role === 'manager';

  const fetchData = async () => {
    try {
      // Fetch count based on role
      if (isAdmin || isOfficer || isManager) {
        const statsRes = await getDashboardStats().catch(() => null);
        if (statsRes?.status === 'success') {
          setCount(statsRes.data.pending_approvals || 0);
        }
      }

      // Fetch recent activity for dropdown
      if (isAdmin || isOfficer) {
        const logsRes = await getRecentLogs().catch(() => null);
        if (logsRes?.status === 'success') {
          setNotifications((logsRes.data || []).slice(0, 5));
        }
      }
    } catch (err) {
      console.error('NotificationBell fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Action icon mapping
  const getIcon = (action) => {
    if (!action) return '🔔';
    if (action.includes('RFQ')) return '📋';
    if (action.includes('QUOTATION')) return '💬';
    if (action.includes('APPROVAL') && action.includes('APPROVED')) return '✅';
    if (action.includes('APPROVAL') && action.includes('REJECTED')) return '❌';
    if (action.includes('PO')) return '📦';
    if (action.includes('INVOICE')) return '🧾';
    return '🔔';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-[#F8FAFC] transition hover:bg-white"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="border-b border-slate-100 px-4 py-3">
            <h4 className="text-sm font-bold text-slate-950">Notifications</h4>
            {count > 0 && (
              <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                {count} pending approval{count !== 1 ? 's' : ''} require attention
              </p>
            )}
          </div>

          <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No recent activity
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
                  onClick={() => {
                    setOpen(false);
                    // Navigate based on entity type
                    if (n.entity_type === 'rfq') navigate(`/rfqs/${n.entity_id}`);
                    else if (n.entity_type === 'approval') navigate(`/approvals/${n.entity_id}`);
                    else if (n.entity_type === 'purchase_order') navigate(`/purchase-orders/${n.entity_id}`);
                    else if (n.entity_type === 'invoice') navigate(`/invoices/${n.entity_id}`);
                    else if (n.entity_type === 'quotation') navigate('/quotations');
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{getIcon(n.action)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {n.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {n.user_name || 'System'} · {n.entity_type} #{n.entity_id}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {isAdmin && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); navigate('/activity-logs'); }}
                className="w-full text-center text-xs font-semibold text-[#6D5DFC] transition hover:text-[#A855F7]"
              >
                View All Activity →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
