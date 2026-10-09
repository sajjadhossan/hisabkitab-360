import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  Building,
  RefreshCw,
  Plus,
  Image as ImageIcon,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/**
 * ReceiptOCRScannerModal
 * -----------------------
 * Real Paper Invoices, Cash Memos & Wholesale Receipts Scanner.
 * Allows capturing genuine paper vouchers via camera or file upload,
 * inspecting the high-resolution receipt photo, entering/editing genuine amounts & vendors,
 * and recording directly to Business Daily Expenses with image attachment.
 */
export const ReceiptOCRScannerModal = ({ isOpen, onClose, onApplyExpense, onApplyInventory }) => {
  const { lang, showToast, addExpense } = useApp();

  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [memoNo, setMemoNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('মহাজনী মাল কেনা / পাইকারি বাজার');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [hasScanned, setHasScanned] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Process genuine captured image
  const handleProcessImage = (imageSrc) => {
    setIsProcessing(true);
    setImagePreview(imageSrc);

    // Analyze image client-side
    const img = new Image();
    img.onload = () => {
      const generatedMemo = `MEMO-${Date.now().toString().slice(-6)}`;
      setMemoNo(generatedMemo);
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setIsProcessing(false);
      setHasScanned(true);

      if (showToast) {
        showToast(
          lang === 'bn'
            ? '✅ ভাউচারের ছবি সফলভাবে লোড হয়েছে! পরিমাণ ও মহাজনের নাম যাচাই করে সেভ করুন।'
            : 'Receipt image loaded! Verify vendor & amount to record.',
          'success'
        );
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
      if (showToast) showToast('ছবি লোড করা যায়নি', 'error');
    };
    img.src = imageSrc;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      handleProcessImage(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateExpense = () => {
    const amountNum = parseFloat(totalAmount);
    if (!amountNum || amountNum <= 0) {
      if (showToast) {
        showToast(lang === 'bn' ? 'অনুগ্রহ করে রসিদের মোট টাকার সঠিক পরিমাণ লিখুন!' : 'Please enter valid total amount!', 'error');
      }
      return;
    }

    const expenseEntry = {
      amount: amountNum,
      category: expenseCategory,
      description: `${vendorName || 'ক্যাশ মেমো'} (ভাউচার: ${memoNo || 'N/A'})`,
      date: receiptDate,
      paymentMethod: 'cash',
      receiptImage: imagePreview || '',
      note: receiptNotes || 'কাগজের ভাউচার ক্যামেরা স্ক্যান থেকে রেকর্ডকৃত'
    };

    if (addExpense) {
      addExpense(expenseEntry);
    }

    if (onApplyExpense) {
      onApplyExpense(expenseEntry);
    }

    if (showToast) {
      showToast(
        lang === 'bn'
          ? `🎉 ৳${amountNum.toLocaleString()} টাকার রসিদ খরচের খাতায় যুক্ত হয়েছে!`
          : `Expense of ৳${amountNum} recorded!`,
        'success'
      );
    }

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setImagePreview(null);
    setHasScanned(false);
    setVendorName('');
    setMemoNo('');
    setTotalAmount('');
    setReceiptNotes('');
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '580px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.5rem',
          borderRadius: '16px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'কাগজের ক্যাশ মেমো ও ভাউচার স্ক্যানার' : 'Invoice & Receipt Voucher Scanner'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ছবি তুলে সরাসরি আসল খরচের খাতায় ডিজিটাল ভাউচার হিসেবে সংরক্ষণ' : 'Snap genuine paper receipts and record directly'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Upload / Capture Section */}
        {!imagePreview && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed var(--border-color)', borderRadius: '12px', background: 'var(--bg-secondary)', marginBottom: '1.25rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#6366f1' }}>
              <Camera size={28} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'কাগজের মেমোর ছবি তুলুন বা আপলোড করুন' : 'Take a photo or upload receipt'}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {lang === 'bn' ? 'পাইকারি দোকানের কাগজের ক্যাশ মেমো বা ভাউচারের স্পষ্ট ছবি দিন' : 'Works with paper vouchers, wholesale bills and receipts'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Camera size={16} />
                <span>{lang === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুলুন' : 'Snap Photo'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={16} />
                <span>{lang === 'bn' ? 'গ্যালারি / ফাইল সিলেক্ট করুন' : 'Browse File'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '10px', color: '#6366f1' }}>
              <RefreshCw size={28} />
            </div>
            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'ভাউচারের ছবি প্রসেস করা হচ্ছে...' : 'Processing receipt image...'}
            </div>
          </div>
        )}

        {/* Genuine Receipt Data Verification Form */}
        {hasScanned && !isProcessing && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Thumbnail Preview Banner */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #6366f1' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '800' }}>
                  ✓ আসল ভাউচার ছবি ক্যাপচার সম্পন্ন
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  নিচের ফিল্ডগুলোতে রসিদ দেখে আসল তথ্য ও টাকার পরিমাণ লিখুন:
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
              >
                {lang === 'bn' ? 'নতুন ছবি' : 'Retake'}
              </button>
            </div>

            {/* Input Grid: Total Amount & Category */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '14px'
            }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', display: 'block', marginBottom: '6px' }}>
                💰 রসিদের মোট টাকার পরিমাণ (Total BDT) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)' }}>৳</span>
                <input
                  type="number"
                  className="input-field"
                  placeholder="যেমন: 3500"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                    padding: '8px 12px'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Vendor & Memo Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  দোকান / মহাজনের নাম:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: হাজী ট্রেডার্স"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  চালান / মেমো নং:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="MEMO-12345"
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  style={{ fontSize: '0.88rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Date & Category Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ভাউচারের তারিখ:
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  খরচের ক্যাটাগরি:
                </label>
                <select
                  className="input-field"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                >
                  <option value="মহাজনী মাল কেনা / পাইকারি বাজার">মহাজনী মাল কেনা / পাইকারি বাজার</option>
                  <option value="দোকান ভাড়া ও বিদ্যুৎ বিল">দোকান ভাড়া ও বিদ্যুৎ বিল</option>
                  <option value="পরিবহন ও মালামাল আনা-নেওয়া">পরিবহন ও মালামাল আনা-নেওয়া</option>
                  <option value="কর্মচারীর নাস্তা ও আপ্যায়ন">কর্মচারীর নাস্তা ও আপ্যায়ন</option>
                  <option value="অন্যান্য বিবিধ খরচ">অন্যান্য বিবিধ খরচ</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                মন্তব্য / পণ্যের বিস্তারিত নোট:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="যেমন: ৫০ বস্তা সিমেন্ট বা চালের পেমেন্ট"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateExpense}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '10px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>খরচের খাতায় নিশ্চিত করুন (Save Voucher)</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ padding: '12px 18px' }}
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
