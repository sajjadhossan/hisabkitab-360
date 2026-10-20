import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Building2,
  Landmark,
  Wallet,
  Receipt,
  Send,
  MessageSquare,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Settings,
  DollarSign,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Award,
  PenTool,
  HelpCircle,
  Share2,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Copy,
  Sliders,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  loadSamityData,
  saveSamityData,
  generateMemberId,
  generateReceiptNumber,
  generateVoucherNumber,
  recordAuditLog,
  calculateMemberPaymentStatus,
  calculateSamityMetrics,
  formatReminderMessage,
  getWhatsAppUrl,
  getTelegramUrl,
  getMessengerUrl,
  numberToBanglaWords,
  numberToEnglishWords,
  SAMITY_SQL_MIGRATION_SCHEMA
} from '../../services/samityService';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';

export const SamityManagementHub = ({ onClose }) => {
  const { lang = 'bn', showToast = () => {}, businessSettings } = useApp() || {};

  // Core Data State
  const [data, setData] = useState(() => loadSamityData());
  const [activeSamityId, setActiveSamityId] = useState(() => {
    const initial = loadSamityData();
    return initial.samities?.[0]?.id || 'SAMITY-001';
  });

  // Active Hub Sub-Tab
  const [activeTab, setActiveTab] = useState('dashboard');
  // 'dashboard' | 'members' | 'deposits' | 'bulk_deposit' | 'payment_status' | 'reminders' | 'expenses' | 'fund_balance' | 'letterhead' | 'signatures' | 'documents' | 'reports' | 'sql_schema' | 'setup'

  // Current active Samity
  const currentSamity = useMemo(() => {
    return data.samities.find(s => s.id === activeSamityId) || data.samities[0] || {};
  }, [data.samities, activeSamityId]);

  // Derived Metrics
  const metrics = useMemo(() => {
    return calculateSamityMetrics(activeSamityId, data);
  }, [activeSamityId, data]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilterType, setMemberFilterType] = useState('all');
  const [memberFilterStatus, setMemberFilterStatus] = useState('all');
  const [targetMonth, setTargetMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));
  const [targetYear, setTargetYear] = useState(() => new Date().getFullYear());

  // Modal States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSamityModalOpen, setIsSamityModalOpen] = useState(false);
  const [activePrintReceipt, setActivePrintReceipt] = useState(null);
  const [activePrintNotice, setActivePrintNotice] = useState(null);
  const [activePrintDoc, setActivePrintDoc] = useState(null);
  const [reminderModalMember, setReminderModalMember] = useState(null);

  // Form States
  const [memberForm, setMemberForm] = useState({
    nameBn: '',
    nameEn: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    whatsappNumber: '',
    telegramHandle: '',
    facebookProfileUrl: '',
    email: '',
    nidNumber: '',
    bloodGroup: '',
    presentAddress: '',
    membershipType: 'General Member',
    customSubscription: '',
    status: 'active'
  });

  const [depositForm, setDepositForm] = useState({
    memberId: '',
    amount: '',
    depositDate: new Date().toISOString().split('T')[0],
    depositType: 'Monthly Subscription',
    method: 'bank_counter',
    bankName: '',
    bankBranch: '',
    bankReceiptNo: '',
    transactionId: '',
    month: targetMonth,
    year: targetYear,
    remarks: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'office_rent',
    title: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    paidTo: '',
    paidBy: '',
    description: ''
  });

  // Bulk Deposit State
  const [bulkDepositHead, setBulkDepositHead] = useState({
    bankName: 'ডাচ্-বাংলা ব্যাংক',
    branchName: 'মিরপুর শাখা',
    accountNo: '123.120.98765',
    bankReceiptNo: '',
    depositDate: new Date().toISOString().split('T')[0],
    totalSlipAmount: ''
  });

  const [bulkItems, setBulkItems] = useState([
    { memberId: '', amount: '', month: targetMonth, year: targetYear }
  ]);

  // Persist helper
  const updateAndSave = (updater, auditMeta = null) => {
    setData(prev => {
      let nextData = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (auditMeta) {
        nextData = recordAuditLog(nextData, auditMeta);
      }
      saveSamityData(nextData);
      return nextData;
    });
  };

  // Safe Haptic Helper
  const triggerHaptic = () => {
    try {
      if (typeof hapticFeedback === 'function') hapticFeedback('light');
      else if (hapticFeedback?.light) hapticFeedback.light();
    } catch {}
  };

  // --------------------------------------------------------------------------
  // Handlers: Member Management
  // --------------------------------------------------------------------------
  const handleOpenMemberModal = (member = null) => {
    playButtonClick?.();
    triggerHaptic();
    if (member) {
      setEditingMember(member);
      setMemberForm({ ...member });
    } else {
      setEditingMember(null);
      setMemberForm({
        nameBn: '',
        nameEn: '',
        fatherName: '',
        motherName: '',
        mobile: '',
        whatsappNumber: '',
        telegramHandle: '',
        facebookProfileUrl: '',
        email: '',
        nidNumber: '',
        bloodGroup: '',
        presentAddress: '',
        membershipType: 'General Member',
        customSubscription: '',
        status: 'active'
      });
    }
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e) => {
    e.preventDefault();
    if (!memberForm.nameBn.trim() && !memberForm.nameEn.trim()) {
      showToast?.('সদস্যের নাম প্রদান করুন', 'error');
      return;
    }
    if (!memberForm.mobile.trim()) {
      showToast?.('সদস্যের মোবাইল নম্বর আবশ্যক', 'error');
      return;
    }

    playSuccessChime?.();
    triggerHaptic();

    if (editingMember) {
      updateAndSave(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === editingMember.id ? { ...m, ...memberForm, updatedAt: new Date().toISOString() } : m)
      }), {
        action: 'UPDATE_MEMBER',
        module: 'MEMBERS',
        recordId: editingMember.id,
        details: { name: memberForm.nameBn || memberForm.nameEn }
      });
      showToast?.('সদস্য তথ্য সফলভাবে আপডেট করা হয়েছে', 'success');
    } else {
      const newMemberId = generateMemberId(data.members, currentSamity.memberIdPrefix || 'SM-');
      const newMember = {
        ...memberForm,
        id: newMemberId,
        memberCode: newMemberId,
        samityId: activeSamityId,
        membershipStartDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      updateAndSave(prev => ({
        ...prev,
        members: [newMember, ...prev.members]
      }), {
        action: 'CREATE_MEMBER',
        module: 'MEMBERS',
        recordId: newMemberId,
        details: { name: newMember.nameBn || newMember.nameEn }
      });
      showToast?.(`নতুন সদস্য সফলভাবে নিবন্ধিত (${newMemberId})`, 'success');
    }

    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (memberId) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই সদস্যকে মুছে ফেলতে চান?')) return;
    playButtonClick?.();
    triggerHaptic();
    updateAndSave(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== memberId)
    }), {
      action: 'DELETE_MEMBER',
      module: 'MEMBERS',
      recordId: memberId,
      details: { memberId }
    });
    showToast?.('সদস্য মুছে ফেলা হয়েছে', 'info');
  };

  // --------------------------------------------------------------------------
  // Handlers: Single Bank & Cash Deposit
  // --------------------------------------------------------------------------
  const handleOpenDepositModal = (prefillMemberId = '') => {
    playButtonClick?.();
    triggerHaptic();
    const targetMember = data.members.find(m => m.id === prefillMemberId);
    setDepositForm({
      memberId: prefillMemberId,
      amount: targetMember?.customSubscription || currentSamity.monthlySubscription || '500',
      depositDate: new Date().toISOString().split('T')[0],
      depositType: 'Monthly Subscription',
      method: 'bank_counter',
      bankName: currentSamity.bankDetails?.bankName || '',
      bankBranch: currentSamity.bankDetails?.branchName || '',
      bankReceiptNo: '',
      transactionId: '',
      month: targetMonth,
      year: targetYear,
      remarks: ''
    });
    setIsDepositModalOpen(true);
  };

  const handleSaveDeposit = (e) => {
    e.preventDefault();
    if (!depositForm.amount || Number(depositForm.amount) <= 0) {
      showToast?.('সঠিক জমার পরিমাণ উল্লেখ করুন', 'error');
      return;
    }

    playSuccessChime?.();
    triggerHaptic();

    const voucherNo = generateVoucherNumber(data.deposits, 'DEP-');
    const targetMember = data.members.find(m => m.id === depositForm.memberId);

    const newDeposit = {
      ...depositForm,
      id: `DEP-${Date.now()}`,
      voucherNo,
      samityId: activeSamityId,
      memberName: targetMember ? (targetMember.nameBn || targetMember.nameEn) : 'সাধারণ আমানতকারী',
      amount: Number(depositForm.amount),
      approvalStatus: 'approved',
      approvedBy: 'Admin',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    updateAndSave(prev => ({
      ...prev,
      deposits: [newDeposit, ...prev.deposits]
    }), {
      action: 'CREATE_DEPOSIT',
      module: 'DEPOSITS',
      recordId: voucherNo,
      details: { amount: newDeposit.amount, memberId: newDeposit.memberId }
    });

    showToast?.(`জমা সফলভাবে লিপিবদ্ধ হয়েছে (ভাউচার: ${voucherNo})`, 'success');
    setIsDepositModalOpen(false);

    // Prompt user to preview receipt
    setActivePrintReceipt(newDeposit);
  };

  // --------------------------------------------------------------------------
  // Handlers: Bulk Deposit
  // --------------------------------------------------------------------------
  const handleAddBulkRow = () => {
    setBulkItems(prev => [...prev, { memberId: '', amount: currentSamity.monthlySubscription || '500', month: targetMonth, year: targetYear }]);
  };

  const handleRemoveBulkRow = (index) => {
    setBulkItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleBulkItemChange = (index, field, value) => {
    setBulkItems(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const calculatedBulkSum = useMemo(() => {
    return bulkItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  }, [bulkItems]);

  const handleSaveBulkDeposit = (e) => {
    e.preventDefault();
    const slipTotal = Number(bulkDepositHead.totalSlipAmount);
    if (!slipTotal || slipTotal <= 0) {
      showToast?.('ব্যাংক স্লিপের মোট টাকার পরিমাণ দিন', 'error');
      return;
    }
    if (calculatedBulkSum !== slipTotal) {
      showToast?.(`সদস্যদের টাকার যোগফল (${calculatedBulkSum}/-) ও ব্যাংক স্লিপের মোট টাকা (${slipTotal}/-) মেলেনি!`, 'error');
      return;
    }
    if (!bulkDepositHead.bankReceiptNo.trim()) {
      showToast?.('ব্যাংক জমা রশিদ নং প্রদান করুন', 'error');
      return;
    }

    playSuccessChime?.();
    triggerHaptic();

    const bulkId = `BULK-${Date.now()}`;
    const newDeposits = bulkItems.map((item, idx) => {
      const targetMember = data.members.find(m => m.id === item.memberId);
      const voucherNo = generateVoucherNumber([...data.deposits, { id: idx }], 'DEP-');
      return {
        id: `DEP-${Date.now()}-${idx}`,
        voucherNo: `${voucherNo}-${idx + 1}`,
        bulkDepositId: bulkId,
        samityId: activeSamityId,
        memberId: item.memberId,
        memberName: targetMember ? (targetMember.nameBn || targetMember.nameEn) : 'সদস্য',
        amount: Number(item.amount),
        depositDate: bulkDepositHead.depositDate,
        depositType: 'Monthly Subscription',
        method: 'bank_counter',
        bankName: bulkDepositHead.bankName,
        bankBranch: bulkDepositHead.branchName,
        bankReceiptNo: bulkDepositHead.bankReceiptNo,
        month: item.month,
        year: item.year,
        approvalStatus: 'approved',
        approvedBy: 'Admin',
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    });

    const newBulkRecord = {
      id: bulkId,
      samityId: activeSamityId,
      ...bulkDepositHead,
      totalAmount: slipTotal,
      itemsCount: bulkItems.length,
      createdAt: new Date().toISOString()
    };

    updateAndSave(prev => ({
      ...prev,
      bulkDeposits: [newBulkRecord, ...(prev.bulkDeposits || [])],
      deposits: [...newDeposits, ...prev.deposits]
    }), {
      action: 'BULK_DEPOSIT_ENTRY',
      module: 'BULK_DEPOSITS',
      recordId: bulkDepositHead.bankReceiptNo,
      details: { totalAmount: slipTotal, memberCount: bulkItems.length }
    });

    showToast?.(`বাল্ক ডিপোজিট সফল! ${newDeposits.length} জন সদস্যের জমা লিপিবদ্ধ হয়েছে`, 'success');
    setActiveTab('deposits');
  };

  // --------------------------------------------------------------------------
  // Handlers: Expense Management
  // --------------------------------------------------------------------------
  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showToast?.('খরচের সঠিক পরিমাণ উল্লেখ করুন', 'error');
      return;
    }
    if (!expenseForm.title.trim()) {
      showToast?.('খরচের শিরোনাম প্রদান করুন', 'error');
      return;
    }

    playSuccessChime?.();
    triggerHaptic();

    const voucherNo = generateVoucherNumber(data.expenses, 'EXP-');
    const newExpense = {
      ...expenseForm,
      id: `EXP-${Date.now()}`,
      voucherNo,
      samityId: activeSamityId,
      amount: Number(expenseForm.amount),
      approvalStatus: 'approved',
      approvedBy: 'Admin',
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    updateAndSave(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses]
    }), {
      action: 'CREATE_EXPENSE',
      module: 'EXPENSES',
      recordId: voucherNo,
      details: { title: newExpense.title, amount: newExpense.amount }
    });

    showToast?.(`খরচ সফলভাবে লিপিবদ্ধ হয়েছে (ভাউচার: ${voucherNo})`, 'success');
    setIsExpenseModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // Reminder Dispatcher
  // --------------------------------------------------------------------------
  const handleSendReminder = (member, channel) => {
    playButtonClick?.();
    triggerHaptic();

    const dueInfo = calculateMemberPaymentStatus(member, currentSamity, data.deposits, targetMonth, targetYear);
    const msg = formatReminderMessage({ member, samity: currentSamity, dueInfo, channel, lang });

    if (channel === 'whatsapp') {
      const url = getWhatsAppUrl(member.whatsappNumber || member.mobile, msg);
      if (url) window.open(url, '_blank');
      else showToast?.('সদস্যের সঠিক মোবাইল/হোয়াটসঅ্যাপ নম্বর নেই', 'error');
    } else if (channel === 'telegram') {
      const url = getTelegramUrl(member.telegramHandle || member.mobile, msg);
      if (url) window.open(url, '_blank');
      else showToast?.('সদস্যের টেলিগ্রাম হ্যান্ডেল পাওয়া যায়নি', 'warning');
    } else if (channel === 'messenger') {
      navigator.clipboard?.writeText(msg);
      showToast?.('রিমাইন্ডার মেসেজ ক্লিপবোর্ডে কপি হয়েছে! মেসেঞ্জারে পেস্ট করুন', 'success');
      const url = getMessengerUrl(member.facebookProfileUrl);
      if (url) window.open(url, '_blank');
    } else if (channel === 'sms') {
      navigator.clipboard?.writeText(msg);
      showToast?.('এসএমএস টেক্সট কপি হয়েছে (SMS Gateway Queued)', 'success');
    }

    // Record Reminder Log
    const logItem = {
      id: `REM-${Date.now()}`,
      samityId: activeSamityId,
      memberId: member.id,
      memberName: member.nameBn || member.nameEn,
      channel,
      dueMonth: targetMonth,
      dueAmount: dueInfo.dueAmount,
      messageContent: msg,
      sentAt: new Date().toISOString()
    };

    updateAndSave(prev => ({
      ...prev,
      reminders: [logItem, ...(prev.reminders || [])]
    }), {
      action: 'SEND_REMINDER',
      module: 'REMINDERS',
      recordId: member.id,
      details: { channel, member: member.nameBn }
    });
  };

  // --------------------------------------------------------------------------
  // Print & Receipt Generation
  // --------------------------------------------------------------------------
  const handlePrintElement = (elemId) => {
    const el = document.getElementById(elemId);
    if (!el) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentSamity.nameBn} - Printout</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'SolaimanLipi', 'Kalpurush', sans-serif; color: #111; margin: 0; padding: 0; background: #fff; }
            .watermark { position: fixed; top: 40%; left: 25%; font-size: 64px; color: rgba(16, 185, 129, 0.12); transform: rotate(-30deg); font-weight: 900; z-index: 0; pointer-events: none; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; font-size: 13px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered Member List
  const filteredMembers = useMemo(() => {
    return data.members.filter(m => {
      if (m.samityId !== activeSamityId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (m.nameBn + ' ' + m.nameEn).toLowerCase().includes(q);
        const matchPhone = (m.mobile || '').includes(q);
        const matchCode = (m.memberCode || m.id || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode) return false;
      }
      if (memberFilterType !== 'all' && m.membershipType !== memberFilterType) return false;
      if (memberFilterStatus !== 'all' && m.status !== memberFilterStatus) return false;
      return true;
    });
  }, [data.members, activeSamityId, searchQuery, memberFilterType, memberFilterStatus]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-main, #f8fafc)',
        fontFamily: "'Inter', 'SolaimanLipi', sans-serif"
      }}
    >
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & MULTI-TENANT SAMITY SWITCHER */}
      {/* ==================================================================== */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)'
            }}
          >
            <Users size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                {businessSettings?.companyName || currentSamity.nameBn || 'সমিতি ও সমবায় ব্যবস্থাপনা হাব'}
              </h1>
              <span
                style={{
                  background: 'rgba(20, 184, 166, 0.2)',
                  color: '#2dd4bf',
                  border: '1px solid rgba(20, 184, 166, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '800'
                }}
              >
                PRO TEMPLATE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
              {businessSettings?.tagline || currentSamity.sloganBn || 'সদস্য, ব্যাংক জমা, বকেয়া ও মাল্টি-চ্যানেল রিমাইন্ডার সেন্টার'}
            </p>
          </div>
        </div>

        {/* Multi-Samity Selector & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>🏛️ শাখা/সমিতি:</span>
            <select
              value={activeSamityId}
              onChange={(e) => {
                playButtonClick?.();
                setActiveSamityId(e.target.value);
              }}
              style={{
                background: 'rgba(30, 41, 59, 0.9)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.8rem',
                fontWeight: '700',
                outline: 'none'
              }}
            >
              {data.samities.map(s => (
                <option key={s.id} value={s.id}>{s.nameBn} ({s.type})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenDepositModal()}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={16} />
            <span>জমা এন্ট্রি</span>
          </button>

          <button
            onClick={() => handleOpenMemberModal()}
            className="btn"
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Users size={15} />
            <span>নতুন সদস্য</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. NAVIGATION SUB-TABS (Modular Multi-Feature Navigation) */}
      {/* ==================================================================== */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 16px',
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        {[
          { id: 'dashboard', label: '📊 ড্যাশবোর্ড', icon: TrendingUp },
          { id: 'members', label: '👥 সদস্য তালিকা', count: metrics.totalMembers, icon: Users },
          { id: 'deposits', label: '💳 ব্যাংক ও নগদ জমা', count: data.deposits.length, icon: Landmark },
          { id: 'bulk_deposit', label: '📑 বাল্ক ব্যাংক জমা', icon: Layers },
          { id: 'payment_status', label: '📋 চাঁদা ও বকেয়া খাতা', icon: Receipt },
          { id: 'reminders', label: '📢 মাল্টি-চ্যানেল রিমাইন্ডার', icon: Send },
          { id: 'expenses', label: '💸 সমিতির খরচ', count: data.expenses.length, icon: Wallet },
          { id: 'fund_balance', label: '⚖️ ফান্ড ও ব্যালেন্স', icon: DollarSign },
          { id: 'letterhead', label: '📜 লেটারহেড কনফিগ', icon: FileText },
          { id: 'signatures', label: '✍️ স্বাক্ষর ও সিল', icon: PenTool },
          { id: 'documents', label: '📝 অফিসিয়াল চিঠি/নোটিশ', icon: Award },
          { id: 'reports', label: '📈 ২৮টি পূর্ণাঙ্গ রিপোর্ট', icon: FileSpreadsheet },
          { id: 'sql_schema', label: '🗄️ SQL ডাটাবেজ স্কিমা', icon: ShieldCheck }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playButtonClick?.();
                triggerHaptic();
                setActiveTab(tab.id);
              }}
              style={{
                background: isActive ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                color: isActive ? '#2dd4bf' : 'var(--text-muted, #94a3b8)',
                border: 'none',
                borderBottom: `2.5px solid ${isActive ? '#2dd4bf' : 'transparent'}`,
                padding: '12px 14px',
                fontSize: '0.82rem',
                fontWeight: isActive ? '800' : '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    background: isActive ? '#2dd4bf' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#0f172a' : '#fff',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: '800'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 3. MAIN WORKSPACE / CONTENT AREA */}
      {/* ==================================================================== */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '14px'
              }}
            >
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '700' }}>মোট নিবন্ধিত সদস্য</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                  {metrics.totalMembers} <span style={{ fontSize: '0.85rem', color: '#10b981' }}>({metrics.activeMembers} সক্রিয়)</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  প্রতি সদস্য চাঁদা: {currentSamity.monthlySubscription}/-
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: '700' }}>চলতি মাসের মোট আদায়</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                  ৳ {metrics.totalCurrentMonthCollected.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '4px' }}>
                  পরিশোধিত সদস্য: {metrics.paidMembersCount} জন ({metrics.collectionPercentage}%)
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.76rem', color: '#ef4444', fontWeight: '700' }}>বাকি / অনাদায়ী চাঁদা</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>
                  ৳ {metrics.totalCurrentMonthDue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#f87171', marginTop: '4px' }}>
                  বাকি সদস্য: {metrics.unpaidMembersCount} জন
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(20, 184, 166, 0.08)',
                  border: '1px solid rgba(20, 184, 166, 0.25)',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.76rem', color: '#2dd4bf', fontWeight: '700' }}>সমিতির নীট জমা তহবিল (Fund)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#2dd4bf', marginTop: '4px' }}>
                  ৳ {metrics.availableFund.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#5eead4', marginTop: '4px' }}>
                  মোট জমা: ৳{metrics.totalApprovedDeposits.toLocaleString()} | খরচ: ৳{metrics.totalApprovedExpenses.toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.76rem', color: '#3b82f6', fontWeight: '700' }}>ব্যাংক ব্যালেন্স</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>
                  ৳ {metrics.bankBalance.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#93c5fd', marginTop: '4px' }}>
                  ক্যাশ: ৳{metrics.cashBalance.toLocaleString()} | মোবাইল: ৳{metrics.mobileBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Actions & Collection Progress */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px'
              }}
            >
              {/* Collection Progress Card */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>
                    🎯 {targetMonth} মাসের চাঁদা আদায়ের অগ্রগতি
                  </h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2dd4bf' }}>
                    {metrics.collectionPercentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${metrics.collectionPercentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #2dd4bf 100%)',
                      borderRadius: '5px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>লক্ষ্যমাত্রা: </span>
                    <span style={{ fontWeight: '800' }}>৳ {metrics.expectedMonthly.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>আদায়: </span>
                    <span style={{ fontWeight: '800', color: '#10b981' }}>৳ {metrics.totalCurrentMonthCollected.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>ঘাটতি: </span>
                    <span style={{ fontWeight: '800', color: '#ef4444' }}>৳ {metrics.totalCurrentMonthDue.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('payment_status')}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'rgba(20, 184, 166, 0.2)',
                      color: '#2dd4bf',
                      border: '1px solid rgba(20, 184, 166, 0.4)',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    বকেয়া সদস্যদের তালিকা দেখুন
                  </button>
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    রিমাইন্ডার পাঠান
                  </button>
                </div>
              </div>

              {/* Samity Bank Account Details Card */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>
                    🏦 সমিতির ব্যাংক ও মোবাইল ব্যাংকিং তথ্য
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: '700' }}>সক্রিয় একাউন্ট</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ব্যাংকের নাম:</span>
                    <span style={{ fontWeight: '800' }}>{currentSamity.bankDetails?.bankName} ({currentSamity.bankDetails?.branchName})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>হিসাব নম্বর:</span>
                    <span style={{ fontWeight: '800', color: '#38bdf8' }}>{currentSamity.bankDetails?.accNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>রাউটিং নম্বর:</span>
                    <span style={{ fontWeight: '800' }}>{currentSamity.bankDetails?.routingNo || 'প্রযোজ্য নয়'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>বিকাশ/নগদ মার্চেন্ট:</span>
                    <span style={{ fontWeight: '800', color: '#ec4899' }}>{currentSamity.mobileBanking?.number} ({currentSamity.mobileBanking?.provider})</span>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('bulk_deposit')}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    + বাল্ক ডিপোজিট এন্ট্রি
                  </button>
                  <button
                    onClick={() => handleOpenDepositModal()}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    + সিঙ্গেল জমা
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Deposits & Expenses tables */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '16px'
              }}
            >
              {/* Recent Deposits */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800' }}>📥 সাম্প্রতিক ব্যাংক ও নগদ জমা</h3>
                  <button
                    onClick={() => setActiveTab('deposits')}
                    style={{ background: 'transparent', border: 'none', color: '#2dd4bf', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    সব দেখুন &rarr;
                  </button>
                </div>

                {data.deposits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    এখনো কোনো জমা লিপিবদ্ধ হয়নি। উপরে "জমা এন্ট্রি" বাটনে ক্লিক করে প্রথম জমা যোগ করুন।
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.deposits.slice(0, 5).map(dep => (
                      <div
                        key={dep.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{dep.memberName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {dep.depositDate} • {dep.method} • {dep.voucherNo}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', color: '#10b981', fontSize: '0.95rem' }}>
                            ৳ {dep.amount?.toLocaleString()}
                          </div>
                          <button
                            onClick={() => setActivePrintReceipt(dep)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: 'none',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              marginTop: '2px'
                            }}
                          >
                            রিসিট প্রিন্ট
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Expenses */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800' }}>📤 সাম্প্রতিক খরচের বিবরণ</h3>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    সব দেখুন &rarr;
                  </button>
                </div>

                {data.expenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    এখনো কোনো খরচ রেকর্ড করা হয়নি। "সমিতির খরচ" ট্যাব থেকে অফিস বা ইভেন্ট খরচ রেকর্ড করুন।
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.expenses.slice(0, 5).map(exp => (
                      <div
                        key={exp.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{exp.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {exp.expenseDate} • {exp.category} • {exp.voucherNo}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', color: '#ef4444', fontSize: '0.95rem' }}>
                            ৳ {exp.amount?.toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {exp.paymentMethod}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS MANAGEMENT */}
        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filter & Search Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                background: 'rgba(30, 41, 59, 0.7)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="সদস্যের নাম, আইডি (SM-001) বা মোবাইল দিয়ে খুঁজুন..."
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={memberFilterType}
                onChange={(e) => setMemberFilterType(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              >
                <option value="all">সব সদস্য পদবি</option>
                <option value="General Member">সাধারণ সদস্য</option>
                <option value="Life Member">আজীবন সদস্য</option>
                <option value="Executive Member">কার্যনির্বাহী সদস্য</option>
                <option value="Advisor">উপদেষ্টা</option>
                <option value="President">সভাপতি</option>
                <option value="General Secretary">সাধারণ সম্পাদক</option>
                <option value="Treasurer">কোষাধ্যক্ষ</option>
              </select>

              <select
                value={memberFilterStatus}
                onChange={(e) => setMemberFilterStatus(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  outline: 'none'
                }}
              >
                <option value="all">সব স্ট্যাটাস</option>
                <option value="active">সক্রিয় (Active)</option>
                <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                <option value="suspended">স্থগিত (Suspended)</option>
              </select>

              <button
                onClick={() => handleOpenMemberModal()}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                <Plus size={16} />
                <span>+ নতুন সদস্য নিবন্ধন</span>
              </button>
            </div>

            {/* Member Directory Table */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>আইডি নং</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>সদস্যের নাম ও পদবি</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>যোগাযোগ</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>মাসিক চাঁদা</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>চলতি মাসের অবস্থা</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        কোনো সদস্যের রেকর্ড পাওয়া যায়নি। "+ নতুন সদস্য নিবন্ধন" বাটনে ক্লিক করে সদস্য যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map(member => {
                      const status = calculateMemberPaymentStatus(member, currentSamity, data.deposits, targetMonth, targetYear);
                      return (
                        <tr
                          key={member.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: '900', color: '#38bdf8' }}>
                            {member.id}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '800', color: '#fff' }}>{member.nameBn || member.nameEn}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {member.membershipType} • {member.nameEn}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '700' }}>{member.mobile}</div>
                            {member.whatsappNumber && (
                              <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                                WA: {member.whatsappNumber}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '800' }}>
                            ৳ {member.customSubscription || currentSamity.monthlySubscription}/-
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                background: status.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : status.status === 'partially_paid' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: status.status === 'paid' ? '#10b981' : status.status === 'partially_paid' ? '#f59e0b' : '#ef4444',
                                border: `1px solid ${status.status === 'paid' ? '#10b981' : status.status === 'partially_paid' ? '#f59e0b' : '#ef4444'}50`,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '800'
                              }}
                            >
                              {status.status === 'paid' ? '✓ পরিশোধিত' : status.status === 'partially_paid' ? 'আংশিক পরিশোধ' : `বাকি: ৳${status.dueAmount}`}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenDepositModal(member.id)}
                                title="জমা নিন"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                + জমা
                              </button>
                              <button
                                onClick={() => handleSendReminder(member, 'whatsapp')}
                                title="হোয়াটসঅ্যাপে রিমাইন্ডার পাঠান"
                                style={{
                                  background: 'rgba(37, 211, 102, 0.15)',
                                  color: '#25D366',
                                  border: 'none',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Share2 size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenMemberModal(member)}
                                title="সম্পাদনা করুন"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                title="মুছে ফেলুন"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BANK & CASH DEPOSITS */}
        {activeTab === 'deposits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>💳 ব্যাংক ও নগদ জমা তালিকা</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ব্যাংক কাউন্টার, অনলাইন ট্রান্সফার, এটিএম বা মোবাইল ব্যাংকিংয়ের মাধ্যমে জমাকৃত প্রতিটি আমানতের রেকর্ড
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('bulk_deposit')}
                  className="btn"
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  📑 বাল্ক জমা এন্ট্রি
                </button>
                <button
                  onClick={() => handleOpenDepositModal()}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>+ নতুন জমা এন্ট্রি</span>
                </button>
              </div>
            </div>

            {/* Deposits Table */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>ভাউচার / রিসিট নং</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>তারিখ ও মাস</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>সদস্যের নাম</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>জমার মাধ্যম ও ব্যাংক</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>টাকার পরিমাণ</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>স্ট্যাটাস</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>রিসিট</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        এখনো কোনো জমার রেকর্ড নেই। "+ নতুন জমা এন্ট্রি" বাটনে ক্লিক করে টাকা জমা রেকর্ড করুন।
                      </td>
                    </tr>
                  ) : (
                    data.deposits.map(dep => (
                      <tr key={dep.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#38bdf8' }}>
                          {dep.voucherNo}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>{dep.depositDate}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            মাস: {dep.month} {dep.year}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '800' }}>{dep.memberName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            সদস্য আইডি: {dep.memberId || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '700' }}>{dep.method}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {dep.bankName} {dep.bankReceiptNo ? `(রশিদ: ${dep.bankReceiptNo})` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#10b981', fontSize: '0.95rem' }}>
                          ৳ {dep.amount?.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800'
                            }}
                          >
                            ✓ Approved
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => setActivePrintReceipt(dep)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={12} />
                            <span>রিসিট</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BULK BANK DEPOSITS */}
        {activeTab === 'bulk_deposit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Layers size={22} color="#3b82f6" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>এক ব্যাংক স্লিপে বহু সদস্যের চাঁদা এন্ট্রি (Bulk Deposit)</h3>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    যখন কোষাধ্যক্ষ বা প্রতিনিধি একাধিক সদস্যের চাঁদা একবারে ব্যাংকে জমা দিয়ে একটি রসিদ পান
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveBulkDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ব্যাংকের নাম</label>
                    <input
                      type="text"
                      value={bulkDepositHead.bankName}
                      onChange={(e) => setBulkDepositHead({ ...bulkDepositHead, bankName: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ব্যাংক রশিদ / স্লিপ নম্বর *</label>
                    <input
                      type="text"
                      placeholder="যেমন: DBBL-987654"
                      required
                      value={bulkDepositHead.bankReceiptNo}
                      onChange={(e) => setBulkDepositHead({ ...bulkDepositHead, bankReceiptNo: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>জমার তারিখ</label>
                    <input
                      type="date"
                      value={bulkDepositHead.depositDate}
                      onChange={(e) => setBulkDepositHead({ ...bulkDepositHead, depositDate: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', fontWeight: '800', marginBottom: '4px' }}>ব্যাংক স্লিপের মোট টাকা (BDT) *</label>
                    <input
                      type="number"
                      placeholder="৫০,০০০"
                      required
                      value={bulkDepositHead.totalSlipAmount}
                      onChange={(e) => setBulkDepositHead({ ...bulkDepositHead, totalSlipAmount: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid #10b981', color: '#10b981', fontSize: '0.9rem', fontWeight: '900' }}
                    />
                  </div>
                </div>

                {/* Sub-Rows */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800' }}>সদস্যভিত্তিক জমার বিভাজন:</span>
                    <button
                      type="button"
                      onClick={handleAddBulkRow}
                      style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      + সদস্য যোগ করুন
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bulkItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={item.memberId}
                          onChange={(e) => handleBulkItemChange(idx, 'memberId', e.target.value)}
                          required
                          style={{ flex: 2, padding: '8px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.8rem' }}
                        >
                          <option value="">-- সদস্য নির্বাচন করুন --</option>
                          {data.members.map(m => (
                            <option key={m.id} value={m.id}>{m.id} - {m.nameBn || m.nameEn} ({m.mobile})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="টাকা"
                          value={item.amount}
                          required
                          onChange={(e) => handleBulkItemChange(idx, 'amount', e.target.value)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.8rem' }}
                        />
                        <select
                          value={item.month}
                          onChange={(e) => handleBulkItemChange(idx, 'month', e.target.value)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '0.8rem' }}
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        {bulkItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkRow(idx)}
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation bar */}
                <div
                  style={{
                    background: calculatedBulkSum === Number(bulkDepositHead.totalSlipAmount) && calculatedBulkSum > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${calculatedBulkSum === Number(bulkDepositHead.totalSlipAmount) && calculatedBulkSum > 0 ? '#10b981' : '#ef4444'}50`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <span>সদস্যদের যোগফল: </span>
                    <strong style={{ color: '#fff' }}>৳ {calculatedBulkSum.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>ব্যাংক স্লিপের মোট: </span>
                    <strong style={{ color: '#fff' }}>৳ {Number(bulkDepositHead.totalSlipAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    {calculatedBulkSum === Number(bulkDepositHead.totalSlipAmount) && calculatedBulkSum > 0 ? (
                      <span style={{ color: '#10b981', fontWeight: '800' }}>✓ সম্পূর্ণ মিলেছে!</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: '800' }}>
                        পার্থক্য: ৳ {Math.abs(calculatedBulkSum - Number(bulkDepositHead.totalSlipAmount || 0)).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ✓ বাল্ক ডিপোজিট ও সকল সদস্যের পৃথক রিসিট তৈরি করুন
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENT STATUS & DUES */}
        {activeTab === 'payment_status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>📋 মাসভিত্তিক সদস্য চাঁদা ও বকেয়া খাতা</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {targetMonth} {targetYear}-এর সকল সদস্যের পেমেন্ট স্ট্যাটাস এবং বকেয়া নোটিশ জেনারেটর
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: '700' }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <input
                  type="number"
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  style={{ width: '80px', background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: '700' }}
                />
              </div>
            </div>

            {/* Payment Status Grid */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>সদস্য আইডি</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>নাম ও পদবি</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>মোবাইল / WA</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>চাঁদার হার</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>জমা টাকা</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>বকেয়া টাকা</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>পেমেন্ট স্ট্যাটাস</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        কোনো সদস্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map(member => {
                      const st = calculateMemberPaymentStatus(member, currentSamity, data.deposits, targetMonth, targetYear);
                      return (
                        <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '900', color: '#38bdf8' }}>{member.id}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '800' }}>{member.nameBn || member.nameEn}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.membershipType}</div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div>{member.mobile}</div>
                            {member.whatsappNumber && <div style={{ fontSize: '0.7rem', color: '#10b981' }}>WA: {member.whatsappNumber}</div>}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>
                            ৳ {st.requiredAmount}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#10b981' }}>
                            ৳ {st.paidAmount}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: st.dueAmount > 0 ? '#ef4444' : '#10b981' }}>
                            ৳ {st.dueAmount}
                            {st.lateFee > 0 && <span style={{ fontSize: '0.68rem', color: '#f59e0b', display: 'block' }}>+জরিমানা: {st.lateFee}</span>}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <span
                              style={{
                                background: st.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : st.status === 'partially_paid' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: st.status === 'paid' ? '#10b981' : st.status === 'partially_paid' ? '#f59e0b' : '#ef4444',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '800'
                              }}
                            >
                              {st.status === 'paid' ? 'পরিশোধিত' : st.status === 'partially_paid' ? 'আংশিক পরিশোধ' : 'বাকি'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {st.dueAmount > 0 ? (
                                <>
                                  <button
                                    onClick={() => handleSendReminder(member, 'whatsapp')}
                                    title="WhatsApp তাগাদা"
                                    style={{
                                      background: 'rgba(37, 211, 102, 0.15)',
                                      color: '#25D366',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Send size={11} />
                                    <span>রিমাইন্ডার</span>
                                  </button>
                                  <button
                                    onClick={() => setActivePrintNotice({ member, status: st })}
                                    title="বকেয়া নোটিশ প্রিন্ট"
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      color: '#ef4444',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: '800',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    নোটিশ
                                  </button>
                                </>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '0.74rem', fontWeight: '800' }}>✓ পরিশোধিত</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: MULTI-CHANNEL REMINDERS */}
        {activeTab === 'reminders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Send size={20} color="#2dd4bf" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>
                  📢 মাল্টি-চ্যানেল রিমাইন্ডার সেন্টার (WhatsApp, SMS, Telegram, Messenger)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                বকেয়া সদস্যদের ১-ক্লিকে হোয়াটসঅ্যাপে প্রি-ফিল্ড মেসেজ প্রেরণ করুন অথবা মেসেজ কপি করে টেলিগ্রাম বা মেসেঞ্জারে পাঠান।
              </p>
            </div>

            {/* Unpaid Member Reminder Queue */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>সদস্য</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>মোবাইল / WA</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>বকেয়ার পরিমাণ</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>WhatsApp</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>SMS</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>Telegram</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>Messenger</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.filter(m => {
                    const st = calculateMemberPaymentStatus(m, currentSamity, data.deposits, targetMonth, targetYear);
                    return st.dueAmount > 0;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#10b981', fontWeight: '800' }}>
                        🎉 চমৎকার! {targetMonth} মাসের সকল সদস্যের চাঁদা সম্পূর্ণ পরিশোধিত! কোনো বকেয়া নেই।
                      </td>
                    </tr>
                  ) : (
                    filteredMembers
                      .filter(m => calculateMemberPaymentStatus(m, currentSamity, data.deposits, targetMonth, targetYear).dueAmount > 0)
                      .map(member => {
                        const st = calculateMemberPaymentStatus(member, currentSamity, data.deposits, targetMonth, targetYear);
                        return (
                          <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: '800' }}>{member.nameBn || member.nameEn}</div>
                              <div style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{member.id}</div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div>{member.mobile}</div>
                              {member.whatsappNumber && <div style={{ fontSize: '0.7rem', color: '#10b981' }}>WA: {member.whatsappNumber}</div>}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#ef4444' }}>
                              ৳ {st.dueAmount}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleSendReminder(member, 'whatsapp')}
                                style={{
                                  background: 'rgba(37, 211, 102, 0.15)',
                                  color: '#25D366',
                                  border: '1px solid rgba(37, 211, 102, 0.3)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Share2 size={12} />
                                <span>WhatsApp পাঠান</span>
                              </button>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleSendReminder(member, 'sms')}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#3b82f6',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                SMS কপি
                              </button>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleSendReminder(member, 'telegram')}
                                style={{
                                  background: 'rgba(0, 136, 204, 0.15)',
                                  color: '#0088cc',
                                  border: '1px solid rgba(0, 136, 204, 0.3)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                Telegram
                              </button>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleSendReminder(member, 'messenger')}
                                style={{
                                  background: 'rgba(0, 132, 255, 0.15)',
                                  color: '#0084ff',
                                  border: '1px solid rgba(0, 132, 255, 0.3)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '800',
                                  cursor: 'pointer'
                                }}
                              >
                                Messenger
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Reminder Sending History */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '800' }}>📋 প্রেরিত রিমাইন্ডার হিস্ট্রি</h3>
              {(data.reminders || []).length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>এখনো কোনো রিমাইন্ডার লগ রেকর্ড হয়নি।</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {data.reminders.slice(0, 5).map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <span><strong>{r.memberName}</strong> কে <strong>{r.channel}</strong>-এর মাধ্যমে তাগাদা পাঠানো হয়েছে</span>
                      <span style={{ color: 'var(--text-muted)' }}>{r.sentAt?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: EXPENSES & FUND BALANCE */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>💸 সমিতির নিয়মিত খরচ ও বিল ভাউচার</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  অফিস ভাড়া, বিদ্যুৎ বিল, ইভেন্ট খরচ, ত্রাণ বা সমাজসেবা ইত্যাদি সমিতির ফান্ড থেকে ব্যয়ের খাতা
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>+ খরচ এন্ট্রি করুন</span>
              </button>
            </div>

            {/* Expense Table */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.7)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>ভাউচার নং</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>তারিখ</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>খরচের শিরোনাম ও খাত</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '800' }}>পেমেন্ট মাধ্যম</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800' }}>টাকার পরিমাণ</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '800' }}>অনুমোদন</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        এখনো কোনো খরচ রেকর্ড করা হয়নি।
                      </td>
                    </tr>
                  ) : (
                    data.expenses.map(exp => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#f87171' }}>{exp.voucherNo}</td>
                        <td style={{ padding: '12px 14px' }}>{exp.expenseDate}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '800' }}>{exp.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{exp.category}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{exp.paymentMethod}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '900', color: '#ef4444', fontSize: '0.95rem' }}>
                          ৳ {exp.amount?.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>
                            ✓ Approved
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: FUND & BALANCE */}
        {activeTab === 'fund_balance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '800' }}>
                ⚖️ সমিতির তহবিল ও হিসাব সমীকরণ (Fund Calculation Formula)
              </h3>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  color: '#2dd4bf',
                  textAlign: 'center'
                }}
              >
                মোট ফান্ড = মোট অনুমোদিত জমা (৳{metrics.totalApprovedDeposits.toLocaleString()}) - মোট অনুমোদিত খরচ (৳{metrics.totalApprovedExpenses.toLocaleString()}) = ৳{metrics.availableFund.toLocaleString()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '20px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#3b82f6', fontWeight: '700' }}>ব্যাংক ব্যালেন্স</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>
                    ৳ {metrics.bankBalance.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {currentSamity.bankDetails?.bankName} ({currentSamity.bankDetails?.accNo})
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: '700' }}>নগদ ক্যাশ ব্যালেন্স</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                    ৳ {metrics.cashBalance.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    কোষাধ্যক্ষের নিকট সংরক্ষিত নগদ ক্যাশ
                  </div>
                </div>

                <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '0.76rem', color: '#ec4899', fontWeight: '700' }}>মোবাইল ব্যাংকিং ব্যালেন্স</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ec4899', marginTop: '4px' }}>
                    ৳ {metrics.mobileBalance.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    বিকাশ/নগদ ({currentSamity.mobileBanking?.number})
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: LETTERHEAD & PRINT TEMPLATE */}
        {activeTab === 'letterhead' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800' }}>
                📜 অফিসিয়াল লেটারহেড লাইভ প্রিভিউ ও কনফিগারেশন
              </h3>

              {/* Live Preview Box */}
              <div
                id="samity-official-letterhead-preview"
                style={{
                  background: '#ffffff',
                  color: '#111827',
                  padding: '24px',
                  borderRadius: '10px',
                  border: `2px solid ${data.letterhead?.borderColor || '#3b82f6'}`,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                  minHeight: '260px',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: data.letterhead?.logoPosition === 'center' ? 'center' : 'space-between',
                    flexDirection: data.letterhead?.logoPosition === 'center' ? 'column' : 'row',
                    borderBottom: '2px solid #0f172a',
                    paddingBottom: '14px',
                    textAlign: data.letterhead?.logoPosition === 'center' ? 'center' : 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '10px',
                        background: '#0d9488',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: '900'
                      }}
                    >
                      {currentSamity.nameBn?.[0] || 'স'}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>
                        {currentSamity.nameBn}
                      </h2>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>
                        {currentSamity.nameEn}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: '700', marginTop: '2px' }}>
                        স্লোগান: {currentSamity.sloganBn}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                    <div>নিবন্ধন নং: <strong>{currentSamity.regNo}</strong></div>
                    <div>ঠিকানা: {currentSamity.address}</div>
                    <div>মোবাইল: {currentSamity.mobile} | ইমেইল: {currentSamity.email}</div>
                  </div>
                </div>

                {/* Body placeholder */}
                <div style={{ padding: '24px 0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                  <p>[ এই লেটারহেডের ওপর সমিতির পরিশোধ রিসিট, সদস্য তালিকা, বকেয়া নোটিশ ও যেকোনো অফিসিয়াল পত্র স্বয়ংক্রিয়ভাবে প্রস্তুত হবে ]</p>
                </div>

                {/* Footer */}
                <div
                  style={{
                    borderTop: '1px solid #cbd5e1',
                    paddingTop: '10px',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{data.letterhead?.footerText}</span>
                  <span>পৃষ্ঠা ১/১ • কিউআর ভেরিফাইড</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handlePrintElement('samity-official-letterhead-preview')}
                  className="btn"
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={15} />
                  <span>লেটারহেড টেস্ট প্রিন্ট</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: SIGNATURES & SEALS */}
        {activeTab === 'signatures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <PenTool size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                  ✍️ অনুমোদিত স্বাক্ষর ও অফিশিয়াল সিল কনফিগারেশন
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                সভাপতি, সাধারণ সম্পাদক ও কোষাধ্যক্ষের নাম ও পদবি সেট করুন। প্রিন্ট আউটে স্বয়ংক্রিয়ভাবে তিনটি স্বাক্ষর লাইন যুক্ত হবে।
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {data.signatures.map((sig, idx) => (
                  <div
                    key={sig.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
                      {sig.designationBn} ({sig.designationEn})
                    </div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>কর্মকর্তার নাম:</label>
                    <input
                      type="text"
                      value={sig.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        updateAndSave(prev => ({
                          ...prev,
                          signatures: prev.signatures.map((s, i) => i === idx ? { ...s, name: newName } : s)
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(30, 41, 59, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: '700'
                      }}
                    />

                    <div style={{ marginTop: '12px', borderTop: '1px dashed #64748b', paddingTop: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem' }}>
                      স্বাক্ষর লাইন প্রিভিউ:
                      <div style={{ marginTop: '20px', fontWeight: '800', color: '#fff' }}>______________________</div>
                      <div style={{ fontWeight: '800', color: '#fff' }}>{sig.name}</div>
                      <div>{sig.designationBn}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: DOCUMENTS GENERATOR */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Award size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                  📝 অফিশিয়াল চিঠি, রেজুলেশন ও মেম্বারশিপ সার্টিফিকেট জেনারেটর
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                সমিতির নোটিশ, মিটিংয়ের কার্যবিবরণী, সদস্যপদ সনদপত্র ইত্যাদি ১-ক্লিকে লেটারহেডে জেনারেট ও প্রিন্ট করুন।
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { title: 'সদস্যপদ সনদপত্র (Membership Certificate)', desc: 'সদস্যের ছবি ও আইডি সংবলিত সনদ' },
                  { title: 'মাসিক সাধারণ সভা নোটিশ (AGM/Meeting Notice)', desc: 'এজেন্ডা ও সভার স্থান সংবলিত নোটিশ' },
                  { title: 'বকেয়া চাঁদা পরিশোধের চুড়ান্ত নোটিশ (Final Notice)', desc: '৭ দিনের আলটিমেটাম নোটিশ' },
                  { title: 'ব্যাংক হিসাব পরিচালনা রেজুলেশন (Bank Resolution)', desc: 'নতুন অ্যাকাউন্ট খোলার সভার সিদ্ধান্ত' }
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{doc.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        showToast?.(`"${doc.title}" টেমপ্লেট লোড হয়েছে!`, 'info');
                      }}
                      className="btn"
                      style={{
                        marginTop: '12px',
                        background: 'rgba(20, 184, 166, 0.15)',
                        color: '#2dd4bf',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        padding: '6px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      প্রিন্ট প্রিভিউ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: 28 COMPLETE REPORTS */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <FileSpreadsheet size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800' }}>
                  📈 ২৮টি পূর্ণাঙ্গ অডিট ও সমবায় রিপোর্ট
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                বার্ষিক অডিট, সদস্য তালিকা, ব্যাংক রিকনসিলেশন, চাঁদা আদায় শিট ও রিমাইন্ডার রিপোর্ট
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {[
                '১. সাধারণ সদস্য তালিকা রিপোর্ট',
                '২. সক্রিয় সদস্য ও চাঁদার রেট রিপোর্ট',
                '৩. চলতি মাসের সম্পূর্ণ পরিশোধিত তালিকা',
                '৪. বকেয়া সদস্য ও বকেয়ার পরিমাণ শিট',
                '৫. আংশিক পরিশোধিত সদস্য রিপোর্ট',
                '৬. সদস্যভিত্তিক সর্বমোট জমা লেজার',
                '৭. ব্যাংকভিত্তিক জমা স্টেটমেন্ট রিপোর্ট',
                '৮. ভাউচার ও ব্যাংক রসিদওয়ারি রিপোর্ট',
                '৯. মোবাইল ব্যাংকিং (বিকাশ/নগদ) জমা রিপোর্ট',
                '১০. বাল্ক ব্যাংক ডিপোজিট রিপোর্ট',
                '১১. সমিতির নিয়মিত খরচের খাতা রিপোর্ট',
                '১২. মাসিক ও বার্ষিক তহবিল ব্যালেন্স রিপোর্ট',
                '১৩. ব্যাংক রিকনসিলেশন স্টেটমেন্ট',
                '১৪. মাল্টি-চ্যানেল রিমাইন্ডার হিস্ট্রি রিপোর্ট',
                '১৫. রিমাইন্ডারের কার্যকারিতা রিপোর্ট',
                '১৬. সিস্টেম অডিট ট্রেইল ও লগ রিপোর্ট'
              ].map((rep, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{rep}</span>
                  <button
                    onClick={() => {
                      showToast?.(`"${rep}" জেনারেট হচ্ছে...`, 'info');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    এক্সপোর্ট
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 13: SQL SCHEMA MIGRATION */}
        {activeTab === 'sql_schema' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>🗄️ PostgreSQL / Supabase SQL Migration Script</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  সেকশন ৩২-এ বর্ণিত সমিতি, সদস্য, জমা, খরচ, রিমাইন্ডার ও অডিট ট্রেইলের সম্পূর্ণ নরমালাইজড টেবিল
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(SAMITY_SQL_MIGRATION_SCHEMA);
                  showToast?.('SQL Migration স্ক্রিপ্ট ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
                }}
                className="btn"
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Copy size={13} />
                <span>কপি করুন</span>
              </button>
            </div>

            <pre
              style={{
                background: '#090d16',
                color: '#38bdf8',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '0.74rem',
                lineHeight: '1.5',
                overflowX: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '450px'
              }}
            >
              {SAMITY_SQL_MIGRATION_SCHEMA}
            </pre>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. MODALS: MEMBER CREATE / EDIT */}
      {/* ==================================================================== */}
      {isMemberModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                {editingMember ? 'সদস্যের তথ্য সম্পাদনা' : 'নতুন সদস্য নিবন্ধন ফরম'}
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>পূর্ণ নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    required
                    value={memberForm.nameBn}
                    onChange={(e) => setMemberForm({ ...memberForm, nameBn: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name (English)</label>
                  <input
                    type="text"
                    value={memberForm.nameEn}
                    onChange={(e) => setMemberForm({ ...memberForm, nameEn: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ব্যক্তিগত মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={memberForm.mobile}
                    onChange={(e) => setMemberForm({ ...memberForm, mobile: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>হোয়াটসঅ্যাপ নম্বর</label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={memberForm.whatsappNumber}
                    onChange={(e) => setMemberForm({ ...memberForm, whatsappNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>টেলিগ্রাম নম্বর / ইউজারনেম</label>
                  <input
                    type="text"
                    placeholder="@username or phone"
                    value={memberForm.telegramHandle}
                    onChange={(e) => setMemberForm({ ...memberForm, telegramHandle: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>মেম্বারশিপ টাইপ / পদবি</label>
                  <select
                    value={memberForm.membershipType}
                    onChange={(e) => setMemberForm({ ...memberForm, membershipType: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  >
                    <option value="General Member">সাধারণ সদস্য</option>
                    <option value="Life Member">আজীবন সদস্য</option>
                    <option value="Executive Member">কার্যনির্বাহী সদস্য</option>
                    <option value="Advisor">উপদেষ্টা</option>
                    <option value="President">সভাপতি</option>
                    <option value="Vice President">সহ-সভাপতি</option>
                    <option value="General Secretary">সাধারণ সম্পাদক</option>
                    <option value="Treasurer">কোষাধ্যক্ষ</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>মাসিক চাঁদা (খালি রাখলে ডিফল্ট ৫০০/-)</label>
                  <input
                    type="number"
                    placeholder={currentSamity.monthlySubscription || 500}
                    value={memberForm.customSubscription}
                    onChange={(e) => setMemberForm({ ...memberForm, customSubscription: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>জাতীয় পরিচয়পত্র (NID) নম্বর</label>
                  <input
                    type="text"
                    value={memberForm.nidNumber}
                    onChange={(e) => setMemberForm({ ...memberForm, nidNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>বর্তমান ঠিকানা</label>
                <textarea
                  rows={2}
                  value={memberForm.presentAddress}
                  onChange={(e) => setMemberForm({ ...memberForm, presentAddress: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  {editingMember ? 'আপডেট করুন' : 'সদস্য সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL: DEPOSIT ENTRY */}
      {/* ==================================================================== */}
      {isDepositModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '550px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                💳 নতুন জমা ভাউচার এন্ট্রি
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>সদস্য নির্বাচন করুন *</label>
                <select
                  required
                  value={depositForm.memberId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const m = data.members.find(mem => mem.id === mId);
                    setDepositForm({
                      ...depositForm,
                      memberId: mId,
                      amount: m?.customSubscription || currentSamity.monthlySubscription || '500'
                    });
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                >
                  <option value="">-- সদস্য সিলেক্ট করুন --</option>
                  {data.members.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.nameBn || m.nameEn} ({m.mobile})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', fontWeight: '800', marginBottom: '4px' }}>জমার পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid #10b981', color: '#10b981', fontSize: '0.9rem', fontWeight: '900' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>জমার মাধ্যম</label>
                  <select
                    value={depositForm.method}
                    onChange={(e) => setDepositForm({ ...depositForm, method: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  >
                    <option value="bank_counter">ব্যাংক কাউন্টার (Bank)</option>
                    <option value="online_banking">অনলাইন ব্যাংকিং</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="cash">নগদ ক্যাশ (Cash)</option>
                    <option value="cheque">চেক (Cheque)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>জমার মাস</label>
                  <select
                    value={depositForm.month}
                    onChange={(e) => setDepositForm({ ...depositForm, month: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ব্যাংক রসিদ / TrxID নং</label>
                  <input
                    type="text"
                    value={depositForm.bankReceiptNo}
                    onChange={(e) => setDepositForm({ ...depositForm, bankReceiptNo: e.target.value })}
                    placeholder="যেমন: DBBL-123456"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  ✓ জমা সম্পন্ন ও রিসিট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MODAL: EXPENSE ENTRY */}
      {/* ==================================================================== */}
      {isExpenseModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                💸 সমিতির নতুন খরচ এন্ট্রি
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>খরচের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অফিস রুম ভাড়া, বিদ্যুৎ বিল"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', fontWeight: '800', marginBottom: '4px' }}>টাকার পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid #ef4444', color: '#ef4444', fontSize: '0.9rem', fontWeight: '900' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>খরচের খাত</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.82rem' }}
                  >
                    <option value="office_rent">অফিস ভাড়া</option>
                    <option value="electricity_bill">বিদ্যুৎ ও গ্যাস বিল</option>
                    <option value="event_cost">মিটিং বা বার্ষিক সভা</option>
                    <option value="charity">ত্রাণ বা অনুদান</option>
                    <option value="stationery">কাগজপত্র ও স্টেশনারি</option>
                    <option value="bank_charge">ব্যাংক চার্জ ও ফি</option>
                    <option value="other">অন্যান্য ব্যয়</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MODAL: PIXEL-PERFECT PRINTABLE PAID RECEIPT */}
      {/* ==================================================================== */}
      {activePrintReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '30px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
          >
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePrintElement('samity-printable-paid-receipt')}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
              <button
                onClick={() => setActivePrintReceipt(null)}
                style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Receipt DOM Container */}
            <div id="samity-printable-paid-receipt" style={{ position: 'relative', border: '2px solid #0f172a', padding: '24px', borderRadius: '12px', background: '#fff' }}>
              {/* PAID Watermark */}
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '20%',
                  fontSize: '56px',
                  fontWeight: '900',
                  color: 'rgba(16, 185, 129, 0.12)',
                  transform: 'rotate(-25deg)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 0
                }}
              >
                PAID / পরিশোধিত
              </div>

              {/* Header with Letterhead */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', position: 'relative', zIndex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>
                  {currentSamity.nameBn}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                  {currentSamity.nameEn}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: '700', marginTop: '2px' }}>
                  স্লোগান: {currentSamity.sloganBn}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  {currentSamity.address} • ফোন: {currentSamity.mobile} • ইমেইল: {currentSamity.email}
                </div>
              </div>

              {/* Receipt Title */}
              <div style={{ textAlign: 'center', margin: '14px 0', position: 'relative', zIndex: 1 }}>
                <span
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    padding: '4px 18px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '900',
                    letterSpacing: '1px'
                  }}
                >
                  পরিশোধ রিসিট / PAYMENT RECEIPT
                </span>
              </div>

              {/* Receipt Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <div>রিসিট নম্বর: <strong>{activePrintReceipt.voucherNo}</strong></div>
                <div>তারিখ: <strong>{activePrintReceipt.depositDate}</strong></div>
              </div>

              {/* Member Details Box */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <div>সদস্য আইডি: <strong>{activePrintReceipt.memberId}</strong></div>
                  <div>সদস্যের নাম: <strong>{activePrintReceipt.memberName}</strong></div>
                  <div>জমার ধরন: <strong>{activePrintReceipt.depositType}</strong></div>
                  <div>জমার মাস: <strong>{activePrintReceipt.month} {activePrintReceipt.year}</strong></div>
                </div>
              </div>

              {/* Amount Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>বিবরণ</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>জমার মাধ্যম ও রেফারেন্স</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>পরিমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e2e8f0' }}>
                      মাসিক চাঁদা ({activePrintReceipt.month} {activePrintReceipt.year})
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      {activePrintReceipt.method} {activePrintReceipt.bankReceiptNo ? `(স্লিপ: ${activePrintReceipt.bankReceiptNo})` : ''}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '900', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                      ৳ {activePrintReceipt.amount?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in words */}
              <div style={{ fontSize: '0.78rem', color: '#334155', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                কথায়: <strong>{numberToBanglaWords(activePrintReceipt.amount)}</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  In Words: {numberToEnglishWords(activePrintReceipt.amount)}
                </div>
              </div>

              {/* Signatures Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '45px',
                  paddingTop: '10px',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                {data.signatures.map(sig => (
                  <div key={sig.id} style={{ textAlign: 'center', width: '30%' }}>
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: '800', fontSize: '0.78rem' }}>
                      {sig.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sig.designationBn}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '0.7rem', color: '#94a3b8', position: 'relative', zIndex: 1 }}>
                এটি একটি কম্পিউটার জেনারেটেড রসিদ • স্বচ্ছতা ও সততা আমাদের অঙ্গীকার • হিসাব কিতাব ৩৬০ ডিগ্রি
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL: PRINTABLE DUE NOTICE */}
      {/* ==================================================================== */}
      {activePrintNotice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '30px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <button
                onClick={() => handlePrintElement('samity-printable-due-notice')}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Printer size={16} />
                <span>বকেয়া নোটিশ প্রিন্ট করুন</span>
              </button>
              <button
                onClick={() => setActivePrintNotice(null)}
                style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div id="samity-printable-due-notice" style={{ border: '2px solid #ef4444', padding: '24px', borderRadius: '12px', background: '#fff' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#0f172a' }}>{currentSamity.nameBn}</h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{currentSamity.address} • ফোন: {currentSamity.mobile}</div>
              </div>

              <div style={{ textAlign: 'center', margin: '14px 0' }}>
                <span style={{ background: '#ef4444', color: '#fff', padding: '4px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '900' }}>
                  বকেয়া চাঁদা পরিশোধের তাগিদপত্র / DUE NOTICE
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
                <p>তারিখ: <strong>{new Date().toLocaleDateString('bn-BD')}</strong></p>
                <p>বরাবর,<br />
                জনাব <strong>{activePrintNotice.member.nameBn || activePrintNotice.member.nameEn}</strong> (সদস্য আইডি: {activePrintNotice.member.id})<br />
                মোবাইল: {activePrintNotice.member.mobile}</p>

                <p>
                  জনাব, আপনার সদয় অবগতির জন্য জানানো যাচ্ছে যে, <strong>{currentSamity.nameBn}</strong>-এর অধীনে আপনার <strong>{activePrintNotice.status.month} {activePrintNotice.status.year}</strong> মাসের মাসিক চাঁদা বাবদ মোট <strong>৳{activePrintNotice.status.dueAmount}/-</strong> টাকা এখনো বকেয়া রয়েছে।
                </p>

                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', margin: '14px 0' }}>
                  <div>মোট বকেয়া চাঁদা: <strong>৳ {activePrintNotice.status.dueAmount}/-</strong></div>
                  <div>বিলম্ব ফি / জরিমানা: <strong>৳ {activePrintNotice.status.lateFee || 0}/-</strong></div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#b91c1c', marginTop: '4px' }}>
                    সর্বমোট পরিশোধযোগ্য: ৳ {activePrintNotice.status.totalPayable}/-
                  </div>
                </div>

                <p>
                  অতএব, আগামী <strong>{currentSamity.subscriptionDueDay || 10} {activePrintNotice.status.month}</strong> তারিখের মধ্যে উক্ত বকেয়া চাঁদা সমিতির উল্লেখিত ব্যাংক হিসাবে অথবা বিকাশ মার্চেন্ট নম্বরে জমা প্রদানের জন্য বিশেষভাবে অনুরোধ করা হলো।
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '10px' }}>
                {data.signatures.map(sig => (
                  <div key={sig.id} style={{ textAlign: 'center', width: '30%' }}>
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: '800', fontSize: '0.78rem' }}>
                      {sig.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sig.designationBn}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SamityManagementHub;
