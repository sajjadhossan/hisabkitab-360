import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Cloud,
  Smartphone,
  Monitor,
  Globe,
  Database,
  Key,
  RefreshCw,
  Terminal,
  HelpCircle
} from 'lucide-react';

export const SystemTroubleshootingHub = ({ lang = 'bn', showToast }) => {
  const [copiedKey, setCopiedKey] = useState('');

  const copyToClipboard = (text, keyName, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    if (showToast) {
      showToast(lang === 'bn' ? `📋 "${label}" সফলভাবে কপি করা হয়েছে!` : `Copied: ${label}`);
    }
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const redirectUri = 'https://juahukfvwbwupsamqzyo.supabase.co/auth/v1/callback';
  const supabaseUrl = 'https://juahukfvwbwupsamqzyo.supabase.co';

  return (
    <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px', border: '1px solid var(--border-color)', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Wrench size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', color: 'var(--text-main)' }}>
              {lang === 'bn' ? '🛠️ অ্যাপ মডিফিকেশন ও ট্রাবলশুটিং গাইড' : 'App Modification & Troubleshooting Hub'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'গুগল ড্রাইভ অথেন্টিকেশন, রিডাইরেক্ট ইউআরআই এরর ও মাল্টি-প্ল্যাটফর্ম কানেক্টিভিটি সমাধান'
                : 'Step-by-step technical fixes for Google OAuth, Redirect URIs & Cross-platform sync'}
            </p>
          </div>
        </div>

        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.75rem',
          fontWeight: '800'
        }}>
          ● লাইভ ডায়াগনস্টিক রেডি
        </span>
      </div>

      {/* Guide 1: Google OAuth Error 400 redirect_uri_mismatch */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.06)',
        border: '1.5px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '8px' }}>
          <AlertTriangle size={20} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
            {lang === 'bn' ? '১. গুগল লগইন / ড্রাইভ Error 400: redirect_uri_mismatch সমাধান' : '1. Fix Error 400: redirect_uri_mismatch (Google OAuth)'}
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
          {lang === 'bn'
            ? 'গুগল ক্লাউড কনসোলে সুপাবেসের অনুমোদিত রিডাইরেক্ট কলব্যাক ইউআরআই (Authorized Redirect URI) যুক্ত না থাকলে এই এরর আসে। নিচের ইউআরআই-টি কপি করে গুগল কনসোলে ১ ক্লিকে পেস্ট করুন:'
            : 'This error occurs when Supabase callback URL is not listed under Authorized redirect URIs in Google Cloud Console.'}
        </p>

        {/* Copyable Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '14px',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <code style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '700', wordBreak: 'break-all' }}>
            {redirectUri}
          </code>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => copyToClipboard(redirectUri, 'redirect_uri', 'Redirect URI')}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            {copiedKey === 'redirect_uri' ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            <span>{copiedKey === 'redirect_uri' ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy URI')}</span>
          </button>
        </div>

        {/* Visual Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '4px' }}>ধাপ ০১: গুগল কনসোল ওপেন</strong>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
            >
              Google Cloud Credentials পেজে যান <ExternalLink size={12} />
            </a>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>ধাপ ০২: ক্লায়েন্ট এডিট</strong>
            <span><strong>OAuth 2.0 Client IDs</strong> সেকশনে আপনার তৈরি করা ক্লায়েন্ট নামে ক্লিক করুন।</span>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <strong style={{ color: '#8b5cf6', display: 'block', marginBottom: '4px' }}>ধাপ ০৩: URI পেস্ট ও সেভ</strong>
            <span><strong>Authorized redirect URIs</strong>-এ উপরের কপি করা লিংকটি পেস্ট করে নিচে <strong>Save</strong> বাটনে চাপ দিন। ২ মিনিট অপেক্ষা করুন।</span>
          </div>
        </div>
      </div>

      {/* Guide 2: Google Drive Auto-Sync Hub & 30-File Rolling Retention */}
      <div style={{
        background: 'rgba(14, 165, 233, 0.06)',
        border: '1.5px solid rgba(14, 165, 233, 0.35)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', marginBottom: '8px' }}>
          <Cloud size={20} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
            {lang === 'bn' ? '২. গুগল ড্রাইভ ১-মিনিট অটো ব্যাকআপ ও ৩০-ফাইল রোটেশন' : '2. Google Drive 1-Min Auto-Sync & 30-File Rotation'}
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 10px 0' }}>
          {lang === 'bn'
            ? 'হিসাবকিতাব ৩৬০ প্রতি ৬০ সেকেন্ড পরপর স্বয়ংক্রিয়ভাবে সম্পূর্ণ হিসাব ক্লাউডে ড্রাইভ ব্যাকআপ হিসেবে পাঠিয়ে রাখে। আপনার ড্রাইভে জায়গা অপচয় এড়াতে সর্বশেষ ৩০টি ব্যাকআপ ফাইল চক্রাকারে ঘূর্ণায়মান (Rolling 30 backups) থাকে।'
            : 'Auto-sync pushes an encrypted store snapshot every 60 seconds retaining the latest 30 files.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', background: 'var(--bg-primary)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            ✓ Scope: <code>drive.file</code> (কেবল অ্যাপের নিজস্ব ফোল্ডার ব্যাকআপ)
          </span>
          <span style={{ fontSize: '0.76rem', background: 'var(--bg-primary)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            ✓ ফরম্যাট: <code>hisabkitab_backup_YYYY-MM-DD.json</code>
          </span>
        </div>
      </div>

      {/* Guide 3: Multi-Platform 3 Counters Cross-Device Hub */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1.5px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '16px',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
          <ShieldCheck size={20} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
            {lang === 'bn' ? '৩. ৩ কাউন্টার লাইভ ও ক্রস-প্ল্যাটফর্ম কানেক্টিভিটি' : '3. 3-Counter Realtime Multi-Device Sync Hub'}
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
          {lang === 'bn'
            ? 'পিসি, মোবাইল বা ওয়েব—যেকোনো ডিভাইস থেকে সেলস বা ক্যাশ এন্ট্রি হলে মুহূর্তেই সকল কাউন্টারে সিঙ্ক হয় এবং মেমোতে ডিভাইস অরিজিন ট্যাগ যুক্ত হয়।'
            : 'Transactions made on PC, Mobile, or Web immediately broadcast across all connected terminals with explicit device tags.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.82rem', color: '#60a5fa', marginBottom: '4px' }}>
              <Monitor size={15} /> 💻 পিসি কাউন্টার (PC Desktop)
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>লোকালহোস্ট প্রিভিউ ও ডাবল স্ক্রিন পিওএস সাপোর্ট</span>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.82rem', color: '#34d399', marginBottom: '4px' }}>
              <Smartphone size={15} /> 📱 মোবাইল কাউন্টার (Android APK)
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>টাচ সোয়াইপ কন্ট্রোল, ক্যামেরা বারকোড ও পকেট বিলিং</span>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.82rem', color: '#a78bfa', marginBottom: '4px' }}>
              <Globe size={15} /> 🌐 ওয়েব কাউন্টার (Vercel Web)
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>রিমোট ক্যাশিয়ার ও যেকোনো ব্রাউজার থেকে সুরক্ষিত অ্যাক্সেস</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemTroubleshootingHub;
