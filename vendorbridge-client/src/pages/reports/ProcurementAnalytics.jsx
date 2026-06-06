import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRFQStatusAnalytics, getApprovalsAnalytics } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { PieChart as PieIcon, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

const CHART_COLORS = ['#6D5DFC', '#22D3EE', '#F59E0B', '#EF4444', '#10B981', '#EC4899'];

const ProcurementAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqStatus, setRfqStatus] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rfqRes, appRes] = await Promise.all([
        getRFQStatusAnalytics(),
        getApprovalsAnalytics()
      ]);

      if (rfqRes.status === 'success') {
        // Map data from: { status, count } to Recharts format: { name, value }
        const rfqFormatted = (rfqRes.data || []).map(item => ({
          name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          value: item.count
        }));
        setRfqStatus(rfqFormatted);
      }

      if (appRes.status === 'success') {
        const appFormatted = (appRes.data || []).map(item => ({
          name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          value: item.count
        }));
        setApprovals(appFormatted);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load procurement analytics.');
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

  // Aggregate total counts
  const totalRFQs = rfqStatus.reduce((sum, item) => sum + item.value, 0);
  const totalApprovals = approvals.reduce((sum, item) => sum + item.value, 0);
  
  const approvedCount = approvals.find(a => a.name.toLowerCase() === 'approved')?.value || 0;
  const rejectedCount = approvals.find(a => a.name.toLowerCase() === 'rejected')?.value || 0;
  
  // Calculate success rates
  const successRate = totalApprovals > 0 
    ? ((approvedCount / (approvedCount + rejectedCount)) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Procurement Metrics & Analytics" 
          subtitle="Approval conversion pipelines and bidding status breakdowns"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        <button onClick={() => navigate('/reports')} className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900">Overview</button>
        <button onClick={() => navigate('/reports/vendors')} className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900">Vendor Performance</button>
        <button onClick={() => navigate('/reports/analytics')} className="px-5 py-3 text-sm font-black border-b-2 border-[#6D5DFC] text-[#6D5DFC]">Procurement Analytics</button>
        <button onClick={() => navigate('/reports/spending')} className="px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-900">Spending Analysis</button>
      </div>

      {/* Analytics Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#6D5DFC]">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Approval Success Rate</span>
            <span className="text-xl font-black text-slate-950">
              {successRate === 'NaN' || successRate === '0' ? '0.0' : successRate}%
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500">
            <PieIcon size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Bidding Requests</span>
            <span className="text-xl font-black text-slate-950">{totalRFQs}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-500">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Decided Approvals</span>
            <span className="text-xl font-black text-slate-950">{approvedCount + rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* RFQ Status Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
            <PieIcon size={18} className="text-[#6D5DFC]" />
            <span>RFQ Status Distribution</span>
          </h3>
          <div className="h-72 w-full">
            {rfqStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rfqStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {rfqStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No RFQs tracked.
              </div>
            )}
          </div>
        </div>

        {/* Approval Decisions Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
            <AlertCircle size={18} className="text-cyan-500" />
            <span>Approval Decisions Breakdown</span>
          </h3>
          <div className="h-72 w-full">
            {approvals.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvals}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={85}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {approvals.map((entry, index) => {
                      const colorsMap = {
                        Approved: '#10B981',
                        Rejected: '#EF4444',
                        Pending: '#F59E0B'
                      };
                      return <Cell key={`cell-${index}`} fill={colorsMap[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs font-bold text-slate-500">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No approvals workflow metrics logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcurementAnalytics;
