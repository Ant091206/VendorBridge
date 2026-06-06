import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllInvoices, updateInvoiceStatus, sendInvoiceEmail } from '../../api/invoiceApi';
import { downloadInvoicePDF } from '../../utils/downloadPDF';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

/**
 * InvoiceList Page Component
 * Allows procurement officers and administrators to search, filter, and process generated invoices.
 */
const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Action state trackers
  const [downloadingId, setDownloadingId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  // Confirmation Modal states
  const [modalContext, setModalContext] = useState(null); // { type: 'pay'|'email', id: number, label: string }

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await getAllInvoices(params);
      if (response.status === 'success') {
        setInvoices(response.data);
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
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Indian currency format
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
  const handleDownload = async (invoiceId, invoiceNumber) => {
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

  // Confirm triggers
  const triggerEmailConfirm = (id, label) => {
    setModalContext({ type: 'email', id, label });
  };

  const triggerPayConfirm = (id, label) => {
    setModalContext({ type: 'pay', id, label });
  };

  // Execute actions
  const handleConfirmAction = async () => {
    if (!modalContext) return;
    const { type, id, label } = modalContext;
    setModalContext(null);

    if (type === 'email') {
      setEmailingId(id);
      try {
        await sendInvoiceEmail(id);
        setToastType('success');
        setToastMessage(`Invoice ${label} sent successfully to vendor email.`);
        fetchInvoices();
      } catch (err) {
        console.error(err);
        setToastType('error');
        setToastMessage(err.message || 'Failed to dispatch email.');
      } finally {
        setEmailingId(null);
      }
    } else if (type === 'pay') {
      setProcessingId(id);
      try {
        await updateInvoiceStatus(id, 'paid');
        setToastType('success');
        setToastMessage(`Invoice ${label} marked as PAID.`);
        fetchInvoices();
      } catch (err) {
        console.error(err);
        setToastType('error');
        setToastMessage(err.message || 'Failed to update status.');
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Status badges style mapping
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

      {/* Confirmation Modals */}
      {modalContext && (
        <ConfirmModal
          message={
            modalContext.type === 'email'
              ? `Are you sure you want to send Invoice ${modalContext.label} as a PDF email attachment to the vendor?`
              : `Are you sure you want to mark Invoice ${modalContext.label} as PAID? This action is irreversible.`
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setModalContext(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">Invoices Registry</h1>
        <p className="text-sm text-slate-400">
          Monitor supplier billing records, dispatch PDF copies via email, and update payment settlement logs.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Search & Filter Options */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/60 p-4 rounded-xl border border-slate-850">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Invoice Number or Supplier name..."
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
            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2 text-sm text-slate-350 focus:border-cyan-500 focus:outline-none transition appearance-none"
          >
            <option value="">All Invoices</option>
            <option value="generated">Generated</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table & Lists */}
      {loading && invoices.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <Spinner />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2-2 4 4m0-7v.01M12 22a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">No Invoices Found</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            {searchTerm || statusFilter
              ? "No invoices match the requested filters or search text."
              : "Generate invoices from the Purchase Order details panel to start billing suppliers."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-5">Invoice #</th>
                <th className="py-4 px-5">PO Number</th>
                <th className="py-4 px-5">Vendor</th>
                <th className="py-4 px-5 text-right">Grand Total</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5">Date Generated</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm text-slate-350">
              {invoices.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/35 transition duration-150">
                  <td className="py-3.5 px-5 font-mono font-bold text-white">
                    <Link to={`/invoices/${item.id}`} className="hover:text-cyan-400 transition">
                      {item.invoice_number}
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-400 font-semibold">{item.po_number}</td>
                  <td className="py-3.5 px-5 font-semibold text-slate-200">{item.vendor_name}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-slate-100">{formatCurrency(item.grand_total)}</td>
                  <td className="py-3.5 px-5 text-center">{getStatusBadge(item.status)}</td>
                  <td className="py-3.5 px-5 text-slate-400">{formatDate(item.issued_at)}</td>
                  <td className="py-3.5 px-5 text-right space-x-2">
                    <Link
                      to={`/invoices/${item.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition duration-150"
                    >
                      View
                    </Link>
                    
                    <button
                      onClick={() => handleDownload(item.id, item.invoice_number)}
                      disabled={downloadingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-850 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition duration-150 disabled:opacity-50"
                    >
                      {downloadingId === item.id ? 'Loading...' : 'PDF'}
                    </button>

                    <button
                      onClick={() => triggerEmailConfirm(item.id, item.invoice_number)}
                      disabled={emailingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/25 hover:border-transparent px-3 py-1.5 text-xs font-semibold transition duration-150 disabled:opacity-50"
                    >
                      {emailingId === item.id ? 'Sending...' : 'Email'}
                    </button>

                    {item.status !== 'paid' && (
                      <button
                        onClick={() => triggerPayConfirm(item.id, item.invoice_number)}
                        disabled={processingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-transparent px-3 py-1.5 text-xs font-semibold transition duration-150 disabled:opacity-50"
                      >
                        {processingId === item.id ? 'Processing...' : 'Mark Paid'}
                      </button>
                    )}
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

export default InvoiceList;
