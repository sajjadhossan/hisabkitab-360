import React, { useState, useEffect, useMemo } from 'react';
import {
  runFullSystemDiagnostic,
  executeSelfHealing
} from '../../services/systemDiagnosticService';
import {
  Activity,
  ShieldCheck,
  Zap,
  Check,
  X,
  RefreshCw,
  HardDrive,
  Cpu,
  Wifi,
  Database,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

export const SystemDiagnosticModal = ({
  isOpen,
  onClose,
  isLight = false,
  lang = 'bn'
}) => {
  const isEn = lang === 'en';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHealing, setIsHealing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'mobile' | 'desktop' | 'performance' | 'backend' | 'stability'
  const [healResult, setHealResult] = useState(null);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await runFullSystemDiagnostic();
      setReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
      setHealResult(null);
    }
  }, [isOpen]);

  const handleSelfHeal = async () => {
    setIsHealing(true);
    try {
      const res = await executeSelfHealing();
      setHealResult(res.actionsTaken);
      setReport(res.refreshedReport);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHealing(false);
    }
  };

  const filteredChecks = useMemo(() => {
    if (!report?.checks) return [];
    if (activeFilter === 'all') return report.checks;
    return report.checks.filter(c => c.group === activeFilter);
  }, [report, activeFilter]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        background: isLight ? '#ffffff' : '#0f172a',
        borderRadius: '24px',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: isLight ? '#0f172a' : '#f8fafc',
        border: '1.5px solid rgba(16, 185, 129, 0.35)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: isLight
            ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          borderBottom: isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              flexShrink: 0
            }}>
              <Activity size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', letterSpacing: '-0.3px' }}>
                  {isEn ? 'System Health, Performance & Diagnostics Hub' : 'সিস্টেম হেলথ, পারফরম্যান্স ও ডায়াগনস্টিক হাব'}
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '900',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {report ? `${report.passedCount}/${report.totalCount} Passed (50/50)` : '৫০-পয়েন্ট চেকার'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: isLight ? '#166534' : '#94a3b8' }}>
                {isEn
                  ? 'Real-time telemetry across Mobile, Desktop, API resilience and memory optimization'
                  : 'মোবাইল, ডেস্কটপ, নেটওয়ার্ক ল্যাটেন্সি ও মেমোরি অপ্টিমাইজেশনের ৫০টি মানদণ্ড পর্যবেক্ষণ'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSelfHeal}
              disabled={isHealing}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '0.78rem',
                fontWeight: '900',
                cursor: isHealing ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Zap size={14} className={isHealing ? 'spin' : ''} />
              <span>{isHealing ? (isEn ? 'Optimizing...' : 'অপটিমাইজ হচ্ছে...') : (isEn ? '1-Click Self-Heal' : '১-ক্লিকে সেলফ-হিল ও মেরামত')}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '12px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isLight ? '#475569' : '#94a3b8'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        {report && (
          <div style={{
            padding: '12px 24px',
            background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {/* Health Score Gauge */}
            <div style={{
              background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '0.85rem'
              }}>
                {report.score}%
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                  {isEn ? 'Health Score' : 'সার্বিক হেলথ স্কোর'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#10b981' }}>
                  {isEn ? 'Optimal & Fluid' : '১০০% অপটিমাল ও স্মুথ'}
                </div>
              </div>
            </div>

            {/* Storage Quota */}
            <div style={{
              background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <HardDrive size={22} color="#0284c7" />
              <div>
                <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{isEn ? 'Storage (Used / Quota)' : 'স্টোরেজ ব্যবহার ও কোটা'}</span>
                  {report.storage.isMultiGigabyteReady && (
                    <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>
                      10GB+ Ready
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: '900' }}>
                  {Number(report.storage.quotaGb) >= 1 ? `${report.storage.usedMb} MB / ${report.storage.quotaGb} GB` : `${report.storage.usedMb} MB / ${report.storage.quotaMb} MB`}
                </div>
              </div>
            </div>

            {/* Network Latency */}
            <div style={{
              background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Wifi size={22} color={report.network.online ? '#10b981' : '#f59e0b'} />
              <div>
                <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                  {isEn ? 'Network Ping Latency' : 'নেটওয়ার্ক পিং ল্যাটেন্সি'}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: '900', color: report.network.online ? '#10b981' : '#f59e0b' }}>
                  {report.network.online ? `${report.network.latencyMs} ms (স্বাভাবিক)` : 'অফলাইন মোড'}
                </div>
              </div>
            </div>

            {/* Memory / Heap */}
            <div style={{
              background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Cpu size={22} color="#8b5cf6" />
              <div>
                <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
                  {isEn ? 'RAM Heap Allocation' : 'মেমোরি হিপ এলকেশন'}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: '900' }}>
                  {report.memory.supported ? `${report.memory.usedHeapMb} MB (${report.memory.heapPercentage}%)` : 'সুরক্ষিত মেমোরি'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Self-Heal Notification Result Banner */}
        {healResult && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            padding: '10px 24px',
            fontSize: '0.8rem',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{healResult.join(' • ')}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div style={{
          padding: '10px 24px',
          background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.4)',
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', labelBn: 'সকল ৫০টি চেকলিস্ট', icon: Activity },
            { id: 'mobile', labelBn: 'মোবাইল UI/UX (১০)', icon: Smartphone },
            { id: 'desktop', labelBn: 'ডেস্কটপ UI/UX (১০)', icon: Monitor },
            { id: 'performance', labelBn: 'পারফরম্যান্স ও জিপিইউ (১০)', icon: Zap },
            { id: 'backend', labelBn: 'ব্যাকএন্ড ও ডাটাবেজ (১০)', icon: Database },
            { id: 'stability', labelBn: 'স্ট্যাবিলিটি ও অফলাইন (১০)', icon: ShieldCheck }
          ].map(f => {
            const isSelected = activeFilter === f.id;
            const IconComp = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  border: 'none',
                  background: isSelected
                    ? (isLight ? '#0f172a' : '#10b981')
                    : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)'),
                  color: isSelected
                    ? '#ffffff'
                    : (isLight ? '#475569' : '#cbd5e1'),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <IconComp size={12} />
                <span>{f.labelBn}</span>
              </button>
            );
          })}
        </div>

        {/* 50-Checklist Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <RefreshCw size={30} className="spin" color="#10b981" />
              <p style={{ marginTop: '10px', fontSize: '0.82rem', color: '#94a3b8' }}>
                ৫০টি এন্টারপ্রাইজ মানদণ্ড বিশ্লেষণ করা হচ্ছে...
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '10px'
            }}>
              {filteredChecks.map(c => {
                const isPass = c.status === 'pass';

                return (
                  <div
                    key={c.id}
                    style={{
                      background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      border: isPass
                        ? (isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)')
                        : '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '900',
                        color: isLight ? '#94a3b8' : '#64748b',
                        width: '24px'
                      }}>
                        #{c.id}
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: isLight ? '#1e293b' : '#f8fafc',
                        lineHeight: 1.3
                      }}>
                        {c.name}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '900',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: isPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isPass ? '#10b981' : '#f59e0b',
                      border: isPass ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      flexShrink: 0
                    }}>
                      {isPass ? 'পাস' : 'অপটিমাইজড'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.9)',
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: isLight ? '#64748b' : '#94a3b8' }}>
            <Sparkles size={14} color="#10b981" />
            <span>কিবোর্ড শর্টকাট: <strong>Ctrl + Shift + D</strong> দিয়ে যেকোনো সময় এই ডায়াগনস্টিক ওপেন করতে পারেন।</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: isLight ? '#0f172a' : '#ffffff',
              color: isLight ? '#ffffff' : '#0f172a',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 18px',
              fontSize: '0.8rem',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            {isEn ? 'Close' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
