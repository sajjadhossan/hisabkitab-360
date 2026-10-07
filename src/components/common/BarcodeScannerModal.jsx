import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  CameraOff,
  ScanLine,
  X,
  Keyboard,
  Package,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
  Eye,
  Image as ImageIcon,
  Upload,
  Plus,
  Check,
  Layers,
  Search,
  ShoppingCart,
  Flashlight
} from 'lucide-react';
import {
  findVisualMatches,
  speakProductAnnounce,
  triggerHaptic
} from '../../services/imageRecognitionService';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export const BarcodeScannerModal = () => {
  const {
    isScannerOpen,
    closeScanner,
    scannerCallback,
    scannerInitialMode,
    handleBarcodeScanned,
    playScannerBeep,
    products,
    lang,
    showToast,
    t
  } = useApp();

  // Mode: 'barcode' | 'visual_ai' | 'upload' | 'manual'
  const [activeMode, setActiveMode] = useState('barcode');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isBatchScan, setIsBatchScan] = useState(true); // Supermarket continuous scan
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [scannedSessionCount, setScannedSessionCount] = useState(0);

  // Manual & Last scan states
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [lastScannedItem, setLastScannedItem] = useState(null);
  const [scanFlash, setScanFlash] = useState(false);

  // Visual AI Match states
  const [visualMatches, setVisualMatches] = useState([]);
  const [isAnalyzingVisual, setIsAnalyzingVisual] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isStartingScannerRef = useRef(false);
  const lastScanTimestampRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  // Sync mode when opened
  useEffect(() => {
    let timer = null;
    if (isScannerOpen) {
      if (scannerInitialMode) {
        setActiveMode(scannerInitialMode);
      }
      setScannedSessionCount(0);
      setLastScannedItem(null);
      setVisualMatches([]);
      setCapturedSnapshot(null);
      setUploadedPreview(null);
      timer = setTimeout(() => {
        startCamera(facingMode);
      }, 150);
    } else {
      stopCamera();
      setManualCode('');
      setCameraError(null);
      setTorchOn(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopCamera();
    };
  }, [isScannerOpen, scannerInitialMode]);

  // Restart camera when switching facingMode
  const handleToggleFacingMode = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await stopCamera();
    setTimeout(() => {
      startCamera(nextMode);
    }, 150);
  };

  const startCamera = async (mode = facingMode) => {
    if (isStartingScannerRef.current) return;
    isStartingScannerRef.current = true;
    setCameraError(null);

    const elementId = 'hisabkitab-scanner-viewfinder';
    const container = document.getElementById(elementId);
    if (!container) {
      isStartingScannerRef.current = false;
      setTimeout(() => startCamera(mode), 150);
      return;
    }

    try {
      // 1. Preflight permission check to prompt mobile Android WebView permission if needed
      if (typeof navigator !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const preStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode === 'environment' ? { ideal: 'environment' } : 'user' }
          });
          preStream.getTracks().forEach((track) => track.stop());
        } catch (permErr) {
          console.warn('Preflight media permission notice:', permErr);
        }
      }

      // 2. Discover available camera hardware
      let cameraConfig = { facingMode: mode };
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          if (mode === 'environment') {
            const backCam = devices.find((d) =>
              /back|rear|environment|wide|main/i.test(d.label || '')
            ) || devices[devices.length - 1];
            if (backCam && backCam.id) {
              cameraConfig = backCam.id;
            }
          } else {
            const frontCam = devices.find((d) =>
              /front|user|selfie/i.test(d.label || '')
            ) || devices[0];
            if (frontCam && frontCam.id) {
              cameraConfig = frontCam.id;
            }
          }
        }
      } catch (deviceQueryErr) {
        console.warn('Could not query camera device list:', deviceQueryErr);
      }

      // 3. Initialize Html5Qrcode instance
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });
      }

      const qrCode = html5QrCodeRef.current;
      if (qrCode.isScanning) {
        try {
          await qrCode.stop();
        } catch (e) {
          console.warn('Previous scan stop error:', e);
        }
      }

      const onScanSuccess = (decodedText) => {
        if (!decodedText) return;
        const clean = String(decodedText).trim();
        const now = Date.now();
        if (
          clean !== lastScannedCodeRef.current ||
          now - lastScanTimestampRef.current > 1200
        ) {
          lastScannedCodeRef.current = clean;
          lastScanTimestampRef.current = now;
          triggerBarcodeScan(clean);

          if (!isBatchScan) {
            stopCamera();
          }
        }
      };

      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(viewfinderWidth * 0.88),
            height: Math.floor(minEdge * 0.72)
          };
        },
        aspectRatio: 1.333333
      };

      try {
        await qrCode.start(cameraConfig, scanConfig, onScanSuccess, () => {});
      } catch (firstStartErr) {
        console.warn('Initial camera start failed, retrying with fallback constraint...', firstStartErr);
        await qrCode.start({ facingMode: mode }, scanConfig, onScanSuccess, () => {});
      }

      setCameraActive(true);
      setCameraError(null);

      // Check flashlight/torch capability
      try {
        const capabilities = qrCode.getRunningTrackCapabilities();
        setHasTorch(Boolean(capabilities && capabilities.torch));
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.warn('Scanner start issue:', err);
      setCameraActive(false);
      setCameraError(
        lang === 'bn'
          ? 'ক্যামেরা চালু করা যায়নি বা অনুমতি নেই। ডিভাইসের সেটিংস থেকে ক্যামেরা পারমিশন এলাউ (Allow) করুন অথবা নিচে সরাসরি বারকোড টাইপ করুন।'
          : 'Could not access camera. Please allow camera permission in device settings or enter barcode below.'
      );
    } finally {
      isStartingScannerRef.current = false;
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.warn('Scanner stop error:', e);
      }
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const triggerBarcodeScan = (code) => {
    if (!code) return;
    const clean = String(code).trim();

    // Haptic & Sound
    playScannerBeep();
    triggerHaptic([60, 40, 60]);

    // Visual Flash
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 300);

    // Find matched product in inventory
    const matched = products.find(
      p => p.barcode === clean || (p.sku && p.sku.toLowerCase() === clean.toLowerCase())
    );

    setLastScannedItem({
      code: clean,
      product: matched,
      time: new Date().toLocaleTimeString()
    });
    setScannedSessionCount(prev => prev + 1);

    // Bengali Voice Announcement
    if (isSpeechEnabled && matched) {
      speakProductAnnounce(matched.name, matched.sellingPrice, lang);
    }

    handleBarcodeScanned(clean);

    if (!isBatchScan) {
      setTimeout(() => {
        closeScanner();
      }, 500);
    }
  };

  // =========================================================
  // AI VISUAL PRODUCT RECOGNITION (PHOTO SNAP & MATCH)
  // =========================================================
  const handleCaptureVisualMatch = async () => {
    const videoEl = document.querySelector('#hisabkitab-scanner-viewfinder video');
    if (!videoEl || !cameraActive) {
      showToast(lang === 'bn' ? 'ক্যামেরা চালু নেই!' : 'Camera not active!', 'warning');
      return;
    }

    setIsAnalyzingVisual(true);
    triggerHaptic([30, 20]);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedSnapshot(snapshotUrl);

      // Run AI visual similarity match
      const matches = await findVisualMatches(canvas, products, {
        minConfidence: 0.40,
        limit: 4
      });

      setVisualMatches(matches);

      if (matches.length > 0) {
        playScannerBeep();
        triggerHaptic([60, 50, 60]);
        const top = matches[0];
        showToast(
          lang === 'bn'
            ? `🎯 ${top.confidence}% মিল পাওয়া গেছে: ${top.product.name}`
            : `Found ${top.confidence}% match: ${top.product.name}`,
          'success'
        );

        if (isSpeechEnabled) {
          speakProductAnnounce(top.product.name, top.product.sellingPrice, lang);
        }
      } else {
        showToast(
          lang === 'bn'
            ? 'ইনভেন্টরিতে হুবহু কোনো মিল পাওয়া যায়নি। ম্যানুয়াল সার্চ করুন।'
            : 'No matching product visual found.',
          'info'
        );
      }
    } catch (err) {
      console.error('Visual match error:', err);
      showToast(lang === 'bn' ? 'ছবি বিশ্লেষণ করা যায়নি' : 'Failed to analyze image', 'error');
    } finally {
      setIsAnalyzingVisual(false);
    }
  };

  // Upload Photo to Match or Read Barcode
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setUploadedPreview(dataUrl);
      setIsAnalyzingVisual(true);

      // 1. Dual-Engine Barcode detection on uploaded photo
      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode('hisabkitab-scanner-viewfinder', {
            verbose: false,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          });
        }
        const decoded = await html5QrCodeRef.current.scanFile(file, true);
        if (decoded) {
          triggerBarcodeScan(decoded);
          setIsAnalyzingVisual(false);
          return;
        }
      } catch (barcodeErr) {
        // No barcode in photo, seamlessly continue to Visual AI Match
      }

      // 2. Fallback to Visual Matching
      const img = new Image();
      img.onload = async () => {
        const matches = await findVisualMatches(img, products, {
          minConfidence: 0.40,
          limit: 4
        });
        setVisualMatches(matches);
        setIsAnalyzingVisual(false);

        if (matches.length > 0) {
          playScannerBeep();
          showToast(
            lang === 'bn'
              ? `ছবি থেকে ${matches[0].product.name} শনাক্ত হয়েছে`
              : `Recognized ${matches[0].product.name}`,
            'success'
          );
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Add visual match item directly to POS cart
  const handleSelectVisualMatch = (product) => {
    if (!product) return;
    playScannerBeep();
    triggerHaptic([50, 40]);

    if (scannerCallback) {
      scannerCallback(product.barcode || product.sku, product);
    } else {
      handleBarcodeScanned(product.barcode || product.sku);
    }

    setScannedSessionCount(prev => prev + 1);
    setLastScannedItem({
      code: product.barcode || product.sku,
      product,
      time: new Date().toLocaleTimeString()
    });

    showToast(
      lang === 'bn'
        ? `✓ কার্টে যুক্ত হয়েছে: ${product.name}`
        : `Added to cart: ${product.name}`,
      'success'
    );

    if (isSpeechEnabled) {
      speakProductAnnounce(product.name, product.sellingPrice, lang);
    }

    if (!isBatchScan) {
      closeScanner();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      triggerBarcodeScan(manualCode.trim());
      setManualCode('');
    }
  };

  if (!isScannerOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1050, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      <div
        className="modal-content animate-fade-in android-scroll-view"
        style={{
          maxWidth: '620px',
          width: '95%',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          padding: '1.25rem',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <ScanLine size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'AI স্মার্ট স্ক্যানার ও ভিশন ম্যাচিং' : 'AI Smart Scanner & Vision Hub'}
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid #10b981'
                  }}
                >
                  ⚡ PRO AI
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'লাইভ বারকোড, AI ছবি চেনার ক্ষমতা ও কন্টিনিউয়াস স্ক্যানিং'
                  : 'Live Barcode, AI Visual Product Match & Continuous Mode'}
              </p>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={closeScanner}
            title={t.close}
            style={{ width: '34px', height: '34px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs (Barcode, AI Visual, Photo Upload, Manual) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            background: 'var(--bg-primary)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1rem',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveMode('barcode'); if (!cameraActive) startCamera(facingMode); }}
            style={{
              padding: '8px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'barcode' ? 'var(--business-primary)' : 'transparent',
              color: activeMode === 'barcode' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <ScanLine size={16} />
            <span>{lang === 'bn' ? 'বারকোড' : 'Barcode'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('visual_ai'); if (!cameraActive) startCamera(facingMode); }}
            style={{
              padding: '8px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'visual_ai' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeMode === 'visual_ai' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={16} />
            <span>{lang === 'bn' ? '👁️ ছবি দেখে চেনা' : 'Visual AI'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            style={{
              padding: '8px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'upload' ? '#3b82f6' : 'transparent',
              color: activeMode === 'upload' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Upload size={16} />
            <span>{lang === 'bn' ? 'ফটো আপলোড' : 'Photo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            style={{
              padding: '8px 4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              background: activeMode === 'manual' ? '#8b5cf6' : 'transparent',
              color: activeMode === 'manual' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Keyboard size={16} />
            <span>{lang === 'bn' ? 'ম্যানুয়াল/টেস্ট' : 'Manual'}</span>
          </button>
        </div>

        {/* Viewfinder Toolbar Controls (Torch, Camera Flip, Batch Mode, Speech) */}
        {(activeMode === 'barcode' || activeMode === 'visual_ai') && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-primary)',
              padding: '6px 12px',
              borderRadius: '10px',
              marginBottom: '10px',
              fontSize: '0.75rem',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Batch Continuous Scan Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: isBatchScan ? '#10b981' : 'var(--text-muted)'
                }}
                title={lang === 'bn' ? 'স্ক্যানার বন্ধ না হয়ে একটানা দ্রুত স্ক্যান হবে' : 'Keep scanner open for non-stop scanning'}
              >
                <input
                  type="checkbox"
                  checked={isBatchScan}
                  onChange={(e) => setIsBatchScan(e.target.checked)}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span>⚡ {lang === 'bn' ? 'কন্টিনিউয়াস স্ক্যান' : 'Batch Scan'}</span>
              </label>

              {/* Speech Voice Toggle */}
              <button
                type="button"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                title={isSpeechEnabled ? 'ভয়েস অন (পড়বে)' : 'ভয়েস অফ'}
                style={{
                  background: isSpeechEnabled ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  color: isSpeechEnabled ? '#10b981' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isSpeechEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{isSpeechEnabled ? 'ভয়েস চালু' : 'নিঃশব্দ'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Flash / Torch Toggle */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  style={{
                    background: torchOn ? '#f59e0b' : 'var(--bg-secondary)',
                    color: torchOn ? '#000' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '700'
                  }}
                  title={torchOn ? 'টর্চ নিভিয়ে দিন' : 'টর্চলাইট অন করুন'}
                >
                  <Zap size={13} />
                  <span>{torchOn ? 'টর্চ অন' : 'টর্চ'}</span>
                </button>
              )}

              {/* Camera Switcher (Front/Back) */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="ক্যামেরা পরিবর্তন করুন"
              >
                <RefreshCw size={13} />
                <span>{facingMode === 'environment' ? 'ব্যাক' : 'ফ্রন্ট'}</span>
              </button>

              {/* Session Scan Counter Badge */}
              {scannedSessionCount > 0 && (
                <span
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontWeight: '800',
                    fontSize: '0.7rem'
                  }}
                >
                  +{scannedSessionCount} কার্টে
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TABS 1 & 2: LIVE CAMERA VIEWFINDER (DUAL-ENGINE BARCODE & VISUAL AI)
            ======================================================== */}
        {(activeMode === 'barcode' || activeMode === 'visual_ai') && (
          <div>
            {/* Unified Viewfinder Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '240px',
                background: '#090d16',
                borderRadius: '16px',
                overflow: 'hidden',
                border: scanFlash ? '3px solid #10b981' : (activeMode === 'visual_ai' ? '2px solid #10b981' : '2px dashed var(--business-primary)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                transition: 'border 0.2s ease',
                boxShadow: scanFlash ? '0 0 25px rgba(16, 185, 129, 0.5)' : 'none'
              }}
            >
              {/* Dual-Engine Html5Qrcode & Google Barcode Scanner Container */}
              <div
                id="hisabkitab-scanner-viewfinder"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '260px',
                  display: 'block',
                  opacity: cameraActive ? 1 : 0,
                  transition: 'opacity 0.2s ease'
                }}
              />

              {/* Start Camera Placeholder / Loading Overlay */}
              {!cameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    textAlign: 'center',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(9, 13, 22, 0.95)',
                    zIndex: 5
                  }}
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <Camera size={26} />
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'ক্যামেরা চালু হচ্ছে বা পারমিশন অপেক্ষা করছে...' : 'Starting camera or awaiting permissions...'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startCamera(facingMode)}
                    style={{ padding: '8px 20px', fontSize: '0.84rem', fontWeight: '700' }}
                  >
                    <Camera size={15} style={{ marginRight: '6px' }} />
                    <span>{lang === 'bn' ? 'ক্যামেরা চালু করুন' : 'Start Camera'}</span>
                  </button>
                </div>
              )}

              {/* Barcode Mode: Laser Animation & Corner Accents */}
              {cameraActive && activeMode === 'barcode' && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '25%',
                      left: '8%',
                      right: '8%',
                      height: '2.5px',
                      background: 'linear-gradient(90deg, transparent, #ef4444, #10b981, #ef4444, transparent)',
                      boxShadow: '0 0 14px #ef4444',
                      animation: 'laserScan 2s ease-in-out infinite alternate'
                    }}
                  />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', width: '20px', height: '20px', borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981', borderRadius: '4px 0 0 0' }} />
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '20px', height: '20px', borderTop: '3px solid #10b981', borderRight: '3px solid #10b981', borderRadius: '0 4px 0 0' }} />
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '20px', height: '20px', borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981', borderRadius: '0 0 0 4px' }} />
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '20px', height: '20px', borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981', borderRadius: '0 0 4px 0' }} />
                </div>
              )}

              {/* Visual AI Mode: Crosshair Guides */}
              {cameraActive && activeMode === 'visual_ai' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '20px',
                    border: '2px dashed rgba(16, 185, 129, 0.5)',
                    borderRadius: '12px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}
                >
                  <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.74rem' }}>
                    📸 পণ্যটি ফ্রেমের মাঝখানে রাখুন
                  </span>
                </div>
              )}
            </div>

            {/* Visual AI Action Button */}
            {activeMode === 'visual_ai' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={handleCaptureVisualMatch}
                  disabled={!cameraActive || isAnalyzingVisual}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '0.95rem',
                    fontWeight: '800',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Sparkles size={18} />
                  <span>
                    {isAnalyzingVisual
                      ? (lang === 'bn' ? 'ছবি বিশ্লেষণ করা হচ্ছে...' : 'Analyzing Image...')
                      : (lang === 'bn' ? '📸 ছবি তুলুন ও পণ্য চিনুন' : 'Snap & Identify Product')}
                  </span>
                </button>
              </div>
            )}

            {/* Error banner */}
            {cameraError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: '#ef4444',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{cameraError}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444', fontWeight: '700' }}
                  >
                    <RefreshCw size={14} style={{ marginRight: '5px' }} />
                    <span>{lang === 'bn' ? 'ক্যামেরা পুনরায় চেষ্টা করুন' : 'Retry Camera'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode('manual')}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', background: '#8b5cf6' }}
                  >
                    <Keyboard size={14} style={{ marginRight: '5px' }} />
                    <span>{lang === 'bn' ? 'ম্যানুয়াল কোড লিখুন' : 'Enter Code Manually'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Visual Match Results Card */}
            {visualMatches.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎯 {lang === 'bn' ? 'শনাক্তকৃত পণ্যসমূহ (বেস্ট ম্যাচ):' : 'Identified Matches:'}</span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981' }}>{visualMatches.length}টি সম্ভাব্য মিল</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visualMatches.map(({ product, confidence, matchReason }) => (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '10px',
                        border: confidence >= 70 ? '1.5px solid #10b981' : '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6366f1'
                            }}
                          >
                            <Package size={20} />
                          </div>
                        )}

                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span>৳{Number(product.sellingPrice).toLocaleString()}</span>
                            <span>• স্টক: {product.stock || 0}</span>
                            <span style={{ color: '#10b981', fontWeight: '700' }}>✓ {confidence}% মিল ({matchReason})</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectVisualMatch(product)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Plus size={14} />
                        <span>{lang === 'bn' ? 'কার্টে যোগ' : 'Add'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: PHOTO / GALLERY UPLOAD
            ======================================================== */}
        {activeMode === 'upload' && (
          <div>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                background: 'var(--bg-primary)',
                marginBottom: '1rem'
              }}
            >
              {uploadedPreview ? (
                <div style={{ marginBottom: '14px' }}>
                  <img
                    src={uploadedPreview}
                    alt="Upload Preview"
                    style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px'
                  }}
                >
                  <ImageIcon size={30} />
                </div>
              )}

              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'পণ্যের বা বারকোডের ছবি আপলোড করুন' : 'Upload Product or Barcode Image'}
              </h4>
              <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'গ্যালারি বা ফাইল থেকে পণ্যের প্যাকেজিং ছবি দিলে AI স্বয়ংক্রিয়ভাবে স্ক্যান করে পণ্য খুঁজে দেবে'
                  : 'Select an image from device to automatically detect barcode or match product'}
              </p>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
                }}
              >
                <Upload size={16} />
                <span>{lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Choose Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Results for Uploaded image */}
            {visualMatches.length > 0 && (
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                  🎯 {lang === 'bn' ? 'আপলোডকৃত ছবি থেকে পাওয়া পণ্য:' : 'Matches from Uploaded Photo:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visualMatches.map(({ product, confidence, matchReason }) => (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          ৳{Number(product.sellingPrice).toLocaleString()} • {confidence}% মিল ({matchReason})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectVisualMatch(product)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        + কার্টে যোগ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: MANUAL KEYBOARD & QUICK PRESET BUTTONS
            ======================================================== */}
        {activeMode === 'manual' && (
          <div>
            <form onSubmit={handleManualSubmit} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'ফিজিক্যাল বারকোড স্ক্যানার গান বা ম্যানুয়াল কোড টাইপ:' : 'Physical Gun Scanner / Manual SKU:'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'বারকোড বা SKU লিখুন...' : 'Enter barcode or SKU...'}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 18px', fontWeight: '700', fontSize: '0.85rem' }}
                >
                  {lang === 'bn' ? 'সাবমিট' : 'Submit'}
                </button>
              </div>
            </form>

            {/* Quick Test Products */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                ⚡ {lang === 'bn' ? 'দ্রুত স্ক্যান সিমুলেটর (১-ক্লিক টেস্ট):' : 'Instant 1-Click Test Scenarios:'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
                {products.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => triggerBarcodeScan(p.barcode || p.sku)}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {p.barcode || p.sku}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Last Scanned Status Footer */}
        {lastScannedItem && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>
                  {lastScannedItem.product ? lastScannedItem.product.name : lastScannedItem.code}
                </span>
                <span style={{ color: '#10b981', marginLeft: '6px', fontWeight: '700' }}>
                  {lastScannedItem.product ? `৳${Number(lastScannedItem.product.sellingPrice ?? lastScannedItem.product.price ?? 0).toLocaleString()}` : (lang === 'bn' ? 'স্ক্যান সফল' : 'Scanned')}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {lastScannedItem.time}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
