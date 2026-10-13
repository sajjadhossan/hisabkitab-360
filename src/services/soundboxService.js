/**
 * Smart Digital Voice Soundbox Service
 * -------------------------------------
 * Emulates modern digital merchant soundboxes (bKash / Nagad / Smart POS Soundbox).
 * Features:
 *  1. Crisp Web Audio API Chime (offline, zero latency, pleasant musical bell)
 *  2. Natural Bengali voice announcement for completed sales and debt collections
 *  3. User toggleable with soundbox setting
 */

const SOUNDBOX_STORAGE_KEY = 'hisabkitab_soundbox_enabled';

/**
 * Returns whether soundbox announcements are enabled
 */
export const isSoundboxEnabled = () => {
  try {
    const val = localStorage.getItem(SOUNDBOX_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

/**
 * Sets soundbox enabled state
 */
export const setSoundboxEnabled = (enabled) => {
  try {
    localStorage.setItem(SOUNDBOX_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
};

/**
 * Synthesizes a high-fidelity payment chime using Web Audio API
 */
export const playSoundboxChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Melodic notes for joyful payment confirmation (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.12 }, // C5
      { freq: 659.25, time: 0.1, dur: 0.12 }, // E5
      { freq: 783.99, time: 0.2, dur: 0.15 }, // G5
      { freq: 1046.50, time: 0.32, dur: 0.4 }  // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      // Volume envelope
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
};

/**
 * Speaks the soundbox voice announcement in Bengali
 */
export const speakSoundboxText = (text, delayMs = 600) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Detect best Bengali voice on Android
      const voices = window.speechSynthesis.getVoices() || [];
      const bengaliVoice = voices.find(v => v.lang === 'bn-BD' || v.lang === 'bn-IN' || v.lang?.startsWith('bn'))
        || voices.find(v => v.name?.toLowerCase().includes('bangla') || v.name?.toLowerCase().includes('bengali'));

      if (bengaliVoice) {
        utterance.voice = bengaliVoice;
        utterance.lang = bengaliVoice.lang;
      } else {
        utterance.lang = 'bn-BD';
      }

      utterance.rate = 1.0;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }, delayMs);
};

/**
 * Triggers complete smart soundbox announcement for transactions:
 * 
 * Examples:
 *  - bKash: "হিসাবকিতাব ৩৬০: বিকাশে ১,৫০০ টাকা সফলভাবে গ্রহণ করা হয়েছে।"
 *  - Cash: "হিসাবকিতাব ৩৬০: নগদ ৫০০ টাকা বিক্রয় সম্পন্ন হয়েছে।"
 *  - Due collection: "হিসাবকিতাব ৩৬০: রহিম ভাইয়ের কাছ থেকে ১,০০০ টাকা বকেয়া আদায় সফল হয়েছে।"
 */
export const triggerSoundboxPayment = ({
  amount = 0,
  method = 'cash', // 'cash' | 'bkash' | 'nagad' | 'card' | 'due'
  customerName = '',
  type = 'sale' // 'sale' | 'debt_collection' | 'expense'
}) => {
  if (!isSoundboxEnabled() || amount <= 0) return;

  // 1. Play musical chime
  playSoundboxChime();

  // 2. Generate natural spoken announcement
  const roundedAmt = Math.round(amount).toLocaleString('bn-BD');
  let speech = '';

  if (type === 'debt_collection') {
    const person = customerName ? `${customerName} এর কাছ থেকে ` : '';
    speech = `হিসাবকিতাব ৩৬০: ${person}${roundedAmt} টাকা বকেয়া আদায় সফল হয়েছে।`;
  } else {
    switch (method?.toLowerCase()) {
      case 'bkash':
      case 'বিকাশ':
        speech = `হিসাবকিতাব ৩৬০: বিকাশে ${roundedAmt} টাকা সফলভাবে গ্রহণ করা হয়েছে।`;
        break;
      case 'nagad':
      case 'নগদ (নগদ)':
      case 'নগদ ওয়ালেট':
        speech = `হিসাবকিতাব ৩৬০: নগদে ${roundedAmt} টাকা সফলভাবে গ্রহণ করা হয়েছে।`;
        break;
      case 'card':
      case 'কার্ড':
      case 'ব্যাংক':
        speech = `হিসাবকিতাব ৩৬০: কার্ডে ${roundedAmt} টাকা পরিশোধ সম্পন্ন হয়েছে।`;
        break;
      case 'due':
      case 'বাকি':
        speech = `হিসাবকিতাব ৩৬০: ${roundedAmt} টাকা বাকি মেমো হিসেবে সংরক্ষণ করা হয়েছে।`;
        break;
      default:
        speech = `হিসাবকিতাব ৩৬০: নগদ ${roundedAmt} টাকা বিক্রয় সম্পন্ন হয়েছে।`;
        break;
    }
  }

  // 3. Speak the voice announcement
  speakSoundboxText(speech, 600);
};

export const announceSalePayment = (amount, method = 'bkash') => {
  triggerSoundboxPayment({ amount, method });
};

export const soundboxService = {
  announceSalePayment,
  triggerSoundboxPayment,
  playSoundboxChime,
  isSoundboxEnabled,
  setSoundboxEnabled
};


