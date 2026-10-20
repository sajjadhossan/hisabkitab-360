import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { POSPermissionsSettings } from '../business/POSPermissionsSettings';
import { playButtonClick } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const StaffPermissionsModal = ({ isOpen, onClose, lang = 'bn' }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    playButtonClick();
    hapticFeedback.light();
    onClose();
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          background: 'var(--bg-secondary)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '🛡️ স্টাফ রোল ও মেনু অন/অফ কন্ট্রোল সেন্টার' : '🛡️ Staff Access & Menu Control Center'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'সেলসম্যান, ক্যাশিয়ার বা ডেলিভারি ম্যানদের জন্য যেকোনো অপশন ১-ক্লিকে অন/অফ করুন'
                  : 'Toggle options ON/OFF for Cashiers, Salesmen and Delivery staff'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn-icon"
            style={{ width: '34px', height: '34px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            flex: 1
          }}
        >
          <POSPermissionsSettings lang={lang} onSaved={() => {}} />
        </div>
      </div>
    </div>
  );
};
