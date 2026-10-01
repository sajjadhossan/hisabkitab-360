import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, Check, ShieldCheck, MessageCircle } from 'lucide-react';
import { printElement } from '../../services/printService';
import { generateQrDataUrl, createInvoiceVerificationUrl, generateInvoiceQrPayload } from '../../services/qrService';
import { generatePaymentQrDataUrl } from '../../services/barcodeService';

export const ReceiptModal = () => {
  const {
    activeReceipt,
    setActiveReceipt,
    openInvoicePrint,
    openShareInvoice,
    openCashDrawer,
    businessSettings,
    t,
    lang
  } = useApp();

  const [qrMode, setQrMode] = useState('payload'); // 'payload' | 'url' | 'bkash'
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (activeReceipt) {
      if (qrMode === 'bkash') {
        const merchantPhone = businessSettings.bkashNumber || businessSettings.phone || '01700000000';
        generatePaymentQrDataUrl({
          merchantNumber: merchantPhone,
          amount: activeReceipt.grandTotal,
          reference: `INV-${activeReceipt.id}`,
          provider: 'bkash'
        }).then(url => {
          if (url) setQrCodeUrl(url);
        });
      } else {
        const qrData = qrMode === 'payload'
          ? generateInvoiceQrPayload(activeReceipt, businessSettings)
          : createInvoiceVerificationUrl(activeReceipt, businessSettings);

        generateQrDataUrl(qrData, {
          width: businessSettings.receiptPaperWidth === '58mm' ? 180 : 220,
          margin: 1
        }).then(url => {
          if (url) setQrCodeUrl(url);
        });
      }
    }
  }, [activeReceipt, businessSettings, qrMode]);

  if (!activeReceipt) return null;

  const handlePrint = () => {
    printElement('printable-receipt-slip', {
      title: `Receipt #${activeReceipt.id}`,
      paperType: 'receipt',
      paperWidth: businessSettings.receiptPaperWidth || '80mm'
    });
  };

  const paymentLabels = {
    cash: lang === 'bn' ? 'নগদ ক্যাশ' : 'Cash',
    bkash: lang === 'bn' ? 'বিকাশ / নগদ' : 'bKash / Mobile',
    card: lang === 'bn' ? 'ব্যাংক কার্ড' : 'Card',
    due: lang === 'bn' ? 'বাকি (Credit)' : 'Due / Credit'
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '1.25rem' }}>
        {/* Modal Controls (Not printed) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-success">
              <Check size={14} /> {lang === 'bn' ? 'বিক্রয় সফল' : 'Sale Completed'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{activeReceipt.id}</span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>QR:</span>
            <button
              type="button"
              className={`btn ${qrMode === 'payload' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minHeight: 'unset', borderRadius: '6px' }}
              onClick={() => setQrMode('payload')}
              title={lang === 'bn' ? 'মোবাইল ক্যামেরা দিয়ে স্ক্যান করলেই মেমোর বিবরণ চলে আসবে (১০০% অফলাইন কাজ করে)' : 'Direct memo details (Offline)'}
            >
              ✓ {lang === 'bn' ? 'মেমো' : 'Memo'}
            </button>
            <button
              type="button"
              className={`btn ${qrMode === 'bkash' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '2px 6px',
                fontSize: '0.7rem',
                height: 'auto',
                minHeight: 'unset',
                borderRadius: '6px',
                background: qrMode === 'bkash' ? '#e2136e' : undefined,
                borderColor: qrMode === 'bkash' ? '#e2136e' : undefined,
                color: qrMode === 'bkash' ? '#ffffff' : undefined
              }}
              onClick={() => setQrMode('bkash')}
              title={lang === 'bn' ? 'বিকাশ ডায়নামিক পেমেন্ট কিউআর কোড (কাস্টমার সরাসরি স্ক্যান করে পেমেন্ট করতে পারবে)' : 'bKash Dynamic Payment QR'}
            >
              📱 {lang === 'bn' ? 'বিকাশ পে' : 'bKash'}
            </button>
            <button
              type="button"
              className={`btn ${qrMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '2px 6px', fontSize: '0.7rem', height: 'auto', minHeight: 'unset', borderRadius: '6px' }}
              onClick={() => setQrMode('url')}
              title={lang === 'bn' ? 'ব্রাউজার ভেরিফিকেশন লিংক' : 'Online Verification Link'}
            >
              🌐 {lang === 'bn' ? 'লিংক' : 'Link'}
            </button>
          </div>

          <button className="btn-icon" onClick={() => setActiveReceipt(null)} title={t.close}>
            <X size={18} />
          </button>
        </div>

        {/* The Printable Thermal Receipt Container */}
        {(() => {
          const paperWidth = businessSettings.receiptPaperWidth === '58mm' ? '280px' : businessSettings.receiptPaperWidth === 'A4' ? '100%' : '360px';
          return (
            <div
              id="printable-receipt-slip"
              className="printable-receipt"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '8px',
                padding: '1.25rem 1rem',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                fontSize: businessSettings.receiptPaperWidth === '58mm' ? '11px' : '12px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                maxWidth: paperWidth,
                margin: '0 auto'
              }}
            >
              {/* Header Greeting */}
              {businessSettings.showGreetingOnReceipt !== false && businessSettings.headerGreeting && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginBottom: '4px' }}>
                  {businessSettings.headerGreeting}
                </div>
              )}

              {/* Logo */}
              {businessSettings.showLogoOnReceipt !== false && businessSettings.companyLogo && (
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <img
                    src={businessSettings.companyLogo}
                    alt="Company Logo"
                    style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', display: 'inline-block' }}
                  />
                </div>
              )}

              {/* Header Info */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 3px', color: '#0f172a' }}>
                  {businessSettings.companyName}
                </h2>
                {businessSettings.showAddressOnReceipt !== false && businessSettings.address && (
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#475569' }}>
                    {businessSettings.address}
                  </p>
                )}
                {businessSettings.showPhoneOnReceipt !== false && businessSettings.phone && (
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#475569' }}>
                    📞 {businessSettings.phone}
                  </p>
                )}
                {businessSettings.showBinOnReceipt !== false && businessSettings.binNo && (
                  <p style={{ margin: '2px 0', fontSize: '10px', color: '#64748b' }}>
                    BIN / TIN: {businessSettings.binNo}
                  </p>
                )}

                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
                  <span>{activeReceipt.id}</span>
                  <span>{activeReceipt.date}</span>
                </div>

                {businessSettings.showCustomerDetails !== false && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155', marginTop: '3px' }}>
                    <span>{lang === 'bn' ? 'গ্রাহক:' : 'Customer:'} {activeReceipt.customerName}</span>
                    {activeReceipt.customerPhone && <span>{activeReceipt.customerPhone}</span>}
                  </div>
                )}

                {/* Restaurant Order Type & Table Information */}
                {(activeReceipt.orderType || activeReceipt.table) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#0f172a', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', marginTop: '4px' }}>
                    <span>{lang === 'bn' ? 'অর্ডার ধরন:' : 'Type:'} {activeReceipt.orderType === 'dine_in' ? (lang === 'bn' ? '🍽️ ডাইন-ইন' : '🍽️ Dine-in') : (lang === 'bn' ? '🛍️ পার্সেল' : '🛍️ Parcel')}</span>
                    {activeReceipt.table && <span>{lang === 'bn' ? 'টেবিল নং:' : 'Table:'} {activeReceipt.table}</span>}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

              {/* Items Table */}
              <div style={{ width: '100%', marginBottom: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', fontWeight: '700', paddingBottom: '4px', borderBottom: '1px solid #cbd5e1', fontSize: '11px' }}>
                  <span>{lang === 'bn' ? 'আইটেম' : 'Item'}</span>
                  <span style={{ textAlign: 'center' }}>{lang === 'bn' ? 'পরিমাণ' : 'Qty'}</span>
                  <span style={{ textAlign: 'right' }}>{lang === 'bn' ? 'মোট' : 'Total'}</span>
                </div>
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', padding: '4px 0', borderBottom: '1px dotted #e2e8f0', fontSize: '11px' }}>
                    <span style={{ wordBreak: 'break-word' }}>{item.name}</span>
                    <span style={{ textAlign: 'center' }}>{item.qty} × {item.price}</span>
                    <span style={{ textAlign: 'right', fontWeight: '600' }}>৳{(item.qty * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />

              {/* Totals */}
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.business.subtotal}:</span>
                  <span>৳{activeReceipt.subtotal.toLocaleString()}</span>
                </div>
                {activeReceipt.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>{t.business.discount}:</span>
                    <span>-৳{activeReceipt.discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.business.vatTax} ({businessSettings.vatRate}%):</span>
                  <span>+৳{activeReceipt.vat.toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800' }}>
                  <span>{t.business.grandTotal}:</span>
                  <span>৳{activeReceipt.grandTotal.toLocaleString()}</span>
                </div>
                {activeReceipt.paidAmount !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '700' }}>
                    <span>{lang === 'bn' ? 'পরিশোধিত অর্থ:' : 'Paid Amount:'}</span>
                    <span>৳{Number(activeReceipt.paidAmount).toLocaleString()}</span>
                  </div>
                )}
                {Number(activeReceipt.dueAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: '800' }}>
                    <span>{lang === 'bn' ? 'অবশিষ্ট বকেয়া:' : 'Remaining Due:'}</span>
                    <span>৳{Number(activeReceipt.dueAmount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#475569' }}>
                  <span>{t.business.paymentMethod}:</span>
                  <span style={{ fontWeight: '700', textTransform: 'uppercase' }}>
                    {paymentLabels[activeReceipt.paymentMethod] || activeReceipt.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Return Policy Notice */}
              {businessSettings.showReturnPolicyOnReceipt !== false && businessSettings.returnPolicy && (
                <div style={{ marginTop: '10px', padding: '6px', background: '#f8fafc', borderRadius: '4px', fontSize: '10px', color: '#475569', border: '1px dashed #cbd5e1', textAlign: 'center', lineHeight: 1.4 }}>
                  ⚠️ {businessSettings.returnPolicy}
                </div>
              )}

              {/* Signature Stamp / Line */}
              {businessSettings.showSignatureOnReceipt && (
                <div style={{ marginTop: '14px', textAlign: 'right' }}>
                  {businessSettings.signatureStamp && (
                    <img
                      src={businessSettings.signatureStamp}
                      alt="Signature Seal"
                      style={{ maxHeight: '36px', maxWidth: '90px', objectFit: 'contain', marginLeft: 'auto', marginBottom: '2px', display: 'block' }}
                    />
                  )}
                  <div style={{ borderTop: '1px dotted #94a3b8', display: 'inline-block', minWidth: '100px', textAlign: 'center', fontSize: '10px', color: '#64748b', paddingTop: '2px' }}>
                    {lang === 'bn' ? 'অনুমোদিত স্বাক্ষর' : 'Authorized Signature'}
                  </div>
                </div>
              )}

              {/* QR Code Verification & Barcode */}
              <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px dashed #94a3b8', paddingTop: '8px' }}>
                {qrCodeUrl ? (
                  <div style={{ display: 'inline-block', textAlign: 'center', margin: '4px auto' }}>
                    <img
                      src={qrCodeUrl}
                      alt="Verify QR Code"
                      style={{
                        width: businessSettings.receiptPaperWidth === '58mm' ? '94px' : '112px',
                        height: businessSettings.receiptPaperWidth === '58mm' ? '94px' : '112px',
                        display: 'block',
                        margin: '0 auto',
                        background: '#ffffff',
                        padding: '3px',
                        border: '1.5px solid #0f172a',
                        borderRadius: '6px'
                      }}
                    />
                    <div style={{ fontSize: '9px', fontWeight: '800', color: qrMode === 'bkash' ? '#e2136e' : '#0f172a', marginTop: '4px', letterSpacing: '0.3px' }}>
                      {qrMode === 'bkash'
                        ? (lang === 'bn' ? '⚡ বিকাশ ডায়নামিক পেমেন্ট কিউআর' : '⚡ bKash Payment QR')
                        : (lang === 'bn' ? '✓ ডিজিটাল মেমো কিউআর' : '✓ VERIFIED DIGITAL QR')}
                    </div>
                    <div style={{ fontSize: '8px', color: '#475569', marginTop: '1px' }}>
                      {qrMode === 'bkash'
                        ? (lang === 'bn' ? `বিকাশ অ্যাপে স্ক্যান করে ৳${activeReceipt.grandTotal.toLocaleString()} পরিশোধ করুন` : `Scan with bKash app to pay ৳${activeReceipt.grandTotal.toLocaleString()}`)
                        : (lang === 'bn' ? 'যেকোনো ক্যামেরা বা বিকাশ দিয়ে স্ক্যান করুন' : 'Scan with any Camera / bKash')}
                    </div>
                  </div>
                ) : (
                  businessSettings.showBarcodeOnReceipt !== false && (
                    <div style={{ letterSpacing: '4px', fontSize: '17px', fontWeight: '900', color: '#1e293b' }}>
                      ||||| | |||| ||| ||||| ||
                    </div>
                  )
                )}
                <p style={{ margin: '6px 0 2px', fontSize: '10px', color: '#64748b' }}>
                  {businessSettings.invoiceFooter}
                </p>
                <p style={{ margin: '0', fontSize: '9px', color: '#94a3b8' }}>
                  Powered by HisabKitab 360 OS
                </p>
              </div>
            </div>
          );
        })()}

        {/* Modal Buttons (Not printed) */}
        <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => openShareInvoice(activeReceipt)}
            style={{
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
              cursor: 'pointer'
            }}
            title={lang === 'bn' ? 'হোয়াটসঅ্যাপ ও সোশ্যাল মিডিয়ায় রসিদ পাঠান' : 'Share Receipt to WhatsApp'}
          >
            <MessageCircle size={16} />
            <span>{lang === 'bn' ? '📲 হোয়াটসঅ্যাপ' : '📲 WhatsApp'}</span>
          </button>

          <button className="btn btn-primary" onClick={handlePrint} style={{ flex: 1, minWidth: '150px' }}>
            <Printer size={16} /> {lang === 'bn' ? 'থার্মাল রসিদ প্রিন্ট' : 'Print Thermal Slip'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const rec = activeReceipt;
              setActiveReceipt(null);
              openInvoicePrint(rec);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{lang === 'bn' ? 'A4 ইনভয়েস' : 'A4 Invoice'}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openCashDrawer('manual')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            title={lang === 'bn' ? 'ক্যাশ ড্রয়ার খুলুন' : 'Open Cash Drawer'}
          >
            <span>🗄️ {lang === 'bn' ? 'ড্রয়ার' : 'Drawer'}</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveReceipt(null)}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
