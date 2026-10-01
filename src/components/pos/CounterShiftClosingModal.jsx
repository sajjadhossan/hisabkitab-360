import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Clock,
  User,
  Store,
  Monitor,
  ArrowRight,
  History,
  FileText,
  MessageCircle
} from 'lucide-react';
import {
  normalizeWhatsAppPhone,
  formatWhatsAppShiftClosingMessage
} from '../../services/qrService';

export const CounterShiftClosingModal = ({ isOpen, onClose }) => {
  const {
    activeBranch,
    activeCounter,
    salesHistory,
    performCounterClosing,
    counterClosings,
    businessSettings,
    lang,
    showToast
  } = useApp();

  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('closing'); // 'closing' | 'history'
  const [actualCashInput, setActualCashInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [lastClosedRecord, setLastClosedRecord] = useState(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const currentCounterId = activeCounter?.id || 'cnt-1';

  // Calculate today's sales for this counter
  const todayCounterSales = salesHistory.filter(s => 
    s.counterId === currentCounterId && s.date.startsWith(today)
  );

  const totalCashSales = todayCounterSales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);

  const totalDigitalSales = todayCounterSales
    .filter(s => s.paymentMethod !== 'cash' && s.paymentMethod !== 'due')
    .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);

  const totalDueSales = todayCounterSales
    .filter(s => s.paymentMethod === 'due' || (Number(s.dueAmount) > 0))
    .reduce((sum, s) => sum + (Number(s.dueAmount) || 0), 0);

  const openingFloat = Number(activeCounter?.openingFloat) || 1000;
  const expectedDrawerCash = openingFloat + totalCashSales;

  const actualCash = actualCashInput === '' ? expectedDrawerCash : Number(actualCashInput);
  const discrepancy = actualCash - expectedDrawerCash;

  const handleSendWhatsApp = (record) => {
    const item = record || lastClosedRecord;
    if (!item) return;
    const targetPhone = businessSettings?.whatsappAlertNumber || businessSettings?.phone || '';
    const cleanPhone = normalizeWhatsAppPhone(targetPhone);
    const msg = formatWhatsAppShiftClosingMessage(item, businessSettings, lang);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    if (showToast) {
      showToast(lang === 'bn' ? 'WhatsApp-এ শিফট রিপোর্ট পাঠানো হচ্ছে...' : 'Opening WhatsApp shift report...');
    }
  };

  const handleConfirmClosing = (e) => {
    e.preventDefault();
    const record = performCounterClosing({
      counterId: currentCounterId,
      closingCash: actualCash,
      note: noteInput,
      cashierName: user?.name || 'কাউন্টার ক্যাশিয়ার'
    });
    setLastClosedRecord(record);
  };

  const handlePrintSlip = (record) => {
    const item = record || lastClosedRecord;
    if (!item) return;

    const printWin = window.open('', '_blank', 'width=420,height=600');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Counter Shift Closing Slip</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 15px; font-size: 13px; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          .flex { display: flex; justify-content: space-between; }
          .pad-y { padding: 3px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">${item.branchName}</div>
        <div class="center">${item.counterName} (শিফট ক্লোজিং স্লিপ)</div>
        <div class="line"></div>
        <div class="flex pad-y"><span>তারিখ ও সময়:</span><span>${item.timestamp}</span></div>
        <div class="flex pad-y"><span>ক্যাশিয়ার:</span><span>${item.cashierName}</span></div>
        <div class="line"></div>
        <div class="flex pad-y"><span>প্রারম্ভিক ক্যাশ (Float):</span><span>৳${item.openingFloat.toLocaleString()}</span></div>
        <div class="flex pad-y"><span>নগদ বিক্রি (Cash Sales):</span><span>৳${item.totalCashSales.toLocaleString()}</span></div>
        <div class="flex pad-y"><span>ডিজিটাল বিক্রি (bKash/Card):</span><span>৳${item.totalDigitalSales.toLocaleString()}</span></div>
        <div class="flex pad-y"><span>মোট ইনভয়েস সংখ্যা:</span><span>${item.totalTransactions} টি</span></div>
        <div class="line"></div>
        <div class="flex pad-y bold" style="font-size: 14px;"><span>প্রত্যাশিত ক্যাশ:</span><span>৳${item.expectedDrawerCash.toLocaleString()}</span></div>
        <div class="flex pad-y bold" style="font-size: 14px;"><span>হ্যান্ডওভার নগদ:</span><span>৳${item.actualCash.toLocaleString()}</span></div>
        <div class="flex pad-y"><span>গরমিল / ব্যালেন্স তফাৎ:</span><span>${item.discrepancy === 0 ? '৳০ (সঠিক মিল)' : (item.discrepancy > 0 ? `+৳${item.discrepancy} (উদ্বৃত্ত)` : `-৳${Math.abs(item.discrepancy)} (ঘাটতি)`)}</span></div>
        ${item.note ? `<div class="line"></div><div class="pad-y">নোট: ${item.note}</div>` : ''}
        <div class="line"></div>
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <span>ক্যাশিয়ারের স্বাক্ষর: ____________</span>
          <span>মালিক/ম্যানেজারের স্বাক্ষর: ____________</span>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          border: '1.5px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--business-primary)', color: '#fff', padding: '8px', borderRadius: '10px' }}>
              <Banknote size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'কাউন্টার শিফট ক্লোজিং ও ক্যাশ হ্যান্ডওভার' : 'Counter Shift Closing & Cash Handover'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {activeBranch?.name} • {activeCounter?.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setActiveTab('closing')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'closing' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'closing' ? 'var(--business-primary)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'closing' ? '2px solid var(--business-primary)' : 'none'
            }}
          >
            {lang === 'bn' ? '📋 আজকের শিফট হিসাব' : 'Today Shift Balance'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: activeTab === 'history' ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === 'history' ? 'var(--business-primary)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'history' ? '2px solid var(--business-primary)' : 'none'
            }}
          >
            {lang === 'bn' ? `📜 পূর্ববর্তী ক্লোজিং (${counterClosings.length})` : `History (${counterClosings.length})`}
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'closing' ? (
            lastClosedRecord ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'শিফট ক্লোজিং সফলভাবে সম্পন্ন হয়েছে!' : 'Shift Closed Successfully!'}
                </h4>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  হ্যান্ডওভার নগদ ক্যাশ: ৳{lastClosedRecord.actualCash.toLocaleString()}
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(lastClosedRecord)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#25d366',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>{lang === 'bn' ? 'WhatsApp-এ মালিককে রিপোর্ট পাঠান' : 'Send WhatsApp Report'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintSlip(lastClosedRecord)}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Printer size={16} />
                    <span>{lang === 'bn' ? 'ক্লোজিং স্লিপ প্রিন্ট করুন' : 'Print Shift Slip'}</span>
                  </button>

                  <button
                    onClick={() => { setLastClosedRecord(null); onClose(); }}
                    className="btn btn-secondary"
                  >
                    {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmClosing}>
                {/* Info Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>প্রারম্ভিক ক্যাশ (Float)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>৳{openingFloat.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#10b981' }}>আজকের নগদ বিক্রয়</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#10b981' }}>৳{totalCashSales.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '8px 10px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6366f1' }}>ডিজিটাল বিক্রয়</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#6366f1' }}>৳{totalDigitalSales.toLocaleString()}</div>
                  </div>
                </div>

                {/* Calculation Box */}
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>কাউন্টার মোট বিক্রয় ইনভয়েস:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{todayCounterSales.length} টি</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>বকেয়া বিক্রয়:</span>
                    <span style={{ fontWeight: '700', color: '#f59e0b' }}>৳{totalDueSales.toLocaleString()}</span>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800' }}>
                    <span>ড্রয়ারের প্রত্যাশিত নগদ ক্যাশ:</span>
                    <span style={{ color: 'var(--text-main)' }}>৳{expectedDrawerCash.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actual Cash Input */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', justifyContent: 'space-between' }}>
                    <span>প্রকৃত গণনা করা নগদ ক্যাশ (Actual Cash in Hand) *</span>
                    {discrepancy !== 0 && (
                      <span style={{ color: discrepancy > 0 ? '#3b82f6' : '#ef4444', fontSize: '0.78rem' }}>
                        {discrepancy > 0 ? `+৳${discrepancy.toLocaleString()} (উদ্বৃত্ত ক্যাশ)` : `-৳${Math.abs(discrepancy).toLocaleString()} (ঘাটতি ক্যাশ)`}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder={`৳${expectedDrawerCash}`}
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    style={{ fontSize: '1.1rem', fontWeight: '800' }}
                    required
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    ক্যাশ ড্রয়ারে গুনে যে পরিমাণ টাকা পাওয়া গেছে তা লিখুন
                  </div>
                </div>

                {/* Handover Note */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>হ্যান্ডওভার নোট / ক্যাশ বুঝিয়া দেওয়ার মন্তব্য</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="যেমন: পরবর্তী শিফটের ক্যাশিয়ারের নিকট সম্পূর্ণ ক্যাশ বুঝিয়ে দেওয়া হলো"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                  />
                </div>

                {/* Submit Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px', fontSize: '0.92rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{lang === 'bn' ? 'শিফট ক্লোজিং সম্পন্ন করুন' : 'Confirm Shift Closing'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-secondary"
                    style={{ padding: '12px 18px' }}
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </form>
            )
          ) : (
            <div>
              {counterClosings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <History size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p>{lang === 'bn' ? 'কোনো পূর্ববর্তী শিফট ক্লোজিং রেকর্ড পাওয়া যায়নি' : 'No previous closing records found'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {counterClosings.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {c.counterName} ({c.branchName})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ক্যাশিয়ার: {c.cashierName} • {c.timestamp}
                        </div>
                        {c.note && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            নোট: {c.note}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '1rem', color: '#10b981' }}>
                          ৳{c.actualCash.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '3px' }}>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(c)}
                            title="WhatsApp-এ রিপোর্ট শেয়ার করুন"
                            style={{
                              background: 'rgba(37, 211, 102, 0.1)',
                              border: '1px solid #25d366',
                              borderRadius: '6px',
                              color: '#25d366',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px'
                            }}
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintSlip(c)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--business-primary)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={12} />
                            <span>স্লিপ প্রিন্ট</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
