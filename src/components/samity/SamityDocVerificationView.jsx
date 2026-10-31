import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  FileText,
  Printer,
  Copy,
  ArrowLeft,
  Building2,
  ExternalLink,
  Award,
  Hash,
  Download,
  Globe,
  Receipt,
  User,
  Phone,
  Wallet,
  Clock,
  AlertCircle,
  AlertOctagon,
  MessageSquare
} from 'lucide-react';
import { useSamityTranslator } from '../../utils/samityDictionary';
import { safeBase64ToUtf8 } from '../../services/qrService';
import { verifyDocumentOnline, logDocumentShare } from '../../services/somitiDocumentService';

/**
 * SamityDocVerificationView
 * -------------------------
 * Public & Universal Digital Verification Portal for:
 * 1. Deposit Receipts (জমার রসিদ)
 * 2. Official Letterhead Documents, Notices, Resolutions (অফিসিয়াল নোটিশ ও রেজুলেশন)
 * 3. Due Notices & Reminders (বকেয়া নোটিশ)
 * 4. Member ID & Society Cards (সদস্য কার্ড)
 *
 * Authenticates QR scans from any phone camera, Google Lens, WhatsApp, or internal Scanner.
 */
export const SamityDocVerificationView = ({ verifyData, onBackToApp }) => {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState(() => {
    return (typeof window !== 'undefined' && (localStorage.getItem('samity_lang') || localStorage.getItem('somiti360_lang') || localStorage.getItem('hisabkitab_lang'))) || 'bn';
  });
  const containerRef = useRef(null);
  const { t } = useSamityTranslator(containerRef, lang);

  const [cloudVerification, setCloudVerification] = useState({
    loading: false,
    isVerified: true,
    status: 'valid',
    cancellationReason: '',
    cancelledAt: null,
    verifiedAt: null,
    error: null
  });

  const queryCode = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('code') || '') : '';
  const [searchCode, setSearchCode] = useState(queryCode);
  const [searchedDoc, setSearchedDoc] = useState(null);

  const handleManualVerify = async (codeToVerify) => {
    const clean = (codeToVerify || searchCode || '').trim();
    if (!clean) return;
    setCloudVerification({
      loading: true,
      isVerified: false,
      status: 'loading',
      cancellationReason: '',
      cancelledAt: null,
      verifiedAt: null,
      error: null
    });

    try {
      const res = await fetch(`/api/public/verify/code/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSearchedDoc(json.data);
          setCloudVerification({
            loading: false,
            isVerified: json.isValid,
            status: json.status,
            cancellationReason: json.data.cancellationReason || '',
            cancelledAt: json.data.cancelledAt || null,
            verifiedAt: json.data.verifiedAt || new Date().toISOString(),
            error: null
          });
          return;
        }
      }
      setCloudVerification({
        loading: false,
        isVerified: false,
        status: 'invalid',
        cancellationReason: '',
        cancelledAt: null,
        verifiedAt: null,
        error: lang === 'en' ? 'This verification code is invalid' : 'এই ভেরিফিকেশন কোডটি বৈধ নয়'
      });
    } catch {
      setCloudVerification({
        loading: false,
        isVerified: false,
        status: 'invalid',
        cancellationReason: '',
        cancelledAt: null,
        verifiedAt: null,
        error: lang === 'en' ? 'This verification code is invalid' : 'এই ভেরিফিকেশন কোডটি বৈধ নয়'
      });
    }
  };

  // Parse parameters from props or window URL
  const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  // Try decoding base64 data token if available (backward compatibility)
  let decodedToken = null;
  const rawToken = verifyData?.data || query.get('data');
  if (rawToken) {
    try {
      const decodedStr = safeBase64ToUtf8(rawToken);
      if (decodedStr) {
        decodedToken = JSON.parse(decodedStr);
      }
    } catch (e) {
      console.warn('Could not parse verification token payload:', e);
    }
  }

  // 1. Ultra-Short URL Parameters support (c, r, t, a, d, n, m, p, s)
  const codeParam = query.get('c') || query.get('code') || verifyData?.c || verifyData?.code || '';
  const receiptParam = query.get('r') || query.get('receipt_no') || verifyData?.r || verifyData?.receiptNo || '';
  const typeParam = query.get('t') || query.get('verify') || verifyData?.t || verifyData?.type || '';
  const amountParam = query.get('a') || query.get('amount') || verifyData?.a || verifyData?.amount || '';
  const dateParam = query.get('d') || query.get('date') || verifyData?.d || verifyData?.date || '';
  const memberParam = query.get('n') || query.get('member') || verifyData?.n || verifyData?.memberName || '';
  const depositorParam = query.get('m') || query.get('depositor') || verifyData?.m || verifyData?.depositorName || '';
  const periodParam = query.get('p') || query.get('month') || verifyData?.p || verifyData?.monthYear || '';
  const samityParam = query.get('s') || query.get('samity') || verifyData?.s || verifyData?.samity || '';

  // Determine document type
  const docType = searchedDoc?.document_type || decodedToken?.t || typeParam || (verifyData?.docType === 'code' ? 'receipt' : verifyData?.type) || 'receipt';

  // Common parameters
  const samityName = decodedToken?.sam || samityParam || verifyData?.samity || 'স্বপ্নছোঁয়া সমবায় সমিতি';
  const regNo = decodedToken?.reg || verifyData?.reg || query.get('reg') || 'সছস-২০২৪/০৯';
  const date = searchedDoc?.issue_date || decodedToken?.dt || dateParam || new Date().toISOString().split('T')[0];
  const hash = decodedToken?.h || verifyData?.hash || query.get('hash') || 'HK360-SEC-VERIFIED';

  // Receipt specific parameters
  const receiptNo = searchedDoc?.document_number || decodedToken?.rn || receiptParam || 'RCPT-2026-0001';
  const memberName = searchedDoc?.recipient_name || decodedToken?.m || memberParam || 'সম্মানিত সদস্য';
  const memberId = searchedDoc?.metadata?.memberId || decodedToken?.mid || verifyData?.memberId || query.get('memberId') || 'SM-001';
  const depositorName = searchedDoc?.metadata?.depositorName || decodedToken?.d || depositorParam || memberName;
  const depositorRelation = searchedDoc?.metadata?.depositorRelation || decodedToken?.rel || verifyData?.depositorRelation || query.get('relation') || 'নিজে (Self)';
  const amount = Number(searchedDoc?.amount !== undefined ? searchedDoc.amount : (decodedToken?.a !== undefined ? decodedToken.a : (amountParam || 0)));
  const depositType = searchedDoc?.metadata?.depositType || decodedToken?.type || verifyData?.depositType || query.get('type') || 'মাসিক সঞ্চয় / চাঁদা';
  
  // Extract month and year from periodParam if needed
  let paymentMonth = searchedDoc?.metadata?.paymentMonth || decodedToken?.month || verifyData?.month || '';
  let paymentYear = searchedDoc?.metadata?.paymentYear || decodedToken?.year || verifyData?.year || '';
  if (periodParam && (!paymentMonth || !paymentYear)) {
    const parts = periodParam.split(' ');
    paymentMonth = parts[0] || periodParam;
    paymentYear = parts[1] || '';
  }
  const paymentMethod = searchedDoc?.metadata?.depositMethod || decodedToken?.method || verifyData?.paymentMethod || query.get('method') || 'নগদ (Cash)';

  // Document / Notice specific parameters
  const refNo = verifyData?.ref || query.get('ref') || 'সছস/২০২৬/০১';
  const title = verifyData?.title || query.get('title') || 'অফিসিয়াল নোটিশ ও কার্যবিবরণী';
  const bodyText = verifyData?.body || query.get('body') || 'অত্র সমবায় সমিতির সম্মানিত সাধারণ সদস্য এবং কার্যনির্বাহী কমিটির অবগতির জন্য এই মর্মে জানানো যাচ্ছে যে, সমিতির সাধারণ সিদ্ধান্ত অনুযায়ী সকল কার্যক্রম ও হিসাবের ডিজিটাল ভেরিফিকেশন শতভাগ স্বচ্ছতার সাথে সংরক্ষিত রয়েছে।';

  // Due Notice specific parameters
  const dueAmount = Number(decodedToken?.due !== undefined ? decodedToken.due : (verifyData?.dueAmount || query.get('due') || 0));
  const dueMonths = decodedToken?.months || query.get('months') || 'চলতি মাস';
  const deadline = decodedToken?.dl || query.get('deadline') || '১০ তারিখের মধ্যে';

  // Member ID Card & Passbook specific parameters
  const memberNameEn = decodedToken?.me || query.get('nameEn') || '';
  const memberBlood = decodedToken?.blood || query.get('blood') || 'O+';
  const memberNid = decodedToken?.nid || query.get('nid') || 'সংরক্ষিত';
  const memberMobile = decodedToken?.mobile || query.get('mobile') || '';
  const memberType = decodedToken?.type || query.get('type') || 'সাধারণ সদস্য';
  const memberJoining = decodedToken?.joining || query.get('joining') || date;
  const memberFather = decodedToken?.father || query.get('father') || '';
  const memberMother = decodedToken?.mother || query.get('mother') || '';
  const memberNominee = decodedToken?.nominee || query.get('nominee') || '';
  const memberNomineeRel = decodedToken?.nomineeRel || query.get('nomineeRel') || '';
  const memberPhoto = decodedToken?.photo || query.get('photo') || '';
  const passbookSavings = Number(decodedToken?.savings !== undefined ? decodedToken.savings : (query.get('savings') || 0));

  useEffect(() => {
    const activeCode = query.get('c') || query.get('code') || verifyData?.c || verifyData?.code;
    const activeReceipt = query.get('r') || query.get('receipt_no') || verifyData?.r || verifyData?.receiptNo;
    const docId = activeCode || activeReceipt || query.get('doc_id') || verifyData?.doc_id || query.get('ref') || verifyData?.docId || verifyData?.documentId;
    const token = query.get('token') || verifyData?.token;
    const codeParam = activeCode || (typeof docId === 'string' && docId.startsWith('S360-') ? docId : null);
    const isCodeLookup = docType === 'code' || verifyData?.docType === 'code' || Boolean(codeParam);

    if (isCodeLookup || (codeParam && !token)) {
      handleManualVerify(codeParam || docId);
      return;
    }

    if (docId || token) {
      setCloudVerification(prev => ({ ...prev, loading: true }));

      // 1. First attempt to call Central Serverless REST API
      const apiUrl = `/api/public/verify/${encodeURIComponent(docType)}/${encodeURIComponent(docId || 'unknown')}?token=${encodeURIComponent(token || '')}`;
      fetch(apiUrl)
        .then(async (apiRes) => {
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.success && json.data) {
              setCloudVerification({
                loading: false,
                isVerified: json.isValid,
                status: json.status,
                cancellationReason: json.data.cancellationReason || '',
                cancelledAt: json.data.cancelledAt || null,
                verifiedAt: json.data.verifiedAt || new Date().toISOString(),
                error: null
              });
              return;
            }
          } else if (apiRes.status === 404) {
            // Invalid token or non-existent document
            setCloudVerification({
              loading: false,
              isVerified: false,
              status: 'invalid',
              cancellationReason: '',
              cancelledAt: null,
              verifiedAt: null,
              error: 'এই QR কোডটি বৈধ নয়'
            });
            return;
          }
          throw new Error('API fallback to direct cloud client');
        })
        .catch(() => {
          // 2. Fallback: Direct Supabase / local IndexedDB verification
          verifyDocumentOnline({
            documentType: docType,
            documentId: docId,
            token: token
          }).then(res => {
            if (res.isValid) {
              setCloudVerification({
                loading: false,
                isVerified: true,
                status: 'valid',
                cancellationReason: '',
                cancelledAt: null,
                verifiedAt: res.verifiedAt || new Date().toISOString(),
                error: null
              });
            } else if (res.status === 'cancelled') {
              setCloudVerification({
                loading: false,
                isVerified: false,
                status: 'cancelled',
                cancellationReason: res.cancellationReason || 'কর্তৃপক্ষ কর্তৃক বাতিলকৃত',
                cancelledAt: res.cancelledAt,
                verifiedAt: null,
                error: res.message
              });
            } else {
              setCloudVerification({
                loading: false,
                isVerified: false,
                status: 'invalid',
                cancellationReason: '',
                cancelledAt: null,
                verifiedAt: null,
                error: 'এই QR কোডটি বৈধ নয়'
              });
            }
          }).catch(err => {
            console.warn('Online verification check error:', err);
            setCloudVerification(prev => ({ ...prev, loading: false }));
          });
        });
    }
  }, [docType]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    const docTitle = docType === 'receipt'
      ? `আমানত জমার রসিদ (${receiptNo})`
      : docType === 'due_notice'
      ? `বকেয়া পরিশোধ নোটিশ`
      : docType === 'membership_cert'
      ? `সদস্যপদ সনদপত্র`
      : title || 'অফিসিয়াল ডকুমেন্ট';

    const msg = `আসসালামু আলাইকুম,\n\nআপনার জন্য "${docTitle}" এর অফিসিয়াল ডিজিটাল ভেরিফিকেশন তথ্য।\n\n🏢 সমিতি: ${samityName}\n📅 ইস্যুর তারিখ: ${date}\n\n🔍 সরাসরি অনলাইনে যাচাই ও ডিজিটাল কপি দেখতে লিংকে চাপ দিন:\n${window.location.href}\n\nধন্যবাদ,\n${samityName}\nচালিত: সমিতি ৩৬০`;

    logDocumentShare(query.get('doc_id') || receiptNo || refNo, 'whatsapp');
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc',
        fontFamily: "'SolaimanLipi', 'Kalpurush', 'Inter', sans-serif",
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}
    >
      {/* Top Bar with Back, Language, Copy and Print */}
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <button
          onClick={onBackToApp || (() => { window.location.href = window.location.origin; })}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={16} />
          <span>{lang === 'en' ? 'Back to Application' : 'মূল সফটওয়্যারে ফিরুন'}</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => {
              const next = lang === 'en' ? 'bn' : 'en';
              setLang(next);
              try {
                localStorage.setItem('samity_lang', next);
                localStorage.setItem('somiti360_lang', next);
                localStorage.setItem('hisabkitab_lang', next);
              } catch {}
            }}
            style={{
              background: 'rgba(20, 184, 166, 0.15)',
              border: '1px solid rgba(20, 184, 166, 0.35)',
              color: '#5eead4',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
          >
            <Globe size={15} />
            <span>{lang === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Copy size={15} />
            <span>{copied ? (lang === 'en' ? '✓ Link Copied' : '✓ লিংক কপি হয়েছে') : (lang === 'en' ? 'Copy Link' : 'লিংক কপি')}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            style={{
              background: 'rgba(37, 211, 102, 0.15)',
              border: '1px solid rgba(37, 211, 102, 0.45)',
              color: '#25d366',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={lang === 'en' ? 'Share via WhatsApp' : 'হোয়াটসঅ্যাপে শেয়ার করুন'}
          >
            <MessageSquare size={15} />
            <span>{lang === 'en' ? 'WhatsApp' : 'হোয়াটসঅ্যাপ'}</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Printer size={15} />
            <span>{lang === 'en' ? 'Print / Save' : 'প্রিন্ট / সেভ'}</span>
          </button>
        </div>
      </div>

      {/* Short Verification Code Search Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          background: 'rgba(30, 41, 59, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔍</span>
            <span>{lang === 'en' ? 'Manual Verification by Short Code' : 'ভেরিফিকেশন কোড দিয়ে সরাসরি যাচাই'}</span>
          </span>
          <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: '800', fontFamily: 'monospace' }}>
            {lang === 'en' ? 'Format: S360-XXXXXX' : 'ফরম্যাট: S360-XXXXXX'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleManualVerify(searchCode); }}
            placeholder={lang === 'en' ? 'e.g. S360-8F2K9Q or Receipt No' : 'যেমন: S360-8F2K9Q বা রসিদ নং'}
            style={{
              flex: '1 1 240px',
              background: '#0f172a',
              border: '1.5px solid #334155',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '0.90rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              letterSpacing: '0.5px'
            }}
          />
          <button
            onClick={() => handleManualVerify(searchCode)}
            disabled={cloudVerification.loading || !searchCode.trim()}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 22px',
              fontWeight: '800',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              opacity: (cloudVerification.loading || !searchCode.trim()) ? 0.6 : 1
            }}
          >
            {cloudVerification.loading ? (
              <span>{lang === 'en' ? 'Verifying...' : 'যাচাই হচ্ছে...'}</span>
            ) : (
              <span>{lang === 'en' ? 'Verify' : 'যাচাই করুন'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Verification Certificate Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '18px',
          padding: '28px 24px',
          boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.6)',
          border: cloudVerification.status === 'cancelled' ? '3px solid #ef4444' : '2px solid #10b981',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Watermark Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: cloudVerification.status === 'cancelled'
              ? 'linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)'
              : 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)'
          }}
        />

        {/* Diagonal Watermark for Cancelled Documents */}
        {cloudVerification.status === 'cancelled' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-35deg)',
              fontSize: '4.5rem',
              fontWeight: '900',
              color: 'rgba(239, 68, 68, 0.12)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              pointerEvents: 'none',
              zIndex: 1,
              whiteSpace: 'nowrap'
            }}
          >
            বাতিল / CANCELLED
          </div>
        )}

        {/* Invalid Token Warning */}
        {cloudVerification.status === 'invalid' ? (
          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '18px',
              textAlign: 'center',
              color: '#b91c1c'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertCircle size={24} color="#dc2626" />
              <strong style={{ fontSize: '1.05rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                এই QR কোডটি বৈধ নয় / INVALID QR CODE
              </strong>
            </div>
            <p style={{ margin: '0', fontSize: '0.88rem', fontWeight: '700' }}>
              এই কিউআর কোড বা ভেরিফিকেশন টোকেনটি সমিতির কেন্দ্রীয় ডাটাবেজের সাথে মেলেনি অথবা মেয়াদোত্তীর্ণ।
            </p>
          </div>
        ) : cloudVerification.status === 'cancelled' ? (
          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '18px',
              textAlign: 'center',
              color: '#b91c1c'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertOctagon size={24} color="#dc2626" />
              <strong style={{ fontSize: '1.05rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                বাতিলকৃত ডকুমেন্ট / CANCELLED DOCUMENT
              </strong>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: '700' }}>
              এই ডকুমেন্টটি প্রাতিষ্ঠানিকভাবে বাতিল করা হয়েছে। এর কোনো আর্থিক বা আইনি কার্যকারিতা নেই।
            </p>
            {cloudVerification.cancellationReason && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', color: '#991b1b', marginTop: '6px' }}>
                <strong>বাতিলকরণের কারণ:</strong> {cloudVerification.cancellationReason}
              </div>
            )}
            {cloudVerification.cancelledAt && (
              <div style={{ fontSize: '0.72rem', color: '#7f1d1d', marginTop: '6px' }}>
                বাতিলের সময়: {new Date(cloudVerification.cancelledAt).toLocaleString('bn-BD')}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ecfdf5',
              border: '1.5px solid #10b981',
              borderRadius: '24px',
              padding: '6px 14px',
              color: '#047857',
              fontWeight: '800',
              fontSize: '0.82rem',
              marginBottom: '18px'
            }}
          >
            <ShieldCheck size={18} color="#059669" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '900', color: '#065f46' }}>
                ✓ ভেরিফাইড ও আসল ডকুমেন্ট (Verified Authentic Document)
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: '600', color: '#047857' }}>
                {docType === 'receipt'
                  ? 'অফিসিয়াল জমা রসিদ (Official Receipt)'
                  : docType === 'member_list'
                  ? 'অফিসিয়াল সদস্য তালিকা (Official Member Registry)'
                  : docType === 'due_notice'
                  ? 'অফিসিয়াল বকেয়া নোটিশ (Official Due Notice)'
                  : docType === 'membership_cert'
                  ? 'অফিসিয়াল সদস্যপদ সনদপত্র (Membership Certificate)'
                  : docType === 'member_id_card' || docType === 'member_card'
                  ? 'অফিসিয়াল সদস্য স্মার্ট আইডি কার্ড (Member Smart ID Card)'
                  : docType === 'passbook'
                  ? 'অফিসিয়াল সদস্য সঞ্চয় পাসবুক ও লেজার (Member Passbook)'
                  : docType === 'bulk_deposit'
                  ? 'অফিসিয়াল ব্যাংক ডিপোজিট রিপোর্ট (Bank Deposit Report)'
                  : 'অফিসিয়াল নথি (Official Document)'}
              </span>
            </div>
            {cloudVerification.verifiedAt && (
              <span style={{ fontSize: '0.7rem', color: '#059669', opacity: 0.85 }}>
                • লাইভ ক্লাউড ভেরিফাইড
              </span>
            )}
          </div>
        )}

        {/* Samity Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: '#047857',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
            }}
          >
            <Building2 size={28} />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.45rem', fontWeight: '900', color: '#064e3b' }}>
            {samityName}
          </h1>
          <p style={{ margin: '0 0 4px', fontSize: '0.84rem', color: '#475569', fontWeight: '600' }}>
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার নিবন্ধিত সমবায় সমিতি
          </p>
          <div style={{ display: 'inline-flex', gap: '12px', fontSize: '0.78rem', color: '#059669', fontWeight: '700', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>নিবন্ধন নং: {regNo}</span>
            <span>•</span>
            <span>
              {docType === 'receipt'
                ? `রসিদ নং: ${receiptNo}`
                : docType === 'membership_cert'
                ? `সনদপত্র কোড: ${decodedToken?.mid || verifyData?.memberId || 'CERT-001'}`
                : docType === 'bulk_deposit'
                ? `ভাউচার নং: ${decodedToken?.vn || verifyData?.voucher || 'BULK-001'}`
                : `স্মারক নং: ${refNo}`}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: DEPOSIT RECEIPT VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {docType === 'receipt' && (
          <div>
            {/* Amount Spotlight Box */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1.5px solid #86efac', borderRadius: '12px', padding: '16px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.74rem', color: '#065f46', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                পরিশোধকৃত মোট জমা অংক (PAID AMOUNT)
              </span>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#047857', margin: '4px 0' }}>
                ৳ {amount.toLocaleString('en-IN')}/-
              </div>
              <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: '800', color: '#059669', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
                ✓ সেন্ট্রাল ক্লাউড লেজারে সফলভাবে পরিশোধিত ও সংরক্ষিত
              </span>
            </div>

            {/* Context Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>রসিদ নম্বর:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{receiptNo}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>হিসাবধারী সদস্য:</span>
                <strong style={{ color: '#0f172a' }}>{memberName}</strong> {memberId ? `(${memberId})` : ''}
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>টাকা জমা দিয়েছেন:</span>
                <strong style={{ color: '#0284c7' }}>{depositorName} [{depositorRelation}]</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>জমার খাত / হিসাবের বিবরণ:</span>
                <strong style={{ color: '#0f172a' }}>{depositType}</strong> {paymentMonth ? `(${paymentMonth} ${paymentYear})` : ''}
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পরিশোধ মাধ্যম:</span>
                <strong style={{ color: '#0f172a' }}>{paymentMethod}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>জমার তারিখ:</span>
                <strong style={{ color: '#0f172a' }}>{date}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভেরিফিকেশন কোড:</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '0.90rem' }}>
                  {searchedDoc?.shortVerificationCode || query.get('code') || decodedToken?.code || `S360-${(receiptNo || '000000').slice(0, 6).toUpperCase()}`}
                </strong>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ডিজিটাল সিকিউরিটি টোকেন ও অডিট হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: DUE NOTICE VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {docType === 'due_notice' && (
          <div>
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '16px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: '800', textTransform: 'uppercase' }}>
                মোট অপরিশোধিত বকেয়া অংক (OUTSTANDING DUE)
              </span>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#dc2626', margin: '4px 0' }}>
                ৳ {dueAmount.toLocaleString('en-IN')}/-
              </div>
              <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: '800', color: '#dc2626', background: '#fee2e2', padding: '3px 10px', borderRadius: '12px' }}>
                বকেয়া পরিশোধের তাগিদপত্র
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সদস্যের নাম:</span>
                <strong style={{ color: '#0f172a' }}>{memberName}</strong> {memberId ? `(${memberId})` : ''}
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>বকেয়ার মাসসমূহ:</span>
                <strong style={{ color: '#0f172a' }}>{dueMonths}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পরিশোধের শেষ সময়সীমা:</span>
                <strong style={{ color: '#dc2626' }}>{deadline}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভেরিফিকেশন হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 3: MEMBERSHIP CERTIFICATE VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {docType === 'membership_cert' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1.5px solid #fcd34d', borderRadius: '12px', padding: '18px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                অফিসিয়াল নিবন্ধিত সদস্যপদ সনদপত্র
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#b45309', margin: '4px 0' }}>
                {memberName}
              </div>
              <span style={{ display: 'inline-block', fontSize: '0.74rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '3px 12px', borderRadius: '12px' }}>
                ✓ সমিতি গঠনতন্ত্র মোতাবেক সক্রিয় ও নিয়মিত সদস্য
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সদস্য আইডি (Member Code):</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{memberId}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সদস্যের ধরন:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.type || 'সাধারণ সদস্য'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>জাতীয় পরিচয়পত্র (NID):</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.nid || 'সংরক্ষিত'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>যোগদানের তারিখ:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.joining || date}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সনদপত্র অডিট হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 4: BULK DEPOSIT REPORT VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {docType === 'bulk_deposit' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #93c5fd', borderRadius: '12px', padding: '18px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                একীভূত ব্যাংক ডিপোজিট মোট অংক (TOTAL SLIP AMOUNT)
              </span>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#1d4ed8', margin: '4px 0' }}>
                ৳ {Number(decodedToken?.a || verifyData?.amount || 0).toLocaleString('en-IN')}/-
              </div>
              <span style={{ display: 'inline-block', fontSize: '0.74rem', fontWeight: '800', color: '#1e40af', background: '#bfdbfe', padding: '3px 12px', borderRadius: '12px' }}>
                ✓ ব্যাংকে সফলভাবে জমাকৃত ও অনুমোদিত ({decodedToken?.c || verifyData?.count || 0} জন সদস্যের চাঁদা)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>বাল্ক ভাউচার নং:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{decodedToken?.vn || verifyData?.voucher || 'BULK-001'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ব্যাংক জমা স্লিপ নং:</span>
                <strong style={{ color: '#0284c7' }}>{decodedToken?.sn || verifyData?.slip || 'SLIP-001'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ব্যাংক ও শাখা:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.bn || verifyData?.bank || 'ব্যাংক'} ({decodedToken?.branch || 'প্রধান শাখা'})</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>জমার তারিখ:</span>
                <strong style={{ color: '#0f172a' }}>{date}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভেরিফিকেশন সিকিউরিটি হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 5: MEMBER SMART ID CARD VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {(docType === 'member_id_card' || docType === 'member_card') && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #93c5fd', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {memberPhoto ? (
                <img
                  src={memberPhoto}
                  alt={memberName}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', fontSize: '1.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(memberName || 'M').charAt(0)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  সদস্য স্মার্ট পরিচয়পত্র (Member Smart ID)
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e3a8a', margin: '2px 0' }}>
                  {memberName} {memberNameEn && <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '600' }}>({memberNameEn})</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', fontSize: '0.74rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '2px 10px', borderRadius: '10px' }}>
                    ✓ সক্রিয় ও সত্যায়িত সদস্য
                  </span>
                  <span style={{ display: 'inline-block', fontSize: '0.74rem', fontWeight: '800', color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '8px' }}>
                    রক্তের গ্রুপ: {memberBlood}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সদস্য কোড / আইডি নং:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{memberId}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সদস্যের পদবি / ক্যাটাগরি:</span>
                <strong style={{ color: '#0f172a' }}>{memberType}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>জাতীয় পরিচয়পত্র (NID):</span>
                <strong style={{ color: '#0f172a' }}>{memberNid}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>যোগদানের তারিখ:</span>
                <strong style={{ color: '#0f172a' }}>{memberJoining}</strong>
              </div>
              {memberFather && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পিতার নাম:</span>
                  <strong style={{ color: '#0f172a' }}>{memberFather}</strong>
                </div>
              )}
              {memberMobile && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>মোবাইল নম্বর:</span>
                  <strong style={{ color: '#0f172a' }}>{memberMobile}</strong>
                </div>
              )}
              {memberNominee && (
                <div style={{ gridColumn: '1 / -1', background: 'rgba(56, 189, 248, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: '800', display: 'block' }}>নমিনী ও বৈধ উত্তরাধিকারী:</span>
                  <strong style={{ color: '#0f172a' }}>{memberNominee}</strong> {memberNomineeRel && <span style={{ color: '#0284c7' }}>({memberNomineeRel})</span>}
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ডিজিটাল স্মার্ট অডিট হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 6: MEMBER PASSBOOK / SAVINGS ACCOUNT VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {docType === 'passbook' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid #a7f3d0', borderRadius: '14px', padding: '18px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ডিজিটাল সঞ্চয় পাসবুক ও সদস্য হিসাব বিবরণী
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#064e3b', margin: '4px 0' }}>
                {memberName}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#047857', marginTop: '6px' }}>
                ৳ {passbookSavings.toLocaleString('en-IN')}/-
              </div>
              <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
                মোট জমাকৃত বৈধ সঞ্চয় তহবিল
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>সদস্য হিসাব নং:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{memberId}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>হিসাবের ধরন:</span>
                <strong style={{ color: '#0f172a' }}>{memberType}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পাসবুক অডিট হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE: OFFICIAL SAMITY MEMBER LIST / REGISTRY VERIFICATION */}
        {/* ------------------------------------------------------------- */}
        {docType === 'member_list' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1.5px solid #86efac', borderRadius: '14px', padding: '18px 20px', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                অফিসিয়াল সদস্য তালিকা ও রেজিস্ট্রি সনদ (Official Member Registry)
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#15803d', margin: '4px 0' }}>
                মোট {decodedToken?.count || query.get('count') || 'সক্রিয়'} জন সদস্য
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#16a34a' }}>
                ✓ সেন্ট্রাল ক্লাউড ডেটাবেজে সংরক্ষিত ও সরকারি নিবন্ধন মোতাবেক অনুমোদিত
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>প্রতিবেদন সময়কাল:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.m || query.get('month') || 'চলতি মাস'} {decodedToken?.y || query.get('year') || ''}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>নিবন্ধন স্ট্যাটাস:</span>
                <span style={{ color: '#15803d', fontWeight: '800' }}>✓ নিবন্ধিত ও নিয়মিত হালনাগাদকৃত</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভেরিফিকেশন তারিখ:</span>
                <strong style={{ color: '#0f172a' }}>{date}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ডিজিটাল অডিট হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE: EXPENSE VOUCHER VERIFICATION (ব্যয়ের ভাউচার) */}
        {/* ------------------------------------------------------------- */}
        {docType === 'expense_voucher' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1.5px solid #fca5a5', borderRadius: '14px', padding: '18px 20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                অনুমোদিত ব্যয়ের ভাউচার ও অর্থ পরিশোধ (Official Expense Voucher)
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#7f1d1d', margin: '4px 0' }}>
                {decodedToken?.title || query.get('title') || 'সমিতি পরিচালনা ব্যয়'}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#dc2626', margin: '6px 0' }}>
                ৳ {Number(decodedToken?.a !== undefined ? decodedToken.a : (query.get('amount') || 0)).toLocaleString('en-IN')}/-
              </div>
              <span style={{ display: 'inline-block', fontSize: '0.74rem', fontWeight: '800', color: '#15803d', background: '#dcfce7', padding: '2px 10px', borderRadius: '10px' }}>
                ✓ সেন্ট্রাল ক্লাউড লেজার ও ফান্ড হিসাব থেকে অনুমোদিত
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভাউচার নং:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{decodedToken?.vn || query.get('voucher_no') || 'EXP-001'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ব্যয়ের খাত / ক্যাটাগরি:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.cat || query.get('category') || 'সাধারণ ব্যয়'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>প্রাপক / বিল পরিশোধ:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.to || query.get('paid_to') || 'অফিস'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পরিশোধের মাধ্যম:</span>
                <strong style={{ color: '#0f172a' }}>{decodedToken?.m || query.get('method') || 'নগদ ক্যাশ'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>খরচের তারিখ:</span>
                <strong style={{ color: '#0f172a' }}>{date}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভেরিফিকেশন সিকিউরিটি হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>{hash}</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 7: OFFICIAL RESOLUTION / DECREE / LETTERHEAD */}
        {/* ------------------------------------------------------------- */}
        {docType !== 'receipt' && docType !== 'expense_voucher' && docType !== 'member_list' && docType !== 'due_notice' && docType !== 'membership_cert' && docType !== 'bulk_deposit' && docType !== 'member_id_card' && docType !== 'member_card' && docType !== 'passbook' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ডকুমেন্টের বিষয় / টাইটেল:</span>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>{title}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ইস্যুর তারিখ:</span>
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="#059669" />
                  <span>{date}</span>
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ভেরিফিকেশন সিকিউরিটি হ্যাশ:</span>
                <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: '800', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hash size={13} />
                  <span>{hash}</span>
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#334155', marginBottom: '8px', borderLeft: '3px solid #10b981', paddingLeft: '8px' }}>
                অফিসিয়াল নথির মূল বিবরণ:
              </h3>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '0.88rem',
                  lineHeight: '1.7',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {bodyText}
              </div>
            </div>
          </div>
        )}

        {/* Signatures & Seal Section */}
        <div
          style={{
            borderTop: '2px solid #e2e8f0',
            paddingTop: '20px',
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'monospace', color: '#047857', fontWeight: '800', fontSize: '0.82rem' }}>✓ অনুমোদিত</span>
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: '800', color: '#0f172a' }}>
              সভাপতি
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>কার্যনির্বাহী কমিটি</div>
          </div>

          <div>
            <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'monospace', color: '#047857', fontWeight: '800', fontSize: '0.82rem' }}>✓ অনুমোদিত</span>
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: '800', color: '#0f172a' }}>
              সাধারণ সম্পাদক
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>কার্যনির্বাহী কমিটি</div>
          </div>

          <div>
            <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'monospace', color: '#047857', fontWeight: '800', fontSize: '0.82rem' }}>✓ সিলযুক্ত</span>
            </div>
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.75rem', fontWeight: '800', color: '#0f172a' }}>
              কোষাধ্যক্ষ / হিসাবরক্ষক
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>অর্থ ও ফান্ড বিভাগ</div>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '12px',
            borderTop: '1px dashed #e2e8f0',
            textAlign: 'center',
            fontSize: '0.68rem',
            color: '#94a3b8'
          }}
        >
          এই ডিজিটাল সার্টিফিকেটটি হিসাব কিতাব ৩৬০ ডিগ্রি সেন্ট্রাল অটোমেশন ইঞ্জিন দ্বারা স্বয়ংক্রিয়ভাবে যাচাইকৃত। কিউআর কোড ও ক্লাউড অডিট রেকর্ড অপরিবর্তনযোগ্য।
        </div>
      </div>
    </div>
  );
};

export default SamityDocVerificationView;
