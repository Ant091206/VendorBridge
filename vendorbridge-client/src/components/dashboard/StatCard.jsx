import React, { memo } from 'react';
import { ArrowUpRight } from 'lucide-react';

const formatValue = (value, format, suffix) => {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  return `${new Intl.NumberFormat('en-IN').format(Number(value || 0))}${suffix || ''}`;
};

const StatCard = memo(({ title, value, format, suffix, tone = 'purple' }) => {
  const tones = {
    purple: 'from-[#6D5DFC] to-[#A855F7]',
    cyan: 'from-[#22D3EE] to-[#6D5DFC]',
    violet: 'from-[#A855F7] to-[#6D5DFC]',
    slate: 'from-slate-700 to-slate-950'
  };

  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 break-words text-3xl font-black tracking-normal text-slate-950">
            {formatValue(value, format, suffix)}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone] || tones.purple} text-white shadow-lg shadow-indigo-500/20`}>
          <ArrowUpRight size={22} />
        </div>
      </div>
    </article>
  );
});

export default StatCard;
