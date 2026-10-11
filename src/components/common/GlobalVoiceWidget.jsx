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
import {
  speakVoiceConfirmation,
  convertBengaliDigitsToNumber,
  BENGALI_WORD_NUMBERS
} from '../../services/voiceBillingService';
import { useDraggableWidget } from '../../utils/useDraggableWidget';

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
    collectDue,
    adjustStock,
    addBusinessExpense,
    addExpense,
    lang = 'bn',
    showToast
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);

  // Movable / Draggable Voice Button with useDraggableWidget
  const {
    ref: dragRef,
    isDragging,
    hasMoved,
    pos: btnPos,
    style: dragStyle,
    bind: dragBind,
    resetPosition
  } = useDraggableWidget('hisabkitab_voice_pos', { right: 16, bottom: 204 });

  const recognitionRef = useRef(null);

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
    // 2. Direct Smart Voice Actions (Debt Collect, Stock In, Expense)
    // ========================================================
    const extractAmountVal = (text) => {
      const digitMatch = text.match(/([০-৯0-9]+)/);
      if (digitMatch) {
        return convertBengaliDigitsToNumber(digitMatch[1]);
      }
      for (const [w, val] of Object.entries(BENGALI_WORD_NUMBERS)) {
        if (text.includes(w)) return val;
      }
      return null;
    };

    // A. Debt Collection Action (বাকি আদায় / দেনা জমা)
    const isDebt = lower.includes('বাকি') || lower.includes('বকেয়া') || lower.includes('বকেয়া') || lower.includes('দেনা');
    const isCollect = lower.includes('আদায়') || lower.includes('জমা') || lower.includes('পরিশোধ') || lower.includes('দিল');
    if (isDebt && isCollect) {
      const amt = extractAmountVal(lower);
      let matchedCust = null;
      for (const c of customers) {
        const cName = (c.name || '').toLowerCase();
        const parts = cName.split(' ').filter(p => p.length > 2);
        if (lower.includes(cName) || parts.some(p => lower.includes(p))) {
          matchedCust = c;
          break;
        }
      }

      if (matchedCust && amt && amt > 0 && typeof collectDue === 'function') {
        collectDue(matchedCust.id, amt, 'cash', 'ভয়েস কমান্ডে আদায়');
        const spoken = `${matchedCust.name} এর ৳${amt.toLocaleString()} টাকা বকেয়া আদায় সফলভাবে সম্পন্ন হয়েছে।`;
        if (voiceSpeechEnabled) speakVoiceAnswer(spoken, lang);
        showToast(spoken, 'success');
        setCurrentAnswer({
          type: 'action',
          title: 'বকেয়া আদায় সম্পন্ন ✅',
          value: `৳${amt.toLocaleString()}`,
          subtitle: `${matchedCust.name} এর খাতা আপডেট হয়েছে`
        });
        setActiveTab('debts');
        return;
      } else if (amt && amt > 0) {
        const spoken = `৳${amt.toLocaleString()} টাকা বকেয়া আদায়ের জন্য কাস্টমার পেজ ওপেন করা হয়েছে।`;
        if (voiceSpeechEnabled) speakVoiceAnswer(spoken, lang);
        showToast(spoken, 'info');
        setActiveTab('debts');
        setCurrentAnswer({
          type: 'action',
          title: 'বকেয়া আদায়ের খাতা',
          value: `৳${amt.toLocaleString()}`,
          subtitle: 'তালিকা থেকে নির্দিষ্ট কাস্টমারে ক্লিক করুন'
        });
        return;
      }
    }

    // B. Stock In Action (স্টক বৃদ্ধি / যোগ)
    const isStock = lower.includes('স্টক') || lower.includes('মাল');
    const isAdd = lower.includes('বাড়াও') || lower.includes('বাড়া') || lower.includes('ইন') || lower.includes('যোগ') || lower.includes('ঢুক');
    if (isStock && isAdd) {
      const qty = extractAmountVal(lower) || 1;
      let matchedProd = null;
      for (const p of products) {
        const pName = (p.name || '').toLowerCase();
        const parts = pName.split(' ').filter(x => x.length > 2);
        if (lower.includes(pName) || parts.some(x => lower.includes(x))) {
          matchedProd = p;
          break;
        }
      }

      if (matchedProd && typeof adjustStock === 'function') {
        adjustStock(matchedProd.id, qty);
        const spoken = `${matchedProd.name} এর স্টক ${qty} টি বৃদ্ধি করা হয়েছে।`;
        if (voiceSpeechEnabled) speakVoiceAnswer(spoken, lang);
        showToast(spoken, 'success');
        setCurrentAnswer({
          type: 'action',
          title: 'স্টক ইন সম্পন্ন ✅',
          value: `+${qty} টি`,
          subtitle: `${matchedProd.name} (বর্তমান মোট স্টক: ${(Number(matchedProd.stock) || 0) + qty})`
        });
        setActiveTab('inventory');
        return;
      } else {
        const spoken = `${qty} টি পণ্য স্টকে যোগ করার জন্য ইনভেন্টরি ওপেন করা হয়েছে।`;
        if (voiceSpeechEnabled) speakVoiceAnswer(spoken, lang);
        showToast(spoken, 'info');
        setActiveTab('inventory');
        setCurrentAnswer({
          type: 'action',
          title: 'স্টক ইন পেজ',
          value: `+${qty} টি`,
          subtitle: 'তালিকা থেকে নির্দিষ্ট পণ্য নির্বাচন করুন'
        });
        return;
      }
    }

    // C. Record Expense Action (খরচ ভাউচার)
    const isExp = lower.includes('খরচ') || lower.includes('ব্যয়') || lower.includes('ভাড়া') || lower.includes('বিল');
    const expAmt = extractAmountVal(lower);
    if (isExp && expAmt && expAmt > 0) {
      const expHandler = addBusinessExpense || addExpense;
      if (typeof expHandler === 'function') {
        expHandler({
          title: sentence,
          amount: expAmt,
          category: 'সাধারণ খরচ',
          paymentMethod: 'cash'
        });
        const spoken = `৳${expAmt.toLocaleString()} টাকা খরচের ভাউচার সফলভাবে সেভ হয়েছে।`;
        if (voiceSpeechEnabled) speakVoiceAnswer(spoken, lang);
        showToast(spoken, 'success');
        setCurrentAnswer({
          type: 'action',
          title: 'খরচ রেকর্ড সম্পন্ন ✅',
          value: `৳${expAmt.toLocaleString()}`,
          subtitle: `ভাউচার: ${sentence}`
        });
        setActiveTab(profile === 'personal' ? 'daily' : 'erp');
        return;
      }
    }

    // ========================================================
    // 3. Business Q&A and Analytics Inquiry
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
    'রহিম সাহেবের বাকি ৫০০ টাকা জমা করো',
    '১০ কেজি চিনি স্টক বাড়াও',
    'চা নাস্তা খরচ ৫০ টাকা',
    'কোন মালের স্টক কম?',
    'আজকের বিক্রি কত?',
    'ক্যাশ ড্রয়ারে কত আছে?',
    'সবচেয়ে বেশি বাকি কার কাছে?',
    'দোকান বন্ধ করো (ডে-এন্ড)',
    'সারাদিনের হিসাব কি?',
    'বাকি খাতা খোলো',
    'POS টার্মিনাল যাও',
    'ইনভেন্টরি দেখাও'
  ];

  return (
    <>
      {/* Floating Action Trigger Button (Movable / Draggable anywhere on screen) */}
      <button
        ref={dragRef}
        type="button"
        className="global-voice-floating-btn"
        {...dragBind}
        onClick={() => {
          if (hasMoved) return;
          setIsOpen(true);
        }}
        style={{
          ...dragStyle,
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
          zIndex: 9990
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
                      resetPosition();
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
