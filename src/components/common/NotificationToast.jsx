import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const NotificationToast = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-400" />,
    warning: <AlertTriangle size={18} className="text-amber-400" />,
    danger: <XCircle size={18} className="text-rose-400" />,
    info: <Info size={18} className="text-blue-400" />
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(16, 22, 35, 0.95)',
        color: '#f8fafc',
        padding: '12px 18px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        fontSize: '0.9rem',
        fontWeight: '500',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {icons[toastMessage.type] || icons.success}
      <span>{toastMessage.text}</span>
    </div>
  );
};
