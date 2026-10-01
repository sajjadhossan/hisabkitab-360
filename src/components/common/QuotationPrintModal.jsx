import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, FileCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { printElement } from '../../services/printService';

export const QuotationPrintModal = () => {
  const {
    activeQuotationPrint,
    closeQuotationPrint,
    convertQuotationToInvoice,
    businessSettings,
    lang,
    t
  } = useApp();

  if (!activeQuotationPrint) return null;

  const quote = activeQuotationPrint;
  const isConverted = quote.status === 'converted';

  const handlePrint = () => {
    printElement('printable-a4-quotation', {
      title: `Quotation #${quote.id}`,
      paperType: 'a4'
    });
  };

  const handleConvert = () => {
    closeQuotationPrint();
    convertQuotationToInvoice(quote.id);
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
              <FileCheck size={14} />
              {lang === 'bn' ? 'দরপত্র / কোটেশন' : 'PRICE QUOTATION'}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
              #{quote.id}
            </span>
            {isConverted && (
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                {lang === 'bn' ? 'ইনভয়েসে রূপান্তরিত' : 'Converted to Invoice'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isConverted && (
              <button
                className="btn btn-secondary"
                onClick={handleConvert}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <ArrowRight size={14} />
                <span>{lang === 'bn' ? 'ইনভয়েসে রূপান্তর করুন' : 'Convert to Invoice'}</span>
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={16} />
              <span>{lang === 'bn' ? 'A4 কোটেশন প্রিন্ট করুন' : 'Print Quotation'}</span>
            </button>
            <button className="btn-icon" onClick={closeQuotationPrint} title={t.close}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official A4 Quotation Sheet */}
        <div
          id="printable-a4-quotation"
          className="printable-quotation"
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
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {lang === 'bn' ? 'দরপত্র ও কোটেশন' : 'PRICE QUOTATION'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', marginTop: '2px' }}>
                #{quote.id}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                <strong>{lang === 'bn' ? 'প্রস্তাবনার তারিখ:' : 'Proposal Date:'}</strong> {quote.date}
              </div>
              <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>
                <strong>{lang === 'bn' ? 'মেয়াদ শেষ:' : 'Valid Until:'}</strong> {quote.validUntil || '15 Days'}
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
              {lang === 'bn' ? 'প্রস্তাবনা প্রাপক / ক্লায়েন্ট:' : 'PREPARED FOR:'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
              {quote.customerName}
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '4px', fontSize: '12px', color: '#334155' }}>
              {quote.customerPhone && <span>📞 {quote.customerPhone}</span>}
              {quote.customerEmail && <span>✉️ {quote.customerEmail}</span>}
              {quote.customerAddress && <span>📍 {quote.customerAddress}</span>}
            </div>
          </div>

          {/* Quotation Itemized Scope */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px', borderRadius: '4px 0 0 0' }}>#</th>
                <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'পণ্যের বিবরণ / কাজের পরিধি' : 'Item Description & Scope'}</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>SKU</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>{lang === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'দর (টাকা)' : 'Unit Rate'}</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', borderRadius: '0 4px 0 0' }}>{lang === 'bn' ? 'মোট (টাকা)' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '11px' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{item.sku || '-'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600' }}>{item.qty}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>৳{Number(item.price).toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace' }}>৳{Number(item.subtotal || item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pricing & Terms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
                  {lang === 'bn' ? 'বাণিজ্যিক শর্তাবলী ও নিয়মাবলী:' : 'TERMS & CONDITIONS:'}
                </div>
                <div style={{ fontSize: '11px', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {quote.terms || (lang === 'bn' ? '১. এই কোটেশনের উল্লেখিত দর নির্ধারিত মেয়াদের জন্য কার্যকর।\n২. অগ্রিম ৫০% পেমেন্ট সাপেক্ষে কাজ বা ডেলিভারি নিশ্চিত হবে।\n৩. বাকি ৫০% পণ্য বুঝিয়ে দেওয়ার পর প্রদেয়।' : '1. Prices valid until mentioned validity date.\n2. 50% advance payment required to initiate order.\n3. Balance payable upon delivery.')}
                </div>
              </div>
            </div>

            {/* Calculations Box */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#475569' }}>
                <span>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>৳{Number(quote.subtotal).toLocaleString()}</span>
              </div>
              {quote.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#16a34a' }}>
                  <span>{lang === 'bn' ? 'বিশেষ ছাড়:' : 'Special Discount:'}</span>
                  <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>- ৳{Number(quote.discount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#475569' }}>
                <span>{lang === 'bn' ? `ভ্যাট (${quote.vatRate || 5}%):` : `Estimated VAT (${quote.vatRate || 5}%):`}</span>
                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>+ ৳{Number(quote.vat).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '2px solid #0f172a', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                <span>{lang === 'bn' ? 'মোট আনুমানিক বাজেট:' : 'Total Estimate:'}</span>
                <span style={{ color: '#6366f1', fontFamily: 'monospace' }}>৳{Number(quote.grandTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Acceptance */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontSize: '11px', color: '#475569' }}>
                {lang === 'bn' ? 'ক্লায়েন্টের সম্মতি ও স্বাক্ষর' : 'Client Acceptance & Signature'}
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
              <div>{businessSettings.companyName} | Quotations & Commercial Proposals</div>
            </div>

            <div style={{ textAlign: 'center', width: '200px' }}>
              {businessSettings.signatureStamp && (
                <img
                  src={businessSettings.signatureStamp}
                  alt="Official Seal"
                  style={{ maxHeight: '48px', maxWidth: '120px', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }}
                />
              )}
              <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontSize: '11px', color: '#475569', fontWeight: '700' }}>
                {lang === 'bn' ? 'অনুমোদনকারী কর্মকর্তার স্বাক্ষর' : 'Authorized Representative'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
