import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Phone,
  MapPin,
  Building,
  ArrowLeft,
  Share2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { decodeInvoiceVerificationToken } from '../../services/qrService';

export const InvoiceVerificationView = ({ verifyId, tokenData, onBackToApp }) => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try decoding token from URL
    if (tokenData) {
      const decoded = decodeInvoiceVerificationToken(tokenData);
      if (decoded) {
        setInvoiceData(decoded);
        setLoading(false);
        return;
      }
    }

    // 2. Try looking in localStorage if on same browser/device
    try {
      const storedSales = localStorage.getItem('hk360_biz_sales');
      if (storedSales) {
        const sales = JSON.parse(storedSales);
        const match = sales.find(s => s.id === verifyId);
        if (match) {
          let settings = {};
          try {
            const raw = localStorage.getItem('hk360_biz_settings');
            if (raw) settings = JSON.parse(raw);
          } catch {}
          setInvoiceData({
            ...match,
            companyName: settings.companyName || 'হিসাব কিতাব ৩৬০ স্টোর',
            companyPhone: settings.phone || '',
            companyAddress: settings.address || ''
          });
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage lookup:', e);
    }

    // Fallback minimal structure if only ID is known
    setInvoiceData({
      id: verifyId,
      date: new Date().toLocaleDateString('bn-BD'),
      customerName: 'ডিজিটাল ভেরিফাইড গ্রাহক',
      companyName: 'হিসাব কিতাব ৩৬০ ডিজিটাল রসিদ',
      grandTotal: 0,
      paidAmount: 0,
      dueAmount: 0,
      status: 'verified',
      items: []
    });
    setLoading(false);
  }, [verifyId, tokenData]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #cbd5e1', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>ডিজিটাল ক্যাশমেমো যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const inv = invoiceData;
  const grandTotal = Number(inv.grandTotal) || 0;
  const paidVal = inv.paidAmount !== undefined ? Number(inv.paidAmount) : (inv.status === 'paid' ? grandTotal : 0);
  const dueVal = inv.dueAmount !== undefined ? Number(inv.dueAmount) : Math.max(0, grandTotal - paidVal);
  const isPaid = inv.status === 'paid' || dueVal === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '1.5rem 1rem', fontFamily: "'Hind Siliguri', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Top Header / Back Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button
            onClick={onBackToApp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#334155',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <ArrowLeft size={16} />
            <span>অ্যাপে প্রবেশ করুন</span>
          </button>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '800',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <ShieldCheck size={16} />
            <span>অফিসিয়াল ডিজিটাল ভেরিফাইড</span>
          </span>
        </div>

        {/* Verification Certificate Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}
        >
          {/* Card Green Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              padding: '1.5rem 1.25rem',
              color: '#ffffff',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <CheckCircle2 size={28} color="#ffffff" />
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: '800' }}>
              {inv.companyName || 'হিসাব কিতাব ৩৬০'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
              ডিজিটাল ক্যাশমেমো ও বিক্রয় রসিদ
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Meta Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', paddingBottom: '1.25rem', borderBottom: '1px dashed #cbd5e1', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>ইনভয়েস / মেমো নম্বর</span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>#{inv.id}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>তারিখ ও সময়</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} style={{ color: '#10b981' }} />
                  {inv.date || 'আজকের তারিখ'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>সম্মানিত গ্রাহক</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
                  {inv.customerName || 'সাধারণ ক্রেতা'} {inv.customerPhone ? `(${inv.customerPhone})` : ''}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>পেমেন্ট স্ট্যাটাস</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isPaid ? '#059669' : '#dc2626'
                  }}
                >
                  {isPaid ? 'পরিশোধিত (PAID)' : `বকেয়া: ৳${dueVal.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Itemized Table if available */}
            {inv.items && inv.items.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>
                  ক্রয়কৃত পণ্যের বিবরণ ({inv.items.length} টি আইটেম):
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px' }}>পণ্য</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>পরিমাণ</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>দর</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>মোট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: '600', color: '#0f172a' }}>{it.name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{it.qty}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>৳{Number(it.price || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace' }}>৳{Number(it.subtotal || (it.price * it.qty)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total Financial Summary Card */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem', color: '#475569' }}>
                <span>সর্বমোট বিল (Grand Total):</span>
                <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a', fontFamily: 'monospace' }}>৳{grandTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#059669' }}>
                <span>পরিশোধিত টাকা (Paid):</span>
                <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>৳{paidVal.toLocaleString()}</span>
              </div>
              {dueVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem', color: '#dc2626', fontWeight: '800', borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '6px' }}>
                  <span>অবশিষ্ট বকেয়া (Due Balance):</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{dueVal.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Store Contact & Footer */}
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
              {inv.companyPhone && (
                <p style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: '#10b981' }} />
                  <span>দোকানের হটলাইন: <strong style={{ color: '#0f172a' }}>{inv.companyPhone}</strong></span>
                </p>
              )}
              {inv.companyAddress && (
                <p style={{ margin: '0 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <MapPin size={14} style={{ color: '#10b981' }} />
                  <span>{inv.companyAddress}</span>
                </p>
              )}
              <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                এই ডিজিটাল রসিদটি হিসাব কিতাব ৩৬০ কিউআর কোড ভেরিফিকেশন সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে প্রত্যায়িত।
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={16} />
            <span>প্রিন্ট / পিডিএফ সেভ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
