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
  Sparkles,
  MapPin,
  Sliders,
  Check,
  Zap
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../../../context/AppContext';
import { playScanBeep } from '../../../services/soundFeedback';
import {
  saveAttendanceLog,
  getStoredAttendanceLogs,
  evaluateDailyShiftTimes,
  getOfficeGeoSettings,
  saveOfficeGeoSettings,
  calculateHaversineDistance,
  getVerifiedLocation,
  generateDynamicOfficeToken,
  verifyDynamicOfficeToken
} from '../../../services/attendanceSecurityService';
import { generateQrDataUrl } from '../../../services/qrService';

export const StaffQrScannerModal = ({ isOpen, onClose, employees = [], onPunchSuccess }) => {
  const { lang, showToast, businessSettings } = useApp();

  const [activeTab, setActiveTab] = useState('scan_id'); // 'scan_id' | 'stand_qr' | 'geo_settings'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [punchType, setPunchType] = useState('auto'); // 'auto' | 'check_in' | 'check_out'
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  // Office Geofence Settings
  const [officeSettings, setOfficeSettings] = useState(() => getOfficeGeoSettings());
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);

  // Dynamic Rolling QR States
  const [dynamicQrUrl, setDynamicQrUrl] = useState('');
  const [tokenCountdown, setTokenCountdown] = useState(12);
  const timerRef = useRef(null);

  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);
  const lastScanTimestampRef = useRef(0);

  // Dynamic Rolling QR Generator & Countdown (Module 1 Anti-Photo Fraud)
  useEffect(() => {
    if (!isOpen || activeTab !== 'stand_qr') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const refreshDynamicQr = async () => {
      const token = generateDynamicOfficeToken(officeSettings);
      setTokenCountdown(token.remainingSeconds);
      const payloadStr = JSON.stringify({
        ...token,
        company: businessSettings?.companyName || 'HisabKitab 360',
        officeLat: officeSettings.latitude,
        officeLng: officeSettings.longitude,
        allowedRadius: officeSettings.allowedRadiusMeters
      });

      const url = await generateQrDataUrl(payloadStr, { width: 280, margin: 1 });
      if (url) setDynamicQrUrl(url);
    };

    // Initial generation
    refreshDynamicQr();

    // 1-second countdown ticker
    timerRef.current = setInterval(() => {
      setTokenCountdown(prev => {
        if (prev <= 1) {
          refreshDynamicQr();
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, activeTab, officeSettings, businessSettings]);

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

  // Calibrate current GPS coordinates as Office location
  const handleCalibrateOfficeLocation = async () => {
    setIsCalibratingGps(true);
    try {
      const loc = await getVerifiedLocation({ ...officeSettings, allowedRadiusMeters: 99999 });
      const updated = saveOfficeGeoSettings({
        latitude: loc.latitude,
        longitude: loc.longitude
      });
      setOfficeSettings(updated);
      if (showToast) {
        showToast(
          lang === 'bn'
            ? `📍 বর্তমান লোকেশন (${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}) অফিস কেন্দ্র হিসেবে সংরক্ষিত হয়েছে!`
            : 'Office coordinates calibrated successfully!',
          'success'
        );
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'লোকেশন পাওয়া যায়নি', 'error');
    } finally {
      setIsCalibratingGps(false);
    }
  };

  // Process Scanned Code with Strict 5-15m Haversine Geofence & Anti-Cheat Validation
  const handleQrCodeScanned = async (decodedText) => {
    const now = Date.now();
    // Throttle duplicate scans within 2.5 seconds
    if (now - lastScanTimestampRef.current < 2500) {
      return;
    }
    lastScanTimestampRef.current = now;

    let parsed = null;
    try {
      parsed = JSON.parse(decodedText);
    } catch {
      parsed = { empId: decodedText.trim() };
    }

    // 1. If scanning Dynamic Rolling Office QR (Self-Service check-in)
    if (parsed.type === 'HK360_DYNAMIC_ATTENDANCE') {
      const tokenVerification = verifyDynamicOfficeToken(parsed, officeSettings);
      if (!tokenVerification.valid) {
        if (showToast) {
          showToast(tokenVerification.error || 'কিউআর কোড অকার্যকর', 'error');
        }
        return;
      }
    }

    // 2. Validate HTML5 Geolocation API with Haversine Formula (5 to 15m radius)
    setIsVerifyingLocation(true);
    let locationResult = null;
    try {
      locationResult = await getVerifiedLocation(officeSettings);
    } catch (geoErr) {
      setIsVerifyingLocation(false);
      if (showToast) {
        showToast(`📍 জিপিএস যাচাই ব্যর্থ: ${geoErr.message}`, 'error');
      }
      return;
    }
    setIsVerifyingLocation(false);

    // Strict Radius Check (5-15m)
    if (!locationResult.isInside) {
      if (showToast) {
        showToast(
          `❌ আপনি অফিস থেকে ${locationResult.distanceMeters} মিটার দূরে আছেন! শুধুমাত্র ${officeSettings.allowedRadiusMeters} মিটারের ভেতরে থাকলে হাজিরা গৃহীত হবে।`,
          'error'
        );
      }
      return;
    }

    // Sound Beep
    try {
      playScanBeep();
    } catch {}

    const empId = parsed.empId || parsed.id;
    const matchedEmp = employees.find(
      e => String(e.id).toLowerCase() === String(empId).toLowerCase() || (parsed.name && e.name === parsed.name)
    ) || employees[0];

    if (!matchedEmp && !parsed.type) {
      if (showToast) {
        showToast(lang === 'bn' ? '❌ অচেনা কিউআর কোড! কোনো কর্মীর সাথে মেলেনি।' : 'Unrecognized QR Code', 'error');
      }
      return;
    }

    const empToPunch = matchedEmp || { id: 'EMP-SELF', name: 'অফিস কর্মী', role: 'স্টাফ' };

    // Determine check-in or check-out
    const todayStr = new Date().toISOString().split('T')[0];
    const existingLogs = getStoredAttendanceLogs();
    const todayLog = existingLogs.find(l => l.employeeId === empToPunch.id && l.date === todayStr);

    let resolvedType = punchType;
    if (resolvedType === 'auto') {
      resolvedType = (!todayLog || !todayLog.checkInTime) ? 'check_in' : 'check_out';
    }

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const shiftEval = evaluateDailyShiftTimes(new Date(), officeSettings);

    const logPayload = {
      id: todayLog?.id || `att_${Date.now()}_${empToPunch.id}`,
      employeeId: empToPunch.id,
      employeeName: empToPunch.name,
      role: empToPunch.role || 'স্টাফ',
      section: empToPunch.section || 'সেলস ও কাউন্টার',
      date: todayStr,
      status: shiftEval.isLate ? 'Late' : 'Present',
      verifiedBy: 'GEOFENCED_QR_SCANNER',
      geofenceDistanceMeters: locationResult.distanceMeters,
      gpsAccuracyMeters: locationResult.accuracy,
      checkInTime: resolvedType === 'check_in' ? timeFormatted : (todayLog?.checkInTime || timeFormatted),
      checkOutTime: resolvedType === 'check_out' ? timeFormatted : (todayLog?.checkOutTime || null),
      isLate: shiftEval.isLate,
      lateMinutes: shiftEval.lateMinutes
    };

    saveAttendanceLog(logPayload);

    setLastScannedResult({
      employee: empToPunch,
      type: resolvedType,
      time: timeFormatted,
      status: shiftEval.isLate ? 'Late' : 'Present',
      lateMinutes: shiftEval.lateMinutes,
      distance: locationResult.distanceMeters
    });

    if (showToast) {
      showToast(
        lang === 'bn'
          ? `✅ ${empToPunch.name} - ${resolvedType === 'check_in' ? 'ইন-টাইম' : 'আউট-টাইম'} সফল! (দূরত্ব: ${locationResult.distanceMeters}m)`
          : `✅ Attendance logged for ${empToPunch.name}`,
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
          maxWidth: '560px',
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
                <span>{lang === 'bn' ? 'স্মার্ট কিউআর হাজিরা টার্মিনাল' : 'Smart QR Attendance Terminal'}</span>
                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>
                  {officeSettings.allowedRadiusMeters}m GEOFENCE
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? '৫-১৫ মিটার জিপিএস সীমানা ও অ্যান্টি-ফটো ডায়নামিক কিউআর' : 'Haversine GPS geofence & anti-photo dynamic QR'}
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

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('scan_id')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              borderBottom: activeTab === 'scan_id' ? '3px solid #10b981' : '3px solid transparent',
              background: activeTab === 'scan_id' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              color: activeTab === 'scan_id' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Camera size={15} />
            <span>{lang === 'bn' ? 'স্ক্যানার ও ক্যামেরা' : 'Scanner'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stand_qr')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              borderBottom: activeTab === 'stand_qr' ? '3px solid #6366f1' : '3px solid transparent',
              background: activeTab === 'stand_qr' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              color: activeTab === 'stand_qr' ? '#6366f1' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={15} />
            <span>{lang === 'bn' ? 'ডায়নামিক কাউন্টার কিউআর' : 'Dynamic Stand QR'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('geo_settings')}
            style={{
              padding: '10px 14px',
              border: 'none',
              borderBottom: activeTab === 'geo_settings' ? '3px solid #f59e0b' : '3px solid transparent',
              background: activeTab === 'geo_settings' ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
              color: activeTab === 'geo_settings' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MapPin size={15} />
            <span>{lang === 'bn' ? 'জিপিএস সীমানা' : 'Geofence'}</span>
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
                maxWidth: '340px',
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
                    width: '200px',
                    height: '200px',
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

            {isVerifyingLocation && (
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                <span>জিপিএস দূরত্ব (Haversine 5-15m) যাচাই করা হচ্ছে...</span>
              </div>
            )}

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
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    📍 অফিস দূরত্ব: <strong>{lastScannedResult.distance} মিটার</strong> (অনুমোদিত: {officeSettings.allowedRadiusMeters}m)
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Dynamic Rolling Stand QR (Module 1 Anti-Photo Fraud) */}
        {activeTab === 'stand_qr' && (
          <div style={{ padding: '20px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '2px' }}>
              {businessSettings?.companyName || 'হিসাব কিতাব ৩৬০'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              ডায়নামিক টার্মিনাল কিউআর • প্রতি ১২-১৫ সেকেন্ড পর পর নতুন কোড জেনারেট হয়
            </div>

            {/* QR Display with Circular Countdown Indicator */}
            <div
              style={{
                position: 'relative',
                padding: '16px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '3px solid #6366f1',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.15)',
                marginBottom: '14px'
              }}
            >
              {dynamicQrUrl ? (
                <img src={dynamicQrUrl} alt="Dynamic Rolling QR" style={{ width: '210px', height: '210px', display: 'block' }} />
              ) : (
                <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={56} color="#cbd5e1" />
                </div>
              )}

              {/* Rolling Timer Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#6366f1',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Clock size={12} />
                <span>রিফ্রেশ: {tokenCountdown}s</span>
              </div>
            </div>

            <div
              style={{
                maxWidth: '420px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                lineHeight: 1.5,
                textAlign: 'left'
              }}
            >
              🛡️ <strong>জালিয়াতি প্রতিরোধ ব্যবস্থা (Anti-Photo Fraud):</strong> এই কিউআর কোডের ছবি তুলে বাড়ি থেকে স্ক্যান করলে গ্রহণযোগ্য হবে না। কোডটি লাইভ অফিস ডিসপ্লে থেকে স্ক্যান করতে হবে এবং কর্মীকে অফিসের <strong>{officeSettings.allowedRadiusMeters} মিটারের সীমানায়</strong> উপস্থিত থাকতে হবে।
            </div>
          </div>
        )}

        {/* Tab 3: Geofence Calibration & Settings */}
        {activeTab === 'geo_settings' && (
          <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)' }}>
              অফিস জিপিএস সীমানা ও রেডিয়াস কনফিগারেশন
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                বর্তমান নির্ধারিত অফিস কেন্দ্র (Office GPS Coordinates):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontFamily: 'monospace', fontWeight: '800', fontSize: '0.88rem' }}>
                <div style={{ background: 'var(--surface-color)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  Lat: {officeSettings.latitude.toFixed(5)}
                </div>
                <div style={{ background: 'var(--surface-color)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  Long: {officeSettings.longitude.toFixed(5)}
                </div>
              </div>

              {/* 1-Tap Calibrate Current Location */}
              <button
                type="button"
                onClick={handleCalibrateOfficeLocation}
                disabled={isCalibratingGps}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: isCalibratingGps ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <MapPin size={16} />
                <span>{isCalibratingGps ? 'জিপিএস নির্ণয় হচ্ছে...' : '📍 বর্তমান অবস্থানকে অফিস হিসেবে সেভ করুন'}</span>
              </button>
            </div>

            {/* Allowed Radius Selector (5m - 15m) */}
            <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  সর্বোচ্চ অনুমোদিত উপস্থিতি সীমানা (Geofence Radius):
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#10b981' }}>
                  {officeSettings.allowedRadiusMeters} মিটার
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                {[
                  { r: 5, label: '৫ মিটার (কঠোর কাউন্টার)' },
                  { r: 10, label: '১০ মিটার (রুম/দোকান)' },
                  { r: 15, label: '১৫ মিটার (ফ্লোর/অফিস)' }
                ].map(opt => (
                  <button
                    key={opt.r}
                    type="button"
                    onClick={() => {
                      const updated = saveOfficeGeoSettings({ allowedRadiusMeters: opt.r });
                      setOfficeSettings(updated);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      border: officeSettings.allowedRadiusMeters === opt.r ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: officeSettings.allowedRadiusMeters === opt.r ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-color)',
                      color: officeSettings.allowedRadiusMeters === opt.r ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffQrScannerModal;
