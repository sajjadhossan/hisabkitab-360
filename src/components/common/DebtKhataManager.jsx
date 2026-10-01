import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HandCoins,
  Plus,
  Search,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Share2,
  Trash2,
  Edit,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CreditCard,
  MessageCircle,
  HelpCircle,
  Tag,
  UserCheck,
  Building,
  User,
  ExternalLink,
  Download
} from 'lucide-react';
import { printHtmlContent } from '../../services/printService';
import { CategoryManagerModal } from './CategoryManagerModal';
import {
  formatWhatsAppDueReminderMessage,
  normalizeWhatsAppPhone
} from '../../services/qrService';
import { SmartVoiceFormBanner } from './SmartVoiceFormBanner';
import { VoiceInputButton } from './VoiceInputButton';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { DueReminderModal } from './DueReminderModal';
import { exportDebtKhataToCSV } from '../../services/exportService';

export const DebtKhataManager = ({ profile: currentProfile }) => {
  const {
    profile: activeAppProfile,
    personalDebts,
    businessDebts,
    addDebtPerson,
    updateDebtPerson,
    deleteDebtPerson,
    addDebtTransaction,
    editDebtTransaction,
    deleteDebtTransaction,
    businessSettings,
    categories = {},
    lang,
    showToast
  } = useApp();

  const isPersonal = (currentProfile || activeAppProfile) === 'personal';
  const debtList = isPersonal ? (personalDebts || []) : (businessDebts || []);
  const targetProfileKey = isPersonal ? 'personal' : 'business';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'receivable' | 'payable' | 'settled' | 'overdue'

  // Modals
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [activePersonForTx, setActivePersonForTx] = useState(null);
  const [activePersonForLedger, setActivePersonForLedger] = useState(null);
  const [editingTx, setEditingTx] = useState(null); // { personId, tx }
  const [reminderTarget, setReminderTarget] = useState(null);

  const sendWhatsAppReminder = (person) => {
    const stats = getPersonStats(person);
    setReminderTarget({
      name: person.name,
      phone: person.phone,
      dueAmount: Math.abs(stats.netReceivable),
      dueDate: stats.nearestDueDate || ''
    });
  };

  const relationGroupKey = isPersonal ? 'debtPersonalRelations' : 'debtBusinessRelations';
  const availableRelations = categories[relationGroupKey] || (isPersonal ? ['বন্ধু', 'আত্মীয়', 'সহকর্মী', 'প্রতিবেশী', 'পরিবার', 'অন্যান্য'] : ['ব্যবসায়ী পার্টনার', 'মহাজন', 'কাস্টমার', 'সাপ্লায়ার', 'অন্যান্য']);

  // Form: New / Edit Person
  const [personForm, setPersonForm] = useState({
    name: '',
    phone: '',
    address: '',
    relation: availableRelations[0] || (isPersonal ? 'বন্ধু' : 'ব্যবসায়ী পার্টনার'),
    notes: '',
    addInitialTx: true,
    initialType: 'lend', // 'lend' | 'borrow'
    initialAmount: '',
    initialDate: new Date().toISOString().split('T')[0],
    initialPurpose: '',
    initialDueDate: '',
    initialMethod: 'cash',
    initialNote: ''
  });

  // Form: New Transaction
  const [txForm, setTxForm] = useState({
    type: 'lend', // 'lend' | 'repay_lend' | 'borrow' | 'repay_borrow'
    amount: '',
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    dueDate: '',
    method: 'cash',
    note: ''
  });

  // Calculate stats for a single person
  const getPersonStats = (person) => {
    const txs = person?.transactions || [];
    let totalLent = 0;
    let totalRepayReceived = 0;
    let totalBorrowed = 0;
    let totalRepaidPaid = 0;
    let hasOverdue = false;
    let overdueCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    txs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'lend') totalLent += amt;
      else if (tx.type === 'repay_lend') totalRepayReceived += amt;
      else if (tx.type === 'borrow') totalBorrowed += amt;
      else if (tx.type === 'repay_borrow') totalRepaidPaid += amt;

      if (tx.dueDate && tx.dueDate < todayStr) {
        if (tx.type === 'lend') {
          hasOverdue = true;
          overdueCount++;
        }
      }
    });

    const netReceivable = (totalLent - totalRepayReceived) - (totalBorrowed - totalRepaidPaid);
    const isReceivable = netReceivable > 0;
    const isPayable = netReceivable < 0;
    const isSettled = Math.abs(netReceivable) < 0.01;

    return {
      totalLent,
      totalRepayReceived,
      totalBorrowed,
      totalRepaidPaid,
      netReceivable,
      isReceivable,
      isPayable,
      isSettled,
      hasOverdue: hasOverdue && isReceivable,
      overdueCount,
      txCount: txs.length
    };
  };

  // Overall Khata Summary Statistics
  const overallStats = useMemo(() => {
    let totalReceivable = 0;
    let totalPayable = 0;
    let overduePersonCount = 0;

    debtList.forEach((person) => {
      const stats = getPersonStats(person);
      if (stats.isReceivable) {
        totalReceivable += stats.netReceivable;
      } else if (stats.isPayable) {
        totalPayable += Math.abs(stats.netReceivable);
      }
      if (stats.hasOverdue) {
        overduePersonCount++;
      }
    });

    const netPosition = totalReceivable - totalPayable;

    return {
      totalReceivable,
      totalPayable,
      netPosition,
      overduePersonCount,
      totalPeople: debtList.length
    };
  }, [debtList]);

  // Filtered People List
  const filteredPeople = useMemo(() => {
    return debtList.filter((person) => {
      const stats = getPersonStats(person);
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        person.name.toLowerCase().includes(search) ||
        (person.phone && person.phone.toLowerCase().includes(search)) ||
        (person.address && person.address.toLowerCase().includes(search)) ||
        (person.relation && person.relation.toLowerCase().includes(search)) ||
        (person.notes && person.notes.toLowerCase().includes(search)) ||
        (person.transactions || []).some(
          (tx) =>
            (tx.purpose && tx.purpose.toLowerCase().includes(search)) ||
            (tx.note && tx.note.toLowerCase().includes(search))
        );

      if (!matchesSearch) return false;

      if (activeFilter === 'receivable') return stats.isReceivable;
      if (activeFilter === 'payable') return stats.isPayable;
      if (activeFilter === 'settled') return stats.isSettled;
      if (activeFilter === 'overdue') return stats.hasOverdue;

      return true; // 'all'
    });
  }, [debtList, searchTerm, activeFilter]);

  // Handle open Add Person modal
  const handleOpenAddPerson = () => {
    setEditingPerson(null);
    setPersonForm({
      name: '',
      phone: '',
      address: '',
      relation: availableRelations[0] || (isPersonal ? 'বন্ধু' : 'ব্যবসায়ী পার্টনার'),
      notes: '',
      addInitialTx: true,
      initialType: 'lend',
      initialAmount: '',
      initialDate: new Date().toISOString().split('T')[0],
      initialPurpose: '',
      initialDueDate: '',
      initialMethod: 'cash',
      initialNote: ''
    });
    setShowAddPersonModal(true);
  };

  // Handle open Edit Person modal
  const handleOpenEditPerson = (person) => {
    setEditingPerson(person);
    setPersonForm({
      name: person.name || '',
      phone: person.phone || '',
      address: person.address || '',
      relation: person.relation || (isPersonal ? 'বন্ধু' : 'ব্যবসায়ী পার্টনার'),
      notes: person.notes || '',
      addInitialTx: false,
      initialType: 'lend',
      initialAmount: '',
      initialDate: new Date().toISOString().split('T')[0],
      initialPurpose: '',
      initialDueDate: '',
      initialMethod: 'cash',
      initialNote: ''
    });
    setShowAddPersonModal(true);
  };

  // Submit Add / Edit Person
  const handleSubmitPerson = (e) => {
    e.preventDefault();
    if (!personForm.name.trim()) {
      showToast(lang === 'bn' ? 'ব্যক্তির নাম অবশ্যই দিতে হবে' : 'Person name is required', 'warning');
      return;
    }

    if (editingPerson) {
      updateDebtPerson(targetProfileKey, editingPerson.id, {
        name: personForm.name.trim(),
        phone: personForm.phone.trim(),
        address: personForm.address.trim(),
        relation: personForm.relation,
        notes: personForm.notes.trim()
      });
      setShowAddPersonModal(false);
      setEditingPerson(null);
    } else {
      const payload = {
        name: personForm.name.trim(),
        phone: personForm.phone.trim(),
        address: personForm.address.trim(),
        relation: personForm.relation,
        notes: personForm.notes.trim()
      };

      if (personForm.addInitialTx && Number(personForm.initialAmount) > 0) {
        payload.initialTx = {
          type: personForm.initialType,
          amount: Number(personForm.initialAmount),
          date: personForm.initialDate || new Date().toISOString().split('T')[0],
          purpose: personForm.initialPurpose.trim(),
          dueDate: personForm.initialDueDate,
          method: personForm.initialMethod,
          note: personForm.initialNote.trim()
        };
      }

      addDebtPerson(targetProfileKey, payload);
      setShowAddPersonModal(false);
    }
  };

  // Open Add Transaction modal for a specific person
  const handleOpenAddTx = (person, defaultType = 'lend') => {
    setActivePersonForTx(person);
    setTxForm({
      type: defaultType,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      purpose: '',
      dueDate: '',
      method: 'cash',
      note: ''
    });
  };

  // Submit New Transaction
  const handleSubmitTx = (e) => {
    e.preventDefault();
    if (!activePersonForTx) return;
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      showToast(lang === 'bn' ? 'টাকার পরিমাণ সঠিকভাবে দিন' : 'Valid amount is required', 'warning');
      return;
    }

    addDebtTransaction(targetProfileKey, activePersonForTx.id, {
      type: txForm.type,
      amount: Number(txForm.amount),
      date: txForm.date || new Date().toISOString().split('T')[0],
      purpose: txForm.purpose.trim(),
      dueDate: txForm.dueDate,
      method: txForm.method,
      note: txForm.note.trim()
    });

    // Trigger Soundbox if debt repayment received
    if (txForm.type === 'repay_lend') {
      triggerSoundboxPayment({
        amount: Number(txForm.amount),
        method: txForm.method || 'cash',
        customerName: activePersonForTx.name,
        type: 'debt_collection'
      });
    }

    // If ledger modal is open, refresh activePersonForLedger
    if (activePersonForLedger && activePersonForLedger.id === activePersonForTx.id) {
      const updated = debtList.find((p) => p.id === activePersonForTx.id);
      if (updated) setActivePersonForLedger(updated);
    }

    setActivePersonForTx(null);
  };

  // Open Edit Transaction modal
  const handleOpenEditTx = (personId, tx) => {
    setEditingTx({
      personId,
      tx: { ...tx }
    });
  };

  // Submit Edit Transaction
  const handleSubmitEditTx = (e) => {
    e.preventDefault();
    if (!editingTx) return;
    if (!editingTx.tx.amount || Number(editingTx.tx.amount) <= 0) {
      showToast(lang === 'bn' ? 'টাকার পরিমাণ সঠিকভাবে দিন' : 'Valid amount is required', 'warning');
      return;
    }

    editDebtTransaction(targetProfileKey, editingTx.personId, editingTx.tx.id, {
      type: editingTx.tx.type,
      amount: Number(editingTx.tx.amount),
      date: editingTx.tx.date,
      purpose: editingTx.tx.purpose,
      dueDate: editingTx.tx.dueDate,
      method: editingTx.tx.method,
      note: editingTx.tx.note
    });

    setEditingTx(null);
  };

  // Delete person confirmation
  const handleDeletePerson = (person) => {
    const count = (person.transactions || []).length;
    const msg =
      lang === 'bn'
        ? `আপনি কি নিশ্চিত যে "${person.name}"-এর সম্পূর্ণ খাতা মুছে ফেলতে চান? (${count} টি লেনদেন রয়েছে)`
        : `Are you sure you want to delete ledger for "${person.name}"? (${count} transactions)`;

    if (window.confirm(msg)) {
      deleteDebtPerson(targetProfileKey, person.id);
      if (activePersonForLedger?.id === person.id) {
        setActivePersonForLedger(null);
      }
    }
  };



  // Print Khata Statement
  const handlePrintStatement = (person) => {
    const stats = getPersonStats(person);
    const txs = [...(person.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

    const htmlContent = `
      <div style="font-family: 'Hind Siliguri', 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #0f766e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0f766e; font-weight: 800;">
              ${isPersonal ? 'নগদ দেনা-পাওনা খতিয়ান স্টেটমেন্ট' : businessSettings?.shopName || 'দেনা-পাওনা স্টেটমেন্ট'}
            </h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">
              ${isPersonal ? 'ব্যক্তিগত নগদ ঋণ ও হাওলাত খাতা' : businessSettings?.tagline || 'ব্যবসায়িক নগদ ঋণ ও দেনা-পাওনা খাতা'} | HisabKitab 360
            </p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <div>প্রিন্ট তারিখ: <strong>${new Date().toLocaleDateString('bn-BD')}</strong></div>
            <div>আইডি: <strong>${person.id}</strong></div>
          </div>
        </div>

        <!-- Person Info Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">ব্যক্তির তথ্য</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${person.name}</div>
            <div style="font-size: 13px; color: #475569; margin-top: 3px;">সম্পর্ক / ধরন: <strong>${person.relation || 'ব্যক্তিগত'}</strong></div>
          </div>
          <div>
            <div style="font-size: 13px; color: #475569;">মোবাইল: <strong>${person.phone || 'দেওয়া নেই'}</strong></div>
            <div style="font-size: 13px; color: #475569; margin-top: 3px;">ঠিকানা: <strong>${person.address || 'দেওয়া নেই'}</strong></div>
            <div style="font-size: 13px; color: #475569; margin-top: 3px;">খাতা খোলার তারিখ: <strong>${person.createdAt || '-'}</strong></div>
          </div>
        </div>

        <!-- Summary Banner -->
        <div style="background: ${stats.isReceivable ? '#f0fdf4' : stats.isPayable ? '#fff1f2' : '#f8fafc'}; border: 1.5px solid ${stats.isReceivable ? '#86efac' : stats.isPayable ? '#fca5a5' : '#cbd5e1'}; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: ${stats.isReceivable ? '#166534' : stats.isPayable ? '#991b1b' : '#334155'};">
              বর্তমান নেট হিসাব স্থিতি
            </div>
            <div style="font-size: 22px; font-weight: 900; color: ${stats.isReceivable ? '#15803d' : stats.isPayable ? '#b91c1c' : '#334155'}; margin-top: 2px;">
              ${stats.isReceivable ? `আমি পাবো: ৳${stats.netReceivable.toLocaleString('en-IN')}` : stats.isPayable ? `আমি দেবো: ৳${Math.abs(stats.netReceivable).toLocaleString('en-IN')}` : 'পরিশোধিত (৳০)'}
            </div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #475569;">
            <div>মোট দিয়েছি/পাওনা: <strong>৳${stats.totalLent.toLocaleString('en-IN')}</strong></div>
            <div>মোট ফেরত পেয়েছি: <strong>৳${stats.totalRepayReceived.toLocaleString('en-IN')}</strong></div>
            ${stats.totalBorrowed > 0 ? `<div>মোট নিয়েছি/দেনা: <strong>৳${stats.totalBorrowed.toLocaleString('en-IN')}</strong></div>` : ''}
            ${stats.totalRepaidPaid > 0 ? `<div>দেনা পরিশোধ: <strong>৳${stats.totalRepaidPaid.toLocaleString('en-IN')}</strong></div>` : ''}
          </div>
        </div>

        <!-- Transactions Table -->
        <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 10px; color: #0f172a;">লেনদেনের বিস্তারিত বিবরণী</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0f766e; color: #ffffff; text-align: left;">
              <th style="padding: 8px 10px; border: 1px solid #0f766e;">ক্রম</th>
              <th style="padding: 8px 10px; border: 1px solid #0f766e;">তারিখ</th>
              <th style="padding: 8px 10px; border: 1px solid #0f766e;">লেনদেনের ধরন</th>
              <th style="padding: 8px 10px; border: 1px solid #0f766e;">কারণ ও উদ্দেশ্য</th>
              <th style="padding: 8px 10px; border: 1px solid #0f766e;">ফেরত তারিখ</th>
              <th style="padding: 8px 10px; border: 1px solid #0f766e;">মাধ্যম</th>
              <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: right;">পরিমাণ (৳)</th>
            </tr>
          </thead>
          <tbody>
            ${
              txs.length === 0
                ? `<tr><td colspan="7" style="text-align:center; padding: 14px; color: #94a3b8;">কোনো লেনদেন রেকর্ড নেই</td></tr>`
                : txs
                    .map((tx, idx) => {
                      const isPlus = tx.type === 'lend' || tx.type === 'repay_borrow';
                      const typeLabel =
                        tx.type === 'lend'
                          ? 'টাকা দিয়েছি (পাওনা)'
                          : tx.type === 'repay_lend'
                          ? 'টাকা ফেরত পেয়েছি'
                          : tx.type === 'borrow'
                          ? 'টাকা নিয়েছি (দেনা)'
                          : 'দেনা শোধ করেছি';

                      const methodLabel =
                        tx.method === 'cash'
                          ? 'ক্যাশ'
                          : tx.method === 'bkash'
                          ? 'বিকাশ'
                          : tx.method === 'nagad'
                          ? 'নগদ'
                          : tx.method === 'bank'
                          ? 'ব্যাংক'
                          : tx.method;

                      return `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${idx + 1}</td>
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${tx.date}</td>
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; color: ${tx.type === 'lend' ? '#0f766e' : tx.type === 'repay_lend' ? '#15803d' : '#b91c1c'};">${typeLabel}</td>
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${tx.purpose || '-'}${tx.note ? ` (${tx.note})` : ''}</td>
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${tx.dueDate || '-'}</td>
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${methodLabel}</td>
                          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ${isPlus ? '#0f766e' : '#b91c1c'};">৳${Number(tx.amount).toLocaleString('en-IN')}</td>
                        </tr>
                      `;
                    })
                    .join('')
            }
          </tbody>
        </table>

        <!-- Signatures -->
        <div style="margin-top: 60px; display: flex; justify-content: space-between; padding: 0 30px;">
          <div style="text-align: center;">
            <div style="width: 160px; border-top: 1px solid #475569; margin-bottom: 6px;"></div>
            <div style="font-size: 12px; font-weight: 600; color: #475569;">হিসাবরক্ষক / পাওনাদারের স্বাক্ষর</div>
          </div>
          <div style="text-align: center;">
            <div style="width: 160px; border-top: 1px solid #475569; margin-bottom: 6px;"></div>
            <div style="font-size: 12px; font-weight: 600; color: #475569;">গ্রহীতার স্বাক্ষর</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
          হিসাব কিতাব ৩৬০ (HisabKitab 360) স্বয়ংক্রিয় দেনা-পাওনা সিস্টেম দ্বারা মুদ্রিত।
        </div>
      </div>
    `;

    printHtmlContent(htmlContent, {
      title: `${person.name}_Debt_Statement`,
      paperType: 'a4'
    });
  };

  // Quick purpose tag suggestions
  const purposeSuggestions = isPersonal
    ? ['জরুরি চিকিৎসা', 'জমি বায়না', 'বাড়ি তৈরি', 'কেনাকাটা', 'ব্যক্তিগত হাওলাত', 'পড়ালেখার খরচ', 'ভ্রমণ']
    : ['দোকানের মাল ক্রয়', 'জরুরি নগদ হাওলাত', 'সাপ্লায়ার বাকি পরিশোধ', 'মালামাল পরিবহন', 'ব্যবসায়িক বিনিয়োগ', 'ভাড়া প্রদান'];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <HandCoins size={22} />
            </div>
            <span>
              {isPersonal
                ? (lang === 'bn' ? 'নগদ দেনা-পাওনা খাতা (ব্যক্তিগত)' : 'Personal Debt & Credit Ledger')
                : (lang === 'bn' ? 'নগদ দেনা-পাওনা খাতা (ব্যবসায়িক)' : 'Business Cash Debt & Credit Ledger')}
            </span>
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {isPersonal
              ? (lang === 'bn'
                  ? 'বন্ধু, আত্মীয় বা পরিচিতজনের সাথে নগদ টাকার নেওয়া-দেওয়া ও একাধিক কিস্তির নিখুঁত খতিয়ান'
                  : 'Track personal cash lent, borrowed, and multi-transaction settlements per person')
              : (lang === 'bn'
                  ? 'দোকান বা কোম্পানির নগদ হাওলাত, মহাজন ঋণ ও বিশেষ দেনা-পাওনার স্বচ্ছ ও নিরাপদ লেজার'
                  : 'Complete company cash credits, advances, borrowings and settlements ledger')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            title={lang === 'bn' ? 'সম্পর্ক ও ক্যাটাগরি তালিকা পরিচালনা (যোগ/রিনেম/ডিলিট)' : 'Manage relation categories'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <Tag size={16} style={{ color: 'var(--primary)' }} />
            <span>{lang === 'bn' ? 'ক্যাটাগরি / ধরন তালিকা' : 'Manage Categories'}</span>
          </button>

          <button
            onClick={() => exportDebtKhataToCSV(debtList, getPersonStats, lang)}
            title={lang === 'bn' ? 'সম্পূর্ণ দেনা-পাওনার খতিয়ান এক্সেলে ডাউনলোড করুন' : 'Export Debt Ledger to Excel CSV'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <Download size={16} style={{ color: '#10b981' }} />
            <span>{lang === 'bn' ? 'এক্সেল খতিয়ান' : 'Excel Export'}</span>
          </button>

          <button
            onClick={handleOpenAddPerson}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} />
            <span>{lang === 'bn' ? '+ নতুন ব্যক্তির খাতা খুলুন' : '+ New Person Ledger'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Total Receivable */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid #10b981',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'bn' ? 'মোট পাওনা (আমি পাবো)' : 'Total Receivable'}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              ৳{overallStats.totalReceivable.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn' ? 'দেনা-পাওনা থেকে পাওনা টাকা' : 'Money to receive'}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowUpRight size={22} />
          </div>
        </div>

        {/* Total Payable */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid #f43f5e',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'bn' ? 'মোট দেনা (আমি দেবো)' : 'Total Payable'}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#f43f5e', marginTop: '4px' }}>
              ৳{overallStats.totalPayable.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn' ? 'পরিশোধ করতে হবে' : 'Money to pay'}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.12)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowDownLeft size={22} />
          </div>
        </div>

        {/* Net Position */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${overallStats.netPosition >= 0 ? '#3b82f6' : '#f59e0b'}`,
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'bn' ? 'নেট স্থিতি (পাওনা - দেনা)' : 'Net Position'}
            </div>
            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: '800',
                color: overallStats.netPosition >= 0 ? '#3b82f6' : '#f59e0b',
                marginTop: '4px'
              }}
            >
              ৳{Math.abs(overallStats.netPosition).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {overallStats.netPosition >= 0
                ? (lang === 'bn' ? 'সার্বিক উদ্বৃত্ত পাওনা' : 'Net in your favor')
                : (lang === 'bn' ? 'সার্বিক নিট দেনা' : 'Net liability')}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: overallStats.netPosition >= 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: overallStats.netPosition >= 0 ? '#3b82f6' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <HandCoins size={22} />
          </div>
        </div>

        {/* Overdue Alert */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid #eab308',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {lang === 'bn' ? 'মেয়াদোত্তীর্ণ তাগাদা' : 'Overdue Reminders'}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: '800', color: '#eab308', marginTop: '4px' }}>
              {overallStats.overduePersonCount} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{lang === 'bn' ? 'জন' : 'people'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lang === 'bn' ? 'ফেরতের তারিখ অতিক্রম করেছে' : 'Passed promised due date'}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.12)',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px', display: 'flex', alignItems: 'center' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'ব্যক্তির নাম, ফোন, ঠিকানা বা কারণ দিয়ে খুঁজুন...' : 'Search by name, phone, purpose...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 40px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.88rem'
            }}
          />
          <div style={{ position: 'absolute', right: searchTerm ? '32px' : '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <VoiceInputButton
              onResult={(text) => setSearchTerm(text)}
              title={lang === 'bn' ? 'মুখে বলে খুঁজুন' : 'Search by Voice'}
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: lang === 'bn' ? 'সকল খাতা' : 'All', count: debtList.length },
            { id: 'receivable', label: lang === 'bn' ? 'আমি পাবো' : 'Receivable', badgeColor: '#10b981' },
            { id: 'payable', label: lang === 'bn' ? 'আমি দেবো' : 'Payable', badgeColor: '#f43f5e' },
            { id: 'settled', label: lang === 'bn' ? 'পরিশোধিত' : 'Settled' },
            { id: 'overdue', label: lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue', badgeColor: '#eab308' }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Person Khata Cards Grid */}
      {filteredPeople.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: '14px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <HandCoins size={30} />
          </div>
          <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)', fontSize: '1.15rem' }}>
            {searchTerm ? (lang === 'bn' ? 'কোনো খাতা খুঁজে পাওয়া যায়নি' : 'No ledgers found') : (lang === 'bn' ? 'দেনা-পাওনা খাতায় কোনো ব্যক্তি নেই' : 'No debt records yet')}
          </h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem' }}>
            {lang === 'bn'
              ? 'নতুন ব্যক্তির নাম ও লেনদেন এন্ট্রি দিয়ে শুরু করতে নিচের বাটনে ক্লিক করুন।'
              : 'Add your first person to start tracking multiple cash debts and credits.'}
          </p>
          <button
            onClick={handleOpenAddPerson}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? '+ নতুন খাতা খুলুন' : '+ Open New Ledger'}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '1rem'
          }}
        >
          {filteredPeople.map((person) => {
            const stats = getPersonStats(person);
            const initials = person.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'DK';

            const recentTxs = (person.transactions || []).slice(0, 2);

            return (
              <div
                key={person.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Top Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: stats.isReceivable
                            ? 'rgba(16, 185, 129, 0.15)'
                            : stats.isPayable
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(100, 116, 139, 0.15)',
                          color: stats.isReceivable
                            ? '#10b981'
                            : stats.isPayable
                            ? '#f43f5e'
                            : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '1rem'
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {person.name}
                        </h4>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: 'var(--bg-main)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              fontWeight: '600'
                            }}
                          >
                            {person.relation || (isPersonal ? 'ব্যক্তিগত' : 'ব্যবসায়িক')}
                          </span>
                          {stats.hasOverdue && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(234, 179, 8, 0.15)',
                                color: '#ca8a04',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <AlertTriangle size={11} />
                              {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Overdue'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Edit/Delete Dropdown trigger */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleOpenEditPerson(person)}
                        title={lang === 'bn' ? 'তথ্য পরিবর্তন' : 'Edit Person'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px'
                        }}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person)}
                        title={lang === 'bn' ? 'সম্পূর্ণ খাতা মুছুন' : 'Delete Person'}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Phone & Address snippet */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {person.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} style={{ color: 'var(--primary)' }} />
                        <span>{person.phone}</span>
                      </div>
                    )}
                    {person.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {person.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Balance Display Banner */}
                  <div
                    style={{
                      background: stats.isReceivable
                        ? 'rgba(16, 185, 129, 0.08)'
                        : stats.isPayable
                        ? 'rgba(244, 63, 94, 0.08)'
                        : 'var(--bg-main)',
                      border: `1px solid ${
                        stats.isReceivable
                          ? 'rgba(16, 185, 129, 0.25)'
                          : stats.isPayable
                          ? 'rgba(244, 63, 94, 0.25)'
                          : 'var(--border-color)'
                      }`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {lang === 'bn' ? 'বর্তমান হিসাব স্থিতি:' : 'Current Balance:'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: stats.isReceivable
                            ? 'rgba(16, 185, 129, 0.2)'
                            : stats.isPayable
                            ? 'rgba(244, 63, 94, 0.2)'
                            : 'rgba(100, 116, 139, 0.2)',
                          color: stats.isReceivable
                            ? '#10b981'
                            : stats.isPayable
                            ? '#f43f5e'
                            : '#64748b'
                        }}
                      >
                        {stats.isReceivable
                          ? (lang === 'bn' ? 'আমি পাবো' : 'Receivable')
                          : stats.isPayable
                          ? (lang === 'bn' ? 'আমি দেবো' : 'Payable')
                          : (lang === 'bn' ? 'পরিশোধিত' : 'Settled')}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: '900',
                        color: stats.isReceivable
                          ? '#10b981'
                          : stats.isPayable
                          ? '#f43f5e'
                          : 'var(--text-main)',
                        marginTop: '4px'
                      }}
                    >
                      ৳{Math.abs(stats.netReceivable).toLocaleString('en-IN')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>{lang === 'bn' ? `মোট লেনদেন: ${stats.txCount}টি` : `${stats.txCount} txs`}</span>
                      {stats.nearestDueDate && (
                        <span>
                          {lang === 'bn' ? `ফেরত: ${stats.nearestDueDate}` : `Due: ${stats.nearestDueDate}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recent Transactions snippet */}
                  {recentTxs.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>
                        {lang === 'bn' ? 'সর্বশেষ এন্ট্রি:' : 'Recent Entry:'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {recentTxs.map((tx) => (
                          <div
                            key={tx.id}
                            style={{
                              fontSize: '0.78rem',
                              background: 'var(--bg-main)',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                              {tx.purpose || (tx.type === 'lend' ? 'টাকা দিলাম' : tx.type === 'repay_lend' ? 'ফেরত পেলাম' : tx.type === 'borrow' ? 'টাকা নিলাম' : 'শোধ')}
                            </span>
                            <span
                              style={{
                                fontWeight: '700',
                                color: tx.type === 'lend' ? '#10b981' : tx.type === 'repay_lend' ? '#059669' : '#f43f5e'
                              }}
                            >
                              ৳{Number(tx.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Quick Action Buttons */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {/* Add Transaction */}
                  <button
                    onClick={() => handleOpenAddTx(person)}
                    style={{
                      flex: '1 1 70px',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>{lang === 'bn' ? '+ লেনদেন' : '+ Tx'}</span>
                  </button>

                  {/* View Full Ledger */}
                  <button
                    onClick={() => setActivePersonForLedger(person)}
                    style={{
                      flex: '1 1 70px',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileText size={14} />
                    <span>{lang === 'bn' ? 'খতিয়ান' : 'Ledger'}</span>
                  </button>

                  {/* WhatsApp Reminder (if receivable & phone exists) */}
                  {person.phone && stats.isReceivable && (
                    <button
                      onClick={() => sendWhatsAppReminder(person)}
                      title={lang === 'bn' ? 'হোয়াটসঅ্যাপে তাগাদা মেসেজ পাঠান' : 'Send WhatsApp Reminder'}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'rgba(37, 211, 102, 0.12)',
                        color: '#25D366',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MessageCircle size={15} />
                    </button>
                  )}

                  {/* Print Slip */}
                  <button
                    onClick={() => handlePrintStatement(person)}
                    title={lang === 'bn' ? 'খতিয়ান প্রিন্ট করুন' : 'Print Statement'}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-main)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Printer size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT PERSON MODAL                         */}
      {/* ======================================================== */}
      {showAddPersonModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '560px',
              width: '95%',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: 'var(--primary)' }} />
                <span>
                  {editingPerson
                    ? (lang === 'bn' ? 'ব্যক্তির তথ্য পরিবর্তন' : 'Edit Person Details')
                    : (lang === 'bn' ? 'নতুন ব্যক্তির দেনা-পাওনা খাতা খুলুন' : 'Open New Person Ledger')}
                </span>
              </h3>
              <button
                onClick={() => setShowAddPersonModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <SmartVoiceFormBanner
              mode="debt"
              extraData={{ debtList }}
              onParsed={(result) => {
                setPersonForm((prev) => ({
                  ...prev,
                  name: result.personName || prev.name,
                  initialAmount: result.amount ? String(result.amount) : prev.initialAmount,
                  initialType: (result.type === 'borrow' || result.type === 'repay_borrow') ? 'borrow' : 'lend',
                  initialNote: result.note || prev.initialNote
                }));
              }}
            />

            <form onSubmit={handleSubmitPerson} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Person Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'ব্যক্তির নাম *' : 'Person Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: আরিফুল ইসলাম' : 'e.g. John Doe'}
                  value={personForm.name}
                  onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Phone & Relation in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={personForm.phone}
                    onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                      {lang === 'bn' ? 'সম্পর্ক / ধরন (ক্যাটাগরি)' : 'Relation / Type'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      title={lang === 'bn' ? 'ক্যাটাগরি রিনেম, অ্যাড বা ডিলিট করুন' : 'Manage categories (add/rename/delete)'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 4px'
                      }}
                    >
                      ⚙️ {lang === 'bn' ? 'ম্যানেজ / রিনেম' : 'Manage'}
                    </button>
                  </div>
                  <select
                    value={personForm.relation}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowCategoryModal(true);
                      } else {
                        setPersonForm({ ...personForm, relation: e.target.value });
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {availableRelations.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: '700', color: 'var(--primary)' }}>
                      ➕ {lang === 'bn' ? 'নতুন ধরন যোগ বা রিনেম করুন...' : 'Add / Rename Type...'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'ঠিকানা / কর্মস্থল' : 'Address / Workplace'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: মিরপুর-১০, ঢাকা' : 'e.g. Mirpur-10, Dhaka'}
                  value={personForm.address}
                  onChange={(e) => setPersonForm({ ...personForm, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'অতিরিক্ত মন্তব্য বা পরিচিতি' : 'Notes'}
                </label>
                <textarea
                  rows="2"
                  placeholder={lang === 'bn' ? 'কোনো বিশেষ তথ্য থাকলে লিখুন...' : 'Add any extra context...'}
                  value={personForm.notes}
                  onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Initial Transaction Toggle (Only on creation) */}
              {!editingPerson && (
                <div
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px'
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={personForm.addInitialTx}
                      onChange={(e) => setPersonForm({ ...personForm, addInitialTx: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <span>{lang === 'bn' ? 'শুরুর লেনদেন এখনই যুক্ত করুন' : 'Add initial transaction now'}</span>
                  </label>

                  {personForm.addInitialTx && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Initial Type selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setPersonForm({ ...personForm, initialType: 'lend' })}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: personForm.initialType === 'lend' ? '2px solid #10b981' : '1px solid var(--border-color)',
                            background: personForm.initialType === 'lend' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                            color: personForm.initialType === 'lend' ? '#10b981' : 'var(--text-main)',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          📤 {lang === 'bn' ? 'টাকা দিলাম (পাওনা হব)' : 'I Lent Money'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonForm({ ...personForm, initialType: 'borrow' })}
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            border: personForm.initialType === 'borrow' ? '2px solid #f43f5e' : '1px solid var(--border-color)',
                            background: personForm.initialType === 'borrow' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-card)',
                            color: personForm.initialType === 'borrow' ? '#f43f5e' : 'var(--text-main)',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          🤝 {lang === 'bn' ? 'টাকা নিলাম (দেনা হব)' : 'I Borrowed Money'}
                        </button>
                      </div>

                      {/* Amount & Date */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            {lang === 'bn' ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}
                          </label>
                          <input
                            type="number"
                            placeholder="১০০০"
                            value={personForm.initialAmount}
                            onChange={(e) => setPersonForm({ ...personForm, initialAmount: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.9rem',
                              fontWeight: '700'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            {lang === 'bn' ? 'লেনদেনের তারিখ' : 'Date'}
                          </label>
                          <input
                            type="date"
                            value={personForm.initialDate}
                            onChange={(e) => setPersonForm({ ...personForm, initialDate: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </div>

                      {/* Purpose & Due Date */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            {lang === 'bn' ? 'টাকা নেওয়ার কারণ/উদ্দেশ্য' : 'Purpose / Reason'}
                          </label>
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'যেমন: জরুরি হাওলাত' : 'e.g. Medical emergency'}
                            value={personForm.initialPurpose}
                            onChange={(e) => setPersonForm({ ...personForm, initialPurpose: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            {lang === 'bn' ? 'ফেরত দেওয়ার তারিখ' : 'Promised Due Date'}
                          </label>
                          <input
                            type="date"
                            value={personForm.initialDueDate}
                            onChange={(e) => setPersonForm({ ...personForm, initialDueDate: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-card)',
                              color: 'var(--text-main)',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                          {lang === 'bn' ? 'টাকা প্রদানের মাধ্যম' : 'Payment Method'}
                        </label>
                        <select
                          value={personForm.initialMethod}
                          onChange={(e) => setPersonForm({ ...personForm, initialMethod: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem'
                          }}
                        >
                          <option value="cash">নগদ ক্যাশ (Cash)</option>
                          <option value="bkash">বিকাশ (bKash)</option>
                          <option value="nagad">নগদ (Nagad)</option>
                          <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {editingPerson
                    ? (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')
                    : (lang === 'bn' ? 'খাতা তৈরি করুন' : 'Create Ledger')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD TRANSACTION TO PERSON                       */}
      {/* ======================================================== */}
      {activePersonForTx && (
        <div className="modal-backdrop" style={{ zIndex: 1150 }}>
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '540px',
              width: '95%',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HandCoins size={20} style={{ color: 'var(--primary)' }} />
                  <span>{lang === 'bn' ? 'নতুন লেনদেন এন্ট্রি' : 'Record Transaction'}</span>
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
                  খাতা: {activePersonForTx.name} {activePersonForTx.phone ? `(${activePersonForTx.phone})` : ''}
                </div>
              </div>
              <button
                onClick={() => setActivePersonForTx(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <SmartVoiceFormBanner
              mode="debt"
              extraData={{ debtList }}
              onParsed={(result) => {
                setTxForm((prev) => ({
                  ...prev,
                  amount: result.amount ? String(result.amount) : prev.amount,
                  type: result.type || prev.type,
                  note: result.note || prev.note
                }));
              }}
            />

            <form onSubmit={handleSubmitTx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 4 Transaction Types Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'লেনদেনের ধরন নির্বাচন করুন *' : 'Select Transaction Type *'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Lend */}
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'lend' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: txForm.type === 'lend' ? '2px solid #10b981' : '1px solid var(--border-color)',
                      background: txForm.type === 'lend' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-main)',
                      color: txForm.type === 'lend' ? '#10b981' : 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem' }}>📤 টাকা দিলাম</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      (আমার পাওনা বাড়বে)
                    </div>
                  </button>

                  {/* Repay Lend */}
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'repay_lend' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: txForm.type === 'repay_lend' ? '2px solid #059669' : '1px solid var(--border-color)',
                      background: txForm.type === 'repay_lend' ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-main)',
                      color: txForm.type === 'repay_lend' ? '#059669' : 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem' }}>📥 ফেরত পেলাম</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      (আমার পাওনা কমবে)
                    </div>
                  </button>

                  {/* Borrow */}
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'borrow' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: txForm.type === 'borrow' ? '2px solid #f43f5e' : '1px solid var(--border-color)',
                      background: txForm.type === 'borrow' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-main)',
                      color: txForm.type === 'borrow' ? '#f43f5e' : 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem' }}>🤝 টাকা নিলাম</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      (আমার দেনা বাড়বে)
                    </div>
                  </button>

                  {/* Repay Borrow */}
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'repay_borrow' })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: txForm.type === 'repay_borrow' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      background: txForm.type === 'repay_borrow' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-main)',
                      color: txForm.type === 'repay_borrow' ? '#3b82f6' : 'var(--text-main)',
                      fontWeight: '700',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem' }}>💳 দেনা শোধ করলাম</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      (আমার দেনা কমবে)
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount (Big Bold Input) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                    ৳
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="১০০০"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '10px',
                      border: '2px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '1.25rem',
                      fontWeight: '800'
                    }}
                  />
                </div>
              </div>

              {/* Date & Due Date in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'লেনদেনের তারিখ *' : 'Transaction Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ফেরত দেওয়ার প্রতিশ্রুত তারিখ' : 'Promised Return Date'}
                  </label>
                  <input
                    type="date"
                    value={txForm.dueDate}
                    onChange={(e) => setTxForm({ ...txForm, dueDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              {/* Purpose / Reason with Quick Suggestion Badges */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'টাকা নেওয়ার/দেওয়ার কারণ বা উদ্দেশ্য' : 'Purpose / Reason'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: জরুরি চিকিৎসা, জমি বায়না, দোকানের মাল কেনা...' : 'e.g. Medical emergency, goods purchase'}
                  value={txForm.purpose}
                  onChange={(e) => setTxForm({ ...txForm, purpose: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem'
                  }}
                />
                {/* Suggestions */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {purposeSuggestions.slice(0, 5).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTxForm({ ...txForm, purpose: sug })}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method & Additional Note */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={txForm.method}
                    onChange={(e) => setTxForm({ ...txForm, method: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="cash">নগদ ক্যাশ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {lang === 'bn' ? 'অতিরিক্ত নোট' : 'Note'}
                    </label>
                    <VoiceInputButton
                      onResult={(text) => setTxForm((prev) => ({ ...prev, note: prev.note ? `${prev.note} ${text}` : text }))}
                      title={lang === 'bn' ? 'নোট মুখে বলুন' : 'Speak note'}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'কোনো নোট থাকলে লিখুন' : 'Optional note'}
                    value={txForm.note}
                    onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActivePersonForTx(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {lang === 'bn' ? 'এন্ট্রি সংরক্ষণ করুন' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: FULL PERSON LEDGER & STATEMENT MODAL            */}
      {/* ======================================================== */}
      {activePersonForLedger && (
        <div className="modal-backdrop" style={{ zIndex: 1200 }}>
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '820px',
              width: '95%',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              padding: '1.75rem',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {activePersonForLedger.name}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-main)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      fontWeight: '600'
                    }}
                  >
                    {activePersonForLedger.relation || 'ব্যক্তিগত'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {activePersonForLedger.phone && <span>📞 {activePersonForLedger.phone}</span>}
                  {activePersonForLedger.address && <span>📍 {activePersonForLedger.address}</span>}
                  <span>📅 খাতা শুরু: {activePersonForLedger.createdAt || '-'}</span>
                </div>
              </div>
              <button
                onClick={() => setActivePersonForLedger(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Ledger Balance Highlights Banner */}
            {(() => {
              const stats = getPersonStats(activePersonForLedger);
              return (
                <div
                  style={{
                    background: stats.isReceivable
                      ? 'rgba(16, 185, 129, 0.1)'
                      : stats.isPayable
                      ? 'rgba(244, 63, 94, 0.1)'
                      : 'var(--bg-main)',
                    border: `1.5px solid ${
                      stats.isReceivable
                        ? '#10b981'
                        : stats.isPayable
                        ? '#f43f5e'
                        : 'var(--border-color)'
                    }`,
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {lang === 'bn' ? 'বর্তমান নেট হিসাব স্থিতি' : 'Current Net Balance'}
                    </div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: '900',
                        color: stats.isReceivable ? '#10b981' : stats.isPayable ? '#f43f5e' : 'var(--text-main)',
                        marginTop: '2px'
                      }}
                    >
                      {stats.isReceivable
                        ? `আমি পাবো: ৳${stats.netReceivable.toLocaleString('en-IN')}`
                        : stats.isPayable
                        ? `আমি দেবো: ৳${Math.abs(stats.netReceivable).toLocaleString('en-IN')}`
                        : 'পরিশোধিত (৳০)'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>
                      <div>{lang === 'bn' ? 'মোট দিয়েছি/পাওনা:' : 'Total Lent:'}</div>
                      <strong style={{ color: '#10b981', fontSize: '1rem' }}>৳{stats.totalLent.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <div>{lang === 'bn' ? 'ফেরত পেয়েছি:' : 'Repaid to me:'}</div>
                      <strong style={{ color: '#059669', fontSize: '1rem' }}>৳{stats.totalRepayReceived.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <div>{lang === 'bn' ? 'মোট নিয়েছি/দেনা:' : 'Total Borrowed:'}</div>
                      <strong style={{ color: '#f43f5e', fontSize: '1rem' }}>৳{stats.totalBorrowed.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <div>{lang === 'bn' ? 'দেনা শোধ করেছি:' : 'Repaid by me:'}</div>
                      <strong style={{ color: '#3b82f6', fontSize: '1rem' }}>৳{stats.totalRepaidPaid.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Bar for Ledger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'লেনদেনের বিস্তারিত ইতিহাস' : 'Transaction History'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAddTx(activePersonForLedger)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Plus size={15} />
                  <span>{lang === 'bn' ? '+ লেনদেন যুক্ত করুন' : '+ Add Tx'}</span>
                </button>

                {activePersonForLedger.phone && (
                  <button
                    onClick={() => sendWhatsAppReminder(activePersonForLedger)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      color: '#25D366',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ তাগাদা' : 'WhatsApp'}</span>
                  </button>
                )}

                <button
                  onClick={() => handlePrintStatement(activePersonForLedger)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Printer size={15} />
                  <span>{lang === 'bn' ? 'প্রিন্ট স্লিপ' : 'Print Slip'}</span>
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            {(!activePersonForLedger.transactions || activePersonForLedger.transactions.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'এই ব্যক্তির নামে কোনো লেনদেন নেই।' : 'No transactions recorded yet.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '9px 12px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th style={{ padding: '9px 12px' }}>{lang === 'bn' ? 'ধরন' : 'Type'}</th>
                      <th style={{ padding: '9px 12px' }}>{lang === 'bn' ? 'কারণ ও বিবরণ' : 'Purpose & Details'}</th>
                      <th style={{ padding: '9px 12px' }}>{lang === 'bn' ? 'ফেরত তারিখ' : 'Due Date'}</th>
                      <th style={{ padding: '9px 12px' }}>{lang === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                      <th style={{ padding: '9px 12px', textAlign: 'right' }}>{lang === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)'}</th>
                      <th style={{ padding: '9px 12px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePersonForLedger.transactions.map((tx) => {
                      const typeLabel =
                        tx.type === 'lend'
                          ? (lang === 'bn' ? 'টাকা দিলাম' : 'Lent')
                          : tx.type === 'repay_lend'
                          ? (lang === 'bn' ? 'ফেরত পেলাম' : 'Repaid to me')
                          : tx.type === 'borrow'
                          ? (lang === 'bn' ? 'টাকা নিলাম' : 'Borrowed')
                          : (lang === 'bn' ? 'শোধ করলাম' : 'Repaid');

                      const isCredit = tx.type === 'lend' || tx.type === 'repay_borrow';
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isPastDue = tx.dueDate && tx.dueDate < todayStr && tx.type === 'lend';

                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{tx.date}</td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                background:
                                  tx.type === 'lend'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : tx.type === 'repay_lend'
                                    ? 'rgba(5, 150, 105, 0.15)'
                                    : tx.type === 'borrow'
                                    ? 'rgba(244, 63, 94, 0.15)'
                                    : 'rgba(59, 130, 246, 0.15)',
                                color:
                                  tx.type === 'lend'
                                    ? '#10b981'
                                    : tx.type === 'repay_lend'
                                    ? '#059669'
                                    : tx.type === 'borrow'
                                    ? '#f43f5e'
                                    : '#3b82f6'
                              }}
                            >
                              {typeLabel}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{tx.purpose || '-'}</div>
                            {tx.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.note}</div>}
                          </td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                            {tx.dueDate ? (
                              <span style={{ color: isPastDue ? '#f43f5e' : 'var(--text-main)', fontWeight: isPastDue ? '700' : '500' }}>
                                {tx.dueDate} {isPastDue && '⚠️'}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ padding: '9px 12px', textTransform: 'capitalize' }}>
                            {tx.method === 'cash' ? 'ক্যাশ' : tx.method === 'bkash' ? 'বিকাশ' : tx.method === 'nagad' ? 'নগদ' : tx.method}
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              textAlign: 'right',
                              fontWeight: '800',
                              fontSize: '0.95rem',
                              color: isCredit ? '#10b981' : '#f43f5e'
                            }}
                          >
                            ৳{Number(tx.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <button
                                onClick={() => handleOpenEditTx(activePersonForLedger.id, tx)}
                                title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '3px'
                                }}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(lang === 'bn' ? 'এই লেনদেনটি মুছে ফেলতে চান?' : 'Delete this transaction?')) {
                                    deleteDebtTransaction(targetProfileKey, activePersonForLedger.id, tx.id);
                                    // Local update
                                    setActivePersonForLedger({
                                      ...activePersonForLedger,
                                      transactions: activePersonForLedger.transactions.filter((t) => t.id !== tx.id)
                                    });
                                  }
                                }}
                                title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '3px'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: EDIT TRANSACTION MODAL                          */}
      {/* ======================================================== */}
      {editingTx && (
        <div className="modal-backdrop" style={{ zIndex: 1300 }}>
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '480px',
              width: '95%',
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'লেনদেন সম্পাদনা' : 'Edit Transaction'}
              </h3>
              <button
                onClick={() => setEditingTx(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditTx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}
                </label>
                <input
                  type="number"
                  required
                  value={editingTx.tx.amount}
                  onChange={(e) =>
                    setEditingTx({
                      ...editingTx,
                      tx: { ...editingTx.tx, amount: e.target.value }
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    fontWeight: '700'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  {lang === 'bn' ? 'কারণ / উদ্দেশ্য' : 'Purpose'}
                </label>
                <input
                  type="text"
                  value={editingTx.tx.purpose || ''}
                  onChange={(e) =>
                    setEditingTx({
                      ...editingTx,
                      tx: { ...editingTx.tx, purpose: e.target.value }
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={editingTx.tx.date}
                    onChange={(e) =>
                      setEditingTx({
                        ...editingTx,
                        tx: { ...editingTx.tx, date: e.target.value }
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                    {lang === 'bn' ? 'ফেরত তারিখ' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={editingTx.tx.dueDate || ''}
                    onChange={(e) =>
                      setEditingTx({
                        ...editingTx,
                        tx: { ...editingTx.tx, dueDate: e.target.value }
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'আপডেট' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL 5: CATEGORY MANAGER MODAL                          */}
      {/* ======================================================== */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        defaultGroup={relationGroupKey}
        onSelectCategory={(selected) => setPersonForm((prev) => ({ ...prev, relation: selected }))}
      />

      {/* ======================================================== */}
      {/* MODAL 6: DUE REMINDER MODAL (WHATSAPP & SMS)              */}
      {/* ======================================================== */}
      <DueReminderModal
        isOpen={Boolean(reminderTarget)}
        onClose={() => setReminderTarget(null)}
        customer={reminderTarget}
        businessSettings={businessSettings}
        lang={lang}
        showToast={showToast}
      />
    </div>
  );
};

export default DebtKhataManager;
