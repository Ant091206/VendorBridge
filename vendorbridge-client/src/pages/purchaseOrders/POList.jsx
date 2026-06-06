import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPOs } from '../../api/poApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSkeleton from '../../components/LoadingSkeleton';

/**
 * POList Page Component
 * Officer/Admin dashboard listing all generated Purchase Orders.
 */
const POList = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & searching states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await getAllPOs(params);
      if (response.status === 'success') {
        setPurchaseOrders(response.data);
      } else {
        setError('Failed to fetch purchase orders.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search/filter calls slightly
    const timer = setTimeout(() => {
      fetchPurchaseOrders();
    }, 250);
    
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Format currency
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Date formatter
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status badge style helper
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'generated':
        return (
          <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
            Generated
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Sent
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Purchase Orders</h1>
        <p className="text-sm text-slate-400">
          Track issued procurement agreements, monitor statuses, and transition order paths.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Filters & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/60 p-4 rounded-xl border border-slate-850">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by PO Number or Vendor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative min-w-[180px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none transition appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="generated">Generated</option>
            <option value="sent">Sent</option>
            <option value="completed">Completed</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* PO Table */}
      {loading && purchaseOrders.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <Spinner />
        </div>
      ) : purchaseOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">No Purchase Orders Found</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            {searchTerm || statusFilter 
              ? "No PO numbers or supplier names match your active filter parameters."
              : "Generate purchase orders by selecting quotations and obtaining manager approvals."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">PO Number</th>
                <th className="py-4 px-5">RFQ Title</th>
                <th className="py-4 px-5">Vendor</th>
                <th className="py-4 px-5 text-right">Grand Total</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-800/35 transition duration-150">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-100">{po.po_number}</td>
                  <td className="py-3.5 px-5 max-w-[200px] truncate font-medium text-slate-200" title={po.rfq_title}>
                    {po.rfq_title}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-slate-200">{po.vendor_name}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-100">{formatCurrency(po.grand_total)}</td>
                  <td className="py-3.5 px-5 text-center">{getStatusBadge(po.status)}</td>
                  <td className="py-3.5 px-5 text-slate-400">{formatDate(po.created_at)}</td>
                  <td className="py-3.5 px-5 text-right space-x-2">
                    <Link
                      to={`/purchase-orders/${po.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition duration-150"
                    >
                      View
                    </Link>
                    <Link
                      to={`/invoices/new/${po.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-850 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition duration-150"
                    >
                      Generate Invoice
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default POList;
