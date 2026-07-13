import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApprovalsStats } from '../../api/analyticsApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, XOctagon, Award } from 'lucide-react';

const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

const ApprovalAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const tabs = [
    { label: 'Overview', path: '/reports' },
    { label: 'Vendor Performance', path: '/reports/vendors' },
    { label: 'Procurement Analytics', path: '/reports/analytics' },
    { label: 'Spending Analysis', path: '/reports/spending' },
    { label: 'Approvals', path: '/reports/approvals' },
    { label: 'Purchase Orders', path: '/reports/pos' },
    { label: 'Invoices', path: '/reports/invoices' },
    { label: 'Reports Center', path: '/reports/center' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getApprovalsStats();
      if (res.status === 'success') {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load approvals analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const statusData = [
    { name: 'Approved', count: stats?.approved_requests || 0 },
    { name: 'Rejected', count: stats?.rejected_requests || 0 },
    { name: 'Pending', count: stats?.pending_approvals || 0 }
  ];

  const decisionPieData = [
    { name: 'Approved', value: stats?.approved_requests || 0 },
    { name: 'Rejected', value: stats?.rejected_requests || 0 }
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Approval Workflows Analytics" 
          subtitle="Audit approval request cycle times and individual manager decisions"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0 overflow-x-auto scrollbar-none whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-5 py-3 text-sm transition-all duration-150 cursor-pointer ${
              location.pathname === tab.path
                ? 'font-black border-b-2 border-[#22C55E] text-[#22C55E]'
                : 'font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E] shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Avg Decision Speed</span>
            <span className="text-xl font-black text-slate-950">{stats?.average_approval_time_hours || 0} hrs</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Approval Success Rate</span>
            <span className="text-xl font-black text-slate-950">{stats?.approval_success_rate || 0}%</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Pending Requests</span>
            <span className="text-xl font-black text-slate-950">{stats?.pending_approvals || 0}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shrink-0">
            <XOctagon size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Rejected Requests</span>
            <span className="text-xl font-black text-slate-950">{stats?.rejected_requests || 0}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Approval Status Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#22C55E" radius={[8, 8, 0, 0]} name="Requests Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decided Ratio */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Decisions Breakdown (Approved vs Rejected)</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {stats?.total_decided > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {decisionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-semibold text-slate-400">No decisions made yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Approver Leaderboard */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
          <Award size={18} className="text-[#22C55E]" />
          <span>Approver Performance Rankings</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Approver Manager</th>
                <th className="px-6 py-4 text-center">Decisions Handled</th>
                <th className="px-6 py-4 text-center">Approved Count</th>
                <th className="px-6 py-4 text-center">Rejected Count</th>
                <th className="px-6 py-4 text-right">Avg Decision Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
              {stats?.approver_performance?.map((ap, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">{ap.approver_name}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">{ap.total_decisions}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap text-emerald-600 font-bold">{ap.approved_count}</td>
                  <td className="px-6 py-4 text-center whitespace-nowrap text-rose-600 font-bold">{ap.rejected_count}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap font-black text-green-600">{ap.avg_time_hours} hrs</td>
                </tr>
              ))}
              {(!stats?.approver_performance || stats.approver_performance.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs font-semibold text-slate-400">
                    No active approver logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApprovalAnalytics;
