// ========================================================
// HisabKitab 360 - Zero-Dependency Web Audio Feedback System
// Pure Web Audio API Synth: Ultra-Fast, 0ms Latency, 100% Offline
// Sound Profiles: supermarket | modern_soft | classic_bell | cyber_haptic | silent_haptic
// ========================================================

import { hapticFeedback } from './nativeAppService';

let audioCtx = null;
let isAudioMuted = localStorage.getItem('hk360_sound_muted') === 'true';
let activeSoundProfile = localStorage.getItem('hk360_sound_profile') || 'supermarket';
let activeSoundVolume = parseFloat(localStorage.getItem('hk360_sound_volume') || '0.7');

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const isSoundMuted = () => isAudioMuted;

export const toggleSoundMute = () => {
  isAudioMuted = !isAudioMuted;
  localStorage.setItem('hk360_sound_muted', String(isAudioMuted));
  return isAudioMuted;
};

export const getSoundProfile = () => activeSoundProfile;

export const setSoundProfile = (profile) => {
  activeSoundProfile = profile;
  localStorage.setItem('hk360_sound_profile', profile);
  return activeSoundProfile;
};

export const getSoundVolume = () => activeSoundVolume;

export const setSoundVolume = (volume) => {
  activeSoundVolume = Math.max(0, Math.min(1, volume));
  localStorage.setItem('hk360_sound_volume', String(activeSoundVolume));
  return activeSoundVolume;
};

// 1. Soft Pop Sound (Item added to cart, quantity change)
export const playCartPop = () => {
  hapticFeedback.light();
  if (isAudioMuted || activeSoundProfile === 'silent_haptic') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    const vol = (activeSoundProfile === 'modern_soft' ? 0.16 : 0.12) * activeSoundVolume;

    if (activeSoundProfile === 'classic_bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {}
};

// 2. Retail Barcode Scan Beep (Profile adapted)
export const playScanBeep = () => {
  hapticFeedback.medium();
  if (isAudioMuted || activeSoundProfile === 'silent_haptic') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const now = ctx.currentTime;
    const vol = 0.09 * activeSoundVolume;

    if (activeSoundProfile === 'modern_soft') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
    } else if (activeSoundProfile === 'classic_bell') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.06);
    } else {
      // Supermarket crisp square wave beep
      osc.type = 'square';
      osc.frequency.setValueAtTime(1760, now); // A6 high retail beep
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {}
};

// 3. Cheerful Success Chime (Sale checkout, print, invoice generation)
export const playSuccessChime = () => {
  hapticFeedback.success();
  if (isAudioMuted || activeSoundProfile === 'silent_haptic') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = 0.14 * activeSoundVolume;

    if (activeSoundProfile === 'classic_bell') {
      // Cash Register Vintage Cha-ching Ding
      [1046.5, 1567.98].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(vol * 1.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
      return;
    }

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  } catch {}
};

// 4. Subtle Tactile Button Click
export const playButtonClick = () => {
  hapticFeedback.selection();
  if (isAudioMuted || activeSoundProfile === 'silent_haptic') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.03);

    gain.gain.setValueAtTime(0.08 * activeSoundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {}
};

// 5. Warning Tone (Low Stock, Cash Shortage, Error)
export const playWarningTone = () => {
  hapticFeedback.warning();
  if (isAudioMuted || activeSoundProfile === 'silent_haptic') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.15);

    gain.gain.setValueAtTime(0.12 * activeSoundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {}
};

// 6. Sonar Radar Ping Sound (Live incoming supervisor collection ping)
export const playRadarPingSound = () => {
  hapticFeedback.light();
  if (isAudioMuted || activeSoundProfile === 'silent_haptic') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.15 * activeSoundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {}
};
