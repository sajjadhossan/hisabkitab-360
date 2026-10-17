/**
 * HisabKitab 360 - Sound & Audio Feedback Suite
 * Pure Web Audio API Synthesizer (0 KB assets, 100% offline, Zero external audio files)
 */
import { hapticFeedback } from './nativeAppService';

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
    try {
      const stored = localStorage.getItem('hk360_sound_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  toggleSound(forceState) {
    this.enabled = typeof forceState === 'boolean' ? forceState : !this.enabled;
    try {
      localStorage.setItem('hk360_sound_enabled', String(this.enabled));
    } catch {}
    return this.enabled;
  }

  isSoundEnabled() {
    return this.enabled;
  }

  /**
   * Crisp barcode scan beep (880 Hz, 60ms)
   */
  playBeep() {
    if (!this.enabled) return;
    try {
      hapticFeedback.light();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  }

  /**
   * Cash register / Payment success chime (Two ringing bells: 1200Hz -> 1800Hz)
   */
  playCashChime() {
    if (!this.enabled) return;
    try {
      hapticFeedback.success();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // First chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1174.66, now); // D6
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second high ringing bell
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.08); // A6
      gain2.gain.setValueAtTime(0.28, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.48);
    } catch {}
  }

  /**
   * Warm ascending triad success chime (C5 -> E5 -> G5)
   */
  playSuccessChime() {
    if (!this.enabled) return;
    try {
      hapticFeedback.medium();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.24);
      });
    } catch {}
  }

  /**
   * Gentle warning alert tone (440Hz -> 340Hz)
   */
  playWarningTone() {
    if (!this.enabled) return;
    try {
      hapticFeedback.warning();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  /**
   * Crisp delete blip (320Hz -> 180Hz)
   */
  playDeleteTone() {
    if (!this.enabled) return;
    try {
      hapticFeedback.light();
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }
}

export const soundService = new SoundService();
