import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  QrCode,
  AlertTriangle,
  RotateCcw,
  FileText,
  Cpu,
  Download,
  Check,
  Activity,
  Layers,
  Copy,
  DollarSign,
  Fingerprint
} from 'lucide-react';
import aesEncryptionService from '../../services/aesEncryptionService';
import qrDigitalSignatureService from '../../services/qrDigitalSignatureService';
import fraudDetectionService from '../../services/fraudDetectionService';
import pitrRecoveryService from '../../services/pitrRecoveryService';
import cashDrawerAuditService from '../../services/cashDrawerAuditService';
import nbrVatComplianceService from '../../services/nbrVatComplianceService';
import hardwareFingerprintService from '../../services/hardwareFingerprintService';
import apiShieldRateLimiter from '../../services/apiShieldRateLimiter';

export default function Phase4SecurityHub({ products = [], salesHistory = [], businessSettings = {} }) {
  const [activeTab, setActiveTab] = useState('aes_vault'); // 'aes_vault' | 'qr_signature' | 'fraud_drawer' | 'pitr_timetravel' | 'nbr_hardware'

  // 1. AES Encryption State
  const [rawTextToEncrypt, setRawTextToEncrypt] = useState('গোপনীয় বিক্রয় ডেটা ও ক্যাশিয়ার খতিয়ান');
  const [passphrase, setPassphrase] = useState('MasterSecretPass123!');
  const [encryptedVault, setEncryptedVault] = useState('');
  const [decryptedResult, setDecryptedResult] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  // 2. QR Digital Signature State
  const [testInvoiceNo, setTestInvoiceNo] = useState('INV-2026-9042');
  const [testAmount, setTestAmount] = useState('1450');
  const [signatureOutput, setSignatureOutput] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState(null);

  // 3. Fraud & Drawer State
  const [fraudAlerts, setFraudAlerts] = useState(() => fraudDetectionService.getAlerts());
  const [drawerEvents, setDrawerEvents] = useState(() => cashDrawerAuditService.getEvents());

  // 4. PITR Snapshots State
  const [snapshots, setSnapshots] = useState(() => pitrRecoveryService.getSnapshots());
  const [restoreMessage, setRestoreMessage] = useState('');

  // 5. NBR & Hardware State
  const [mushakPreview, setMushakPreview] = useState(null);
  const [hardwareNodeId, setHardwareNodeId] = useState('লোড হচ্ছে...');
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    // Generate initial QR signature
    qrDigitalSignatureService.generateReceiptSignature({
      invoiceNo: testInvoiceNo,
      totalAmount: testAmount
    }).then(setSignatureOutput);

    // Initial NBR Mushak 6.3 preview
    const msk = nbrVatComplianceService.generateMushak63Challan(
      { invoiceNo: testInvoiceNo, total: testAmount, items: [{ name: 'প্যারাসিটামল ৫০০মিগ্রা', qty: 2, price: 30 }] },
      businessSettings
    );
    setMushakPreview(msk);

    // Generate hardware fingerprint
    hardwareFingerprintService.generateDeviceFingerprint().then(res => {
      setHardwareNodeId(res.machineNodeId);
    });

    const unsubFraud = fraudDetectionService.subscribe(setFraudAlerts);
    const unsubDrawer = cashDrawerAuditService.subscribe(setDrawerEvents);

    return () => {
      unsubFraud();
      unsubDrawer();
    };
  }, [testInvoiceNo, testAmount, businessSettings]);

  const handleEncryptData = async () => {
    setIsEncrypting(true);
    try {
      const res = await aesEncryptionService.encryptData(rawTextToEncrypt, passphrase);
      setEncryptedVault(res.vaultPayload);
      setDecryptedResult('');
    } catch (e) {
      alert(e.message);
    }
    setIsEncrypting(false);
  };

  const handleDecryptData = async () => {
    try {
      const res = await aesEncryptionService.decryptData(encryptedVault, passphrase);
      setDecryptedResult(typeof res === 'object' ? JSON.stringify(res, null, 2) : res);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDownloadVaultFile = async () => {
    const fullBackup = {
      store: businessSettings.businessName || 'HisabKitab 360',
      exportedAt: new Date().toISOString(),
      productsCount: products.length,
      salesCount: salesHistory.length,
      sampleSales: salesHistory.slice(0, 5)
    };
    const vaultStr = await aesEncryptionService.exportZeroKnowledgeBackup(fullBackup, passphrase);
    const blob = new Blob([vaultStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup_${Date.now()}.hk360vault`;
    a.click();
  };

  const handleTestVerifySignature = async () => {
    if (!signatureOutput) return;
    const res = await qrDigitalSignatureService.verifySignature(
      { invoiceNo: testInvoiceNo, totalAmount: testAmount },
      signatureOutput.signature
    );
    setVerifyStatus(res);
  };

  const handleRestorePitr = (snap) => {
    const res = pitrRecoveryService.restoreSnapshot(snap.id);
    setRestoreMessage(res.message);
    setTimeout(() => setRestoreMessage(''), 3500);
  };

  return (
    <div style={{ padding: '12px 8px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ======================================================== */}
      {/* HERO BANNER & SECURITY POSTURE HUD                      */}
      {/* ======================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1.5px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '16px',
        padding: '18px 20px',
        marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)' }}>
                  ফেজ ৪: এন্টারপ্রাইজ সিকিউরিটি ও কমপ্লায়েন্স হাব
                </h2>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  টিপস ৩১ - ৪০ সক্রিয়
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
                AES-256-GCM এনক্রিপশন, কিউআর ডিজিটাল সিগনেচার, ফ্রড ডিটেক্টর, PITR টাইম ট্রাভেল ও এনবিআর মূসক ৬.৩।
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              <Fingerprint size={13} />
              হার্ডওয়্যার নোড: {hardwareNodeId}
            </span>
          </div>
        </div>

        {/* 4 Security KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={13} style={{ color: '#10b981' }} /> AES-256-GCM ভল্ট
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              সক্রিয় ও লকড
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>জিরো-নলেজ সিকিউরিটি</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <QrCode size={13} style={{ color: '#38bdf8' }} /> রসিদ সিগনেচার
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              HMAC-SHA256
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>নকল রসিদ প্রতিরোধক</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={13} style={{ color: '#f59e0b' }} /> ফ্রড অ্যালার্ট
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {fraudAlerts.filter(a => a.status === 'unresolved').length}টি সক্রিয়
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ক্যাশিয়ার অসততা ট্র্যাকার</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={13} style={{ color: '#a855f7' }} /> PITR স্ন্যাপশট
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
              {snapshots.length}টি টাইম-পয়েন্ট
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>১-ক্লিক টাইম ট্রাভেল</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TABS NAVIGATION                                      */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))'
      }}>
        {[
          { id: 'aes_vault', label: '১. AES-256 ও জিরো-নলেজ ব্যাকআপ (Tips 31, 33)', icon: Lock },
          { id: 'qr_signature', label: '২. কিউআর ডিজিটাল সিগনেচার (Tip 32)', icon: QrCode },
          { id: 'fraud_drawer', label: '৩. ফ্রড ডিটেক্টর ও ড্রয়ার অডিট (Tips 34, 37)', icon: AlertTriangle },
          { id: 'pitr_timetravel', label: '৪. PITR টাইম-ট্রাভেল রিকভারি (Tip 36)', icon: RotateCcw },
          { id: 'nbr_hardware', label: '৫. এনবিআর মূসক ৬.৩ ও হার্ডওয়্যার লক (Tips 38, 39, 40)', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: isActive ? '1.5px solid #10b981' : '1px solid transparent',
                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#34d399' : 'var(--text-main, #f8fafc)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: AES-256 & ZERO KNOWLEDGE VAULT                    */}
      {/* ======================================================== */}
      {activeTab === 'aes_vault' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} style={{ color: '#10b981' }} /> AES-256-GCM লোকাল ভল্ট এনক্রিপশন ল্যাব
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
              পাসফ্রেজ ছাড়া ক্লাউড প্রোভাইডার বা সফটওয়্যার ডেভেলপার কারো পক্ষেই এই এনক্রিপ্ট করা ডেটা ওপেন করা অসম্ভব।
            </p>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                মাস্টার এনক্রিপশন পাসফ্রেজ (Master Passphrase):
              </label>
              <input
                type="text"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '4px' }}>
                টেস্ট ডেটা:
              </label>
              <input
                type="text"
                value={rawTextToEncrypt}
                onChange={e => setRawTextToEncrypt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={handleEncryptData}
                disabled={isEncrypting}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                🔒 এনক্রিপ্ট করুন
              </button>
              {encryptedVault && (
                <button
                  onClick={handleDecryptData}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  🔓 ডিক্রিপ্ট করুন
                </button>
              )}
            </div>

            {encryptedVault && (
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                  এনক্রিপ্ট করা পেলোড (AES-256 Ciphertext):
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: '#090d16',
                  color: '#34d399',
                  fontFamily: 'monospace',
                  fontSize: '0.68rem',
                  wordBreak: 'break-all',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}>
                  {encryptedVault}
                </div>
              </div>
            )}

            {decryptedResult && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#10b981', marginBottom: '4px' }}>
                  ✓ ডিক্রিপ্ট করা মূল ডেটা:
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'white',
                  fontSize: '0.78rem'
                }}>
                  {decryptedResult}
                </div>
              </div>
            )}
          </div>

          {/* Zero-Knowledge Cold Storage Export */}
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} style={{ color: '#10b981' }} /> জিরো-নলেজ ব্যাকআপ ফাইল (.hk360vault)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
              পুরো স্টোরের ডেটা আপনার নিজস্ব পাসওয়ার্ড দিয়ে এনক্রিপ্ট হয়ে একটি সুরক্ষিত ফাইলে ডাউনলোড হবে।
            </p>
            <button
              onClick={handleDownloadVaultFile}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Download size={16} /> 🛡️ .hk360vault ব্যাকআপ ডাউনলোড
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QR DIGITAL SIGNATURE                              */}
      {/* ======================================================== */}
      {activeTab === 'qr_signature' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={18} style={{ color: '#38bdf8' }} /> রসিদ ডিজিটাল সিগনেচার ল্যাব (HMAC-SHA256)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
              রসিদের কিউআর কোডে ক্রিপ্টোগ্রাফিক ডিজিটাল সই যুক্ত থাকে, যা স্ক্যান করলেই বোঝা যায় রসিদটি আসল নাকি জাল।
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '4px' }}>ইনভয়েস নম্বর:</label>
                <input
                  type="text"
                  value={testInvoiceNo}
                  onChange={e => setTestInvoiceNo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', display: 'block', marginBottom: '4px' }}>মোট বিল (৳):</label>
                <input
                  type="text"
                  value={testAmount}
                  onChange={e => setTestAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {signatureOutput && (
              <div style={{ padding: '12px', borderRadius: '8px', background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ক্রিপ্টোগ্রাফিক কিউআর সিগনেচার:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', marginTop: '4px' }}>
                  {signatureOutput.signature}
                </div>
              </div>
            )}

            <button
              onClick={handleTestVerifySignature}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: '#38bdf8',
                color: '#090d16',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ✓ সিগনেচারের সত্যতা যাচাই টেস্ট
            </button>

            {verifyStatus && (
              <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: verifyStatus.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: verifyStatus.isValid ? '#34d399' : '#f87171', fontSize: '0.78rem', fontWeight: 700 }}>
                {verifyStatus.isValid ? '✓ রসিদটি শতভাগ আসল ও অপরিবর্তিত (Verified Authentic)' : '⚠️ জাল বা পরিবর্তিত রসিদ শনাক্ত হয়েছে!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: FRAUD DETECTION & CASH DRAWER AUDIT               */}
      {/* ======================================================== */}
      {activeTab === 'fraud_drawer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Fraud Alerts Feed */}
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> সন্দেহজনক কার্যকলাপ অ্যালার্ট (Fraud Detector)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {fraudAlerts.map(alt => (
                <div key={alt.id} style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: '#fbbf24' }}>{alt.cashier}</span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{new Date(alt.timestamp).toLocaleTimeString('bn-BD')}</span>
                  </div>
                  <div style={{ color: 'var(--text-main, #f8fafc)', lineHeight: 1.4 }}>
                    {alt.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Drawer Anti-Theft Audit */}
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} /> ক্যাশ ড্রয়ার ফিজিক্যাল ইভেন্ট অডিট লগ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {drawerEvents.map(evt => (
                <div key={evt.id} style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.76rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main, #f8fafc)' }}>
                      {evt.reason}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {evt.cashier} | {new Date(evt.timestamp).toLocaleTimeString('bn-BD')}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: evt.amount > 0 ? '#10b981' : '#64748b' }}>
                    {evt.amount > 0 ? `৳${evt.amount}` : 'ড্রয়ার ওপেন'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: POINT-IN-TIME RECOVERY (PITR)                     */}
      {/* ======================================================== */}
      {activeTab === 'pitr_timetravel' && (
        <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} style={{ color: '#a855f7' }} /> পয়েন্ট-ইন-টাইম রিকভারি (PITR টাইম-ট্রাভেল)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '14px' }}>
            ভুলবশত বড় কোনো এন্ট্রি বিকৃত হলে বা ভুল ডাটা ডিলিট হলে অতীতের যেকোনো সুনির্দিষ্ট মিনিটের অবস্থায় ১-ক্লিকে ফিরে যাওয়ার সুবিধা।
          </p>

          {restoreMessage && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid #a855f7', color: '#c084fc', fontSize: '0.82rem', fontWeight: 800, marginBottom: '14px' }}>
              ✓ {restoreMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {snapshots.map(snap => (
              <div key={snap.id} style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                    {snap.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    সময়: {new Date(snap.timestamp).toLocaleTimeString('bn-BD')} | ইনভয়েস: {snap.totalInvoices}টি | রেভিনিউ: ৳{snap.totalRevenue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#a855f7', fontFamily: 'monospace', marginTop: '4px' }}>
                    {snap.integrityHash}
                  </div>
                </div>
                <button
                  onClick={() => handleRestorePitr(snap)}
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid #a855f7',
                    color: '#c084fc',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏮️ এই সময়ের স্ন্যাপশটে রোলব্যাক করুন
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: NBR VAT MUSHAK 6.3 & HARDWARE LICENSE LOCK        */}
      {/* ======================================================== */}
      {activeTab === 'nbr_hardware' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* NBR Mushak 6.3 Standard Format */}
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: '#10b981' }} /> জাতীয় রাজস্ব বোর্ড (NBR) মূসক-৬.৩ চালানপত্র
            </h3>
            {mushakPreview && (
              <div style={{ padding: '12px', borderRadius: '8px', background: '#090d16', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                  {mushakPreview.title}
                </div>
                <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 700, marginBottom: '10px' }}>
                  {mushakPreview.formName}
                </div>
                <div style={{ color: 'var(--text-muted, #94a3b8)', lineHeight: 1.6 }}>
                  <div>প্রতিষ্ঠান: <strong style={{ color: 'white' }}>{mushakPreview.registeredName}</strong></div>
                  <div>বিআইএন (BIN): <strong style={{ color: '#38bdf8' }}>{mushakPreview.bin}</strong></div>
                  <div>চালানপত্র নং: {mushakPreview.challanNo} | তারিখ: {mushakPreview.issueDate}</div>
                  <div>মোট মূল্য: ৳{mushakPreview.summary.subtotal} | ভ্যাট (৫%): ৳{mushakPreview.summary.vatAmount}</div>
                  <div>সর্বমোট প্রদেয়: <strong style={{ color: '#10b981' }}>৳{mushakPreview.summary.grandTotal}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Hardware Lock */}
          <div style={{ background: 'var(--card-bg, #1e293b)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #f8fafc)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} style={{ color: '#38bdf8' }} /> অফলাইন হার্ডওয়্যার নোড ফিঙ্গারপ্রিন্ট
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '12px' }}>
              সফটওয়্যার পাইরেসি প্রতিরোধে ডিভাইস মাদারবোর্ড ও সিপিইউ এর সাথে লাইসেন্স কি আবদ্ধ থাকে।
            </p>
            <div style={{ padding: '12px', borderRadius: '8px', background: '#090d16', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ডিভাইস মেশিন আইডি:</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
                {hardwareNodeId}
              </div>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
              ✓ লাইসেন্স এই মেশিনের সাথে সম্পূর্ণ লকড ও সুরক্ষিত
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
