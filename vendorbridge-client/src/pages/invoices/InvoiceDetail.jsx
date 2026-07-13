import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getInvoiceById, generateInvoice, cancelInvoice, markInvoicePaid,
  sendInvoiceEmail, downloadInvoicePDF, getInvoiceHistory, getEmailHistory
} from '../../api/invoiceApi';
import Spinner from '../../components/Spinner';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import {
  ArrowLeft, FileText, Download, Mail, DollarSign, XCircle,
  CheckCircle, Clock, ChevronDown, ChevronUp, Printer, Eye,
  Building2, Receipt, Package, Send, AlertTriangle
} from 'lucide-react';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(parseFloat(v) || 0);

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG = {
  Draft:     { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
  Generated: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
  Sent:      { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Send },
  Viewed:    { color: 'bg-green-50 text-purple-700 border-green-200', icon: Eye },
  Paid:      { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  Cancelled: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

const HISTORY_ICONS = {
  Created:    { icon: '✏️', color: 'bg-slate-100 border-slate-200' },
  Generated:  { icon: '📄', color: 'bg-blue-50 border-blue-200' },
  Updated:    { icon: '🔄', color: 'bg-sky-50 border-sky-200' },
  Downloaded: { icon: '⬇️', color: 'bg-green-50 border-indigo-200' },
  Printed:    { icon: '🖨️', color: 'bg-violet-50 border-violet-200' },
  Sent:       { icon: '📧', color: 'bg-amber-50 border-amber-200' },
  Viewed:     { icon: '👁️', color: 'bg-green-50 border-green-200' },
  Paid:       { icon: '✅', color: 'bg-emerald-50 border-emerald-200' },
  Cancelled:  { icon: '❌', color: 'bg-rose-50 border-rose-200' },
  EmailFailed:{ icon: '⚠️', color: 'bg-orange-50 border-orange-200' },
};

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-primary" />
          <span className="font-black text-slate-900">{title}</span>
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
};

const InfoRow = ({ label, value, mono = false, highlight = false }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-semibold text-slate-500 w-2/5">{label}</span>
    <span className={`text-xs text-right w-3/5 ${mono ? 'font-mono' : ''} ${highlight ? 'font-black text-primary' : 'font-semibold text-slate-800'}`}>
      {value || '—'}
    </span>
  </div>
);

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [history, setHistory] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [payModal, setPayModal] = useState(false);
  const [payRef, setPayRef] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, histRes, emailRes] = await Promise.all([
        getInvoiceById(id),
        getInvoiceHistory(id),
        getEmailHistory(id).catch(() => ({ data: [] }))
      ]);
      setInvoice(invRes.data);
      setHistory(histRes.data || []);
      setEmailHistory(emailRes.data || []);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to load invoice.', 'error');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const setAL = (k, v) => setActionLoading(p => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    setAL('generate', true);
    try {
      await generateInvoice(id);
      showToast('Invoice generated successfully!');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Generate failed.', 'error'); }
    finally { setAL('generate', false); }
  };

  const handleCancel = async () => {
    setModal(null);
    setAL('cancel', true);
    try {
      await cancelInvoice(id, 'Cancelled by procurement officer.');
      showToast('Invoice cancelled.');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Cancel failed.', 'error'); }
    finally { setAL('cancel', false); }
  };

  const handleEmail = async () => {
    setModal(null);
    setAL('email', true);
    try {
      const r = await sendInvoiceEmail(id);
      showToast(r.status === 'success' ? 'Invoice emailed to vendor!' : r.message || 'Email queued.', r.status === 'success' ? 'success' : 'warning');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Email failed.', 'error'); }
    finally { setAL('email', false); }
  };

  const handleMarkPaid = async () => {
    setPayModal(false);
    setAL('pay', true);
    try {
      await markInvoicePaid(id, { payment_reference: payRef, remarks: `Payment received. Ref: ${payRef || 'N/A'}` });
      showToast('Invoice marked as Paid!');
      setPayRef('');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Mark paid failed.', 'error'); }
    finally { setAL('pay', false); }
  };

  const handleDownload = async () => {
    setAL('download', true);
    try {
      await downloadInvoicePDF(id, invoice?.invoice_number);
      showToast('PDF downloaded.');
    } catch (e) { showToast('PDF download failed.', 'error'); }
    finally { setAL('download', false); }
  };

  const handlePrint = () => {
    navigate(`/invoices/${id}/preview`);
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Spinner size="xl" />
    </div>
  );

  if (!invoice) return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <p className="text-3xl">❌</p>
      <h3 className="mt-3 font-black text-rose-900">Invoice Not Found</h3>
      <Link to="/invoices" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-rose-700 hover:underline">
        <ArrowLeft size={13} /> Back to Invoices
      </Link>
    </div>
  );

  const st = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.Draft;
  const StIcon = st.icon;
  const isOverdue = new Date(invoice.due_date) < new Date() && !['Paid', 'Cancelled'].includes(invoice.status);
  const canGenerate = invoice.status === 'Draft';
  const canSendEmail = ['Generated', 'Sent', 'Viewed'].includes(invoice.status);
  const canMarkPaid = ['Generated', 'Sent', 'Viewed'].includes(invoice.status);
  const canCancel = !['Paid', 'Cancelled'].includes(invoice.status);

  const cgst = (parseFloat(invoice.tax_amount) || 0) / 2;
  const sgst = cgst;

  return (
    <div className="space-y-5 max-w-5xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {modal === 'cancel' && (
        <ConfirmModal
          message={`Cancel Invoice ${invoice.invoice_number}? This action will void the invoice.`}
          onConfirm={handleCancel}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'email' && (
        <ConfirmModal
          message={`Send Invoice ${invoice.invoice_number} as PDF email to ${invoice.vendor_email}?`}
          onConfirm={handleEmail}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">Mark Invoice as Paid</h3>
            <p className="text-sm text-slate-500 mb-4">Invoice: <strong>{invoice.invoice_number}</strong> — {fmt(invoice.grand_total)}</p>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Payment Reference (Optional)</label>
            <input
              type="text"
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              placeholder="UTR, Transaction ID, Cheque No..."
              className="premium-input w-full mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setPayModal(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleMarkPaid} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-primary transition mb-2">
            <ArrowLeft size={13} /> Invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-950 font-mono">{invoice.invoice_number}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${st.color}`}>
              <StIcon size={11} /> {invoice.status}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-700">
                <AlertTriangle size={11} /> Overdue
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">PO: <span className="font-mono font-bold text-primary">{invoice.po_number}</span> • Due: <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>{fmtDate(invoice.due_date)}</span></p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 self-start">
          <button onClick={handleDownload} disabled={actionLoading.download} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition disabled:opacity-40 shadow-sm">
            <Download size={12} /> {actionLoading.download ? 'Generating...' : 'PDF'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm">
            <Printer size={12} /> Print
          </button>
          {canGenerate && (
            <button onClick={handleGenerate} disabled={actionLoading.generate} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
              <FileText size={12} /> {actionLoading.generate ? 'Generating...' : 'Generate'}
            </button>
          )}
          {canSendEmail && (
            <button onClick={() => setModal('email')} disabled={actionLoading.email} className="flex items-center gap-1.5 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white transition disabled:opacity-40 shadow-sm">
              <Mail size={12} /> {actionLoading.email ? 'Sending...' : 'Email'}
            </button>
          )}
          {canMarkPaid && (
            <button onClick={() => setPayModal(true)} disabled={actionLoading.pay} className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-transparent transition disabled:opacity-40 shadow-sm">
              <DollarSign size={12} /> Mark Paid
            </button>
          )}
          {canCancel && (
            <button onClick={() => setModal('cancel')} disabled={actionLoading.cancel} className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-600 hover:text-white hover:border-transparent transition disabled:opacity-40 shadow-sm">
              <XCircle size={12} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Items + Tax */}
        <div className="lg:col-span-2 space-y-5">
          {/* Line Items */}
          <Section title="Line Items" icon={Package}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">#</th>
                    <th className="px-5 py-3 text-left">Item</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-center">Unit</th>
                    <th className="px-5 py-3 text-right">Unit Price</th>
                    <th className="px-5 py-3 text-center">Disc %</th>
                    <th className="px-5 py-3 text-center">Tax %</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(invoice.items || []).length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No items</td></tr>
                  ) : (invoice.items || []).map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                      <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900">{item.item_name}</div>
                        {item.description && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{item.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-slate-700">{parseFloat(item.quantity).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-center text-slate-500">{item.unit}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">{fmt(item.unit_price)}</td>
                      <td className={`px-5 py-3 text-center font-bold ${parseFloat(item.discount_percentage) > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                        {parseFloat(item.discount_percentage || 0).toFixed(1)}%
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600">{parseFloat(item.tax_percentage || 0).toFixed(1)}%</td>
                      <td className="px-5 py-3 text-right font-black text-slate-900">{fmt(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Tax Summary */}
          <Section title="Tax & Price Summary" icon={Receipt}>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {/* GST Breakdown */}
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 mb-3">GST Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold text-slate-800">{fmt(invoice.subtotal)}</span></div>
                  {parseFloat(invoice.discount_amount) > 0 && (
                    <div className="flex justify-between"><span className="text-rose-500">Discount</span><span className="font-bold text-rose-600">- {fmt(invoice.discount_amount)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-slate-500">CGST (9%)</span><span className="font-semibold text-slate-800">{fmt(cgst)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">SGST (9%)</span><span className="font-semibold text-slate-800">{fmt(sgst)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Total GST</span><span className="font-bold text-slate-900">{fmt(invoice.tax_amount)}</span></div>
                </div>
              </div>
              {/* Grand Total */}
              <div className="flex flex-col justify-between">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{fmt(invoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-semibold">{fmt(invoice.tax_amount)}</span></div>
                  {parseFloat(invoice.round_off_amount) !== 0 && (
                    <div className="flex justify-between"><span className="text-slate-400 text-xs">Round Off</span><span className="text-xs text-slate-400">{parseFloat(invoice.round_off_amount) > 0 ? '+' : ''}{parseFloat(invoice.round_off_amount).toFixed(4)}</span></div>
                  )}
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mt-3 text-center">
                  <div className="text-xs font-bold uppercase tracking-wide text-primary/70 mb-1">Grand Total</div>
                  <div className="text-2xl font-black text-primary">{fmt(invoice.grand_total)}</div>
                  <div className="text-xs text-slate-500 mt-1">{invoice.payment_status} • {invoice.payment_terms}</div>
                </div>
              </div>
            </div>
          </Section>

          {/* Email History */}
          {emailHistory.length > 0 && (
            <Section title={`Email History (${emailHistory.length})`} icon={Mail} defaultOpen={false}>
              <div className="divide-y divide-slate-50 p-1">
                {emailHistory.map(e => (
                  <div key={e.id} className="flex items-start justify-between px-5 py-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{e.recipient_email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{e.email_subject}</div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                        e.email_status === 'Sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>{e.email_status}</span>
                      <div className="text-[10px] text-slate-400 mt-1">{fmtDate(e.sent_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right Column: Info + Timeline */}
        <div className="space-y-5">
          {/* Vendor */}
          <Section title="Vendor Details" icon={Building2}>
            <div className="p-4 space-y-0.5">
              <div className="font-black text-slate-900 text-sm mb-2">{invoice.vendor_name}</div>
              <InfoRow label="Email" value={invoice.vendor_email} mono />
              <InfoRow label="Phone" value={invoice.vendor_phone} />
              <InfoRow label="GST Number" value={invoice.vendor_gst} mono />
              <InfoRow label="Address" value={invoice.vendor_address} />
            </div>
          </Section>

          {/* Invoice Info */}
          <Section title="Invoice Info" icon={FileText}>
            <div className="p-4 space-y-0.5">
              <InfoRow label="Invoice #" value={invoice.invoice_number} mono highlight />
              <InfoRow label="PO Number" value={invoice.po_number} mono />
              <InfoRow label="Issue Date" value={fmtDate(invoice.issue_date)} />
              <InfoRow label="Due Date" value={fmtDate(invoice.due_date)} />
              <InfoRow label="Payment Terms" value={invoice.payment_terms} />
              <InfoRow label="Pay Status" value={invoice.payment_status} />
              {invoice.payment_reference && <InfoRow label="Payment Ref" value={invoice.payment_reference} mono />}
              <InfoRow label="RFQ" value={invoice.rfq_title} />
              <InfoRow label="Approval #" value={invoice.approval_number} mono />
              <InfoRow label="Created By" value={invoice.created_by_name} />
              {invoice.notes && <InfoRow label="Notes" value={invoice.notes} />}
            </div>
          </Section>

          {/* History Timeline */}
          <Section title={`Timeline (${history.length} events)`} icon={Clock}>
            <div className="p-4">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No history yet.</p>
              ) : (
                <ol className="relative border-l border-slate-200 ml-3 space-y-4">
                  {[...history].reverse().map((h, i) => {
                    const hcfg = HISTORY_ICONS[h.action_type] || HISTORY_ICONS.Updated;
                    return (
                      <li key={h.id} className="ml-6">
                        <span className={`absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full border text-sm ${hcfg.color}`}>
                          {hcfg.icon}
                        </span>
                        <div>
                          <div className="text-xs font-black text-slate-800">{h.action_type}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{h.action_by_name} • {fmtDate(h.action_date)}</div>
                          {h.remarks && <div className="text-[10px] text-slate-400 mt-1 italic">{h.remarks}</div>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
