import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getVendorsReport } from '../../api/reportApi';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Search, ChevronDown, Check, Percent, Award, RotateCcw } from 'lucide-react';

const CHART_COLORS = ['#22C55E', '#16A34A', '#22D3EE', '#F59E0B', '#10B981', '#EC4899'];

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(num);
};

const VendorPerformance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('total_value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const tabs = [
    { label: 'Overview', path: '/reports', roles: ['admin', 'officer', 'manager', 'vendor'] },
    { label: 'Vendor Performance', path: '/reports/vendors', roles: ['admin', 'officer', 'manager', 'vendor'] },
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
      const filters = {
        from: from || undefined,
        to: to || undefined,
        category: categoryId || undefined
      };
      const res = await getVendorsReport(filters);
      if (res.status === 'success') {
        setVendors(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(err.message || 'Failed to load vendor performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleResetFilters = () => {
    setFrom('');
    setTo('');
    setCategoryId('');
    setTimeout(loadData, 50);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Sort vendors
  const filteredVendors = vendors
    .filter(v => v.vendor_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Top vendors for bar chart (limit 6)
  const topVendorsData = [...vendors]
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Vendor Performance Metrics" 
          subtitle="Audit win rates, quotation response times, and order delivery value"
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

      {/* Dynamic Filters for Staff */}
      {!isVendor && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="premium-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="premium-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Category Scope ID</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="premium-input text-xs"
              />
            </div>

            <div className="flex gap-2 items-end">
              <button
                onClick={loadData}
                className="flex-1 rounded-2xl bg-primary hover:bg-primary-hover py-2.5 text-xs font-black text-white transition duration-150 shadow-md shadow-indigo-600/10 cursor-pointer h-[42px]"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 cursor-pointer transition"
                title="Reset Filters"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Top Vendors Value Chart */}
          {!isVendor && topVendorsData.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 space-y-4">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <Award size={18} className="text-[#22C55E]" />
                <span>Top Vendors by Procurement Value</span>
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topVendorsData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="vendor_name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Total value']} />
                    <Legend />
                    <Bar dataKey="total_value" fill="#22C55E" name="Procurement Volume (INR)" radius={[6, 6, 0, 0]}>
                      {topVendorsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Performance stats for Vendor */}
          {isVendor && vendors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#22C55E]">
                  <Percent size={22} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Bidding Win Rate</span>
                  <span className="text-xl font-black text-slate-950">{vendors[0].win_rate}%</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-500">
                  <Check size={22} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Quotations Submitted</span>
                  <span className="text-xl font-black text-slate-950">{vendors[0].quotations_submitted}</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-purple-500">
                  <Award size={22} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Purchase Orders Awarded</span>
                  <span className="text-xl font-black text-slate-950">{vendors[0].pos_received}</span>
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
          {!isVendor && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search vendor by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#22C55E]"
              />
            </div>
          )}

          {/* Performance Table */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('vendor_name')}>
                      <div className="flex items-center gap-1">
                        <span>Vendor Name</span>
                        <ChevronDown size={14} className={sortField === 'vendor_name' ? 'opacity-100' : 'opacity-40'} />
                      </div>
                    </th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center cursor-pointer" onClick={() => handleSort('rfqs_assigned')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>RFQs Assigned</span>
                        <ChevronDown size={14} className={sortField === 'rfqs_assigned' ? 'opacity-100' : 'opacity-40'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer" onClick={() => handleSort('quotations_submitted')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Quotations</span>
                        <ChevronDown size={14} className={sortField === 'quotations_submitted' ? 'opacity-100' : 'opacity-40'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer" onClick={() => handleSort('pos_received')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Orders</span>
                        <ChevronDown size={14} className={sortField === 'pos_received' ? 'opacity-100' : 'opacity-40'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right cursor-pointer" onClick={() => handleSort('total_value')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>Total Value</span>
                        <ChevronDown size={14} className={sortField === 'total_value' ? 'opacity-100' : 'opacity-40'} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer" onClick={() => handleSort('win_rate')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Win Rate</span>
                        <ChevronDown size={14} className={sortField === 'win_rate' ? 'opacity-100' : 'opacity-40'} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
                  {filteredVendors.map((v) => (
                    <tr key={v.vendor_id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">
                        {v.vendor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {v.category_name}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">{v.rfqs_assigned}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">{v.quotations_submitted}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-slate-800">{v.pos_received}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-black text-emerald-600">
                        {formatCurrency(v.total_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                v.win_rate > 60 ? 'bg-emerald-500' : v.win_rate > 30 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${v.win_rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-slate-700">{v.win_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-xs font-semibold text-slate-400">
                        No vendor performance logs match the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorPerformance;
