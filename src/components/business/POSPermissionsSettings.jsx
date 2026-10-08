import React, { useState, useEffect } from 'react';
import {
  Monitor,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Percent,
  Banknote,
  Volume2,
  Share2,
  ScanLine,
  Mic,
  Sun,
  Activity,
  UserCheck,
  Truck,
  FileText,
  Save,
  Sparkles,
  Sliders
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hapticFeedback } from '../../services/nativeAppService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';

export const POSPermissionsSettings = ({ lang = 'bn', onSaved = () => {} }) => {
  const { businessSettings, updateBusinessSettings, showToast } = useApp();

  // Initial POS Permission State
  const [permissions, setPermissions] = useState(() => {
    const saved = businessSettings?.posPermissions || {};
    return {
      // Feature visibility in POS header & cart
      showCashDrawer: saved.showCashDrawer ?? true,
      showCustomerMirror: saved.showCustomerMirror ?? true,
      showHoldCart: saved.showHoldCart ?? true,
      showSoundbox: saved.showSoundbox ?? true,
      showDigitalMemo: saved.showDigitalMemo ?? true,
      showVoiceBilling: saved.showVoiceBilling ?? true,
      showWakeLock: saved.showWakeLock ?? true,
      showDiagnostics: saved.showDiagnostics ?? true,

      // Security & Restrictions
      allowCashierDiscount: saved.allowCashierDiscount ?? true,
      maxCashierDiscountPercent: saved.maxCashierDiscountPercent ?? 15,
      allowPriceOverride: saved.allowPriceOverride ?? false,
      requireShiftOpeningCash: saved.requireShiftOpeningCash ?? true,

      // Salesman & SR Role controls
      salesmanCanCollectCash: saved.salesmanCanCollectCash ?? false,
      srCanModifyOrderItems: saved.srCanModifyOrderItems ?? true,
      requireOtpOnDelivery: saved.requireOtpOnDelivery ?? false
    };
  });

  const handleToggle = (key) => {
    playButtonClick();
    hapticFeedback.light();
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    playSuccessChime();
    hapticFeedback.success();

    const updated = {
      ...businessSettings,
      posPermissions: permissions
    };

    updateBusinessSettings(updated);
    try {
      localStorage.setItem('hk360_pos_permissions', JSON.stringify(permissions));
    } catch {}

    showToast(
      lang === 'bn'
        ? '✓ POS ও রোল পারমিশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
        : '✓ POS & Role permissions saved successfully!',
      'success'
    );
    onSaved(permissions);
  };

  return (
    <div className="pos-permissions-settings animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        className="glass-card"
        style={{
          padding: '1.2rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {lang === 'bn' ? 'POS বাটন, পারমিশন ও রোল কন্ট্রোল সেন্টার' : 'POS Permissions & Role Control Center'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn'
                ? 'POS কাউন্টারে কী কী বাটন থাকবে, ডিসকাউন্ট দেওয়ার অধিকার এবং সেলসম্যান/এসআর ভূমিকা নির্ধারণ করুন।'
                : 'Configure visible POS buttons, discount limits, and Salesman vs SR delivery responsibilities.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Save size={16} />
          <span>{lang === 'bn' ? 'সেটিংস সংরক্ষণ করুন' : 'Save Permissions'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: POS Screen Visible Buttons (কি কি বাটন থাকবে / না থাকবে) */}
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Monitor size={18} color="var(--business-primary)" />
            <span>{lang === 'bn' ? '১. POS স্ক্রিনের বাটন প্রদর্শন নিয়ন্ত্রণ' : '1. POS Visible Buttons'}</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                key: 'showCashDrawer',
                label: 'ক্যাশ ড্রয়ার বাটন ও রিকনসিলিয়েশন',
                desc: 'কাউন্টারে ড্রয়ারের নগদ টাকা মেলানোর বাটন',
                icon: <Banknote size={16} color="#10b981" />
              },
              {
                key: 'showCustomerMirror',
                label: 'গ্রাহক লাইভ ডিসপ্লে বাটন (মিরর)',
                desc: 'গ্রাহকের দিকে ২য় স্ক্রিনে লাইভ কার্ট দেখানোর সুইচ',
                icon: <Monitor size={16} color="#6366f1" />
              },
              {
                key: 'showHoldCart',
                label: 'কার্ট সাময়িক সংরক্ষণ (Hold & Recall)',
                desc: 'কাস্টমারের কেনাকাটা সাময়িক হোল্ড করে পরের বিল করা',
                icon: <Sliders size={16} color="#f59e0b" />
              },
              {
                key: 'showSoundbox',
                label: 'ভয়েস সাউন্ডবক্স বাটন',
                desc: 'বিকাশ/নগদে টাকা আসলে বাংলায় বলার সাউন্ড সুইচ',
                icon: <Volume2 size={16} color="#ec4899" />
              },
              {
                key: 'showDigitalMemo',
                label: 'WhatsApp ও SMS ডিজিটাল মেমো বাটন',
                desc: 'কাগজ ছাড়া মোবাইলে সরাসরি ডিজিটাল চালান পাঠানো',
                icon: <Share2 size={16} color="#25D366" />
              },
              {
                key: 'showVoiceBilling',
                label: 'ভয়েস বিলিং ও মাইক বাটন',
                desc: 'মুখে বলে দ্রুত কার্টে পণ্য যোগ করার সুবিধা',
                icon: <Mic size={16} color="#8b5cf6" />
              },
              {
                key: 'showWakeLock',
                label: 'সদা জাগ্রত স্ক্রিন বাটন (Screen On)',
                desc: 'বিক্রয় চলাকালীন ডিসপ্লে স্লিপ হওয়া বন্ধ রাখা',
                icon: <Sun size={16} color="#eab308" />
              },
              {
                key: 'showDiagnostics',
                label: 'সিস্টেম ডায়াগনস্টিকস বাটন',
                desc: 'স্টোরেজ ও মেমোরি ক্লিনার টুলস',
                icon: <Activity size={16} color="#06b6d4" />
              }
            ].map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.icon}
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions[item.key]}
                  onChange={() => handleToggle(item.key)}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Card 2: Price & Discount Restrictions (নিরাপত্তা ও ডিসকাউন্ট সীমা) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Lock size={18} color="#ef4444" />
              <span>{lang === 'bn' ? '২. ডিসকাউন্ট ও বিক্রয়মূল্য নিরাপত্তা' : '2. Discount & Pricing Rules'}</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Cashier Discount Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ক্যাশিয়ার ডিসকাউন্ট দিতে পারবে?' : 'Allow Cashier Discounts'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'বন্ধ থাকলে POS-এ ডিসকাউন্ট ইনপুট লক থাকবে' : 'Disables discount input on cashier mode'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.allowCashierDiscount}
                  onChange={() => handleToggle('allowCashierDiscount')}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </label>

              {/* Max Discount Limit */}
              {permissions.allowCashierDiscount && (
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'সর্বোচ্চ অনুমোদিত ডিসকাউন্ট (%):' : 'Max Discount Percentage (%):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={permissions.maxCashierDiscountPercent}
                    onChange={(e) => setPermissions({ ...permissions, maxCashierDiscountPercent: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '0.9rem'
                    }}
                  />
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {lang === 'bn' ? 'এর বেশি ছাড় দিতে চাইলে মালিক/ম্যানেজারের অনুমোদন লাগবে' : 'Discounts exceeding this limit require approval'}
                  </div>
                </div>
              )}

              {/* Price Override Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'পণ্যের মূল দাম পরিবর্তন করার অনুমতি' : 'Allow Price Override'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'সেলসম্যান কার্টে থাকা অবস্থায় পণ্যের মূল্য বদলাতে পারবে কি না' : 'Allow cashier to change unit selling price'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.allowPriceOverride}
                  onChange={() => handleToggle('allowPriceOverride')}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Card 3: Salesman & SR Role Responsibilities */}
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '4px solid #6366f1' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Truck size={18} color="#6366f1" />
              <span>{lang === 'bn' ? '৩. সেলসম্যান (Salesman) ও এসআর (SR) ভূমিকা' : '3. Salesman & SR Workflow'}</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                📝 <strong>সেলসম্যানের নিয়ম:</strong> সেলসম্যান শুধু দোকানে ঘুরে অর্ডার কাটবে। কোনো স্টক সরাসরি কাটা হবে না। অর্ডারটি পেন্ডিং ডেলিভারি হিসেবে এসআর এর বোর্ডে যাবে।
              </div>

              <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                🚚 <strong>এসআর-এর নিয়ম:</strong> এসআর মাল গাড়িতে তুলে কাস্টমারকে ডেলিভারি দেবে। কাস্টমার মাল বুঝে পেয়ে টাকা দিলে এসআর ডেলিভারি কনফার্ম করবে এবং তখনই ইনভেনটরি থেকে স্টক কাটবে।
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'সেলসম্যান কি অগ্রিম টাকা নিতে পারবে?' : 'Salesman Can Collect Advance Cash'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'অন থাকলে সেলসম্যান অর্ডার কাটার সময়েই অগ্রিম ক্যাশ এন্ট্রি নিতে পারবে' : 'Allow salesman to accept advance deposits'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.salesmanCanCollectCash}
                  onChange={() => handleToggle('salesmanCanCollectCash')}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'এসআর কি ডেলিভারির সময় আইটেম কমাতে পারবে?' : 'SR Can Adjust Items on Delivery'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'কাস্টমার কোনো পণ্য কম নিতে চাইলে এসআর ডেলিভারির সময় পরিমাণ কমাতে পারবে' : 'Allow SR to reduce item count at delivery time'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={permissions.srCanModifyOrderItems}
                  onChange={() => handleToggle('srCanModifyOrderItems')}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
