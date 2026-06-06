import React from 'react';

/**
 * PageHeader Component
 * Reusable page header with title, subtitle, and optional action buttons.
 *
 * Props:
 *   title   {string}      — Main page heading
 *   subtitle{string}      — Secondary description line (optional)
 *   actions {ReactNode}   — Buttons/controls to display on the right (optional)
 */
const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
