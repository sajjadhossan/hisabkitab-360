import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  BadgeDollarSign,
  TrendingUp,
  Download
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  getStoredAttendanceLogs,
  calculateEmployeePayroll
} from '../../../services/attendanceSecurityService';
import { AttendancePaySlipModal } from './AttendancePaySlipModal';

/**
 * MonthlyAttendanceReport
 * -----------------------
 * Monthly Staff Attendance Register & Auto-Calculated Payroll Summary:
 * - Shows exact day counts: Present, Late, Half-Day, Absent, OT Hours
 * - Computes dynamic deductions and Net Salary
 * - 1-Click Pay-Slip generator
 */
export const MonthlyAttendanceReport = ({ employees = [] }) => {
  const { lang, showToast } = useApp();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaySlipData, setSelectedPaySlipData] = useState(null);

  const logs = useMemo(() => getStoredAttendanceLogs(), []);

  // Compute monthly report per employee
  const monthlyData = useMemo(() => {
    return employees.map(emp => {
      const payroll = calculateEmployeePayroll({
        employee: emp,
        attendanceLogs: logs,
        monthYearStr: selectedMonth,
        totalWorkingDays: 26,
        otRateMultiplier: 1.5,
        latePenaltyRatio: 0.33
      });
      return payroll;
    });
  }, [employees, logs, selectedMonth]);

  // Filtered
  const filteredData = useMemo(() => {
    return monthlyData.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      return !q || d.employeeName.toLowerCase().includes(q) || d.role.toLowerCase().includes(q);
    });
  }, [monthlyData, searchQuery]);

  // Grand totals
  const totalNetPayroll = monthlyData.reduce((sum, d) => sum + d.netSalary, 0);
  const totalOtHoursOverall = monthlyData.reduce((sum, d) => sum + d.totalOtHours, 0);
  const totalDeductionsOverall = monthlyData.reduce((sum, d) => sum + d.totalDeductions, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 1. TOP MONTHLY SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>হাজিরা অনুযায়ী মোট প্রদেয় বেতন</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            ৳{totalNetPayroll.toLocaleString()}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>মোট ওভারটাইম (OT) সময়</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#818cf8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            {totalOtHoursOverall.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>ঘণ্টা</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700' }}>অনুপস্থিতি ও দেরির কারণে মোট কর্তন</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            ৳{totalDeductionsOverall.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. FILTER & MONTH SELECTOR BAR */}
      <div className="glass-card" style={{ padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Calendar size={15} style={{ color: '#818cf8' }} />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '800', outline: 'none' }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            (মোট কর্মদিবস: ২৬ দিন)
          </span>
        </div>

        <div style={{ width: '260px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="স্টাফের নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* 3. MONTHLY ATTENDANCE & PAYROLL REGISTER TABLE */}
      <div className="table-responsive glass-card" style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px' }}>স্টাফের নাম ও পদবি</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>উপস্থিত</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>দেরি</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>অনুপস্থিত</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>ওভারটাইম</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>মূল বেতন</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>কর্তন</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>নিট প্রদেয় বেতন</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>পে-স্লিপ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((d) => (
              <tr key={d.employeeId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px' }}>
                  <strong style={{ color: 'var(--text-main)', display: 'block' }}>{d.employeeName}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.role} • {d.section}</span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '800' }}>
                    {d.presentDays} দিন
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <span style={{ color: d.lateDays > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: d.lateDays > 0 ? '800' : 'normal' }}>
                    {d.lateDays} দিন
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <span style={{ color: d.absentDays > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: d.absentDays > 0 ? '800' : 'normal' }}>
                    {d.absentDays} দিন
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                  {d.totalOtHours > 0 ? (
                    <span style={{ color: '#818cf8', fontWeight: '800' }}>+{d.totalOtHours}h</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  ৳{d.baseSalary.toLocaleString()}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                  {d.lateDeductions > 0 ? `-৳${d.lateDeductions.toLocaleString()}` : '৳০'}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '900', color: '#10b981', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
                  ৳{d.netSalary.toLocaleString()}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPaySlipData({ ...d, monthYear: selectedMonth })}
                    className="btn btn-secondary press-scale"
                    style={{ padding: '4px 8px', fontSize: '0.72rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FileText size={13} />
                    <span>স্লিপ</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render Pay-Slip Modal */}
      {selectedPaySlipData && (
        <AttendancePaySlipModal
          isOpen={Boolean(selectedPaySlipData)}
          onClose={() => setSelectedPaySlipData(null)}
          payrollData={selectedPaySlipData}
        />
      )}
    </div>
  );
};
