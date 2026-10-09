import React, { useState } from 'react';
import { X, Building2, Truck, Calculator, ShoppingCart, Check, MapPin, User, FileText } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

/**
 * ConstructionCFTModal
 * --------------------
 * Construction, Sand, Stone & Aggregate CFT Calculator + Truck Delivery Challan:
 * - Length (Feet + Inches) × Width (Feet + Inches) × Height (Feet + Inches) = Total CFT
 * - Rate per CFT ➔ Total Material Value
 * - Truck / Pickup Delivery Challan Details:
 *   - Truck Registration No
 *   - Driver Name & Mobile
 *   - Delivery Site / Project Address
 * - Instantly pushes to POS Cart with challan metadata!
 */
export const ConstructionCFTModal = ({ isOpen, onClose }) => {
  const { addToCart, showToast } = useApp();

  const [materialType, setMaterialType] = useState('সিলেট লাল বালু');
  const [ratePerCft, setRatePerCft] = useState('52'); // ৳ per CFT

  // Length
  const [lenFeet, setLenFeet] = useState('14');
  const [lenInch, setLenInch] = useState('6');

  // Width
  const [widFeet, setWidFeet] = useState('7');
  const [widInch, setWidInch] = useState('0');

  // Height / Depth
  const [hgtFeet, setHgtFeet] = useState('3');
  const [hgtInch, setHgtInch] = useState('6');

  // Truck / Delivery Details
  const [truckNo, setTruckNo] = useState('ঢাকা মেট্রো-ট ১১-৯৮৭৬');
  const [driverName, setDriverName] = useState('মোঃ করিম মিয়া');
  const [driverPhone, setDriverPhone] = useState('018XXXXXXXX');
  const [siteLocation, setSiteLocation] = useState('উত্তরা সেক্টর-১০ প্রজেক্ট');

  if (!isOpen) return null;

  // Calculate Length, Width, Height in decimals
  const totalLength = (parseFloat(lenFeet) || 0) + ((parseFloat(lenInch) || 0) / 12);
  const totalWidth = (parseFloat(widFeet) || 0) + ((parseFloat(widInch) || 0) / 12);
  const totalHeight = (parseFloat(hgtFeet) || 0) + ((parseFloat(hgtInch) || 0) / 12);

  const totalCft = Math.round(totalLength * totalWidth * totalHeight * 100) / 100;
  const unitRate = parseFloat(ratePerCft) || 0;
  const totalAmount = Math.round(totalCft * unitRate);

  const handleAddToCart = () => {
    if (totalCft <= 0 || totalAmount <= 0) {
      if (showToast) showToast('অনুগ্রহ করে সঠিক মাপ ও দর দিন', 'error');
      return;
    }

    const challanProduct = {
      id: `cft_${Date.now()}`,
      name: `${materialType} (${totalCft} CFT)`,
      category: 'নির্মাণ সামগ্রী ও বালু-পাথর',
      costPrice: Math.round(totalAmount * 0.85),
      sellPrice: totalAmount,
      unit: 'CFT',
      stock: 5000,
      isConstructionChallan: true,
      challanDetails: {
        materialType,
        totalCft,
        ratePerCft: unitRate,
        measurements: `${lenFeet}′${lenInch}″ × ${widFeet}′${widInch}″ × ${hgtFeet}′${hgtInch}″`,
        truckNo,
        driverName,
        driverPhone,
        siteLocation
      }
    };

    addToCart(challanProduct);
    if (showToast) {
      showToast(`🏗️ ${materialType} (${totalCft} CFT) চালান সহ কার্টে যুক্ত হয়েছে!`, 'success');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '600px', width: '95%', padding: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(225, 29, 72, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                বালু-পাথর CFT ক্যালকুলেটর ও ট্রাক চালান
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ঘনফুট মেজারমেন্ট ও গেটপাস চালান জেনারেটর
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. Material Selector & Rate */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              মালামালের ধরন:
            </label>
            <select
              className="input-field"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              style={{ fontWeight: '700' }}
            >
              <option value="সিলেট লাল বালু">সিলেট লাল বালু</option>
              <option value="লোকাল সাদা বালু">লোকাল সাদা বালু</option>
              <option value="ভোলগঞ্জ পাথর কুচি (৩/৪)">ভোলগঞ্জ পাথর কুচি (৩/৪)</option>
              <option value="সিলেট বোল্ডার পাথর">সিলেট বোল্ডার পাথর</option>
              <option value="১ম শ্রেণির পোড়া ইট (CFT)">১ম শ্রেণির পোড়া ইট (CFT)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              প্রতি CFT দর (৳):
            </label>
            <input
              type="number"
              className="input-field"
              value={ratePerCft}
              onChange={(e) => setRatePerCft(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#e11d48' }}
            />
          </div>
        </div>

        {/* 2. Measurements (L × W × H) */}
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            গাড়ির ডালা / স্তূপের মাপ (দৈর্ঘ্য × প্রস্থ × উচ্চতা):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {/* Length */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>দৈর্ঘ্য (Length)</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  placeholder="ফুট"
                  className="input-field"
                  value={lenFeet}
                  onChange={(e) => setLenFeet(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '800' }}
                />
                <input
                  type="number"
                  placeholder="ইঞ্চি"
                  className="input-field"
                  value={lenInch}
                  onChange={(e) => setLenInch(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '800' }}
                />
              </div>
            </div>

            {/* Width */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>প্রস্থ (Width)</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  placeholder="ফুট"
                  className="input-field"
                  value={widFeet}
                  onChange={(e) => setWidFeet(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '800' }}
                />
                <input
                  type="number"
                  placeholder="ইঞ্চি"
                  className="input-field"
                  value={widInch}
                  onChange={(e) => setWidInch(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '800' }}
                />
              </div>
            </div>

            {/* Height */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>উচ্চতা (Height)</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  placeholder="ফুট"
                  className="input-field"
                  value={hgtFeet}
                  onChange={(e) => setHgtFeet(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '800' }}
                />
                <input
                  type="number"
                  placeholder="ইঞ্চি"
                  className="input-field"
                  value={hgtInch}
                  onChange={(e) => setHgtInch(e.target.value)}
                  style={{ textAlign: 'center', fontWeight: '800' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Truck & Delivery Details */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
            ট্রাক ও ডেলিভারি গেটপাস চালান তথ্য:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="ট্রাক নম্বর (যেমন: ঢাকা মেট্রো-ট...)"
              value={truckNo}
              onChange={(e) => setTruckNo(e.target.value)}
            />
            <input
              type="text"
              className="input-field"
              placeholder="চালকের নাম"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
            <input
              type="tel"
              className="input-field"
              placeholder="চালকের মোবাইল নম্বর"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
            />
            <input
              type="text"
              className="input-field"
              placeholder="ডেলিভারি সাইটের ঠিকানা"
              value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Live HUD */}
        <div style={{ background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '10px', padding: '10px 12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              মোট পরিমাপ: <strong style={{ color: '#e11d48', fontSize: '1.05rem' }}>{totalCft} CFT</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              দর: ৳{unitRate} / CFT | সাইট: {siteLocation}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>সর্বমোট মূল্য:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#e11d48', fontFamily: 'var(--font-mono)' }}>
              ৳{totalAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <ShoppingCart size={18} />
          <span>চালান সহ কার্টে যুক্ত করুন (৳{totalAmount.toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
