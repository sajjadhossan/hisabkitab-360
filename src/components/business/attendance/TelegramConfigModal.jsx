import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertTriangle, Key, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  getTelegramConfig,
  saveTelegramConfig,
  sendTelegramAttendanceAlert
} from '../../../services/attendanceSecurityService';

/**
 * TelegramConfigModal
 * -------------------
 * Free Telegram Bot Integration for instant management attendance reports:
 * - Bot Token (e.g., from @BotFather)
 * - Chat ID (e.g., from @userinfobot or group chat id)
 * - 1-Click Test Alert Dispatch
 */
export const TelegramConfigModal = ({ isOpen, onClose, totalStaff = 3 }) => {
  const { showToast, lang } = useApp();

  const [config, setConfig] = useState(() => getTelegramConfig());
  const [isSendingTest, setIsSendingTest] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveTelegramConfig(config);
    if (showToast) showToast('✅ টেলিগ্রাম বট কনফিগারেশন সংরক্ষিত হয়েছে!', 'success');
    onClose();
  };

  const handleSendTestAlert = async () => {
    if (!config.botToken || !config.chatId) {
      if (showToast) showToast('বট টোকেন এবং চ্যাট আইডি দিন', 'error');
      return;
    }

    setIsSendingTest(true);
    saveTelegramConfig({ ...config, enabled: true });

    const todayStr = new Date().toISOString().split('T')[0];
    const res = await sendTelegramAttendanceAlert({
      dateStr: todayStr,
      totalStaff,
      presentCount: totalStaff,
      lateCount: 0,
      absentCount: 0,
      sectionSummary: [
        { name: 'সেলস ও কাউন্টার', present: 2, total: 2, ot: 1.5 },
        { name: 'ইনভেন্টরি ও ডেলিভারি', present: 1, total: 1, ot: 0 }
      ]
    });

    setIsSendingTest(false);
    if (res.success) {
      if (showToast) showToast('🎉 টেলিগ্রামে টেস্ট এলার্ট সফলভাবে পাঠানো হয়েছে!', 'success');
    } else {
      if (showToast) showToast(`❌ ব্যর্থ: ${res.reason || res.error || 'টোকেন বা চ্যাট আইডি ভুল'}`, 'error');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '480px', width: '95%', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                টেলিগ্রাম বট নোটিফিকেশন এলার্ট
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ১০০% ফ্রি - কোনো API খরচ বা সাবস্ক্রিপশন ছাড়াই তাৎক্ষণিক রিপোর্ট
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Enabled Toggle */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)' }}>
            দৈনিক হাজিরা এলার্ট সক্রিয় রাখুন:
          </span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Bot Token Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            টেলিগ্রাম বট টোকেন (Bot Token):
          </label>
          <input
            type="text"
            className="input-field"
            value={config.botToken}
            onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
            placeholder="যেমন: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            * টেলিগ্রামে <strong>@BotFather</strong>-এ মেসেজ দিয়ে ১ মিনিটে সম্পূর্ণ বিনামূল্যে তৈরি করুন।
          </div>
        </div>

        {/* Chat ID Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            ম্যানেজমেন্ট চ্যাট / গ্রুপ আইডি (Chat ID):
          </label>
          <input
            type="text"
            className="input-field"
            value={config.chatId}
            onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
            placeholder="যেমন: 987654321 অথবা -100123456789"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            * ব্যক্তিগত আইডি বা ম্যানেজমেন্ট গ্রুপের আইডি দিতে পারেন।
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            disabled={isSendingTest}
            onClick={handleSendTestAlert}
            className="btn btn-secondary press-scale"
            style={{ flex: 1, padding: '11px', fontSize: '0.85rem', fontWeight: '800', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)' }}
          >
            {isSendingTest ? 'পাঠানো হচ্ছে...' : '📨 টেস্ট মেসেজ পাঠান'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary press-scale"
            style={{ flex: 1, padding: '11px', fontSize: '0.85rem', fontWeight: '800', background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
