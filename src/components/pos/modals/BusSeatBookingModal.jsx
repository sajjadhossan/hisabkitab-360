import React, { useState, useEffect } from 'react';
import { X, Bus, Check, Users, ShoppingCart, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

/**
 * BusSeatBookingModal
 * -------------------
 * Real-time 40-Seat Bus Layout Matrix & Ticket Booking Engine.
 * Dynamically binds booked seats to local storage per route,
 * records real passenger tickets directly into the POS cart,
 * and maintains actual persistent seating availability with trip reset capability.
 */
export const BusSeatBookingModal = ({ isOpen, onClose }) => {
  const { addToCart, showToast } = useApp();

  const ROUTES = [
    { id: 'dhaka_ctg', name: 'ঢাকা ➔ চট্টগ্রাম', fare: 850, departure: '০৮:০০ AM', boarding: 'সায়েদাবাদ / গাবতলী' },
    { id: 'dhaka_cox', name: 'ঢাকা ➔ কক্সবাজার (স্লিপার/এসি)', fare: 1500, departure: '১০:৩০ PM', boarding: 'ফকিরাপুল / আরামবাগ' },
    { id: 'dhaka_syl', name: 'ঢাকা ➔ সিলেট', fare: 750, departure: '০৭:১৫ AM', boarding: 'মহাখালী' },
    { id: 'dhaka_raj', name: 'ঢাকা ➔ রাজশাহী', fare: 800, departure: '০৯:০০ AM', boarding: 'কল্যাণপুর / গাবতলী' },
    { id: 'dhaka_bar', name: 'ঢাকা ➔ বরিশাল (পদ্মা সেতু)', fare: 650, departure: '১১:০০ AM', boarding: 'সায়েদাবাদ' }
  ];

  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [selectedSeats, setSelectedSeats] = useState(['A1']);

  // Load genuine booked seats per route from persistent storage
  const getStoredBookedSeats = (routeId) => {
    try {
      const data = localStorage.getItem('hk360_bus_booked_seats_' + routeId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const [bookedSeats, setBookedSeats] = useState(() => getStoredBookedSeats(ROUTES[0].id));

  // Sync booked seats when route changes
  useEffect(() => {
    const seats = getStoredBookedSeats(selectedRoute.id);
    setBookedSeats(seats);

    const allSeats = [];
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(r => {
      [1, 2, 3, 4].forEach(c => allSeats.push(`${r}${c}`));
    });
    const firstAvail = allSeats.find(s => !seats.includes(s));
    setSelectedSeats(firstAvail ? [firstAvail] : []);
  }, [selectedRoute]);

  if (!isOpen) return null;

  const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    } else {
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const totalFare = selectedSeats.length * selectedRoute.fare;

  const handleBookTickets = () => {
    if (selectedSeats.length === 0) {
      if (showToast) showToast('অনুগ্রহ করে অন্তত ১টি সিট নির্বাচন করুন', 'error');
      return;
    }
    if (!passengerName.trim() || !passengerPhone.trim()) {
      if (showToast) showToast('যাত্রীর নাম ও মোবাইল নম্বর লিখুন', 'error');
      return;
    }

    // Persist real booked seats for this route
    const currentBooked = getStoredBookedSeats(selectedRoute.id);
    const updatedBooked = Array.from(new Set([...currentBooked, ...selectedSeats]));
    localStorage.setItem('hk360_bus_booked_seats_' + selectedRoute.id, JSON.stringify(updatedBooked));
    setBookedSeats(updatedBooked);

    const ticketProduct = {
      id: `bus_${Date.now()}`,
      name: `বাস টিকেট [${selectedRoute.name}]`,
      category: 'বাস ও পরিবহন টিকেট',
      costPrice: Math.round(totalFare * 0.8),
      sellPrice: totalFare,
      unit: `${selectedSeats.length} সিট`,
      stock: 40 - updatedBooked.length,
      isBusTicket: true,
      ticketDetails: {
        route: selectedRoute.name,
        departure: selectedRoute.departure,
        boarding: selectedRoute.boarding,
        seats: selectedSeats.join(', '),
        seatCount: selectedSeats.length,
        farePerSeat: selectedRoute.fare,
        passengerName,
        passengerPhone
      }
    };

    addToCart(ticketProduct);
    if (showToast) {
      showToast(`🚌 সিট (${selectedSeats.join(', ')}) কার্টে সফলভাবে যুক্ত হয়েছে!`, 'success');
    }
    onClose();
  };

  const handleResetTripSeats = () => {
    if (window.confirm(`আপনি কি "${selectedRoute.name}" রুটের সকল বুকড সিট ক্লিয়ার করে নতুন ট্রিপের জন্য বাস খালি করতে চান?`)) {
      localStorage.removeItem('hk360_bus_booked_seats_' + selectedRoute.id);
      setBookedSeats([]);
      setSelectedSeats(['A1']);
      if (showToast) showToast('✅ বাসের সিট সফলভাবে খালি/রিসেট করা হয়েছে!', 'success');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '640px', width: '95%', padding: '1.25rem', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
              <Bus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                বাস টিকিট ও ৪০-সিট ইন্টারেক্টিভ ম্যাপ
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ডিজিটাল সিট সিলেকশন ও রিয়েল-টাইম টিকেট বুকিং
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* 1. Route Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            গন্তব্য / রুট নির্বাচন করুন:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {ROUTES.map((r) => {
              const isSelected = selectedRoute.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoute(r)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #06b6d4' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: isSelected ? '#06b6d4' : 'var(--text-main)' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span>ভাড়া: ৳{r.fare}</span>
                    <span>{r.departure}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passenger Info Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              যাত্রীর নাম:
            </label>
            <input
              type="text"
              className="input-field"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="যেমন: মোঃ জাহিদ হাসান"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              মোবাইল নম্বর (SMS টিকেটের জন্য):
            </label>
            <input
              type="tel"
              className="input-field"
              value={passengerPhone}
              onChange={(e) => setPassengerPhone(e.target.value)}
              placeholder="017XXXXXXXX"
            />
          </div>
        </div>

        {/* 2. Bus Visual 40-Seat Matrix */}
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', marginBottom: '1rem' }}>
          {/* Driver & Cabin */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>🚪 প্রবেশপথ</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleResetTripSeats}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="নতুন ট্রিপ শুরু করতে সকল বুকড সিট খালি করুন"
              >
                <RefreshCw size={11} />
                <span>নতুন ট্রিপ (সিট খালি করুন)</span>
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>💺 ড্রাইভার কেবিন</span>
            </div>
          </div>

          {/* Seat Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ROWS.map((row) => (
              <div key={row} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left 2 seats */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2].map((col) => {
                    const seatId = `${row}${col}`;
                    const isBooked = bookedSeats.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isBooked}
                        onClick={() => toggleSeat(seatId)}
                        style={{
                          width: '42px',
                          height: '36px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          border: isSelected ? '2px solid #06b6d4' : isBooked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                          background: isSelected ? '#06b6d4' : isBooked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#000' : isBooked ? '#ef4444' : 'var(--text-main)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none'
                        }}
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>

                {/* Gangway / Passage */}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.35 }}>||</div>

                {/* Right 2 seats */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[3, 4].map((col) => {
                    const seatId = `${row}${col}`;
                    const isBooked = bookedSeats.includes(seatId);
                    const isSelected = selectedSeats.includes(seatId);

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isBooked}
                        onClick={() => toggleSeat(seatId)}
                        style={{
                          width: '42px',
                          height: '36px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          border: isSelected ? '2px solid #06b6d4' : isBooked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                          background: isSelected ? '#06b6d4' : isBooked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#000' : isBooked ? '#ef4444' : 'var(--text-main)',
                          cursor: isBooked ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none'
                        }}
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '12px', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '3px', display: 'inline-block' }}></span>
              খালি ({40 - bookedSeats.length} সিট)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', background: '#06b6d4', borderRadius: '3px', display: 'inline-block' }}></span>
              সিলেক্টেড ({selectedSeats.length})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.4)', borderRadius: '3px', display: 'inline-block' }}></span>
              বুকড ({bookedSeats.length})
            </span>
          </div>
        </div>

        {/* Fare Summary HUD */}
        <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '10px', padding: '10px 12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              নির্বাচিত সিট: <strong style={{ color: '#06b6d4' }}>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'কোনোটি নয়'}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              বোর্ডিং: {selectedRoute.boarding} | ছাড়ার সময়: {selectedRoute.departure}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>মোট ভাড়া:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#06b6d4', fontFamily: 'var(--font-mono)' }}>
              ৳{totalFare.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleBookTickets}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          <ShoppingCart size={18} />
          <span>টিকেট কার্টে যুক্ত করুন (৳{totalFare.toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
