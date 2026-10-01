import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Monitor,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Store,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  History,
  AlertCircle,
  ExternalLink,
  Layers,
  Banknote,
  User,
  Key
} from 'lucide-react';

export const BranchCashControlCenter = ({ onOpenPOS }) => {
  const {
    branches,
    activeBranchId,
    activeCounterId,
    switchBranch,
    switchCounter,
    addBranch,
    updateBranch,
    deleteBranch,
    addCounter,
    updateCounter,
    deleteCounter,
    adjustCounterCash,
    cashMovements,
    counterClosings,
    salesHistory,
    t,
    lang,
    setActiveTab
  } = useApp();

  const { isOwner, user, staffAccounts, addStaffAccount, deleteStaffAccount } = useAuth();

  // Modals state
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddCounterModal, setShowAddCounterModal] = useState(false);
  const [showCashAdjustModal, setShowCashAdjustModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedBranchForCounter, setSelectedBranchForCounter] = useState(branches[0]?.id || 'br-main');

  // New Staff Form state
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    phone: '',
    role: 'cashier',
    branchId: branches[0]?.id || 'br-main',
    counterId: branches[0]?.counters?.[0]?.id || 'cnt-1',
    pin: '1234'
  });

  // Cash Adjustment Form state
  const [cashAdjustForm, setCashAdjustForm] = useState({
    branchId: activeBranchId || branches[0]?.id || 'br-main',
    counterId: activeCounterId || branches[0]?.counters?.[0]?.id || 'cnt-1',
    type: 'deposit', // 'deposit' | 'withdraw'
    amount: '',
    reason: '',
    customReason: ''
  });

  // New Branch Form state
  const [newBranchForm, setNewBranchForm] = useState({
    name: '',
    code: `BR-0${(branches?.length || 0) + 1}`,
    address: '',
    phone: '',
    initialCounterName: 'কাউন্টার ০১ (POS)',
    initialFloat: 1000
  });

  // New Counter Form state
  const [newCounterForm, setNewCounterForm] = useState({
    branchId: branches[0]?.id || 'br-main',
    name: '',
    code: 'POS-02',
    openingFloat: 1000
  });

  // Calculate live drawer cash for a given counter
  const getCounterLiveData = (counterId, baseFloat = 1000) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesHistory.filter(s => s.counterId === counterId && s.date.startsWith(today));
    const cashSales = todaySales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const digitalSales = todaySales
      .filter(s => s.paymentMethod !== 'cash' && s.paymentMethod !== 'due')
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const totalRevenue = todaySales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);

    // Sum manual cash movements today
    const todayMovements = (cashMovements || []).filter(m => m.counterId === counterId && m.date === today);
    const manualDeposits = todayMovements.filter(m => m.type === 'deposit').reduce((sum, m) => sum + Number(m.amount), 0);
    const manualWithdrawals = todayMovements.filter(m => m.type === 'withdraw').reduce((sum, m) => sum + Number(m.amount), 0);

    const currentCashInDrawer = (Number(baseFloat) || 0) + cashSales + manualDeposits - manualWithdrawals;

    return {
      cashSales,
      digitalSales,
      totalRevenue,
      transactionsCount: todaySales.length,
      currentCashInDrawer,
      manualDeposits,
      manualWithdrawals
    };
  };

  // Overall KPI sums across all branches and counters
  let grandTotalCashInDrawers = 0;
  let grandTotalTodaySales = 0;
  let totalCountersCount = 0;

  branches.forEach(br => {
    (br.counters || []).forEach(cnt => {
      totalCountersCount += 1;
      const data = getCounterLiveData(cnt.id, cnt.openingFloat);
      grandTotalCashInDrawers += data.currentCashInDrawer;
      grandTotalTodaySales += data.totalRevenue;
    });
  });

  // Handle cash adjustment submit
  const handleCashAdjustmentSubmit = (e) => {
    e.preventDefault();
    const amt = Number(cashAdjustForm.amount);
    if (!amt || amt <= 0) {
      alert(lang === 'bn' ? 'দয়া করে সঠিক টাকার পরিমাণ দিন।' : 'Please enter a valid amount.');
      return;
    }

    const finalReason = cashAdjustForm.customReason.trim() || cashAdjustForm.reason || (cashAdjustForm.type === 'deposit' ? 'ড্রয়ারে অতিরিক্ত ক্যাশ জমা' : 'ক্যাশ উত্তোলন');

    adjustCounterCash({
      branchId: cashAdjustForm.branchId,
      counterId: cashAdjustForm.counterId,
      type: cashAdjustForm.type,
      amount: amt,
      reason: finalReason,
      authorizedBy: user?.name || 'মালিক (Owner)'
    });

    setShowCashAdjustModal(false);
    setCashAdjustForm({
      ...cashAdjustForm,
      amount: '',
      reason: '',
      customReason: ''
    });
  };

  // Handle Add Branch submit
  const handleAddBranchSubmit = (e) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) {
      alert(lang === 'bn' ? 'শাখার নাম লিখুন।' : 'Please enter branch name.');
      return;
    }

    addBranch({
      name: newBranchForm.name.trim(),
      code: newBranchForm.code.trim(),
      address: newBranchForm.address.trim(),
      phone: newBranchForm.phone.trim(),
      counters: [
        {
          id: `cnt-${Date.now()}-1`,
          name: newBranchForm.initialCounterName.trim() || 'কাউন্টার ০১ (POS)',
          code: 'POS-01',
          openingFloat: Number(newBranchForm.initialFloat) || 1000
        }
      ]
    });

    setShowAddBranchModal(false);
    setNewBranchForm({
      name: '',
      code: `BR-0${(branches?.length || 0) + 2}`,
      address: '',
      phone: '',
      initialCounterName: 'কাউন্টার ০১ (POS)',
      initialFloat: 1000
    });
  };

  // Handle Add Counter submit
  const handleAddCounterSubmit = (e) => {
    e.preventDefault();
    if (!newCounterForm.name.trim()) {
      alert(lang === 'bn' ? 'কাউন্টারের নাম লিখুন।' : 'Please enter counter name.');
      return;
    }

    addCounter(newCounterForm.branchId, {
      name: newCounterForm.name.trim(),
      code: newCounterForm.code.trim() || `POS-0${Date.now().toString().slice(-2)}`,
      openingFloat: Number(newCounterForm.openingFloat) || 1000
    });

    setShowAddCounterModal(false);
    setNewCounterForm({
      branchId: branches[0]?.id || 'br-main',
      name: '',
      code: 'POS-02',
      openingFloat: 1000
    });
  };

  // Handle Add Staff Account submit
  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.phone.trim()) {
      alert(lang === 'bn' ? 'স্টাফের নাম এবং মোবাইল নম্বর আবশ্যক।' : 'Staff name and phone number required.');
      return;
    }

    addStaffAccount({
      name: newStaffForm.name.trim(),
      phone: newStaffForm.phone.trim(),
      role: newStaffForm.role,
      branchId: newStaffForm.branchId,
      counterId: newStaffForm.counterId,
      pin: newStaffForm.pin.trim() || '1234'
    });

    setShowAddStaffModal(false);
    setNewStaffForm({
      name: '',
      phone: '',
      role: 'cashier',
      branchId: branches[0]?.id || 'br-main',
      counterId: branches[0]?.counters?.[0]?.id || 'cnt-1',
      pin: '1234'
    });
  };

  // Fast pre-fill cash adjustment for specific counter
  const openCashAdjustForCounter = (branchId, counterId, defaultType = 'deposit') => {
    setCashAdjustForm({
      branchId,
      counterId,
      type: defaultType,
      amount: '',
      reason: defaultType === 'deposit' ? 'প্রারম্ভিক ক্যাশ ফ্লোট / চেঞ্জ' : 'মালিকের ব্যক্তিগত উত্তোলন / ব্যাংক জমা',
      customReason: ''
    });
    setShowCashAdjustModal(true);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1380px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              👑
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '900', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{lang === 'bn' ? 'মালিকের সেন্ট্রাল ক্যাশ ও মাল্টি-ব্রাঞ্চ কন্ট্রোল হাব' : 'Owner Central Cash & Branch Control Hub'}</span>
                <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.72rem', padding: '3px 8px' }}>
                  {lang === 'bn' ? 'মালিক এক্সক্লুসিভ' : 'Owner Only'}
                </span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
                {lang === 'bn'
                  ? 'সব শাখা ও কাউন্টারের ক্যাশ সরাসরি নিয়ন্ত্রণ, টাকা জমা/উত্তোলন, নতুন দোকান বা কাউন্টার সেটআপ'
                  : 'Directly manage cash balances, add new branches, configure POS counters and audit cash flow'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setCashAdjustForm({
                branchId: activeBranchId || branches[0]?.id,
                counterId: activeCounterId || branches[0]?.counters?.[0]?.id,
                type: 'deposit',
                amount: '',
                reason: 'প্রারম্ভিক ক্যাশ ফ্লোট / ড্রয়ারে টাকা জমা',
                customReason: ''
              });
              setShowCashAdjustModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderColor: '#10b981',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              fontSize: '0.88rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Banknote size={18} />
            <span>{lang === 'bn' ? '💵 সরাসরি ক্যাশ ইন / ক্যাশ আউট' : '💵 Direct Cash In / Out'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAddBranchModal(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.88rem'
            }}
          >
            <Building2 size={16} />
            <span>{lang === 'bn' ? '+ নতুন শাখা যোগ করুন' : '+ Add New Branch'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSelectedBranchForCounter(branches[0]?.id);
              setNewCounterForm(prev => ({ ...prev, branchId: branches[0]?.id }));
              setShowAddCounterModal(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.88rem'
            }}
          >
            <Monitor size={16} />
            <span>{lang === 'bn' ? '+ নতুন কাউন্টার যোগ করুন' : '+ Add Counter'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAddStaffModal(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.88rem'
            }}
          >
            <User size={16} />
            <span>{lang === 'bn' ? '+ নতুন ক্যাশিয়ার / স্টাফ আইডি' : '+ Add Cashier / Staff'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Drawer Cash Across All Locations */}
        <div className="glass-card stat-card glow-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Banknote size={26} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'সব কাউন্টারে মোট ক্যাশ টাকা' : 'Total Drawer Cash (All Stores)'}
            </h3>
            <p className="stat-value" style={{ color: '#10b981', fontSize: '1.75rem', fontWeight: '900' }}>
              ৳{grandTotalCashInDrawers.toLocaleString()}
            </p>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {branches.length} {lang === 'bn' ? 'টি শাখায়' : 'branches'} • {totalCountersCount} {lang === 'bn' ? 'টি ক্যাশ ড্রয়ারে বর্তমান ক্যাশ' : 'counters'}
            </span>
          </div>
        </div>

        {/* Today's Sales Across All Locations */}
        <div className="glass-card stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <TrendingUp size={26} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'আজকের মোট বিক্রয় (সব শাখা)' : "Today's Gross Sales (All)"}
            </h3>
            <p className="stat-value" style={{ color: '#6366f1', fontSize: '1.75rem', fontWeight: '900' }}>
              ৳{grandTotalTodaySales.toLocaleString()}
            </p>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'নগদ + ডিজিটাল পেমেন্ট সহ' : 'Cash + Digital transactions'}
            </span>
          </div>
        </div>

        {/* Total Branches */}
        <div className="glass-card stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Store size={26} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'সক্রিয় শাখা / ব্রাঞ্চ' : 'Active Branches'}
            </h3>
            <p className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '900' }}>
              {branches.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'টি' : ''}</span>
            </p>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'প্রধান ও সাব-ব্রাঞ্চ অন্তর্ভুক্ত' : 'Centralized master catalog'}
            </span>
          </div>
        </div>

        {/* Total Counters */}
        <div className="glass-card stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Monitor size={26} />
          </div>
          <div className="stat-info">
            <h3 style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'মোট পিওএস ক্যাশ কাউন্টার' : 'Total POS Counters'}
            </h3>
            <p className="stat-value" style={{ fontSize: '1.75rem', fontWeight: '900' }}>
              {totalCountersCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'টি' : ''}</span>
            </p>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'প্রতিটিতে আলাদা ক্যাশ ড্রয়ার' : 'Dedicated cash drawers'}
            </span>
          </div>
        </div>
      </div>

      {/* Branches & Counters Detailed Control Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'শাখা ও কাউন্টারভিত্তিক ক্যাশ ড্রয়ার লাইভ স্ট্যাটাস' : 'Live Branch & Counter Cash Drawers'}</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'যেকোনো কাউন্টারে ১-ক্লিকে টাকা জমা দিন, টাকা তুলুন বা পিওএস সেলস স্ক্রিনে চলে যান' : 'Deposit, withdraw, or open POS billing for any counter'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
          {branches.map(branch => {
            const isCurrentBranch = activeBranchId === branch.id;
            let branchTotalCash = 0;
            let branchTodaySales = 0;

            (branch.counters || []).forEach(cnt => {
              const dt = getCounterLiveData(cnt.id, cnt.openingFloat);
              branchTotalCash += dt.currentCashInDrawer;
              branchTodaySales += dt.totalRevenue;
            });

            return (
              <div
                key={branch.id}
                className="glass-card"
                style={{
                  borderRadius: '14px',
                  border: isCurrentBranch ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                {/* Branch Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏢</span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {branch.name}
                      </h4>
                      {branch.isMain && (
                        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', fontSize: '0.68rem', fontWeight: '800' }}>
                          {lang === 'bn' ? 'প্রধান শাখা' : 'Main Branch'}
                        </span>
                      )}
                      {isCurrentBranch && (
                        <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', fontWeight: '700' }}>
                          {lang === 'bn' ? 'সক্রিয়' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span><MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />{branch.address || (lang === 'bn' ? 'ঠিকানা দেওয়া হয়নি' : 'No address')}</span>
                      <span>•</span>
                      <span><Phone size={12} style={{ display: 'inline', marginRight: '3px' }} />{branch.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'শাখার মোট ক্যাশ' : 'Branch Cash'}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981' }}>
                      ৳{branchTotalCash.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Counters inside this branch */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(branch.counters || []).map(counter => {
                    const counterData = getCounterLiveData(counter.id, counter.openingFloat);
                    const isCounterActive = isCurrentBranch && activeCounterId === counter.id;

                    return (
                      <div
                        key={counter.id}
                        style={{
                          background: isCounterActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                          border: isCounterActive ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '12px 14px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Monitor size={16} style={{ color: '#10b981' }} />
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              {counter.name}
                            </strong>
                            <span className="badge" style={{ fontSize: '0.68rem', fontFamily: 'monospace', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                              {counter.code}
                            </span>
                            {isCounterActive && (
                              <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                                LIVE
                              </span>
                            )}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ড্রয়ারে নগদ ক্যাশ:' : 'Cash in Drawer:'}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>
                              ৳{counterData.currentCashInDrawer.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Breakdown info pill */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-primary)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            marginBottom: '10px'
                          }}
                        >
                          <span>{lang === 'bn' ? 'ওপেনিং ফ্লোট:' : 'Float:'} ৳{(Number(counter.openingFloat) || 0).toLocaleString()}</span>
                          <span>{lang === 'bn' ? 'আজকের নগদ সেল:' : 'Cash Sales:'} +৳{counterData.cashSales.toLocaleString()}</span>
                          <span>{lang === 'bn' ? 'মোট লেনদেন:' : 'Transactions:'} {counterData.transactionsCount} {lang === 'bn' ? 'টি' : ''}</span>
                        </div>

                        {/* Quick Control Actions for Counter */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => openCashAdjustForCounter(branch.id, counter.id, 'deposit')}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              color: '#10b981',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <ArrowDownRight size={14} />
                            <span>{lang === 'bn' ? '+ টাকা জমা' : '+ Cash In'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => openCashAdjustForCounter(branch.id, counter.id, 'withdraw')}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              color: '#ef4444',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <ArrowUpRight size={14} />
                            <span>{lang === 'bn' ? '- টাকা তুলুন' : '- Cash Out'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              switchBranch(branch.id);
                              switchCounter(counter.id);
                              if (onOpenPOS) onOpenPOS();
                              else setActiveTab('pos');
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>{lang === 'bn' ? 'বিলিং কাউন্টার →' : 'Open POS →'}</span>
                          </button>

                          {/* Delete Counter if more than 1 */}
                          {(branch.counters || []).length > 1 && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                if (window.confirm(lang === 'bn' ? `আপনি কি নিশ্চিত '${counter.name}' কাউন্টারটি মুছে ফেলতে চান?` : `Delete counter '${counter.name}'?`)) {
                                  deleteCounter(branch.id, counter.id);
                                }
                              }}
                              title={lang === 'bn' ? 'কাউন্টার মুছে ফেলুন' : 'Delete Counter'}
                              style={{ padding: '6px 8px', color: 'var(--text-muted)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Branch Bottom Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranchForCounter(branch.id);
                      setNewCounterForm(prev => ({ ...prev, branchId: branch.id }));
                      setShowAddCounterModal(true);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--business-primary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <PlusCircle size={14} />
                    <span>{lang === 'bn' ? `+ এই শাখায় নতুন কাউন্টার যোগ করুন` : `+ Add Counter to ${branch.name}`}</span>
                  </button>

                  {!branch.isMain && branches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(lang === 'bn' ? `আপনি কি নিশ্চিত সম্পূর্ণ '${branch.name}' শাখাটি মুছে ফেলতে চান?` : `Delete branch '${branch.name}'?`)) {
                          deleteBranch(branch.id);
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      {lang === 'bn' ? 'শাখা মুছুন' : 'Delete Branch'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cash Movement Audit Trail Table */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'মালিকের ক্যাশ মুভমেন্ট ও অডিট ট্রেইল' : 'Cash Movement Audit Trail'}</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'কোন কাউন্টারে কখন কত টাকা জমা বা উত্তোলন করা হয়েছে তার রিয়েল-টাইম হিস্ট্রি' : 'Log of cash deposits, withdrawals, and floats'}
            </p>
          </div>
          <span className="badge badge-info">
            {(cashMovements || []).length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
          </span>
        </div>

        {(!cashMovements || cashMovements.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {lang === 'bn'
              ? 'এখনও কোনো ম্যানুয়াল ক্যাশ ইন বা ক্যাশ আউট করা হয়নি। উপরের "সরাসরি ক্যাশ ইন / ক্যাশ আউট" বাটনে চাপ দিয়ে যেকোনো কাউন্টারে টাকা যোগ বা উত্তোলন করতে পারেন।'
              : 'No cash movements recorded yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>{lang === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                  <th>{lang === 'bn' ? 'শাখা' : 'Branch'}</th>
                  <th>{lang === 'bn' ? 'কাউন্টার' : 'Counter'}</th>
                  <th>{lang === 'bn' ? 'ধরনের' : 'Type'}</th>
                  <th>{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                  <th>{lang === 'bn' ? 'কারণ / বিবরণ' : 'Reason / Note'}</th>
                  <th>{lang === 'bn' ? 'অনুমোদনকারী' : 'Authorized By'}</th>
                </tr>
              </thead>
              <tbody>
                {cashMovements.slice(0, 15).map(m => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '600' }}>{m.date}</span> <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.time}</span>
                    </td>
                    <td>{m.branchName}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {m.counterName}
                      </span>
                    </td>
                    <td>
                      {m.type === 'deposit' ? (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowDownRight size={12} /> {lang === 'bn' ? 'ক্যাশ ইন (জমা)' : 'Deposit'}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUpRight size={12} /> {lang === 'bn' ? 'ক্যাশ আউট (উত্তোলন)' : 'Withdraw'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: '800', color: m.type === 'deposit' ? '#10b981' : '#ef4444' }}>
                      {m.type === 'deposit' ? '+' : '-'}৳{Number(m.amount).toLocaleString()}
                    </td>
                    <td>{m.reason}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.authorizedBy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SECTION: STAFF & CASHIER ACCOUNTS MANAGEMENT */}
      {/* ========================================================= */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'দোকানের ক্যাশিয়ার ও স্টাফ লগইন একাউন্ট' : 'Staff & Cashier Accounts'}</span>
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'মালিক কর্তৃক তৈরি করা ক্যাশিয়ার, সেলসম্যান ও এসআর কর্মচারীদের লগইন আইডি ও গোপন পিন তালিকা' : 'Manage cashier login PINs and branch assignments'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddStaffModal(true)}
            style={{ fontSize: '0.82rem', padding: '6px 14px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <User size={14} />
            <span>{lang === 'bn' ? '+ নতুন ক্যাশিয়ার / স্টাফ যোগ করুন' : '+ Add Staff Account'}</span>
          </button>
        </div>

        {(!staffAccounts || staffAccounts.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {lang === 'bn' ? 'কোনো স্টাফ একাউন্ট তৈরি করা নেই।' : 'No staff accounts created yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>{lang === 'bn' ? 'কর্মচারীর নাম' : 'Staff Name'}</th>
                  <th>{lang === 'bn' ? 'রোল' : 'Role'}</th>
                  <th>{lang === 'bn' ? 'শাখা ও কাউন্টার' : 'Assigned Branch & Counter'}</th>
                  <th>{lang === 'bn' ? 'মোবাইল নম্বর / আইডি' : 'Phone / ID'}</th>
                  <th>{lang === 'bn' ? 'লগইন পিন (PIN)' : 'Login PIN'}</th>
                  <th>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {staffAccounts.map(stf => {
                  const br = branches.find(b => b.id === stf.branchId);
                  const cnt = br?.counters?.find(c => c.id === stf.counterId);
                  return (
                    <tr key={stf.id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        {stf.name}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.72rem',
                            background: stf.role === 'cashier' ? 'rgba(16, 185, 129, 0.15)' : (stf.role === 'salesman' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                            color: stf.role === 'cashier' ? '#10b981' : (stf.role === 'salesman' ? '#f59e0b' : '#3b82f6'),
                            border: `1px solid ${stf.role === 'cashier' ? '#10b981' : (stf.role === 'salesman' ? '#f59e0b' : '#3b82f6')}`,
                            fontWeight: '700'
                          }}
                        >
                          {stf.role === 'cashier' ? '🟢 ক্যাশিয়ার' : (stf.role === 'salesman' ? '🟡 সেলসম্যান' : '🔵 এসআর')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem' }}>
                          🏢 {br?.name || 'প্রধান শাখা'} ➔ 🖥️ {cnt?.name || 'কাউন্টার ০১'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                        {stf.phone || stf.email}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: '800' }}>
                          🔑 {stf.pin || '1234'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            if (window.confirm(lang === 'bn' ? `আপনি কি নিশ্চিত '${stf.name}' এর একাউন্ট মুছে ফেলতে চান?` : `Delete account '${stf.name}'?`)) {
                              deleteStaffAccount(stf.id);
                            }
                          }}
                          style={{ padding: '4px 8px', color: '#ef4444' }}
                          title={lang === 'bn' ? 'একাউন্ট মুছে ফেলুন' : 'Delete Account'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: DIRECT CASH ADJUSTMENT (DEPOSIT / WITHDRAW) */}
      {/* ========================================================= */}
      {showCashAdjustModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Banknote size={20} style={{ color: cashAdjustForm.type === 'deposit' ? '#10b981' : '#ef4444' }} />
                <span>
                  {cashAdjustForm.type === 'deposit'
                    ? (lang === 'bn' ? 'ক্যাশ ইন (ড্রয়ারে টাকা জমা)' : 'Cash In / Deposit')
                    : (lang === 'bn' ? 'ক্যাশ আউট (ড্রয়ার থেকে উত্তোলন)' : 'Cash Out / Withdraw')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCashAdjustModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCashAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Type Switcher Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCashAdjustForm({ ...cashAdjustForm, type: 'deposit' })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: cashAdjustForm.type === 'deposit' ? '#10b981' : 'transparent',
                    color: cashAdjustForm.type === 'deposit' ? '#fff' : 'var(--text-muted)',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowDownRight size={16} />
                  <span>{lang === 'bn' ? 'টাকা জমা (Cash In)' : 'Cash In'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCashAdjustForm({ ...cashAdjustForm, type: 'withdraw' })}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: cashAdjustForm.type === 'withdraw' ? '#ef4444' : 'transparent',
                    color: cashAdjustForm.type === 'withdraw' ? '#fff' : 'var(--text-muted)',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowUpRight size={16} />
                  <span>{lang === 'bn' ? 'টাকা উত্তোলন (Cash Out)' : 'Cash Out'}</span>
                </button>
              </div>

              {/* Branch Selector */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'শাখা নির্বাচন করুন:' : 'Select Branch:'}
                </label>
                <select
                  className="input-field"
                  value={cashAdjustForm.branchId}
                  onChange={(e) => {
                    const br = branches.find(b => b.id === e.target.value);
                    setCashAdjustForm({
                      ...cashAdjustForm,
                      branchId: e.target.value,
                      counterId: br?.counters?.[0]?.id || ''
                    });
                  }}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Counter Selector */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কাউন্টার নির্বাচন করুন:' : 'Select Counter:'}
                </label>
                <select
                  className="input-field"
                  value={cashAdjustForm.counterId}
                  onChange={(e) => setCashAdjustForm({ ...cashAdjustForm, counterId: e.target.value })}
                >
                  {(branches.find(b => b.id === cashAdjustForm.branchId)?.counters || []).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'টাকার পরিমাণ (৳):' : 'Amount (৳):'} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="0.00"
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: '800', color: cashAdjustForm.type === 'deposit' ? '#10b981' : '#ef4444' }}
                  value={cashAdjustForm.amount}
                  onChange={(e) => setCashAdjustForm({ ...cashAdjustForm, amount: e.target.value })}
                />

                {/* Quick Amount Suggestion Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[500, 1000, 2000, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCashAdjustForm({ ...cashAdjustForm, amount: val })}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-main)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      +৳{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Note Preset */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কারণ / বিবরণ:' : 'Reason / Purpose:'}
                </label>
                <select
                  className="input-field"
                  value={cashAdjustForm.reason}
                  onChange={(e) => setCashAdjustForm({ ...cashAdjustForm, reason: e.target.value })}
                  style={{ marginBottom: '6px' }}
                >
                  {cashAdjustForm.type === 'deposit' ? (
                    <>
                      <option value="প্রারম্ভিক ক্যাশ ফ্লোট / সকালের ওপেনিং ক্যাশ">প্রারম্ভিক ক্যাশ ফ্লোট / সকালের ওপেনিং ক্যাশ</option>
                      <option value="খুচরা টাকা / চেঞ্জের ঘাটতি পূরণ">খুচরা টাকা / চেঞ্জের ঘাটতি পূরণ</option>
                      <option value="মালিক কর্তৃক অতিরিক্ত মূলধন জমা">মালিক কর্তৃক অতিরিক্ত মূলধন জমা</option>
                      <option value="অন্যান্য জমা">অন্যান্য জমা</option>
                    </>
                  ) : (
                    <>
                      <option value="মালিকের ব্যক্তিগত উত্তোলন (Owner Draw)">মালিকের ব্যক্তিগত উত্তোলন (Owner Draw)</option>
                      <option value="ব্যাংক অ্যাকাউন্টে ক্যাশ ডিপোজিট">ব্যাংক অ্যাকাউন্টে ক্যাশ ডিপোজিট</option>
                      <option value="সাপ্লায়ার / মহাজনের জরুরি ক্যাশ পেমেন্ট">সাপ্লায়ার / মহাজনের জরুরি ক্যাশ পেমেন্ট</option>
                      <option value="দোকানের ছোটখাটো জরুরি খরচ (Petty Cash)">দোকানের ছোটখাটো জরুরি খরচ (Petty Cash)</option>
                      <option value="অন্যান্য উত্তোলন">অন্যান্য উত্তোলন</option>
                    </>
                  )}
                </select>

                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'অথবা নিজের মন্তব্য লিখুন (ঐচ্ছিক)...' : 'Or enter custom note (optional)...'}
                  value={cashAdjustForm.customReason}
                  onChange={(e) => setCashAdjustForm({ ...cashAdjustForm, customReason: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCashAdjustModal(false)}
                  style={{ flex: 1 }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1.5,
                    background: cashAdjustForm.type === 'deposit' ? '#10b981' : '#ef4444',
                    borderColor: cashAdjustForm.type === 'deposit' ? '#10b981' : '#ef4444',
                    fontWeight: '800'
                  }}
                >
                  {cashAdjustForm.type === 'deposit'
                    ? (lang === 'bn' ? 'টাকা জমা নিশ্চিত করুন' : 'Confirm Cash In')
                    : (lang === 'bn' ? 'উত্তোলন নিশ্চিত করুন' : 'Confirm Cash Out')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD NEW BRANCH */}
      {/* ========================================================= */}
      {showAddBranchModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: '500px', width: '90%', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Building2 size={20} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'নতুন শাখা (Branch) যোগ করুন' : 'Add New Branch'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBranchModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'শাখার নাম *' : 'Branch Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: উত্তরা শাখা / ধানমন্ডি ব্রাঞ্চ' : 'e.g. Uttara Branch'}
                  className="input-field"
                  value={newBranchForm.name}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'শাখা কোড' : 'Branch Code'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newBranchForm.code}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, code: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="০১৭০০-০০০০০০"
                    className="input-field"
                    value={newBranchForm.phone}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'ঠিকানা / লোকেশন' : 'Address'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: সেক্টর ৩, উত্তরা, ঢাকা' : 'e.g. Sector 3, Uttara, Dhaka'}
                  className="input-field"
                  value={newBranchForm.address}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                />
              </div>

              {/* Initial Counter Setup */}
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
                  {lang === 'bn' ? 'প্রথম ক্যাশ কাউন্টার সেটআপ:' : 'Initial Counter Setup:'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="কাউন্টারের নাম"
                    value={newBranchForm.initialCounterName}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, initialCounterName: e.target.value })}
                  />
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="প্রারম্ভিক ক্যাশ (৳)"
                    value={newBranchForm.initialFloat}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, initialFloat: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddBranchModal(false)}
                  style={{ flex: 1 }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, fontWeight: '800' }}
                >
                  {lang === 'bn' ? 'শাখা তৈরি করুন' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD NEW COUNTER */}
      {/* ========================================================= */}
      {showAddCounterModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: '460px', width: '90%', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Monitor size={20} style={{ color: '#10b981' }} />
                <span>{lang === 'bn' ? 'নতুন ক্যাশ কাউন্টার যোগ করুন' : 'Add New Cash Counter'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCounterModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCounterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কোন শাখার অধীনে যুক্ত হবে?' : 'Assign to Branch:'}
                </label>
                <select
                  className="input-field"
                  value={newCounterForm.branchId}
                  onChange={(e) => setNewCounterForm({ ...newCounterForm, branchId: e.target.value })}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কাউন্টারের নাম *' : 'Counter Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: কাউন্টার ০২ (এক্সপ্রেস বিলিং)' : 'e.g. Counter 02 (Express)'}
                  className="input-field"
                  value={newCounterForm.name}
                  onChange={(e) => setNewCounterForm({ ...newCounterForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'কাউন্টার কোড' : 'Counter Code'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={newCounterForm.code}
                    onChange={(e) => setNewCounterForm({ ...newCounterForm, code: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'প্রারম্ভিক ক্যাশ (৳)' : 'Opening Float (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={newCounterForm.openingFloat}
                    onChange={(e) => setNewCounterForm({ ...newCounterForm, openingFloat: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddCounterModal(false)}
                  style={{ flex: 1 }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, fontWeight: '800' }}
                >
                  {lang === 'bn' ? 'কাউন্টার তৈরি করুন' : 'Create Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD NEW STAFF / CASHIER ACCOUNT */}
      {/* ========================================================= */}
      {showAddStaffModal && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: '480px', width: '90%', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <User size={20} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'নতুন ক্যাশিয়ার / স্টাফ আইডি খুলুন' : 'Create Staff / Cashier Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'কর্মচারীর নাম *' : 'Staff Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: মো: আরিফুল ইসলাম' : 'e.g. Ariful Islam'}
                  className="input-field"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  {lang === 'bn' ? 'মোবাইল নম্বর (লগইন আইডি হিসেবে ব্যবহৃত হবে) *' : 'Phone Number (Used as Login ID) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="০১৭xxxxxxxx"
                  className="input-field"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'রোল / পদবী:' : 'Role:'}
                  </label>
                  <select
                    className="input-field"
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                  >
                    <option value="cashier">🟢 ক্যাশিয়ার (Cashier)</option>
                    <option value="salesman">🟡 সেলসম্যান (Salesman)</option>
                    <option value="sr">🔵 এসআর অফিসার (SR Field)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? '৪-সংখ্যার গোপন পিন (PIN):' : '4-Digit Login PIN:'} *
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    required
                    placeholder="1234"
                    className="input-field"
                    style={{ fontFamily: 'monospace', fontWeight: '800' }}
                    value={newStaffForm.pin}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'নির্ধারিত শাখা:' : 'Branch:'}
                  </label>
                  <select
                    className="input-field"
                    value={newStaffForm.branchId}
                    onChange={(e) => {
                      const br = branches.find(b => b.id === e.target.value);
                      setNewStaffForm({
                        ...newStaffForm,
                        branchId: e.target.value,
                        counterId: br?.counters?.[0]?.id || ''
                      });
                    }}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'নির্ধারিত কাউন্টার:' : 'Counter:'}
                  </label>
                  <select
                    className="input-field"
                    value={newStaffForm.counterId}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, counterId: e.target.value })}
                  >
                    {(branches.find(b => b.id === newStaffForm.branchId)?.counters || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStaffModal(false)}
                  style={{ flex: 1 }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, fontWeight: '800' }}
                >
                  {lang === 'bn' ? 'একাউন্ট তৈরি করুন' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
