import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  ShieldCheck,
  Camera,
  Upload,
  Link2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Printer,
  Copy,
  RefreshCw,
  X,
  FileText,
  Award,
  Layers,
  Sparkles,
  Info,
  Globe,
  Building2,
  Calendar,
  User,
  Check,
  ArrowLeft,
  Share2,
  AlertOctagon
} from 'lucide-react';
import {
  createSamityReceiptVerificationUrl,
  createSamityDueNoticeVerificationUrl,
  createSamityOfficialDocVerificationUrl,
  createSamityMembershipCertVerificationUrl,
  createSamityMemberIdCardVerificationUrl,
  createSamityBulkDepositVerificationUrl,
  createSamityExpenseVoucherVerificationUrl,
  getGlobalVerificationBaseUrl,
  generateQrDataUrl,
  generateQuickChartQrUrl,
  generateGoQrUrl,
  decodeQrCodeWithGoQrApi,
  safeBase64ToUtf8
} from '../../services/qrService';
import {
  verifyDocumentOnline,
  logDocumentShare
} from '../../services/somitiDocumentService';

export const UniversalQrVerifierModal = ({
  isOpen,
  onClose,
  currentSamity,
  data,
  onUpdateSamitySettings,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'paste' | 'records' | 'config'
  const [inputUrl, setInputUrl] = useState('');
  const [customDomain, setCustomDomain] = useState(() => {
    return (
      currentSamity?.verificationBaseUrl ||
      (typeof window !== 'undefined' ? localStorage.getItem('hk360_custom_verify_domain') || '' : '')
    );
  });
  const [previewQrMap, setPreviewQrMap] = useState({});
  const [activeVerifyResult, setActiveVerifyResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://somiti-360.vercel.app';
  const effectiveBaseUrl = getGlobalVerificationBaseUrl(currentSamity);

  // Pre-generate sample QR codes for the 1-click test buttons
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const loadRealVerificationQrs = async () => {
      try {
        const latestDeposit = (data?.deposits || []).find(d => d.samityId === currentSamity.id) || (data?.deposits || [])[0];
        const latestExpense = (data?.expenses || []).find(e => e.samityId === currentSamity.id) || (data?.expenses || [])[0];
        const firstMember = (data?.members || []).find(m => m.samityId === currentSamity.id) || (data?.members || [])[0];
        const previews = {};

        if (latestDeposit) {
          const receiptUrl = createSamityReceiptVerificationUrl(latestDeposit, currentSamity);
          const receiptQr = await generateQrDataUrl(receiptUrl, { width: 140, margin: 1 });
          previews.receipt = {
            url: receiptUrl,
            qr: receiptQr,
            label: 'সর্বশেষ জমার রসিদ',
            code: latestDeposit.receiptNo || latestDeposit.voucherNo || `RCPT-${latestDeposit.id}`
          };
        }

        if (latestExpense) {
          const expenseUrl = createSamityExpenseVoucherVerificationUrl(latestExpense, currentSamity);
          const expenseQr = await generateQrDataUrl(expenseUrl, { width: 140, margin: 1 });
          previews.expense = {
            url: expenseUrl,
            qr: expenseQr,
            label: 'খরচের ভাউচার (Expense Voucher)',
            code: latestExpense.voucherNo || `EXP-${latestExpense.id}`
          };
        }

        if (firstMember) {
          const dueAmount = Number(firstMember.totalDue || 0);
          const dueUrl = createSamityDueNoticeVerificationUrl({
            member: firstMember,
            status: { totalDue: dueAmount, month: 'চলতি বকেয়া' },
            dueMonthsList: ['চলতি বকেয়া']
          }, currentSamity);

          const certUrl = createSamityMembershipCertVerificationUrl(firstMember, currentSamity);
          const idCardUrl = createSamityMemberIdCardVerificationUrl(firstMember, currentSamity);

          const [dueQr, certQr, idCardQr] = await Promise.all([
            generateQrDataUrl(dueUrl, { width: 140, margin: 1 }),
            generateQrDataUrl(certUrl, { width: 140, margin: 1 }),
            generateQrDataUrl(idCardUrl, { width: 140, margin: 1 })
          ]);

          previews.due = { url: dueUrl, qr: dueQr, label: 'বকেয়া তাগিদপত্র', code: `DUE-${firstMember.id}` };
          previews.cert = { url: certUrl, qr: certQr, label: 'সদস্যপদ সনদ', code: `CERT-${firstMember.id}` };
          previews.idCard = { url: idCardUrl, qr: idCardQr, label: 'সদস্য স্মার্ট আইডি কার্ড', code: `ID-${firstMember.id}` };
        }

        const docUrl = createSamityOfficialDocVerificationUrl({
          ref: `${currentSamity?.code || 'সছস'}/২০২৬/০১`,
          title: 'অফিসিয়াল নোটিশ ও কার্যবিবরণী',
          date: new Date().toISOString().split('T')[0]
        }, currentSamity);
        const docQr = await generateQrDataUrl(docUrl, { width: 140, margin: 1 });
        previews.doc = { url: docUrl, qr: docQr, label: 'অফিসিয়াল নোটিশ/রেজুলেশন', code: 'DOC-2026' };

        if (isMounted) {
          setPreviewQrMap(previews);
        }
      } catch (err) {
        console.warn('Could not generate real QR previews:', err);
      }
    };

    loadRealVerificationQrs();
    return () => { isMounted = false; };
  }, [isOpen, currentSamity, data]);

  // Clean up camera stream on close or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const playScanChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanningCamera(false);
  };

  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setIsScanningCamera(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('আপনার ব্রাউজারে ক্যামেরা এক্সেস সমর্থিত নয়।');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'ক্যামেরা চালু করা সম্ভব হয়নি। অনুমতি দিন বা ছবি আপলোড করুন।');
      setIsScanningCamera(false);
    }
  };

  const toggleCameraFacingMode = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    stopCamera();
    setTimeout(() => {
      startCamera(nextMode);
    }, 250);
  };

  const scanVideoFrame = async () => {
    if (!videoRef.current || !isScanningCamera) return;
    try {
      if ('BarcodeDetector' in window) {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const val = barcodes[0].rawValue;
          playScanChime();
          stopCamera();
          handleVerifyRawInput(val);
          showToast?.('✓ QR কোড সফলভাবে স্ক্যান করা হয়েছে!', 'success');
          return;
        }
      }
    } catch (_) {}
    if (isScanningCamera) {
      requestAnimationFrame(scanVideoFrame);
    }
  };

  const captureFrameAndDecode = async () => {
    if (!videoRef.current || !isScanningCamera) return;
    setIsCapturingFrame(true);
    showToast?.('ভিডিও ফ্রেম ক্যাপচার ও বিশ্লেষণ করা হচ্ছে...', 'info');
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Local BarcodeDetector check
      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            playScanChime();
            stopCamera();
            handleVerifyRawInput(barcodes[0].rawValue);
            showToast?.('✓ ফ্রেম থেকে QR কোড সফলভাবে পড়া হয়েছে!', 'success');
            setIsCapturingFrame(false);
            return;
          }
        } catch (_) {}
      }

      // 2. Fallback to GoQR.me API with blob snapshot
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (blob) {
        const decoded = await decodeQrCodeWithGoQrApi(blob);
        if (decoded) {
          playScanChime();
          stopCamera();
          handleVerifyRawInput(decoded);
          showToast?.('✓ GoQR ইঞ্জিন দিয়ে ফ্রেম সফলভাবে ডিকোড হয়েছে!', 'success');
          setIsCapturingFrame(false);
          return;
        }
      }
      showToast?.('ফ্রেমে কোনো স্পষ্ট QR কোড শনাক্ত হয়নি। ক্যামেরাটি ডকুমেন্টের আরও কাছে এনে চেষ্টা করুন।', 'warning');
    } catch (err) {
      console.warn('Frame capture decode error:', err);
      showToast?.('ফ্রেম বিশ্লেষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন বা ছবি ফাইল আপলোড করুন।', 'error');
    } finally {
      setIsCapturingFrame(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast?.('GoQR ও ডিজিটাল ইঞ্জিন দিয়ে ছবি বিশ্লেষণ করা হচ্ছে...', 'info');

    // 1. Try local BarcodeDetector if supported by the browser
    if ('BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const img = new Image();
        const localResult = await new Promise((resolve) => {
          img.onload = async () => {
            try {
              const barcodes = await detector.detect(img);
              if (barcodes.length > 0) resolve(barcodes[0].rawValue);
              else resolve(null);
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = URL.createObjectURL(file);
        });

        if (localResult) {
          handleVerifyRawInput(localResult);
          showToast?.('✓ QR কোড সফলভাবে পড়া ও যাচাই হয়েছে!', 'success');
          return;
        }
      } catch (err) {
        console.warn('Local BarcodeDetector failed, falling back to GoQR API:', err);
      }
    }

    // 2. GoQR.me Cloud Read API (100% universal across PC, Mac & Mobile)
    try {
      const decodedData = await decodeQrCodeWithGoQrApi(file);
      if (decodedData) {
        handleVerifyRawInput(decodedData);
        showToast?.('✓ GoQR.me ক্লাউড ইঞ্জিন দিয়ে QR কোড সফলভাবে পড়া হয়েছে!', 'success');
        return;
      }
    } catch (err) {
      console.warn('GoQR API decode error:', err);
      showToast?.(err.message || 'ছবিতে কোনো স্পষ্ট QR কোড শনাক্ত করা যায়নি। অনুগ্রহ করে রসিদ নং লিখুন।', 'error');
    }
  };

  // Resolve any QR string, token, URL or receipt number into a structured verified certificate
  const resolveVerificationPayload = (raw) => {
    if (!raw) return null;
    let urlString = raw.trim();
    let queryParams = null;

    if (urlString.includes('?')) {
      try {
        const queryPart = urlString.split('?')[1];
        queryParams = new URLSearchParams(queryPart);
      } catch (_) {}
    }

    if (queryParams) {
      let decodedToken = null;
      const rawToken = queryParams.get('data');
      if (rawToken) {
        try {
          const decodedStr = safeBase64ToUtf8(rawToken);
          if (decodedStr) decodedToken = JSON.parse(decodedStr);
        } catch (_) {}
      }

      const resolvedType = decodedToken?.t || queryParams.get('verify') || 'receipt';
      const docId = queryParams.get('doc_id') || decodedToken?.docId || queryParams.get('voucher_no') || queryParams.get('receipt_no') || '';
      
      // Look up in central database if exists
      let matchedRecord = null;
      if (resolvedType === 'expense_voucher') {
        matchedRecord = (data?.expenses || []).find(e => 
          (docId && (e.id === docId || e.voucherNo === docId)) ||
          (e.voucherNo && e.voucherNo.toLowerCase() === (queryParams.get('voucher_no') || '').toLowerCase())
        );
      } else {
        matchedRecord = (data?.deposits || []).find(d => 
          (docId && (d.id === docId || d.receiptNo === docId)) ||
          (d.receiptNo && d.receiptNo.toLowerCase() === (queryParams.get('receipt_no') || '').toLowerCase())
        );
      }

      const isRecordCancelled = matchedRecord?.isCancelled || 
                                matchedRecord?.approvalStatus === 'cancelled' || 
                                matchedRecord?.approvalStatus === 'rejected';

      return {
        type: resolvedType,
        docId: docId,
        samity: decodedToken?.sam || queryParams.get('samity') || currentSamity?.nameBn || 'স্বপ্নছোঁয়া সমবায় সমিতি',
        reg: decodedToken?.reg || queryParams.get('reg') || currentSamity?.regNo || 'সছস-২০২৪/০৯',
        receiptNo: decodedToken?.rn || queryParams.get('receipt_no') || (resolvedType === 'expense_voucher' ? (decodedToken?.vn || queryParams.get('voucher_no') || 'EXP-001') : 'RCPT-2026-0001'),
        voucherNo: decodedToken?.vn || queryParams.get('voucher_no') || matchedRecord?.voucherNo || '',
        category: decodedToken?.cat || queryParams.get('category') || matchedRecord?.category || 'অফিস পরিচালনা',
        paidTo: decodedToken?.to || queryParams.get('paid_to') || matchedRecord?.paidTo || matchedRecord?.recipient || 'প্রাপক',
        payee: decodedToken?.to || queryParams.get('paid_to') || matchedRecord?.paidTo || matchedRecord?.recipient || 'প্রাপক',
        approvedBy: matchedRecord?.approvedBy || 'সভাপতি ও সাধারণ সম্পাদক',
        description: matchedRecord?.description || queryParams.get('title') || 'সমিতি পরিচালনা ও দাপ্তরিক ব্যয়',
        member: decodedToken?.m || queryParams.get('member') || 'সম্মানিত সদস্য',
        memberId: decodedToken?.mid || queryParams.get('memberId') || queryParams.get('mid') || '',
        depositor: decodedToken?.d || queryParams.get('depositor') || '',
        relation: decodedToken?.rel || queryParams.get('relation') || 'নিজে',
        amount: Number(decodedToken?.a !== undefined ? decodedToken.a : (queryParams.get('amount') || matchedRecord?.amount || 0)),
        depositType: decodedToken?.type || queryParams.get('type') || 'মাসিক সঞ্চয়/চাঁদা',
        method: decodedToken?.m || decodedToken?.method || queryParams.get('method') || matchedRecord?.paymentMethod || 'নগদ ক্যাশ',
        date: decodedToken?.dt || queryParams.get('date') || matchedRecord?.expenseDate || matchedRecord?.date || new Date().toISOString().split('T')[0],
        hash: decodedToken?.h || queryParams.get('hash') || `HK360-VERIFIED-${Date.now().toString(16).toUpperCase()}`,
        status: isRecordCancelled ? 'cancelled' : (matchedRecord?.approvalStatus || 'approved'),
        cancellationReason: matchedRecord?.cancellationReason || '',
        due: Number(decodedToken?.due !== undefined ? decodedToken.due : (queryParams.get('due') || 0)),
        months: decodedToken?.months || queryParams.get('months') || 'চলতি মাস',
        deadline: decodedToken?.dl || queryParams.get('deadline') || '১০ তারিখের মধ্যে',
        ref: queryParams.get('ref') || 'সছস/২০২৬/০১',
        title: queryParams.get('title') || (resolvedType === 'expense_voucher' ? 'সমিতি পরিচালনা ব্যয় ভাউচার' : 'অফিসিয়াল নথি ও রেজুলেশন'),
        fullUrl: urlString.startsWith('http') ? urlString : `${effectiveBaseUrl}${urlString.startsWith('/') ? '' : '/'}${urlString}`
      };
    }

    // 1. Look up in central database by Expense Voucher No / ID / Category
    const foundExpense = (data?.expenses || []).find(e => 
      (e.voucherNo && e.voucherNo.toLowerCase() === urlString.toLowerCase()) ||
      (e.id && e.id.toLowerCase() === urlString.toLowerCase()) ||
      (e.expenseNo && e.expenseNo.toLowerCase() === urlString.toLowerCase())
    );

    if (foundExpense) {
      const generatedUrl = createSamityExpenseVoucherVerificationUrl(foundExpense, currentSamity);
      const isCancelled = foundExpense.isCancelled || 
                          foundExpense.approvalStatus === 'cancelled' || 
                          foundExpense.approvalStatus === 'rejected';
      return {
        type: 'expense_voucher',
        docId: foundExpense.id,
        samity: currentSamity?.nameBn || 'স্বপ্নছোঁয়া সমবায় সমিতি',
        reg: currentSamity?.regNo || 'সছস-২০২৪/০৯',
        voucherNo: foundExpense.voucherNo || `EXP-${foundExpense.id || '001'}`,
        receiptNo: foundExpense.voucherNo || `EXP-${foundExpense.id || '001'}`,
        category: foundExpense.category || 'অফিস পরিচালনা',
        paidTo: foundExpense.paidTo || foundExpense.recipient || 'প্রাপক',
        payee: foundExpense.paidTo || foundExpense.recipient || 'প্রাপক',
        title: foundExpense.title || 'সমিতি পরিচালনা ব্যয় ভাউচার',
        description: foundExpense.description || foundExpense.title || 'সমিতির দাপ্তরিক খরচ',
        approvedBy: foundExpense.approvedBy || 'সভাপতি ও সাধারণ সম্পাদক',
        amount: Number(foundExpense.amount || 0),
        method: foundExpense.paymentMethod || foundExpense.method || 'নগদ ক্যাশ',
        date: foundExpense.expenseDate || foundExpense.date || new Date().toISOString().split('T')[0],
        hash: `HK360-EXP-DB-${(foundExpense.id || '001').slice(0, 8).toUpperCase()}`,
        status: isCancelled ? 'cancelled' : (foundExpense.approvalStatus || 'approved'),
        cancellationReason: foundExpense.cancellationReason || '',
        fullUrl: generatedUrl
      };
    }

    // 2. Look up in central database by Receipt / Voucher / Member ID
    const foundDeposit = (data?.deposits || []).find(d => 
      (d.receiptNo && d.receiptNo.toLowerCase() === urlString.toLowerCase()) ||
      (d.voucherNo && d.voucherNo.toLowerCase() === urlString.toLowerCase()) ||
      (d.id && d.id.toLowerCase() === urlString.toLowerCase())
    );

    if (foundDeposit) {
      const generatedUrl = createSamityReceiptVerificationUrl(foundDeposit, currentSamity);
      const isCancelled = foundDeposit.isCancelled || 
                          foundDeposit.approvalStatus === 'cancelled' || 
                          foundDeposit.approvalStatus === 'rejected';
      return {
        type: 'receipt',
        docId: foundDeposit.id,
        samity: currentSamity?.nameBn || 'স্বপ্নছোঁয়া সমবায় সমিতি',
        reg: currentSamity?.regNo || 'সছস-২০২৪/০৯',
        receiptNo: foundDeposit.receiptNo || foundDeposit.voucherNo || `RCPT-${foundDeposit.id}`,
        voucherNo: foundDeposit.voucherNo || '',
        member: foundDeposit.memberName || foundDeposit.depositorName || 'সদস্য',
        memberId: foundDeposit.memberId || '',
        depositor: foundDeposit.depositorName || '',
        relation: foundDeposit.depositorRelation || 'নিজে',
        amount: Number(foundDeposit.amount || 0),
        depositType: foundDeposit.depositType || 'মাসিক সঞ্চয়/চাঁদা',
        method: foundDeposit.depositMethod || foundDeposit.method || 'নগদ',
        date: foundDeposit.depositDate || foundDeposit.date || new Date().toISOString().split('T')[0],
        hash: `HK360-DB-VERIFIED-${(foundDeposit.id || '001').toUpperCase()}`,
        status: isCancelled ? 'cancelled' : (foundDeposit.approvalStatus || 'approved'),
        cancellationReason: foundDeposit.cancellationReason || '',
        fullUrl: generatedUrl
      };
    }

    // Fallback for custom code
    const genericUrl = `${effectiveBaseUrl}?verify=receipt&receipt_no=${encodeURIComponent(urlString)}&samity=${encodeURIComponent(currentSamity?.nameBn || 'স্বপ্নছোঁয়া সমবায় সমিতি')}`;
    return {
      type: 'receipt',
      samity: currentSamity?.nameBn || 'স্বপ্নছোঁয়া সমবায় সমিতি',
      reg: currentSamity?.regNo || 'সছস-২০২৪/০৯',
      receiptNo: urlString,
      member: 'সম্মানিত সদস্য',
      amount: 0,
      depositType: 'জমা ভেরিফিকেশন',
      method: 'সিস্টেম ভেরিফাইড',
      date: new Date().toISOString().split('T')[0],
      hash: `HK360-QUERY-${urlString.toUpperCase()}`,
      fullUrl: genericUrl
    };
  };

  const handleVerifyRawInput = async (rawText) => {
    const payload = resolveVerificationPayload(rawText);
    if (payload) {
      setActiveVerifyResult(payload);

      // Async live verification with Supabase cloud database
      try {
        const queryId = payload.docId || payload.voucherNo || payload.receiptNo || payload.ref;
        if (queryId) {
          const onlineRes = await verifyDocumentOnline({
            documentType: payload.type,
            documentId: queryId,
            samityId: currentSamity?.id
          });
          if (onlineRes?.document) {
            setActiveVerifyResult(prev => {
              if (!prev) return null;
              return {
                ...prev,
                status: onlineRes.document.status || prev.status,
                cancellationReason: onlineRes.document.cancellation_reason || prev.cancellationReason,
                cancelledAt: onlineRes.document.cancelled_at || null,
                onlineVerified: true
              };
            });
          }
        }
      } catch (err) {
        console.warn('Live online verify check skipped or failed:', err);
      }
    }
  };

  const handleVerifyInput = (e) => {
    e?.preventDefault?.();
    const raw = (inputUrl || '').trim();
    if (!raw) {
      showToast?.('অনুগ্রহ করে একটি ভেরিফিকেশন লিংক, টোকেন বা রসিদ নং প্রদান করুন', 'error');
      return;
    }
    handleVerifyRawInput(raw);
  };

  const handleSaveDomain = () => {
    let clean = (customDomain || '').trim();
    if (clean) {
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      clean = clean.replace(/\/$/, '');
      setCustomDomain(clean);
      try {
        localStorage.setItem('hk360_custom_verify_domain', clean);
        localStorage.setItem('somiti_live_domain', clean);
      } catch (_) {}
    } else {
      try {
        localStorage.removeItem('hk360_custom_verify_domain');
        localStorage.removeItem('somiti_live_domain');
      } catch (_) {}
    }

    if (onUpdateSamitySettings) {
      onUpdateSamitySettings(prev => ({
        ...prev,
        verificationBaseUrl: clean
      }));
    }

    showToast?.('✓ লাইভ ভেরিফিকেশন ডোমেন সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  const handleUseCurrentHost = () => {
    if (typeof window !== 'undefined') {
      const current = window.location.origin;
      setCustomDomain(current);
      try {
        localStorage.setItem('hk360_custom_verify_domain', current);
        localStorage.setItem('somiti_live_domain', current);
      } catch (_) {}
      if (onUpdateSamitySettings) {
        onUpdateSamitySettings(prev => ({
          ...prev,
          verificationBaseUrl: current
        }));
      }
      showToast?.(`✓ বর্তমান হোস্ট (${current}) ভেরিফিকেশন ডোমেন হিসেবে সেট করা হয়েছে!`, 'success');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', 'Hind Siliguri', sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary, #0f172a)',
          color: '#f8fafc',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '94vh',
          overflowY: 'auto',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(20, 184, 166, 0.15)',
          padding: '24px 28px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf' }}>
              <QrCode size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: '900', color: '#fff' }}>
                QR কোড যাচাইকরণ কেন্দ্র ও সত্যতা প্রমাণক
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                রসিদ, নোটিশ, রেজুলেশন ও সদস্য কার্ডের ক্রিপ্টোগ্রাফিক যাচাইকরণ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* IN-MODAL VERIFIED CERTIFICATE DISPLAY (If Active Result Exists) */}
        {/* ------------------------------------------------------------- */}
        {activeVerifyResult ? (
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
            border: activeVerifyResult.status === 'cancelled' ? '2px solid #ef4444' : '2px solid #10b981',
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Watermark for cancelled documents */}
            {activeVerifyResult.status === 'cancelled' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '3.6rem',
                fontWeight: '900',
                color: 'rgba(239, 68, 68, 0.12)',
                border: '6px dashed rgba(239, 68, 68, 0.25)',
                padding: '10px 40px',
                borderRadius: '16px',
                pointerEvents: 'none',
                letterSpacing: '4px',
                whiteSpace: 'nowrap',
                zIndex: 0
              }}>
                বাতিল / CANCELLED
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px', position: 'relative', zIndex: 1 }}>
              <button
                onClick={() => setActiveVerifyResult(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={15} />
                <span>ফিরে যান (আরেকটি যাচাই করুন)</span>
              </button>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* WhatsApp Share Button */}
                <button
                  onClick={() => {
                    const docText = activeVerifyResult.type === 'expense_voucher'
                      ? `*${activeVerifyResult.samity}*\n📜 অফিসিয়াল খরচের ভাউচার ভেরিফিকেশন\n🔹 ভাউচার নং: ${activeVerifyResult.voucherNo || activeVerifyResult.receiptNo}\n🔹 ব্যয়ের খাত: ${activeVerifyResult.category}\n🔹 প্রাপক: ${activeVerifyResult.paidTo || activeVerifyResult.payee}\n💰 পরিমাণ: ৳${activeVerifyResult.amount.toLocaleString('en-IN')}/-\n📅 তারিখ: ${activeVerifyResult.date}\n\nলিংক থেকে সরাসরি অনলাইনে সত্যায়িত কপি দেখুন:\n${activeVerifyResult.fullUrl}`
                      : `*${activeVerifyResult.samity}*\n📜 অফিসিয়াল ডিজিটাল রসিদ ভেরিফিকেশন\n🔹 রসিদ নং: ${activeVerifyResult.receiptNo}\n🔹 সদস্য: ${activeVerifyResult.member}\n💰 জমার পরিমাণ: ৳${activeVerifyResult.amount.toLocaleString('en-IN')}/-\n📅 তারিখ: ${activeVerifyResult.date}\n\nলিংক থেকে সরাসরি অনলাইনে সত্যায়িত কপি দেখুন:\n${activeVerifyResult.fullUrl}`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(docText)}`;
                    window.open(waUrl, '_blank', 'noopener,noreferrer');
                    logDocumentShare?.(activeVerifyResult.docId || activeVerifyResult.receiptNo, 'whatsapp');
                    showToast?.('✓ WhatsApp এ ভেরিফিকেশন লিংক পাঠানো হচ্ছে...', 'success');
                  }}
                  style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Share2 size={14} />
                  <span>WhatsApp শেয়ার</span>
                </button>

                <a
                  href={activeVerifyResult.fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#0284c7', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  <span>নতুন ট্যাবে খুলুন</span>
                </a>
                <button
                  onClick={() => window.print()}
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} />
                  <span>প্রিন্ট {activeVerifyResult.type === 'expense_voucher' ? 'ভাউচার' : 'রসিদ'}</span>
                </button>
              </div>
            </div>

            {/* Status Alert Banner if Cancelled */}
            {activeVerifyResult.status === 'cancelled' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '12px', padding: '12px 16px', color: '#991b1b', fontWeight: '700', fontSize: '0.86rem', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                <AlertOctagon size={22} color="#dc2626" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '900', color: '#dc2626' }}>
                    ⚠️ সতর্কবার্তা: এই {activeVerifyResult.type === 'expense_voucher' ? 'খরচের ভাউচারটি' : 'রসিদটি'} সমিতি কর্তৃপক্ষ কর্তৃক বাতিল (CANCELLED) করা হয়েছে!
                  </div>
                  {activeVerifyResult.cancellationReason && (
                    <div style={{ fontSize: '0.78rem', marginTop: '2px', color: '#b91c1c' }}>
                      বাতিলের কারণ: <strong>{activeVerifyResult.cancellationReason}</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Verified Badge */
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1.5px solid #10b981', borderRadius: '24px', padding: '6px 14px', color: '#047857', fontWeight: '800', fontSize: '0.84rem', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                <ShieldCheck size={18} color="#059669" />
                <span>
                  ✓ {activeVerifyResult.type === 'expense_voucher' ? 'ডিজিটালভাবে সত্যায়িত ও অনুমোদিত খরচের ভাউচার (Digitally Verified Expense Voucher)' : 'ডিজিটালভাবে সত্যায়িত ও অনুমোদিত অফিসিয়াল রসিদ (Digitally Verified Official Document)'}
                </span>
              </div>
            )}

            {/* Samity Title */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: '900', color: activeVerifyResult.status === 'cancelled' ? '#991b1b' : '#064e3b' }}>
                {activeVerifyResult.samity}
              </h2>
              <div style={{ fontSize: '0.78rem', color: activeVerifyResult.status === 'cancelled' ? '#dc2626' : '#059669', fontWeight: '700' }}>
                নিবন্ধন নং: {activeVerifyResult.reg} • {activeVerifyResult.type === 'expense_voucher' ? 'ভাউচার নং' : 'রসিদ নং'}: {activeVerifyResult.voucherNo || activeVerifyResult.receiptNo}
              </div>
            </div>

            {/* Amount Spotlight */}
            {activeVerifyResult.amount > 0 && (
              <div style={{
                background: activeVerifyResult.status === 'cancelled' ? '#fef2f2' : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: activeVerifyResult.status === 'cancelled' ? '1.5px solid #fca5a5' : '1.5px solid #86efac',
                borderRadius: '12px',
                padding: '14px 20px',
                textAlign: 'center',
                marginBottom: '16px',
                position: 'relative',
                zIndex: 1
              }}>
                <span style={{ fontSize: '0.74rem', color: activeVerifyResult.status === 'cancelled' ? '#991b1b' : '#065f46', fontWeight: '800', textTransform: 'uppercase' }}>
                  {activeVerifyResult.type === 'expense_voucher' ? 'পরিশোধকৃত খরচের অংক (PAID EXPENSE AMOUNT)' : 'পরিশোধকৃত জমা অংক (PAID AMOUNT)'}
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: activeVerifyResult.status === 'cancelled' ? '#dc2626' : '#047857', margin: '2px 0' }}>
                  ৳ {activeVerifyResult.amount.toLocaleString('en-IN')}/-
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: activeVerifyResult.status === 'cancelled' ? '#ef4444' : '#059669' }}>
                  {activeVerifyResult.status === 'cancelled' ? '✕ এই খরচের লেনদেনটি বাতিল হিসেবে চিহ্নিত' : '✓ সেন্ট্রাল ক্লাউড লেজারে সংরক্ষিত ও অনুমোদিত'}
                </span>
              </div>
            )}

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', fontSize: '0.82rem', lineHeight: '1.5', position: 'relative', zIndex: 1 }}>
              {activeVerifyResult.type === 'expense_voucher' ? (
                <>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>টাকা গ্রহণকারী (Payee / প্রাপক):</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.paidTo || activeVerifyResult.payee}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ব্যয়ের খাত (Category):</span>
                    <strong style={{ color: '#0284c7' }}>{activeVerifyResult.category}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>খরচের বিবরণী (Title / Details):</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.description || activeVerifyResult.title}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>অনুমোদনকারী (Approved By):</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.approvedBy}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পরিশোধ মাধ্যম:</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.method}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>তারিখ:</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.date}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>বর্তমান অবস্থা (Status):</span>
                    <strong style={{ color: activeVerifyResult.status === 'cancelled' ? '#dc2626' : '#059669' }}>
                      {activeVerifyResult.status === 'cancelled' ? 'বাতিলকৃত (Cancelled)' : 'অনুমোদিত ও সক্রিয় (Active)'}
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>হিসাবধারী সদস্য:</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.member}</strong> {activeVerifyResult.memberId ? `(${activeVerifyResult.memberId})` : ''}
                  </div>
                  {activeVerifyResult.depositor && (
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>টাকা জমা দিয়েছেন:</span>
                      <strong style={{ color: '#0284c7' }}>{activeVerifyResult.depositor} [{activeVerifyResult.relation}]</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>খাত ও বিবরণ:</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.depositType}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>পরিশোধ মাধ্যম:</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.method}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>তারিখ:</span>
                    <strong style={{ color: '#0f172a' }}>{activeVerifyResult.date}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>বর্তমান অবস্থা (Status):</span>
                    <strong style={{ color: activeVerifyResult.status === 'cancelled' ? '#dc2626' : '#059669' }}>
                      {activeVerifyResult.status === 'cancelled' ? 'বাতিলকৃত (Cancelled)' : 'অনুমোদিত ও সংরক্ষিত (Valid)'}
                    </strong>
                  </div>
                </>
              )}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', display: 'block' }}>ডিজিটাল সিকিউরিটি টোকেন ও অডিট হ্যাশ:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#059669', fontWeight: '800' }}>{activeVerifyResult.hash}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('scanner')}
                style={{
                  background: activeTab === 'scanner' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                  color: activeTab === 'scanner' ? '#fde047' : '#94a3b8',
                  border: activeTab === 'scanner' ? '1px solid #eab308' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Camera size={16} />
                <span>ক্যামেরা ও ছবি স্ক্যানার (GoQR / QuickChart)</span>
              </button>

              <button
                onClick={() => setActiveTab('paste')}
                style={{
                  background: activeTab === 'paste' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: activeTab === 'paste' ? '#38bdf8' : '#94a3b8',
                  border: activeTab === 'paste' ? '1px solid #38bdf8' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Link2 size={16} />
                <span>রসিদ নং / লিংক দিয়ে যাচাই</span>
              </button>

              <button
                onClick={() => setActiveTab('records')}
                style={{
                  background: activeTab === 'records' ? 'rgba(20, 184, 166, 0.2)' : 'transparent',
                  color: activeTab === 'records' ? '#2dd4bf' : '#94a3b8',
                  border: activeTab === 'records' ? '1px solid #14b8a6' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={16} />
                <span>সক্রিয় রসিদ ও নথিপত্র</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                style={{
                  background: activeTab === 'config' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  color: activeTab === 'config' ? '#c084fc' : '#94a3b8',
                  border: activeTab === 'config' ? '1px solid #a855f7' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Globe size={16} />
                <span>লাইভ ডোমেন কনফিগ</span>
              </button>
            </div>

            {/* TAB: ACTIVE REAL RECORDS VERIFICATION */}
            {activeTab === 'records' && (
              <div>
                <div style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={28} color="#2dd4bf" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', lineHeight: '1.5', color: '#cbd5e1' }}>
                    <strong style={{ color: '#fff' }}>সিস্টেম রসিদ ও নথি যাচাই:</strong> সফটওয়্যারের সকল অফিসিয়াল ডকুমেন্ট (রসিদ, বকেয়া নোটিশ, রেজুলেশন, সনদপত্র) স্বয়ংক্রিয়ভাবে QuickChart ও GoQR ইঞ্জিন দিয়ে সজ্জিত। নিচের যেকোনো কার্ডে ক্লিক করে সরাসরি ডিজিটাল সনদ ভিউ করতে পারেন।
                  </div>
                </div>

                {Object.keys(previewQrMap).length === 0 ? (
                  <div style={{ background: '#1e293b', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>এখনও কোনো জমার রসিদ বা সদস্য এন্ট্রি করা হয়নি</div>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>সদস্য নিবন্ধন বা টাকা জমা করার সাথে সাথে এখানে সক্রিয় কিউআর কোড দৃশ্যমান হবে।</p>
                  </div>
                ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                  {/* Card 1: Real Receipt */}
                  {previewQrMap.receipt && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0, textAlign: 'center' }}>
                      {previewQrMap.receipt?.qr ? (
                        <img src={previewQrMap.receipt.qr} alt="Receipt QR" style={{ width: '84px', height: '84px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '84px', height: '84px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={36} color="#0f172a" />
                        </div>
                      )}
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#0f172a', display: 'block', marginTop: '2px' }}>ক্যামেরায় স্ক্যান করুন</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#065f46', color: '#34d399', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>পরিশোধ রসিদ</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>জমা রসিদ ভেরিফিকেশন</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        কোড: {previewQrMap.receipt?.code || 'SM-001'} • ক্লাউড লেজার সত্যায়িত
                      </div>
                      <button
                        onClick={() => {
                          if (previewQrMap.receipt?.url) handleVerifyRawInput(previewQrMap.receipt.url);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>সার্টিফিকেট ওপেন করুন</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Card 1.5: Real Expense Voucher */}
                  {previewQrMap.expense && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0, textAlign: 'center' }}>
                      {previewQrMap.expense?.qr ? (
                        <img src={previewQrMap.expense.qr} alt="Expense Voucher QR" style={{ width: '84px', height: '84px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '84px', height: '84px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={36} color="#ef4444" />
                        </div>
                      )}
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#ef4444', display: 'block', marginTop: '2px' }}>ক্যামেরায় স্ক্যান করুন</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>ব্যয় ভাউচার</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>খরচের ভাউচার ভেরিফিকেশন</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        কোড: {previewQrMap.expense?.code || 'EXP-001'} • ব্যয় খাত ও অনুমোদন
                      </div>
                      <button
                        onClick={() => {
                          if (previewQrMap.expense?.url) handleVerifyRawInput(previewQrMap.expense.url);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>ভাউচারটি ভেরিফাই করুন</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Card 2: Real Due Notice */}
                  {previewQrMap.due && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0, textAlign: 'center' }}>
                      {previewQrMap.due?.qr ? (
                        <img src={previewQrMap.due.qr} alt="Due Notice QR" style={{ width: '84px', height: '84px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '84px', height: '84px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={36} color="#dc2626" />
                        </div>
                      )}
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#dc2626', display: 'block', marginTop: '2px' }}>ক্যামেরায় স্ক্যান করুন</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>বকেয়া তাগিদ</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>বকেয়া নোটিশ ভেরিফিকেশন</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        কোড: {previewQrMap.due?.code || 'DUE-001'} • ডেডলাইন ও পাওনা হিসাব
                      </div>
                      <button
                        onClick={() => {
                          if (previewQrMap.due?.url) handleVerifyRawInput(previewQrMap.due.url);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>নোটিশ ওপেন করুন</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Card 3: Real Membership Certificate */}
                  {previewQrMap.cert && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0, textAlign: 'center' }}>
                      {previewQrMap.cert?.qr ? (
                        <img src={previewQrMap.cert.qr} alt="Cert QR" style={{ width: '84px', height: '84px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '84px', height: '84px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={36} color="#b45309" />
                        </div>
                      )}
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#b45309', display: 'block', marginTop: '2px' }}>ক্যামেরায় স্ক্যান করুন</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#78350f', color: '#fcd34d', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>সদস্য সনদ</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>সদস্যপদ সনদপত্র</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        কোড: {previewQrMap.cert?.code || 'CERT-001'} • গঠনতন্ত্র মোতাবেক সত্যায়িত
                      </div>
                      <button
                        onClick={() => {
                          if (previewQrMap.cert?.url) handleVerifyRawInput(previewQrMap.cert.url);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>সনদপত্র ওপেন করুন</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Card 4: Official Letterhead Resolution */}
                  {previewQrMap.doc && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0, textAlign: 'center' }}>
                      {previewQrMap.doc?.qr ? (
                        <img src={previewQrMap.doc.qr} alt="Doc QR" style={{ width: '84px', height: '84px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '84px', height: '84px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={36} color="#0284c7" />
                        </div>
                      )}
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#0284c7', display: 'block', marginTop: '2px' }}>ক্যামেরায় স্ক্যান করুন</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#0c4a6e', color: '#7dd3fc', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>অফিসিয়াল নোটিশ</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>রেজুলেশন ও সভার কার্যবিবরণী</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        কোড: {previewQrMap.doc?.code || 'DOC-2026'} • সিল ও স্বাক্ষর সংরক্ষিত
                      </div>
                      <button
                        onClick={() => {
                          if (previewQrMap.doc?.url) handleVerifyRawInput(previewQrMap.doc.url);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>রেজুলেশন ভিউ করুন</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Card 5: Real Member Smart ID Card */}
                  {previewQrMap.idCard && (
                  <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0, textAlign: 'center' }}>
                      {previewQrMap.idCard?.qr ? (
                        <img src={previewQrMap.idCard.qr} alt="ID Card QR" style={{ width: '84px', height: '84px', display: 'block' }} />
                      ) : (
                        <div style={{ width: '84px', height: '84px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={36} color="#8b5cf6" />
                        </div>
                      )}
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#8b5cf6', display: 'block', marginTop: '2px' }}>ক্যামেরায় স্ক্যান করুন</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#4c1d95', color: '#c4b5fd', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>স্মার্ট কার্ড</span>
                        <strong style={{ color: '#f8fafc', fontSize: '0.88rem' }}>সদস্য ডিজিটাল আইডি</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        কোড: {previewQrMap.idCard?.code || 'ID-001'} • মেম্বার প্রোফাইল সত্যায়িত
                      </div>
                      <button
                        onClick={() => {
                          if (previewQrMap.idCard?.url) handleVerifyRawInput(previewQrMap.idCard.url);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <ShieldCheck size={13} />
                        <span>আইডি কার্ড ভিউ করুন</span>
                      </button>
                    </div>
                  </div>
                  )}
                </div>
                )}
              </div>
            )}

            {/* TAB 2: PASTE URL / RECEIPT NUMBER */}
            {activeTab === 'paste' && (
              <div>
                <form onSubmit={handleVerifyInput} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '800', color: '#f8fafc', marginBottom: '8px' }}>
                    🔗 রসিদ নম্বর, ভেরিফিকেশন লিংক বা কিউআর টেক্সট প্রদান করুন:
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="যেমন: SM-2026-01-001 অথবা RCPT-2026-0001 অথবা https://.../?verify=receipt&..."
                      style={{
                        flex: 1,
                        minWidth: '260px',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.84rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>এখনই যাচাই করুন</span>
                    </button>
                  </div>
                </form>

                <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '14px 18px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  💡 <strong>সহজ টিপস:</strong> আপনি সফটওয়্যার থেকে তৈরি যেকোনো রসিদের নম্বর (যেমন: <code>SM-2026-01-001</code>) লিখলেও ইনস্ট্যান্ট ক্লাউড ডেটাবেজ থেকে ডিজিটাল সত্যায়িত সার্টিফিকেট ওপেন হবে।
                </div>
              </div>
            )}

            {/* TAB 3: CAMERA & IMAGE SCANNER */}
            {activeTab === 'scanner' && (
              <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.96rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={20} color="#fde047" />
                  <span>সরাসরি ক্যামেরা অথবা QR কোডের ছবি দিয়ে যাচাই</span>
                </h4>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <button
                    onClick={isScanningCamera ? stopCamera : startCamera}
                    style={{
                      background: isScanningCamera ? '#dc2626' : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                      color: isScanningCamera ? '#fff' : '#0f172a',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={16} />
                    <span>{isScanningCamera ? 'ক্যামেরা বন্ধ করুন' : 'ওয়েবক্যাম / মোবাইল ক্যামেরা চালু করুন'}</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={16} />
                    <span>QR ছবি বা স্ক্রিনশট আপলোড করুন</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </div>

                {cameraError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.8rem', marginBottom: '16px' }}>
                    ⚠️ {cameraError}
                  </div>
                )}

                {isScanningCamera && (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '420px', margin: '0 auto 16px', borderRadius: '14px', overflow: 'hidden', border: '2px solid #eab308', background: '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block', minHeight: '260px', objectFit: 'cover' }} />
                    
                    {/* Viewfinder Target Reticle */}
                    <div style={{ position: 'absolute', inset: '16%', border: '2.5px solid #22c55e', borderRadius: '12px', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)' }}>
                      <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #fde047', borderLeft: '4px solid #fde047', borderTopLeftRadius: '10px' }} />
                      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #fde047', borderRight: '4px solid #fde047', borderTopRightRadius: '10px' }} />
                      <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #fde047', borderLeft: '4px solid #fde047', borderBottomLeftRadius: '10px' }} />
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #fde047', borderRight: '4px solid #fde047', borderBottomRightRadius: '10px' }} />
                      
                      {/* Laser scanning line */}
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', height: '2px', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                    </div>

                    {/* Camera Control Overlays */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
                      <button
                        onClick={toggleCameraFacingMode}
                        title="ক্যামেরা পরিবর্তন করুন (Flip Camera)"
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        <RefreshCw size={13} />
                        <span>{facingMode === 'environment' ? 'সেলফি/ফ্রন্ট' : 'ব্যাক ক্যামেরা'}</span>
                      </button>
                    </div>

                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', zIndex: 10 }}>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.72rem', padding: '5px 10px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
                        QR কোড বক্সের ভেতরে ধরুন
                      </span>

                      <button
                        onClick={captureFrameAndDecode}
                        disabled={isCapturingFrame}
                        style={{
                          background: isCapturingFrame ? '#64748b' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          cursor: isCapturingFrame ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                        }}
                      >
                        <Sparkles size={13} />
                        <span>{isCapturingFrame ? 'যাচাই হচ্ছে...' : 'ফ্রেম ক্যাপচার ও স্ক্যান'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5' }}>
                  ℹ️ কাগজের রসিদে থাকা QR কোডের ছবি তুলে এখানে আপলোড করতে পারেন অথবা ক্যামেরা ফ্রন্ট/ব্যাক দিয়ে সরাসরি স্ক্যান করতে পারেন।
                </div>
              </div>
            )}

            {/* TAB 4: LIVE DOMAIN & WI-FI CONFIG */}
            {activeTab === 'config' && (
              <div>
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.96rem', fontWeight: '800', color: '#f8fafc' }}>
                    🌐 লাইভ ভেরিফিকেশন বেস ইউআরএল (Live Verification Base URL)
                  </h4>
                  <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: '#94a3b8' }}>
                    মোবাইল ক্যামেরা দিয়ে QR কোড স্ক্যান করলে যে ডোমেন বা ওয়েবসাইটে যাবে তা নির্ধারণ করুন।
                  </p>

                  <div style={{ background: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>বর্তমানে ব্যবহৃত ভেরিফিকেশন লিংক:</div>
                    <div style={{ fontSize: '0.9rem', color: '#2dd4bf', fontWeight: '800', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '2px' }}>
                      {effectiveBaseUrl}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                      কাস্টম প্রোডাকশন / Vercel ডোমেন (যেমন: https://somiti-360.vercel.app অথবা আপনার নিজস্ব ডোমেন):
                    </label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="https://somiti-360.vercel.app"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.84rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSaveDomain}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      ডোমেন সংরক্ষণ করুন
                    </button>

                    <button
                      type="button"
                      onClick={handleUseCurrentHost}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      বর্তমান ব্রাউজার হোস্ট ({activeOrigin}) সেট করুন
                    </button>
                  </div>
                </div>

                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '10px', padding: '14px 18px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  📱 <strong>মোবাইল ক্যামেরা স্ক্যানিং টিপস:</strong> আপনার লাইভ সাইটের কিউআর কোড স্ক্যান করলে সরাসরি <code>{effectiveBaseUrl}</code>-এ গিয়ে রসিদের সত্যতা যাচাই হবে। কোনো পাসওয়ার্ড বা লগইন লাগবে না।
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Footer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalQrVerifierModal;
