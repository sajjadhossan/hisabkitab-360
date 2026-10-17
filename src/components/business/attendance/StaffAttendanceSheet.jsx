import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Filter,
  Printer,
  Sparkles,
  Fingerprint,
  Send,
  Sliders,
  ChevronRight,
  TrendingUp,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  getStoredAttendanceLogs,
  saveAttendanceLog,
  evaluateDailyShiftTimes,
  DEFAULT_OFFICE_SETTINGS,
  quickPunchEmployee,
  getOfficeGeoSettings,
  saveOfficeGeoSettings,
  getVerifiedLocation
} from '../../../services/attendanceSecurityService';
import { hasRegisteredFace, getEmployeeFace } from '../../../services/faceRecognitionService';
import { AttendancePunchModal } from './AttendancePunchModal';
import { StaffQrScannerModal } from './StaffQrScannerModal';
import { StaffQrIdCardModal } from './StaffQrIdCardModal';
import { QrCode } from 'lucide-react';

/**
 * StaffAttendanceSheet
 * --------------------
 * Daily Staff Roll Call, Shift Monitoring & Anti-Cheat Attendance Hub:
 * - Real-time status: Present, Late, Half-Day, Absent, Leave
 * - In-Time, Out-Time, Work Hours & OT Tracking
 * - Section/Department breakdown
 * - Quick Roll Call & Instant Biometric/Geofence Punch
 * - Fast QR Code Attendance Terminal & Staff Printable ID Cards
 */
