import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
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

const tones = ['purple', 'cyan', 'violet', 'slate'];

const SummaryGrid = ({ summary }) => {
  if (!summary) return null;

  return (
    <Panel title="System Summary">
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-bold capitalize text-slate-500">{key.replaceAll('_', ' ')}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const ApprovalQueue = ({ items = [] }) => (
  <Panel title="Approval Queue" action={<Link className="text-xs font-bold text-[#6D5DFC]" to="/approvals">Open queue</Link>}>
    {items.length === 0 ? (
      <EmptyState title="No pending approvals" message="All procurement decisions are currently clear." />
    ) : (
      <div className="space-y-3">
        {items.map((item) => (
          <Link key={item.id} to={`/approvals/${item.id}`} className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-[#6D5DFC]/30 hover:bg-white">
            <div className="flex items-start justify-between gap-4">
              <p className="min-w-0 truncate text-sm font-black text-slate-950">{item.rfq_title}</p>
              <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">Pending</span>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{item.vendor_name} · {item.delivery_days} days</p>
          </Link>
        ))}
      </div>
    )}
  </Panel>
);

const RecentDecisions = ({ items = [] }) => (
  <Panel title="Recent Approval Decisions">
    {items.length === 0 ? (
      <EmptyState title="No decisions yet" />
    ) : (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-black text-slate-950">{item.rfq_title}</p>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black capitalize ${item.decision === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {item.decision}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.vendor_name}</p>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

const QuotationTimeline = ({ items = [] }) => (
  <Panel title="Quotation Status Timeline">
    {items.length === 0 ? (
      <EmptyState title="No quotations submitted" />
    ) : (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.status} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white" style={{ backgroundColor: ['#6D5DFC', '#A855F7', '#22D3EE', '#14B8A6'][index % 4] }}>
              {item.count}
            </span>
            <p className="text-sm font-black capitalize text-slate-900">{item.status}</p>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

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
    return () => {
      alive = false;
    };
  }, [role]);

  const kpis = useMemo(() => dashboard?.kpis || [], [dashboard]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <DashboardHeader user={user} role={role} />

      {error && (
        <div className="flex items-center gap-3 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {dashboard?.vendorProfileMissing && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          Your vendor portal account is active, but no vendor master record is linked to this email yet.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <StatCard key={kpi.key} title={kpi.label} value={kpi.value} format={kpi.format} suffix={kpi.suffix} tone={tones[index % tones.length]} />
        ))}
      </div>

      {role === 'admin' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <RecentRFQs items={dashboard?.recentRFQs} />
            <RecentPOs items={dashboard?.recentPOs} />
            <RecentInvoices items={dashboard?.recentInvoices} />
          </div>
          <div className="space-y-6">
            <ActivityFeed items={dashboard?.recentActivity} />
            <SummaryGrid summary={dashboard?.systemSummary} />
          </div>
        </div>
      )}

      {role === 'officer' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <QuickActions actions={dashboard?.quickActions} />
            <RecentRFQs items={dashboard?.recentRFQs} />
          </div>
          <div className="space-y-6">
            <RecentPOs items={dashboard?.recentPOs} />
            <RecentInvoices items={dashboard?.recentInvoices} />
          </div>
        </div>
      )}

      {role === 'manager' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <ApprovalQueue items={dashboard?.approvalQueue} />
          <RecentDecisions items={dashboard?.recentApprovalDecisions} />
        </div>
      )}

      {role === 'vendor' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <RecentRFQs items={dashboard?.recentRFQs} />
            <RecentPOs items={dashboard?.recentPOs} />
          </div>
          <div className="space-y-6">
            <QuotationTimeline items={dashboard?.quotationTimeline} />
            <RecentInvoices items={dashboard?.recentInvoices} />
          </div>
        </div>
      )}

      <DashboardCharts charts={dashboard?.charts} />
    </div>
  );
};

export default Dashboard;
