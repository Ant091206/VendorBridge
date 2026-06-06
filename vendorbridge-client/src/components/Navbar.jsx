import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Search } from 'lucide-react';

/**
 * Navbar Component
 * Top navigation bar with VendorBridge logo, current page title,
 * notification bell, and user avatar dropdown.
 *
 * Props:
 *   pageTitle {string} — Current page title (optional)
 */
const Navbar = ({ pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Derive page title from path if not provided
  const derivedTitle = pageTitle || (() => {
    const path = location.pathname.replace('/', '');
    if (!path || path === 'dashboard') return 'Dashboard';
    return path.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  })();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role badge colors
  const roleBadgeClass = {
    admin: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    officer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    manager: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    vendor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }[user?.role] || 'bg-slate-800 text-slate-400 border-slate-700';

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 backdrop-blur-sm print:hidden">
      {/* Left: Logo + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DFC] to-[#22D3EE] shadow-md shadow-indigo-500/25">
          <span className="text-[11px] font-black text-white">VB</span>
        </div>
        {derivedTitle && (
          <h2 className="hidden truncate text-base font-black text-slate-950 md:block">{derivedTitle}</h2>
        )}
      </div>

      {/* Right: Bell + Avatar */}
      <div className="flex shrink-0 items-center gap-3">
        <label className="hidden h-10 w-72 items-center gap-2 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3 text-slate-400 lg:flex">
          <Search size={17} />
          <input className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" placeholder="Search procurement..." />
        </label>
        <NotificationBell />

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DFC] to-[#A855F7] text-sm font-bold uppercase text-white shadow-lg shadow-indigo-500/20 transition"
            aria-label="User menu"
          >
            {user?.name ? user.name[0] : 'U'}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
              {/* Profile info */}
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="truncate text-sm font-bold text-slate-950">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass}`}>
                  {user?.role}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/activity-logs'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.28 15H18" />
                  </svg>
                  My Activity
                </button>
              </div>

              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
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
