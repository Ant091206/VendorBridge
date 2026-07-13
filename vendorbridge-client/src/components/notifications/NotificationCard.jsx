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
      return { icon: FileText, color: 'text-green-500 bg-green-50 border-indigo-100' };
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
      return { icon: ShoppingCart, color: 'text-purple-500 bg-green-50 border-purple-100' };
    case 'Invoice':
      return { icon: Receipt, color: 'text-cyan-500 bg-cyan-50 border-cyan-100' };
    default:
      return { icon: Bell, color: 'text-slate-500 bg-slate-50 border-slate-100' };
  }
};

const NotificationCard = ({ notification, onMarkRead, onArchive, onDelete, role }) => {
  const navigate = useNavigate();
  
  // Adapt to Module 9 database changes
  const { 
    id, 
    title, 
    message, 
    notification_type, 
    type,
    status, 
    is_read: oldIsRead, 
    reference_module, 
    reference_type, 
    reference_id, 
    created_at 
  } = notification;

  const resolvedType = notification_type || type;
  const resolvedRefModule = reference_module || reference_type;
  const is_read = status ? (status === 'Read' || status === 'Archived') : (oldIsRead === 1 || oldIsRead === true);
  const is_archived = status === 'Archived';

  const meta = getMeta(resolvedType, title);
  const Icon = meta.icon;

  const handleCardClick = (e) => {
    // If the click is on the buttons, ignore navigation
    if (
      e.target.closest('.mark-read-btn') || 
      e.target.closest('.archive-btn') || 
      e.target.closest('.delete-btn')
    ) return;

    if (!resolvedRefModule || !reference_id) return;

    // Navigate to reference entity
    switch (resolvedRefModule.toLowerCase()) {
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
          ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm' 
          : 'border-primary/20 bg-primary/5 hover:border-primary/30 hover:shadow-premium'
      }`}
    >
      {/* Icon Badge */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
        <Icon size={20} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-20">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-bold truncate ${is_read ? 'text-slate-900' : 'text-slate-950 font-black'}`}>
            {title}
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
            {timeAgo(created_at)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
          {message}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {/* Mark Read */}
        {!is_read && onMarkRead && (
          <button
            onClick={() => onMarkRead(id)}
            className="mark-read-btn flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-white text-primary opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-white transition duration-150 shadow-sm cursor-pointer"
            title="Mark as read"
          >
            <Eye size={13} />
          </button>
        )}
        
        {/* Archive */}
        {!is_archived && onArchive && (
          <button
            onClick={() => onArchive(id)}
            className="archive-btn flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 transition duration-150 shadow-sm cursor-pointer"
            title="Archive notification"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
        )}

        {/* Delete / Dismiss */}
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="delete-btn flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition duration-150 shadow-sm cursor-pointer"
            title="Dismiss notification"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {!is_read && (
          <span className="h-2 w-2 rounded-full bg-primary group-hover:scale-0 transition duration-150 shrink-0 ml-1.5" />
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
