import React, { useState, useEffect } from 'react';
import { Calculator, Edit3, X, Copy, Check, Banknote, Sparkles } from 'lucide-react';
import { hapticFeedback } from '../../services/nativeAppService';
import { useApp } from '../../context/AppContext';
import { CashDenominationModal } from './CashDenominationModal';

export const FloatingQuickPad = () => {
  const { lang, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('calc'); // 'calc' | 'notes'
  const [showDenomModal, setShowDenomModal] = useState(false);

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');
  const [copiedCalc, setCopiedCalc] = useState(false);

  // Scratchpad State
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem('hk360_scratchpad_notes') || '';
    } catch {
      return '';
    }
  });
  const [copiedNotes, setCopiedNotes] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('hk360_scratchpad_notes', notes);
    } catch {}
  }, [notes]);

  const handleCalcClick = (val) => {
    hapticFeedback.light();
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcEquation('');
    } else if (val === '⌫') {
      setCalcDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '=') {
      try {
        const sanitized = (calcEquation + calcDisplay).replace(/×/g, '*').replace(/÷/g, '/');
        // evaluate safely
        const res = Function(`'use strict'; return (${sanitized})`)();
        const formatted = Number.isInteger(res) ? String(res) : Number(res).toFixed(2).replace(/\.?0+$/, '');
        setCalcDisplay(formatted);
        setCalcEquation('');
        hapticFeedback.success();
      } catch {
        setCalcDisplay('Error');
      }
    } else if (['+', '-', '×', '÷'].includes(val)) {
      setCalcEquation(prev => `${prev} ${calcDisplay} ${val}`);
      setCalcDisplay('0');
    } else if (val === '%') {
      const num = parseFloat(calcDisplay);
      setCalcDisplay(String(num / 100));
    } else if (val === '.') {
      if (!calcDisplay.includes('.')) {
        setCalcDisplay(prev => prev + '.');
      }
    } else {
      setCalcDisplay(prev => (prev === '0' || prev === 'Error' ? val : prev + val));
    }
  };

  const handleCopyCalc = () => {
    hapticFeedback.light();
    navigator.clipboard.writeText(calcDisplay);
    setCopiedCalc(true);
    setTimeout(() => setCopiedCalc(false), 2000);
    showToast(lang === 'bn' ? 'ক্যালকুলেটর ফলাফল কপি হয়েছে' : 'Result copied');
  };

  const handleCopyNotes = () => {
    hapticFeedback.light();
    navigator.clipboard.writeText(notes);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
    showToast(lang === 'bn' ? 'খসড়া নোট কপি হয়েছে' : 'Notes copied');
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        type="button"
        onClick={() => {
          hapticFeedback.light();
          setIsOpen(!isOpen);
        }}
        aria-label="Quick Calculator"
        style={{
          position: 'fixed',
          bottom: '84px',
          right: '16px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1090,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        className="press-scale"
      >
        <Calculator size={22} />
      </button>

      {/* Floating Quick Drawer */}
      {isOpen && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '140px',
            right: '16px',
            width: '310px',
            maxWidth: 'calc(100vw - 32px)',
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1.5px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.45)',
            zIndex: 1100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header & Tabs */}
          <div
            style={{
              padding: '10px 12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setTab('calc')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: tab === 'calc' ? 'var(--business-primary)' : 'transparent',
                  color: tab === 'calc' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                ক্যালকুলেটর
              </button>
              <button
                type="button"
                onClick={() => setTab('notes')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: tab === 'notes' ? 'var(--business-primary)' : 'transparent',
                  color: tab === 'notes' ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                খসড়া নোট
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowDenomModal(true);
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
                title="ক্যাশ নোট গণক"
              >
                💵 নোট
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* TAB 1: POCKET CALCULATOR */}
          {tab === 'calc' && (
            <div style={{ padding: '10px' }}>
              {/* Display */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {calcEquation}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {calcDisplay}
                </div>
              </div>

              {/* Calculator Keypad Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['C', 'CE', '⌫', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '%', '='].map((k) => {
                  const isOp = ['+', '-', '×', '÷', '='].includes(k);
                  const isClear = ['C', 'CE', '⌫'].includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleCalcClick(k)}
                      style={{
                        padding: '10px 0',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: k === '=' ? 'var(--business-primary)' : isOp ? 'rgba(99, 102, 241, 0.15)' : isClear ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                        color: k === '=' ? '#ffffff' : isOp ? 'var(--business-primary)' : isClear ? '#ef4444' : 'var(--text-main)',
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCopyCalc}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedCalc ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCalc ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SCRATCHPAD NOTES */}
          {tab === 'notes' && (
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                rows={6}
                placeholder="এখানে খসড়া হিসাব, কাস্টমারের নম্বর বা দ্রুত কোনো নোট লিখে রাখুন..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '12px',
                  padding: '8px 10px',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setNotes('')}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  ক্লিয়ার
                </button>
                <button
                  type="button"
                  onClick={handleCopyNotes}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedNotes ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedNotes ? 'কপি হয়েছে' : 'নোট কপি'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cash Denomination Modal */}
      <CashDenominationModal
        isOpen={showDenomModal}
        onClose={() => setShowDenomModal(false)}
      />
    </>
  );
};
