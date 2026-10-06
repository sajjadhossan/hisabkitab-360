import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Camera,
  Mic,
  Download,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  X,
  ExternalLink,
  Smartphone,
  Laptop,
  Sparkles
} from 'lucide-react';

export const PermissionManagerModal = ({ isOpen, onClose, lang = 'bn', onPermissionChanged }) => {
  const [cameraStatus, setCameraStatus] = useState('checking'); // 'granted' | 'prompt' | 'denied' | 'checking'
  const [micStatus, setMicStatus] = useState('checking');
  const [notificationStatus, setNotificationStatus] = useState('checking');
  const [storageStatus, setStorageStatus] = useState('granted'); // web download is always supported

  const [activeCameraPreview, setActiveCameraPreview] = useState(false);
  const [cameraErrorMsg, setCameraErrorMsg] = useState(null);
  const [micErrorMsg, setMicErrorMsg] = useState(null);
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  const videoPreviewRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Check initial permissions
  useEffect(() => {
    if (isOpen) {
      checkAllPermissions();
    } else {
      stopCameraPreview();
    }
    return () => {
      stopCameraPreview();
    };
  }, [isOpen]);

  const checkAllPermissions = async () => {
    // 1. Check Notification
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setNotificationStatus('granted');
      else if (Notification.permission === 'denied') setNotificationStatus('denied');
      else setNotificationStatus('prompt');
    } else {
      setNotificationStatus('not_supported');
    }

    // 2. Check Camera via navigator.permissions if supported
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const camPerm = await navigator.permissions.query({ name: 'camera' });
        setCameraStatus(camPerm.state);
        camPerm.onchange = () => setCameraStatus(camPerm.state);

        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        setMicStatus(micPerm.state);
        micPerm.onchange = () => setMicStatus(micPerm.state);
      } else {
        // Fallback for Android WebViews without query API
        setCameraStatus('prompt');
        setMicStatus('prompt');
      }
    } catch {
      // In some WebViews query({ name: 'camera' }) throws TypeError
      setCameraStatus('prompt');
      setMicStatus('prompt');
    }
  };

  const stopCameraPreview = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setActiveCameraPreview(false);
  };

  // Test & Request Camera
  const handleRequestCamera = async () => {
    setCameraErrorMsg(null);
    stopCameraPreview();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this environment');
      }

      // Try preferred back/environment camera, fallback to any camera
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      mediaStreamRef.current = stream;
      setCameraStatus('granted');
      setActiveCameraPreview(true);

      setTimeout(() => {
        if (videoPreviewRef.current && stream) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(e => console.warn(e));
        }
      }, 100);

      if (onPermissionChanged) onPermissionChanged('camera', 'granted');
    } catch (err) {
      console.warn('Camera request error:', err);
      setCameraStatus('denied');
      setCameraErrorMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? (lang === 'bn'
              ? 'ক্যামেরা পারমিশন ডিনাই (অস্বীকৃত) হয়েছে। নিচের গাইড অনুযায়ী ফোন বা ব্রাউজার সেটিংসে এলাউ (Allow) করুন।'
              : 'Camera permission denied. Please allow camera in settings.')
          : (lang === 'bn'
              ? `ক্যামেরা সংযোগ করা যায়নি (${err.message || 'Error'})। ডিভাইসে কোনো ক্যামেরা খুঁজে পাওয়া যায়নি।`
              : 'Could not access camera device.')
      );
    }
  };

  // Test & Request Microphone
  const handleRequestMicrophone = async () => {
    setMicErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio API not available');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop audio track after testing
      stream.getTracks().forEach(t => t.stop());
      setMicStatus('granted');

      if (onPermissionChanged) onPermissionChanged('microphone', 'granted');
    } catch (err) {
      console.warn('Mic request error:', err);
      setMicStatus('denied');
      setMicErrorMsg(
        err.name === 'NotAllowedError'
          ? (lang === 'bn'
              ? 'মাইক্রোফোন পারমিশন বন্ধ আছে। ফোন সেটিংসে মাইক্রোফোন এলাউ করুন।'
              : 'Microphone permission denied.')
          : (lang === 'bn'
              ? 'মাইক্রোফোন সংযোগ করা যায়নি।'
              : 'Could not access microphone.')
      );
    }
  };

  // Request Notification
  const handleRequestNotification = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const res = await Notification.requestPermission();
        setNotificationStatus(res);
        if (onPermissionChanged) onPermissionChanged('notification', res);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Test Storage / File Download
  const handleTestStorage = () => {
    try {
      const blob = new Blob(['HisabKitab 360 - Storage & Export Test OK'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hisabkitab_permission_test.txt';
      a.click();
      URL.revokeObjectURL(url);
      setStorageStatus('granted');
    } catch (e) {
      console.warn(e);
    }
  };

  // 1-Click Request All Permissions
  const handleRequestAll = async () => {
    setIsRequestingAll(true);
    await handleRequestCamera();
    await handleRequestMicrophone();
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      await handleRequestNotification();
    }
    setIsRequestingAll(false);
  };

  if (!isOpen) return null;

  const renderStatusBadge = (status) => {
    if (status === 'granted') {
      return (
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
          <CheckCircle2 size={13} />
          <span>{lang === 'bn' ? 'অনুমোদিত' : 'Granted'}</span>
        </span>
      );
    }
    if (status === 'denied') {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
          <XCircle size={13} />
          <span>{lang === 'bn' ? 'অস্বীকৃত / ব্লক' : 'Denied'}</span>
        </span>
      );
    }
    return (
      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
        <AlertTriangle size={13} />
        <span>{lang === 'bn' ? 'অনুমতি প্রয়োজন' : 'Required'}</span>
      </span>
    );
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
      <div className="modal-content" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--business-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? '🔐 ডিভাইস পারমিশন ও এক্সেস সেন্টার' : 'App Permission & Hardware Center'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'অ্যান্ড্রয়েড, পিসি ও ব্রাউজারে ক্যামেরা, ভয়েস ও ফাইল এক্সেস নিয়ন্ত্রণ' : 'Manage Camera, Voice Microphone and File permissions'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '8px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-Click Request All Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} style={{ color: '#10b981' }} />
              <span>{lang === 'bn' ? 'সবগুলো পারমিশন একসাথে সক্রিয় করতে চান?' : 'Enable all permissions together?'}</span>
            </strong>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn' ? 'ক্যামেরা স্ক্যানার ও ভয়েস টাইপিং ত্রুটিমুক্তভাবে চালু হবে' : 'Instantly test and request Camera & Voice access'}
            </div>
          </div>

          <button
            type="button"
            disabled={isRequestingAll}
            onClick={handleRequestAll}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '800' }}
          >
            <RefreshCw size={14} className={isRequestingAll ? 'animate-spin' : ''} />
            <span>{lang === 'bn' ? 'সব পারমিশন এলাউ করুন' : 'Allow All Permissions'}</span>
          </button>
        </div>

        {/* Permissions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {/* 1. CAMERA PERMISSION */}
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? '📷 ক্যামেরা পারমিশন (Camera Access)' : 'Camera Access'}</span>
                    {renderStatusBadge(cameraStatus)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {lang === 'bn'
                      ? 'বারকোড স্ক্যানার, কিউআর কোড এবং প্রোডাক্টের সরাসরি ছবি তোলার কাজে লাগে।'
                      : 'Used for barcode scanning, QR codes, and capturing product photos.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestCamera}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                {cameraStatus === 'granted' ? (lang === 'bn' ? 'পুনরায় টেস্ট' : 'Re-test') : (lang === 'bn' ? 'অনুমতি দিন' : 'Allow')}
              </button>
            </div>

            {/* Camera Error Alert */}
            {cameraErrorMsg && (
              <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.78rem' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                <span>{cameraErrorMsg}</span>
              </div>
            )}

            {/* Live Camera Preview Box when granted */}
            {activeCameraPreview && (
              <div style={{ marginTop: '10px', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                <video
                  ref={videoPreviewRef}
                  playsInline
                  muted
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                  ✓ ক্যামেরা লাইভ চালু আছে
                </div>
                <button
                  type="button"
                  onClick={stopCameraPreview}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  প্রিভিউ বন্ধ করুন
                </button>
              </div>
            )}
          </div>

          {/* 2. MICROPHONE PERMISSION */}
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? '🎙️ মাইক্রোফোন পারমিশন (Voice Microphone)' : 'Microphone Access'}</span>
                    {renderStatusBadge(micStatus)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {lang === 'bn'
                      ? 'মুখে বলে দ্রুত ক্যাশ মেমো তৈরি, ভয়েস হিসাব সহকারী এবং কথা বলে প্রোডাক্ট খোঁজার জন্য প্রয়োজন।'
                      : 'Used for speech billing, voice search, and hands-free expense entry.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestMicrophone}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                {micStatus === 'granted' ? (lang === 'bn' ? 'পুনরায় টেস্ট' : 'Re-test') : (lang === 'bn' ? 'অনুমতি দিন' : 'Allow')}
              </button>
            </div>

            {micErrorMsg && (
              <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '0.78rem' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                <span>{micErrorMsg}</span>
              </div>
            )}
          </div>

          {/* 3. STORAGE & DOWNLOADS */}
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? '📁 ফাইল ডাউনলোড ও স্টোরেজ (Storage & Export)' : 'Storage & Downloads'}</span>
                    {renderStatusBadge(storageStatus)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {lang === 'bn'
                      ? 'ইনভয়েস পিডিএফ, এক্সেল রিপোর্ট ও গুগল ড্রাইভ ব্যাকআপ ডিভাইসে সেভ করার সুবিধা।'
                      : 'Used for downloading invoices, reports, and local backups.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestStorage}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                {lang === 'bn' ? 'ডাউনলোড টেস্ট' : 'Test'}
              </button>
            </div>
          </div>

          {/* 4. NOTIFICATIONS */}
          <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang === 'bn' ? '🔔 নোটিফিকেশন ও অ্যালার্ট (Notifications)' : 'Notifications'}</span>
                    {renderStatusBadge(notificationStatus)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {lang === 'bn'
                      ? 'বকেয়া পাওনা তাগাদা, লো-স্টক রিমাইন্ডার ও ব্যাকআপ সমাপ্তি অ্যালার্ট।'
                      : 'Used for due payment reminders and low-stock alerts.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestNotification}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                {notificationStatus === 'granted' ? (lang === 'bn' ? 'অনুমোদিত' : 'Granted') : (lang === 'bn' ? 'অনুমতি দিন' : 'Allow')}
              </button>
            </div>
          </div>
        </div>

        {/* HELP & TROUBLESHOOTING GUIDE FOR ANDROID & PC */}
        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <strong style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Smartphone size={16} style={{ color: 'var(--business-primary)' }} />
            <span>{lang === 'bn' ? 'যদি ক্যামেরা ওপেন না হয় বা পূর্বে ব্লক করা থাকে:' : 'Troubleshooting Camera Permissions:'}</span>
          </strong>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <div>
              <strong>📱 অ্যান্ড্রয়েড মোবাইল অ্যাপে:</strong> ফোনের <strong>Settings (সেটিংস) → Apps (অ্যাপস) → HisabKitab 360 → Permissions (অনুমতি)</strong>-এ গিয়ে <strong>Camera (ক্যামেরা)</strong> এবং <strong>Microphone (মাইক্রোফোন)</strong> অপশনটিতে "Allow" বা "অনুমতি দিন" সিলেক্ট করুন।
            </div>
            <div>
              <strong>💻 পিসি বা ব্রাউজারে:</strong> ব্রাউজারের অ্যাড্রেস বারের বাম পাশে থাকা <strong>তালা (🔒 Lock) আইকনটিতে</strong> ক্লিক করে Camera এবং Microphone-এর পাশে "Allow" সিলেক্ট করে পেজটি একবার রিফ্রেশ করুন।
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '8px 24px', fontWeight: '700' }}
          >
            {lang === 'bn' ? 'ঠিক আছে' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
