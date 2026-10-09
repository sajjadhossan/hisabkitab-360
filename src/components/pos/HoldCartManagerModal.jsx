import React, { useState, useEffect } from 'react';
import {
  X,
  PauseCircle,
  PlayCircle,
  Trash2,
  Split,
  Plus,
  Clock,
  User,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { playButtonClick, playCartPop, playSuccessChime, playWarningTone } from '../../services/soundFeedback';

export const HoldCartManagerModal = ({
  isOpen,
  onClose,
  currentCart = [],
  onRestoreCart,
  onHoldCurrentCart,
  lang = 'bn',
  showToast
}) => {
  const [activeTab, setActiveTab] = useState('held_list'); // 'held_list' | 'hold_new' | 'split'
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('hk360_held_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [holdNote, setHoldNote] = useState('');
  const [holdCustomerName, setHoldCustomerName] = useState('');

  // Bill Splitter state
  const [splitItems, setSplitItems] = useState([]); // indices / item IDs moved to Bill B

  useEffect(() => {
    try {
      localStorage.setItem('hk360_held_carts', JSON.stringify(heldCarts));
    } catch {}
  }, [heldCarts]);

  if (!isOpen) return null;

  const currentCartTotal = currentCart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);

  // Hold current cart
  const handleHoldCartSubmit = (e) => {
    e?.preventDefault();
    if (currentCart.length === 0) {
      if (showToast) showToast(lang === 'bn' ? 'কার্টে কোনো পণ্য নেই!' : 'Cart is empty!', 'warning');
      return;
    }

    const newHold = {
      id: `HOLD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: holdNote.trim() || (lang === 'bn' ? `হোল্ড #${heldCarts.length + 1}` : `Hold #${heldCarts.length + 1}`),
      customerName: holdCustomerName.trim() || '',
      cart: [...currentCart],
      total: currentCartTotal,
      itemCount: currentCart.reduce((a, i) => a + (Number(i.qty) || 0), 0)
    };

    const updated = [newHold, ...heldCarts];
    setHeldCarts(updated);
    playSuccessChime();

    if (onHoldCurrentCart) {
      onHoldCurrentCart();
    }

    setHoldNote('');
    setHoldCustomerName('');
    setActiveTab('held_list');

    if (showToast) {
      showToast(
        lang === 'bn' ? '✓ চলতি বিল সাময়িক হোল্ড করা হয়েছে!' : '✓ Cart placed on hold!',
        'success'
      );
    }
  };

  // Restore held cart
  const handleRestore = (holdRecord) => {
    playCartPop();
    if (onRestoreCart) {
      onRestoreCart(holdRecord.cart);
    }
    // Remove from held list
    const filtered = heldCarts.filter(h => h.id !== holdRecord.id);
    setHeldCarts(filtered);

    if (showToast) {
      showToast(
        lang === 'bn' ? `✓ "${holdRecord.note}" বিলটি কার্টে পুনরুদ্ধার করা হয়েছে!` : '✓ Held cart restored!',
        'success'
      );
    }
    onClose();
  };

  // Delete held cart
  const handleDelete = (id, e) => {
    e.stopPropagation();
    playWarningTone();
    const filtered = heldCarts.filter(h => h.id !== id);
    setHeldCarts(filtered);
    if (showToast) {
      showToast(lang === 'bn' ? 'হোল্ড বিল মুছে ফেলা হয়েছে' : 'Held cart deleted', 'info');
    }
  };

  // Toggle item in split tool
  const handleToggleSplitItem = (itemId) => {
    setSplitItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Execute bill split
  const handleExecuteSplit = () => {
    if (splitItems.length === 0 || splitItems.length === currentCart.length) {
      if (showToast) showToast(lang === 'bn' ? 'বিভক্ত করার জন্য কিছু পণ্য বেছে নিন!' : 'Select items to split!', 'warning');
      return;
    }

    const billA = currentCart.filter(item => !splitItems.includes(item.id));
    const billB = currentCart.filter(item => splitItems.includes(item.id));

    // Stash Bill B as a held cart
    const holdRecordB = {
      id: `HOLD-SPLIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: lang === 'bn' ? 'স্প্লিট বিল (অংশ ২)' : 'Split Bill (Part 2)',
      customerName: '',
      cart: billB,
      total: billB.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0),
      itemCount: billB.reduce((a, i) => a + (Number(i.qty) || 0), 0)
    };

    setHeldCarts([holdRecordB, ...heldCarts]);

    // Keep Bill A in current cart
    if (onRestoreCart) {
      onRestoreCart(billA);
    }

    playSuccessChime();
    if (showToast) {
      showToast(
        lang === 'bn' ? '✓ বিল দুই ভাগে বিভক্ত করা হয়েছে (অংশ ২ হোল্ডে সংরক্ষিত)' : '✓ Bill split! Part 2 placed on hold',
        'success'
      );
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-color, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PauseCircle size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'হোল্ড কার্ট ও স্প্লিট বিল' : 'Hold Cart & Split Bill'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'ভিড়ের সময় একাধিক গ্রাহকের বিল স্থগিত ও পুনরুদ্ধার' : 'Suspend & recall multi-customer orders instantly'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            padding: '0.75rem 1.25rem',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('held_list')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'held_list' ? '#f59e0b' : 'transparent',
              color: activeTab === 'held_list' ? '#000000' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Clock size={16} />
            <span>{lang === 'bn' ? `হোল্ড তালিকা (${heldCarts.length})` : `Held Bills (${heldCarts.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hold_new')}
            disabled={currentCart.length === 0}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'hold_new' ? '#f59e0b' : 'transparent',
              color: activeTab === 'hold_new' ? '#000000' : currentCart.length === 0 ? '#475569' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: currentCart.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: currentCart.length === 0 ? 0.6 : 1
            }}
          >
            <Plus size={16} />
            <span>{lang === 'bn' ? 'চলতি কার্ট হোল্ড' : 'Hold Current Cart'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('split')}
            disabled={currentCart.length < 2}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'split' ? '#f59e0b' : 'transparent',
              color: activeTab === 'split' ? '#000000' : currentCart.length < 2 ? '#475569' : '#94a3b8',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: currentCart.length < 2 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: currentCart.length < 2 ? 0.6 : 1
            }}
          >
            <Split size={16} />
            <span>{lang === 'bn' ? 'বিল স্প্লিট' : 'Split Bill'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {activeTab === 'held_list' && (
            <div>
              {heldCarts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: '#64748b'
                  }}
                >
                  <PauseCircle size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>
                    {lang === 'bn' ? 'কোনো হোল্ড করা বিল নেই' : 'No carts on hold'}
                  </div>
                  <p style={{ fontSize: '0.82rem', margin: '6px 0 0' }}>
                    {lang === 'bn'
                      ? 'ভিড়ের সময় কোনো গ্রাহকের বিল সাময়িক স্থগিত রাখতে "চলতি কার্ট হোল্ড" ব্যবহার করুন।'
                      : 'Use "Hold Current Cart" to pause billing for customers stepping aside.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {heldCarts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleRestore(item)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#f8fafc' }}>
                            {item.note}
                          </span>
                          {item.customerName && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                background: 'rgba(255, 255, 255, 0.06)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              👤 {item.customerName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                          {item.itemCount} টি পণ্য • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
                            ৳{Number(item.total).toLocaleString()}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '700' }}>
                            {lang === 'bn' ? 'ক্লিক করে রিস্টোর' : 'Click to recall'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          title="মুছে ফেলুন"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: 'none',
                            color: '#ef4444',
                            padding: '8px',
                            borderRadius: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'hold_new' && (
            <form onSubmit={handleHoldCartSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.85rem',
                  color: '#fbbf24'
                }}
              >
                {lang === 'bn'
                  ? `চলতি কার্টে ${currentCart.length}টি পণ্য রয়েছে (মোট ৳${currentCartTotal.toLocaleString()})। এটি হোল্ড করলে কার্ট খালি হবে এবং পরবর্তী কাস্টমারের হিসাব শুরু করা যাবে।`
                  : `Current cart has ${currentCart.length} items (Total ৳${currentCartTotal.toLocaleString()}). Holding will clear the cart for the next customer.`}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: '#cbd5e1' }}>
                  {lang === 'bn' ? 'হোল্ড নোট / রেফারেন্স' : 'Hold Reference / Note'}
                </label>
                <input
                  type="text"
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: কাস্টমার ক্যাশ আনতে গেছেন / টেবিল ৩' : 'e.g. Waiting for cash / Table 3'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: '#cbd5e1' }}>
                  {lang === 'bn' ? 'গ্রাহকের নাম বা ফোন (ঐচ্ছিক)' : 'Customer Name / Phone (Optional)'}
                </label>
                <input
                  type="text"
                  value={holdCustomerName}
                  onChange={(e) => setHoldCustomerName(e.target.value)}
                  placeholder={lang === 'bn' ? 'নাম বা মোবাইল নম্বর' : 'Customer name or phone'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '0.5rem',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <PauseCircle size={18} />
                <span>{lang === 'bn' ? 'হ্যাঁ, এখন হোল্ড করুন' : 'Confirm Hold Cart'}</span>
              </button>
            </form>
          )}

          {activeTab === 'split' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {lang === 'bn'
                  ? 'যে পণ্যগুলো আলাদা বিলে নিতে চান সেগুলোতে টিক দিন। নির্বাচিত পণ্যগুলো নতুন একটি হোল্ড বিলে সংরক্ষিত হবে।'
                  : 'Select items to move to Bill B. Selected items will be stored as a new held bill.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '40vh', overflowY: 'auto' }}>
                {currentCart.map(item => {
                  const isSelected = splitItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleSplitItem(item.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                        border: isSelected ? '1.5px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f8fafc' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {item.qty} × ৳{item.sellPrice}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: '800', color: isSelected ? '#818cf8' : '#10b981' }}>
                        ৳{(item.qty * item.sellPrice).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleExecuteSplit}
                disabled={splitItems.length === 0}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: splitItems.length > 0 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.92rem',
                  cursor: splitItems.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Split size={18} />
                <span>{lang === 'bn' ? `নির্বাচিত ${splitItems.length}টি পণ্য আলাদা করুন` : `Split Selected (${splitItems.length}) Items`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
