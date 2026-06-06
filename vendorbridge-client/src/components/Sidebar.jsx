import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid, Building2, FileText, ClipboardList, CheckCircle2,
  ShoppingCart, Receipt, BarChart3, Activity, Users, UserCircle, LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Define navigations with Lucide icons
  const allNavItems = [
    // ── Staff Navigation ──
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid, roles: ['admin', 'officer', 'manager', 'vendor'] },

    // ── Vendor Navigation ──
    { label: 'RFQs', path: '/rfqs', icon: FileText, roles: ['vendor'] },
    { label: 'My Quotes', path: '/quotations/vendor', icon: ClipboardList, roles: ['vendor'] },
    { label: 'My Orders', path: '/vendor/my-orders', icon: ShoppingCart, roles: ['vendor'] },
    { label: 'My Invoices', path: '/vendor/my-invoices', icon: Receipt, roles: ['vendor'] },

    // ── Admin-Only ──
    { label: 'Users', path: '/users', icon: Users, roles: ['admin'] },

    // ── Procurement ──
    { label: 'Vendors', path: '/vendors', icon: Building2, roles: ['admin', 'officer'] },
    { label: 'RFQs', path: '/rfqs', icon: FileText, roles: ['admin', 'officer'] },
    { label: 'Quotations', path: '/quotations', icon: ClipboardList, roles: ['admin', 'officer'] },
    { label: 'Approvals', path: '/approvals', icon: CheckCircle2, roles: ['admin', 'officer', 'manager'] },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['admin', 'officer', 'manager'] },
    { label: 'Invoices', path: '/invoices', icon: Receipt, roles: ['admin', 'officer'] },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'officer', 'manager'] },
    { label: 'Activity Logs', path: '/activity-logs', icon: Activity, roles: ['admin'] },
  ];

  // Filter items matching user role
  const userRole = user?.role || '';
  const allowedItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white text-slate-600 shadow-[18px_0_60px_rgba(15,23,42,0.04)] print:hidden">
      {/* Brand Logo Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DFC] via-[#A855F7] to-[#22D3EE] shadow-md shadow-indigo-500/25">
          <span className="font-black text-white">VB</span>
        </div>
        <span className="text-lg font-black tracking-normal text-slate-950">
          Vendor<span className="text-[#6D5DFC]">Bridge</span>
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.hash
            ? location.pathname === item.path && location.hash === item.hash
            : !item.hash && location.hash === '' && (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/')));

          // Exact match for dashboard (otherwise /dashboard would match /dashboard-xxx)
          const exactMatch = item.path === '/dashboard'
            ? location.pathname === '/dashboard'
            : isActive || location.pathname === item.path;

          return (
            <Link
              key={item.label + item.path + (item.hash || '')}
              to={item.path + (item.hash || '')}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                exactMatch
                  ? 'bg-[#6D5DFC]/10 text-[#6D5DFC] shadow-inner'
                  : 'hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <div className={exactMatch ? 'text-[#6D5DFC]' : 'text-slate-400'}>
                <Icon size={20} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
        {/* Profile Link */}
        <Link
          to="/profile"
          className={`flex items-center gap-3 rounded-lg px-2 py-3 transition-colors ${
            location.pathname === '/profile'
              ? 'bg-white shadow-sm'
              : 'hover:bg-white'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5DFC] to-[#A855F7] font-bold text-white uppercase">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-bold text-slate-950">{user?.name}</span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-[#6D5DFC]">{user?.role}</span>
          </div>
          <UserCircle size={16} className="text-slate-600 shrink-0" />
        </Link>

        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
