import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInvoices } from '../../api/invoiceApi';
import { downloadInvoicePDF } from '../../utils/downloadPDF';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';

/**
 * VendorInvoices Page Component
 * Renders a list of invoices issued to the logged-in vendor.
 */
const VendorInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Action state trackers
  const [downloadingId, setDownloadingId] = useState(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchVendorInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyInvoices();
      if (response.status === 'success') {
        setInvoices(response.data || []);
      } else {
        setError('Failed to fetch invoices.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorInvoices();
  }, []);

  // Indian Currency format
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Date format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // PDF Trigger
  const handleDownload = async (e, invoiceId, invoiceNumber) => {
    e.stopPropagation(); // Avoid triggering row click navigation
    setDownloadingId(invoiceId);
    try {
      await downloadInvoicePDF(invoiceId, invoiceNumber);
      setToastType('success');
      setToastMessage(`Invoice PDF downloaded successfully.`);
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Status badges mapping
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
      case 'paid':
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-350">
            {status}
          </span>
        );
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold tracking-tight text-white">My Invoices</h1>
        <p className="text-sm text-slate-400">
          View billing histories, settlement statuses, and download official PDF tax invoices issued by the procurement team.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Invoices list */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-850 text-slate-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m0-7v.01M12 22a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">No Invoices Issued Yet</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Billing invoices will appear here once the procurement team generates them from approved Purchase Orders.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">Invoice #</th>
                <th className="py-4 px-5">PO Number</th>
                <th className="py-4 px-5">Description</th>
                <th className="py-4 px-5 text-right">Invoice Amount</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5">Issued Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm text-slate-350">
              {invoices.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/invoices/${item.id}`)}
                  className="hover:bg-slate-800/35 cursor-pointer transition duration-150 group"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-white group-hover:text-cyan-400 transition">
                    {item.invoice_number}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-450 font-semibold">{item.po_number}</td>
                  <td className="py-3.5 px-5 max-w-[200px] truncate font-medium text-slate-200">{item.rfq_title}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-100">{formatCurrency(item.grand_total)}</td>
                  <td className="py-3.5 px-5 text-center">{getStatusBadge(item.status)}</td>
                  <td className="py-3.5 px-5 text-slate-400">{formatDate(item.issued_at)}</td>
                  <td className="py-3.5 px-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/invoices/${item.id}`)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition duration-150"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, item.id, item.invoice_number)}
                      disabled={downloadingId === item.id}
                      className="rounded-lg border border-slate-700 bg-slate-850 px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition duration-150 disabled:opacity-50"
                    >
                      {downloadingId === item.id ? 'Loading...' : 'Download PDF'}
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

export default VendorInvoices;
