import React, { useState, useEffect } from 'react';
import { Utensils, Bell, CheckCircle2, Clock, Maximize2, Minimize2, X, RefreshCw, Volume2 } from 'lucide-react';
import { soundService } from '../../services/soundService';

export const KitchenOrderTokenDisplay = ({
  isOpen,
  onClose,
  activeTokens = [],
  onUpdateTokenStatus,
  lang = 'bn'
}) => {
  const [tokens, setTokens] = useState(() => {
    if (activeTokens && activeTokens.length > 0) return activeTokens;
    // Default empty clean state, or allow user to create on the fly
    return [];
  });
  const [newTokenInput, setNewTokenInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (activeTokens && activeTokens.length > 0) {
      setTokens(activeTokens);
    }
  }, [activeTokens]);

  if (!isOpen) return null;

  const handleAddToken = (e) => {
    e.preventDefault();
    if (!newTokenInput.trim()) return;
    const tokenNum = newTokenInput.trim();
    const newEntry = {
      id: Date.now(),
      number: tokenNum,
      status: 'preparing', // 'preparing' | 'ready' | 'served'
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTokens((prev) => [newEntry, ...prev]);
    setNewTokenInput('');
    soundService.playBeep();
  };

  const handleMarkReady = (id, number) => {
    soundService.playSuccessChime();
    setTokens((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'ready' } : t))
    );
    if (onUpdateTokenStatus) {
      onUpdateTokenStatus(id, 'ready');
    }
  };

  const handleMarkServed = (id) => {
    soundService.playDeleteTone();
    setTokens((prev) => prev.filter((t) => t.id !== id));
    if (onUpdateTokenStatus) {
      onUpdateTokenStatus(id, 'served');
    }
  };

  const ringCallBell = (tokenNumber) => {
    soundService.playSuccessChime();
    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(`টোকেন নম্বর ${tokenNumber}, অর্ডার প্রস্তুত`);
        utterance.lang = 'bn-BD';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Fallback tone already played
      }
    }
  };

  const preparingTokens = tokens.filter((t) => t.status === 'preparing');
  const readyTokens = tokens.filter((t) => t.status === 'ready');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#090d16',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(15, 23, 42, 0.9)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <Utensils size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {lang === 'bn' ? 'স্মার্ট কিচেন ও অর্ডার টোকেন বোর্ড (KDS)' : 'Kitchen & Digital Token Display'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              {lang === 'bn' ? 'রেস্তোরাঁ ও কুইক কাউন্টারের জন্য লাইভ ডিজিটাল ডিসপ্লে ও কলআউট' : 'Real-time order ready board & customer token caller'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <form onSubmit={handleAddToken} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'টোকেন নং (যেমন: 12)' : 'Token #'}
              value={newTokenInput}
              onChange={(e) => setNewTokenInput(e.target.value)}
              style={{
                width: '120px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              + {lang === 'bn' ? 'ইস্যু' : 'Add'}
            </button>
          </form>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              } else {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem'
            }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? (lang === 'bn' ? 'ছোট করুন' : 'Exit Fullscreen') : (lang === 'bn' ? 'ফুলস্ক্রিন' : 'Fullscreen')}</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px', overflow: 'hidden' }}>
        {/* Left Column: Preparing */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '2px dashed rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={28} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>
                {lang === 'bn' ? 'তৈরি হচ্ছে (PREPARING)' : 'PREPARING'}
              </h3>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
              {preparingTokens.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
            {preparingTokens.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '2px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'pulse 2s infinite'
                }}
              >
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fef08a' }}>
                  #{t.number}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {t.createdAt}
                </div>
                <button
                  onClick={() => handleMarkReady(t.id, t.number)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{lang === 'bn' ? 'প্রস্তুত করুন' : 'Mark Ready'}</span>
                </button>
              </div>
            ))}
            {preparingTokens.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                {lang === 'bn' ? 'বর্তমানে কোনো অর্ডার প্রস্তুত করা হচ্ছে না' : 'No pending orders in prep'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ready for Pickup */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={30} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                {lang === 'bn' ? 'ডেলিভারি প্রস্তুত (NOW SERVING)' : 'NOW SERVING'}
              </h3>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', background: '#10b981', color: '#000000' }}>
              {readyTokens.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {readyTokens.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
                }}
              >
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#6ee7b7', letterSpacing: '-0.03em' }}>
                  #{t.number}
                </div>

                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <button
                    onClick={() => ringCallBell(t.number)}
                    title={lang === 'bn' ? 'বেল বাজান' : 'Call customer'}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    onClick={() => handleMarkServed(t.id)}
                    style={{
                      flex: 2,
                      padding: '8px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#000',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'bn' ? 'সম্পন্ন' : 'Served'}
                  </button>
                </div>
              </div>
            ))}
            {readyTokens.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
                {lang === 'bn' ? 'কোনো প্রস্তুত টোকেন নেই' : 'No orders waiting for pickup'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default KitchenOrderTokenDisplay;
