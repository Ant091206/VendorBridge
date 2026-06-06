import React, { useEffect, useRef, useState } from 'react';

/**
 * StatCard Component
 * Reusable KPI stat card with animated counter and optional trend indicator.
 *
 * Props:
 *   title      {string}    — Card label
 *   value      {number}    — Numeric value to display
 *   icon       {string}    — Emoji or SVG icon
 *   color      {string}    — Color theme: 'indigo'|'emerald'|'amber'|'cyan'|'rose'|'purple'
 *   isCurrency {boolean}   — Whether to format as ₹ currency (default: false)
 *   trend      {string}    — 'up' | 'down' | null
 *   trendValue {string}    — e.g. '12%' — shown next to trend arrow
 */

// ── Animated counter hook ──
const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const numTarget = typeof target === 'number' ? target : 0;
    if (numTarget === 0) { setValue(0); return; }

    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * numTarget));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(numTarget);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
};

const colorMap = {
  indigo: {
    border: 'border-indigo-500/20',
    bg: 'from-indigo-600/20 to-indigo-600/5',
    icon: 'bg-indigo-600/20 text-indigo-400',
    value: 'text-white'
  },
  emerald: {
    border: 'border-emerald-500/20',
    bg: 'from-emerald-600/20 to-emerald-600/5',
    icon: 'bg-emerald-600/20 text-emerald-400',
    value: 'text-emerald-300'
  },
  amber: {
    border: 'border-amber-500/20',
    bg: 'from-amber-600/20 to-amber-600/5',
    icon: 'bg-amber-600/20 text-amber-400',
    value: 'text-amber-300'
  },
  cyan: {
    border: 'border-cyan-500/20',
    bg: 'from-cyan-600/20 to-cyan-600/5',
    icon: 'bg-cyan-600/20 text-cyan-400',
    value: 'text-cyan-300'
  },
  rose: {
    border: 'border-rose-500/20',
    bg: 'from-rose-600/20 to-rose-600/5',
    icon: 'bg-rose-600/20 text-rose-400',
    value: 'text-rose-300'
  },
  purple: {
    border: 'border-purple-500/20',
    bg: 'from-purple-600/20 to-purple-600/5',
    icon: 'bg-purple-600/20 text-purple-400',
    value: 'text-purple-300'
  }
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(val);

const StatCard = ({ title, value = 0, icon, color = 'indigo', isCurrency = false, trend, trendValue }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animated = useCountUp(isCurrency ? Math.round(numericValue) : numericValue);
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`rounded-xl border ${theme.border} bg-gradient-to-br ${theme.bg} p-5 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className={`mt-2 text-2xl font-bold ${theme.value}`}>
            {isCurrency ? formatCurrency(animated) : animated.toLocaleString('en-IN')}
          </div>
          {trend && trendValue && (
            <div className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue} from last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.icon} text-xl shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
