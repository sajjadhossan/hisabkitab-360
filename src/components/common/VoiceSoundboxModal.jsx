import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  Sliders,
  Sparkles,
  ShieldCheck,
  X,
  Radio,
  Headphones,
  Check
} from 'lucide-react';
import {
  isSoundboxEnabled,
  setSoundboxEnabled,
  getSoundboxVolume,
  setSoundboxVolume,
  getAvailableVoices,
  getPreferredVoice,
  speakText,
  announceDepositSoundbox
} from '../../services/voiceSoundboxService';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick } from '../../services/soundFeedback';

export default function VoiceSoundboxModal({
  isOpen,
  onClose,
  currentSamity = {},
  showToast = () => {}
}) {
  const [isEnabled, setIsEnabled] = useState(isSoundboxEnabled());
  const [volume, setVolume] = useState(getSoundboxVolume());
  const [voices, setVoices] = useState([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsEnabled(isSoundboxEnabled());
      setVolume(getSoundboxVolume());
      
      const vList = getAvailableVoices();
      setVoices(vList);

      const pref = getPreferredVoice();
      if (pref) {
        setSelectedVoiceUri(pref.voiceURI);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = () => {
    playButtonClick?.();
    hapticFeedback.light();
    const nextVal = !isEnabled;
    setIsEnabled(nextVal);
    setSoundboxEnabled(nextVal);
    showToast(nextVal ? 'সাউন্ডবক্স ই-ভয়েস অ্যালার্ট সক্রিয় হয়েছে!' : 'সাউন্ডবক্স মিউট করা হয়েছে।', 'info');
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setSoundboxVolume(val);
  };

  const handleTestDepositVoice = async () => {
    playButtonClick?.();
    hapticFeedback.medium();
    setIsSpeakingTest(true);

    try {
      const sampleDeposit = {
        memberName: 'মোঃ সাজ্জাদ হোসেন',
        amount: 5000,
        type: 'মাসিক সঞ্চয়'
      };
      announceDepositSoundbox(sampleDeposit, currentSamity);
      showToast('🔊 সাউন্ডবক্স টেস্ট ঘোষণা বাজছে...', 'success');
    } catch {
      showToast('ভয়েস প্লেব্যাক ব্যর্থ হয়েছে', 'error');
    } finally {
      setTimeout(() => setIsSpeakingTest(false), 2500);
    }
  };

  const handleTestCustomSpeech = async () => {
    playButtonClick?.();
    hapticFeedback.medium();
    setIsSpeakingTest(true);
    try {
      await speakText(`সমিতি ৩৬০ সিস্টেম রেডি। কাউন্টার সাউন্ডবক্স ও রিয়েল-টাইম ক্রস-অ্যাপ ব্যাকআপ সম্পূর্ণ সচল রয়েছে।`);
      showToast('ভয়েস সফলভাবে সম্পন্ন হয়েছে!', 'success');
    } catch {
      showToast('ভয়েস এরর', 'error');
    } finally {
      setTimeout(() => setIsSpeakingTest(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                  স্মার্ট ই-ভয়েস সাউন্ডবক্স (Soundbox)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Bkash / Nagad স্টাইল
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                টাকা জমা বা কিস্তি আদায় হওয়ামাত্র স্বয়ংক্রিয় স্পষ্ট বাংলায় অডিও ঘোষণা
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Main Master Switch Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {isEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                সাউন্ডবক্স ভয়েস অ্যালার্ট {isEnabled ? 'চালু আছে' : 'বন্ধ আছে'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                মাঠকর্মী বা কাউন্টারে লেনদেন হওয়ামাত্র স্পিকারে ঘোষণা হবে
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-500" />
                সাউন্ডবক্স ভলিউম:
              </span>
              <span className="font-mono text-purple-600 dark:text-purple-400">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {/* Soundbox Test Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              টেস্ট সাউন্ড ও ঘোষণা শুনুন:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleTestDepositVoice}
                disabled={isSpeakingTest}
                className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-purple-600" />
                জমা কালেকশন টেস্ট (৳৫,০০০)
              </button>

              <button
                type="button"
                onClick={handleTestCustomSpeech}
                disabled={isSpeakingTest}
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                সিস্টেম রেডি ঘোষণা
              </button>
            </div>
          </div>

          {/* Counter Soundbox Mode Explanation */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              কাউন্টার অটো-অ্যানাউন্সার ও ক্রস-অ্যাপ মেশ টেকনোলজি
            </div>
            <p className="text-[11px] text-blue-800/90 dark:text-blue-300/80 leading-relaxed">
              অফিসের কম্পিউটারে বা কাউন্টারের ট্যাবে সমিতি ৩৬০ ওপেন থাকলে, কোনো মাঠকর্মী বাইরে গ্রামে কিস্তি নেওয়ার সাথে সাথে <strong className="font-semibold text-blue-900 dark:text-white">BroadcastChannel মেশের মাধ্যমে কাউন্টারের পিসির স্পিকারে স্বয়ংক্রিয়ভাবে বাংলায় ঘোষণা বেজে উঠবে</strong>!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            স্ট্যাটাস: <strong className={isEnabled ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>{isEnabled ? 'অডিও সাউন্ডবক্স লাইভ' : 'মিউটেড'}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 transition-all"
          >
            সম্পন্ন
          </button>
        </div>

      </div>
    </div>
  );
}