export const StaffAttendanceSheet = ({ employees = [], onOpenTelegramModal }) => {
  const { showToast, lang } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [selectedEmpForIdCard, setSelectedEmpForIdCard] = useState(null);

  // Load logs
  const [attendanceLogs, setAttendanceLogs] = useState(() => getStoredAttendanceLogs());

  // Available Sections
  const SECTIONS = ['all', 'সেলস ও কাউন্টার', 'ইনভেন্টরি ও ডেলিভারি', 'কাটিং ও প্রোডাকশন', 'ম্যানেজমেন্ট'];

  // Map today's attendance map by employeeId
  const todayMap = useMemo(() => {
    const map = {};
    attendanceLogs
      .filter(l => l.date === selectedDate)
      .forEach(l => {
        map[l.employeeId] = l;
      });
    return map;
  }, [attendanceLogs, selectedDate]);

  // Statistics
  const totalEmployees = employees.length;
  const presentCount = employees.filter(e => {
    const log = todayMap[e.id];
    return log && (log.status === 'Present' || log.status === 'Late' || log.status === 'Half-Day');
  }).length;
  const lateCount = employees.filter(e => todayMap[e.id]?.status === 'Late').length;
  const absentCount = totalEmployees - presentCount;
  const presenceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  // Filtered list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSection = sectionFilter === 'all' || (emp.section || 'সেলস ও কাউন্টার') === sectionFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        emp.name.toLowerCase().includes(q) ||
        (emp.role && emp.role.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q));
      return matchSection && matchSearch;
    });
  }, [employees, sectionFilter, searchQuery]);

  // Manual Status Change
  const handleStatusChange = (emp, newStatus) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const updatedLog = {
      id: `att_${Date.now()}_${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role,
      section: emp.section || 'সেলস ও কাউন্টার',
      date: selectedDate,
      time: timeStr,
      timestamp: now.toISOString(),
      type: 'check_in',
      status: newStatus,
      lateMinutes: newStatus === 'Late' ? 25 : 0,
      overtimeHours: 0,
      totalWorkHours: newStatus === 'Half-Day' ? 4 : (newStatus === 'Present' || newStatus === 'Late' ? 8 : 0)
    };

    const newLogs = saveAttendanceLog(updatedLog);
    setAttendanceLogs(newLogs);

    if (showToast) {
      showToast(`${emp.name}-এর স্ট্যাটাস "${newStatus}" করা হয়েছে`, 'success');
    }
  };

  // 1-Tap Quick In & Out Punch Handlers
  const handleQuickIn = (emp) => {
    const updated = quickPunchEmployee(emp, 'check_in', selectedDate);
    setAttendanceLogs(updated);
    if (showToast) {
      showToast(`🟢 ${emp.name}-এর প্রবেশ সময় (Check-In) রেকর্ড হয়েছে!`, 'success');
    }
  };

  const handleQuickOut = (emp) => {
    const updated = quickPunchEmployee(emp, 'check_out', selectedDate);
    setAttendanceLogs(updated);
    if (showToast) {
      showToast(`🔴 ${emp.name}-এর প্রস্থান সময় (Check-Out) রেকর্ড হয়েছে!`, 'success');
    }
  };

  // Office GPS Geofence Calibrator
  const [officeSettings, setOfficeSettings] = useState(() => getOfficeGeoSettings());
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);

  const handleCalibrateOffice = async () => {
    setIsCalibratingGps(true);
    try {
      const loc = await getVerifiedLocation({ ...officeSettings, allowedRadiusMeters: 99999 });
      const updated = saveOfficeGeoSettings({
        latitude: loc.latitude,
        longitude: loc.longitude,
        isCalibrated: true
      });
      setOfficeSettings(updated);
      if (showToast) {
        showToast(
          `📍 বর্তমান অবস্থান (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}) অফিস হিসেবে সফলভাবে সংরক্ষিত হয়েছে!`,
          'success'
        );
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'লোকেশন পাওয়া যায়নি', 'error');
    } finally {
      setIsCalibratingGps(false);
    }
  };

  const handleChangeRadius = (r) => {
    const updated = saveOfficeGeoSettings({ allowedRadiusMeters: Number(r) });
    setOfficeSettings(updated);
    if (showToast) showToast(`জিওফেন্স পরিধি ${r} মিটার সেট করা হয়েছে`, 'info');
  };

  // Quick 1-Click: Mark All Unmarked as Present
  const handleQuickMarkAllPresent = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    employees.forEach(emp => {
      if (!todayMap[emp.id]) {
        saveAttendanceLog({
          id: `att_${Date.now()}_${emp.id}`,
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          section: emp.section || 'সেলস ও কাউন্টার',
          date: selectedDate,
          time: timeStr,
          timestamp: now.toISOString(),
          type: 'check_in',
          status: 'Present',
          lateMinutes: 0,
          overtimeHours: 0,
          totalWorkHours: 8
        });
      }
    });

    setAttendanceLogs(getStoredAttendanceLogs());
    if (showToast) {
      showToast('🎉 সকল স্টাফের আজকের হাজিরা উপস্থিত করা হয়েছে!', 'success');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. TOP ATTENDANCE KPI SCORECARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {/* Total Staff */}
        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>মোট স্টাফ সংখ্যা</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px' }}>
            {totalEmployees} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>জন</span>
          </div>
        </div>

        {/* Present Today */}
        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>আজকের উপস্থিতি</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', marginTop: '2px' }}>
            {presentCount} <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981' }}>({presenceRate}%)</span>
          </div>
        </div>

        {/* Late Today */}
        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>দেরিতে প্রবেশ (Late)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f59e0b', marginTop: '2px' }}>
            {lateCount} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>জন</span>
          </div>
        </div>

        {/* Absent */}
        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>অনুপস্থিত (Absent)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', marginTop: '2px' }}>
            {absentCount} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>জন</span>
          </div>
        </div>
      </div>

      {/* 2. ACTION CONTROLS & DATE SELECTOR */}
      <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        {/* Left: Date & Section Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Calendar size={15} style={{ color: '#818cf8' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: '800', outline: 'none' }}
            />
          </div>

          {/* Section Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {SECTIONS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSectionFilter(sec)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  border: sectionFilter === sec ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                  background: sectionFilter === sec ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: sectionFilter === sec ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {sec === 'all' ? 'সকল সেকশন' : sec}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Anti-Cheat Punch Button & Telegram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleQuickMarkAllPresent}
            className="btn btn-secondary press-scale"
            style={{ padding: '6px 12px', fontSize: '0.76rem', fontWeight: '800', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)' }}
          >
            ⚡ সকল উপস্থিত
          </button>

          <button
            type="button"
            onClick={() => setShowQrScannerModal(true)}
            className="btn btn-primary press-scale"
            style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: '800', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <QrCode size={16} />
            <span>কিউআর হাজিরা টার্মিনাল</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPunchModal(true)}
            className="btn btn-secondary press-scale"
            style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Fingerprint size={16} />
            <span>বায়োমেট্রিক ও ফেস পাঞ্চ</span>
          </button>

          {onOpenTelegramModal && (
            <button
              type="button"
              onClick={onOpenTelegramModal}
              className="btn btn-secondary press-scale"
              style={{ padding: '6px 10px', fontSize: '0.76rem', fontWeight: '800', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)', background: 'rgba(6, 182, 212, 0.1)' }}
              title="টেলিগ্রাম বট নোটিফিকেশন"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2.1 OFFICE GEOFENCE & CALIBRATION BAR */}
      <div
        className="glass-card"
        style={{
          padding: '10px 14px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
          <MapPin size={16} color="#6366f1" />
          <div>
            <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>
              অফিস জিপিএস কেন্দ্র:
            </span>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              {officeSettings.latitude.toFixed(4)}, {officeSettings.longitude.toFixed(4)}
            </span>
            <span style={{ margin: '0 6px', color: 'var(--border-color)' }}>|</span>
            <span style={{ fontWeight: '700', color: '#10b981' }}>
              পরিধি: {officeSettings.allowedRadiusMeters || 15} মিটার
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={officeSettings.allowedRadiusMeters || 15}
            onChange={(e) => handleChangeRadius(e.target.value)}
            className="input-field"
            style={{ padding: '3px 8px', fontSize: '0.74rem', fontWeight: '800' }}
            title="অনুমোদিত পরিধি পরিবর্তন করুন"
          >
            <option value="5">৫ মিটার (কঠোর)</option>
            <option value="10">১০ মিটার</option>
            <option value="15">১৫ মিটার (স্ট্যান্ডার্ড)</option>
            <option value="30">৩০ মিটার</option>
            <option value="50">৫০ মিটার</option>
          </select>

          <button
            type="button"
            onClick={handleCalibrateOffice}
            disabled={isCalibratingGps}
            className="btn btn-secondary press-scale"
            style={{ padding: '4px 10px', fontSize: '0.74rem', fontWeight: '800', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.4)' }}
          >
            {isCalibratingGps ? '📍 জিপিএস নির্ণয় হচ্ছে...' : '📍 বর্তমান অবস্থান অফিস হিসেবে সেট করুন'}
          </button>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div>
        <input
          type="text"
          className="input-field"
          placeholder="স্টাফের নাম, পদবি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontSize: '0.85rem' }}
        />
      </div>

      {/* 4. DAILY ROLL CALL ROSTER LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEmployees.map((emp) => {
          const log = todayMap[emp.id];
          const status = log ? log.status : 'Absent';
          const isPresent = status === 'Present' || status === 'Late' || status === 'Half-Day';

          return (
            <div
              key={emp.id}
              className="glass-card press-scale"
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                borderLeft: `4px solid ${
                  status === 'Present' ? '#10b981' : status === 'Late' ? '#f59e0b' : status === 'Half-Day' ? '#8b5cf6' : '#ef4444'
                }`
              }}
            >
              {/* Employee Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                {log?.photoSnapshot ? (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #10b981',
                      flexShrink: 0,
                      position: 'relative'
                    }}
                  >
                    <img src={log.photoSnapshot} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {emp.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{emp.name}</span>
                    {hasRegisteredFace(emp.id) && (
                      <span title="ফেস আইডি এনরোল্ড" style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                        ✓ ফেস আইডি
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {emp.role} • <span style={{ color: '#818cf8' }}>{emp.section || 'কাউন্টার'}</span>
                  </div>
                </div>
              </div>

              {/* Punch Timings & Metrics: Check-In, Check-Out & Duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ color: '#10b981', display: 'block', fontSize: '0.68rem', fontWeight: '800' }}>🟢 আসার সময় (In):</span>
                  <strong style={{ color: (log?.checkInTime || log?.time) ? '#10b981' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {log?.checkInTime || log?.time || '—'}
                  </strong>
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <span style={{ color: '#818cf8', display: 'block', fontSize: '0.68rem', fontWeight: '800' }}>🔴 যাওয়ার সময় (Out):</span>
                  <strong style={{ color: log?.checkOutTime ? '#818cf8' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {log?.checkOutTime || '—'}
                  </strong>
                </div>

                {log?.workDurationFormatted ? (
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <span style={{ color: '#f59e0b', display: 'block', fontSize: '0.68rem', fontWeight: '800' }}>⏱️ মোট কর্মকাল:</span>
                    <strong style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                      {log.workDurationFormatted}
                    </strong>
                  </div>
                ) : (log?.checkInTime && !log?.checkOutTime && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: '800' }}>
                      🟢 কর্মস্থলে উপস্থিত
                    </span>
                  </div>
                ))}

                {log?.lateMinutes > 0 && (
                  <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: '800' }}>
                    +{log.lateMinutes}মি. দেরি
                  </span>
                )}

                {log?.overtimeHours > 0 && (
                  <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem', fontWeight: '800' }}>
                    +{log.overtimeHours}ঘণ্টা OT
                  </span>
                )}
              </div>

              {/* Status Selector Pills & Quick Action Buttons */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* 1-Tap Quick In & Out Punch Buttons */}
                <button
                  type="button"
                  onClick={() => handleQuickIn(emp)}
                  title="কর্মীর আসার সময় (Check-In) রেকর্ড করুন"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    border: '1.5px solid #10b981',
                    background: log?.checkInTime ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.08)',
                    color: '#10b981',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>🟢 ইন</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickOut(emp)}
                  title="কর্মীর যাওয়ার সময় (Check-Out) রেকর্ড করুন"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    border: '1.5px solid #ef4444',
                    background: log?.checkOutTime ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>🔴 আউট</span>
                </button>
                {[
                  { key: 'Present', label: 'উপস্থিত', color: '#10b981' },
                  { key: 'Late', label: 'দেরি (Late)', color: '#f59e0b' },
                  { key: 'Half-Day', label: 'হাফ-ডে', color: '#8b5cf6' },
                  { key: 'Absent', label: 'অনুপস্থিত', color: '#ef4444' },
                  { key: 'Leave', label: 'ছুটি', color: '#06b6d4' }
                ].map((s) => {
                  const isActive = status === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => handleStatusChange(emp, s.key)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        border: isActive ? `1.5px solid ${s.color}` : '1px solid var(--border-color)',
                        background: isActive ? `${s.color}22` : 'rgba(255,255,255,0.02)',
                        color: isActive ? s.color : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}

                {/* ID Card QR Button */}
                <button
                  type="button"
                  onClick={() => setSelectedEmpForIdCard(emp)}
                  title="কর্মীর ডিজিটাল আইডি কার্ড ও QR কোড"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <QrCode size={12} />
                  <span>আইডি কার্ড QR</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Render QR Scanner Modal */}
      <StaffQrScannerModal
        isOpen={showQrScannerModal}
        onClose={() => setShowQrScannerModal(false)}
        employees={employees}
        onPunchSuccess={() => {
          setAttendanceLogs(getStoredAttendanceLogs());
        }}
      />

      {/* Render Staff Digital ID Card Modal */}
      <StaffQrIdCardModal
        isOpen={!!selectedEmpForIdCard}
        onClose={() => setSelectedEmpForIdCard(null)}
        employee={selectedEmpForIdCard}
      />

      {/* Render Punch Modal */}
      <AttendancePunchModal
        isOpen={showPunchModal}
        onClose={() => setShowPunchModal(false)}
        employees={employees}
        onPunchSuccess={() => {
          setAttendanceLogs(getStoredAttendanceLogs());
        }}
      />
    </div>
  );
};
