import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  X,
  RefreshCw,
  Navigation,
  ShieldAlert,
  Smartphone,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Truck,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  getAllStaffLocations,
  subscribeStaffLocations,
  getCurrentGpsLocation
} from '../../services/fieldGpsTrackerService';

export const FieldForceRadarModal = ({ isOpen, onClose, lang = 'bn' }) => {
  const { customers = [], salesHistory = [], fieldOrders = [], businessSettings = {} } = useApp() || {};
  const { staffAccounts = [], user, isOwner } = useAuth() || {};

  const [staffLocations, setStaffLocations] = useState(() => getAllStaffLocations());
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to real-time location pushes
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeStaffLocations((all) => {
      setStaffLocations({ ...all });
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setStaffLocations(getAllStaffLocations());
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Merge staff accounts with their real-time or cached GPS location
  const combinedStaffList = useMemo(() => {
    const list = [];
    const locationMap = { ...staffLocations };

    // Registered staff accounts
    staffAccounts.forEach(stf => {
      const staffKey = stf.id || stf.phone || stf.name;
      const loc = locationMap[staffKey] || {};
      list.push({
        id: stf.id,
        name: stf.name || 'কর্মী',
        phone: stf.phone || '',
        role: stf.role || 'salesman',
        location: loc.lat ? loc : null,
        updatedAt: loc.updatedAt || null,
        isMock: Boolean(loc.isMock)
      });
      delete locationMap[staffKey];
    });

    // Any ad-hoc locations pushed from active sessions
    Object.keys(locationMap).forEach(key => {
      const loc = locationMap[key];
      if (loc && loc.lat) {
        list.push({
          id: key,
          name: loc.staffName || key,
          phone: loc.staffPhone || '',
          role: loc.role || 'salesman',
          location: loc,
          updatedAt: loc.updatedAt || null,
          isMock: Boolean(loc.isMock)
        });
      }
    });

    return list;
  }, [staffAccounts, staffLocations]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return combinedStaffList.filter(s => {
      const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.phone || '').includes(searchTerm);
      const matchRole = roleFilter === 'all' || s.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [combinedStaffList, searchTerm, roleFilter]);

  // Active / Online staff count (pinged within last 15 minutes)
  const activeCount = useMemo(() => {
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    return combinedStaffList.filter(s => s.updatedAt && s.updatedAt > fifteenMinsAgo).length;
  }, [combinedStaffList]);

  // Selected staff details
  const activeSelectedStaff = useMemo(() => {
    if (!selectedStaffId) {
      return combinedStaffList.find(s => s.location) || combinedStaffList[0] || null;
    }
    return combinedStaffList.find(s => s.id === selectedStaffId) || null;
  }, [combinedStaffList, selectedStaffId]);

  if (!isOpen) return null;

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return lang === 'bn' ? 'অফলাইন' : 'Offline';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return lang === 'bn' ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return lang === 'bn' ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'cashier': return lang === 'bn' ? 'ক্যাশিয়ার' : 'Cashier';
      case 'salesman': return lang === 'bn' ? 'সেলসম্যান' : 'Salesman';
      case 'sr': return lang === 'bn' ? 'এসআর অফিসার' : 'SR';
      case 'delivery': return lang === 'bn' ? 'ডেলিভারি' : 'Delivery';
      default: return lang === 'bn' ? 'মাঠকর্মী' : 'Field Staff';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '94vh',
          backgroundColor: 'var(--surface-color, #1e2230)',
          borderRadius: '24px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #f8fafc)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(30, 34, 48, 0.95) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Navigation size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {lang === 'bn' ? 'ফিল্ড স্টাফ লাইভ জিপিএস রাডার ও ট্র্যাকার' : 'Field Force Live GPS Radar'}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
                  {lang === 'bn' ? `${activeCount} জন সক্রিয়` : `${activeCount} Online`}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'সেলসম্যান, এসআর ও ডেলিভারিম্যানদের রিয়েল-টাইম অবস্থান, রুট ও ক্যাশ কালেকশন মনিটরিং' : 'Real-time agent location, visit routes and collection points'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
              title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body: Two Columns (Left Staff List, Right Live Map / Location Card) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', flexWrap: 'wrap' }}>
          {/* Left Column: Staff Directory */}
          <div
            style={{
              width: '340px',
              borderRight: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
              flexShrink: 0
            }}
          >
            {/* Search & Filter */}
            <div style={{ padding: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'কর্মী বা ফোন দিয়ে খুঁজুন...' : 'Search staff...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Role filter buttons */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {['all', 'salesman', 'sr', 'cashier'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: roleFilter === r ? 'var(--business-primary, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                      color: roleFilter === r ? '#fff' : '#94a3b8'
                    }}
                  >
                    {r === 'all' ? (lang === 'bn' ? 'সকল' : 'All') : getRoleLabel(r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff List Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {filteredStaff.length === 0 ? (
                <div style={{ padding: '30px 15px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  {lang === 'bn' ? 'কোনো কর্মী পাওয়া যায়নি।' : 'No staff found.'}
                </div>
              ) : (
                filteredStaff.map((stf) => {
                  const isSelected = activeSelectedStaff?.id === stf.id;
                  const hasLocation = Boolean(stf.location?.lat);
                  const isRecent = stf.updatedAt && (Date.now() - stf.updatedAt) < 15 * 60 * 1000;

                  return (
                    <div
                      key={stf.id}
                      onClick={() => setSelectedStaffId(stf.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>
                          {stf.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            backgroundColor: hasLocation && isRecent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: hasLocation && isRecent ? '#34d399' : '#94a3b8',
                            fontWeight: 700
                          }}
                        >
                          {hasLocation && isRecent ? (lang === 'bn' ? '🟢 লাইভ' : 'Live') : (lang === 'bn' ? '⚪ অফলাইন' : 'Offline')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <span style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {getRoleLabel(stf.role)}
                        </span>
                        {stf.phone && <span>{stf.phone}</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} />
                          {formatLastSeen(stf.updatedAt)}
                        </span>
                        {stf.isMock && (
                          <span style={{ color: '#f87171', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldAlert size={11} />
                            {lang === 'bn' ? 'মক জিপিএস!' : 'Mock GPS'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Map & Selected Staff Inspector */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
            {activeSelectedStaff?.location?.lat ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Embedded OpenStreetMap Preview */}
                <div style={{ flex: 1, position: 'relative', minHeight: '340px', backgroundColor: '#131620' }}>
                  <iframe
                    title="Live Field Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeSelectedStaff.location.lng - 0.008}%2C${activeSelectedStaff.location.lat - 0.008}%2C${activeSelectedStaff.location.lng + 0.008}%2C${activeSelectedStaff.location.lat + 0.008}&layer=mapnik&marker=${activeSelectedStaff.location.lat}%2C${activeSelectedStaff.location.lng}`}
                    style={{ border: 'none', filter: 'brightness(0.9) contrast(1.1)' }}
                  />

                  {/* Overlay Quick Info Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      backgroundColor: 'rgba(30, 34, 48, 0.92)',
                      backdropFilter: 'blur(8px)',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                      📍 {activeSelectedStaff.name} ({getRoleLabel(activeSelectedStaff.role)})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px' }}>
                      {lang === 'bn' ? 'সঠিকতা:' : 'Accuracy:'} ±{activeSelectedStaff.location.accuracy || 10} মি. | {lang === 'bn' ? 'গতি:' : 'Speed:'} {Math.round(activeSelectedStaff.location.speed || 0)} km/h
                    </div>
                  </div>

                  {/* External Google Maps Button */}
                  <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${activeSelectedStaff.location.lat},${activeSelectedStaff.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                      }}
                    >
                      <ExternalLink size={15} />
                      <span>{lang === 'bn' ? 'গুগল ম্যাপে লাইভ রুট দেখুন' : 'Open in Google Maps'}</span>
                    </a>
                  </div>
                </div>

                {/* Bottom Inspector Bar */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(30, 34, 48, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {lang === 'bn' ? 'জিপিএস স্থানাঙ্ক (Coordinates)' : 'Coordinates'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                      {Number(activeSelectedStaff.location.lat).toFixed(6)}, {Number(activeSelectedStaff.location.lng).toFixed(6)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {lang === 'bn' ? 'সর্বশেষ সিঙ্ক সময়' : 'Last Synced'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                      {formatLastSeen(activeSelectedStaff.updatedAt)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {lang === 'bn' ? 'অ্যান্টি-চিট স্ট্যাটাস' : 'Anti-Cheat Status'}
                    </div>
                    <div>
                      {activeSelectedStaff.isMock ? (
                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.82rem' }}>
                          ⚠️ ভুয়া জিপিএস সন্দেহযুক্ত
                        </span>
                      ) : (
                        <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem' }}>
                          ✅ আসল হার্ডওয়্যার জিপিএস
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  color: '#64748b',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: '#94a3b8'
                  }}
                >
                  <MapPin size={32} />
                </div>
                <h4 style={{ margin: '0 0 8px', color: '#cbd5e1' }}>
                  {lang === 'bn' ? 'কোনো সক্রিয় জিপিএস সিগন্যাল নেই' : 'No Active GPS Signal'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', maxWidth: '380px' }}>
                  {lang === 'bn'
                    ? 'নির্বাচিত কর্মীর ডিভাইসে এখনও জিপিএস চালু হয়নি বা সে অফলাইনে রয়েছে। কর্মী মোবাইল অ্যাপে প্রবেশ করলে স্বয়ংক্রিয়ভাবে অবস্থান মানচিত্রে দেখা যাবে।'
                    : 'The selected agent has not reported a GPS position yet or is offline.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            fontSize: '0.78rem',
            color: '#64748b'
          }}
        >
          <div>
            {lang === 'bn'
              ? '💡 টিপস: সেলসম্যান বা এসআর অ্যাপ ওপেন রেখে ফিল্ডে অর্ডার কাটলে স্বয়ংক্রিয়ভাবে লাইভ রুট মানচিত্রে আপডেট হয়।'
              : 'Tip: Agents automatically update their position on route when taking orders in the field.'}
          </div>
          <div>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldForceRadarModal;
