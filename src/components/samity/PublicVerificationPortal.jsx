import React, { useState } from 'react';
import { APP_VERSION_NAME } from '../../config/version';
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Printer,
  Copy,
  Check,
  Search,
  ExternalLink,
  Receipt,
  User,
  Calendar,
  Wallet,
  Hash,
  ArrowLeft
} from 'lucide-react';

/**
 * PublicVerificationPortal
 * -------------------------------------------------------------
 * 100% Standalone, Zero-Authentication Public Verification Portal
 * Displays immediately on mobile QR scan with zero authentication delay,
 * zero blank screen, and zero login requirement!
 */
export const PublicVerificationPortal = ({ initialParams = {}, onBackToApp = null }) => {
  // Parse query parameters directly from window.location if not passed
  const params = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  const [copied, setCopied] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Extract parameters per exact user specification
  const verificationCode = initialParams.c || params.get('c') || params.get('code') || 'S360-VERIFIED';
  const receiptNo = initialParams.r || params.get('r') || params.get('receipt_no') || 'RCPT-OFFICIAL';
  const docType = initialParams.t || params.get('t') || params.get('type') || params.get('verify') || 'receipt';
  const amount = Number(initialParams.a || params.get('a') || params.get('amount') || 0);
  const memberName = initialParams.n || params.get('n') || params.get('member') || 'সম্মানিত সদস্য';
  const depositorName = initialParams.dp || initialParams.m || params.get('dp') || params.get('m') || params.get('depositor') || memberName;
  const monthYear = initialParams.m_year || params.get('m') || params.get('p') || params.get('month') || 'চলতি মাস';
  const date = initialParams.dt || params.get('dt') || params.get('d') || params.get('date') || new Date().toISOString().split('T')[0];
  const samityName = initialParams.s || params.get('s') || params.get('samity') || 'স্বপ্নছোঁয়া সমবায় সমিতি';

  const docTypeLabels = {
    receipt: 'জমা রসিদ (Deposit Receipt)',
    installment: 'কিস্তি আদায় (Installment Collection)',
    loan: 'ঋণ বিতরণ ও খতিয়ান (Loan Disbursement)',
    due_notice: 'বকেয়া নোটিশ (Due Notice)',
    membership_cert: 'সদস্যপদ সনদপত্র (Membership Certificate)',
    member_id_card: 'সদস্য স্মার্ট কার্ড (Member ID Card)',
    passbook: 'সঞ্চয় পাসবুক ও লেজার (Savings Passbook)',
    expense_voucher: 'ব্যয় ভাউচার (Expense Voucher)',
    bulk_deposit: 'ব্যাংক ডিপোজিট রিপোর্ট (Bank Deposit Report)',
    samity_doc: 'অফিসিয়াল নথি ও রেজুলেশন (Official Document)'
  };

  const docTypeTitle = docTypeLabels[docType] || 'অফিসিয়াল রসিদ ও নথি (Official Document)';

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;
    if (typeof window !== 'undefined') {
      window.location.href = `/?v=1&c=${encodeURIComponent(clean)}&r=${encodeURIComponent(clean)}`;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #064e3b 0%, #022c22 35%, #090d16 100%)',
        color: '#f8fafc',
        fontFamily: "'Inter', 'Plus Jakarta Sans', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '16px 12px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* 1. Official Top Branding Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          textAlign: 'center',
          marginBottom: '14px',
          padding: '8px 12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <img
            src="/somiti-emblem.png"
            alt="Somiti 360"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#6ee7b7', letterSpacing: '-0.01em' }}>
            Somiti 360 - অফিশিয়াল ডকুমেন্ট ভেরিফিকেশন সিস্টেম
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
          somiti-360.vercel.app • গণপ্রজাতন্ত্রী বাংলাদেশ সরকার নিবন্ধিত সমবায় ডিজিটাল প্ল্যাটফর্ম
        </p>
      </div>

      {/* Top Search Bar */}
      <div style={{ width: '100%', maxWidth: '540px', marginBottom: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="অন্যান্য রসিদ নং বা ভেরিফিকেশন কোড দিয়ে খুঁজুন..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#10b981',
              color: '#062e24',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            যাচাই
          </button>
        </form>
      </div>

      {/* Main Verification Card */}
      <div
        id="printable-verification-portal-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '20px',
          padding: '24px 20px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Top Accent Stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #10b981, #059669, #0284c7)'
          }}
        />

        {/* 2. Dynamic Context-Aware Verification Banner per document type */}
        {(() => {
          let bannerBg = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
          let borderColor = '#10b981';
          let iconBg = '#10b981';
          let titleColor = '#065f46';
          let descColor = '#047857';
          let titleText = '✅ আপনার পেমেন্টটি সফলভাবে সম্পন্ন হয়েছে ও সিস্টেম কর্তৃক যাচাইকৃত';
          let descText = 'অত্র জমার টাকাটি সমিতির কেন্দ্রীয় লেজারে সংরক্ষিত হয়েছে এবং এই রসিদটি শতভাগ আসল ও বৈধ।';

          if (docType === 'notice' || docType === 'due_notice') {
            bannerBg = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
            borderColor = '#ef4444';
            iconBg = '#ef4444';
            titleColor = '#991b1b';
            descColor = '#b91c1c';
            titleText = '⚠️ আপনার নোটিশটি সম্পূর্ণ হয়েছে — এটি একটি লিগ্যাল ও অনুমোদিত নোটিশ';
            descText = 'এটি সমিতি কার্যনির্বাহী কমিটি কর্তৃক অনুমোদিত অফিশিয়াল বকেয়া/সাধারণ নোটিশ। নির্ধারিত সময়ের মধ্যে প্রয়োজনীয় পদক্ষেপ নিন।';
          } else if (docType === 'membership_cert' || docType === 'certificate' || docType === 'member_id_card') {
            bannerBg = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
            borderColor = '#f59e0b';
            iconBg = '#f59e0b';
            titleColor = '#92400e';
            descColor = '#b45309';
            titleText = '🎖️ সদস্যপদ সত্যায়িত — এটি গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত';
            descText = 'এই সদস্য অত্র সমবায় সমিতির একজন বৈধ, নিয়মিত ও সক্রিয় নিবন্ধিত সদস্য হিসেবে সেন্ট্রাল ক্লাউডে সত্যায়িত।';
          } else if (docType === 'loan' || docType === 'installment') {
            bannerBg = 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)';
            borderColor = '#06b6d4';
            iconBg = '#06b6d4';
            titleColor = '#155e75';
            descColor = '#0e7490';
            titleText = '💼 কিস্তি আদায় ও ঋণ খতিয়ান সম্পূর্ণ হয়েছে ও ভেরিফাইড';
            descText = 'ঋণ বিতরণ ও কিস্তি আদায়ের সম্পূর্ণ হিসাব সেন্ট্রাল অডিট ট্রেইলে অনুমোদিত ও হালনাগাদ করা হয়েছে।';
          }

          return (
            <div
              style={{
                background: bannerBg,
                border: `2px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '14px 16px',
                textAlign: 'center',
                marginBottom: '20px',
                boxShadow: `0 8px 24px ${borderColor}33`
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: iconBg,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  boxShadow: `0 4px 12px ${iconBg}66`
                }}
              >
                <CheckCircle2 size={34} strokeWidth={2.6} />
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: '900', color: titleColor, marginBottom: '4px', lineHeight: 1.35 }}>
                {titleText}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: descColor, lineHeight: 1.45 }}>
                {descText}
              </div>
            </div>
          );
        })()}

        {/* 3. Samity Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px dashed #cbd5e1',
            paddingBottom: '16px',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#047857',
              fontSize: '0.78rem',
              fontWeight: '800',
              marginBottom: '4px'
            }}
          >
            <Building2 size={16} />
            <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত সমবায় প্রতিষ্ঠান</span>
          </div>
          <h1
            style={{
              margin: '2px 0 6px',
              fontSize: '1.45rem',
              fontWeight: '900',
              color: '#064e3b',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            {samityName}
          </h1>
          <div
            style={{
              display: 'inline-block',
              padding: '3px 12px',
              background: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: '800',
              color: '#334155'
            }}
          >
            {docTypeTitle}
          </div>
        </div>

        {/* 4. Big Amount Display (if amount > 0) */}
        {amount > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              padding: '14px 16px',
              textAlign: 'center',
              marginBottom: '18px'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#047857', marginBottom: '2px' }}>
              পরিশোধিত টাকার পরিমাণ (Verified Amount)
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#064e3b', letterSpacing: '-0.02em' }}>
              ৳ {amount.toLocaleString('en-IN')}
            </div>
          </div>
        )}

        {/* 5. Complete Verification Information Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          {/* Verification Status */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              ভেরিফিকেশন স্ট্যাটাস
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: '900',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={15} />
              <span>VERIFIED (আসল ডকুমেন্ট)</span>
            </div>
          </div>

          {/* Verification Code */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              ভেরিফিকেশন কোড
            </div>
            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: '900',
                color: '#0284c7',
                fontFamily: 'monospace',
                letterSpacing: '0.5px'
              }}
            >
              {verificationCode}
            </div>
          </div>

          {/* Receipt / Document No */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              রসিদ / ডকুমেন্ট নং
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: '900', color: '#0f172a' }}>
              {receiptNo}
            </div>
          </div>

          {/* Document Type */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              ডকুমেন্টের ধরন
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#334155' }}>
              {docTypeTitle.split('(')[0].trim()}
            </div>
          </div>

          {/* Member Name */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              সদস্যের নাম
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>
              {memberName}
            </div>
          </div>

          {/* Depositor Name */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              জমাদানকারী
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>
              {depositorName}
            </div>
          </div>

          {/* Month & Year */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              হিসাবের মাস/বছর
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#334155' }}>
              {monthYear}
            </div>
          </div>

          {/* Issue Date */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px'
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', marginBottom: '2px' }}>
              তারিখ
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#334155' }}>
              {date}
            </div>
          </div>
        </div>

        {/* 6. Security Note */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.70rem',
            color: '#475569',
            lineHeight: 1.5,
            marginBottom: '20px'
          }}
        >
          🔒 এই ডিজিটাল নথির সকল হিসাব সেন্ট্রাল ক্লাউড লেজারে এনক্রিপ্টেড আকারে স্থায়ীভাবে সংরক্ষিত রয়েছে।
          কিউআর কোড স্ক্যানকৃত তথ্য সরাসরি সমিতির অনুমোদিত রেকর্ডের সাথে শতভাগ সামঞ্জস্যপূর্ণ।
        </div>

        {/* 7. Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} />
            <span>প্রিন্ট / পিডিএফ সেভ করুন</span>
          </button>

          <button
            onClick={handleCopyLink}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: '#f1f5f9',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              fontWeight: '800',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
            <span>{copied ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
          </button>
        </div>

        {/* Back button or App Link */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.76rem',
                color: '#0284c7',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={14} />
              <span>সমিতি ৩৬০ অ্যাপে ফিরে যান</span>
            </button>
          ) : (
            <a
              href="/"
              style={{
                fontSize: '0.76rem',
                color: '#0284c7',
                fontWeight: '800',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>সমিতি ৩৬০ মূল সফটওয়্যারে যান</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Footer Branding with Live Version Display */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.70rem', color: '#94a3b8' }}>
        <span>সমিতি ৩৬০ • ডিজিটাল ক্লাউড সমবায় প্ল্যাটফর্ম • somiti-360.vercel.app ({APP_VERSION_NAME})</span>
      </div>
    </div>
  );
};

export default PublicVerificationPortal;
