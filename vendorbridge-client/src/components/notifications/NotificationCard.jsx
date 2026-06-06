import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, ClipboardList, CheckCircle2, XCircle, ShoppingCart, 
  Receipt, Bell, Eye
} from 'lucide-react';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
};

const getMeta = (type, title = '') => {
  const lowercaseTitle = title.toLowerCase();
  
  switch (type) {
    case 'RFQ':
      return { icon: FileText, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' };
    case 'Quotation':
      return { icon: ClipboardList, color: 'text-teal-500 bg-teal-50 border-teal-100' };
    case 'Approval':
      if (lowercaseTitle.includes('approved') || lowercaseTitle.includes('accept')) {
        return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
      }
      if (lowercaseTitle.includes('rejected') || lowercaseTitle.includes('decline')) {
        return { icon: XCircle, color: 'text-rose-500 bg-rose-50 border-rose-100' };
      }
      return { icon: CheckCircle2, color: 'text-amber-500 bg-amber-50 border-amber-100' };
    case 'Purchase Order':
      return { icon: ShoppingCart, color: 'text-purple-500 bg-purple-50 border-purple-100' };
    case 'Invoice':
      return { icon: Receipt, color: 'text-cyan-500 bg-cyan-50 border-cyan-100' };
    default:
      return { icon: Bell, color: 'text-slate-500 bg-slate-50 border-slate-100' };
  }
};

const NotificationCard = ({ notification, onMarkRead, role }) => {
  const navigate = useNavigate();
  const { id, title, message, type, is_read, reference_type, reference_id, created_at } = notification;
  const meta = getMeta(type, title);
  const Icon = meta.icon;

  const handleCardClick = (e) => {
    // If the click is on the mark as read button, ignore navigation
    if (e.target.closest('.mark-read-btn')) return;

    if (!reference_type || !reference_id) return;

    // Navigate to reference entity
    switch (reference_type) {
      case 'rfq':
        navigate(`/rfqs/${reference_id}`);
        break;
      case 'quotation':
        if (role === 'vendor') {
          navigate('/quotations/vendor');
        } else {
          navigate('/quotations');
        }
        break;
      case 'approval':
        navigate(`/approvals/${reference_id}`);
        break;
      case 'purchase_order':
        if (role === 'vendor') {
          navigate('/vendor/my-orders');
        } else {
          navigate(`/purchase-orders/${reference_id}`);
        }
        break;
      case 'invoice':
        if (role === 'vendor') {
          navigate('/vendor/my-invoices');
        } else {
          navigate(`/invoices/${reference_id}`);
        }
        break;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
        is_read 
          ? 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm' 
          : 'border-indigo-100 bg-indigo-50/20 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5'
      }`}
    >
      {/* Icon Badge */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
        <Icon size={20} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-bold truncate ${is_read ? 'text-slate-900' : 'text-indigo-950'}`}>
            {title}
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
            {timeAgo(created_at)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">
          {message}
        </p>
      </div>

      {/* Unread Indicator & Mark Read Button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {!is_read && (
          <button
            onClick={() => onMarkRead(id)}
            className="mark-read-btn flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-500 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 transition duration-150 shadow-sm"
            title="Mark as read"
          >
            <Eye size={14} />
          </button>
        )}
        {!is_read && (
          <span className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-0 transition duration-150" />
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
