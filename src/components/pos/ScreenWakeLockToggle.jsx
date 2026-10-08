import React, { useState, useEffect } from 'react';
import { Sun, Moon, Zap } from 'lucide-react';
import { requestScreenWakeLock, releaseScreenWakeLock, hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick } from '../../services/soundFeedback';

export const ScreenWakeLockToggle = ({ lang = 'bn', showToast = () => {} }) => {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      setIsSupported(false);
    }
  }, []);

  const handleToggle = async () => {
    playButtonClick();
    hapticFeedback.light();

    if (!isActive) {
      const acquired = await requestScreenWakeLock();
      if (acquired) {
        setIsActive(true);
        showToast(
          lang === 'bn'
            ? '☀️ স্ক্রিন সর্বদা সজাগ রাখা হয়েছে (বিক্রয় চলাকালীন লক হবে না)'
            : 'Screen WakeLock active (Screen will stay on during sales)',
          'success'
        );
      } else {
        showToast(
          lang === 'bn'
            ? 'ডিভাইসে স্ক্রিন ওয়েক-লক সমর্থন করে না'
            : 'WakeLock not supported on this device',
          'warning'
        );
      }
    } else {
      await releaseScreenWakeLock();
      setIsActive(false);
      showToast(
        lang === 'bn'
          ? '🌙 সাধারণ স্ক্রিন টাইমআউট সক্রিয়'
          : 'Normal screen sleep restored',
        'info'
      );
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      style={{
        padding: '5px 8px',
        borderRadius: '8px',
        border: isActive ? '1px solid #f59e0b' : '1px solid var(--border-color)',
        background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
        color: isActive ? '#f59e0b' : 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.72rem',
        fontWeight: '800',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      title={
        isActive
          ? (lang === 'bn' ? 'স্ক্রিন সদা জাগ্রত আছে (ক্লিক করে বন্ধ করুন)' : 'Screen is kept awake')
          : (lang === 'bn' ? 'স্ক্রিন সদা জাগ্রত রাখুন' : 'Keep screen awake')
      }
    >
      <Sun size={13} style={{ transform: isActive ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }} />
      <span>{isActive ? (lang === 'bn' ? 'স্ক্রিন অন' : 'Awake') : (lang === 'bn' ? 'সজাগ' : 'Wake')}</span>
    </button>
  );
};
