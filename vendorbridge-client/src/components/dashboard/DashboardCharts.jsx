import React, { memo } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from 'recharts';
import EmptyState from './EmptyState';
import Panel from './Panel';

// ── Color palette (green + slate, no cyan) ──
const COLORS = ['#16A34A', '#374151', '#4B5563', '#6B7280', '#D97706', '#DC2626'];

const hasValues = (items, key) =>
  Array.isArray(items) && items.some((item) => Number(item[key] || 0) > 0);

// ── Shared Tooltip ──
const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07)]">
      <p className="text-[#6B7280] mb-1">{label}</p>
      <p className="font-semibold text-[#111827]">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
      </p>
    </div>
  );
};

const CountTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07)]">
      <p className="text-[#6B7280] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07)]">
      <p className="font-semibold text-[#111827]">{payload[0].name}</p>
      <p className="text-[#6B7280]">Count: <span className="font-semibold text-[#374151]">{payload[0].value}</span></p>
    </div>
  );
};

const axisStyle = { fill: '#9CA3AF', fontSize: 12 };

const DashboardCharts = memo(({ charts = {} }) => {
  const monthlyTrend          = charts.monthlyTrend || [];
  const rfqStatusDistribution = charts.rfqStatusDistribution || [];
  const spendingOverview      = charts.spendingOverview || [];
  const vendorActivityOverview = charts.vendorActivityOverview || [];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Monthly Spend Trend */}
      <Panel title="Monthly Procurement Spend">
        {hasValues(monthlyTrend, 'spend') ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48}
                  tickFormatter={(v) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v}`}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#spendGrad)"
                  dot={{ fill: '#16A34A', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No monthly spend data" />
        )}
      </Panel>

      {/* RFQ Status Distribution */}
      <Panel title="RFQ Status Distribution">
        {hasValues(rfqStatusDistribution, 'count') ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rfqStatusDistribution}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                >
                  {rfqStatusDistribution.map((entry, index) => (
                    <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No RFQ data" />
        )}
      </Panel>

      {/* Spending Overview */}
      <Panel title="Spending by Category">
        {hasValues(spendingOverview, 'spend') ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingOverview} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48}
                  tickFormatter={(v) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v}`}
                />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="spend" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No spending data" />
        )}
      </Panel>

      {/* Vendor Activity */}
      <Panel title="Vendor Activity">
        {vendorActivityOverview.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendorActivityOverview}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="vendor_name"
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CountTooltip />} />
                <Legend
                  formatter={(v) => (
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                      {v === 'assigned_rfqs' ? 'Assigned RFQs' : 'Submitted Quotes'}
                    </span>
                  )}
                />
                <Bar dataKey="assigned_rfqs"        fill="#E5E7EB" radius={[0, 0, 0, 0]} maxBarSize={20} name="assigned_rfqs" />
                <Bar dataKey="submitted_quotations" fill="#16A34A" radius={[0, 2, 2, 0]} maxBarSize={20} name="submitted_quotations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No vendor activity" />
        )}
      </Panel>
    </div>
  );
});

export default DashboardCharts;
