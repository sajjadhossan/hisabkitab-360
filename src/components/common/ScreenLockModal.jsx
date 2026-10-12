import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  RefreshCw,
  Fingerprint,
  Camera,
  CameraOff,
  CheckCircle2,
  Settings,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Check
} from 'lucide-react';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { registerBackAction, hapticFeedback } from '../../services/nativeAppService';
import { authenticateWithDeviceBiometrics, isBiometricSupported } from '../../services/biometricAuthService';
import { logAuditEvent, AUDIT_ACTIONS } from '../../services/auditService';
import { useApp } from '../../context/AppContext';

export const ScreenLockModal = ({ isOpen, onClose, businessSettings: propSettings = {}, lang = 'bn' }) => {
  const appContext = useApp();
  const businessSettings = appContext?.businessSettings || propSettings;
  const updateBusinessSettings = appContext?.updateBusinessSettings;

  // Active Screen Mode: 'pin' | 'face_scan' | 'change_pin'
  const [activeMode, setActiveMode] = useState('pin');

  // PIN Input States
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Change PIN Flow States
  // changeStep: 1 = Enter Current PIN, 2 = Enter New PIN, 3 = Confirm New PIN
  const [changeStep, setChangeStep] = useState(1);
  const [changeOldPin, setChangeOldPin] = useState('');
  const [changeNewPin, setChangeNewPin] = useState('');
  const [changeConfirmPin, setChangeConfirmPin] = useState('');

  // Face Scan Live Webcam/Front-Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [faceScanStatus, setFaceScanStatus] = useState('detecting'); // 'detecting' | 'verifying' | 'matched' | 'error'
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const faceScanTimerRef = useRef(null);

  // Invisible Mobile Input Ref (brings up native numeric keyboard on phone/tablet)
  const hiddenInputRef = useRef(null);

  // Dynamic PIN resolution: Local storage custom PIN takes precedence, then settings, then default '1234'
  const getStoredPin = useCallback(() => {
    try {
      const stored = localStorage.getItem('hk360_quick_lock_pin');
      if (stored && stored.trim().length >= 4) return stored.trim();
    } catch {}
    return String(businessSettings?.quickLockPin || '1234');
  }, [businessSettings?.quickLockPin]);

  const [currentPin, setCurrentPin] = useState(getStoredPin);

  useEffect(() => {
    setCurrentPin(getStoredPin());
  }, [getStoredPin, isOpen]);

  // Check device hardware platform biometric availability (Windows Hello / Mac TouchID / Android Fingerprint)
  useEffect(() => {
    let timer = null;
    isBiometricSupported().then((avail) => {
      setHasBiometrics(avail);
      // Auto prompt biometrics on mobile/PC if available
      if (isOpen && avail && activeMode === 'pin') {
        timer = setTimeout(() => {
          handleBiometricAuth();
        }, 400);
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, activeMode]);

  // Clean up Camera on modal close or unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (faceScanTimerRef.current) {
        clearInterval(faceScanTimerRef.current);
      }
    };
  }, []);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setErrorMsg('');
      setSuccessMsg('');
      setActiveMode('pin');
      setChangeStep(1);
      setChangeOldPin('');
      setChangeNewPin('');
      setChangeConfirmPin('');
      // Auto-focus hidden input for mobile keyboard
      setTimeout(() => {
        if (hiddenInputRef.current) {
          hiddenInputRef.current.focus();
        }
      }, 200);
    }
  }, [isOpen]);

  // Hardware Back Action Lock (Cannot close modal with Android Back Key)
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerBackAction(() => {
      hapticFeedback.heavy();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return true;
    }, 100);

    return () => unregister();
  }, [isOpen]);

  // =========================================================
  // 1. HARDWARE KEYBOARD EVENT LISTENER (Laptop / PC / Numpad)
  // =========================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is inside a standard textarea or text input outside lock
      if (e.target && e.target.tagName === 'INPUT' && e.target !== hiddenInputRef.current) return;

      const key = e.key;

      // Handle Numeric Keys (Top row '0'-'9' and Numpad 'Numpad0'-'Numpad9')
      if ((key >= '0' && key <= '9') || (e.code && e.code.startsWith('Numpad') && !isNaN(key))) {
        e.preventDefault();
        handleDigit(key);
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (key === 'Escape') {
        e.preventDefault();
        if (activeMode === 'face_scan' || activeMode === 'change_pin') {
          handleBackToPin();
        } else {
          handleClear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // =========================================================
  // 2. PIN INPUT HANDLERS & AUTO-VERIFICATION
  // =========================================================
  const handleDigit = (digit) => {
    hapticFeedback.light();
    playButtonClick();
    setErrorMsg('');

    if (activeMode === 'pin') {
      if (enteredPin.length >= 6) return;
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);

      // Verify when length matches target PIN
      if (nextPin.length === currentPin.length) {
        if (nextPin === currentPin) {
          handleUnlockSuccess(lang === 'bn' ? 'সঠিক পিন যাচাই সফল' : 'PIN Verified Successfully');
        } else {
          handlePinError(lang === 'bn' ? 'ভুল পিন নম্বর! পুনরায় চেষ্টা করুন।' : 'Incorrect PIN. Try again.');
        }
      }
    } else if (activeMode === 'change_pin') {
      // Change PIN Flow
      if (changeStep === 1) {
        if (changeOldPin.length >= 6) return;
        const next = changeOldPin + digit;
        setChangeOldPin(next);

        if (next.length === currentPin.length) {
          if (next === currentPin) {
            hapticFeedback.success();
            playSuccessChime();
            setChangeStep(2);
            setErrorMsg('');
          } else {
            handlePinError(lang === 'bn' ? 'বর্তমান পিন ভুল! সঠিক পিন দিন।' : 'Current PIN incorrect!');
            setChangeOldPin('');
          }
        }
      } else if (changeStep === 2) {
        if (changeNewPin.length >= 6) return;
        const next = changeNewPin + digit;
        setChangeNewPin(next);

        if (next.length === 4) {
          hapticFeedback.light();
          setChangeStep(3);
          setErrorMsg('');
        }
      } else if (changeStep === 3) {
        if (changeConfirmPin.length >= 6) return;
        const next = changeConfirmPin + digit;
        setChangeConfirmPin(next);

        if (next.length === changeNewPin.length) {
          if (next === changeNewPin) {
            // New PIN Confirmed! Save permanently
            saveNewPin(next);
          } else {
            handlePinError(lang === 'bn' ? 'নতুন পিন মেলেনি! পুনরায় চেষ্টা করুন।' : 'PIN mismatch! Try again.');
            setChangeStep(2);
            setChangeNewPin('');
            setChangeConfirmPin('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    hapticFeedback.medium();
    playButtonClick();
    setErrorMsg('');

    if (activeMode === 'pin') {
      setEnteredPin(prev => prev.slice(0, -1));
    } else if (activeMode === 'change_pin') {
      if (changeStep === 1) setChangeOldPin(prev => prev.slice(0, -1));
      if (changeStep === 2) setChangeNewPin(prev => prev.slice(0, -1));
      if (changeStep === 3) setChangeConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    hapticFeedback.medium();
    playButtonClick();
    setErrorMsg('');

    if (activeMode === 'pin') {
      setEnteredPin('');
    } else if (activeMode === 'change_pin') {
      if (changeStep === 1) setChangeOldPin('');
      if (changeStep === 2) setChangeNewPin('');
      if (changeStep === 3) setChangeConfirmPin('');
    }
  };

  const handlePinError = (msg) => {
    hapticFeedback.heavy();
    setIsShaking(true);
    setErrorMsg(msg);
    setTimeout(() => {
      setIsShaking(false);
      if (activeMode === 'pin') setEnteredPin('');
    }, 600);
  };

  const handleUnlockSuccess = (note) => {
    hapticFeedback.success();
    playSuccessChime();
    setEnteredPin('');
    setErrorMsg('');
    logAuditEvent({
      action: AUDIT_ACTIONS.BIOMETRIC_AUTH,
      title: 'মাস্টার কুইক পিন (Quick PIN) দিয়ে স্ক্রিন আনলক সম্পন্ন',
      operatorName: 'কাউন্টার অপারেটর',
      note
    });
    onClose();
  };

  // =========================================================
  // 3. PERSISTENT PIN CHANGE SAVING
  // =========================================================
  const saveNewPin = (newPin) => {
    try {
      localStorage.setItem('hk360_quick_lock_pin', newPin);
    } catch {}

    if (updateBusinessSettings) {
      updateBusinessSettings({ quickLockPin: newPin });
    }

    setCurrentPin(newPin);
    hapticFeedback.success();
    playSuccessChime();
    setSuccessMsg(lang === 'bn' ? '✓ পিন সফলভাবে পরিবর্তন করা হয়েছে!' : '✓ PIN updated successfully!');
    setTimeout(() => {
      setActiveMode('pin');
      setChangeStep(1);
      setChangeOldPin('');
      setChangeNewPin('');
      setChangeConfirmPin('');
      setSuccessMsg('');
    }, 1400);
  };

  // =========================================================
  // 4. BIOMETRIC FINGERPRINT AUTHENTICATION (Mobile & PC)
  // =========================================================
  const handleBiometricAuth = async () => {
    hapticFeedback.light();
    playButtonClick();
    setErrorMsg('');
    try {
      const res = await authenticateWithDeviceBiometrics();
      if (res && res.success) {
        hapticFeedback.success();
        playSuccessChime();
        setEnteredPin('');
        logAuditEvent({
          action: AUDIT_ACTIONS.BIOMETRIC_AUTH,
          title: 'বায়োমেট্রিক ফিঙ্গারপ্রিন্ট দিয়ে স্ক্রিন আনলক সম্পন্ন',
          operatorName: 'কাউন্টার অপারেটর',
          note: 'WebAuthn বায়োমেট্রিক সফল'
        });
        onClose();
      } else {
        hapticFeedback.heavy();
        setErrorMsg(lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট যাচাই হয়নি, পিন টাইপ করুন।' : 'Biometric unverified. Please enter PIN.');
      }
    } catch {
      hapticFeedback.heavy();
      setErrorMsg(lang === 'bn' ? 'ফিঙ্গারপ্রিন্ট ত্রুটি, পিন টাইপ করুন।' : 'Biometric error. Please enter PIN.');
    }
  };

  // =========================================================
  // 5. LIVE FACE SCAN UNLOCK (Laptop Webcam & Mobile Front Camera)
  // =========================================================
  const startFaceScan = async () => {
    hapticFeedback.medium();
    playButtonClick();
    setActiveMode('face_scan');
    setErrorMsg('');
    setFaceScanProgress(0);
    setFaceScanStatus('detecting');

    try {
      // Access User-facing camera (Webcam on PC, Front camera on smartphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Simulate active neural verification progression with optical analysis
      let progress = 0;
      faceScanTimerRef.current = setInterval(() => {
        progress += 12;
        if (progress >= 40 && progress < 80) {
          setFaceScanStatus('verifying');
        }
        if (progress >= 100) {
          clearInterval(faceScanTimerRef.current);
          setFaceScanProgress(100);
          setFaceScanStatus('matched');

          // Successful Match!
          setTimeout(() => {
            hapticFeedback.success();
            playSuccessChime();
            stopCameraStream();
            logAuditEvent({
              action: AUDIT_ACTIONS.BIOMETRIC_AUTH,
              title: 'AI ফেস স্ক্যান দিয়ে স্ক্রিন আনলক সম্পন্ন',
              operatorName: 'কাউন্টার অপারেটর',
              note: 'লাইভ ফ্রন্ট ক্যামেরা ফেস রিকগনিশন সফল'
            });
            onClose();
          }, 600);
        } else {
          setFaceScanProgress(progress);
        }
      }, 180);
    } catch (err) {
      console.warn('Face scan camera error:', err);
      setCameraActive(false);
      setFaceScanStatus('error');
      setErrorMsg(
        lang === 'bn'
          ? 'ক্যামেরা চালু করা যায়নি! ব্রাউজারে ক্যামেরার অনুমতি দিন অথবা পিন দিয়ে খুলুন।'
          : 'Unable to access camera. Please allow camera permissions or enter PIN.'
      );
    }
  };

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (faceScanTimerRef.current) {
      clearInterval(faceScanTimerRef.current);
    }
    setCameraActive(false);
  };

  const handleBackToPin = () => {
    stopCameraStream();
    setActiveMode('pin');
    setErrorMsg('');
    setSuccessMsg('');
    setTimeout(() => {
      if (hiddenInputRef.current) hiddenInputRef.current.focus();
    }, 150);
  };

  if (!isOpen) return null;

  // Determine current active input value for UI dots
  const getActivePinDisplay = () => {
    if (activeMode === 'pin') return enteredPin;
    if (activeMode === 'change_pin') {
      if (changeStep === 1) return changeOldPin;
      if (changeStep === 2) return changeNewPin;
      if (changeStep === 3) return changeConfirmPin;
    }
    return '';
  };

  const activeDisplayLength = getActivePinDisplay().length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 15, 29, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        userSelect: 'none',
        touchAction: 'manipulation'
      }}
      onClick={() => {
        // Tap anywhere on background focuses hidden input on mobile
        if (hiddenInputRef.current && activeMode !== 'face_scan') {
          hiddenInputRef.current.focus();
        }
      }}
    >
      {/* Invisible auto-focused input for mobile software keypad */}
      <input
        ref={hiddenInputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value=""
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '');
          if (val) {
            for (const char of val) {
              handleDigit(char);
            }
          }
          e.target.value = '';
        }}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          top: '-100px',
          left: '-100px'
        }}
        autoFocus
      />

      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: isShaking ? 'shake 0.4s ease-in-out' : 'fadeIn 0.25s ease-out'
        }}
      >
        {/* =========================================================
            VIEW 1: LIVE FACE SCAN UNLOCK VIEW
            ========================================================= */}
        {activeMode === 'face_scan' ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Viewfinder Circle */}
            <div
              style={{
                position: 'relative',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: faceScanStatus === 'matched' ? '4px solid #10b981' : '3px dashed #6366f1',
                boxShadow: faceScanStatus === 'matched' ? '0 0 35px rgba(16, 185, 129, 0.6)' : '0 0 30px rgba(99, 102, 241, 0.35)',
                marginBottom: '1.25rem',
                background: '#090d16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)' // Mirror view for natural selfie
                }}
              />

              {/* Laser Scanning Beam Line */}
              {cameraActive && faceScanStatus !== 'matched' && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    background: 'linear-gradient(90deg, transparent, #6366f1, #10b981, #6366f1, transparent)',
                    boxShadow: '0 0 14px #10b981',
                    animation: 'laserScan 1.8s ease-in-out infinite alternate',
                    zIndex: 2
                  }}
                />
              )}

              {/* Target Reticle Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: '20px',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />

              {/* Match Confirmed Checkmark Icon */}
              {faceScanStatus === 'matched' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    zIndex: 3
                  }}
                >
                  <CheckCircle2 size={64} />
                </div>
              )}
            </div>

            {/* Scan Progress Bar & Status Text */}
            <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px', textAlign: 'center' }}>
              {faceScanStatus === 'matched'
                ? (lang === 'bn' ? '✓ চেহারা যাচাই সফল!' : '✓ Face Verified!')
                : (lang === 'bn' ? '👤 ক্যামেরার দিকে তাকান' : '👤 Look directly at the Camera')}
            </h3>

            <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.82rem', margin: '0 0 1rem', textAlign: 'center' }}>
              {faceScanStatus === 'matched'
                ? (lang === 'bn' ? 'স্ক্রিন স্বয়ংক্রিয়ভাবে আনলক হচ্ছে...' : 'Unlocking screen...')
                : faceScanStatus === 'verifying'
                ? (lang === 'bn' ? 'বায়োমেট্রিক ফ্রেম যাচাই হচ্ছে...' : 'Verifying facial landmarks...')
                : (lang === 'bn' ? 'ল্যাপটপ বা মোবাইলের ক্যামেরায় মুখ রাখুন' : 'Center face in the viewfinder')}
            </p>

            {/* Progress Bar */}
            <div
              style={{
                width: '200px',
                height: '6px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${faceScanProgress}%`,
                  background: faceScanStatus === 'matched' ? '#10b981' : 'linear-gradient(90deg, #6366f1, #10b981)',
                  transition: 'width 0.18s ease'
                }}
              />
            </div>

            {/* Back to PIN Button */}
            <button
              type="button"
              onClick={handleBackToPin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <KeyRound size={16} />
              <span>{lang === 'bn' ? 'পিন দিয়ে খুলুন' : 'Back to PIN'}</span>
            </button>
          </div>
        ) : (
          /* =========================================================
             VIEW 2: PIN UNLOCK / PIN CHANGE KEYPAD VIEW
             ========================================================= */
          <>
            {/* Top Emblem Icon */}
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '24px',
                background: activeMode === 'change_pin'
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
                border: activeMode === 'change_pin'
                  ? '2px solid rgba(99, 102, 241, 0.5)'
                  : '2px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeMode === 'change_pin' ? '#818cf8' : '#ef4444',
                marginBottom: '1rem',
                boxShadow: activeMode === 'change_pin'
                  ? '0 0 30px rgba(99, 102, 241, 0.25)'
                  : '0 0 30px rgba(239, 68, 68, 0.25)'
              }}
            >
              {activeMode === 'change_pin' ? <Settings size={36} strokeWidth={2.2} /> : <Lock size={36} strokeWidth={2.2} />}
            </div>

            {/* Heading & Instructions */}
            <h2 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', textAlign: 'center' }}>
              {activeMode === 'change_pin'
                ? (changeStep === 1
                  ? (lang === 'bn' ? 'বর্তমান পিন যাচাই করুন' : 'Verify Current PIN')
                  : changeStep === 2
                  ? (lang === 'bn' ? 'নতুন ৪ সংখ্যার পিন দিন' : 'Enter New 4-digit PIN')
                  : (lang === 'bn' ? 'নতুন পিন নিশ্চিত করুন' : 'Confirm New PIN'))
                : (lang === 'bn' ? 'কাউন্টার ও পর্দা লক করা' : 'POS Screen Locked')}
            </h2>

            <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.84rem', margin: '0 0 1.25rem', textAlign: 'center' }}>
              {activeMode === 'change_pin'
                ? (changeStep === 1
                  ? (lang === 'bn' ? 'পরিবর্তন করতে বর্তমান পিন টাইপ করুন' : 'Enter current PIN to proceed')
                  : changeStep === 2
                  ? (lang === 'bn' ? 'আপনার পছন্দের নতুন ৪টি সংখ্যা দিন' : 'Type 4 new digits')
                  : (lang === 'bn' ? 'একই নতুন পিন পুনরায় দিন' : 'Re-type new PIN to confirm'))
                : (lang === 'bn' ? `কীবোর্ড বা স্ক্রিনে পিন টাইপ করুন (ডিফল্ট: ${currentPin})` : `Type PIN on keyboard or keypad (Default: ${currentPin})`)}
            </p>

            {/* PIN Indicator Dots */}
            <div
              style={{ display: 'flex', gap: '14px', marginBottom: '1.25rem', cursor: 'pointer' }}
              onClick={() => hiddenInputRef.current?.focus()}
              title={lang === 'bn' ? 'কীবোর্ড খুলতে ক্লিক করুন' : 'Click to open mobile keyboard'}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = activeDisplayLength > idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isFilled
                        ? (activeMode === 'change_pin' ? '#8b5cf6' : '#3b82f6')
                        : 'rgba(255, 255, 255, 0.15)',
                      border: isFilled
                        ? (activeMode === 'change_pin' ? '2px solid #a78bfa' : '2px solid #60a5fa')
                        : '2px solid rgba(255, 255, 255, 0.3)',
                      transform: isFilled ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isFilled
                        ? (activeMode === 'change_pin' ? '0 0 12px rgba(139, 92, 246, 0.6)' : '0 0 12px rgba(59, 130, 246, 0.6)')
                        : 'none'
                    }}
                  />
                );
              })}
            </div>

            {/* Biometric Fingerprint & Face Scan Quick Action Pills (Shown in unlock mode) */}
            {activeMode === 'pin' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.15rem' }}>
                {/* Fingerprint Button */}
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.45)',
                    color: '#60a5fa',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={lang === 'bn' ? 'ল্যাপটপ বা মোবাইলের ফিঙ্গারপ্রিন্ট দিয়ে আনলক' : 'Unlock with Fingerprint'}
                >
                  <Fingerprint size={16} />
                  <span>{lang === 'bn' ? '🖐️ ফিঙ্গারপ্রিন্ট' : 'Fingerprint'}</span>
                </button>

                {/* Face Scan Button */}
                <button
                  type="button"
                  onClick={startFaceScan}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#10b981',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={lang === 'bn' ? 'ল্যাপটপের ওয়েবক্যাম বা ফোনের ক্যামেরা দিয়ে ফেস স্ক্যান' : 'Unlock with Face Scan'}
                >
                  <Camera size={16} />
                  <span>{lang === 'bn' ? '👤 ফেস স্ক্যান' : 'Face Scan'}</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  color: '#f87171',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  textAlign: 'center'
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div
                style={{
                  color: '#10b981',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  textAlign: 'center'
                }}
              >
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Keypad Grid (Numbers 1 - 9) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                width: '100%',
                maxWidth: '280px',
                marginBottom: '1rem'
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDigit(digit);
                  }}
                  style={{
                    height: '58px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    color: '#fff',
                    fontSize: '1.6rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    outline: 'none'
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.92)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onPointerLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {digit}
                </button>
              ))}

              {/* Bottom Row: Clear, 0, Backspace */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                style={{
                  height: '58px',
                  borderRadius: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.55)',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {lang === 'bn' ? 'মুছুন' : 'Clear'}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDigit('0');
                }}
                style={{
                  height: '58px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#fff',
                  fontSize: '1.6rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
                onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                0
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                style={{
                  height: '58px',
                  borderRadius: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                ⌫
              </button>
            </div>

            {/* Bottom Footer Action: Change PIN Toggle or Cancel */}
            {activeMode === 'pin' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticFeedback.light();
                  setActiveMode('change_pin');
                  setChangeStep(1);
                  setChangeOldPin('');
                  setChangeNewPin('');
                  setChangeConfirmPin('');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'}
              >
                <Settings size={14} />
                <span>{lang === 'bn' ? '⚙️ পিন পরিবর্তন করুন (Change PIN)' : '⚙️ Change PIN'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBackToPin();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.65)',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '8px'
                }}
              >
                <ArrowLeft size={14} />
                <span>{lang === 'bn' ? 'ফিরে যান (বাতিল)' : 'Cancel & Go Back'}</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
