import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X, CheckCircle2, ArrowUpCircle } from 'lucide-react';

export const AutoUpdateToast = ({ lang = 'bn' }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Check existing registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });

    // Expose manual trigger to window for testing / manual checks
    window.__checkHisabKitabUpdate = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting) {
              setWaitingWorker(reg.waiting);
              setUpdateAvailable(true);
              return true;
            }
          }
        } catch (e) {
          console.debug('SW update check error:', e);
        }
      }
      return false;
    };

    return () => {
      delete window.__checkHisabKitabUpdate;
    };
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Tell waiting SW to activate
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }

      // 2. Clear browser cache storage
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }

      // 3. Unregister and reload
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error('Update reload failed:', err);
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-teal-500/40 p-4 animate-bounce-short">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
          <ArrowUpCircle className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-teal-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'নতুন আপডেট প্রস্তুত!' : 'New Update Available!'}
            </h4>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {lang === 'bn'
              ? 'হিসাব-কিতাব ৩৬০ এর দ্রুতগতির নতুন সংস্করণ পাওয়া গেছে। এক ক্লিকে ইনস্টল করুন।'
              : 'A newer version of HisabKitab 360 is available. Click update to install.'}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleApplyUpdate}
              disabled={isUpdating}
              className="flex-1 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'আপডেট হচ্ছে...' : 'এখনই আপডেট করুন'}</span>
            </button>

            <button
              onClick={() => setUpdateAvailable(false)}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
            >
              পরে
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
