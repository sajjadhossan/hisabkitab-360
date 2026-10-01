import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { printElement } from '../../services/printService';
import {
  BadgeDollarSign,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  Phone,
  FileCheck
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { convertBengaliDigitsToNumber } from '../../services/voiceBillingService';

export const HRPayroll = () => {
  const { employees, addEmployee, disburseSalary, businessSettings, t, lang } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: '',
    phone: '',
    baseSalary: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + e.baseSalary, 0);
  const paidCount = employees.filter(e => e.status === 'Paid').length;
  const pendingCount = employees.length - paidCount;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.baseSalary) return;
    addEmployee(employeeForm);
    setEmployeeForm({
      name: '',
      role: '',
      phone: '',
      baseSalary: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
  };

  const handleDisburseSalary = (emp) => {
    disburseSalary(emp.id);
    triggerSoundboxPayment({
      amount: Number(emp.baseSalary) || 0,
      method: 'cash',
      customerName: emp.name,
      type: 'debt_collection'
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BadgeDollarSign size={22} style={{ color: 'var(--business-primary)' }} />
            <span>{t.business.hrTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {t.business.hrSubtitle}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>{t.business.addEmployee}</span>
        </button>
      </div>

      {/* Top HR Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট সক্রিয় কর্মচারী' : 'Total Employees'}</h3>
            <div className="stat-value">{employees.length}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'স্টাফ ও টিম সদস্য' : 'Staff Members'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <BadgeDollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মাসিক মোট স্যালারি বাজেট' : 'Monthly Payroll Budget'}</h3>
            <div className="stat-value">৳{totalMonthlyPayroll.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              {paidCount} {lang === 'bn' ? 'জনের পরিশোধিত' : 'Paid'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'বকেয়া স্যালারি' : 'Pending Disbursements'}</h3>
            <div className="stat-value" style={{ color: pendingCount > 0 ? '#f59e0b' : '#10b981' }}>
              {pendingCount}
            </div>
            <div className="stat-trend" style={{ color: pendingCount > 0 ? '#f59e0b' : '#10b981' }}>
              {pendingCount > 0 ? (lang === 'bn' ? 'বেতন বিতরণ বাকি' : 'Needs Payout') : (lang === 'bn' ? 'সবাই পরিশোধিত' : 'All Cleared')}
            </div>
          </div>
        </div>
      </div>

      {/* Staff & Payroll Roster Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>
          {lang === 'bn' ? 'কর্মচারীদের তালিকা ও বেতন প্রদান রেকর্ড' : 'Employee Roster & Salary Disbursement'}
        </h3>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.business.employeeName}</th>
                <th>{t.business.role}</th>
                <th>{lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}</th>
                <th style={{ textAlign: 'right' }}>{t.business.baseSalary}</th>
                <th style={{ textAlign: 'center' }}>{t.business.payStatus}</th>
                <th style={{ textAlign: 'center' }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      {emp.phone}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                      {emp.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {emp.joinDate}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.95rem' }}>
                    ৳{emp.baseSalary.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${emp.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {emp.status === 'Paid' ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') : (lang === 'bn' ? 'বকেয়া' : 'Pending')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      {emp.status !== 'Paid' ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleDisburseSalary(emp)}
                        >
                          <FileCheck size={13} />
                          <span>{t.business.disburseSalary}</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => setSelectedPaySlip(emp)}
                          title={lang === 'bn' ? 'পে-স্লিপ প্রিন্ট করুন' : 'Print Payslip'}
                        >
                          <Printer size={13} />
                          <span>{lang === 'bn' ? 'পে-স্লিপ' : 'Slip'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {t.business.addEmployee}
            </h3>

            {/* Smart Voice Auto-Fill Banner for Employee */}
            <div style={{ marginBottom: '1rem' }}>
              <SmartVoiceFormBanner
                mode="customer"
                lang={lang}
                onParsed={(parsed) => {
                  setEmployeeForm(prev => ({
                    ...prev,
                    name: parsed.name || prev.name,
                    phone: parsed.phone || prev.phone
                  }));
                }}
              />
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>{t.business.employeeName} *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setEmployeeForm(prev => ({ ...prev, name: txt }))}
                    title="মুখে বলুন কর্মচারীর নাম"
                    size={13}
                  />
                </div>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder={lang === 'bn' ? 'যেমন: মোঃ রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>{t.business.role} *</label>
                    <VoiceInputButton
                      onTranscript={(txt) => setEmployeeForm(prev => ({ ...prev, role: txt }))}
                      title="মুখে বলুন পদবি"
                      size={13}
                    />
                  </div>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: স্টোর ম্যানেজার / ক্যাশিয়ার' : 'e.g. Store Manager'}
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>{lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}</label>
                    <VoiceInputButton
                      onTranscript={(txt) => {
                        const num = convertBengaliDigitsToNumber(txt);
                        if (num) setEmployeeForm(prev => ({ ...prev, phone: String(num) }));
                        else setEmployeeForm(prev => ({ ...prev, phone: txt }));
                      }}
                      title="মুখে বলুন মোবাইল নম্বর"
                      size={13}
                    />
                  </div>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="017xxxxxxxx"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>{t.business.baseSalary} (৳) *</label>
                    <VoiceInputButton
                      onTranscript={(txt) => {
                        const num = convertBengaliDigitsToNumber(txt);
                        if (num) setEmployeeForm(prev => ({ ...prev, baseSalary: String(num) }));
                      }}
                      title="মুখে বলুন মাসিক বেতন"
                      size={13}
                    />
                  </div>
                  <input
                    type="number"
                    required
                    min="1000"
                    className="input-field"
                    placeholder="20000"
                    value={employeeForm.baseSalary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}</label>
                  <input
                    type="date"
                    className="input-field"
                    value={employeeForm.joinDate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, joinDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t.save}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Payslip Modal */}
      {selectedPaySlip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'বেতন পরিশোধ স্লিপ (Salary Pay Slip)' : 'Salary Pay Slip'}
              </h3>
              <button className="btn-icon" onClick={() => setSelectedPaySlip(null)}>✕</button>
            </div>

            {/* Slip Paper */}
            <div
              id="printable-salary-voucher"
              className="printable-receipt"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: '#0f172a' }}>{businessSettings.companyName}</h3>
                <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>SALARY DISBURSEMENT VOUCHER</p>
                <div style={{ borderTop: '1px dashed #94a3b8', margin: '8px 0' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Employee:</span>
                <strong>{selectedPaySlip.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Designation:</span>
                <span>{selectedPaySlip.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Payment Date:</span>
                <span>{selectedPaySlip.lastDisbursed || '2026-09-01'}</span>
              </div>

              <div style={{ borderTop: '1px solid #cbd5e1', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800' }}>
                <span>Disbursed Amount:</span>
                <span>৳{selectedPaySlip.baseSalary.toLocaleString()}</span>
              </div>

              <div style={{ borderTop: '1px dashed #94a3b8', margin: '14px 0 8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '10px', color: '#64748b' }}>
                <span>Employee Signature</span>
                <span>Authorized Signatory</span>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => printElement('printable-salary-voucher', { title: 'Salary Voucher - ' + selectedPaySlip.name, paperType: 'receipt' })}
              >
                <Printer size={16} />
                <span>{lang === 'bn' ? 'স্লিপ প্রিন্ট করুন' : 'Print Voucher'}</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedPaySlip(null)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
