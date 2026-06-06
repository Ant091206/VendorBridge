import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyRFQs } from '../api/rfqApi';
import { getMyOrders } from '../api/poApi';
import { getMyInvoices } from '../api/invoiceApi';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';

const VendorPortal = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [myOrdersCount, setMyOrdersCount] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const [rfqRes, poRes, invRes] = await Promise.all([
          getMyRFQs(),
          getMyOrders(),
          getMyInvoices()
        ]);
        setRfqs(rfqRes.data || []);
        setMyOrdersCount((poRes.data || []).length);
        setInvoices(invRes.data || []);
      } catch (err) {
        console.error('Failed to load vendor portal metrics:', err);
        setToastType('error');
        setToastMessage(err.message || 'Failed to load invited RFQ list or orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  // Format Date to "DD MMM YYYY"
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

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

  // Status badges mapping for invoices
  const getInvoiceStatusBadge = (status) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case 'generated':
        return (
          <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Generated
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Received
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-350">
            {status}
          </span>
        );
    }
  };

  // Compute portal stats
  const totalInvited = rfqs.length;
  const totalSubmitted = rfqs.filter(r => r.quotation_status === 'Submitted').length;
  const totalSelected = rfqs.filter(r => r.quotation_actual_status === 'selected').length;

  if (loading) {
    return <Spinner fullPage={false} />;
  }

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-8 shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <h2 className="text-2xl font-bold text-white sm:text-3xl font-sans">Welcome, {user?.name}!</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">
          Review Requests for Quotations (RFQs) published by the procurement team, submit technical bids, and track your active quotation statuses.
        </p>
      </div>

      {/* Invited Summary stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total RFQs Invited"
          value={totalInvited}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Quotes Submitted"
          value={totalSubmitted}
          icon="✉️"
          color="amber"
        />
        <StatCard
          title="Quotes Selected"
          value={totalSelected}
          icon="🏆"
          color="emerald"
        />
        <StatCard
          title="My Purchase Orders"
          value={myOrdersCount}
          icon="🛍️"
          color="cyan"
        />
        <StatCard
          title="My Invoices"
          value={invoices.length}
          icon="🧾"
          color="purple"
        />
      </div>

      {/* Invited Opportunities List */}
      <div id="quotes" className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">RFQ Invitations</h3>

        {rfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-500 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-white">No Invitations Yet</h4>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              You haven't been invited to any active RFQs yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/20">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-5 py-3">RFQ Title</th>
                  <th scope="col" className="px-5 py-3">Quantity</th>
                  <th scope="col" className="px-5 py-3">Deadline</th>
                  <th scope="col" className="px-5 py-3">My Quotation Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {rfqs.map((rfq) => {
                  const isSubmitted = rfq.quotation_status === 'Submitted';
                  const isClosed = rfq.status === 'closed';
                  const isWinner = rfq.quotation_actual_status === 'selected';
                  const isRejected = rfq.quotation_actual_status === 'rejected';

                  return (
                    <tr key={rfq.id} className="hover:bg-slate-900/20 transition">
                      <td className="px-5 py-3">
                        <div>
                          <span className="font-semibold text-white block">{rfq.title}</span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate max-w-xs">{rfq.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-350 font-mono font-medium">{rfq.quantity} units</td>
                      <td className="px-5 py-3 text-xs text-slate-400 font-semibold">{formatDate(rfq.deadline)}</td>
                      <td className="px-5 py-3">
                        {isWinner ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Selected ✓
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Not Selected
                          </span>
                        ) : (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isSubmitted
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : isClosed
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {isSubmitted ? 'Submitted' : isClosed ? 'Closed' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex flex-col items-end gap-1 justify-center min-h-[40px]">
                          {!isSubmitted && !isClosed ? (
                            <Link
                              to={`/vendor/submit-quote/${rfq.id}`}
                              className="inline-flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-md shadow-indigo-600/10"
                            >
                              Submit Quote
                            </Link>
                          ) : isSubmitted && !isWinner && !isRejected ? (
                            <>
                              <Link
                                to={`/vendor/edit-quote/${rfq.quotation_id}`}
                                className="inline-flex items-center rounded-lg bg-amber-550 bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition shadow-md shadow-amber-600/10"
                              >
                                Edit Quote
                              </Link>
                              {rfq.unit_price && (
                                <span className="text-[10px] font-bold font-mono text-slate-500">
                                  Bid: ₹ {Number(rfq.unit_price).toLocaleString('en-IN')}
                                </span>
                              )}
                            </>
                          ) : isWinner ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-emerald-400 font-sans">Winner Awarded</span>
                              {rfq.unit_price && (
                                <span className="text-[10px] font-bold font-mono text-slate-500">
                                  Rate: ₹ {Number(rfq.unit_price).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3">Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Invoices List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Invoices</h3>
          <Link
            to="/vendor/my-invoices"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-350 transition duration-150"
          >
            View All Invoices &rarr;
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-850 text-slate-500 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m0-7v.01M12 22a9 9 0 110-18 9 9 0 010 18z" />
              </svg>
            </div>
            <h4 className="font-semibold text-white">No Invoices Issued</h4>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Billing invoices will appear here once the procurement team generates them from approved Purchase Orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/20">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-5 py-3">Invoice #</th>
                  <th scope="col" className="px-5 py-3">PO Number</th>
                  <th scope="col" className="px-5 py-3">Amount</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Issued Date</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-900/20 transition">
                    <td className="px-5 py-3 font-mono font-bold text-white">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-450">{invoice.po_number}</td>
                    <td className="px-5 py-3 text-slate-250 font-bold">{formatCurrency(invoice.grand_total)}</td>
                    <td className="px-5 py-3">
                      {getInvoiceStatusBadge(invoice.status)}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-semibold">{formatDate(invoice.issued_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="inline-flex items-center rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPortal;
