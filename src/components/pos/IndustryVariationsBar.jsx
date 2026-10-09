import React, { useState } from 'react';
import {
  Gem,
  Bus,
  Utensils,
  Building2,
  Pill,
  Smartphone,
  Sliders,
  Printer,
  Sparkles,
  ChevronRight,
  Store,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoldRateCalcModal } from './modals/GoldRateCalcModal';
import { BusSeatBookingModal } from './modals/BusSeatBookingModal';
import { ConstructionCFTModal } from './modals/ConstructionCFTModal';
import { PharmacyUnitModal } from './modals/PharmacyUnitModal';
import { RestaurantKOTModal } from './modals/RestaurantKOTModal';

/**
 * IndustryVariationsBar
 * ---------------------
 * Specialized Top Action & Variation Bar for POS:
 * Adaptively changes UI controls and features based on activeIndustryId:
 * - Gold / Jewelry: Bhori/Ana/Rati Calculator + Live 22K/21K Gold Rate
 * - Bus / Travel: Interactive 40-Seat Visual Matrix
 * - Restaurant / Cafe: Dine-in / Parcel + Table Picker + Kitchen KOT Ticket
 * - Construction / Materials: Sand/Stone CFT Calculator + Truck Delivery Challan
 * - Pharmacy: Strip to Tablet Fraction converter
 * - Quick Switcher: Opens TemplateReviewModal to turn variations ON/OFF!
 */
