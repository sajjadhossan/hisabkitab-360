import React, { useState } from 'react';
import { X, Sparkles, Gem, ShoppingCart, Calculator, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

/**
 * GoldRateCalcModal
 * -----------------
 * Specialized Traditional Bangladeshi Gold & Jewelry Calculator:
 * - 1 Bhori (ভরি) = 16 Ana (আনা) = 96 Rati (রতি) = 960 Point (পয়েন্ট) = 11.664 Grams
 * - Live Carat Rate: 22K (default ৳1,25,000), 21K (৳1,19,000), 18K (৳1,02,000), সনাতন (৳85,000), রুপা (৳2,500)
 * - Making Charge (মজুরি) + Wastage/Melting (খাদ)
 * - Instantly pushes calculated custom jewelry item to POS Cart!
 */
export const GoldRateCalcModal = ({ isOpen, onClose }) => {
  const { addToCart, showToast, lang } = useApp();

  // Selected Carat
  const [carat, setCarat] = useState('22K');
  const [customRate, setCustomRate] = useState(125000); // ৳ per Bhori

  // Jewelry Item Title
  const [ornamentName, setOrnamentName] = useState('২২ ক্যারেট সোনার চেইন');

  // Weight Mode: 'traditional' (ভরি-আনা-রতি) | 'grams' (গ্রাম)
  const [weightMode, setWeightMode] = useState('traditional');

  // Traditional Fields
  const [bhori, setBhori] = useState('1');
  const [ana, setAna] = useState('0');
  const [rati, setRati] = useState('0');
  const [point, setPoint] = useState('0');

  // Gram Field
  const [grams, setGrams] = useState('11.664');

  // Additional Charges
  const [makingCharge, setMakingCharge] = useState('3500'); // মজুরি
  const [wastagePercent, setWastagePercent] = useState('0'); // খাদ %

  if (!isOpen) return null;

  // Carat presets per Bhori
  const CARAT_RATES = {
    '22K': 125000,
    '21K': 119000,
    '18K': 102000,
    'সনাতন': 85000,
    'রুপা': 2600
  };

  const handleCaratChange = (c) => {
    setCarat(c);
    setCustomRate(CARAT_RATES[c] || 125000);
    if (c === 'রুপা') {
      setOrnamentName('খাঁটি রুপার অলংকার');
    } else {
      setOrnamentName(`${c} সোনার অলংকার`);
    }
  };

  // Convert everything to total Bhori
  let totalBhori = 0;
  if (weightMode === 'traditional') {
    const numBhori = parseFloat(bhori) || 0;
    const numAna = parseFloat(ana) || 0;
    const numRati = parseFloat(rati) || 0;
    const numPoint = parseFloat(point) || 0;
    totalBhori = numBhori + (numAna / 16) + (numRati / 96) + (numPoint / 960);
  } else {
    const numGrams = parseFloat(grams) || 0;
    totalBhori = numGrams / 11.664;
  }

  // Weight in Grams
  const totalGrams = (totalBhori * 11.664).toFixed(3);

  // Metal Base Cost
  const ratePerBhori = parseFloat(customRate) || 0;
  const rawMetalPrice = Math.round(totalBhori * ratePerBhori);

  // Wastage (খাদ)
  const wastageRate = parseFloat(wastagePercent) || 0;
  const wastageAmount = Math.round((rawMetalPrice * wastageRate) / 100);

  // Making Charge (মজুরি)
  const makingAmount = parseFloat(makingCharge) || 0;

  // Grand Total Price
  const finalPrice = Math.round(rawMetalPrice + wastageAmount + makingAmount);

  // Add to POS Cart
  const handleAddToCart = () => {
    if (finalPrice <= 0) {
      if (showToast) showToast('অনুগ্রহ করে সঠিক ওজন ও মূল্য দিন', 'error');
      return;
    }

    const weightText = weightMode === 'traditional'
      ? `${bhori || 0}ভরি ${ana || 0}আনা ${rati || 0}রতি (${totalGrams}g)`
      : `${totalGrams} গ্রাম (${totalBhori.toFixed(3)} ভরি)`;

    const jewelryProduct = {
      id: `gold_${Date.now()}`,
      name: `${ornamentName} [${carat}]`,
      category: 'স্বর্ণ ও জুয়েলারি',
      costPrice: Math.round(rawMetalPrice * 0.95),
      sellPrice: finalPrice,
      unit: 'পিস',
      stock: 99,
      isCustomGold: true,
      goldDetails: {
        carat,
        ratePerBhori,
        weightText,
        totalBhori: totalBhori.toFixed(4),
        totalGrams,
        makingCharge: makingAmount,
        wastageAmount
      }
    };

    addToCart(jewelryProduct);
    if (showToast) {
      showToast(`✨ ${ornamentName} কার্টে যুক্ত হয়েছে (৳${finalPrice.toLocaleString()})`, 'success');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '580px', width: '95%', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Gem size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                স্বর্ণ ও জুয়েলারি ভরি-আনা-রতি ক্যালকুলেটর
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                বাংলাদেশ জুয়েলার্স অ্যাসোসিয়েশন (বাজুস) স্ট্যান্ডার্ড ক্যালকুলেশন
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. Carat Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            ক্যারেট ও ধাতু নির্বাচন করুন:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.keys(CARAT_RATES).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCaratChange(c)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  border: carat === c ? '2px solid #d97706' : '1px solid var(--border-color)',
                  background: carat === c ? 'rgba(217, 119, 6, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: carat === c ? '#f59e0b' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Item Title & Live Bhori Rate */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              গহনার নাম / বিবরণ:
            </label>
            <input
              type="text"
              className="input-field"
              value={ornamentName}
              onChange={(e) => setOrnamentName(e.target.value)}
              placeholder="যেমন: সোনার নেকলেস, আংটি..."
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              প্রতি ভরি লাইভ দর (৳):
            </label>
            <input
              type="number"
              className="input-field"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#f59e0b' }}
            />
          </div>
        </div>

        {/* Weight Mode Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
            ওজন ইনপুট পদ্ধতি:
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setWeightMode('traditional')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: 'none',
                background: weightMode === 'traditional' ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: weightMode === 'traditional' ? '#000' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              ভরি-আনা-রতি
            </button>
            <button
              type="button"
              onClick={() => setWeightMode('grams')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                border: 'none',
                background: weightMode === 'grams' ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: weightMode === 'grams' ? '#000' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              সরাসরি গ্রাম (Grams)
            </button>
          </div>
        </div>

        {/* Traditional Input Inputs */}
        {weightMode === 'traditional' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ভরি (Bhori)</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={bhori}
                onChange={(e) => setBhori(e.target.value)}
                style={{ textAlign: 'center', fontWeight: '800' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>আনা (১৬ আনা=১)</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={ana}
                onChange={(e) => setAna(e.target.value)}
                style={{ textAlign: 'center', fontWeight: '800' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>রতি (৬ রতি=১)</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={rati}
                onChange={(e) => setRati(e.target.value)}
                style={{ textAlign: 'center', fontWeight: '800' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>পয়েন্ট (১০=১)</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={point}
                onChange={(e) => setPoint(e.target.value)}
                style={{ textAlign: 'center', fontWeight: '800' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ওজন (গ্রামে):</label>
            <input
              type="number"
              step="any"
              className="input-field"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="যেমন: 11.664"
              style={{ fontWeight: '800', fontSize: '1.1rem' }}
            />
          </div>
        )}

        {/* Making Charge & Wastage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              কারিগরের মজুরি / Making Charge (৳):
            </label>
            <input
              type="number"
              className="input-field"
              value={makingCharge}
              onChange={(e) => setMakingCharge(e.target.value)}
              placeholder="3500"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              খাদ / Wastage (%):
            </label>
            <input
              type="number"
              className="input-field"
              value={wastagePercent}
              onChange={(e) => setWastagePercent(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Live Calculation Summary HUD */}
        <div style={{ background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12), rgba(0, 0, 0, 0.4))', border: '1px solid rgba(217, 119, 6, 0.35)', borderRadius: '12px', padding: '12px 14px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>মোট ওজন:</span>
            <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {totalBhori.toFixed(3)} ভরি ({totalGrams} গ্রাম)
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>খাঁটি সোনার মূল্য:</span>
            <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{rawMetalPrice.toLocaleString()}</span>
          </div>
          {wastageAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>খাদ ({wastagePercent}%):</span>
              <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{wastageAmount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>মজুরি:</span>
            <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>৳{makingAmount.toLocaleString()}</span>
          </div>

          <div style={{ borderTop: '1px dashed rgba(217, 119, 6, 0.4)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>সর্বমোট বিক্রয়মূল্য:</span>
            <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
              ৳{finalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <ShoppingCart size={18} />
          <span>কার্টে যুক্ত করুন (৳{finalPrice.toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
