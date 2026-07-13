import React from 'react';

const Panel = ({ title, action, children, className = '' }) => (
  <section className={`bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${className}`}>
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F3F4F6]">
      <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
    <div className="p-5">
      {children}
    </div>
  </section>
);

export default Panel;
