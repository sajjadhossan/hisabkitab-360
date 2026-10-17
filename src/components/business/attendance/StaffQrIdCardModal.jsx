import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  User,
  Phone,
  Building,
  Calendar,
  Sparkles,
  QrCode,
  Download
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { generateQrDataUrl } from '../../../services/qrService';
import { printElement } from '../../../services/printService';

export const StaffQrIdCardModal = ({ isOpen, onClose, employee }) => {
  const { lang, businessSettings } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (employee) {
      // Generate standard structured QR payload for attendance scanning
      const payload = JSON.stringify({
        type: 'HK360_STAFF_ATTENDANCE',
        empId: employee.id,
        name: employee.name,
        role: employee.role || 'Staff',
        section: employee.section || 'General',
        issuedAt: new Date().toISOString()
      });

      generateQrDataUrl(payload, { width: 260, margin: 1 }).then(url => {
        if (url) setQrDataUrl(url);
      });
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    printElement('printable-staff-id-card', {
      title: `Staff-ID-Card-${employee.name}`,
      paperType: 'a4'
    });
  };

  const companyName = businessSettings?.companyName || 'হিসাব কিতাব ৩৬০';
  const companyPhone = businessSettings?.phone || '';
  const companyAddress = businessSettings?.address || '';

  return (
    <div className="modal-overlay" style={{ zIndex: 1260 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '95%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '1.25rem',
          borderRadius: '16px'
        }}
      >
        {/* Controls - Hidden during print */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <QrCode size={14} />
              {lang === 'bn' ? 'স্টাফ ডিজিটাল আইডি কার্ড' : 'Staff Digital ID Card'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Printer size={15} />
              <span>{lang === 'bn' ? 'প্রিন্ট করুন' : 'Print Card'}</span>
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div id="printable-staff-id-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          {/* Card Front */}
          <div
            style={{
              width: '320px',
              minHeight: '480px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '2px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Hind Siliguri', -apple-system, sans-serif",
              color: '#0f172a'
            }}
          >
            {/* Header / Brand Strip */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '16px 14px',
                textAlign: 'center',
                color: '#ffffff',
                borderBottom: '4px solid #6366f1'
              }}
            >
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: '700' }}>
                {lang === 'bn' ? 'অফিসিয়াল আইডি কার্ড' : 'OFFICIAL ID CARD'}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '2px' }}>
                {companyName}
              </div>
            </div>

            {/* Photo / Avatar & Name */}
            <div style={{ padding: '16px 16px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: '3px solid #6366f1',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginBottom: '10px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                {employee.photo ? (
                  <img src={employee.photo} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={44} color="#64748b" />
                )}
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                {employee.name}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#4f46e5',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  marginTop: '4px'
                }}
              >
                {employee.role || (lang === 'bn' ? 'স্টাফ' : 'Staff')}
              </div>
            </div>

            {/* QR Code Container */}
            <div style={{ textAlign: 'center', padding: '6px 16px 12px' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Staff QR" style={{ width: '140px', height: '140px', display: 'block' }} />
                ) : (
                  <div style={{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={40} color="#cbd5e1" />
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                {lang === 'bn' ? 'হাজিরার জন্য কাউন্টারে স্ক্যান করুন' : 'Scan at counter for attendance'}
              </div>
            </div>

            {/* Meta details footer */}
            <div
              style={{
                marginTop: 'auto',
                background: '#f8fafc',
                padding: '10px 14px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.72rem',
                color: '#475569'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: '600' }}>আইডি নং:</span>
                <span style={{ fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>{employee.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: '600' }}>শাখা / বিভাগ:</span>
                <span style={{ fontWeight: '700' }}>{employee.section || 'সেলস ও কাউন্টার'}</span>
              </div>
              {employee.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600' }}>ফোন:</span>
                  <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{employee.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffQrIdCardModal;
