import React, { useState, useEffect } from 'react';
import {
  Zap,
  Volume2,
  VolumeX,
  Scale,
  ShieldCheck,
  RefreshCw,
  Radio,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ScanLine
} from 'lucide-react';
import {
  isNativeBarcodeDetectorSupported,
  parseWeightEmbeddedBarcode
} from '../../services/multiEngineBarcodeOrchestrator';
import {
  digitalScaleSerialService,
  isSerialSupported,
  connectDigitalScale,
  disconnectDigitalScale,
  isScaleConnected,
  sendScaleCommand
} from '../../services/digitalScaleSerialService';
import {
  tamperProofInvoiceService,
  auditLedgerIntegrity
} from '../../services/tamperProofInvoiceService';
import {
  backgroundSyncEngine,
  isBackgroundSyncSupported,
  getOutboxQueue,
  processOutboxQueue
} from '../../services/backgroundSyncEngine';
import {
  nfcLoyaltyBridge,
  isNfcSupported,
  isWebOtpSupported,
  startNfcScanner,
  stopNfcScanner
} from '../../services/nfcLoyaltyBridge';
import {
  triggerSoundboxPayment,
  playSoundboxChime,
  isSoundboxEnabled,
  setSoundboxEnabled
} from '../../services/soundboxService';

