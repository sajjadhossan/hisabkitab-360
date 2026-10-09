import React from 'react';
import { X, UtensilsCrossed, Printer, Check, Clock, User, Coffee } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { printElement } from '../../../services/printService';

/**
 * RestaurantKOTModal
 * ------------------
 * Kitchen Order Ticket (KOT) Direct Kitchen Printer Slip:
 * - Table number & Waiter attribution
 * - Order timestamp
 * - Item list with quantities and special cooking instructions
 * - Clean, non-financial thermal slip for the chef/kitchen!
 */
export const RestaurantKOTModal = ({ isOpen, onClose, cart, selectedTable, selectedWaiter, orderType }) => {
  const { showToast, lang } = useApp();

  if (!isOpen) return null;

  const handlePrintKOT = () => {
    printElement('restaurant-kot-slip', {
      title: `KOT_${selectedTable}_${Date.now()}`,
      autoPrint: true,
      onComplete: () => {
        if (showToast) showToast('👨‍🍳 কিচেন অর্ডার টিকিট (KOT) সফলভাবে প্রিন্ট হয়েছে!', 'success');
        onClose();
      }
    });
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString();

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '420px', width: '95%', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                কিচেন অর্ডার টিকেট (KOT)
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                শেফ ও রান্নাঘরের জন্য স্পেশাল অর্ডার স্লিপ
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Printable KOT Thermal Slip Preview */}
        <div
          id="restaurant-kot-slip"
          style={{
            background: '#fff',
            color: '#000',
            fontFamily: 'monospace',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.4',
            marginBottom: '1rem',
            border: '1px dashed #ccc'
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>*** K O T ***</h2>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {orderType === 'parcel' ? '🛍️ PARCEL / TAKEAWAY' : `🍽️ TABLE: ${selectedTable}`}
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              <span>তারিখ: {dateStr}</span> | <span>সময়: {timeStr}</span>
            </div>
            <div style={{ fontSize: '11px' }}>
              ওয়েটার: <strong>{selectedWaiter || 'অ্যাসাইনড নয়'}</strong>
            </div>
          </div>

          {/* Items Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}>
            <span style={{ flex: 1 }}>আইটেমের নাম</span>
            <span style={{ width: '45px', textAlign: 'right' }}>পরিমাণ</span>
          </div>

          {/* Items List */}
          <div style={{ padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '6px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                  {item.unit && <div style={{ fontSize: '10px', color: '#555' }}>ইউনিট: {item.unit}</div>}
                </div>
                <div style={{ width: '45px', textAlign: 'right', fontWeight: '900', fontSize: '15px' }}>
                  x{item.qty}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px dashed #000', paddingTop: '8px', marginTop: '8px', textAlign: 'center', fontSize: '11px' }}>
            মোট আইটেম: <strong>{cart.reduce((sum, i) => sum + (i.qty || 1), 0)} টি</strong>
            <div style={{ marginTop: '4px', fontStyle: 'italic' }}>-- কিচেন কপি (মূল্য নেই) --</div>
          </div>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrintKOT}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <Printer size={18} />
          <span>🖨️ KOT কিচেন স্লিপ প্রিন্ট করুন</span>
        </button>
      </div>
    </div>
  );
};
