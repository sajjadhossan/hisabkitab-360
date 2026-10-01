import React, { useState, useRef } from 'react';
import { Mic, MicOff, Sparkles, CheckCircle2, Radio } from 'lucide-react';
import {
  parseBengaliExpenseVoice,
  parseBengaliProductVoice,
  parseBengaliDebtVoice,
  parseBengaliCustomerVoice,
  parseBengaliShoppingListVoice,
  startUniversalSpeechListener
} from '../../services/voiceAssistantService';
import { speakVoiceConfirmation } from '../../services/voiceBillingService';

export const SmartVoiceFormBanner = ({
  mode = 'expense', // 'expense' | 'biz_expense' | 'product' | 'debt' | 'customer' | 'shopping_list'
  onParsed,
  extraData = null,
  lang = 'bn'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [lastParsed, setLastParsed] = useState(null);
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    setTranscript('');
    setInterim('');
    setLastParsed(null);

    const recognition = startUniversalSpeechListener({
      lang: 'bn-BD',
      continuous: false,
      onInterim: (txt) => setInterim(txt),
      onResult: (finalText) => {
        setIsListening(false);
        setTranscript(finalText);
        setInterim('');
        handleProcessVoice(finalText);
      },
      onError: (err) => {
        console.warn('Voice recognition error:', err);
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

  const handleProcessVoice = (sentence) => {
    if (!sentence || !sentence.trim()) return;

    if (mode === 'product') {
      const parsed = parseBengaliProductVoice(sentence);
      if (parsed) {
        setLastParsed(parsed);
        if (onParsed) onParsed(parsed);
        speakVoiceConfirmation(`${parsed.name} পণ্যের তথ্য পূরণ করা হয়েছে।`, lang);
      }
    } else if (mode === 'debt') {
      const parsed = parseBengaliDebtVoice(sentence, extraData?.debtList || []);
      if (parsed) {
        setLastParsed(parsed);
        if (onParsed) onParsed(parsed);
        const amtStr = parsed.amount ? `${parsed.amount} টাকা ` : '';
        speakVoiceConfirmation(`${parsed.personName} এর ${amtStr}বাকি তথ্য পাওয়া গেছে।`, lang);
      }
    } else if (mode === 'customer') {
      const parsed = parseBengaliCustomerVoice(sentence);
      if (parsed) {
        setLastParsed(parsed);
        if (onParsed) onParsed(parsed);
        speakVoiceConfirmation(`${parsed.name} কাস্টমারের তথ্য পূরণ করা হয়েছে।`, lang);
      }
    } else if (mode === 'shopping_list') {
      const items = parseBengaliShoppingListVoice(sentence);
      if (items && items.length > 0) {
        setLastParsed({ itemsCount: items.length, summary: items.map(i => i.name).join(', ') });
        if (onParsed) onParsed(items);
        speakVoiceConfirmation(`${items.length}টি বাজার সামগ্রী ফর্দে যুক্ত হয়েছে।`, lang);
      }
    } else {
      // expense or biz_expense
      const parsed = parseBengaliExpenseVoice(sentence);
      if (parsed) {
        setLastParsed(parsed);
        if (onParsed) onParsed(parsed);
        const amtStr = parsed.amount ? `${parsed.amount} টাকা ` : '';
        speakVoiceConfirmation(`${parsed.title} ${amtStr}খরচের ঘরে বসানো হয়েছে।`, lang);
      }
    }
  };

  const handlePresetClick = (presetSentence) => {
    setTranscript(presetSentence);
    setInterim('');
    handleProcessVoice(presetSentence);
  };

  if (!isSupported) return null;

  // Title & hints by mode
  const getHeaderInfo = () => {
    switch (mode) {
      case 'product':
        return {
          title: '🎙️ ভয়েসে পণ্য পূরণ (Smart Voice Product)',
          hint: 'মুখে বলুন: "প্রাণ সরিষার তেল ৫০০ মিলি কেনা ১১০ বিক্রয় ১৩০ স্টক ৩০ বোতল"',
          samples: [
            'প্রাণ সরিষার তেল ৫০০ মিলি কেনা ১১০ বিক্রয় ১৩০ স্টক ৩০ বোতল',
            'তীর আটা ২ কেজি কেনা ১০০ বিক্রয় ১২০ স্টক ৫০ প্যাকেট',
            'লাক্স সাবান কেনা ৫০ বিক্রয় ৬৫ স্টক ৮০ পিস'
          ]
        };
      case 'debt':
        return {
          title: '🎙️ মুখে বলে বাকি এন্ট্রি (Smart Voice Debt)',
          hint: 'মুখে বলুন: "রহিম ভাইয়ের বকেয়া থেকে ৫০০ টাকা জমা নিলাম" বা "করিম সাহেবের নতুন বাকি ৩৫০ টাকা"',
          samples: [
            'রহিম ভাইয়ের বকেয়া থেকে ৫০০ টাকা জমা নিলাম',
            'করিম সাহেবের নতুন বাকি ৩৫০ টাকা',
            'সাপ্লায়ার মোশাররফ ভাইকে ৫০০০ টাকা পরিশোধ করলাম'
          ]
        };
      case 'customer':
        return {
          title: '🎙️ মুখে বলে কাস্টমার যুক্ত (Voice CRM)',
          hint: 'মুখে বলুন: "নতুন কাস্টমার হাজী আব্দুল কাদের মোবাইল ০১৭১১২২৩৩৪৪ ঠিকানা চকবাজার"',
          samples: [
            'নতুন কাস্টমার হাজী আব্দুল কাদের মোবাইল ০১৭১১২২৩৩৪৪ ঠিকানা চকবাজার',
            'মোশাররফ হোসেন ফোন ০১৮১২৩৪৫৬৭৮ বাসা মিরপুর'
          ]
        };
      case 'shopping_list':
        return {
          title: '🎙️ মুখে বলে বাজারের ফর্দ (Voice Shopping List)',
          hint: 'মুখে বলুন: "২ কেজি আলু, ১ কেজি পেঁয়াজ আর ৫০০ গ্রাম রসুন"',
          samples: [
            '২ কেজি আলু, ১ কেজি পেঁয়াজ আর ৫০০ গ্রাম রসুন',
            '১ ডজন ডিম, ১ লিটার দুধ আর ২ প্যাকেট বিস্কুট'
          ]
        };
      case 'biz_expense':
        return {
          title: '🎙️ মুখে বলে ব্যবসা খরচ পূরণ (Voice Business Expense)',
          hint: 'মুখে বলুন: "দোকান ভাড়া দিলাম ৮০০০ টাকা ক্যাশ" বা "বিদ্যুৎ বিল ১২৫০ টাকা"',
          samples: [
            'দোকান ভাড়া দিলাম ৮০০০ টাকা ক্যাশ',
            'বিদ্যুৎ বিল দিলাম ১২৫০ টাকা',
            'কর্মচারীর বেতন দিলাম ৫০০০ টাকা'
          ]
        };
      default:
        return {
          title: '🎙️ মুখে বলে খরচ পূরণ (Smart Voice Expense)',
          hint: 'মুখে বলুন: "আজ বাজারে মাছ ও সবজি কিনলাম ৬৫০ টাকা" বা "রিকশা ভাড়া ৬০ টাকা"',
          samples: [
            'বাজারে মাছ ও তরকারি কিনলাম ৬৫০ টাকা',
            'রিকশা ভাড়া ৬০ টাকা দিলাম',
            'বিকাশে ৫০ টাকা মোবাইল রিচার্জ'
          ]
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(249, 115, 22, 0.08))',
        border: '1.5px solid rgba(249, 115, 22, 0.35)',
        borderRadius: '16px',
        padding: '12px 14px',
        marginBottom: '1rem',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.08)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isListening ? '#ef4444' : 'linear-gradient(135deg, #ef4444, #f97316)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
              animation: isListening ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            <Mic size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {headerInfo.title}
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: '800',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                  color: isListening ? '#ef4444' : '#ea580c'
                }}
              >
                {isListening ? 'শুনছি...' : 'অটো ফিল'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              {headerInfo.hint}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startListening}
          style={{
            background: isListening
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 2px 8px rgba(249, 115, 22, 0.3)'
          }}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          <span>{isListening ? 'বলা শেষ' : 'মাইকে বলুন'}</span>
        </button>
      </div>

      {/* Realtime Live Speech Feedback */}
      {(interim || transcript) && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: interim ? '#f59e0b' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Radio size={14} className={interim ? 'animate-pulse' : ''} style={{ color: '#f97316' }} />
          <span>🗣️ "{interim || transcript}"</span>
        </div>
      )}

      {/* Auto-filled Feedback Tags */}
      {lastParsed && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> ফর্মে তথ্য পাওয়া গেছে:
          </span>
          {lastParsed.personName && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontWeight: '700' }}>
              ব্যক্তি: {lastParsed.personName}
            </span>
          )}
          {lastParsed.title && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
              বিবরণ: {lastParsed.title}
            </span>
          )}
          {lastParsed.name && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
              নাম: {lastParsed.name}
            </span>
          )}
          {lastParsed.phone && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
              ফোন: {lastParsed.phone}
            </span>
          )}
          {lastParsed.amount && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: '700' }}>
              ৳{lastParsed.amount}
            </span>
          )}
          {lastParsed.costPrice && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: '700' }}>
              ক্রয়: ৳{lastParsed.costPrice}
            </span>
          )}
          {lastParsed.sellPrice && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
              বিক্রয়: ৳{lastParsed.sellPrice}
            </span>
          )}
          {lastParsed.stock && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', fontWeight: '700' }}>
              স্টক: {lastParsed.stock} {lastParsed.unit || ''}
            </span>
          )}
          {lastParsed.itemsCount && (
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
              আইটেম: {lastParsed.itemsCount}টি
            </span>
          )}
        </div>
      )}

      {/* 1-Click Quick Preset Chips */}
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-muted)' }}>
          নমুনা (ক্লিক করে টেস্ট করুন):
        </span>
        {headerInfo.samples.map((sample, sIdx) => (
          <button
            key={sIdx}
            type="button"
            onClick={() => handlePresetClick(sample)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.68rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            "{sample}"
          </button>
        ))}
      </div>
    </div>
  );
};