export const IndustryVariationsBar = ({
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  selectedWaiter,
  setSelectedWaiter,
  cart,
  onOpenTemplateManager
}) => {
  const { activeIndustryId, lang, MASTER_INDUSTRY_TEMPLATES } = useApp();

  // Modals
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [showBusModal, setShowBusModal] = useState(false);
  const [showCftModal, setShowCftModal] = useState(false);
  const [showPharmaModal, setShowPharmaModal] = useState(false);
  const [showKotModal, setShowKotModal] = useState(false);

  // Active Template info
  const activeTpl = (MASTER_INDUSTRY_TEMPLATES || []).find(t => t.id === activeIndustryId) || {
    name: 'স্ট্যান্ডার্ড রিটেইল শপ',
    sectorId: 'retail_grocery'
  };

  const isGold = activeIndustryId?.includes('jewel') || activeIndustryId?.includes('gold');
  const isBus = activeIndustryId?.includes('bus') || activeIndustryId?.includes('travel') || activeIndustryId?.includes('ticket');
  const isFood = activeIndustryId?.includes('restaurant') || activeIndustryId?.includes('food') || activeIndustryId?.includes('cafe');
  const isConstruction = activeIndustryId?.includes('const_') || activeIndustryId?.includes('rod') || activeIndustryId?.includes('cement') || activeIndustryId?.includes('sand');
  const isPharmacy = activeIndustryId?.includes('pharmacy') || activeIndustryId?.includes('health');

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.05))',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          marginBottom: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Active Industry Indicator & Switcher Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.18)',
              color: '#818cf8',
              fontSize: '0.75rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Store size={14} />
            <span>{activeTpl.name}</span>
          </div>

          <button
            type="button"
            onClick={onOpenTemplateManager}
            className="press-scale"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '3px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="দোকানের টেমপ্লেট ও ফিচার অন-অফ করুন"
          >
            <Sliders size={12} />
            <span>{lang === 'bn' ? 'ফিচার কাস্টমাইজ' : 'Customizer'}</span>
          </button>
        </div>

        {/* Right: Specialized Industry Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* 1. GOLD / JEWELRY */}
          {isGold && (
            <>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f59e0b', background: 'rgba(217, 119, 6, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                ২২K লাইভ: ৳১,২৫,০০০/ভরি
              </span>
              <button
                type="button"
                onClick={() => setShowGoldModal(true)}
                className="btn btn-secondary press-scale"
                style={{
                  padding: '5px 10px',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  color: '#f59e0b',
                  borderColor: 'rgba(217, 119, 6, 0.4)',
                  background: 'rgba(217, 119, 6, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Gem size={14} />
                <span>ভরি-আনা-রতি ক্যালকুলেটর</span>
              </button>
            </>
          )}

          {/* 2. BUS / TICKETING */}
          {isBus && (
            <button
              type="button"
              onClick={() => setShowBusModal(true)}
              className="btn btn-secondary press-scale"
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                fontWeight: '800',
                color: '#06b6d4',
                borderColor: 'rgba(6, 182, 212, 0.4)',
                background: 'rgba(6, 182, 212, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Bus size={14} />
              <span>৪০-সিট ইন্টারেক্টিভ ম্যাপ</span>
            </button>
          )}

          {/* 3. RESTAURANT & FOOD */}
          {isFood && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setOrderType(orderType === 'dine_in' ? 'parcel' : 'dine_in')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '800',
                  border: 'none',
                  background: orderType === 'dine_in' ? '#f59e0b' : '#10b981',
                  color: '#000',
                  cursor: 'pointer'
                }}
              >
                {orderType === 'dine_in' ? '🍽️ ডাইন-ইন' : '🛍️ পার্সেল'}
              </button>

              {orderType === 'dine_in' && (
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <option value="টেবিল-১">টেবিল-১</option>
                  <option value="টেবিল-২">টেবিল-২</option>
                  <option value="টেবিল-৩">টেবিল-৩</option>
                  <option value="টেবিল-৪">টেবিল-৪</option>
                  <option value="কেবিন-১">কেবিন-১</option>
                  <option value="কেবিন-২">কেবিন-২</option>
                  <option value="আউটডোর">আউটডোর</option>
                </select>
              )}

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowKotModal(true)}
                  className="btn btn-secondary press-scale"
                  style={{
                    padding: '4px 9px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Printer size={13} />
                  <span>KOT কিচেন টিকিট</span>
                </button>
              )}
            </div>
          )}

          {/* 4. CONSTRUCTION / ROD / SAND */}
          {isConstruction && (
            <button
              type="button"
              onClick={() => setShowCftModal(true)}
              className="btn btn-secondary press-scale"
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                fontWeight: '800',
                color: '#e11d48',
                borderColor: 'rgba(225, 29, 72, 0.4)',
                background: 'rgba(225, 29, 72, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Building2 size={14} />
              <span>বালু/পাথর CFT ও ট্রাক চালান</span>
            </button>
          )}

          {/* 5. PHARMACY / HEALTH */}
          {isPharmacy && (
            <button
              type="button"
              onClick={() => setShowPharmaModal(true)}
              className="btn btn-secondary press-scale"
              style={{
                padding: '5px 10px',
                fontSize: '0.76rem',
                fontWeight: '800',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Pill size={14} />
              <span>পাতা ➔ পিস কনভার্টার</span>
            </button>
          )}

          {/* Generic fallback: All customizers button if none matched */}
          {!isGold && !isBus && !isFood && !isConstruction && !isPharmacy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowGoldModal(true)}
                title="স্বর্ণের ভরি-আনা ক্যালকুলেটর"
                style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#f59e0b', cursor: 'pointer' }}
              >
                💎 স্বর্ণ
              </button>
              <button
                type="button"
                onClick={() => setShowBusModal(true)}
                title="বাসের সিট বুকিং"
                style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#06b6d4', cursor: 'pointer' }}
              >
                🚌 বাস
              </button>
              <button
                type="button"
                onClick={() => setShowCftModal(true)}
                title="CFT ঘনফুট ক্যালকুলেটর"
                style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#e11d48', cursor: 'pointer' }}
              >
                🏗️ CFT
              </button>
              <button
                type="button"
                onClick={() => setShowPharmaModal(true)}
                title="পাতা-পিস কনভার্টার"
                style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
              >
                💊 ওষুধ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render Modals */}
      <GoldRateCalcModal isOpen={showGoldModal} onClose={() => setShowGoldModal(false)} />
      <BusSeatBookingModal isOpen={showBusModal} onClose={() => setShowBusModal(false)} />
      <ConstructionCFTModal isOpen={showCftModal} onClose={() => setShowCftModal(false)} />
      <PharmacyUnitModal isOpen={showPharmaModal} onClose={() => setShowPharmaModal(false)} />
      <RestaurantKOTModal
        isOpen={showKotModal}
        onClose={() => setShowKotModal(false)}
        cart={cart}
        selectedTable={selectedTable}
        selectedWaiter={selectedWaiter}
        orderType={orderType}
      />
    </>
  );
};