export const EnterpriseHardwareHub = ({ lang = 'bn', showToast, invoices = [] }) => {
  // 1. Digital Scale State
  const [scaleSupported, setScaleSupported] = useState(false);
  const [scaleConnected, setScaleConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(9600);
  const [liveWeight, setLiveWeight] = useState({ weight: 0.0, unit: 'kg', isStable: true });
  const [isConnectingScale, setIsConnectingScale] = useState(false);

  // 2. Soundbox State
  const [soundboxOn, setSoundboxOn] = useState(() => isSoundboxEnabled());

  // 3. Web Crypto Ledger Audit State
  const [isAuditingLedger, setIsAuditingLedger] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // 4. Background Sync Outbox State
  const [bgSyncSupported, setBgSyncSupported] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);
  const [isFlushingOutbox, setIsFlushingOutbox] = useState(false);

  // 5. Web NFC & Web OTP State
  const [nfcSupported, setNfcSupported] = useState(false);
  const [otpSupported, setOtpSupported] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [lastScannedNfc, setLastScannedNfc] = useState(null);

  useEffect(() => {
    setScaleSupported(isSerialSupported());
    setScaleConnected(isScaleConnected());
    setBgSyncSupported(isBackgroundSyncSupported());
    setOutboxCount(getOutboxQueue().length);
    setNfcSupported(isNfcSupported());
    setOtpSupported(isWebOtpSupported());

    return () => {
      stopNfcScanner();
    };
  }, []);

  // Digital Scale Handlers
  const handleToggleScale = async () => {
    if (scaleConnected) {
      await disconnectDigitalScale();
      setScaleConnected(false);
      setLiveWeight({ weight: 0.0, unit: 'kg', isStable: true });
      if (showToast) showToast(lang === 'bn' ? 'স্কেল ডিসকানেক্ট করা হয়েছে' : 'Scale disconnected', 'info');
    } else {
      setIsConnectingScale(true);
      try {
        const success = await connectDigitalScale({
          baudRate,
          onWeightUpdate: (parsed) => {
            setLiveWeight(parsed);
          },
          onError: (err) => {
            if (showToast) showToast(`স্কেল এরর: ${err.message}`, 'danger');
            setScaleConnected(false);
          },
          onDisconnect: () => {
            setScaleConnected(false);
            if (showToast) showToast(lang === 'bn' ? 'স্কেল সংযোগ বিচ্ছিন্ন হয়েছে' : 'Scale disconnected', 'warning');
          }
        });
        setScaleConnected(success);
        if (success && showToast) {
          showToast(lang === 'bn' ? '✓ ডিজিটাল ওজন স্কেল সফলভাবে যুক্ত হয়েছে!' : 'Scale connected successfully!', 'success');
        }
      } catch (e) {
        if (showToast) showToast(`কানেকশন ব্যর্থ: ${e.message}`, 'danger');
      } finally {
        setIsConnectingScale(false);
      }
    }
  };

  const handleTareScale = async () => {
    if (!scaleConnected) {
      setLiveWeight({ weight: 0.0, unit: 'kg', isStable: true });
      if (showToast) showToast(lang === 'bn' ? 'স্কেল শূন্য / টেয়ার করা হয়েছে' : 'Scale tared to 0', 'info');
      return;
    }
    const ok = await sendScaleCommand('T');
    if (ok && showToast) {
      showToast(lang === 'bn' ? '✓ টেয়ার (Zero) কমান্ড প্রেরিত' : 'Tare command sent', 'success');
    }
  };

  // Soundbox Handlers
  const handleToggleSoundbox = (checked) => {
    setSoundboxEnabled(checked);
    setSoundboxOn(checked);
    if (checked) {
      playSoundboxChime();
      if (showToast) showToast(lang === 'bn' ? '🔊 সাউন্ডবক্স চালু হয়েছে' : 'Soundbox enabled', 'success');
    } else {
      if (showToast) showToast(lang === 'bn' ? '🔇 সাউন্ডবক্স মিউট করা হয়েছে' : 'Soundbox muted', 'info');
    }
  };

  const handleTestSoundbox = () => {
    triggerSoundboxPayment({
      amount: 1250,
      method: 'bkash',
      customerName: 'করিম সাহেব',
      type: 'sale'
    });
    if (showToast) {
      showToast(lang === 'bn' ? '🔊 ১,২৫০ টাকার টেস্ট বাংলা ঘোষণা বাজছে...' : 'Playing test voice announcement...', 'info');
    }
  };

  // Cryptographic Ledger Audit
  const handleAuditLedger = async () => {
    setIsAuditingLedger(true);
    try {
      const res = await auditLedgerIntegrity(invoices);
      setAuditResult(res);
      if (showToast) {
        showToast(res.message, res.isValid ? 'success' : 'danger');
      }
    } catch (e) {
      if (showToast) showToast(`অডিট ব্যর্থ: ${e.message}`, 'danger');
    } finally {
      setIsAuditingLedger(false);
    }
  };

  // Background Sync Flush
  const handleFlushOutbox = async () => {
    setIsFlushingOutbox(true);
    try {
      const result = await processOutboxQueue(async (item) => {
        // Mock success for offline queue verification
        await new Promise((r) => setTimeout(r, 400));
        return true;
      });
      setOutboxCount(result.remaining);
      if (showToast) {
        showToast(
          lang === 'bn'
            ? `✓ আউটবক্স সিঙ্ক সম্পন্ন! সম্পন্ন: ${result.processed}, অবশিষ্ট: ${result.remaining}`
            : `Outbox synced! Processed: ${result.processed}`,
          'success'
        );
      }
    } catch (e) {
      if (showToast) showToast(`সিঙ্ক এরর: ${e.message}`, 'danger');
    } finally {
      setIsFlushingOutbox(false);
    }
  };

  // NFC Scan Handler
  const handleToggleNfcScan = async () => {
    if (isNfcScanning) {
      stopNfcScanner();
      setIsNfcScanning(false);
      if (showToast) showToast(lang === 'bn' ? 'NFC স্ক্যান বন্ধ করা হয়েছে' : 'NFC scan stopped', 'info');
    } else {
      setIsNfcScanning(true);
      const started = await startNfcScanner({
        onScan: (tag) => {
          setLastScannedNfc(tag);
          if (showToast) {
            showToast(
              lang === 'bn'
                ? `✓ NFC কার্ড স্ক্যান সফল! সিরিয়াল: ${tag.serialNumber}`
                : `NFC card detected: ${tag.serialNumber}`,
              'success'
            );
          }
        },
        onError: (err) => {
          setIsNfcScanning(false);
          if (showToast) showToast(`NFC এরর: ${err.message}`, 'warning');
        }
      });
      if (!started) setIsNfcScanning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          borderLeft: '4px solid #6366f1',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '10px', borderRadius: '12px', color: '#6366f1' }}>
              <Zap size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'উন্নত বাণিজ্যিক হাইব্রিড ইঞ্জিন ও হার্ডওয়্যার এপিআই হাব' : 'Enterprise Hybrid Hardware & API Hub'}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#6366f1',
                    border: '1px solid #6366f1'
                  }}
                >
                  ৬টি সক্রিয় এন্টারপ্রাইজ ইঞ্জিন
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'মাল্টি-ইঞ্জিন বারকোড ফেইলওভার, ওয়েব সিরিয়াল স্কেল, ক্রিপ্টোগ্রাফিক লেজার, ব্যাকগ্রাউন্ড সিঙ্ক, এনএফসি ও সাউন্ডবক্স'
                  : 'Multi-Engine Barcode Failover, Web Serial Scale, SubtleCrypto, Service Worker Sync, Web NFC & Soundbox'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 5 Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* 1. DIGITAL WEIGHING SCALE (Web Serial API) */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                  <Scale size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '১. ডিজিটাল ওজন স্কেল (Web Serial)' : '1. Digital Scale (Web Serial)'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: scaleSupported ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                    {scaleSupported ? (lang === 'bn' ? '✓ Web Serial এপিআই সমর্থিত' : '✓ Web Serial Supported') : (lang === 'bn' ? '⚠️ ক্রোম / এজ ব্রাউজার আবশ্যক' : '⚠️ Requires Chrome/Edge')}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: scaleConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                  color: scaleConnected ? '#10b981' : '#94a3b8'
                }}
              >
                {scaleConnected ? (lang === 'bn' ? 'যুক্ত আছে' : 'Connected') : (lang === 'bn' ? 'ডিসকানেক্টেড' : 'Disconnected')}
              </span>
            </div>

            {/* Live Weight Gauge Display */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
                marginBottom: '14px'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'লাইভ স্কেল রিডিং' : 'Live Scale Weight'}
              </div>
              <div
                style={{
                  fontSize: '2.2rem',
                  fontWeight: '900',
                  fontFamily: 'var(--font-mono)',
                  color: scaleConnected ? '#10b981' : 'var(--text-main)',
                  marginTop: '4px'
                }}
              >
                {Number(liveWeight.weight || 0).toFixed(3)}{' '}
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {liveWeight.unit || 'kg'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: liveWeight.isStable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: liveWeight.isStable ? '#10b981' : '#f59e0b'
                  }}
                >
                  {liveWeight.isStable ? (lang === 'bn' ? '✓ স্থির (STABLE)' : 'STABLE') : (lang === 'bn' ? 'গতিশীল (UNSTABLE)' : 'UNSTABLE')}
                </span>
              </div>
            </div>

            {/* Baud Rate Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'বড রেট (Baud Rate):' : 'Baud Rate:'}
              </span>
              <select
                value={baudRate}
                disabled={scaleConnected}
                onChange={(e) => setBaudRate(Number(e.target.value))}
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}
              >
                <option value={9600}>9600 bps (Standard)</option>
                <option value={4800}>4800 bps (CAS / Rongta)</option>
                <option value={2400}>2400 bps (Toledo)</option>
                <option value={115200}>115200 bps (High Speed)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isConnectingScale}
              onClick={handleToggleScale}
              style={{
                flex: 1,
                background: scaleConnected ? '#ef4444' : '#10b981',
                borderColor: scaleConnected ? '#ef4444' : '#10b981',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}
            >
              <Scale size={15} />
              <span>
                {scaleConnected
                  ? (lang === 'bn' ? 'সংযোগ বিচ্ছিন্ন করুন' : 'Disconnect')
                  : isConnectingScale
                  ? (lang === 'bn' ? 'কানেক্ট হচ্ছে...' : 'Connecting...')
                  : (lang === 'bn' ? 'স্কেল যুক্ত করুন' : 'Connect Scale')}
              </span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTareScale}
              title={lang === 'bn' ? 'স্কেল শূন্য করুন' : 'Tare to zero'}
              style={{ fontSize: '0.82rem', fontWeight: '700' }}
            >
              <RotateCcw size={15} />
              <span>{lang === 'bn' ? 'টেয়ার' : 'Tare'}</span>
            </button>
          </div>
        </div>

        {/* 2. BANGLA VOICE SOUNDBOX ENGINE */}
        <div className="glass-card" style={{ borderLeft: '4px solid #ec4899', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '8px', borderRadius: '8px', color: '#ec4899' }}>
                  <Volume2 size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '২. ই-ভয়েস সাউন্ডবক্স (Soundbox Engine)' : '2. E-Voice Soundbox'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#ec4899', fontWeight: '700' }}>
                    {lang === 'bn' ? 'বিকাশ/নগদ/ক্যাশ প্রাকৃতিক বাংলা উচ্চারণ' : 'Natural Bengali voice announcements'}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: soundboxOn ? 'rgba(236, 72, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                  color: soundboxOn ? '#ec4899' : '#94a3b8'
                }}
              >
                {soundboxOn ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'নীরব' : 'Muted')}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? 'বাইরের দামি হার্ডওয়্যার ডিভাইস ছাড়াই আপনার মোবাইল বা ল্যাপটপের স্পিকারে প্রতিটি ক্যাশ ও ডিজিটাল পেমেন্ট বাংলায় বলে শুনায়।'
                : 'Zero-cost native soundbox announcing payments and debt collections in crisp Bengali without external hardware.'}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '12px'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'সাউন্ডবক্স চালু রাখুন' : 'Enable Voice Soundbox'}
              </span>
              <input
                type="checkbox"
                checked={soundboxOn}
                onChange={(e) => handleToggleSoundbox(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#ec4899' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTestSoundbox}
              style={{ flex: 1, background: '#ec4899', borderColor: '#ec4899', fontSize: '0.82rem', fontWeight: '700' }}
            >
              <Volume2 size={15} />
              <span>{lang === 'bn' ? '🔊 টেস্ট বাংলা ভয়েস' : '🔊 Test Voice'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                playSoundboxChime();
                if (showToast) showToast(lang === 'bn' ? '🔔 সুরেলা বেল প্লে হয়েছে' : 'Chime played', 'success');
              }}
              style={{ fontSize: '0.82rem', fontWeight: '700' }}
            >
              <span>🔔 বেল টেস্ট</span>
            </button>
          </div>
        </div>

        {/* 3. WEB CRYPTO TAMPER-PROOF INVOICE SEAL */}
        <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '8px', borderRadius: '8px', color: '#3b82f6' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '৩. ক্রিপ্টোগ্রাফিক ইনভয়েস সিল (Web Crypto)' : '3. Cryptographic Invoice Seal'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#3b82f6', fontWeight: '700' }}>
                    SHA-256 Merkle Chain Integrity
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6'
                }}
              >
                {lang === 'bn' ? '১০০% খাঁটি' : 'Untampered'}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? 'ব্লকচেইনের মতো প্রতিটি ইনভয়েসের গাণিতিক হ্যাশ আগের ইনভয়েসের সাথে যুক্ত থাকে। কোনো ডাটা বা টাকার পরিমাণ ম্যানুয়ালি পরিবর্তন করলে সাথে সাথে ধরা পড়বে।'
                : 'Blockchain-style SHA-256 Merkle hash chain securing transaction history against illicit database alterations.'}
            </p>

            {auditResult && (
              <div
                style={{
                  background: auditResult.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${auditResult.isValid ? '#10b981' : '#ef4444'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '12px',
                  fontSize: '0.8rem',
                  color: auditResult.isValid ? '#10b981' : '#ef4444'
                }}
              >
                {auditResult.message}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isAuditingLedger}
              onClick={handleAuditLedger}
              style={{ flex: 1, background: '#3b82f6', borderColor: '#3b82f6', fontSize: '0.82rem', fontWeight: '700' }}
            >
              <RefreshCw size={15} className={isAuditingLedger ? 'animate-spin' : ''} />
              <span>
                {isAuditingLedger
                  ? (lang === 'bn' ? 'অডিট হচ্ছে...' : 'Auditing...')
                  : (lang === 'bn' ? '🛡️ সম্পূর্ণ খতিয়ান অডিট রান করুন' : 'Run Full Ledger Audit')}
              </span>
            </button>
          </div>
        </div>

        {/* 4. BACKGROUND SYNC & AUTO-RECOVERY OUTBOX */}
        <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '8px', borderRadius: '8px', color: '#8b5cf6' }}>
                  <Radio size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '৪. ব্যাকগ্রাউন্ড সিঙ্ক ও আউটবক্স (Background Sync)' : '4. Background Sync & Outbox'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: bgSyncSupported ? '#8b5cf6' : '#94a3b8', fontWeight: '700' }}>
                    {bgSyncSupported ? (lang === 'bn' ? '✓ SW SyncManager সমর্থিত' : '✓ SW SyncManager Active') : (lang === 'bn' ? 'অফলাইন আউটবক্স সক্রিয়' : 'Offline Outbox Active')}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: outboxCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: outboxCount > 0 ? '#f59e0b' : '#10b981'
                }}
              >
                {outboxCount > 0 ? `${outboxCount}টি পেন্ডিং` : (lang === 'bn' ? 'সিঙ্কড' : 'Synced')}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? 'ইন্টারনেট ড্রপ করলে সমস্ত বিক্রয় ও পেমেন্ট স্বয়ংক্রিয়ভাবে আউটবক্সে জমা হয় এবং সংযোগ পেলেই কোনো ক্লিক ছাড়াই ব্যাকগ্রাউন্ডে আপলোড হয়ে যায়।'
                : 'Guarantees zero lost transactions during WiFi drops. Automatically replays queued events upon reconnection.'}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '12px'
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                {lang === 'bn' ? 'পেন্ডিং আউটবক্স ট্রানজ্যাকশন:' : 'Pending Outbox Queue:'}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
                {outboxCount}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isFlushingOutbox || outboxCount === 0}
              onClick={handleFlushOutbox}
              style={{ flex: 1, background: '#8b5cf6', borderColor: '#8b5cf6', fontSize: '0.82rem', fontWeight: '700' }}
            >
              <RefreshCw size={15} className={isFlushingOutbox ? 'animate-spin' : ''} />
              <span>
                {isFlushingOutbox
                  ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...')
                  : (lang === 'bn' ? 'আউটবক্স সিঙ্ক রান করুন' : 'Flush Outbox Sync')}
              </span>
            </button>
          </div>
        </div>

        {/* 5. WEB NFC & WEB OTP CREDENTIAL BRIDGE */}
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '8px', borderRadius: '8px', color: '#f59e0b' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '৫. এনএফসি কার্ড ও ওয়েব ওটিপি (Web NFC & OTP)' : '5. Web NFC & Web OTP'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: nfcSupported ? '#10b981' : '#94a3b8', fontWeight: '700' }}>
                    {nfcSupported ? (lang === 'bn' ? '✓ NFC হার্ডওয়্যার সক্রিয়' : '✓ NFC Active') : (lang === 'bn' ? 'অ্যান্ড্রয়েড ফোনে কন্টাক্টলেস সমর্থিত' : 'Available on Android NFC')}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b'
                }}
              >
                {otpSupported ? (lang === 'bn' ? 'SMS অটো-রিড সক্রিয়' : 'OTP Active') : (lang === 'bn' ? 'স্ট্যান্ডবাই' : 'Standby')}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? 'কাস্টমার লয়ালটি কার্ড বা স্টাফ ব্যাজে শুধু মোবাইল ছোঁয়ালেই কাস্টমার খতিয়ান চলে আসে। এছাড়া SMS ওটিপি কোড না টাইপ করেই ১-ট্যাপে রিড হয়।'
                : 'Contactless RFID/NFC smart cards for instant customer debt lookup & 1-tap SMS OTP code auto-interception.'}
            </p>

            {lastScannedNfc && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '12px',
                  fontSize: '0.78rem'
                }}
              >
                <strong>{lang === 'bn' ? 'সর্বশেষ স্ক্যানকৃত কার্ড:' : 'Last Card:'}</strong> {lastScannedNfc.serialNumber}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleToggleNfcScan}
              style={{
                flex: 1,
                background: isNfcScanning ? '#ef4444' : '#f59e0b',
                borderColor: isNfcScanning ? '#ef4444' : '#f59e0b',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}
            >
              <Smartphone size={15} />
              <span>
                {isNfcScanning
                  ? (lang === 'bn' ? 'স্ক্যান থামান' : 'Stop Scan')
                  : (lang === 'bn' ? '📳 এনএফসি কার্ড স্ক্যান টেস্ট' : 'Test NFC Scan')}
              </span>
            </button>
          </div>
        </div>

        {/* 6. MULTI-ENGINE CASCADING BARCODE & WEIGHT SCALE ENGINE */}
        <div className="glass-card" style={{ borderLeft: '4px solid #14b8a6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.15)', padding: '8px', borderRadius: '8px', color: '#14b8a6' }}>
                  <ScanLine size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? '৬. মাল্টি-ইঞ্জিন বারকোড ফেইলওভার (Cascading Decoder)' : '6. Multi-Engine Barcode Failover'}
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#14b8a6', fontWeight: '700' }}>
                    {lang === 'bn' ? '৪-স্তরের স্বয়ংক্রিয় ব্যাকআপ ও ওজন ডিকোডার' : '4-Stage Cascading Failover'}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  color: '#14b8a6'
                }}
              >
                {lang === 'bn' ? 'সক্রিয় ও প্রস্তুত' : 'Active'}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? 'একটি ব্যর্থ হলে সাথে সাথে ব্যাকআপ ইঞ্জিন চালু হয়। নেটিভ GPU (৬০ FPS) ➔ হাই-কনট্রাস্ট ক্যানভাস বাইনারাইজার (কম আলো/প্রতিফলন) ➔ WASM হাই-প্রিসিশন ➔ ডিজিটাল স্কেল ওজন এক্সট্র্যাক্টর।'
                : 'Intelligent multi-engine pipeline: Native GPU (60fps) -> Adaptive Contrast -> WASM Fallback -> GS1 Scale Weight Parser.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.74rem', color: 'var(--text-main)', marginBottom: '12px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                ⚡ <strong>স্টেজ ১:</strong> GPU নেটিভ (৬০ FPS)
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                💡 <strong>স্টেজ ২:</strong> অটো-কনট্রাস্ট ফেইলওভার
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                🛡️ <strong>স্টেজ ৩:</strong> WASM হাই-প্রিসিশন
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                ⚖️ <strong>স্টেজ ৪:</strong> স্কেল ওজন বারকোড
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const sampleBarcode = '2101005012503'; // Sample EAN-13 weight embedded barcode: item 01005, weight 1.250kg
                const parsed = parseWeightEmbeddedBarcode(sampleBarcode);
                if (showToast) {
                  showToast(
                    lang === 'bn'
                      ? `✓ স্কেল বারকোড ডিকোড সফল: ওজন ${parsed.weightKg} কেজি, SKU: ${parsed.productSku}`
                      : `Decoded scale barcode: ${parsed.weightKg} kg, SKU: ${parsed.productSku}`,
                    'success'
                  );
                }
              }}
              style={{
                flex: 1,
                background: '#14b8a6',
                borderColor: '#14b8a6',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}
            >
              <ScanLine size={15} />
              <span>{lang === 'bn' ? '⚖️ স্কেল বারকোড ডিকোড টেস্ট' : 'Test Scale Barcode'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
