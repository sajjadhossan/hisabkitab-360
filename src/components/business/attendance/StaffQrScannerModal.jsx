import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  ScanLine,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  User,
  Clock,
  ShieldCheck,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../../../context/AppContext';
import { playScanBeep } from '../../../services/soundFeedback';
import {
  saveAttendanceLog,
  getStoredAttendanceLogs,
  evaluateDailyShiftTimes,
  DEFAULT_OFFICE_SETTINGS
} from '../../../services/attendanceSecurityService';
import { generateQrDataUrl } from '../../../services/qrService';

export const StaffQrScannerModal = ({ isOpen, onClose, employees = [], onPunchSuccess }) => {
  const { lang, showToast, businessSettings } = useApp();

  const [activeTab, setActiveTab] = useState('scan_id'); // 'scan_id' (Camera scanner) | 'stand_qr' (Counter Stand QR)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [punchType, setPunchType] = useState('auto'); // 'auto' | 'check_in' | 'check_out'
  const [standQrDataUrl, setStandQrDataUrl] = useState('');

  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);
  const lastScanTimestampRef = useRef(0);

  // Generate Stand QR for Counter mode
  useEffect(() => {
    if (activeTab === 'stand_qr') {
      const standPayload = JSON.stringify({
        type: 'HK360_OFFICE_TERMINAL',
        company: businessSettings?.companyName || 'HisabKitab 360',
        terminalId: 'COUNTER-TERM-01',
        createdAt: new Date().toISOString()
      });
      generateQrDataUrl(standPayload, { width: 280, margin: 1 }).then(url => {
        if (url) setStandQrDataUrl(url);
      });
    }
  }, [activeTab, businessSettings]);

  // Clean stop camera
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (e) {
      console.warn('Error stopping QR scanner:', e);
    } finally {
      html5QrCodeRef.current = null;
      setCameraActive(false);
      isStartingRef.current = false;
    }
  };

  // Start Camera
  const startCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError(null);

    try {
      await stopCamera();

      const qrScanner = new Html5Qrcode('staff-attendance-qr-reader');
      html5QrCodeRef.current = qrScanner;

      const config = {
        fps: 15,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0
      };

      await qrScanner.start(
        { facingMode },
        config,
        (decodedText) => {
          handleQrCodeScanned(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
      isStartingRef.current = false;
    } catch (err) {
      console.warn('QR Camera start error:', err);
      setCameraError(lang === 'bn' ? 'ক্যামেরা চালু করা যায়নি। ক্যামেরার পারমিশন নিশ্চিত করুন।' : 'Camera access denied or unavailable.');
      setCameraActive(false);
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'scan_id') {
      setTimeout(startCamera, 300);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  // Process Scanned Code
  const handleQrCodeScanned = (decodedText) => {
    const now = Date.now();
    // Throttle duplicate scans within 2.5 seconds
    if (now - lastScanTimestampRef.current < 2500) {
      return;
    }
    lastScanTimestampRef.current = now;

    try {
      playScanBeep();
    } catch {}

    let empId = '';
    let parsed = null;

    try {
      parsed = JSON.parse(decodedText);
      empId = parsed.empId || parsed.id;
    } catch {
      // Plain text code
      empId = decodedText.trim();
    }

    // Match employee
    const matchedEmp = employees.find(e => String(e.id).toLowerCase() === String(empId).toLowerCase() || (parsed && e.name === parsed.name));

    if (!matchedEmp) {
      if (showToast) {
        showToast(lang === 'bn' ? '❌ অচেনা কিউআর কোড! কোনো কর্মীর সাথে মেলেনি।' : 'Unrecognized QR Code', 'error');
      }
      return;
    }

    // Determine check-in or check-out
    const todayStr = new Date().toISOString().split('T')[0];
    const existingLogs = getStoredAttendanceLogs();
    const todayLog = existingLogs.find(l => l.employeeId === matchedEmp.id && l.date === todayStr);

    let resolvedType = punchType;
    if (resolvedType === 'auto') {
      resolvedType = (!todayLog || !todayLog.checkInTime) ? 'check_in' : 'check_out';
    }

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const shiftEval = evaluateDailyShiftTimes(new Date(), DEFAULT_OFFICE_SETTINGS);

    const logPayload = {
      id: todayLog?.id || `att_${Date.now()}_${matchedEmp.id}`,
      employeeId: matchedEmp.id,
      employeeName: matchedEmp.name,
      role: matchedEmp.role || 'স্টাফ',
      section: matchedEmp.section || 'সেলস ও কাউন্টার',
      date: todayStr,
      status: shiftEval.isLate ? 'Late' : 'Present',
      verifiedBy: 'QR_ID_SCANNER',
      checkInTime: resolvedType === 'check_in' ? timeFormatted : (todayLog?.checkInTime || timeFormatted),
      checkOutTime: resolvedType === 'check_out' ? timeFormatted : (todayLog?.checkOutTime || null),
      isLate: shiftEval.isLate,
      lateMinutes: shiftEval.lateMinutes
    };

    saveAttendanceLog(logPayload);

    setLastScannedResult({
      employee: matchedEmp,
      type: resolvedType,
      time: timeFormatted,
      status: shiftEval.isLate ? 'Late' : 'Present',
      lateMinutes: shiftEval.lateMinutes
    });

    if (showToast) {
      showToast(
        lang === 'bn'
          ? `✅ ${matchedEmp.name} - ${resolvedType === 'check_in' ? 'ইন-টাইম' : 'আউট-টাইম'} রেকর্ড সম্পন্ন (${timeFormatted})`
          : `✅ Attendance logged for ${matchedEmp.name}`,
        'success'
      );
    }

    if (onPunchSuccess) {
      onPunchSuccess(logPayload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, padding: '10px' }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '540px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-main)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{lang === 'bn' ? 'কিউআর হাজিরা টার্মিনাল' : 'QR Attendance Terminal'}</span>
                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700' }}>
                  INSTANT BEEP
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'কর্মীর আইডি কার্ড স্ক্যান করে ১ সেকেন্ডে হাজিরা রেকর্ড' : 'Instant roll call via employee QR ID card'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('scan_id')}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderBottom: activeTab === 'scan_id' ? '3px solid #10b981' : '3px solid transparent',
              background: activeTab === 'scan_id' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              color: activeTab === 'scan_id' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Camera size={16} />
            <span>{lang === 'bn' ? 'কাউন্টার ক্যামেরা স্ক্যানার' : 'Camera Scanner'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stand_qr')}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderBottom: activeTab === 'stand_qr' ? '3px solid #6366f1' : '3px solid transparent',
              background: activeTab === 'stand_qr' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              color: activeTab === 'stand_qr' ? '#6366f1' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={16} />
            <span>{lang === 'bn' ? 'কাউন্টার স্ট্যান্ড কিউআর' : 'Counter Stand QR'}</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'scan_id' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Punch Mode Selection Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', justifyContent: 'center' }}>
              {[
                { key: 'auto', label: 'স্বয়ংক্রিয় (Auto Detect)' },
                { key: 'check_in', label: 'ইন-টাইম (Check-In)' },
                { key: 'check_out', label: 'আউট-টাইম (Check-Out)' }
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPunchType(m.key)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: punchType === m.key ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: punchType === m.key ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: punchType === m.key ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Camera Viewport */}
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                aspectRatio: '1',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#000',
                position: 'relative',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              <div id="staff-attendance-qr-reader" style={{ width: '100%', height: '100%' }}></div>

              {/* Scanning Crosshair Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    width: '210px',
                    height: '210px',
                    border: '2px solid rgba(16, 185, 129, 0.8)',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.45)',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '10%',
                      right: '10%',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                      boxShadow: '0 0 8px #10b981'
                    }}
                  />
                </div>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="ক্যামেরা পরিবর্তন"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {cameraError && (
              <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Last Scanned Employee Card */}
            {lastScannedResult && (
              <div
                className="animate-fade-in"
                style={{
                  marginTop: '14px',
                  width: '100%',
                  maxWidth: '360px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {lastScannedResult.employee.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
                    {lastScannedResult.type === 'check_in' ? 'ইন-টাইম সফল' : 'আউট-টাইম সফল'} • {lastScannedResult.time}
                  </div>
                  {lastScannedResult.status === 'Late' && (
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '700' }}>
                      ⚠️ {lastScannedResult.lateMinutes} মিনিট লেট
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Stand QR Code for Self-Service */}
        {activeTab === 'stand_qr' && (
          <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              {businessSettings?.companyName || 'হিসাব কিতাব ৩৬০'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {lang === 'bn' ? 'কাউন্টার টার্মিনাল কিউআর কোড (কর্মীরা স্ক্যান করে সেলফ চেক-ইন করবে)' : 'Official Terminal QR for employee self check-in'}
            </div>

            <div
              style={{
                padding: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '3px solid #6366f1',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.15)',
                marginBottom: '16px'
              }}
            >
              {standQrDataUrl ? (
                <img src={standQrDataUrl} alt="Counter Stand QR" style={{ width: '220px', height: '220px', display: 'block' }} />
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={56} color="#cbd5e1" />
                </div>
              )}
            </div>

            <div
              style={{
                maxWidth: '360px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                lineHeight: 1.5
              }}
            >
              💡 <strong>টিপস:</strong> এই কিউআর কোডটি দোকানের দেয়ালে বা ক্যাশ কাউন্টারে ডিসপ্লে হিসেবে লাগিয়ে রাখুন। কর্মীরা তাদের স্মার্টফোন দিয়ে স্ক্যান করলেই স্বয়ংক্রিয়ভাবে হাজিরা রেকর্ড হয়ে যাবে।
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffQrScannerModal;
