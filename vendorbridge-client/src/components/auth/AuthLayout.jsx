import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, BarChart3, Users } from 'lucide-react';

/**
 * AuthLayout — Shared split-panel layout for all authentication pages.
 *
 * Left panel: Branding, logo, feature highlights with animated gradient background.
 * Right panel: Slot for form content (children).
 * Responsive: stacks vertically on mobile.
 *
 * Props:
 *   children     {ReactNode} — Form content to render in the right panel
 *   title        {string}    — Form card heading (e.g. "Sign In to Your Workspace")
 *   subtitle     {string}    — Optional description below the title
 */
const features = [
  {
    icon: Shield,
    title: 'Secure Access Control',
    description: 'Role-based permissions with enterprise-grade JWT authentication.'
  },
  {
    icon: Zap,
    title: 'Streamlined Procurement',
    description: 'End-to-end RFQ, quotation, and purchase order management.'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Actionable dashboards and reports for smarter decisions.'
  },
  {
    icon: Users,
    title: 'Vendor Collaboration',
    description: 'Dedicated portal for vendor onboarding and communication.'
  }
];

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen">
      {/* ─── Left Panel: Branding ─── */}
      <div className="relative hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between overflow-hidden bg-slate-950 p-10">
        {/* Animated gradient orbs */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-cyan-500/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-indigo-500/30">
              <span className="text-lg font-black text-white tracking-wider">VB</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Vendor<span className="text-cyan-400">Bridge</span>
            </span>
          </Link>

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-white leading-tight">
              Procurement &<br />
              Vendor Management
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent"> ERP</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-sm">
              A unified platform to streamline vendor relationships, procurement workflows,
              and supply chain operations for modern enterprises.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group flex items-start gap-4 rounded-xl border border-slate-800/50 bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-900/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 text-cyan-400 shadow-inner transition-colors group-hover:from-cyan-500/20 group-hover:to-indigo-500/20">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} VendorBridge ERP. All rights reserved.
          </p>
        </div>
      </div>

      {/* ─── Right Panel: Form Content ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-slate-950 px-6 py-12 lg:bg-slate-900/30">
        {/* Mobile-only gradient orbs */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse lg:hidden" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px] animate-pulse lg:hidden" />

        {/* Mobile-only logo */}
        <div className="mb-8 text-center lg:hidden">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-indigo-500/30">
              <span className="text-xl font-black text-white tracking-wider">VB</span>
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Vendor<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Bridge</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Procurement & Vendor Management ERP
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
            {title && (
              <h2 className="mb-1 text-xl font-bold text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="mb-6 text-sm text-slate-400">{subtitle}</p>
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
