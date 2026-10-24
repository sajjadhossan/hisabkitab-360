import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  subscribeDevicePresence,
  getOnlineDevicesList,
  format12HourTime,
  getDeviceOrigin,
  broadcastSamityStateChange
} from '../../services/somitiCloudSyncService';
import {
  playButtonClick,
  playSuccessChime,
  playRadarPingSound,
  playWarningTone
} from '../../services/soundFeedback';

export const SupervisorLiveRadarModal = ({
  isOpen,
  onClose,
  data = {},
  onUpdateData,
  isLight = false,
  activeLang = 'bn',
  currentStaffName = 'সুপারভাইজার'
}) => {
  if (!isOpen) return null;

  const t = (bn, en) => (activeLang === 'bn' ? bn : en);

  // Filter & Search states
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'verified'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAudioRadarActive, setIsAudioRadarActive] = useState(() => {
    return localStorage.getItem('somiti360_radar_audio') !== 'false';
  });
  const [onlineDevices, setOnlineDevices] = useState(() => getOnlineDevicesList());
  const [radarPulseAnim, setRadarPulseAnim] = useState(false);
  const [highlightedDepositId, setHighlightedDepositId] = useState(null);

  const prevDepositsCountRef = useRef(data?.deposits?.length || 0);

  // Subscribe to live device presences
  useEffect(() => {
    const unsub = subscribeDevicePresence((list) => {
      if (Array.isArray(list)) setOnlineDevices(list);
    });
    return () => unsub();
  }, []);

  // Detect incoming live collections & trigger radar ping sound
  useEffect(() => {
    const currentCount = data?.deposits?.length || 0;
    if (currentCount > prevDepositsCountRef.current) {
      if (isAudioRadarActive) {
        try {
          playRadarPingSound();
        } catch {}
      }
      setRadarPulseAnim(true);
      const timer = setTimeout(() => setRadarPulseAnim(false), 2000);

      // Highlight newest deposit
      const newest = data.deposits[data.deposits.length - 1];
      if (newest?.id) {
        setHighlightedDepositId(newest.id);
        setTimeout(() => setHighlightedDepositId(null), 4000);
      }

      prevDepositsCountRef.current = currentCount;
      return () => clearTimeout(timer);
    }
    prevDepositsCountRef.current = currentCount;
  }, [data?.deposits, isAudioRadarActive]);

  // Member map for quick lookup
  const membersMap = useMemo(() => {
    const map = new Map();
    (data?.members || []).forEach((m) => {
      map.set(m.id, m);
    });
    return map;
  }, [data?.members]);

  // Today's deposits & KPI metrics
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const depositsList = useMemo(() => {
    const list = Array.isArray(data?.deposits) ? [...data.deposits] : [];
    // Sort descending by date/time (newest first)
    return list.sort((a, b) => {
      const timeA = a.timestamp || new Date(a.date || a.createdAt || 0).getTime();
      const timeB = b.timestamp || new Date(b.date || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [data?.deposits]);

  const kpis = useMemo(() => {
    let todayTotal = 0;
    let todayCount = 0;
    let verifiedCount = 0;
    let pendingCount = 0;

    depositsList.forEach((d) => {
      const dDateStr = d.date ? d.date.substring(0, 10) : '';
      const isToday = dDateStr === todayStr || (!d.date && Date.now() - (d.timestamp || 0) < 86400000);
      const amt = Number(d.amount || d.installmentAmount || 0) || 0;

      if (isToday) {
        todayTotal += amt;
        todayCount += 1;
      }

      if (d.isVerifiedBySupervisor) {
        verifiedCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return {
      todayTotal,
      todayCount,
      verifiedCount,
      pendingCount,
      allCount: depositsList.length
    };
  }, [depositsList, todayStr]);

  // Filtered deposits list
  const filteredDeposits = useMemo(() => {
    return depositsList.filter((d) => {
      // Tab filter
      if (filterTab === 'pending' && d.isVerifiedBySupervisor) return false;
      if (filterTab === 'verified' && !d.isVerifiedBySupervisor) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const member = membersMap.get(d.memberId) || {};
        const memberName = (member.nameBn || member.nameEn || member.name || '').toLowerCase();
        const memberAccount = (member.accountNo || member.serialNumber || member.memberNumber || '').toLowerCase();
        const collector = (d.collector || d.staffName || d.collectedBy || '').toLowerCase();
        const receipt = (d.receiptNo || d.receiptNumber || d.id || '').toLowerCase();

        return (
          memberName.includes(q) ||
          memberAccount.includes(q) ||
          collector.includes(q) ||
          receipt.includes(q)
        );
      }
      return true;
    });
  }, [depositsList, filterTab, searchQuery, membersMap]);

  // 1-Click Verification Handler
  const handleVerifySingle = (depositId) => {
    playButtonClick?.();
    const origin = getDeviceOrigin();
    const supervisor = currentStaffName || 'অ্যাডমিন/সুপারভাইজার';
    const now = Date.now();

    const updatedDeposits = (data.deposits || []).map((d) => {
      if (d.id === depositId) {
        return {
          ...d,
          isVerifiedBySupervisor: true,
          verifiedBy: supervisor,
          verifiedAt: now,
          verifiedTerminal: origin.name,
          auditStamp: `VERIFIED-${now.toString(36).toUpperCase()}`
        };
      }
      return d;
    });

    const nextData = {
      ...data,
      deposits: updatedDeposits
    };

    onUpdateData?.(nextData, {
      type: 'SUPERVISOR_VERIFY_DEPOSIT',
      depositId,
      verifiedBy: supervisor,
      timestamp: now,
      device: origin.name
    });

    playSuccessChime?.();
  };

  // Batch Verify All Pending
  const handleBatchVerifyAll = () => {
    const pendingIds = depositsList.filter((d) => !d.isVerifiedBySupervisor).map((d) => d.id);
    if (pendingIds.length === 0) return;

    if (
      !window.confirm(
        t(
          `আপনি কি নিশ্চিত যে সকল পেন্ডিং (${pendingIds.length}টি) কিস্তি কালেকশন অনুমোদন ও ভেরিফাই করতে চান?`,
          `Are you sure you want to approve & verify all pending (${pendingIds.length}) collections?`
        )
      )
    ) {
      return;
    }

    playButtonClick?.();
    const origin = getDeviceOrigin();
    const supervisor = currentStaffName || 'অ্যাডমিন/সুপারভাইজার';
    const now = Date.now();
    const pendingSet = new Set(pendingIds);

    const updatedDeposits = (data.deposits || []).map((d) => {
      if (pendingSet.has(d.id)) {
        return {
          ...d,
          isVerifiedBySupervisor: true,
          verifiedBy: supervisor,
          verifiedAt: now,
          verifiedTerminal: origin.name,
          auditStamp: `BATCH-VERIFIED-${now.toString(36).toUpperCase()}`
        };
      }
      return d;
    });

    const nextData = {
      ...data,
      deposits: updatedDeposits
    };

    onUpdateData?.(nextData, {
      type: 'SUPERVISOR_BATCH_VERIFY_ALL',
      count: pendingIds.length,
      verifiedBy: supervisor,
      timestamp: now,
      device: origin.name
    });

    playSuccessChime?.();
  };

  // Toggle audio radar
  const handleToggleAudio = () => {
    playButtonClick?.();
    const next = !isAudioRadarActive;
    setIsAudioRadarActive(next);
    localStorage.setItem('somiti360_radar_audio', String(next));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          backgroundColor: isLight ? '#ffffff' : '#0f172a',
          color: isLight ? '#0f172a' : '#f8fafc',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(16, 185, 129, 0.25)',
          border: isLight ? '1.5px solid #cbd5e1' : '1.5px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: isLight
              ? 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
              : 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.9) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: radarPulseAnim
                  ? 'radial-gradient(circle, #10b981 30%, #047857 100%)'
                  : (isLight ? '#10b981' : 'rgba(16, 185, 129, 0.2)'),
                color: isLight ? '#ffffff' : '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                border: '1.5px solid #10b981',
                boxShadow: radarPulseAnim ? '0 0 20px #10b981' : '0 0 10px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.3s ease'
              }}
            >
              📡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                  {t('সুপারভাইজার লাইভ কালেকশন রাডার', 'Supervisor Live Collection Radar')}
                </h2>
                <span
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
                  {t('লাইভ সক্রিয়', 'LIVE RADAR')}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {t('৪টি প্ল্যাটফর্ম রিয়েল-টাইম অডিট ও ইনস্ট্যান্ট ফিল্ড কালেকশন ট্র্যাকিং', '4-Platform Real-Time Audit & Field Collection Stream')}
              </p>
            </div>
          </div>

          {/* Action buttons in header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToggleAudio}
              style={{
                background: isAudioRadarActive ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)') : (isLight ? '#f1f5f9' : '#1e293b'),
                color: isAudioRadarActive ? (isLight ? '#15803d' : '#34d399') : (isLight ? '#64748b' : '#94a3b8'),
                border: isAudioRadarActive ? '1px solid #10b981' : '1px solid transparent',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '44px',
                boxSizing: 'border-box'
              }}
              title={isAudioRadarActive ? t('রাডার অডিও চালু আছে', 'Radar Sound ON') : t('রাডার অডিও বন্ধ', 'Radar Sound OFF')}
            >
              <span>{isAudioRadarActive ? '🔊' : '🔇'}</span>
              <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>
                {isAudioRadarActive ? t('শব্দ চালু', 'Sound ON') : t('শব্দ বন্ধ', 'Sound OFF')}
              </span>
            </button>

            <button
              onClick={() => {
                playButtonClick?.();
                onClose();
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: isLight ? '#e2e8f0' : '#1e293b',
                color: isLight ? '#334155' : '#cbd5e1',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700'
              }}
              title={t('বন্ধ করুন', 'Close')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div
          style={{
            padding: '14px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            background: isLight ? '#f8fafc' : '#090d16'
          }}
        >
          {/* Card 1: Today's Collection */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isLight ? '#ffffff' : '#131d31',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: '700' }}>
              {t('আজকের ফিল্ড কালেকশন', "Today's Field Cash")}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
              ৳{kpis.todayTotal.toLocaleString('bn-BD')}
            </div>
            <div style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '1px' }}>
              {t(`আজকের মোট: ${kpis.todayCount}টি রসিদ`, `${kpis.todayCount} receipts today`)}
            </div>
          </div>

          {/* Card 2: Pending Audit */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isLight ? '#ffffff' : '#131d31',
              border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: isLight ? '#b45309' : '#fbbf24', fontWeight: '700' }}>
              {t('অডিট পেন্ডিং কালেকশন', 'Pending Verification')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f59e0b', marginTop: '2px' }}>
              {kpis.pendingCount} {t('টি', 'items')}
            </div>
            <div style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '1px' }}>
              {t('অনুমোদন বাকি আছে', 'Awaiting approval')}
            </div>
          </div>

          {/* Card 3: Verified */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isLight ? '#ffffff' : '#131d31',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: isLight ? '#15803d' : '#34d399', fontWeight: '700' }}>
              {t('সুপারভাইজার ভেরিফায়েড', 'Supervisor Verified')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc', marginTop: '2px' }}>
              {kpis.verifiedCount} {t('টি', 'items')}
            </div>
            <div style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '1px' }}>
              {t('নিরাপদ ও লকড', 'Locked & audited')}
            </div>
          </div>

          {/* Card 4: Active Online Nodes */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: isLight ? '#ffffff' : '#131d31',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: isLight ? '#2563eb' : '#60a5fa', fontWeight: '700' }}>
              {t('অনলাইন ফিল্ড টার্মিনাল', 'Active Field Nodes')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#3b82f6', marginTop: '2px' }}>
              {Math.max(1, onlineDevices.length)} {t('টি নোড', 'nodes')}
            </div>
            <div style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b', marginTop: '1px' }}>
              {t('রিয়েলটাইম মেশ সংযুক্ত', 'Connected to mesh')}
            </div>
          </div>
        </div>

        {/* Active Nodes Mini Banner */}
        <div
          style={{
            padding: '8px 20px',
            background: isLight ? '#f1f5f9' : '#0b1220',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            fontSize: '0.74rem'
          }}
        >
          <span style={{ fontWeight: '800', color: isLight ? '#475569' : '#94a3b8', whiteSpace: 'nowrap' }}>
            {t('📡 ফিল্ড টার্মিনাল রাডার:', '📡 Field Terminals:')}
          </span>
          {onlineDevices.length === 0 ? (
            <span style={{ color: '#10b981', fontWeight: '700' }}>
              🟢 {t('বর্তমান ডিভাইস সক্রিয় (একক মোড)', 'This device active (Solo)')}
            </span>
          ) : (
            onlineDevices.map((d, idx) => (
              <span
                key={idx}
                style={{
                  background: isLight ? '#ffffff' : '#1e293b',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  color: isLight ? '#15803d' : '#34d399',
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                {d.name || d.platform || 'ডিভাইস'}
              </span>
            ))
          )}
        </div>

        {/* Controls: Search & Tabs & Batch Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                playButtonClick?.();
                setFilterTab('all');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: filterTab === 'all' ? '#10b981' : (isLight ? '#e2e8f0' : '#1e293b'),
                color: filterTab === 'all' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1')
              }}
            >
              {t(`সব কালেকশন (${kpis.allCount})`, `All (${kpis.allCount})`)}
            </button>
            <button
              onClick={() => {
                playButtonClick?.();
                setFilterTab('pending');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: filterTab === 'pending' ? '#f59e0b' : (isLight ? '#e2e8f0' : '#1e293b'),
                color: filterTab === 'pending' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1')
              }}
            >
              {t(`অডিট পেন্ডিং (${kpis.pendingCount})`, `Pending (${kpis.pendingCount})`)}
            </button>
            <button
              onClick={() => {
                playButtonClick?.();
                setFilterTab('verified');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: filterTab === 'verified' ? '#3b82f6' : (isLight ? '#e2e8f0' : '#1e293b'),
                color: filterTab === 'verified' ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1')
              }}
            >
              {t(`ভেরিফায়েড (${kpis.verifiedCount})`, `Verified (${kpis.verifiedCount})`)}
            </button>
          </div>

          {/* Search Box & Batch Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', justifyContent: 'flex-end' }}>
            <input
              type="text"
              placeholder={t('সদস্য / হিসাব নং / রসিদ দিয়ে খুঁজুন...', 'Search member, acct or receipt...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                background: isLight ? '#ffffff' : '#1e293b',
                color: isLight ? '#0f172a' : '#f8fafc',
                outline: 'none',
                minWidth: '180px',
                flex: '1 1 auto'
              }}
            />

            {kpis.pendingCount > 0 && (
              <button
                onClick={handleBatchVerifyAll}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>✅</span>
                <span>{t('সকল পেন্ডিং অনুমোদন', 'Approve All')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Transaction Stream List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {filteredDeposits.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: isLight ? '#94a3b8' : '#64748b'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📡</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                {t('কোনো কালেকশন পাওয়া যায়নি', 'No collections found')}
              </div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                {t(
                  'মাঠকর্মীরা কিস্তি কালেকশন করা মাত্রই এই রাডারে স্বয়ংক্রিয়ভাবে ভেসে উঠবে।',
                  'Incoming field collections will appear here in real-time.'
                )}
              </div>
            </div>
          ) : (
            filteredDeposits.map((d) => {
              const member = membersMap.get(d.memberId) || {};
              const memberName = member.nameBn || member.nameEn || member.name || t('অজ্ঞাত সদস্য', 'Unknown Member');
              const memberAcct = member.accountNo || member.serialNumber || member.memberNumber || d.memberId;
              const amount = Number(d.amount || d.installmentAmount || 0);
              const isHighlighted = highlightedDepositId === d.id;
              const depositTime = d.timestamp || (d.date ? new Date(d.date).getTime() : Date.now());

              return (
                <div
                  key={d.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: isHighlighted
                      ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.25)')
                      : (isLight ? '#ffffff' : '#141e33'),
                    border: isHighlighted
                      ? '2px solid #10b981'
                      : (isLight ? '1px solid #e2e8f0' : '1px solid #1e293b'),
                    boxShadow: isHighlighted ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Left: Member Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: d.isVerifiedBySupervisor
                          ? '#10b981'
                          : (isLight ? '#f1f5f9' : '#1e293b'),
                        color: d.isVerifiedBySupervisor ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '1rem',
                        border: d.isVerifiedBySupervisor ? 'none' : '1px solid #334155'
                      }}
                    >
                      {d.isVerifiedBySupervisor ? '✓' : '👤'}
                    </div>

                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>
                        {memberName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', display: 'flex', gap: '8px' }}>
                        <span>{t('হিসাব নং:', 'Acct:')} <strong>{memberAcct}</strong></span>
                        {d.receiptNo && <span>| {t('রসিদ:', 'Rcpt:')} {d.receiptNo}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Center: Amount & Timing */}
                  <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#10b981' }}>
                      ৳{amount.toLocaleString('bn-BD')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      🕒 {format12HourTime(depositTime, activeLang)}
                      {d.collector && ` • ${d.collector}`}
                    </div>
                  </div>

                  {/* Right: Verification Status & Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {d.isVerifiedBySupervisor ? (
                      <div
                        style={{
                          background: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10b981',
                          color: isLight ? '#15803d' : '#34d399',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>✅</span>
                        <div>
                          <div>{t('অনুমোদিত ও লকড', 'Verified & Locked')}</div>
                          {d.verifiedBy && (
                            <div style={{ fontSize: '0.64rem', opacity: 0.85 }}>
                              {d.verifiedBy} ({format12HourTime(d.verifiedAt || depositTime, activeLang)})
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleVerifySingle(d.id)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                          minHeight: '40px'
                        }}
                      >
                        <span>✅</span>
                        <span>{t('অনুমোদন করুন', 'Approve & Verify')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            background: isLight ? '#f8fafc' : '#0b1220',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: isLight ? '#64748b' : '#94a3b8'
          }}
        >
          <div>
            🛡️ {t('বাণিজ্যিক সুপারভাইজার অডিট মোড সক্রিয় • শতভাগ জিরো-জালিয়াতি প্রোটোকল', 'Commercial Supervisor Audit Active • Zero-Fraud Protocol')}
          </div>
          <button
            onClick={() => {
              playButtonClick?.();
              onClose();
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: isLight ? '#e2e8f0' : '#1e293b',
              color: isLight ? '#334155' : '#cbd5e1',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {t('বন্ধ করুন', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorLiveRadarModal;
