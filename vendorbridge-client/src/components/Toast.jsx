import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Toast Notification Component
 * Light theme with colored left border, slide-in animation, and auto-dismiss.
 *
 * Props:
 *   - message: String to display
 *   - type: 'success' | 'error' | 'info'
 *   - onClose: Callback on dismiss
 *   - duration: ms before auto-dismiss (default 3500)
 */
const DURATION = 3500;

const typeConfig = {
  success: {
    icon: CheckCircle,
    border: '#16A34A',
    bg: '#F0FDF4',
    text: '#15803D',
    iconColor: '#16A34A',
    label: 'Success',
  },
  error: {
    icon: XCircle,
    border: '#DC2626',
    bg: '#FEF2F2',
    text: '#B91C1C',
    iconColor: '#DC2626',
    label: 'Error',
  },
  info: {
    icon: Info,
    border: '#2563EB',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    iconColor: '#2563EB',
    label: 'Info',
  },
};

const Toast = ({ message, type = 'info', onClose, duration = DURATION }) => {
  const [exiting, setExiting] = useState(false);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => { if (onClose) onClose(); }, 200);
  };

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] w-80 max-w-[calc(100vw-40px)]"
      style={{ animation: exiting ? 'none' : 'toast-enter 200ms ease forwards' }}
    >
      <div
        className="flex items-start gap-3 rounded-lg bg-white border border-[#E5E7EB] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-4px_rgba(0,0,0,0.04)] p-4 overflow-hidden"
        style={{ borderLeft: `3px solid ${config.border}` }}
      >
        <Icon size={16} className="shrink-0 mt-0.5" style={{ color: config.iconColor }} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#111827]">{message}</p>
        </div>

        <button
          onClick={handleClose}
          className="shrink-0 text-[#9CA3AF] hover:text-[#374151] transition-colors duration-100 cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="h-0.5 rounded-full mt-1.5 mx-1"
        style={{
          backgroundColor: config.border,
          animation: `progress-shrink ${duration}ms linear forwards`,
          opacity: 0.5,
        }}
      />
    </div>
  );
};

export default Toast;
