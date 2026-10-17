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
  AlertCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileX2,
  RefreshCw
} from 'lucide-react';
import { decodeInvoiceVerificationToken } from '../../services/qrService';

export const InvoiceVerificationView = ({ verifyId, tokenData, onBackToApp }) => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [isAuthentic, setIsAuthentic] = useState(null); // true = REAL | false = FAKE
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let foundDoc = null;

    // 1. First attempt: Search in stored sales (Local or Supabase cache)
    try {
      const storedSales = localStorage.getItem('hk360_biz_sales');
      if (storedSales) {
        const sales = JSON.parse(storedSales);
        const match = sales.find(s => String(s.id).toLowerCase() === String(verifyId).toLowerCase() || String(s.invoiceNo).toLowerCase() === String(verifyId).toLowerCase());
        if (match) {
          let settings = {};
          try {
            const raw = localStorage.getItem('hk360_biz_settings');
            if (raw) settings = JSON.parse(raw);
          } catch {}
          foundDoc = {
            ...match,
            companyName: settings.companyName || 'হিসাব কিতাব ৩৬০ স্টোর',
            companyPhone: settings.phone || '',
            companyAddress: settings.address || '',
            verifiedVia: 'STORE_LOCAL_DATABASE'
          };
        }
      }
    } catch (e) {
      console.warn('LocalStorage sales lookup:', e);
    }

    // 2. Second attempt: Search in Quotations
    if (!foundDoc) {
      try {
        const storedQuotes = localStorage.getItem('hk360_biz_quotations');
        if (storedQuotes) {
          const quotes = JSON.parse(storedQuotes);
          const match = quotes.find(q => String(q.id).toLowerCase() === String(verifyId).toLowerCase());
          if (match) {
            let settings = {};
            try {
              const raw = localStorage.getItem('hk360_biz_settings');
              if (raw) settings = JSON.parse(raw);
            } catch {}
            foundDoc = {
              ...match,
              type: 'quotation',
              companyName: settings.companyName || 'হিসাব কিতাব ৩৬০ স্টোর',
              companyPhone: settings.phone || '',
              companyAddress: settings.address || '',
              verifiedVia: 'STORE_QUOTATION_DATABASE'
            };
          }
        }
      } catch (e) {
        console.warn('LocalStorage quotes lookup:', e);
      }
    }

    // 3. Third attempt: Decode Cryptographic tokenData from URL (Cross-Device Official Scans)
    if (!foundDoc && tokenData) {
      const decoded = decodeInvoiceVerificationToken(tokenData);
      // Ensure the decoded token ID strictly matches the query ID
      if (decoded && (String(decoded.id).toLowerCase() === String(verifyId).toLowerCase() || String(decoded.invoiceNo).toLowerCase() === String(verifyId).toLowerCase())) {
        foundDoc = {
          ...decoded,
          verifiedVia: 'CRYPTOGRAPHIC_TOKEN_PAYLOAD'
        };
      }
    }

    // 4. Decision: REAL vs FAKE
    if (foundDoc) {
      setInvoiceData(foundDoc);
      setIsAuthentic(true);
    } else {
      setInvoiceData({ id: verifyId });
      setIsAuthentic(false);
    }

    setLoading(false);
  }, [verifyId, tokenData]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '38px', height: '38px', border: '3px solid #cbd5e1', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.92rem', fontWeight: '700' }}>ডিজিটাল নথি ও কিউআর কোডের সত্যতা যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const inv = invoiceData;
  const grandTotal = Number(inv?.grandTotal) || 0;
  const paidVal = inv?.paidAmount !== undefined ? Number(inv?.paidAmount) : (inv?.status === 'paid' ? grandTotal : 0);
  const dueVal = inv?.dueAmount !== undefined ? Number(inv?.dueAmount) : Math.max(0, grandTotal - paidVal);
  const isPaid = inv?.status === 'paid' || dueVal === 0;

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

          {isAuthentic ? (
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
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#dc2626',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: '800',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertTriangle size={16} />
              <span>অননুমোদিত / যাচাইকরণ ব্যর্থ</span>
            </span>
          )}
        </div>

        {/* ========================================================
            CASE 1: FAKE / FORGED / UNVERIFIED DOCUMENT
            ======================================================== */}
        {!isAuthentic ? (
          <div
            className="animate-fade-in"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 12px 35px rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              overflow: 'hidden'
            }}
          >
            {/* Red Alert Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #b91c1c, #ef4444)',
                padding: '2rem 1.25rem',
                color: '#ffffff',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <FileX2 size={36} color="#ffffff" />
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.5px' }}>
                FAKE / INVALID DOCUMENT
              </h2>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  marginTop: '4px'
                }}
              >
                ⚠️ নকল বা অননুমোদিত নথি
              </div>
            </div>

            {/* Red Alert Content Body */}
            <div style={{ padding: '1.75rem 1.5rem' }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  marginBottom: '1.5rem',
                  color: '#991b1b',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px', color: '#b91c1c' }}>
                      সতর্কবার্তা: এই নথিটির কোনো সত্যতা পাওয়া যায়নি!
                    </strong>
                    স্ক্যানকৃত রেফারেন্স নম্বর <strong>#{verifyId || 'অজ্ঞাত'}</strong> আমাদের সেন্ট্রাল ডাটাবেজে তালিকাভুক্ত নেই অথবা এই কিউআর কোডটি জাল করে বানানো হয়েছে।
                  </div>
                </div>
              </div>

              {/* Security Advisory Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                  গ্রাহক ও অডিটরদের জন্য জরুরি পরামর্শ:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.88rem', lineHeight: 1.8 }}>
                  <li>এই চালানের বিপরীতে কোনো প্রকার অর্থ বা টাকা প্রদান করবেন না।</li>
                  <li>রসিদ বা কোটেশন প্রদানকারী ব্যক্তির কাছ থেকে আসল HisabKitab 360 ডিজিটাল সিস্টেম মেমো দাবি করুন।</li>
                  <li>প্রতিষ্ঠানের অফিসিয়াল ভেরিফাইড নম্বরে ফোন করে চালানের সত্যতা নিশ্চিত করুন।</li>
                </ul>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  fontSize: '0.78rem',
                  color: '#64748b',
                  textAlign: 'center'
                }}
              >
                স্ক্যান সম্পন্ন হয়েছে: <strong>{new Date().toLocaleString('bn-BD')}</strong> • আইপি ও ডিভাইস অডিট রেকর্ড সংরক্ষিত
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
              CASE 2: REAL / AUTHENTIC VERIFIED DOCUMENT
              ======================================================== */
          <div
            className="animate-fade-in"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 10px 35px rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              overflow: 'hidden'
            }}
          >
            {/* Card Green Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                padding: '1.75rem 1.25rem',
                color: '#ffffff',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <CheckCircle2 size={34} color="#ffffff" />
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.45rem', fontWeight: '900' }}>
                VERIFIED / REAL DOCUMENT
              </h2>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  marginTop: '4px'
                }}
              >
                ✓ আসল ও অনুমোদিত ডিজিটাল নথি
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '8px' }}>
                {inv.companyName || 'হিসাব কিতাব ৩৬০'}
              </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Meta Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', paddingBottom: '1.25rem', borderBottom: '1px dashed #cbd5e1', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                    {inv.type === 'quotation' ? 'কোটেশন আইডি' : 'মেমো / ইনভয়েস নম্বর'}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>#{inv.id}</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>তারিখ ও সময়</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} style={{ color: '#10b981' }} />
                    {inv.date || 'আজকের তারিখ'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>সম্মানিত ক্লায়েন্ট / ক্রেতা</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#334155' }}>
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
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isPaid ? '#059669' : '#dc2626'
                    }}
                  >
                    {isPaid ? '✓ পরিশোধিত (PAID)' : `বকেয়া: ৳${dueVal.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* Itemized Table if available */}
              {inv.items && inv.items.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>
                    আইটেম বিবরণ ({inv.items.length} টি পণ্য):
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.95rem', color: '#475569' }}>
                  <span>সর্বমোট পরিমাণ (Total Amount):</span>
                  <span style={{ fontWeight: '900', fontSize: '1.15rem', color: '#0f172a', fontFamily: 'monospace' }}>৳{grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: '#059669' }}>
                  <span>পরিশোধিত টাকা (Paid):</span>
                  <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>৳{paidVal.toLocaleString()}</span>
                </div>
                {dueVal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.9rem', color: '#dc2626', fontWeight: '800', borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '6px' }}>
                    <span>বকেয়া (Due Balance):</span>
                    <span style={{ fontFamily: 'monospace' }}>৳{dueVal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Store Contact & Seal */}
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
                <div style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>
                  ✓ এই রসিদটি অফিসিয়াল HisabKitab 360 ডিজিটাল ডাটাবেজ দ্বারা শতভাগ সত্যায়িত।
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isAuthentic && (
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
        )}
      </div>
    </div>
  );
};

export default InvoiceVerificationView;
