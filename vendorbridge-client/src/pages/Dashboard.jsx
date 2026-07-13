import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../api/dashboardApi';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import EmptyState from '../components/dashboard/EmptyState';
import Panel from '../components/dashboard/Panel';
import QuickActions from '../components/dashboard/QuickActions';
import RecentInvoices from '../components/dashboard/RecentInvoices';
import RecentPOs from '../components/dashboard/RecentPOs';
import RecentRFQs from '../components/dashboard/RecentRFQs';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';

// ── Admin: System Summary panel ──
const SummaryGrid = ({ summary }) => {
  if (!summary) return null;
  return (
    <Panel title="System Summary">
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="rounded-lg bg-[#F9FAFB] border border-[#F3F4F6] px-4 py-3">
            <p className="text-xs text-[#9CA3AF] font-medium capitalize">
              {key.replaceAll('_', ' ')}
            </p>
            <p className="mt-1.5 text-xl font-semibold text-[#111827]">{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
};

// ── Manager: Approval Queue panel ──
const ApprovalQueuePanel = ({ items = [] }) => (
  <Panel
    title="Approval Queue"
    action={
      <Link
        to="/approvals"
        className="text-xs font-medium text-[#16A34A] hover:text-[#15803D] transition-colors"
      >
        Open queue →
      </Link>
    }
  >
    {items.length === 0 ? (
      <EmptyState title="All clear" message="No pending approvals at this time." />
    ) : (
      <div className="divide-y divide-[#F3F4F6] -mx-5 -mb-5">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/approvals/${item.id}`}
            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F9FAFB] transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111827] group-hover:text-[#16A34A] truncate transition-colors">
                {item.rfq_title}
              </p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {item.vendor_name} · {item.delivery_days} days
              </p>
            </div>
            <StatusBadge status="pending" />
          </Link>
        ))}
      </div>
    )}
  </Panel>
);

// ── Manager: Recent Decisions panel ──
const RecentDecisions = ({ items = [] }) => (
  <Panel title="Recent Decisions">
    {items.length === 0 ? (
      <EmptyState title="No decisions yet" />
    ) : (
      <div className="divide-y divide-[#F3F4F6] -mx-5 -mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111827] truncate">{item.rfq_title}</p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">{item.vendor_name}</p>
            </div>
            <StatusBadge status={item.decision} />
          </div>
        ))}
      </div>
    )}
  </Panel>
);

// ── Vendor: Quotation Timeline ──
const QuotationTimeline = ({ items = [] }) => (
  <Panel title="Quotation Status">
    {items.length === 0 ? (
      <EmptyState title="No quotations submitted" />
    ) : (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between gap-3 rounded-lg bg-[#F9FAFB] border border-[#F3F4F6] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-[#111827]">{item.count}</span>
              <p className="text-sm text-[#374151] capitalize">{item.status}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    )}
  </Panel>
);

// ── Main Dashboard ──
const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role || 'officer';

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getDashboardByRole(role);
        if (alive) setDashboard(response.data);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || 'Dashboard data could not be loaded.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [role]);

  const kpis = useMemo(() => dashboard?.kpis || [], [dashboard]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <DashboardHeader user={user} role={role} />

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Vendor profile missing warning */}
      {dashboard?.vendorProfileMissing && (
        <div className="flex items-center gap-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
          <AlertTriangle size={16} className="shrink-0" />
          Your vendor portal is active, but no vendor record is linked to this email yet.
        </div>
      )}

      {/* KPI Cards */}
      {kpis.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${kpis.length >= 5 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
          {kpis.map((kpi) => (
            <StatCard
              key={kpi.key}
              title={kpi.label}
              value={kpi.value}
              format={kpi.format}
              suffix={kpi.suffix}
              kpiKey={kpi.key}
            />
          ))}
        </div>
      )}

      {/* ── Admin Layout ── */}
      {role === 'admin' && (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <RecentRFQs items={dashboard?.recentRFQs} />
              <RecentPOs items={dashboard?.recentPOs} />
              <RecentInvoices items={dashboard?.recentInvoices} />
            </div>
            <div className="space-y-5">
              <ActivityFeed items={dashboard?.recentActivity} />
              <SummaryGrid summary={dashboard?.systemSummary} />
            </div>
          </div>
          <DashboardCharts charts={dashboard?.charts} />
        </>
      )}

      {/* ── Officer Layout ── */}
      {role === 'officer' && (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <QuickActions actions={dashboard?.quickActions} />
              <RecentRFQs items={dashboard?.recentRFQs} />
            </div>
            <div className="space-y-5">
              <RecentPOs items={dashboard?.recentPOs} />
              <RecentInvoices items={dashboard?.recentInvoices} />
            </div>
          </div>
          <DashboardCharts charts={dashboard?.charts} />
        </>
      )}

      {/* ── Manager Layout ── */}
      {role === 'manager' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <ApprovalQueuePanel items={dashboard?.approvalQueue} />
          <RecentDecisions items={dashboard?.recentApprovalDecisions} />
        </div>
      )}

      {/* ── Vendor Layout ── */}
      {role === 'vendor' && (
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <RecentRFQs items={dashboard?.recentRFQs} />
            <RecentPOs items={dashboard?.recentPOs} />
          </div>
          <div className="space-y-5">
            <QuotationTimeline items={dashboard?.quotationTimeline} />
            <RecentInvoices items={dashboard?.recentInvoices} />
          </div>
        </div>
      )}

      {/* ── Finance Layout ── */}
      {role === 'finance' && (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <QuickActions actions={dashboard?.quickActions} />
              <RecentInvoices items={dashboard?.recentInvoices} />
            </div>
            <div className="space-y-5">
              <RecentPOs items={dashboard?.recentPOs} />
            </div>
          </div>
          <DashboardCharts charts={dashboard?.charts} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
