import React, { memo } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import EmptyState from './EmptyState';
import Panel from './Panel';

const colors = ['#6D5DFC', '#A855F7', '#22D3EE', '#14B8A6', '#F59E0B', '#EF4444'];

const hasValues = (items, key) => Array.isArray(items) && items.some((item) => Number(item[key] || 0) > 0);

const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-xl">
      <p>{label}</p>
      <p className="mt-1 text-[#6D5DFC]">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
      </p>
    </div>
  );
};

const DashboardCharts = memo(({ charts = {} }) => {
  const monthlyTrend = charts.monthlyTrend || [];
  const rfqStatusDistribution = charts.rfqStatusDistribution || [];
  const spendingOverview = charts.spendingOverview || [];
  const vendorActivityOverview = charts.vendorActivityOverview || [];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Monthly Procurement Trend">
        {hasValues(monthlyTrend, 'spend') ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D5DFC" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6D5DFC" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="spend" stroke="#6D5DFC" strokeWidth={3} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No monthly spend" />
        )}
      </Panel>

      <Panel title="RFQ Status Distribution">
        {hasValues(rfqStatusDistribution, 'count') ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rfqStatusDistribution} dataKey="count" nameKey="status" innerRadius={62} outerRadius={98} paddingAngle={5}>
                  {rfqStatusDistribution.map((entry, index) => (
                    <Cell key={entry.status} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No RFQ status data" />
        )}
      </Panel>

      <Panel title="Spending Overview">
        {hasValues(spendingOverview, 'spend') ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingOverview} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="status" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={46} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="spend" radius={[14, 14, 4, 4]} fill="#A855F7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No spending data" />
        )}
      </Panel>

      <Panel title="Vendor Activity Overview">
        {vendorActivityOverview.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorActivityOverview} layout="vertical" margin={{ top: 8, right: 14, left: 34, bottom: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="vendor_name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} width={86} />
                <Tooltip />
                <Bar dataKey="assigned_rfqs" stackId="activity" fill="#22D3EE" radius={[0, 0, 0, 0]} />
                <Bar dataKey="submitted_quotations" stackId="activity" fill="#6D5DFC" radius={[0, 12, 12, 0]} />
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
