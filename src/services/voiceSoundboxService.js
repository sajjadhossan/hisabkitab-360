/**
 * Somiti 360 - Smart E-Voice Soundbox & Audio Announcement Engine
 * -----------------------------------------------------------------
 * Instant bilingual & Bengali speech synthesis announcement system
 * inspired by Bkash / Nagad / Paytm Soundbox hardware.
 * 
 * Capabilities:
 * 1. Web Audio API Two-Tone Payment Ding Chime (Ding-Dong ~1200Hz -> 1600Hz)
 * 2. Native Web Speech Synthesis with automatic 'bn-BD' / 'bn-IN' voice detection
 * 3. Cross-Tab & Cross-App Real-Time Soundbox Mesh via BroadcastChannel
 * 4. Offline resilient: Works 100% without active internet
 */

import { playSuccessChime } from './soundFeedback';

const SOUNDBOX_ENABLED_KEY = 'somiti360_soundbox_enabled';
const SOUNDBOX_VOLUME_KEY = 'somiti360_soundbox_volume';
const SOUNDBOX_VOICE_URI_KEY = 'somiti360_soundbox_voice_uri';
const BROADCAST_CHANNEL_NAME = 'somiti_soundbox_mesh';

let broadcastChannel = null;
let isBroadcastingInitialized = false;

/**
 * Checks if E-Voice Soundbox is turned ON
 */
export function isSoundboxEnabled() {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem(SOUNDBOX_ENABLED_KEY);
  return val === null ? true : val === 'true'; // Default to enabled
}

/**
 * Toggles E-Voice Soundbox ON / OFF
 */
export function setSoundboxEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUNDBOX_ENABLED_KEY, String(Boolean(enabled)));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('somiti_soundbox_toggled', { detail: { enabled } }));
  }
}

/**
 * Gets Soundbox Volume (0.0 to 1.0)
 */
export function getSoundboxVolume() {
  if (typeof window === 'undefined') return 1.0;
  const val = parseFloat(localStorage.getItem(SOUNDBOX_VOLUME_KEY) || '1.0');
  return isNaN(val) ? 1.0 : Math.max(0, Math.min(1, val));
}

/**
 * Sets Soundbox Volume
 */
export function setSoundboxVolume(vol) {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, parseFloat(vol) || 1.0));
  localStorage.setItem(SOUNDBOX_VOLUME_KEY, String(clamped));
}

/**
 * Get Available System Voices
 */
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  return voices;
}

/**
 * Finds best available Bengali or bilingual voice
 */
export function getPreferredVoice() {
  const voices = getAvailableVoices();
  const savedUri = typeof window !== 'undefined' ? localStorage.getItem(SOUNDBOX_VOICE_URI_KEY) : null;

  if (savedUri) {
    const matched = voices.find(v => v.voiceURI === savedUri);
    if (matched) return matched;
  }

  // 1. Look for bn-BD or bn-IN voice
  const bnVoice = voices.find(v => v.lang === 'bn-BD' || v.lang === 'bn-IN' || v.lang?.startsWith('bn'));
  if (bnVoice) return bnVoice;

  // 2. Look for Google Bangla or Microsoft Bangla
  const bnNamed = voices.find(v => v.name?.toLowerCase().includes('bangla') || v.name?.toLowerCase().includes('bengali'));
  if (bnNamed) return bnNamed;

  // 3. Fallback to default or English Indian voice
  const indVoice = voices.find(v => v.lang === 'en-IN');
  if (indVoice) return indVoice;

  return voices[0] || null;
}

/**
 * Synthesizes payment ding chime (Ding-Dong sound like physical soundbox)
 */
export function playSoundboxDing() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const vol = getSoundboxVolume();

    // Tone 1: High crisp ding (1046.5 Hz - C6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.3 * vol, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Warm confirmation dong (1318.5 Hz - E6) after 150ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.15);
    gain2.gain.setValueAtTime(0.35 * vol, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.debug('[Soundbox] Web Audio tone fallback:', err);
  }
}

/**
 * Speaks text using Web Speech Synthesis API
 */
export function speakText(text, options = {}) {
  if (!isSoundboxEnabled()) return Promise.resolve(false);
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = getSoundboxVolume();
      utterance.rate = options.rate || 0.95; // Slightly slower for crisp clarity
      utterance.pitch = options.pitch || 1.0;

      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'bn-BD';
      } else {
        utterance.lang = 'bn-BD';
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.debug('[Soundbox] Speech error:', e);
        resolve(false);
      };

      // Play chime first, then speak
      playSoundboxDing();
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          resolve(false);
        }
      }, 350);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Announces a Deposit received (Bkash / Nagad Soundbox style)
 */
export function announceDepositSoundbox(deposit, samityInfo = {}, options = {}) {
  if (!isSoundboxEnabled() || !deposit) return;

  const samityName = samityInfo.nameBn || samityInfo.name || 'সমিতি ৩৬০';
  const memberName = deposit.memberName || deposit.depositorName || 'সম্মানিত সদস্য';
  const amount = Number(deposit.amount || 0).toLocaleString('bn-BD');
  const type = deposit.type || 'সঞ্চয় জমা';

  // Crisp Bengali Soundbox Announcement Text
  const announcementText = `${samityName}। সদস্য ${memberName} থেকে ${amount} টাকা ${type} সফলভাবে জমা হয়েছে।`;

  // 1. Speak on this local device
  speakText(announcementText);

  // 2. Broadcast across tabs and devices if enabled
  if (!options.isIncomingBroadcast) {
    broadcastSoundboxEvent({
      action: 'DEPOSIT_COLLECTED',
      text: announcementText,
      amount: deposit.amount,
      memberName,
      samityName,
      timestamp: Date.now()
    });
  }
}

/**
 * Announces an Expense / Voucher approved
 */
export function announceExpenseSoundbox(expense, samityInfo = {}, options = {}) {
  if (!isSoundboxEnabled() || !expense) return;

  const samityName = samityInfo.nameBn || samityInfo.name || 'সমিতি ৩৬০';
  const category = expense.category || expense.categoryBn || 'অফিস খরচ';
  const amount = Number(expense.amount || 0).toLocaleString('bn-BD');

  const announcementText = `${samityName}। ${category} বাবদ ${amount} টাকা খরচ পরিশোধ অনুমোদিত হয়েছে।`;

  speakText(announcementText);

  if (!options.isIncomingBroadcast) {
    broadcastSoundboxEvent({
      action: 'EXPENSE_APPROVED',
      text: announcementText,
      amount: expense.amount,
      category,
      samityName,
      timestamp: Date.now()
    });
  }
}

/**
 * Broadcast Soundbox event to other open tabs / peer apps
 */
export function broadcastSoundboxEvent(eventData) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      if (!broadcastChannel) {
        broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      }
      broadcastChannel.postMessage(eventData);
    }
  } catch (err) {
    console.debug('[Soundbox] BroadcastChannel send error:', err);
  }
}

/**
 * Initializes Soundbox Mesh listener for incoming cross-app announcements
 */
export function initSoundboxBroadcastListener() {
  if (typeof window === 'undefined' || isBroadcastingInitialized) return;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      if (!broadcastChannel) {
        broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      }
      broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (data && data.text && isSoundboxEnabled()) {
          // Speak incoming peer transaction on this device
          speakText(data.text, { isIncomingBroadcast: true });
        }
      };
      isBroadcastingInitialized = true;
    }
  } catch (err) {
    console.debug('[Soundbox] Broadcast listener error:', err);
  }
}
