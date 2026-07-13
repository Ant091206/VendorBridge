import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Search, ChevronRight, User, Activity, LogOut, Settings } from 'lucide-react';

// ── Path → breadcrumb label map ──
const breadcrumbMap = {
  '/dashboard': 'Dashboard',
  '/rfqs': 'RFQs',
  '/rfqs/create': 'New RFQ',
  '/quotations': 'Quotations',
  '/quotations/vendor': 'My Quotations',
  '/approvals': 'Approvals',
  '/approvals/queue': 'Approval Queue',
  '/purchase-orders': 'Purchase Orders',
  '/invoices': 'Invoices',
  '/vendors': 'Vendors',
  '/vendor-categories': 'Vendor Categories',
  '/users': 'Users',
  '/users/create': 'New User',
  '/reports': 'Reports',
  '/activity-logs': 'Activity Logs',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/vendor/my-orders': 'My Orders',
  '/vendor/my-invoices': 'My Invoices',
};

const getBreadcrumbs = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [];

  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    const label = breadcrumbMap[currentPath];
    if (label) {
      crumbs.push({ path: currentPath, label });
    } else {
      // Capitalize dynamic segment (e.g. IDs)
      crumbs.push({ path: currentPath, label: part.charAt(0).toUpperCase() + part.slice(1) });
    }
  }
  return crumbs;
};

const roleBadgeConfig = {
  admin:   { bg: '#FEE2E2', text: '#B91C1C',  label: 'Admin' },
  officer: { bg: '#DCFCE7', text: '#15803D',  label: 'Officer' },
  manager: { bg: '#FEF3C7', text: '#B45309',  label: 'Manager' },
  vendor:  { bg: '#DBEAFE', text: '#1D4ED8',  label: 'Vendor' },
  finance: { bg: '#F3E8FF', text: '#7C3AED',  label: 'Finance' },
};

const Navbar = ({ pageTitle, sidebarCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const roleConfig = roleBadgeConfig[user?.role] || { bg: '#F3F4F6', text: '#6B7280', label: user?.role };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: press '/' to focus search
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-25 flex h-14 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-5 shrink-0 print:hidden">
      {/* ── Left: Breadcrumbs ── */}
      <div className="flex items-center gap-1.5 min-w-0 text-sm">
        {breadcrumbs.length <= 1 ? (
          <span className="font-semibold text-[#111827] truncate">
            {breadcrumbs[0]?.label || pageTitle || 'Dashboard'}
          </span>
        ) : (
          breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-[#D1D5DB]" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-[#111827] truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="text-[#6B7280] hover:text-[#111827] transition-colors duration-100 truncate max-w-[120px] cursor-pointer"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* ── Right: Search + Bell + Avatar ── */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Search */}
        <label
          className={`hidden lg:flex items-center gap-2 h-8 w-64 px-3 rounded-[6px] border transition-all duration-150 cursor-text ${
            searchFocused
              ? 'border-[#16A34A] bg-white shadow-[0_0_0_3px_rgba(22,163,74,0.1)]'
              : 'border-[#E5E7EB] bg-[#F9FAFB]'
          }`}
        >
          <Search size={14} className="shrink-0 text-[#9CA3AF]" />
          <input
            ref={searchRef}
            className="flex-1 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF]"
            placeholder="Search..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {!searchFocused && (
            <span className="hidden xl:flex items-center gap-0.5 text-xs text-[#9CA3AF] font-mono">
              <kbd className="px-1 py-0.5 text-[10px] bg-[#F3F4F6] border border-[#E5E7EB] rounded">/</kbd>
            </span>
          )}
        </label>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="user-menu-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 hover:bg-[#F3F4F6] transition-colors duration-100 cursor-pointer"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#16A34A] text-white text-xs font-semibold uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[#111827] leading-tight">{user?.name}</p>
            </div>
          </button>

          {/* Dropdown Panel */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-4px_rgba(0,0,0,0.04)] animate-slide-down overflow-hidden"
            >
              {/* Profile info */}
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <p className="text-sm font-semibold text-[#111827] truncate">{user?.name}</p>
                <p className="text-xs text-[#6B7280] truncate mt-0.5">{user?.email}</p>
                <span
                  className="mt-2 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium capitalize"
                  style={{ backgroundColor: roleConfig.bg, color: roleConfig.text }}
                >
                  {roleConfig.label}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors duration-100 cursor-pointer"
                >
                  <User size={15} className="text-[#9CA3AF]" />
                  Profile &amp; Settings
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/activity-logs'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors duration-100 cursor-pointer"
                >
                  <Activity size={15} className="text-[#9CA3AF]" />
                  My Activity
                </button>
              </div>

              <div className="border-t border-[#F3F4F6] py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] transition-colors duration-100 cursor-pointer"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
