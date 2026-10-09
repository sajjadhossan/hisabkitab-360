import React, { useState, useMemo, useEffect } from 'react';
import {
  Coins,
  X,
  Plus,
  Trash2,
  Check,
  Printer,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const STORAGE_KEY = 'hk360_zakat_data';

export const ZakatCalculatorModal = ({ isOpen, onClose }) => {
  const { lang = 'bn' } = useApp();

  // Inputs
  const [silverPricePerTola, setSilverPricePerTola] = useState(2200); // ৳ per tola / bhori
  const [goldWeightBhori, setGoldWeightBhori] = useState('');
  const [goldPricePerBhori, setGoldPricePerBhori] = useState(125000); // ৳ per bhori
  const [silverWeightBhori, setSilverWeightBhori] = useState('');

  const [cashInHand, setCashInHand] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [businessStock, setBusinessStock] = useState('');
  const [receivables, setReceivables] = useState('');
  const [investments, setInvestments] = useState('');

  // Deductions
  const [immediateDebts, setImmediateDebts] = useState('');
  const [unpaidBills, setUnpaidBills] = useState('');

  // Distribution Log
  const [distributions, setDistributions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).distributions || [];
    } catch (e) { }
    return [];
  });

  const [distRecipient, setDistRecipient] = useState('');
  const [distAmount, setDistAmount] = useState('');
  const [distNote, setDistNote] = useState('');

  // Nisab threshold based on 52.5 tola silver
  const nisabThreshold = useMemo(() => {
    return 52.5 * (Number(silverPricePerTola) || 2200);
  }, [silverPricePerTola]);

  // Asset Totals
  const goldTotal = useMemo(() => (Number(goldWeightBhori) || 0) * (Number(goldPricePerBhori) || 0), [goldWeightBhori, goldPricePerBhori]);
  const silverTotal = useMemo(() => (Number(silverWeightBhori) || 0) * (Number(silverPricePerTola) || 0), [silverWeightBhori, silverPricePerTola]);
  const liquidCashTotal = useMemo(() => (Number(cashInHand) || 0) + (Number(bankBalance) || 0), [cashInHand, bankBalance]);
  const businessTotal = useMemo(() => (Number(businessStock) || 0) + (Number(receivables) || 0), [businessStock, receivables]);
  const otherInvestmentsTotal = useMemo(() => Number(investments) || 0, [investments]);

  const totalGrossAssets = goldTotal + silverTotal + liquidCashTotal + businessTotal + otherInvestmentsTotal;

  // Deductions
  const totalDeductions = (Number(immediateDebts) || 0) + (Number(unpaidBills) || 0);

  // Net Zakatable Wealth
  const netZakatableWealth = Math.max(0, totalGrossAssets - totalDeductions);

  // Is Eligible
  const isEligible = netZakatableWealth >= nisabThreshold;

  // Zakat 2.5%
  const zakatDue = isEligible ? Math.round(netZakatableWealth * 0.025) : 0;

  // Total Distributed
  const totalDistributed = useMemo(() => {
    return distributions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [distributions]);

  const remainingZakatToPay = Math.max(0, zakatDue - totalDistributed);

  // Save distributions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ distributions }));
    } catch (e) { }
  }, [distributions]);

  if (!isOpen) return null;

  const handleAddDistribution = (e) => {
    e.preventDefault();
    if (!distRecipient || !distAmount) return;

    const amt = Number(distAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newItem = {
      id: `zdist-${Date.now()}`,
      recipient: distRecipient,
      amount: amt,
      note: distNote,
      date: new Date().toISOString().split('T')[0]
    };

    setDistributions(prev => [newItem, ...prev]);
    setDistRecipient('');
    setDistAmount('');
    setDistNote('');
  };

  const handleDeleteDistribution = (id) => {
    setDistributions(prev => prev.filter(d => d.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--header-bg, rgba(255,255,255,0.03))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Coins size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'যাকাত ও সদকা ক্যালকুলেটর (Zakat Calculator)' : 'Zakat & Sadaqah Calculator'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'ইসলামী শরিয়াহ নির্দেশিত নিসাব ও ২.৫% যাকাত হিসাব এবং বিতরণ খাতা' : 'Nisab evaluation, 2.5% Zakat calculation & distribution tracker'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="রিপোর্ট প্রিন্ট করুন"
            >
              <Printer size={15} /> প্রিন্ট
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Nisab Benchmark Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> বর্তমান নিসাবের পরিমাণ (রৌপ্য মানদণ্ড: ৫২.৫ তোলা রূপা)
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                ৳{Math.round(nisabThreshold).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                সম্পদ এই পরিমাণের সমতুল্য বা বেশি হলে এবং পূর্ণ ১ বছর থাকলে ২.৫% যাকাত প্রযোজ্য।
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>রূপার ভরি দর (৳):</span>
              <input
                type="number"
                className="form-control"
                value={silverPricePerTola}
                onChange={e => setSilverPricePerTola(e.target.value)}
                style={{ width: '110px', height: '34px', fontSize: '0.85rem' }}
                title="প্রতি ভরি রূপার বর্তমান বাজার দর পরিবর্তন করতে পারেন"
              />
            </div>
          </div>

          {/* Form Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Left: Zakatable Assets */}
            <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={16} color="#10b981" /> যাকাতযোগ্য মোট সম্পদ (Assets)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Gold */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>সোনার পরিমাণ (ভরি/তোলা)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="যেমন: ৩.৫"
                      value={goldWeightBhori}
                      onChange={e => setGoldWeightBhori(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>সোনার ভরি দর (৳)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={goldPricePerBhori}
                      onChange={e => setGoldPricePerBhori(e.target.value)}
                    />
                  </div>
                </div>

                {/* Silver */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>রুপার পরিমাণ (ভরি/তোলা)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="যেমন: ১৫"
                    value={silverWeightBhori}
                    onChange={e => setSilverWeightBhori(e.target.value)}
                  />
                </div>

                {/* Cash & Bank */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>নগদ টাকা (ক্যাশ)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="৳ ০"
                      value={cashInHand}
                      onChange={e => setCashInHand(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ব্যাংক ব্যালেন্স ও সঞ্চয়</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="৳ ০"
                      value={bankBalance}
                      onChange={e => setBankBalance(e.target.value)}
                    />
                  </div>
                </div>

                {/* Business Stock & Receivables */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ব্যবসার বিক্রয়যোগ্য পণ্য</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="৳ ০"
                      value={businessStock}
                      onChange={e => setBusinessStock(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>পাওনা টাকা (নিশ্চিত আদায়)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="৳ ০"
                      value={receivables}
                      onChange={e => setReceivables(e.target.value)}
                    />
                  </div>
                </div>

                {/* Investments */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>অন্যান্য শেয়ার ও প্রাইজবন্ড</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="৳ ০"
                    value={investments}
                    onChange={e => setInvestments(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right: Deductions & Final Calculation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem' }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="#ef4444" /> বাদ দেওয়ার দেনা বা দায় (Deductions)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>তাত্ক্ষণিক পরিশোধযোগ্য ঋণ</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="৳ ০"
                      value={immediateDebts}
                      onChange={e => setImmediateDebts(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>বকেয়া বিল ও কর্মচারীর বেতন</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="৳ ০"
                      value={unpaidBills}
                      onChange={e => setUnpaidBills(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Result Summary Box */}
              <div
                style={{
                  background: isEligible ? 'rgba(16, 185, 129, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                  border: `1px solid ${isEligible ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>মোট সম্পদ:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>৳{totalGrossAssets.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>বাদ মোট দায়:</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>- ৳{totalDeductions.toLocaleString()}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>নীট যাকাতযোগ্য সম্পদ:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>৳{netZakatableWealth.toLocaleString()}</span>
                </div>

                <div style={{ margin: '8px 0', padding: '10px', borderRadius: '10px', background: isEligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
                  {isEligible ? (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                        আলহামদুলিল্লাহ, আপনার উপর যাকাত ফরজ হয়েছে
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>
                        ৳{zakatDue.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        (নীট সম্পদের ২.৫% বা এক-চল্লিশাংশ)
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        আপনার নীট সম্পদ নিসাব পরিমাণের নিচে, যাকাত ফরজ নয়।
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Zakat & Sadaqah Distribution Log */}
          <div style={{ background: 'var(--bg-card, rgba(255,255,255,0.02))', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Heart size={16} color="#ec4899" /> যাকাত ও সদকা বিতরণ খাতা (Distribution Log)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  কাকে কত টাকা যাকাত বা সদকা দিয়েছেন তার হিসাব সংরক্ষণ করুন
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  মোট বিতরণ: <strong style={{ color: '#10b981' }}>৳{totalDistributed.toLocaleString()}</strong>
                  {zakatDue > 0 && <span> / বাকি: <strong style={{ color: remainingZakatToPay > 0 ? '#f59e0b' : '#10b981' }}>৳{remainingZakatToPay.toLocaleString()}</strong></span>}
                </div>
              </div>
            </div>

            {/* Quick Add Distribution Form */}
            <form onSubmit={handleAddDistribution} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="প্রাপকের নাম / খাত (যেমন: আব্দুল্লাহ)"
                value={distRecipient}
                onChange={e => setDistRecipient(e.target.value)}
                required
                style={{ flex: '1 1 180px' }}
              />
              <input
                type="number"
                className="form-control"
                placeholder="টাকার পরিমাণ (৳)"
                value={distAmount}
                onChange={e => setDistAmount(e.target.value)}
                required
                min="1"
                style={{ flex: '1 1 120px' }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="নোট (যেমন: চিকিৎসা সহায়তা)"
                value={distNote}
                onChange={e => setDistNote(e.target.value)}
                style={{ flex: '1 1 160px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={16} /> যুক্ত করুন
              </button>
            </form>

            {/* Distribution History List */}
            {distributions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                এখনো কোনো যাকাত বা সদকা বিতরণের হিসাব যোগ করা হয়নি।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {distributions.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-subtle, rgba(255,255,255,0.03))',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {item.recipient}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📅 {item.date} {item.note && `• ${item.note}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
                        ৳{Number(item.amount).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDeleteDistribution(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="মুছুন"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--header-bg, rgba(255,255,255,0.02))'
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '7px 20px' }}>
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
