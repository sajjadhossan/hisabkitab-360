import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  subscribeScaleWeight,
  connectSerialScale,
  disconnectSerialScale,
  setSimulatedScaleWeight,
  getHardwareStatus
} from '../../services/hardwareService';
import { playButtonClick, playCartPop, playSuccessChime } from '../../services/soundFeedback';

export const DigitalScaleModal = ({
  isOpen,
  onClose,
  cart = [],
  onApplyWeightToCartItem,
  lang = 'bn',
  showToast
}) => {
  const [scaleData, setScaleData] = useState({
    weight: 0,
    unit: 'kg',
    isStable: true,
    isSimulated: false
  });
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCartItemId, setSelectedCartItemId] = useState(cart[0]?.id || '');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeScaleWeight((data) => {
      setScaleData(data);
      setManualInput(String(data.weight));
    });
    const status = getHardwareStatus();
    setIsConnected(status.weightScale);
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      playButtonClick();
      await connectSerialScale(9600);
      setIsConnected(true);
      if (showToast) showToast(lang === 'bn' ? '✓ ডিজিটাল ওজন স্কেল সফলভাবে যুক্ত হয়েছে!' : 'Scale connected!', 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Scale connection failed', 'warning');
    }
  };

  const handleDisconnect = async () => {
    playButtonClick();
    await disconnectSerialScale();
    setIsConnected(false);
    if (showToast) showToast(lang === 'bn' ? 'স্কেল সংযোগ বিচ্ছিন্ন করা হয়েছে' : 'Scale disconnected', 'info');
  };

  const handleTare = () => {
    playButtonClick();
    setSimulatedScaleWeight(0);
    setManualInput('0');
    if (showToast) showToast(lang === 'bn' ? 'স্কেল জিরো / টেয়ার করা হয়েছে' : 'Scale tared to zero', 'info');
  };

  const handleSimulateWeight = (kg) => {
    playButtonClick();
    setSimulatedScaleWeight(kg);
    setManualInput(String(kg));
  };

  const handleManualWeightChange = (val) => {
    setManualInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setSimulatedScaleWeight(num);
    }
  };

  const handleApplyWeight = () => {
    const finalWeight = parseFloat(manualInput) || scaleData.weight || 0;
    if (finalWeight <= 0) {
      if (showToast) showToast(lang === 'bn' ? 'ওজন ০ এর বেশি হতে হবে!' : 'Weight must be > 0!', 'warning');
      return;
    }

    if (!selectedCartItemId) {
      if (showToast) showToast(lang === 'bn' ? 'কার্ট থেকে কোনো পণ্য সিলেক্ট করুন!' : 'Select an item from cart!', 'warning');
      return;
    }

    playSuccessChime();
    if (onApplyWeightToCartItem) {
      onApplyWeightToCartItem(selectedCartItemId, finalWeight);
    }
    const matched = cart.find(c => c.id === selectedCartItemId);
    if (showToast) {
      showToast(
        lang === 'bn'
          ? `✓ "${matched?.name || 'পণ্য'}" এর ওজন ${finalWeight} কেজি কার্টে আপডেট হয়েছে!`
          : `✓ Updated weight to ${finalWeight} kg!`,
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
          maxWidth: '520px',
          maxHeight: '90vh',
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
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Scale size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'ডিজিটাল ওজন স্কেল টার্মিনাল' : 'Digital Weighing Scale Terminal'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'ইউএসবি সিরিয়াল ওজন স্কেল রিডার ও সরাসরি কার্ট এন্ট্রি' : 'Web Serial live weight capture into cart'}
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

        {/* Digital LED Scale Display */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: '#090d16',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: scaleData.isStable ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scaleData.isStable ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                <span>{scaleData.isStable ? (lang === 'bn' ? 'স্থির ওজন (STABLE)' : 'STABLE') : (lang === 'bn' ? 'পরিমাপ চলছে...' : 'MEASURING...')}</span>
              </span>

              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                {isConnected ? 'SERIAL PORT ACTIVE' : 'STANDALONE / SIMULATED'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '3.6rem', fontWeight: '900', color: '#10b981', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                {(parseFloat(manualInput) || scaleData.weight || 0).toFixed(3)}
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#818cf8', fontFamily: 'monospace' }}>
                {scaleData.unit || 'kg'}
              </span>
            </div>

            {/* Quick Tare & Connect row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleTare}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.8rem'
                }}
              >
                ⚖️ {lang === 'bn' ? 'জিরো / টেয়ার (Tare)' : 'Tare / Zero'}
              </button>

              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleConnect}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Zap size={14} />
                  <span>{lang === 'bn' ? 'USB স্কেল কানেক্ট' : 'Connect USB Scale'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.8rem'
                  }}
                >
                  {lang === 'bn' ? 'ডিসকানেক্ট' : 'Disconnect'}
                </button>
              )}
            </div>
          </div>

          {/* Quick Simulated Weight Presets */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
              {lang === 'bn' ? 'কুইক ওজন প্রিসেট / টেস্টিং (কেজি)' : 'Quick Weight Presets (kg)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {[0.25, 0.5, 1.0, 2.5, 5.0].map(kg => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => handleSimulateWeight(kg)}
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '700'
                  }}
                >
                  {kg} kg
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Override */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#cbd5e1' }}>
              {lang === 'bn' ? 'ম্যানুয়াল ওজন ইনপুট (কেজি)' : 'Manual Weight Input (kg)'}
            </label>
            <input
              type="number"
              step="0.001"
              value={manualInput}
              onChange={(e) => handleManualWeightChange(e.target.value)}
              placeholder="0.000"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '800',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Select Target Cart Item */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: '#cbd5e1' }}>
              {lang === 'bn' ? 'কার্টের যে পণ্যে ওজন প্রয়োগ করবেন' : 'Target Item in Cart'}
            </label>
            {cart.length === 0 ? (
              <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem' }}>
                {lang === 'bn' ? 'কার্টে কোনো পণ্য নেই। আগে পণ্য কার্টে যোগ করুন।' : 'Cart is empty. Add a product first.'}
              </div>
            ) : (
              <select
                value={selectedCartItemId}
                onChange={(e) => setSelectedCartItemId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}
              >
                {cart.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} — বর্তমান: {item.qty} {item.unit || 'কেজি'} (৳{item.sellPrice}/ইউনিট)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleApplyWeight}
            disabled={cart.length === 0}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: cart.length > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: cart.length > 0 ? '0 4px 16px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{lang === 'bn' ? 'কার্টে এই ওজন প্রয়োগ করুন' : 'Apply Weight to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
