import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  User,
  Calendar,
  MapPin,
  Droplet,
  Check,
  ChevronRight,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { scanSmartNidImage } from '../../services/nidOcrParserService';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export default function AiNidOcrScannerModal({
  isOpen,
  onClose,
  onApplyNidData = () => {},
  showToast = () => {}
}) {
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [frontImage, setFrontImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepMessage, setScanStepMessage] = useState('');
  
  const [extractedData, setExtractedData] = useState({
    nameBn: '',
    nameEn: '',
    fatherName: '',
    motherName: '',
    nidNumber: '',
    dateOfBirth: '',
    bloodGroup: '',
    address: ''
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChosen = async (file) => {
    if (!file) return;
    playButtonClick?.();
    hapticFeedback.light();

    const previewUrl = URL.createObjectURL(file);
    if (activeSide === 'front') {
      setFrontImage(file);
      setFrontPreview(previewUrl);
    } else {
      setBackImage(file);
      setBackPreview(previewUrl);
    }

    // Trigger AI Scan
    setIsScanning(true);
    setScanProgress(0.1);
    setScanStepMessage('ছবি বিশ্লেষণ শুরু হচ্ছে...');

    try {
      const parsed = await scanSmartNidImage(file, ({ progress, message }) => {
        setScanProgress(progress);
        setScanStepMessage(message);
      });

      setExtractedData(prev => ({
        ...prev,
        ...parsed,
        nameBn: parsed.nameBn || prev.nameBn,
        nameEn: parsed.nameEn || prev.nameEn,
        fatherName: parsed.fatherName || prev.fatherName,
        motherName: parsed.motherName || prev.motherName,
        nidNumber: parsed.nidNumber || prev.nidNumber,
        dateOfBirth: parsed.dateOfBirth || prev.dateOfBirth,
        bloodGroup: parsed.bloodGroup || prev.bloodGroup,
        address: parsed.address || prev.address
      }));

      playSuccessChime?.();
      hapticFeedback.success();
      showToast('✨ এনআইডি কার্ড সফলভাবে স্ক্যান করা হয়েছে!', 'success');
    } catch (err) {
      hapticFeedback.error();
      showToast(err.message || 'স্ক্যানিং ব্যর্থ হয়েছে। স্পষ্ট ছবি দিন।', 'error');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleApplyToForm = () => {
    playButtonClick?.();
    hapticFeedback.medium();
    onApplyNidData(extractedData);
    showToast('সদস্য ফর্মে এনআইডি তথ্য স্বয়ংক্রিয়ভাবে যুক্ত করা হয়েছে!', 'success');
    onClose();
  };

  const hasExtractedInfo = Boolean(
    extractedData.nidNumber || extractedData.nameBn || extractedData.nameEn || extractedData.dateOfBirth
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                বাংলা স্মার্ট এনআইডি ওসিআর স্ক্যানার
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  অন-ডিভাইস AI
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ক্যামেরা বা ছবি থেকে জাতীয় পরিচয়পত্রের তথ্য অটো-ফিল করুন
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Side Selector Tabs (Front vs Back) */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveSide('front'); hapticFeedback.selection(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeSide === 'front'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              ১. সামনের দিক (নাম, আইডি, জন্মতারিখ)
              {frontPreview && <Check className="w-3.5 h-3.5 text-emerald-500 ml-1" />}
            </button>
            <button
              type="button"
              onClick={() => { setActiveSide('back'); hapticFeedback.selection(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeSide === 'back'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapPin className="w-4 h-4" />
              ২. পেছনের দিক (ঠিকানা ও রক্তের গ্রুপ)
              {backPreview && <Check className="w-3.5 h-3.5 text-emerald-500 ml-1" />}
            </button>
          </div>

          {/* Upload & Camera Capture Zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 rounded-2xl p-4 text-center bg-slate-50/50 dark:bg-slate-800/30 transition-all">
            {activeSide === 'front' && frontPreview ? (
              <div className="space-y-3">
                <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                  <img src={frontPreview} alt="NID Front" className="w-full h-44 object-cover" />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium backdrop-blur-sm">
                    সামনের দিক
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    আবার ছবি তুলুন
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    গ্যালারি থেকে পরিবর্তন
                  </button>
                </div>
              </div>
            ) : activeSide === 'back' && backPreview ? (
              <div className="space-y-3">
                <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                  <img src={backPreview} alt="NID Back" className="w-full h-44 object-cover" />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium backdrop-blur-sm">
                    পেছনের দিক
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    আবার ছবি তুলুন
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    গ্যালারি থেকে পরিবর্তন
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {activeSide === 'front' ? 'স্মার্ট এনআইডি কার্ডের সামনের দিক' : 'স্মার্ট এনআইডি কার্ডের পেছনের দিক'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    মোবাইলের ক্যামেরা দিয়ে ছবি তুলুন অথবা গ্যালারি থেকে আপলোড করুন
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    ক্যামেরা চালু করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    ছবি নির্বাচন করুন
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
            />
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  {scanStepMessage}
                </span>
                <span>{Math.round(scanProgress * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Extracted Fields Live Review Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-500" />
                শনাক্তকৃত এনআইডি তথ্য (Extracted Preview):
              </span>
              {hasExtractedInfo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  রেডি
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">নাম (বাংলা):</label>
                <input
                  type="text"
                  value={extractedData.nameBn}
                  onChange={(e) => setExtractedData(p => ({ ...p, nameBn: e.target.value }))}
                  placeholder="যেমন: মোঃ সাজ্জাদ হোসেন"
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Name (English):</label>
                <input
                  type="text"
                  value={extractedData.nameEn}
                  onChange={(e) => setExtractedData(p => ({ ...p, nameEn: e.target.value }))}
                  placeholder="e.g. Md. Sajjad Hossain"
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">এনআইডি নম্বর (NID No):</label>
                <input
                  type="text"
                  value={extractedData.nidNumber}
                  onChange={(e) => setExtractedData(p => ({ ...p, nidNumber: e.target.value }))}
                  placeholder="১০ বা ১৭ ডিজিটের এনআইডি"
                  className="w-full font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-purple-600 dark:text-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">জন্ম তারিখ (YYYY-MM-DD):</label>
                <input
                  type="date"
                  value={extractedData.dateOfBirth}
                  onChange={(e) => setExtractedData(p => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">পিতার নাম:</label>
                <input
                  type="text"
                  value={extractedData.fatherName}
                  onChange={(e) => setExtractedData(p => ({ ...p, fatherName: e.target.value }))}
                  placeholder="পিতার নাম"
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">মাতার নাম:</label>
                <input
                  type="text"
                  value={extractedData.motherName}
                  onChange={(e) => setExtractedData(p => ({ ...p, motherName: e.target.value }))}
                  placeholder="মাতার নাম"
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">রক্তের গ্রুপ:</label>
                <input
                  type="text"
                  value={extractedData.bloodGroup}
                  onChange={(e) => setExtractedData(p => ({ ...p, bloodGroup: e.target.value }))}
                  placeholder="যেমন: B+, O+"
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">ঠিকানা (Address):</label>
                <input
                  type="text"
                  value={extractedData.address}
                  onChange={(e) => setExtractedData(p => ({ ...p, address: e.target.value }))}
                  placeholder="গ্রাম, ডাকঘর, উপজেলা, জেলা"
                  className="w-full font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleApplyToForm}
            disabled={!hasExtractedInfo || isScanning}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            সরাসরি সদস্য নিবন্ধন ফর্মে বসান
          </button>
        </div>

      </div>
    </div>
  );
}
