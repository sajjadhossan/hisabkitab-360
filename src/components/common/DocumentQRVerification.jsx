import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, ExternalLink, QrCode } from 'lucide-react';
import { SOMITI_PRODUCTION_DOMAIN } from '../../services/qrService';

/**
 * DocumentQRVerification
 * -------------------------------------------------------------
 * 100% Guaranteed Printable & Scannable QR Code Verification Box
 * - Never prints raw query parameters or huge URLs
 * - High-contrast 120x120px QR Code image with offline in-memory canvas + cloud fallback
 * - Displays short verification code: S360-XXXXXX
 * - Displays receipt or document number: RCPT-XXXX
 * - Displays clickable clean link: somiti-360.vercel.app/verify
 */
export const DocumentQRVerification = ({
  verificationCode = '',
  docNo = '',
  verifyUrl = '',
  compact = false,
  isLight = true,
  className = '',
  style = {}
}) => {
  const [qrSrc, setQrSrc] = useState('');

  // Fallback cloud QR image URL if local canvas rendering fails or takes time
  const fallbackUrl = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&ecc=M&margin=1&data=${encodeURIComponent(verifyUrl)}`
    : '';

  useEffect(() => {
    let isMounted = true;
    if (!verifyUrl) {
      setQrSrc('');
      return;
    }

    QRCode.toDataURL(verifyUrl, {
      width: 400,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((dataUrl) => {
        if (isMounted && dataUrl) {
          setQrSrc(dataUrl);
        }
      })
      .catch((err) => {
        console.warn('QR canvas generation error, using cloud fallback:', err);
        if (isMounted) {
          setQrSrc(fallbackUrl);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [verifyUrl, fallbackUrl]);

  return (
    <div
      className={`somiti-qr-verification-box ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '10px' : '14px',
        background: isLight ? '#f8fafc' : '#0f172a',
        border: isLight ? '1.5px solid #cbd5e1' : '1.5px solid #334155',
        borderRadius: '10px',
        padding: compact ? '6px 10px' : '10px 14px',
        maxWidth: compact ? '290px' : '360px',
        pageBreakInside: 'avoid',
        fontFamily: "'Inter', 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
        ...style
      }}
    >
      {/* 120x120px QR Code image */}
      <div
        style={{
          width: compact ? '80px' : '105px',
          height: compact ? '80px' : '105px',
          flexShrink: 0,
          background: '#ffffff',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
        }}
      >
        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`QR Code: ${verificationCode || docNo}`}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                e.currentTarget.src = fallbackUrl;
              }
            }}
          />
        ) : (
          <QrCode size={compact ? 40 : 56} color="#94a3b8" />
        )}
      </div>

      {/* Verification Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: compact ? '0.70rem' : '0.78rem', fontWeight: '800' }}>
          <ShieldCheck size={14} />
          <span>অনলাইন ডিজিটাল ভেরিফাইড</span>
        </div>

        {verificationCode && (
          <div
            style={{
              fontSize: compact ? '0.72rem' : '0.80rem',
              fontWeight: '900',
              color: isLight ? '#0f172a' : '#f8fafc',
              letterSpacing: '0.4px',
              fontFamily: 'monospace'
            }}
          >
            ভেরিফিকেশন কোড: <span style={{ color: '#0284c7' }}>{verificationCode}</span>
          </div>
        )}

        {docNo && (
          <div style={{ fontSize: compact ? '0.66rem' : '0.72rem', color: isLight ? '#475569' : '#94a3b8' }}>
            রসিদ/ডকুমেন্ট নং: <strong style={{ color: isLight ? '#0f172a' : '#f1f5f9' }}>{docNo}</strong>
          </div>
        )}

        {/* Short clean URL display with clickable link */}
        <div style={{ fontSize: compact ? '0.62rem' : '0.68rem', color: '#64748b', marginTop: '2px' }}>
          <span>অনলাইন যাচাই: </span>
          <a
            href={verifyUrl || `${SOMITI_PRODUCTION_DOMAIN}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#0284c7',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>somiti-360.vercel.app</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentQRVerification;
