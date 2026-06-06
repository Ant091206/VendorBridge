import React from 'react';

const roleCopy = {
  admin: 'System-wide procurement control center',
  officer: 'RFQ pipeline, approvals, and buying activity',
  manager: 'Approval health and decision queue',
  vendor: 'Your RFQs, quotations, orders, and invoice status'
};

const DashboardHeader = ({ user, role }) => (
  <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#6D5DFC] via-[#A855F7] to-[#22D3EE] px-7 py-8 text-white shadow-[0_24px_80px_rgba(109,93,252,0.28)]">
    <div className="relative z-10 max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/75">{roleCopy[role] || 'ERP overview'}</p>
      <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
        Welcome back, {user?.name || 'User'}
      </h1>
      <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/82">
        Live procurement intelligence from VendorBridge, tailored to your role and ready for the next workflow.
      </p>
    </div>
    <div className="absolute right-8 top-8 hidden rounded-3xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur md:block">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Role</p>
      <p className="mt-1 text-xl font-black capitalize">{role}</p>
    </div>
  </section>
);

export default DashboardHeader;
