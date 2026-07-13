import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getTrendsStats } from '../../api/analyticsApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, FileText, ClipboardList, ShoppingCart, Receipt, Award, CheckCircle2, Clock } from 'lucide-react';

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(num);
};

const ReportsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const tabs = [
    { label: 'Overview', path: '/reports', roles: ['admin', 'officer', 'manager', 'vendor'] },
    { label: 'Vendor Performance', path: '/reports/vendors', roles: ['admin', 'officer', 'manager'] },
    { label: 'Procurement Analytics', path: '/reports/analytics', roles: ['admin', 'officer', 'manager'] },
    { label: 'Spending Analysis', path: '/reports/spending', roles: ['admin', 'officer', 'manager'] },
    { label: 'Approvals', path: '/reports/approvals', roles: ['admin', 'officer', 'manager'] },
    { label: 'Purchase Orders', path: '/reports/pos', roles: ['admin', 'officer', 'manager'] },
    { label: 'Invoices', path: '/reports/invoices', roles: ['admin', 'officer', 'manager'] },
    { label: 'Reports Center', path: '/reports/center', roles: ['admin', 'officer', 'manager'] }
  ];

  const allowedTabs = tabs.filter(t => t.roles.includes(user?.role));
  const isVendor = user?.role === 'vendor';

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, trendsRes] = await Promise.all([
        getDashboardStats(),
        getTrendsStats()
      ]);

      if (dashRes.status === 'success') {
        setDashboardData(dashRes.data);
      }
      if (trendsRes.status === 'success') {
        setTrends(trendsRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load executive dashboard data.');
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

  const kpis = dashboardData?.kpis || {};

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <PageHeader 
          title={isVendor ? 'Vendor Analytics Portal' : 'Executive Overview Dashboard'} 
          subtitle={isVendor ? 'Real-time dashboard for your RFQ status, orders, and payment billing history' : 'Enterprise intelligence, procurement activity pipeline, and spending summaries'}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0 overflow-x-auto scrollbar-none whitespace-nowrap">
        {allowedTabs.map((tab) => (
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-[#22C55E]">
            <TrendingUp size={18} />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Procurement Spend</span>
          <div className="text-base font-black text-slate-950 mt-1 truncate">
            {formatCurrency(kpis.total_procurement_value || kpis.total_spend)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-500">
            <Users size={18} />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">
            {isVendor ? 'Vendor Status' : 'Total Vendors'}
          </span>
          <div className="text-base font-black text-slate-950 mt-1">
            {isVendor ? 'Active Partner' : kpis.total_vendors}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-500">
            <FileText size={18} />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Total RFQs</span>
          <div className="text-base font-black text-slate-950 mt-1">
            {kpis.total_rfqs}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-500">
            <ClipboardList size={18} />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Submitted Bids</span>
          <div className="text-base font-black text-slate-950 mt-1">
            {kpis.total_quotations}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-purple-500">
            <ShoppingCart size={18} />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Purchase Orders</span>
          <div className="text-base font-black text-slate-950 mt-1">
            {kpis.total_purchase_orders}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
            <Receipt size={18} />
          </div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mt-3">Invoices</span>
          <div className="text-base font-black text-slate-950 mt-1">
            {kpis.total_invoices}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spend Line Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Procurement Invoice Spending (Monthly)</h3>
          <div className="h-80 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Spend']} />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#22C55E" strokeWidth={3} activeDot={{ r: 8 }} name="Spend (INR)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No spending data recorded.
              </div>
            )}
          </div>
        </div>

        {/* Growth Area Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950">Procurement Activity Trends (Monthly)</h3>
          <div className="h-80 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRFQ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPO" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="rfqs" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorRFQ)" name="RFQs Created" />
                  <Area type="monotone" dataKey="purchase_orders" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorPO)" name="POs Issued" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                No activity trends found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Outstanding Approvals */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock size={16} className="text-[#22C55E]" />
            <span>Outstanding Approvals</span>
          </h3>

          <div className="space-y-3">
            {dashboardData?.outstanding_approvals?.map((ar) => (
              <div key={ar.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 leading-tight">{ar.approval_number} ({ar.rfq_number})</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{ar.title}</div>
                  {!isVendor && <div className="text-[10px] text-slate-400">Req by: {ar.requested_by_name}</div>}
                </div>
                <span className="px-2 py-0.5 rounded-full border border-amber-250 bg-amber-50 text-amber-600 font-bold text-[9px] whitespace-nowrap shrink-0">{ar.status}</span>
              </div>
            ))}
            {(!dashboardData?.outstanding_approvals || dashboardData.outstanding_approvals.length === 0) && (
              <div className="text-center py-6 text-xs font-semibold text-slate-400">No outstanding approvals.</div>
            )}
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt size={16} className="text-rose-500" />
            <span>Outstanding Payments</span>
          </h3>

          <div className="space-y-3">
            {dashboardData?.outstanding_payments?.map((i) => (
              <div key={i.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 leading-tight">{i.invoice_number}</div>
                  <div className="text-[10px] text-slate-500">Due: {new Date(i.due_date).toLocaleDateString('en-IN')}</div>
                  {!isVendor && <div className="text-[10px] text-slate-400">Vendor: {i.vendor_name}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black text-rose-600">{formatCurrency(i.grand_total)}</div>
                  <span className="text-[9px] font-bold text-slate-400">{i.payment_status}</span>
                </div>
              </div>
            ))}
            {(!dashboardData?.outstanding_payments || dashboardData.outstanding_payments.length === 0) && (
              <div className="text-center py-6 text-xs font-semibold text-slate-400">No outstanding payments.</div>
            )}
          </div>
        </div>

        {/* Top Vendors (Staff) / Recent Activities (Vendor) */}
        {!isVendor ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award size={16} className="text-cyan-500" />
              <span>Top Vendor Partners</span>
            </h3>

            <div className="space-y-3">
              {dashboardData?.top_vendors?.map((v) => (
                <div key={v.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 leading-tight">{v.name}</div>
                    <div className="text-[10px] text-slate-400">{v.invoices_count} invoices issued</div>
                  </div>
                  <div className="font-black text-green-600 shrink-0">{formatCurrency(v.total_spend)}</div>
                </div>
              ))}
              {(!dashboardData?.top_vendors || dashboardData.top_vendors.length === 0) && (
                <div className="text-center py-6 text-xs font-semibold text-slate-400">No active vendors.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 size={16} className="text-teal-500" />
              <span>Your Recent Activities</span>
            </h3>

            <div className="space-y-3">
              {dashboardData?.recent_activities?.map((al) => (
                <div key={al.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-xs">
                  <div className="font-semibold text-slate-700 leading-normal">{al.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-bold">{new Date(al.created_at).toLocaleString('en-IN')}</div>
                </div>
              ))}
              {(!dashboardData?.recent_activities || dashboardData.recent_activities.length === 0) && (
                <div className="text-center py-6 text-xs font-semibold text-slate-400">No activities logged.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;
