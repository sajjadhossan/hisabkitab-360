import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Smartphone,
  Building2,
  CreditCard,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  Coins,
  TrendingDown,
  TrendingUp,
  Save,
  RotateCcw
} from 'lucide-react';
import {
  getPersonalWallets,
  savePersonalWallets,
  getWalletTransfers,
  recordWalletTransfer,
  computeLiveWalletBalances
} from '../../services/personalFinanceEngine';

export const PersonalMultiWalletModal = ({
  isOpen,
  onClose,
  incomes = [],
  expenses = [],
  lang = 'bn',
  showToast
}) => {
  const [wallets, setWallets] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [activeTab, setActiveTab] = useState('wallets'); // 'wallets' | 'transfer' | 'history'

  // Transfer Form State
  const [fromWallet, setFromWallet] = useState('bank');
  const [toWallet, setToWallet] = useState('bkash');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Edit Opening Balance State
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [editingBalance, setEditingBalance] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const initialWallets = getPersonalWallets();
    const initialTransfers = getWalletTransfers();
    setTransfers(initialTransfers);
    const computed = computeLiveWalletBalances(incomes, expenses, initialTransfers);
    setWallets(computed);
  }, [isOpen, incomes, expenses]);

  if (!isOpen) return null;

  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      if (showToast) showToast(lang === 'bn' ? 'সঠিক টাকার পরিমাণ লিখুন' : 'Enter a valid transfer amount', 'warning');
      return;
    }
    if (fromWallet === toWallet) {
      if (showToast) showToast(lang === 'bn' ? 'উৎস ও গন্তব্য ওয়ালেট একই হতে পারে না' : 'Source and destination wallet cannot be the same', 'warning');
      return;
    }

    const newTransfer = recordWalletTransfer({
      fromWalletId: fromWallet,
      toWalletId: toWallet,
      amount: amt,
      note: transferNote,
      date: new Date().toISOString()
    });

    const updatedTransfers = [newTransfer, ...transfers];
    setTransfers(updatedTransfers);
    const recomputed = computeLiveWalletBalances(incomes, expenses, updatedTransfers);
    setWallets(recomputed);

    setTransferAmount('');
    setTransferNote('');
    setActiveTab('wallets');

    if (showToast) {
      showToast(
        lang === 'bn'
          ? `✓ ৳${amt.toLocaleString()} টাকা ওয়ালেট ট্রান্সফার সম্পন্ন হয়েছে!`
          : `BDT ${amt.toLocaleString()} transferred successfully!`,
        'success'
      );
    }
  };

  const handleSaveOpeningBalance = (walletId) => {
    const val = Number(editingBalance);
    if (isNaN(val)) return;

    const baseWallets = getPersonalWallets().map((w) =>
      w.id === walletId ? { ...w, balance: val } : w
    );
    savePersonalWallets(baseWallets);
    const recomputed = computeLiveWalletBalances(incomes, expenses, transfers);
    setWallets(recomputed);
    setEditingWalletId(null);
    if (showToast) {
      showToast(lang === 'bn' ? 'ওয়ালেটের প্রারম্ভিক ব্যালেন্স সংরক্ষিত হয়েছে' : 'Opening balance saved', 'success');
    }
  };

  const totalLiquidCash = wallets.reduce((sum, w) => sum + (Number(w.currentBalance) || 0), 0);

  const getWalletIcon = (iconName) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone size={20} />;
      case 'Building2':
        return <Building2 size={20} />;
      case 'CreditCard':
        return <CreditCard size={20} />;
      default:
        return <Wallet size={20} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--card-bg, #0f172a)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
              <Wallet size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'মাল্টি-ওয়ালেট ক্যাশলেস ব্যালেন্স ও ট্রান্সফার হাব' : 'Multi-Wallet & Cashless Ledger'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'নগদ, বিকাশ, নগদ, ব্যাংক ও কার্ডের আলাদা লাইভ ব্যালেন্স ট্র্যাকিং' : 'Track live balances across Cash, bKash, Bank and Cards'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Total Liquid Pool Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {lang === 'bn' ? 'সর্বমোট তরল ক্যাশ ও ওয়ালেট ব্যালেন্স' : 'Total Combined Liquid Balance'}
            </span>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              ৳{Math.round(totalLiquidCash).toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary press-scale"
            onClick={() => setActiveTab('transfer')}
            style={{ fontSize: '0.82rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowRightLeft size={15} />
            <span>{lang === 'bn' ? 'ওয়ালেট ট্রান্সফার করুন' : 'Transfer Balance'}</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'wallets' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'wallets' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'ওয়ালেটসমূহ' : 'Wallets'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'transfer' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'transfer' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'টাকা ট্রান্সফার' : 'Transfer'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'history' ? '#10b981' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'bn' ? 'ট্রান্সফার হিস্ট্রি' : 'History'}
          </button>
        </div>

        {/* TAB 1: WALLET CARDS */}
        {activeTab === 'wallets' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {wallets.map((w) => (
              <div
                key={w.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: `${w.color || '#10b981'}25`, color: w.color || '#10b981', padding: '8px', borderRadius: '8px' }}>
                      {getWalletIcon(w.icon)}
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {w.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWalletId(w.id);
                      setEditingBalance(String(w.balance || 0));
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {lang === 'bn' ? 'প্রারম্ভিক ব্যালেন্স' : 'Edit Base'}
                  </button>
                </div>

                {editingWalletId === w.id ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input
                      type="number"
                      value={editingBalance}
                      onChange={(e) => setEditingBalance(e.target.value)}
                      placeholder="0"
                      style={{
                        flex: 1,
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSaveOpeningBalance(w.id)}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      <Save size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: w.currentBalance >= 0 ? w.color : '#ef4444', fontFamily: 'var(--font-mono)' }}>
                      ৳{Math.round(w.currentBalance || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {lang === 'bn' ? `প্রারম্ভিক: ৳${Number(w.balance || 0).toLocaleString()}` : `Base: BDT ${Number(w.balance || 0).toLocaleString()}`}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: TRANSFER FUNDS FORM */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {lang === 'bn' ? 'যে ওয়ালেট থেকে যাবে (From)' : 'From Wallet'}
                </label>
                <select
                  value={fromWallet}
                  onChange={(e) => setFromWallet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    fontWeight: '700'
                  }}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (৳{Math.round(w.currentBalance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  {lang === 'bn' ? 'যে ওয়ালেটে জমা হবে (To)' : 'To Wallet'}
                </label>
                <select
                  value={toWallet}
                  onChange={(e) => setToWallet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    fontWeight: '700'
                  }}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (৳{Math.round(w.currentBalance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'bn' ? 'ট্রান্সফারের পরিমাণ (টাকা)' : 'Transfer Amount (BDT)'}
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="যেমন: 5000"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'bn' ? 'বিবরণ বা কারণ (ঐচ্ছিক)' : 'Note / Reason (Optional)'}
              </label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ব্যাংক থেকে বিকাশে ক্যাশ-ইন / এটিএম থেকে টাকা তোলা' : 'e.g. Bank to bKash cash-in / ATM withdrawal'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('wallets')}
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: '800' }}
              >
                <ArrowRightLeft size={16} />
                <span>{lang === 'bn' ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Transfer'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: TRANSFER HISTORY */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {lang === 'bn' ? 'কোনো পূর্ববর্তী ট্রান্সফার রেকর্ড নেই।' : 'No wallet transfers recorded yet.'}
              </div>
            ) : (
              transfers.map((tr) => (
                <div
                  key={tr.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {wallets.find((w) => w.id === tr.fromWalletId)?.name || tr.fromWalletId} ➔{' '}
                      {wallets.find((w) => w.id === tr.toWalletId)?.name || tr.toWalletId}
                    </div>
                    {tr.note && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {tr.note}
                      </div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(tr.date).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    ৳{Number(tr.amount || 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalMultiWalletModal;

