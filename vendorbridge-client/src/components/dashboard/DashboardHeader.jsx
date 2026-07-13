import React from 'react';

const roleMeta = {
  admin:   { badge: 'Administrator', desc: 'System-wide procurement control center' },
  officer: { badge: 'Officer',       desc: 'RFQ pipeline and buying activity' },
  manager: { badge: 'Manager',       desc: 'Approval queue and decision center' },
  vendor:  { badge: 'Vendor',        desc: 'RFQs, quotes, orders, and invoices' },
  finance: { badge: 'Finance',       desc: 'Spend overview and invoice management' },
};

const roleBadgeColors = {
  admin:   { bg: '#FEE2E2', text: '#B91C1C' },
  officer: { bg: '#DCFCE7', text: '#15803D' },
  manager: { bg: '#FEF3C7', text: '#B45309' },
  vendor:  { bg: '#DBEAFE', text: '#1D4ED8' },
  finance: { bg: '#F3E8FF', text: '#7C3AED' },
};

const DashboardHeader = ({ user, role }) => {
  const meta = roleMeta[role] || { badge: role, desc: 'ERP overview' };
  const colors = roleBadgeColors[role] || { bg: '#F3F4F6', text: '#6B7280' };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium capitalize"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {meta.badge}
          </span>
          <span className="text-xs text-[#9CA3AF]">{today}</span>
        </div>
        <h1 className="text-xl font-semibold text-[#111827]">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="mt-0.5 text-sm text-[#6B7280]">{meta.desc}</p>
      </div>
    </div>
  );
};

export default DashboardHeader;
