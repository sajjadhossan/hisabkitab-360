import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  TrendingUp,
  Banknote,
  AlertTriangle,
  Users,
  Compass,
  ArrowRight,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { startUniversalSpeechListener } from '../../services/voiceAssistantService';
import { parseVoiceBusinessInquiry, speakVoiceAnswer } from '../../services/voiceAnalyticsService';
import { speakVoiceConfirmation } from '../../services/voiceBillingService';

export const GlobalVoiceWidget = () => {
  const {
    profile,
    setProfile,
    activeTab,
    setActiveTab,
    salesHistory = [],
    products = [],
    customers = [],
    businessDebts = [],
    lang = 'bn',
    showToast
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  // Movable / Draggable Voice Button State with Safe Boundary Clamping
  const [btnPos, setBtnPos] = useState(() => {
    try {
      const saved = localStorage.getItem('hisabkitab_voice_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const safeMaxX = typeof window !== 'undefined' ? Math.max(10, window.innerWidth - 68) : 500;
          const safeMaxY = typeof window !== 'undefined' ? Math.max(60, window.innerHeight - 74) : 500;
          return {
            x: Math.max(10, Math.min(safeMaxX, parsed.x)),
            y: Math.max(60, Math.min(safeMaxY, parsed.y))
          };
        }
      }
    } catch {}
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({ pointerId: null, startX: 0, startY: 0, origX: 0, origY: 0, hasMoved: false });
  const buttonRef = useRef(null);

  const recognitionRef = useRef(null);

  // Auto-clamp button position when window resizes or phone rotates
  useEffect(() => {
    const handleResize = () => {
      setBtnPos(current => {
        if (!current) return null;
        const safeMaxX = Math.max(10, window.innerWidth - 68);
        const safeMaxY = Math.max(60, window.innerHeight - 74);
        const clampedX = Math.max(10, Math.min(safeMaxX, current.x));
        const clampedY = Math.max(60, Math.min(safeMaxY, current.y));
        if (clampedX !== current.x || clampedY !== current.y) {
          const updated = { x: clampedX, y: clampedY };
          try { localStorage.setItem('hisabkitab_voice_pos', JSON.stringify(updated)); } catch {}
          return updated;
        }
        return current;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Shortcut key Alt + H to toggle Voice Assistant
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'h' || e.key === 'H' || e.key === 'হ')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // When modal opens, auto-start listening
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      setTranscript('');
      setInterim('');
      setCurrentAnswer(null);
    }
  }, [isOpen]);

  const startListening = () => {
    if (isListening) return;

    setTranscript('');
    setInterim('');

    const recognition = startUniversalSpeechListener({
      lang: 'bn-BD',
      continuous: false,
      onInterim: (txt) => setInterim(txt),
      onResult: (finalText) => {
        setIsListening(false);
        setTranscript(finalText);
        setInterim('');
        handleProcessVoiceCommand(finalText);
      },
      onError: (err) => {
        console.warn('Voice assistant recognition error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (recognition) {
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Main Processor for Navigation + Business Q&A
  const handleProcessVoiceCommand = (sentence) => {
    if (!sentence || !sentence.trim()) return;

    const lower = sentence.toLowerCase().trim();

    // ========================================================
    // 1. Voice Navigation Intents
    // ========================================================
    if (lower.includes('বাকি খাতা') || lower.includes('দেনা পাওনা') || lower.includes('লেজার')) {
      setActiveTab('debts');
      const msg = 'বাকি খাতা ও দেনা-পাওনা ওপেন করা হয়েছে।';
      if (voiceSpeechEnabled) speakVoiceAnswer(msg, lang);
      showToast(msg, 'success');
      setCurrentAnswer({
        type: 'navigation',
        title: 'পৃষ্ঠা পরিবর্তন',
        value: 'বাকি খাতা',
        subtitle: 'দেনা-পাওনা লেজারে নিয়ে যাওয়া হয়েছে'
      });
      return;
    }

    if (lower.includes('টার্মিনাল') || lower.includes('বিক্রি কর') || lower.includes('মেমো কাট') || lower.includes('pos')) {
      setProfile('business');
      setActiveTab('pos');
      const msg = 'POS বিক্রয় টার্মিনাল ওপেন করা হয়েছে।';
      if (voiceSpeechEnabled) speakVoiceAnswer(msg, lang);
      showToast(msg, 'success');
      setCurrentAnswer({
        type: 'navigation',
        title: 'পৃষ্ঠা পরিবর্তন',
        value: 'POS টার্মিনাল',
        subtitle: 'ক্যাশিয়ার কাউন্টারে নিয়ে যাওয়া হয়েছে'
      });
      return;
    }

    if (lower.includes('ইনভেন্টরি') || lower.includes('পণ্য তালিকা') || lower.includes('স্টক দেখাও')) {
      setProfile('business');
      setActiveTab('inventory');
      const msg = 'ইনভেন্টরি ও পণ্য তালিকা ওপেন করা হয়েছে।';
      if (voiceSpeechEnabled) speakVoiceAnswer(msg, lang);
      showToast(msg, 'success');
      setCurrentAnswer({
        type: 'navigation',
        title: 'পৃষ্ঠা পরিবর্তন',
        value: 'ইনভেন্টরি ও স্টক',
        subtitle: 'পণ্য ব্যবস্থাপনায় নিয়ে যাওয়া হয়েছে'
      });
      return;
    }

    if (lower.includes('কাস্টমার') || lower.includes('গ্রাহক তালিকা') || lower.includes('সিআরএম')) {
      setProfile('business');
      setActiveTab('crm');
      const msg = 'কাস্টমার তালিকা ওপেন করা হয়েছে।';
      if (voiceSpeechEnabled) speakVoiceAnswer(msg, lang);
      showToast(msg, 'success');
      setCurrentAnswer({
        type: 'navigation',
        title: 'পৃষ্ঠা পরিবর্তন',
        value: 'কাস্টমার সিআরএম',
        subtitle: 'কাস্টমার ডাটাবেজে নিয়ে যাওয়া হয়েছে'
      });
      return;
    }

    if (lower.includes('খরচ') || lower.includes('ব্যয়') || lower.includes('দৈনিক খরচ')) {
      if (profile === 'personal') {
        setActiveTab('daily');
      } else {
        setActiveTab('erp');
      }
      const msg = 'খরচের হিসাব ওপেন করা হয়েছে।';
      if (voiceSpeechEnabled) speakVoiceAnswer(msg, lang);
      showToast(msg, 'success');
      setCurrentAnswer({
        type: 'navigation',
        title: 'পৃষ্ঠা পরিবর্তন',
        value: 'খরচের হিসাব',
        subtitle: 'ব্যয় ভাউচারে নিয়ে যাওয়া হয়েছে'
      });
      return;
    }

    // ========================================================
    // 2. Business Q&A and Analytics Inquiry
    // ========================================================
    const answer = parseVoiceBusinessInquiry(sentence, {
      salesHistory,
      products,
      customers,
      businessDebts
    });

    if (answer) {
      setCurrentAnswer(answer);
      if (voiceSpeechEnabled && answer.spokenAnswer) {
        speakVoiceAnswer(answer.spokenAnswer, lang);
      }
    }
  };

  const samplePrompts = [
    'আজকের বিক্রি কত?',
    'ক্যাশ ড্রয়ারে কত আছে?',
    'কোন মালের স্টক কম?',
    'সবচেয়ে বেশি বাকি কার কাছে?',
    'আজকের লাভ কত?',
    'দোকান বন্ধ করো (ডে-এন্ড)',
    'সারাদিনের হিসাব কি?',
    'বাকি খাতা খোলো',
    'POS টার্মিনাল যাও',
    'ইনভেন্টরি দেখাও'
  ];

  // Unified Pointer Dragging (Mobile Touch + Desktop Mouse + Stylus)
  const handlePointerDown = (e) => {
    if (e.button && e.button !== 0) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    dragInfo.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      hasMoved: false
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || dragInfo.current.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragInfo.current.hasMoved = true;
    }
    const safeMaxX = Math.max(10, window.innerWidth - 68);
    const safeMaxY = Math.max(60, window.innerHeight - 74);
    const newX = Math.max(10, Math.min(safeMaxX, dragInfo.current.origX + deltaX));
    const newY = Math.max(60, Math.min(safeMaxY, dragInfo.current.origY + deltaY));
    setBtnPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging || dragInfo.current.pointerId !== e.pointerId) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (dragInfo.current.hasMoved) {
      setBtnPos(current => {
        if (current) {
          try { localStorage.setItem('hisabkitab_voice_pos', JSON.stringify(current)); } catch {}
        }
        return current;
      });
    } else {
      // Tap / click without move
      setIsOpen(true);
    }
  };

  const handlePointerCancel = (e) => {
    if (isDragging && dragInfo.current.pointerId === e.pointerId) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button (Movable / Draggable anywhere on screen) */}
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          position: 'fixed',
          left: btnPos ? `${btnPos.x}px` : undefined,
          top: btnPos ? `${btnPos.y}px` : undefined,
          right: btnPos ? undefined : '20px',
          bottom: btnPos ? undefined : '80px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          color: '#ffffff',
          border: '2px solid rgba(255, 255, 255, 0.45)',
          boxShadow: isDragging 
            ? '0 16px 36px rgba(236, 72, 153, 0.7)' 
            : '0 8px 25px rgba(99, 102, 241, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          zIndex: 9990,
          transform: isDragging ? 'scale(1.12)' : 'scale(1)',
          transition: isDragging ? 'none' : 'box-shadow 0.25s, transform 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.45)';
          }
        }}
        title="🎙️ হিসাব সহকারী এআই (টেনে সুবিধাজনক জায়গায় রাখুন)"
      >
        <Sparkles size={16} style={{ position: 'absolute', top: '9px', right: '9px', color: '#fef08a', pointerEvents: 'none' }} />
        <Mic size={24} style={{ pointerEvents: 'none' }} />
      </button>

      {/* Full Interactive Voice Assistant Modal */}
      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(8px)', background: 'rgba(0, 0, 0, 0.7)' }}>
          <div
            className="modal-content animate-fade-in"
            style={{
              maxWidth: '520px',
              padding: '1.5rem',
              borderRadius: '24px',
              background: 'linear-gradient(165deg, var(--bg-card), var(--bg-main))',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '🎙️ হিসাব সহকারী (Voice AI)' : '🎙️ Voice AI Assistant'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'মুখে প্রশ্ন করুন বা যেকোনো পেজে যেতে বলুন' : 'Ask questions or navigate by voice'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {btnPos && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('hisabkitab_voice_pos');
                      setBtnPos(null);
                      showToast(lang === 'bn' ? 'বাটন পজিশন ডিফল্ট করা হয়েছে' : 'Button position reset', 'info');
                    }}
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}
                    title={lang === 'bn' ? 'বাটন অবস্থান রিসেট করুন' : 'Reset button position'}
                  >
                    <RotateCcw size={13} />
                    <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
                  style={{
                    background: voiceSpeechEnabled ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                    color: voiceSpeechEnabled ? '#10b981' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}
                  title={voiceSpeechEnabled ? 'ভয়েস উত্তর চালু' : 'নিঃশব্দ'}
                >
                  {voiceSpeechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span>{voiceSpeechEnabled ? 'শব্দ চালু' : 'নিঃশব্দ'}</span>
                </button>

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setIsOpen(false)}
                  style={{ borderRadius: '50%', width: '32px', height: '32px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Mic Center */}
            <div
              style={{
                textAlign: 'center',
                padding: '1.25rem 1rem',
                borderRadius: '18px',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px dashed rgba(99, 102, 241, 0.35)',
                marginBottom: '1.25rem'
              }}
            >
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: isListening
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: isListening ? '3px solid rgba(255,255,255,0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  cursor: 'pointer',
                  boxShadow: isListening
                    ? '0 0 25px rgba(239, 68, 68, 0.55)'
                    : '0 8px 20px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.2s'
                }}
                title={isListening ? 'ভয়েস বন্ধ করতে ক্লিক করুন' : 'কথা বলতে ক্লিক করুন'}
              >
                {isListening ? <Mic size={32} className="animate-pulse" /> : <Mic size={32} />}
              </button>

              <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {interim ? (
                  <span style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: '700', fontStyle: 'italic' }}>
                    "{interim}..."
                  </span>
                ) : transcript ? (
                  <span style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: '800' }}>
                    🗣️ "{transcript}"
                  </span>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isListening ? '🎤 বাংলায় আপনার প্রশ্ন বা নির্দেশ বলুন...' : 'মাইক্রোফোনে ক্লিক করে কথা বলুন'}
                  </span>
                )}
              </div>
            </div>

            {/* Answer Display Card */}
            {currentAnswer && (
              <div
                className="animate-fade-in"
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
                  border: '1.5px solid #10b981',
                  marginBottom: '1.25rem',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)'
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {currentAnswer.title}
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {currentAnswer.value}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {currentAnswer.subtitle}
                </div>
              </div>
            )}

            {/* Sample Prompts */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                {lang === 'bn' ? 'নমুনা জিজ্ঞাসা (ক্লিক করে টেস্ট করুন):' : 'Sample Voice Queries (Click to Test):'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
                {samplePrompts.map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTranscript(cmd);
                      handleProcessVoiceCommand(cmd);
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    🗣️ {cmd}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              শর্টকাট: কিবোর্ডে <strong>Alt + H</strong> চেপে যেকোনো সময় সহকারী ওপেন করুন
            </div>
          </div>
        </div>
      )}
    </>
  );
};
