import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  GripVertical,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { hapticFeedback } from '../../services/nativeAppService';
import { isLiveSyncConnected } from '../../services/liveSyncService';
import { useDraggableWidget } from '../../utils/useDraggableWidget';

/**
 * Live Floating Cash Counter & Drawer Widget
 * -------------------------------------------
 * Provides real-time instant visibility into the physical cash drawer.
 * Updates dynamically on every sale, refund, or cash expense.
 * Fully movable / draggable across the screen on both Desktop and Android / iOS Touch.
 * Persists position in localStorage with edge boundary clamping.
 * Tap opens a sleek bottom sheet breakdown.
 */
export const LiveCashCounterWidget = () => {
  const {
    salesHistory = [],
    dailyExpenses = [],
    lang,
    setActiveTab
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const isLive = isLiveSyncConnected();

  const { ref: dragRef, isDragging, hasMoved, style: dragStyle, bind, resetPosition } = useDraggableWidget(
    'hk360_live_cash_widget_pos',
    { right: 16, bottom: 84 }
  );

  // Calculate Today's Live Cash Metrics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaySalesCash = useMemo(() => {
    return (salesHistory || [])
      .filter((s) => (s.date || '').startsWith(todayStr))
      .reduce((sum, s) => sum + (Number(s.paidAmount || s.grandTotal) || 0), 0);
  }, [salesHistory, todayStr]);

  const todayExpensesCash = useMemo(() => {
    return (dailyExpenses || [])
      .filter((e) => (e.date || '').startsWith(todayStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [dailyExpenses, todayStr]);

  const netDrawerCash = Math.max(0, todaySalesCash - todayExpensesCash);

  return (
    <>
      <aside
        ref={dragRef}
        {...bind}
        aria-label={lang === 'bn' ? 'লাইভ ক্যাশ কাউন্টার' : 'Live Cash Counter'}
        className={`live-cash-widget ${isDragging ? 'is-dragging' : ''}`}
        style={{
          ...dragStyle,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onClick={() => {
          if (hasMoved || isDragging) return;
          hapticFeedback.light();
          setIsOpen(true);
        }}
        title={lang === 'bn' ? 'লাইভ ক্যাশ ড্রয়ার ট্র্যাকার (টেনে যেকোনো জায়গায় রাখুন)' : 'Live Cash Drawer Tracker (Draggable)'}
      >
        {/* Grip Affordance for Touch & Mouse */}
        <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.55, pointerEvents: 'none' }}>
          <GripVertical size={13} />
        </span>

        <span
          className="live-pulse-dot"
          style={{ backgroundColor: isLive ? '#10b981' : '#f59e0b', pointerEvents: 'none' }}
        />

        <span style={{ display: 'inline-flex', alignItems: 'center', pointerEvents: 'none' }}>
          <Wallet size={15} style={{ color: 'var(--personal-primary)' }} />
        </span>

        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: '800',
            color: 'var(--text-main)',
            letterSpacing: '0.2px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          ৳{netDrawerCash.toLocaleString()}
        </span>
      </aside>

      {/* Breakdown Bottom Sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={lang === 'bn' ? '💵 লাইভ ক্যাশ ড্রয়ার ও ব্যালেন্স' : '💵 Live Cash Drawer Balance'}
        icon={<Wallet size={20} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Main Net Drawer Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {lang === 'bn' ? 'আজকের নীট ক্যাশ ব্যালেন্স (ড্রয়ারে রক্ষিত)' : "Today's Net Cash in Drawer"}
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: '900',
                color: '#10b981',
                fontFamily: 'var(--font-mono)'
              }}
            >
              ৳{netDrawerCash.toLocaleString()}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span>{isLive ? (lang === 'bn' ? 'ক্লাউড লাইভ সিঙ্ক অ্যাক্টিভ' : 'Cloud Live Synced') : (lang === 'bn' ? 'অফলাইন সুরক্ষিত' : 'Offline Protected')}</span>
            </div>
          </div>

          {/* Cash In vs Out Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Cash In */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: '700' }}>
                <ArrowDownLeft size={16} />
                <span>{lang === 'bn' ? 'মোট বিক্রয় জমা' : 'Cash In'}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                ৳{todaySalesCash.toLocaleString()}
              </div>
            </div>

            {/* Cash Out */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>
                <ArrowUpRight size={16} />
                <span>{lang === 'bn' ? 'আজকের খরচ' : 'Cash Out'}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                ৳{todayExpensesCash.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', fontWeight: '700' }}
              onClick={() => {
                hapticFeedback.light();
                setIsOpen(false);
                if (setActiveTab) setActiveTab('pos');
              }}
            >
              <TrendingUp size={16} />
              <span>{lang === 'bn' ? 'নতুন বিক্রি (POS)' : 'New Sale (POS)'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', fontWeight: '700' }}
              onClick={() => {
                hapticFeedback.light();
                setIsOpen(false);
                if (setActiveTab) setActiveTab('branch_control');
              }}
            >
              <Wallet size={16} />
              <span>{lang === 'bn' ? 'ক্যাশ ক্লোজিং' : 'Cash Closing'}</span>
            </button>
          </div>

          {/* Reset Position Option */}
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                resetPosition();
                hapticFeedback.light();
                setIsOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RotateCcw size={13} />
              <span>{lang === 'bn' ? 'ড্রয়ার উইজেটের অবস্থান রিসেট করুন (মূল ডকে ফেরত)' : 'Reset Drawer Widget Position'}</span>
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
