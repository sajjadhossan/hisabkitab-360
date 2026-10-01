import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, Check, Clock, Building, Phone, Mail, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { printElement } from '../../services/printService';
import { generateQrDataUrl, createInvoiceVerificationUrl, generateInvoiceQrPayload } from '../../services/qrService';

export const InvoicePrintModal = () => {
  const {
    activeInvoicePrint,
    closeInvoicePrint,
    openShareInvoice,
    businessSettings,
    lang,
    t
  } = useApp();

  const [qrMode, setQrMode] = useState('payload'); // 'payload' (100% workable memo text) | 'url' (web link)
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (activeInvoicePrint) {
      const qrData = qrMode === 'payload'
        ? generateInvoiceQrPayload(activeInvoicePrint, businessSettings)
        : createInvoiceVerificationUrl(activeInvoicePrint, businessSettings);

      generateQrDataUrl(qrData, { width: 220, margin: 1 }).then(url => {
        if (url) setQrCodeUrl(url);
      });
    }
  }, [activeInvoicePrint, businessSettings, qrMode]);

  if (!activeInvoicePrint) return null;

  const inv = activeInvoicePrint;

  const grandTotal = Number(inv.grandTotal) || 0;
  const returnTotal = Number(inv.returnTotal) || 0;
  const paidVal = inv.paidAmount !== undefined ? Number(inv.paidAmount) : (inv.status === 'paid' ? grandTotal : 0);
  const dueVal = inv.dueAmount !== undefined ? Number(inv.dueAmount) : (inv.status === 'paid' ? 0 : grandTotal);
  const isReturned = inv.status === 'returned';
  const isPartialReturn = inv.status === 'partial_return';
  const isPaid = !isReturned && (inv.status === 'paid' || dueVal === 0);
  const isPartial = !isPaid && !isReturned && !isPartialReturn && paidVal > 0;

  const handlePrint = () => {
    printElement('printable-a4-invoice', {
      title: `Invoice #${inv.id}`,
      paperType: 'a4'
    });
  };

  const stampBorderColor = isReturned
    ? '#a855f7'
    : isPartialReturn
    ? '#f97316'
    : isPaid
    ? '#10b981'
    : isPartial
    ? '#f59e0b'
    : '#ef4444';

  const stampText = isReturned
    ? (lang === 'bn' ? 'সম্পূর্ণ ফেরত (RETURNED)' : 'RETURNED')
    : isPartialReturn
    ? (lang === 'bn' ? 'আংশিক ফেরত (PARTIAL RETURN)' : 'PARTIAL RETURN')
    : isPaid
    ? (lang === 'bn' ? 'পরিশোধিত (PAID)' : 'PAID')
    : isPartial
    ? (lang === 'bn' ? 'আংশিক পরিশোধ (PARTIAL)' : 'PARTIAL PAID')
    : (lang === 'bn' ? 'বকেয়া (DUE)' : 'UNPAID');

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '850px',
          width: '95%',
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '1.25rem'
        }}
      >
        {/* Modal Controls - Hidden during print */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              className="badge"
              style={{
                fontSize: '0.85rem',
                background: isPaid ? 'rgba(16, 185, 129, 0.15)' : isPartial ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: stampBorderColor,
                border: `1px solid ${stampBorderColor}`
              }}
            >
              {isPaid ? <Check size={14} /> : <Clock size={14} />}
              {stampText}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
              #{inv.id}
            </span>

            {/* QR Mode Selector */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>QR:</span>
              <button
                type="button"
                className={`btn ${qrMode === 'payload' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.72rem', height: 'auto', minHeight: 'unset', borderRadius: '6px' }}
                onClick={() => setQrMode('payload')}
                title={lang === 'bn' ? 'মোবাইল ক্যামেরা দিয়ে স্ক্যান করলেই মেমোর বিবরণ চলে আসবে (১০০% অফলাইন কাজ করে)' : 'Direct memo details (Offline workable)'}
              >
                ✓ {lang === 'bn' ? 'সরাসরি মেমো' : 'Direct Memo'}
              </button>
              <button
                type="button"
                className={`btn ${qrMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.72rem', height: 'auto', minHeight: 'unset', borderRadius: '6px' }}
                onClick={() => setQrMode('url')}
                title={lang === 'bn' ? 'ব্রাউজার ভেরিফিকেশন পেজ খোলার লিংক' : 'Online Verification Link'}
              >
                🌐 {lang === 'bn' ? 'ওয়েব লিংক' : 'Web Link'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn"
              onClick={() => openShareInvoice(inv)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
              }}
              title={lang === 'bn' ? 'হোয়াটসঅ্যাপ ও সোশ্যাল মিডিয়ায় মেমো পাঠান' : 'Share Invoice to WhatsApp'}
            >
              <MessageCircle size={16} />
              <span>{lang === 'bn' ? '📲 হোয়াটসঅ্যাপে পাঠান' : '📲 WhatsApp'}</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>{lang === 'bn' ? 'A4 ইনভয়েস প্রিন্ট' : 'Print A4'}</span>
            </button>
            <button className="btn-icon" onClick={closeInvoicePrint} title={t.close}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official A4 Invoice Sheet */}
        <div
          id="printable-a4-invoice"
          className="printable-invoice"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '2.5rem 2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: '13px',
            lineHeight: 1.5,
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}
        >
          {/* Status Stamp */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              border: `3px solid ${stampBorderColor}`,
              color: stampBorderColor,
              padding: '6px 18px',
              fontWeight: '900',
              fontSize: '17px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              borderRadius: '8px',
              transform: 'rotate(-12deg)',
              opacity: 0.85,
              pointerEvents: 'none'
            }}
          >
            {stampText}
          </div>

          {/* Top Header: Brand & Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                {businessSettings.companyLogo ? (
                  <img
                    src={businessSettings.companyLogo}
                    alt="Logo"
                    style={{ maxHeight: '46px', maxWidth: '140px', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '26px' }}>💼</span>
                )}
                <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  {businessSettings.companyName}
                </h1>
              </div>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                {businessSettings.tagline}
              </p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>
                <div>📍 {businessSettings.address}</div>
                <div>📞 {businessSettings.phone} {businessSettings.altPhone && `| 📱 ${businessSettings.altPhone}`} | ✉️ {businessSettings.email}</div>
                {businessSettings.website && <div>🌐 {businessSettings.website}</div>}
                <div>🏛️ {lang === 'bn' ? 'ট্যাক্স / BIN নং:' : 'BIN / TIN No:'} {businessSettings.binNo || '004829104-0101'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
              {qrCodeUrl && (
                <div style={{ textAlign: 'center', background: '#ffffff', padding: '6px 8px', border: '1.5px solid #0f172a', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
                  <img
                    src={qrCodeUrl}
                    alt="Scan to Verify Invoice"
                    style={{ width: '92px', height: '92px', display: 'block', margin: '0 auto' }}
                  />
                  <span style={{ fontSize: '8.5px', fontWeight: '800', color: '#0f172a', display: 'block', marginTop: '3px', letterSpacing: '0.3px' }}>
                    {lang === 'bn' ? '✓ ডিজিটাল মেমো কিউআর' : '✓ VERIFIED QR'}
                  </span>
                  <span style={{ fontSize: '7.5px', color: '#64748b', display: 'block', fontWeight: '600' }}>
                    {lang === 'bn' ? 'ক্যামেরায় স্ক্যান করুন' : 'Scan with Camera'}
                  </span>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {lang === 'bn' ? 'ট্যাক্স ইনভয়েস' : 'TAX INVOICE'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', marginTop: '2px' }}>
                  #{inv.id}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  <strong>{lang === 'bn' ? 'ইস্যুর তারিখ:' : 'Date:'}</strong> {inv.date}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  <strong>{lang === 'bn' ? 'পরিশোধের শেষ তারিখ:' : 'Due Date:'}</strong> {inv.dueDate || inv.date}
                </div>
                {inv.paymentTerms && (
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <strong>{lang === 'bn' ? 'শর্ত:' : 'Terms:'}</strong> {inv.paymentTerms}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                {lang === 'bn' ? 'বিল প্রাপক (CUSTOMER DETAILS):' : 'BILL TO:'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                {inv.customerName}
              </div>
              {inv.customerPhone && (
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                  📞 {inv.customerPhone}
                </div>
              )}
              {inv.customerEmail && (
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  ✉️ {inv.customerEmail}
                </div>
              )}
              {inv.customerAddress && (
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                  📍 {inv.customerAddress}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                {lang === 'bn' ? 'পেমেন্ট ও চালান তথ্য:' : 'PAYMENT & DISPATCH:'}
              </div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                <div><strong>{lang === 'bn' ? 'পেমেন্ট মেথড:' : 'Method:'}</strong> {inv.paymentMethod ? inv.paymentMethod.toUpperCase() : (isPaid ? 'PAID' : 'DUE / CREDIT')}</div>
                <div><strong>{lang === 'bn' ? 'কারেন্সি:' : 'Currency:'}</strong> BDT (৳)</div>
                <div><strong>{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</strong> <span style={{ color: isPaid ? '#16a34a' : '#dc2626', fontWeight: '700' }}>{isPaid ? (lang === 'bn' ? 'পরিশোধিত' : 'PAID') : (lang === 'bn' ? 'বকেয়া' : 'DUE')}</span></div>
                {inv.orderType && (
                  <div><strong>{lang === 'bn' ? 'অর্ডার ধরন:' : 'Order Type:'}</strong> {inv.orderType === 'dine_in' ? (lang === 'bn' ? '🍽️ ডাইন-ইন' : '🍽️ Dine-in') : (lang === 'bn' ? '🛍️ পার্সেল' : '🛍️ Parcel')}</div>
                )}
                {inv.table && (
                  <div><strong>{lang === 'bn' ? 'টেবিল নং:' : 'Table:'}</strong> {inv.table}</div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px', borderRadius: '4px 0 0 0' }}>#</th>
                <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'পণ্যের বিবরণ / আইটেম' : 'Item Description'}</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>SKU</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>{lang === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'দর (টাকা)' : 'Unit Price'}</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>{lang === 'bn' ? 'মোট (টাকা)' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '11px' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{item.sku || '-'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600' }}>
                    {item.qty}
                    {item.returnedQty > 0 && (
                      <div style={{ color: '#ea580c', fontSize: '10px', fontWeight: '700' }}>
                        (-{item.returnedQty} {lang === 'bn' ? 'ফেরত' : 'ret'})
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>৳{Number(item.price).toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace' }}>৳{Number(item.subtotal || item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Breakdown & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'ব্যাংক ও অনলাইন পেমেন্ট তথ্য:' : 'BANK & PAYMENT DETAILS:'}
                </div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
                  <div><strong>{lang === 'bn' ? 'ব্যাংক:' : 'Bank:'}</strong> {businessSettings.bankName || 'ব্র্যাক ব্যাংক পিএলসি, মিরপুর শাখা'}</div>
                  <div><strong>{lang === 'bn' ? 'হিসাব নং:' : 'A/C No:'}</strong> {businessSettings.bankAccountNo || '1501204892019001 (মেসার্স আল-মদিনা)'}</div>
                  <div><strong>{lang === 'bn' ? 'বিকাশ মার্চেন্ট:' : 'bKash Merchant:'}</strong> {businessSettings.bkashMerchant || '01712-345678'}</div>
                </div>
              </div>

              {inv.notes && (
                <div style={{ fontSize: '11px', color: '#475569', background: '#fffbeb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7', marginBottom: '8px' }}>
                  <strong>{lang === 'bn' ? 'বিশেষ দ্রষ্টব্য / নোট:' : 'Notes:'}</strong> {inv.notes}
                </div>
              )}

              {/* Installments & Payment History on Invoice Print */}
              {inv.paymentHistory && inv.paymentHistory.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'আদায়কৃত কিস্তির বিবরণ (Payment History):' : 'PAYMENT HISTORY LOGS:'}
                  </div>
                  <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ padding: '3px 4px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th style={{ padding: '3px 4px' }}>{lang === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                        <th style={{ padding: '3px 4px', textAlign: 'right' }}>{lang === 'bn' ? 'টাকা' : 'Amount'}</th>
                        <th style={{ padding: '3px 4px' }}>{lang === 'bn' ? 'নোট' : 'Note'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.paymentHistory.map((ph, i) => (
                        <tr key={i} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                          <td style={{ padding: '3px 4px', color: '#334155' }}>{ph.date}</td>
                          <td style={{ padding: '3px 4px', textTransform: 'uppercase', fontWeight: '600' }}>{ph.method}</td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: '700', color: '#16a34a', fontFamily: 'monospace' }}>
                            ৳{Number(ph.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '3px 4px', color: '#64748b' }}>{ph.note || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sales Return History Log Table */}
              {inv.returns && inv.returns.length > 0 && (
                <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '6px', border: '1px solid #ffedd5' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#c2410c', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'পণ্য ফেরতের বিবরণ (Sales Return History):' : 'SALES RETURN HISTORY:'}
                  </div>
                  <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #fed7aa', color: '#9a3412', textAlign: 'left' }}>
                        <th style={{ padding: '3px 4px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th style={{ padding: '3px 4px' }}>{lang === 'bn' ? 'পণ্য' : 'Items'}</th>
                        <th style={{ padding: '3px 4px', textAlign: 'right' }}>{lang === 'bn' ? 'ফেরত মূল্য' : 'Refund'}</th>
                        <th style={{ padding: '3px 4px' }}>{lang === 'bn' ? 'কারণ' : 'Reason'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.returns.map((ret, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px dotted #fed7aa' }}>
                          <td style={{ padding: '3px 4px', color: '#7c2d12' }}>{ret.date}</td>
                          <td style={{ padding: '3px 4px', color: '#7c2d12' }}>
                            {(ret.items || []).map(ri => `${ri.name} (${ri.returnedQty}টি)`).join(', ')}
                          </td>
                          <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: '700', color: '#c2410c', fontFamily: 'monospace' }}>
                            ৳{Number(ret.totalRefundAmount).toLocaleString()}
                          </td>
                          <td style={{ padding: '3px 4px', color: '#9a3412' }}>{ret.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#475569' }}>
                <span>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>৳{Number(inv.subtotal).toLocaleString()}</span>
              </div>
              {inv.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#16a34a' }}>
                  <span>{lang === 'bn' ? 'ডিসকাউন্ট / ছাড়:' : 'Discount:'}</span>
                  <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>- ৳{Number(inv.discount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#475569' }}>
                <span>{lang === 'bn' ? `ভ্যাট (${inv.vatRate || 5}%):` : `VAT (${inv.vatRate || 5}%):`}</span>
                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>+ ৳{Number(inv.vat).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '2px solid #0f172a', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                <span>{lang === 'bn' ? 'মূল প্রদেয় বিল:' : 'Original Total:'}</span>
                <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>৳{grandTotal.toLocaleString()}</span>
              </div>

              {/* Sales Return Credit */}
              {returnTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#ea580c' }}>
                  <span>{lang === 'bn' ? 'পণ্য ফেরত সমন্বয় (Return Credit):' : 'Return Credit:'}</span>
                  <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>- ৳{returnTotal.toLocaleString()}</span>
                </div>
              )}

              {/* Paid & Due Breakdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#16a34a', borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '6px' }}>
                <span>{lang === 'bn' ? 'পরিশোধিত অর্থ (Paid):' : 'Paid Amount:'}</span>
                <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>৳{paidVal.toLocaleString()}</span>
              </div>
              {dueVal > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#dc2626', fontWeight: '800' }}>
                  <span>{lang === 'bn' ? 'অবশিষ্ট বকেয়া (Due Balance):' : 'Remaining Due:'}</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{dueVal.toLocaleString()}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '11px', color: isReturned ? '#a855f7' : '#16a34a', fontWeight: '700' }}>
                  <span>{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                  <span>{isReturned ? (lang === 'bn' ? 'সম্পূর্ণ ফেরত (Returned)' : 'Returned') : (lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত (All Clear)' : 'Fully Paid')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer & Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ textAlign: 'center', width: '180px' }}>
              <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontSize: '11px', color: '#475569' }}>
                {lang === 'bn' ? 'গ্রাহকের স্বাক্ষর' : 'Customer Signature'}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
              <div>{businessSettings.invoiceFooter}</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                🛡️ {lang === 'bn' ? 'এই ক্যাশমেমোর সঠিকতা যেকোনো স্মার্টফোনে কিউআর কোড স্ক্যান করে যাচাই করা যাবে।' : 'Scan the QR code to verify this official invoice.'}
              </div>
              <div>Generated by HisabKitab 360 OS</div>
            </div>

            <div style={{ textAlign: 'center', width: '180px' }}>
              {businessSettings.signatureStamp && (
                <img
                  src={businessSettings.signatureStamp}
                  alt="Official Seal"
                  style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }}
                />
              )}
              <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontSize: '11px', color: '#475569', fontWeight: '700' }}>
                {lang === 'bn' ? 'অনুমোদিত স্বাক্ষর ও সিল' : 'Authorized Signature'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
