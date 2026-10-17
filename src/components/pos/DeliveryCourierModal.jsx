import React, { useState } from 'react';
import { Truck, X, Check, ExternalLink, MapPin, Phone, Hash, DollarSign, ShieldCheck } from 'lucide-react';
import { soundService } from '../../services/soundService';

export const BANGLADESH_COURIERS = [
  {
    id: 'steadfast',
    name: 'Steadfast Courier',
    bnName: 'স্টেডফাস্ট কুরিয়ার',
    logo: '⚡',
    color: '#0284c7',
    badge: 'সবচেয়ে দ্রুত',
    trackingUrl: 'https://steadfast.com.bd/t/'
  },
  {
    id: 'pathao',
    name: 'Pathao Courier',
    bnName: 'পাঠাও কুরিয়ার',
    logo: '🔴',
    color: '#ef4444',
    badge: 'ক্যাশ অন ডেলিভারি',
    trackingUrl: 'https://pathao.com/courier/'
  },
  {
    id: 'redx',
    name: 'REDX Delivery',
    bnName: 'রেডএক্স ডেলিভারি',
    logo: '📮',
    color: '#f97316',
    badge: 'সারাদেশে হোম ডেলিভারি',
    trackingUrl: 'https://redx.com.bd/track/'
  },
  {
    id: 'sundarban',
    name: 'Sundarban Courier',
    bnName: 'সুন্দরবন কুরিয়ার',
    logo: '🌲',
    color: '#10b981',
    badge: 'শাখা ডেলিভারি / পার্সেল',
    trackingUrl: 'https://sundarbancourierltd.com'
  },
  {
    id: 'paperfly',
    name: 'Paperfly Go',
    bnName: 'পেপারফ্লাই',
    logo: '✈️',
    color: '#6366f1',
    badge: 'ডোরস্টেপ সার্ভিস',
    trackingUrl: 'https://paperfly.com.bd'
  }
];

export const DeliveryCourierModal = ({
  isOpen,
  onClose,
  initialData = {},
  onSaveCourierDetails,
  lang = 'bn'
}) => {
  const [selectedCourier, setSelectedCourier] = useState(initialData.courier || 'steadfast');
  const [trackingCode, setTrackingCode] = useState(initialData.trackingCode || '');
  const [deliveryCharge, setDeliveryCharge] = useState(initialData.deliveryCharge || '60');
  const [receiverAddress, setReceiverAddress] = useState(initialData.receiverAddress || '');
  const [receiverPhone, setReceiverPhone] = useState(initialData.receiverPhone || '');
  const [deliveryType, setDeliveryType] = useState(initialData.deliveryType || 'inside_dhaka'); // inside_dhaka, sub_dhaka, outside_dhaka

  if (!isOpen) return null;

  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    if (type === 'inside_dhaka') setDeliveryCharge('60');
    else if (type === 'sub_dhaka') setDeliveryCharge('100');
    else if (type === 'outside_dhaka') setDeliveryCharge('130');
    soundService.playBeep();
  };

  const handleSave = () => {
    soundService.playSuccessChime();
    if (onSaveCourierDetails) {
      onSaveCourierDetails({
        courier: selectedCourier,
        courierInfo: BANGLADESH_COURIERS.find((c) => c.id === selectedCourier),
        trackingCode: trackingCode.trim(),
        deliveryCharge: Number(deliveryCharge) || 0,
        receiverAddress: receiverAddress.trim(),
        receiverPhone: receiverPhone.trim(),
        deliveryType
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--color-bg-card, #0f172a)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.1))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                {lang === 'bn' ? 'হোম ডেলিভারি ও কুরিয়ার ট্র্যাকিং' : 'Delivery & Courier Logistics'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'স্টেডফাস্ট, পাঠাও ও সুন্দরবন সরাসরি পার্সেল বুকিং নোট' : 'Attach courier dispatch & consignment note'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Select Courier Partner */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
              {lang === 'bn' ? 'কুরিয়ার পার্টনার নির্বাচন করুন' : 'Select Courier Partner'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {BANGLADESH_COURIERS.map((courier) => {
                const isSelected = selectedCourier === courier.id;
                return (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourier(courier.id);
                      soundService.playBeep();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${courier.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected ? `${courier.color}15` : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{courier.logo}</span>
                      {isSelected && <Check size={16} color={courier.color} />}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#fff' : '#cbd5e1' }}>
                      {lang === 'bn' ? courier.bnName : courier.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{courier.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Rate Preset */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
              {lang === 'bn' ? 'ডেলিভারি এরিয়া ও চার্জ প্রিসেট' : 'Delivery Area & Rate'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { id: 'inside_dhaka', label: 'ঢাকার ভেতর (৳৬০)', rate: '60' },
                { id: 'sub_dhaka', label: 'ঢাকা উপশহর (৳১০০)', rate: '100' },
                { id: 'outside_dhaka', label: 'ঢাকার বাইরে (৳১৩০)', rate: '130' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleDeliveryTypeChange(preset.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: deliveryType === preset.id ? '1.5px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: deliveryType === preset.id ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: deliveryType === preset.id ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <DollarSign size={14} />
                {lang === 'bn' ? 'ডেলিভারি চার্জ (টাকা)' : 'Delivery Charge (৳)'}
              </label>
              <input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Hash size={14} />
                {lang === 'bn' ? 'কনসাইনমেন্ট / ট্র্যাকিং নং' : 'Tracking / Consignment ID'}
              </label>
              <input
                type="text"
                placeholder="Ex: SF-994821"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Address & Phone */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Phone size={14} />
              {lang === 'bn' ? 'গ্রাহকের মোবাইল নাম্বার' : 'Customer Phone Number'}
            </label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <MapPin size={14} />
              {lang === 'bn' ? 'সম্পূর্ণ ডেলিভারি ঠিকানা' : 'Full Delivery Address'}
            </label>
            <textarea
              rows={2}
              placeholder={lang === 'bn' ? 'বাড়ি নং, রোড নং, এলাকা, থানা ও জেলা...' : 'House, Road, Area, District...'}
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 22px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <ShieldCheck size={18} />
            <span>{lang === 'bn' ? 'কুরিয়ার তথ্য নিশ্চিত করুন' : 'Confirm Courier Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default DeliveryCourierModal;
