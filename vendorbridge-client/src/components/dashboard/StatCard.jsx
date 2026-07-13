import React, { memo } from 'react';
import {
  FileText, ShoppingCart, Receipt, CheckSquare,
  Building2, DollarSign, Clock, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

const formatValue = (value, format, suffix) => {
  if (format === 'currency') {
    const num = Number(value || 0);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000)   return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}K`;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(num);
  }
  return `${new Intl.NumberFormat('en-IN').format(Number(value || 0))}${suffix || ''}`;
};

// Map KPI keys to icons + accent colors
const kpiMeta = {
  total_rfqs:             { icon: FileText,      color: '#2563EB', bg: '#DBEAFE' },
  open_rfqs:              { icon: FileText,      color: '#D97706', bg: '#FEF3C7' },
  total_vendors:          { icon: Building2,     color: '#7C3AED', bg: '#F3E8FF' },
  active_vendors:         { icon: Building2,     color: '#16A34A', bg: '#DCFCE7' },
  total_pos:              { icon: ShoppingCart,  color: '#0891B2', bg: '#CFFAFE' },
  pending_approvals:      { icon: CheckSquare,   color: '#D97706', bg: '#FEF3C7' },
  total_invoices:         { icon: Receipt,       color: '#6D28D9', bg: '#EDE9FE' },
  unpaid_invoices:        { icon: Receipt,       color: '#DC2626', bg: '#FEE2E2' },
  total_spend:            { icon: DollarSign,    color: '#16A34A', bg: '#DCFCE7' },
  pending_quotations:     { icon: Clock,         color: '#D97706', bg: '#FEF3C7' },
  submitted_quotations:   { icon: FileText,      color: '#2563EB', bg: '#DBEAFE' },
  awarded_rfqs:           { icon: CheckSquare,   color: '#16A34A', bg: '#DCFCE7' },
  approved_pos:           { icon: CheckSquare,   color: '#16A34A', bg: '#DCFCE7' },
};

const getKpiMeta = (key) => {
  const lk = key?.toLowerCase();
  return kpiMeta[lk] || { icon: TrendingUp, color: '#6B7280', bg: '#F3F4F6' };
};

const StatCard = memo(({ title, value, format, suffix, tone, kpiKey, delta }) => {
  const meta = getKpiMeta(kpiKey || tone);
  const Icon = meta.icon;

  const hasDelta = delta !== undefined && delta !== null;
  const isPositive = delta > 0;
  const isNeutral = delta === 0;
  const DeltaIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <article className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Top: label + icon */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-[#6B7280] font-medium">{title}</p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[6px] shrink-0"
          style={{ backgroundColor: meta.bg }}
        >
          <Icon size={16} style={{ color: meta.color }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Value */}
      <p className="text-2xl font-semibold text-[#111827] tracking-tight">
        {formatValue(value, format, suffix)}
      </p>

      {/* Delta badge */}
      {hasDelta ? (
        <div className="mt-2 flex items-center gap-1">
          <DeltaIcon
            size={13}
            className={isNeutral ? 'text-[#9CA3AF]' : isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}
          />
          <span
            className={`text-xs font-medium ${
              isNeutral ? 'text-[#9CA3AF]' : isPositive ? 'text-[#15803D]' : 'text-[#DC2626]'
            }`}
          >
            {isPositive ? '+' : ''}{delta}% vs last month
          </span>
        </div>
      ) : (
        <div className="mt-2 h-4" />
      )}
    </article>
  );
});

export default StatCard;
