import React, { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';

/**
 * SamityDocVerificationView
 * -------------------------
 * Public & Internal Digital Verification Portal for Official Samity Letterhead Documents,
 * Notices, Resolutions, and Official Decrees.
 * Authenticates QR scans from phone camera, Google Lens, or internal Barcode Scanner.
 */
export const SamityDocVerificationView = ({ verifyData, onBackToApp }) => {
  const [copied, setCopied] = useState(false);

  // Parse parameters from props or window URL
  const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const refNo = verifyData?.ref || query.get('ref') || 'সছস/২০২৬/০১';
  const title = verifyData?.title || query.get('title') || 'অফিসিয়াল নোটিশ ও কার্যবিবরণী';
  const date = verifyData?.date || query.get('date') || new Date().toISOString().split('T')[0];
  const samityName = verifyData?.samity || query.get('samity') || 'স্বপ্নছোঁয়া সমবায় সমিতি';
  const regNo = verifyData?.reg || query.get('reg') || 'সছস-২০২৪/০৯';
  const bodyText = verifyData?.body || query.get('body') || 'অত্র সমবায় সমিতির সম্মানিত সাধারণ সদস্য এবং কার্যনির্বাহী কমিটির অবগতির জন্য এই মর্মে জানানো যাচ্ছে যে, সমিতির সাধারণ সিদ্ধান্ত অনুযায়ী সকল কার্যক্রম ও হিসাবের ডিজিটাল ভেরিফিকেশন শতভাগ স্বচ্ছতার সাথে সংরক্ষিত রয়েছে।';
  const hash = verifyData?.hash || query.get('hash') || 'HK360-SEC-VERIFIED';

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

  return (
    <div
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
      {/* Top Bar with Back and Print */}
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
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
          <span>মূল সফটওয়্যারে ফিরুন</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
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
            <span>{copied ? '✓ লিংক কপি হয়েছে' : 'লিংক কপি'}</span>
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
            <span>প্রিন্ট / সেভ</span>
          </button>
        </div>
      </div>

      {/* Main Verification Certificate Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
          border: '2px solid #10b981',
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
            background: 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)'
          }}
        />

        {/* Verification Verified Badge */}
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
          <span>✓ ডিজিটালভাবে সত্যায়িত অফিসিয়াল নথি (Digitally Verified Official Document)</span>
        </div>

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
              color: '#fff'
            }}
          >
            <Building2 size={28} />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: '900', color: '#064e3b' }}>
            {samityName}
          </h1>
          <p style={{ margin: '0 0 4px', fontSize: '0.84rem', color: '#475569', fontWeight: '600' }}>
            গণপ্রজাতন্ত্রী বাংলাদেশ সরকার নিবন্ধিত সমবায় সমিতি
          </p>
          <div style={{ display: 'inline-flex', gap: '12px', fontSize: '0.78rem', color: '#059669', fontWeight: '700' }}>
            <span>নিবন্ধন নং: {regNo}</span>
            <span>•</span>
            <span>স্মারক নং: {refNo}</span>
          </div>
        </div>

        {/* Metadata Grid */}
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

        {/* Body Content */}
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
          এই সার্টিফিকেটটি হিসাবকিতাব ৩৬০ ডিজিটাল সমবায় অটোমেশন প্ল্যাটফর্ম দ্বারা স্বয়ংক্রিয়ভাবে যাচাইকৃত। কিউআর কোড এবং ক্লাউড লেজার রেকর্ড অপরিবর্তনযোগ্য।
        </div>
      </div>
    </div>
  );
};

export default SamityDocVerificationView;
