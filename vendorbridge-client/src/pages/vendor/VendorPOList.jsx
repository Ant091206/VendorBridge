import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../api/poApi';
import Spinner from '../../components/Spinner';

/**
 * VendorPOList Page Component
 * Read-only dashboard for logged-in vendors to track their issued purchase orders.
 */
const VendorPOList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendorOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyOrders();
      if (response.status === 'success') {
        setOrders(response.data);
      } else {
        setError('Failed to fetch purchase orders.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders();
  }, []);

  // Currency formatter
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
            Received
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">My Purchase Orders</h1>
        <p className="text-sm text-slate-400">
          View and track contracts, delivery dates, and transaction values issued by procurement.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Grid of orders for small screens / Table for large screens */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-850 text-slate-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">No Purchase Orders Issued</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Once your quotation proposals are approved by management, your purchase orders will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">PO Number</th>
                <th className="py-4 px-5">RFQ Contract Title</th>
                <th className="py-4 px-5 text-right">Order Amount</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5">Issued Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm text-slate-300">
              {orders.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  className="hover:bg-slate-800/35 cursor-pointer transition duration-150 group"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-100 group-hover:text-cyan-400 transition">
                    {po.po_number}
                  </td>
                  <td className="py-3.5 px-5 max-w-[240px] truncate font-medium text-slate-200">
                    {po.rfq_title}
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-100">
                    {formatCurrency(po.grand_total)}
                  </td>
                  <td className="py-3.5 px-5 text-center">{getStatusBadge(po.status)}</td>
                  <td className="py-3.5 px-5 text-slate-400">{formatDate(po.created_at)}</td>
                  <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition duration-150"
                    >
                      View Order
                    </button>
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

export default VendorPOList;
