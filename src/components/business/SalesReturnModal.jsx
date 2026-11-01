import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Trash2,
  DollarSign,
  Printer,
  FileText,
  Ticket,
  Copy,
  Check,
  Share2,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { showConfirmDialog } from '../../services/dialogService';
import { voucherService } from '../../services/voucherService';
import { safeJsonParse } from '../../utils/safeJson';

export const SalesReturnModal = ({
  isOpen,
  onClose,
  initialSale = null,
  onApplyVoucherToCart = null,
  lang = 'bn'
}) => {
  const {
    salesHistory = [],
    products = [],
    adjustStock,
    recordDamagedGoods,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('return'); // 'return' | 'vouchers'
  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState({}); // { [productId]: { selected, quantity, maxQuantity, unitPrice, name, condition, reason } }
  const [refundMethod, setRefundMethod] = useState('voucher'); // 'voucher' | 'cash'
  const [returnNotes, setReturnNotes] = useState('');
  const [createdVoucher, setCreatedVoucher] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [voucherList, setVoucherList] = useState([]);
  const [voucherSearch, setVoucherSearch] = useState('');

  // Load vouchers when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setVoucherList(voucherService.getVouchers());
    }
  }, [isOpen, activeTab]);

  // Auto-select initial sale if provided from POS invoice list
  useEffect(() => {
    if (isOpen && initialSale) {
      handleSelectSale(initialSale);
      setActiveTab('return');
    } else if (!isOpen) {
      setSelectedSale(null);
      setReturnItems({});
      setSearchInvoice('');
      setCreatedVoucher(null);
      setCopiedCode(false);
    }
  }, [isOpen, initialSale]);

  // Find sales match
  const filteredSales = useMemo(() => {
    if (!searchInvoice.trim()) return salesHistory.slice(0, 8);
    const q = searchInvoice.toLowerCase();
    return salesHistory.filter(s =>
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.includes(q))
    ).slice(0, 10);
  }, [salesHistory, searchInvoice]);

  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    const initialReturns = {};
    (sale.items || []).forEach(item => {
      initialReturns[item.id || item.productId] = {
        selected: false,
        quantity: 1,
        maxQuantity: item.quantity || item.qty || 1,
        unitPrice: item.price || item.sellPrice || 0,
        name: item.name || 'পণ্য',
        condition: 'restock', // 'restock' or 'damaged'
        reason: 'গ্রাহকের পছন্দ হয়নি / অতিরিক্ত নেওয়া'
      };
    });
    setReturnItems(initialReturns);
  };

  const handleToggleItem = (itemId) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId].selected
      }
    }));
  };

  const handleUpdateItem = (itemId, field, value) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  // Compute total refund
  const totalRefundAmount = useMemo(() => {
    return Object.values(returnItems)
      .filter(it => it.selected)
      .reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);
  }, [returnItems]);

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(returnItems).filter(([_, it]) => it.selected);
    if (itemsToReturn.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ফেরত নেওয়ার পণ্য নির্বাচন করুন।');
      return;
    }

    const refundLabel = refundMethod === 'voucher' ? 'এক্সচেঞ্জ ভাউচার ইস্যু' : 'নগদ ক্যাশ ফেরত';
    const ok = await showConfirmDialog({
      title: 'বিক্রিত মাল ফেরত নিবেন?',
      message: `মোট ৳${totalRefundAmount.toLocaleString()} (${refundLabel}) দিয়ে বিক্রিত মাল ফেরত নিতে চান?`,
      confirmText: 'হ্যাঁ, ফেরত গ্রহণ করুন',
      type: 'warning'
    });
    if (!ok) return;

    // Restore stock or log damage
    itemsToReturn.forEach(([prodId, it]) => {
      const qty = Number(it.quantity) || 1;
      const matchedProd = products.find(p => p.id === prodId || p.name === it.name);

      if (it.condition === 'restock') {
        if (matchedProd && typeof adjustStock === 'function') {
          adjustStock(matchedProd.id, qty, 'in', `সেলস রিটার্ন (ইনভয়েস: ${selectedSale.id})`);
        }
      } else {
        if (typeof recordDamagedGoods === 'function') {
          recordDamagedGoods({
            productId: matchedProd?.id || prodId,
            productName: it.name,
            quantity: qty,
            costPrice: matchedProd?.costPrice || it.unitPrice,
            reason: `সেলস রিটার্ন ড্যামেজ: ${it.reason || 'নষ্ট/মেয়াদোত্তীর্ণ'}`,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }
    });

    const returnId = `RET-${Date.now().toString().slice(-6)}`;

    // Generate Exchange Voucher if voucher method is chosen
    let generatedVoucher = null;
    if (refundMethod === 'voucher') {
      generatedVoucher = voucherService.createExchangeVoucher({
        amount: totalRefundAmount,
        customerName: selectedSale.customerName || 'সাধারণ ক্রেতা',
        customerPhone: selectedSale.customerPhone || '',
        customerId: selectedSale.customerId || null,
        invoiceId: selectedSale.id,
        returnId: returnId,
        notes: returnNotes,
        validityDays: 30
      });
    }

    // Record return transaction log in localStorage
    try {
      const savedReturns = safeJsonParse(localStorage.getItem('hk360_sales_returns'), []);
      const returnRecord = {
        id: returnId,
        invoiceId: selectedSale.id,
        customerName: selectedSale.customerName || 'খুচরা ক্রেতা',
        customerPhone: selectedSale.customerPhone || '',
        date: new Date().toISOString().split('T')[0],
        refundAmount: totalRefundAmount,
        refundMethod: refundMethod,
        voucherCode: generatedVoucher ? generatedVoucher.code : null,
        items: itemsToReturn.map(([id, it]) => ({ name: it.name, quantity: it.quantity, condition: it.condition })),
        note: returnNotes
      };
      localStorage.setItem('hk360_sales_returns', JSON.stringify([returnRecord, ...savedReturns]));
    } catch { }

    if (showToast) {
      showToast(
        refundMethod === 'voucher'
          ? `সেলস রিটার্ন সম্পন্ন! ৳${totalRefundAmount} মূল্যের এক্সচেঞ্জ ভাউচার তৈরি হয়েছে।`
          : 'সেলস রিটার্ন সফলভাবে সম্পন্ন এবং ইনভেন্টরি আপডেট হয়েছে!',
        'success'
      );
    }

    if (generatedVoucher) {
      setCreatedVoucher(generatedVoucher);
      setVoucherList(voucherService.getVouchers());
    } else {
      setSelectedSale(null);
      onClose();
    }
  };

  const handleCopyVoucher = (code) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      if (showToast) showToast('ভাউচার কোড কপি হয়েছে!', 'info');
    } catch { }
  };

  const handlePrintVoucher = (vch) => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exchange Voucher - ${vch.code}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; text-align: center; color: #1e293b; }
            .voucher-card { border: 2px dashed #f59e0b; padding: 24px; border-radius: 16px; background: #fffbeb; }
            .title { font-size: 20px; font-weight: 800; color: #b45309; margin-bottom: 4px; }
            .code { font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #1e293b; margin: 12px 0; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .amount { font-size: 32px; font-weight: 900; color: #10b981; margin: 10px 0; }
            .info { font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 12px; }
            .notice { font-size: 11px; color: #94a3b8; margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="voucher-card">
            <div class="title">🎟️ স্টোর ক্রেডিট / এক্সচেঞ্জ ভাউচার</div>
            <p style="margin: 0; font-size: 13px; color: #78350f;">হিসাবকিতাব ৩৬০ - বিক্রিত পণ্য ফেরত রসিদ</p>
            <div class="code">${vch.code}</div>
            <div class="amount">৳${vch.amount.toLocaleString()}</div>
            <div class="info">
              <strong>ক্রেতার নাম:</strong> ${vch.customerName || 'সম্মানিত ক্রেতা'}<br/>
              ${vch.customerPhone ? `<strong>মোবাইল:</strong> ${vch.customerPhone}<br/>` : ''}
              <strong>ইস্যু তারিখ:</strong> ${new Date(vch.issueDate).toLocaleDateString('bn-BD')}<br/>
              <strong>মেয়াদ উত্তীর্ণের তারিখ:</strong> ${new Date(vch.expiresAt).toLocaleDateString('bn-BD')}
            </div>
            <div class="notice">
              * পরবর্তী কেনাকাটায় এই কোডটি ক্যাশ কাউন্টারে উপস্থাপন করে সমমূল্যের কেনাকাটা করুন।
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShareWhatsApp = (vch) => {
    const text = `🎟️ *হিসাবকিতাব ৩৬০ - এক্সচেঞ্জ ভাউচার*\n\n` +
      `ভাউচার কোড: *${vch.code}*\n` +
      `পরিমাণ: *৳${vch.amount.toLocaleString()}*\n` +
      `ক্রেতার নাম: ${vch.customerName}\n` +
      `মেয়াদ: ${new Date(vch.expiresAt).toLocaleDateString('bn-BD')} পর্যন্ত\n\n` +
      `পরবর্তী যেকোনো কেনাকাটায় আমাদের দোকানে এই ভাউচারটি ব্যবহার করতে পারবেন। ধন্যবাদ!`;
    const phone = vch.customerPhone ? vch.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/88${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredVouchers = useMemo(() => {
    if (!voucherSearch.trim()) return voucherList;
    const q = voucherSearch.toLowerCase();
    return voucherList.filter(v =>
      (v.code && v.code.toLowerCase().includes(q)) ||
      (v.customerName && v.customerName.toLowerCase().includes(q)) ||
      (v.customerPhone && v.customerPhone.includes(q))
    );
  }, [voucherList, voucherSearch]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
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
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)'
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'বিক্রিত মাল ফেরত ও এক্সচেঞ্জ ভাউচার (Sales Return & Exchange)' : 'Sales Return & Exchange Voucher'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'পণ্য ফেরত গ্রহণ, স্টক সমন্বয় ও গ্রাহককে স্টোর ক্রেডিট ভাউচার প্রদান' : 'Process return, stock restoration and customer exchange vouchers'}
              </p>
            </div>
          </div>
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

        {/* Tab Selector */}
        {!createdVoucher && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('return')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'return' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: activeTab === 'return' ? '#f97316' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.9rem',
                borderBottom: activeTab === 'return' ? '2px solid #f97316' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} /> {lang === 'bn' ? '🔄 পণ্য ফেরত গ্রহণ (Sales Return)' : 'Process Return'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vouchers')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'vouchers' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeTab === 'vouchers' ? '#10b981' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.9rem',
                borderBottom: activeTab === 'vouchers' ? '2px solid #10b981' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Ticket size={16} /> {lang === 'bn' ? `🎟️ এক্সচেঞ্জ ভাউচার তালিকা (${voucherList.length})` : `Vouchers (${voucherList.length})`}
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {createdVoucher ? (
            /* Post-Voucher Generated Screen */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(16, 185, 129, 0.4)'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  🎉 এক্সচেঞ্জ ভাউচার প্রস্তুত হয়েছে!
                </h4>
                <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  বিক্রিত পণ্যটি সফলভাবে ফেরত নেওয়া হয়েছে এবং গ্রাহকের জন্য সমমূল্যের স্টোর ক্রেডিট ভাউচার তৈরি হয়েছে।
                </p>
              </div>

              {/* Voucher Preview Card */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.05))',
                  border: '2px dashed #f59e0b',
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '1px' }}>
                    STORE CREDIT VOUCHER
                  </span>
                  <span style={{ fontSize: '0.74rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    সক্রিয় (Active)
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    margin: '12px 0',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--text-main)' }}>
                    {createdVoucher.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyVoucher(createdVoucher.code)}
                    style={{
                      background: copiedCode ? '#10b981' : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'কপি হয়েছে' : 'কপি করুন'}
                  </button>
                </div>

                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', margin: '8px 0' }}>
                  ৳{createdVoucher.amount.toLocaleString()}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  ক্রেতা: <strong>{createdVoucher.customerName}</strong> {createdVoucher.customerPhone ? `(${createdVoucher.customerPhone})` : ''}<br />
                  মেয়াদ: <strong>{new Date(createdVoucher.expiresAt).toLocaleDateString('bn-BD')}</strong> পর্যন্ত
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '520px' }}>
                {typeof onApplyVoucherToCart === 'function' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onApplyVoucherToCart(createdVoucher)}
                    style={{
                      flex: '1 1 200px',
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderColor: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 800
                    }}
                  >
                    <ArrowRight size={16} /> এখনই কাউন্টারে এক্সচেঞ্জ করুন
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePrintVoucher(createdVoucher)}
                  style={{
                    flex: '1 1 140px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 700
                  }}
                >
                  <Printer size={16} /> ভাউচার প্রিন্ট
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleShareWhatsApp(createdVoucher)}
                  style={{
                    flex: '1 1 140px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    color: '#25D366'
                  }}
                >
                  <Share2 size={16} /> WhatsApp
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setCreatedVoucher(null);
                  setSelectedSale(null);
                  onClose();
                }}
                style={{ marginTop: '10px', padding: '6px 20px', fontSize: '0.85rem' }}
              >
                সম্পন্ন ও বন্ধ করুন
              </button>
            </div>
          ) : activeTab === 'vouchers' ? (
            /* Vouchers List Tab */
            <div>
              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="ভাউচার কোড, গ্রাহকের নাম বা ফোন দিয়ে খুঁজুন..."
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>

              {filteredVouchers.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Ticket size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>কোন এক্সচেঞ্জ ভাউচার খুঁজে পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {filteredVouchers.map(vch => {
                    const isUsable = (vch.status === 'active' || vch.status === 'partially_used') && vch.balance > 0;
                    return (
                      <div
                        key={vch.id}
                        style={{
                          background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                          border: isUsable ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1rem', letterSpacing: '1px' }}>
                            {vch.code}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              background: isUsable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: isUsable ? '#10b981' : '#ef4444'
                            }}
                          >
                            {vch.status === 'used' ? 'ব্যবহৃত (Used)' : isUsable ? 'সক্রিয় (Active)' : 'বাতিল (Void)'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>অবশিষ্ট ব্যালেন্স:</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isUsable ? '#10b981' : 'var(--text-muted)' }}>
                            ৳{vch.balance.toLocaleString()}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                          গ্রাহক: <strong>{vch.customerName}</strong> {vch.customerPhone ? `(${vch.customerPhone})` : ''}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          {isUsable && typeof onApplyVoucherToCart === 'function' && (
                            <button
                              type="button"
                              onClick={() => {
                                onApplyVoucherToCart(vch);
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                background: '#10b981',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              কাউন্টারে ব্যবহার
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePrintVoucher(vch)}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: 'var(--text-main)',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyVoucher(vch.code)}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(255,255,255,0.08)',
                              border: 'none',
                              color: 'var(--text-main)',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : !selectedSale ? (
            /* Search original sales invoice */
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  ইনভয়েস নং বা কাস্টমারের নাম/ফোন দিয়ে অনুসন্ধান করুন:
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: INV-0012, রহিম, 017..."
                    value={searchInvoice}
                    onChange={(e) => setSearchInvoice(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSales.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    কোন বিক্রয় রেকর্ড খুঁজে পাওয়া যায়নি।
                  </div>
                ) : (
                  filteredSales.map(sale => (
                    <div
                      key={sale.id}
                      onClick={() => handleSelectSale(sale)}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-subtle, rgba(255,255,255,0.02))',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-subtle, rgba(255,255,255,0.02))'}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          ইনভয়েস: {sale.id}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          ক্রেতা: {sale.customerName || 'সাধারণ ক্রেতা'} | তারিখ: {sale.date || 'আজ'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                          ৳{(sale.grandTotal || sale.total || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(sale.items || []).length} টি আইটেম
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Selected Sale Return Process Form */
            <form onSubmit={handleProcessReturn}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(249, 115, 22, 0.08)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(249, 115, 22, 0.2)'
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: '#f97316' }}>নির্বাচিত ইনভয়েস: {selectedSale.id}</span>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    ক্রেতা: {selectedSale.customerName || 'সাধারণ ক্রেতা'} | তারিখ: {selectedSale.date || 'আজ'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  অন্য ইনভয়েস বাছাই
                </button>
              </div>

              {/* Items Return Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  ফেরতযোগ্য পণ্যসমূহ নির্বাচন করুন:
                </label>
                {Object.entries(returnItems).map(([id, it]) => (
                  <div
                    key={id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto',
                      gap: '12px',
                      alignItems: 'center',
                      background: it.selected ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-subtle, rgba(255,255,255,0.01))',
                      border: it.selected ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid var(--border-color)',
                      padding: '10px 14px',
                      borderRadius: '10px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={it.selected}
                      onChange={() => handleToggleItem(id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{it.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        মূল্য: ৳{it.unitPrice} | বিক্রিত পরিমাণ: {it.maxQuantity}
                      </div>
                    </div>

                    <div style={{ width: '80px' }}>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>ফেরত সংখ্যা:</label>
                      <input
                        type="number"
                        className="form-control"
                        value={it.quantity}
                        onChange={e => handleUpdateItem(id, 'quantity', Math.min(it.maxQuantity, Math.max(1, Number(e.target.value) || 1)))}
                        disabled={!it.selected}
                        min="1"
                        max={it.maxQuantity}
                        style={{ height: '32px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>পণ্যের অবস্থা:</label>
                      <select
                        className="form-control"
                        value={it.condition}
                        onChange={e => handleUpdateItem(id, 'condition', e.target.value)}
                        disabled={!it.selected}
                        style={{ height: '32px', fontSize: '0.82rem' }}
                      >
                        <option value="restock">✅ ভালো পণ্য (স্টকে যুক্ত হবে)</option>
                        <option value="damaged">⚠️ নষ্ট/ড্যামেজ (ক্ষতির খাতায়)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refund Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-subtle, rgba(255,255,255,0.02))', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>রিফান্ড মাধ্যম:</label>
                  <select
                    className="form-control"
                    value={refundMethod}
                    onChange={e => setRefundMethod(e.target.value)}
                  >
                    <option value="voucher">🎟️ এক্সচেঞ্জ ভাউচার / স্টোর ক্রেডিট (প্রস্তাবিত)</option>
                    <option value="cash">💵 নগদ ক্যাশ ফেরত (Cash Refund)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>নোট বা ফেরতের কারণ:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: সাইজ না মেলায় এক্সচেঞ্জ"
                    value={returnNotes}
                    onChange={e => setReturnNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Total & Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  মোট রিফান্ড পরিমাণ: <span style={{ color: '#ef4444' }}>৳{totalRefundAmount.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedSale(null)} style={{ padding: '7px 16px', fontSize: '0.85rem' }}>বাতিল</button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={totalRefundAmount <= 0}
                    style={{ padding: '7px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#f97316', borderColor: '#f97316' }}
                  >
                    <CheckCircle2 size={16} /> {refundMethod === 'voucher' ? 'ভাউচার ইস্যু ও ফেরত সম্পন্ন' : 'ক্যাশ রিফান্ড সম্পন্ন'}
                  </button>
                </div>
              </div>
            </form>
          )}
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

export default SalesReturnModal;
