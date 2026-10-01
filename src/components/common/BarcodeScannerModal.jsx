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

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastScanTimestampRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  // Sync mode when opened
  useEffect(() => {
    if (isScannerOpen) {
      if (scannerInitialMode) {
        setActiveMode(scannerInitialMode);
      }
      setScannedSessionCount(0);
      setLastScannedItem(null);
      setVisualMatches([]);
      setCapturedSnapshot(null);
      setUploadedPreview(null);
      startCamera(facingMode);
    } else {
      stopCamera();
      setManualCode('');
      setCameraError(null);
      setTorchOn(false);
    }
  }, [isScannerOpen, scannerInitialMode]);

  // Restart camera when switching facingMode
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => {
      startCamera(nextMode);
    }, 150);
  };

  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          lang === 'bn'
            ? 'আপনার ব্রাউজার ক্যামেরা সাপোর্ট করে না। নিচে দ্রুত স্ক্যান টেস্ট অপশন ব্যবহার করুন।'
            : 'Camera API not supported in this browser. Use quick simulator below.'
        );
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;

      // Check if torch/flashlight is supported on this track
      const track = stream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        setHasTorch(Boolean(capabilities.torch));
      } else {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startBarcodeDetection();
      }
    } catch (err) {
      console.warn('Camera start issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? (lang === 'bn' ? 'ক্যামেরা পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংসে ক্যামেরা এলাউ করুন।' : 'Camera permission denied.')
          : (lang === 'bn' ? 'ক্যামেরা সংযোগ করা যায়নি। নিচে দ্রুত স্ক্যান সিমুলেটর বা ম্যানুয়াল কোড ব্যবহার করুন।' : 'Could not access camera. Use quick scan below.')
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        const newTorchState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setTorchOn(newTorchState);
      }
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  // Barcode Detection Loop (BarcodeDetector API + fallback)
  const startBarcodeDetection = () => {
    if (!('BarcodeDetector' in window)) {
      return;
    }

    try {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e']
      });

      const detect = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2 && activeMode === 'barcode') {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              const now = Date.now();

              // Debounce 1.2s to prevent multiple triggers of the same barcode in batch mode
              if (
                detected !== lastScannedCodeRef.current ||
                now - lastScanTimestampRef.current > 1200
              ) {
                lastScannedCodeRef.current = detected;
                lastScanTimestampRef.current = now;
                triggerBarcodeScan(detected);

                if (!isBatchScan) {
                  stopCamera();
                  return;
                }
              }
            }
          } catch {
            // frame detect error
          }
        }
        animationFrameRef.current = requestAnimationFrame(detect);
      };

      animationFrameRef.current = requestAnimationFrame(detect);
    } catch {
      // fallback
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
    if (!videoRef.current || !cameraActive) {
      showToast(lang === 'bn' ? 'ক্যামেরা চালু নেই!' : 'Camera not active!', 'warning');
      return;
    }

    setIsAnalyzingVisual(true);
    triggerHaptic([30, 20]);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

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

      const img = new Image();
      img.onload = async () => {
        // 1. Try barcode detection first
        if ('BarcodeDetector' in window) {
          try {
            const detector = new window.BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a']
            });
            const barcodes = await detector.detect(img);
            if (barcodes.length > 0) {
              triggerBarcodeScan(barcodes[0].rawValue);
              setIsAnalyzingVisual(false);
              return;
            }
          } catch {
            // fallback to visual
          }
        }

        // 2. Fallback to Visual Matching
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
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '620px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
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
            TAB 1: LIVE BARCODE & QR CAMERA
            ======================================================== */}
        {activeMode === 'barcode' && (
          <div>
            {/* Viewfinder Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                background: '#090d16',
                borderRadius: '16px',
                overflow: 'hidden',
                border: scanFlash ? '3px solid #10b981' : '2px dashed var(--business-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                transition: 'border 0.2s ease',
                boxShadow: scanFlash ? '0 0 25px rgba(16, 185, 129, 0.5)' : 'none'
              }}
            >
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                    muted
                  />
                  {/* Laser animation */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '20%',
                      left: '8%',
                      right: '8%',
                      height: '2.5px',
                      background: 'linear-gradient(90deg, transparent, #ef4444, #10b981, #ef4444, transparent)',
                      boxShadow: '0 0 14px #ef4444',
                      animation: 'laserScan 2s ease-in-out infinite alternate'
                    }}
                  />
                  {/* Scanning Targets */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '28px',
                      border: '2px solid rgba(255, 255, 255, 0.45)',
                      borderRadius: '14px',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Corner Accent marks */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', width: '20px', height: '20px', borderTop: '3px solid #10b981', borderLeft: '3px solid #10b981', borderRadius: '4px 0 0 0' }} />
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '20px', height: '20px', borderTop: '3px solid #10b981', borderRight: '3px solid #10b981', borderRadius: '0 4px 0 0' }} />
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '20px', height: '20px', borderBottom: '3px solid #10b981', borderLeft: '3px solid #10b981', borderRadius: '0 0 0 4px' }} />
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '20px', height: '20px', borderBottom: '3px solid #10b981', borderRight: '3px solid #10b981', borderRadius: '0 0 4px 0' }} />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
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
                    {lang === 'bn' ? 'ডিভাইসের ওয়েবক্যাম বা ব্যাক ক্যামেরা দিয়ে স্ক্যান করুন' : 'Scan items using device webcam or camera'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startCamera(facingMode)}
                    style={{ padding: '8px 18px', fontSize: '0.82rem', fontWeight: '700' }}
                  >
                    <Camera size={15} style={{ marginRight: '6px' }} />
                    <span>{lang === 'bn' ? 'ক্যামেরা চালু করুন' : 'Start Camera'}</span>
                  </button>
                </div>
              )}
            </div>

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
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: AI VISUAL PRODUCT RECOGNITION (IMAGE SNAP)
            ======================================================== */}
        {activeMode === 'visual_ai' && (
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                background: '#090d16',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}
            >
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                    muted
                  />
                  {/* Visual Crosshair Guides */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '20px',
                      border: '2px dashed rgba(16, 185, 129, 0.5)',
                      borderRadius: '12px',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem' }}>
                      📸 পণ্যটি ফ্রেমের মাঝখানে রাখুন
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => startCamera(facingMode)}
                    style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: '700' }}
                  >
                    <Camera size={16} style={{ marginRight: '6px' }} />
                    <span>{lang === 'bn' ? 'ক্যামেরা চালু করুন' : 'Start Camera'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Snap Action Button */}
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
                  {lastScannedItem.product ? `৳${lastScannedItem.product.sellingPrice}` : 'স্ক্যান সফল'}
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
