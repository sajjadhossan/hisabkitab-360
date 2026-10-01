import React from 'react';
import { MasterHub } from './MasterHub';
import { X } from 'lucide-react';

export const MasterHubModal = ({ isOpen, onClose, onNavigateToPos, onNavigateToInventory }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay modal-backdrop modal-top-align"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1250,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px 12px',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '1200px',
          width: '98%',
          marginTop: '6px',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>
            <span>📁</span>
            <span>মাস্টার ডাটা ও ফোল্ডার সেটআপ হাব</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem' }}>
          <MasterHub
            onNavigateToPos={() => {
              if (onNavigateToPos) onNavigateToPos();
              onClose();
            }}
            onNavigateToInventory={() => {
              if (onNavigateToInventory) onNavigateToInventory();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};
