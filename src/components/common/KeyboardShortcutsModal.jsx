import React from 'react';
import {
  Keyboard,
  X,
  Zap,
  Lock,
  ShoppingCart,
  BookOpen,
  DollarSign,
  Package,
  FileText,
  Mic,
  ArrowRight
} from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';

export const KeyboardShortcutsModal = ({ isOpen, onClose, onNavigate, onToggleLock, lang = 'bn' }) => {
  if (!isOpen) return null;

  const SHORTCUT_GROUPS = [
    {
      title: lang === 'bn' ? '⚡ দ্রুত বিলিং ও কাউন্টার কন্ট্রোল' : '⚡ Fast POS & Counter Control',
      shortcuts: [
        { key: 'F2', label: lang === 'bn' ? 'পিওএস সেল টার্মিনাল' : 'POS Sales Terminal', desc: lang === 'bn' ? '১-ক্লিকে নতুন বিক্রির পর্দা খুলুন' : 'Open instant sales screen', icon: ShoppingCart, color: '#6366f1', action: 'pos' },
        { key: 'F1', label: lang === 'bn' ? 'ক্যালকুলেটর ও কুইক প্যাড' : 'Calculator & Scratchpad', desc: lang === 'bn' ? 'ভাসমান দ্রুত হিসাব ও নোটবুক' : 'Floating calculator & memo', icon: Zap, color: '#f59e0b', action: 'quickpad' },
        { key: 'Ctrl + Shift + L', label: lang === 'bn' ? 'কাউন্টার স্ক্রিন লক' : 'Lock Counter Screen', desc: lang === 'bn' ? 'পিন বা ফিঙ্গারপ্রিন্ট লক সক্রিয় করুন' : 'Lock screen with PIN/biometrics', icon: Lock, color: '#ef4444', action: 'lock' },
        { key: 'Alt + H', label: lang === 'bn' ? 'বাংলা ভয়েস অ্যাসিস্ট্যান্ট' : 'Bengali Voice AI', desc: lang === 'bn' ? 'মুখে বলে হিসাব এন্ট্রি শুরু/বন্ধ করুন' : 'Toggle voice billing & analytics', icon: Mic, color: '#10b981', action: 'voice' }
      ]
    },
    {
      title: lang === 'bn' ? '📚 খাতা ও লেজার নেভিগেশন' : '📚 Ledger & Hub Navigation',
      shortcuts: [
        { key: 'F3', label: lang === 'bn' ? 'দেনা-পাওনা / বাকির খাতা' : 'Debt Khata (Debts/Dues)', desc: lang === 'bn' ? 'কাস্টমার ও মহাজনদের বাকি খাতা' : 'Customer & supplier dues khata', icon: BookOpen, color: '#0ea5e9', action: 'debts' },
        { key: 'F4', label: lang === 'bn' ? 'দৈনিক খরচ ও রানিং হিসাব' : 'Daily Expenses & Accounts', desc: lang === 'bn' ? 'দোকান ও পরিবারের খরচের খাতা' : 'Daily shop & family expenses', icon: DollarSign, color: '#10b981', action: 'daily' },
        { key: 'F7', label: lang === 'bn' ? 'গুদাম স্টক ও ইনভেন্টরি' : 'Inventory & Stock Hub', desc: lang === 'bn' ? 'পণ্য তালিকা ও লো-স্টক অ্যালার্ট' : 'Product stock & barcode list', icon: Package, color: '#8b5cf6', action: 'inventory' },
        { key: 'F8', label: lang === 'bn' ? 'বিক্রির চালান ও রসিদ তালিকা' : 'Invoices & Receipts', desc: lang === 'bn' ? 'সকল পূর্ববর্তী মেমো প্রিন্ট ও শেয়ার' : 'All invoice receipts & history', icon: FileText, color: '#ec4899', action: 'invoices' }
      ]
    },
    {
      title: lang === 'bn' ? '🖥️ সাধারণ সিস্টেম কন্ট্রোল' : '🖥️ General System Controls',
      shortcuts: [
        { key: 'Shift + ?', label: lang === 'bn' ? 'কীবোর্ড শর্টকাট গাইড' : 'Shortcuts Guide', desc: lang === 'bn' ? 'এই হেল্প উইন্ডোটি দেখুন' : 'Show this shortcuts modal', icon: Keyboard, color: '#0ea5e9' },
        { key: 'Escape', label: lang === 'bn' ? 'মোডাল / উইন্ডো বন্ধ' : 'Close Active Modal', desc: lang === 'bn' ? 'যেকোনো খোলা পপ-আপ বন্ধ করুন' : 'Dismiss active dialog or drawer', icon: X, color: '#94a3b8' }
      ]
    }
  ];

  const handleShortcutClick = (item) => {
    hapticFeedback.light();
    if (item.action === 'lock' && onToggleLock) {
      onClose();
      onToggleLock();
    } else if (item.action && onNavigate) {
      onClose();
      onNavigate(item.action);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content modal-spring"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Keyboard size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '⌨️ পিসি ও ডেস্কটপ কীবোর্ড শর্টকাট' : '⌨️ Desktop PC Keyboard Shortcuts'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'মাউস ছাড়া বিদ্যুৎ গতিতে হিসাব পরিচালনা ও নেভিগেশন করুন' : 'Fly through POS, Khata & Billing without touching the mouse'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {SHORTCUT_GROUPS.map((group, gIdx) => (
            <div key={gIdx}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {group.title}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                {group.shortcuts.map((sc, scIdx) => {
                  const Icon = sc.icon;
                  return (
                    <div
                      key={scIdx}
                      onClick={() => sc.action && handleShortcutClick(sc)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: sc.action ? 'pointer' : 'default',
                        transition: 'all 0.15s ease'
                      }}
                      className={sc.action ? 'card-interactive' : ''}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${sc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color, flexShrink: 0 }}>
                          <Icon size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sc.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sc.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <kbd
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 2px 0 var(--border-color)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            color: '#0ea5e9',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sc.key}
                        </kbd>
                        {sc.action && <ArrowRight size={13} color="var(--text-dim)" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            💡 {lang === 'bn' ? 'যেকোনো সময় কিবোর্ডে Shift + ? চাপলে এই গাইড ওপেন হবে।' : 'Press Shift + ? anytime to open this shortcut guide.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'ঠিক আছে' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
