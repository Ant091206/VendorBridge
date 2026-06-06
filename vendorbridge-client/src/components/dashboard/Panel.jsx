import React from 'react';

const Panel = ({ title, action, children, className = '' }) => (
  <section className={`rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)] ${className}`}>
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-base font-black tracking-normal text-slate-950">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export default Panel;
