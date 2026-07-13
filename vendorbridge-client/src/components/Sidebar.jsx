import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, FileText, ClipboardList, CheckSquare,
  ShoppingCart, Receipt, BarChart3, Activity, Users, LogOut,
  ChevronLeft, ChevronRight, FolderOpen, Layers
} from 'lucide-react';

const navSections = [
  {
    id: 'main',
    label: null,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'officer', 'manager', 'vendor', 'finance'] },
    ]
  },
  {
    id: 'vendor-portal',
    label: 'My Portal',
    items: [
      { label: 'RFQs',       path: '/rfqs',              icon: FileText,     roles: ['vendor'] },
      { label: 'My Quotes',  path: '/quotations/vendor', icon: ClipboardList, roles: ['vendor'] },
      { label: 'My Orders',  path: '/vendor/my-orders',  icon: ShoppingCart, roles: ['vendor'] },
      { label: 'My Invoices',path: '/vendor/my-invoices',icon: Receipt,      roles: ['vendor'] },
    ]
  },
  {
    id: 'procurement',
    label: 'Procurement',
    items: [
      { label: 'Vendors',          path: '/vendors',           icon: Building2,     roles: ['admin', 'officer', 'manager'] },
      { label: 'Vendor Categories',path: '/vendor-categories', icon: FolderOpen,    roles: ['admin'] },
      { label: 'RFQs',             path: '/rfqs',              icon: FileText,      roles: ['admin', 'officer'] },
      { label: 'Quotations',       path: '/quotations',        icon: ClipboardList, roles: ['admin', 'officer'] },
      { label: 'Approvals',        path: '/approvals',         icon: CheckSquare,   roles: ['admin', 'officer', 'manager'] },
      { label: 'Purchase Orders',  path: '/purchase-orders',   icon: ShoppingCart,  roles: ['admin', 'officer', 'manager', 'finance'] },
      { label: 'Invoices',         path: '/invoices',          icon: Receipt,       roles: ['admin', 'finance'] },
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { label: 'Users', path: '/users', icon: Users, roles: ['admin'] },
    ]
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { label: 'Reports',        path: '/reports',       icon: BarChart3,  roles: ['admin', 'officer', 'manager', 'finance'] },
      { label: 'Activity Logs',  path: '/activity-logs', icon: Activity,   roles: ['admin', 'officer', 'manager', 'finance'] },
    ]
  },
];

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const userRole = user?.role || '';

  // Filter sections and items by role
  const visibleSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(userRole))
    }))
    .filter(section => section.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-screen flex-col bg-white border-r border-[#E5E7EB] shrink-0 z-30 print:hidden overflow-hidden"
    >
      {/* ── Logo ── */}
      <div className="flex h-14 items-center gap-3 border-b border-[#E5E7EB] px-4 shrink-0">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#16A34A] text-white cursor-pointer"
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Layers size={16} strokeWidth={2} />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <span className="text-[15px] font-semibold text-[#111827] whitespace-nowrap tracking-tight">
                Vendor<span className="text-[#16A34A]">Bridge</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleSections.map((section, si) => (
          <div key={section.id} className={si > 0 ? 'pt-3' : ''}>
            {/* Section label */}
            <AnimatePresence initial={false}>
              {!collapsed && section.label && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <div
                  key={item.label + item.path}
                  className="relative"
                  onMouseEnter={() => collapsed && setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.path}
                    className={`group flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm transition-colors duration-100 ${
                      active
                        ? 'bg-[#DCFCE7] text-[#16A34A] font-medium'
                        : 'text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827] font-normal'
                    }`}
                  >
                    <Icon
                      size={17}
                      strokeWidth={active ? 2 : 1.75}
                      className={`shrink-0 ${active ? 'text-[#16A34A]' : 'text-[#6B7280] group-hover:text-[#374151]'}`}
                    />
                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  {/* Tooltip on collapse */}
                  {collapsed && hoveredItem === item.label && (
                    <div className="nav-tooltip" style={{ opacity: 1 }}>
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}

            {si < visibleSections.length - 1 && !collapsed && (
              <div className="mt-3 border-t border-[#F3F4F6]" />
            )}
          </div>
        ))}
      </nav>

      {/* ── User Profile Footer ── */}
      <div className="shrink-0 border-t border-[#E5E7EB] p-2">
        <Link
          to="/profile"
          className={`flex items-center gap-3 rounded-[6px] px-2 py-2 transition-colors duration-100 ${
            location.pathname === '/profile'
              ? 'bg-[#F3F4F6]'
              : 'hover:bg-[#F3F4F6]'
          }`}
        >
          {/* Avatar */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#16A34A] text-white text-xs font-semibold uppercase">
            {user?.name ? user.name[0] : 'U'}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-[#111827] leading-tight">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-[#9CA3AF] capitalize">
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={handleLogout}
          className={`mt-1 flex w-full items-center gap-3 rounded-[6px] px-2 py-2 text-sm text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors duration-100 cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign out"
        >
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm"
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
