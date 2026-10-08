import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { subscribeToNetworkQuality, measureLatency } from '../../services/networkQualityService';

export const NetworkQualityIndicator = ({ lang = 'bn' }) => {
  const [quality, setQuality] = useState({
    isOnline: true,
    latencyMs: 45,
    effectiveType: '4g',
    grade: 'fast'
  });

  useEffect(() => {
    const unsubscribe = subscribeToNetworkQuality(setQuality);
    return () => unsubscribe();
  }, []);

  const getBadgeConfig = () => {
    if (!quality.isOnline || quality.grade === 'offline') {
      return {
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        text: lang === 'bn' ? 'অফলাইন' : 'Offline',
        icon: <WifiOff size={12} />
      };
    }
    if (quality.grade === 'slow') {
      return {
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.15)',
        text: `${quality.latencyMs}ms (${lang === 'bn' ? 'ধীর' : 'Slow'})`,
        icon: <Wifi size={12} />
      };
    }
    if (quality.grade === 'medium') {
      return {
        color: '#eab308',
        bg: 'rgba(234, 179, 8, 0.15)',
        text: `${quality.latencyMs}ms`,
        icon: <Wifi size={12} />
      };
    }
    return {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      text: `${quality.latencyMs}ms 4G`,
      icon: <Wifi size={12} />
    };
  };

  const badge = getBadgeConfig();

  return (
    <div
      onClick={() => measureLatency()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 7px',
        borderRadius: '12px',
        background: badge.bg,
        color: badge.color,
        fontSize: '0.68rem',
        fontWeight: '800',
        cursor: 'pointer',
        userSelect: 'none',
        border: `1px solid ${badge.color}33`,
        transition: 'all 0.2s ease'
      }}
      title={lang === 'bn' ? 'ক্লিক করে পিং চেক করুন' : 'Tap to test ping'}
    >
      {badge.icon}
      <span>{badge.text}</span>
    </div>
  );
};
