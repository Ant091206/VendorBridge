import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, BarChart3, Users } from 'lucide-react';

/**
 * AuthLayout — Split-panel layout for auth pages.
 * Left: brand panel with value props.
 * Right: form content slot.
 */
const features = [
  { icon: Shield,   title: 'Role-Based Security',      desc: 'Granular access control with enterprise JWT authentication.' },
  { icon: Zap,      title: 'End-to-End Procurement',  desc: 'RFQ → Quotation → Approval → PO → Invoice in one platform.' },
  { icon: BarChart3,title: 'Live Analytics',           desc: 'Real-time dashboards tailored to your role and workflow.' },
  { icon: Users,    title: 'Vendor Collaboration',    desc: 'Dedicated vendor portal for onboarding and communication.' },
];

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* ── Left Panel ── */}
      <div className="relative hidden lg:flex lg:w-[440px] xl:w-[480px] flex-col justify-between bg-white border-r border-[#E5E7EB] p-10 shrink-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#111827 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Soft green accent */}
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-[#16A34A] opacity-[0.04] blur-[80px]" />
        <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[#16A34A] opacity-[0.04] blur-[60px]" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#16A34A]">
              <span className="text-sm font-bold text-white tracking-wide">VB</span>
            </div>
            <span className="text-[17px] font-semibold text-[#111827] tracking-tight">
              Vendor<span className="text-[#16A34A]">Bridge</span>
            </span>
          </Link>

          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-[#111827] leading-tight">
              Procurement &amp; Vendor<br />
              Management <span className="text-[#16A34A]">ERP</span>
            </h2>
            <p className="mt-3 text-sm text-[#6B7280] leading-relaxed max-w-sm">
              A unified platform to manage vendors, streamline procurement, and drive supply chain visibility across your enterprise.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] hover:border-[#E5E7EB] transition-colors duration-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#DCFCE7]">
                  <Icon size={15} className="text-[#16A34A]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111827]">{f.title}</p>
                  <p className="mt-0.5 text-xs text-[#6B7280] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-[#9CA3AF]">
            © {new Date().getFullYear()} VendorBridge ERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#16A34A]">
              <span className="text-sm font-bold text-white">VB</span>
            </div>
            <span className="text-[17px] font-semibold text-[#111827]">
              Vendor<span className="text-[#16A34A]">Bridge</span>
            </span>
          </Link>
        </div>

        {/* Form card */}
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8">
            {title && (
              <h2 className="text-xl font-semibold text-[#111827] mb-1">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-[#6B7280] mb-6">{subtitle}</p>
            )}
            {!subtitle && title && <div className="mb-6" />}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
