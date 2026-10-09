import React from 'react';
import { X, Printer, CheckCircle2, User, Building2, Calendar, FileText } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { printElement } from '../../../services/printService';

/**
 * AttendancePaySlipModal
 * -----------------------
 * Formal Printable Monthly Pay-Slip with complete itemized Attendance breakdown:
 * - Base Salary
 * - Working Days, Present Days, Late Days, Absent Days
 * - Overtime Hours & OT Pay
 * - Late & Absence Deductions
 * - Final Net Salary
 */
export const AttendancePaySlipModal = ({ isOpen, onClose, payrollData }) => {
  const { businessSettings, showToast, lang } = useApp();

  if (!isOpen || !payrollData) return null;

  const handlePrint = () => {
    printElement('employee-attendance-payslip', {
      title: `PaySlip_${payrollData.employeeName}_${payrollData.monthYear}`,
      autoPrint: true,
      onComplete: () => {
        if (showToast) showToast('🖨️ পে-স্লিপ সফলভাবে প্রিন্ট হয়েছে!', 'success');
      }
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '95%', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
              ডিজিটাল পে-স্লিপ ও স্যালারি ভাউচার
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Printable Voucher Paper Preview */}
        <div
          id="employee-attendance-payslip"
          style={{
            background: '#ffffff',
            color: '#111827',
            padding: '20px',
            borderRadius: '10px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            lineHeight: '1.5',
            border: '1px solid #e5e7eb',
            marginBottom: '1rem'
          }}
        >
          {/* Company Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '8px', marginBottom: '12px' }}>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '900', color: '#111827' }}>
              {businessSettings?.businessName || 'হিসাবকিতাব ৩৬০ এন্টারপ্রাইজ'}
            </h2>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {businessSettings?.phone ? `মোবাইল: ${businessSettings.phone}` : 'অফিসিয়াল বেতন ও হাজিরা বিবরণী'}
            </div>
            <div style={{ fontSize: '12px', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              মাসিক পে-স্লিপ ({payrollData.monthYear})
            </div>
          </div>

          {/* Employee Meta Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f9fafb', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#6b7280' }}>কর্মচারীর নাম: </span>
              <strong>{payrollData.employeeName}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>পদবি: </span>
              <strong>{payrollData.role}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>সেকশন/বিভাগ: </span>
              <strong>{payrollData.section}</strong>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>কর্মদিবস: </span>
              <strong>{payrollData.totalWorkingDays} দিন</strong>
            </div>
          </div>

          {/* Attendance Breakdown Matrix */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ background: '#f3f4f6', padding: '6px 10px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', color: '#374151' }}>
              হাজিরা রেকর্ড বিবরণী
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', padding: '8px 0', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#059669', fontWeight: '900', fontSize: '14px', display: 'block' }}>{payrollData.presentDays}</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>উপস্থিত দিন</span>
              </div>
              <div>
                <span style={{ color: '#d97706', fontWeight: '900', fontSize: '14px', display: 'block' }}>{payrollData.lateDays}</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>দেরি (Late)</span>
              </div>
              <div>
                <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '14px', display: 'block' }}>{payrollData.absentDays}</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>অনুপস্থিত</span>
              </div>
              <div>
                <span style={{ color: '#4f46e5', fontWeight: '900', fontSize: '14px', display: 'block' }}>+{payrollData.totalOtHours}h</span>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>ওভারটাইম</span>
              </div>
            </div>
          </div>

          {/* Salary Breakdown Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '12px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '6px 0', color: '#4b5563' }}>মূল মাসিক বেতন (Basic Salary):</td>
                <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700' }}>৳{payrollData.baseSalary?.toLocaleString()}</td>
              </tr>
              {payrollData.otPay > 0 && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 0', color: '#059669' }}>ওভারটাইম ভাতা (+{payrollData.totalOtHours} ঘণ্টা):</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#059669' }}>+৳{payrollData.otPay?.toLocaleString()}</td>
                </tr>
              )}
              {payrollData.lateDeductions > 0 && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 0', color: '#dc2626' }}>দেরির কারণে কর্তন:</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>-৳{payrollData.lateDeductions?.toLocaleString()}</td>
                </tr>
              )}
              {payrollData.absenceDeductions > 0 && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 0', color: '#dc2626' }}>অনুপস্থিতির দিন কর্তন ({payrollData.absentDays} দিন):</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>-৳{payrollData.absenceDeductions?.toLocaleString()}</td>
                </tr>
              )}
              <tr style={{ borderTop: '2px solid #111827', fontSize: '14px' }}>
                <td style={{ padding: '8px 0', fontWeight: '900', color: '#111827' }}>সর্বমোট নিট প্রদেয় বেতন:</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '900', color: '#059669', fontSize: '16px' }}>
                  ৳{payrollData.netSalary?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '10px', borderTop: '1px dashed #d1d5db', fontSize: '11px', color: '#4b5563' }}>
            <div>
              <span>_______________________</span>
              <div style={{ fontWeight: '700', marginTop: '2px' }}>কর্মচারীর স্বাক্ষর</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span>_______________________</span>
              <div style={{ fontWeight: '700', marginTop: '2px' }}>কর্তৃপক্ষের অনুমোদন</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <Printer size={18} />
          <span>🖨️ পে-স্লিপ প্রিন্ট করুন</span>
        </button>
      </div>
    </div>
  );
};
