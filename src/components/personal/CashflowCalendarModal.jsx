import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { playButtonClick } from '../../services/soundFeedback';

export const CashflowCalendarModal = ({
  isOpen,
  onClose,
  expenses = [],
  incomes = [],
  lang = 'bn',
  showToast
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const handlePrevMonth = () => {
    playButtonClick();
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDate(null);
  };

  const handleNextMonth = () => {
    playButtonClick();
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDate(null);
  };

  const handleCurrentMonth = () => {
    playButtonClick();
    setCurrentDate(new Date());
    setSelectedDayDate(null);
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthName = currentDate.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });

  // Map expenses and incomes by YYYY-MM-DD
  const dailyDataMap = useMemo(() => {
    const map = {};

    expenses.forEach(e => {
      if (!e.date) return;
      const d = e.date.split('T')[0].split(' ')[0];
      if (!map[d]) map[d] = { expenses: [], incomes: [], totalExpense: 0, totalIncome: 0 };
      map[d].expenses.push(e);
      map[d].totalExpense += Number(e.amount) || 0;
    });

    incomes.forEach(inc => {
      if (!inc.date) return;
      const d = inc.date.split('T')[0].split(' ')[0];
      if (!map[d]) map[d] = { expenses: [], incomes: [], totalExpense: 0, totalIncome: 0 };
      map[d].incomes.push(inc);
      map[d].totalIncome += Number(inc.amount) || 0;
    });

    return map;
  }, [expenses, incomes]);

  // Month Totals
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthTotalExpense = useMemo(() => {
    return Object.entries(dailyDataMap)
      .filter(([d]) => d.startsWith(monthPrefix))
      .reduce((sum, [_, val]) => sum + val.totalExpense, 0);
  }, [dailyDataMap, monthPrefix]);

  const monthTotalIncome = useMemo(() => {
    return Object.entries(dailyDataMap)
      .filter(([d]) => d.startsWith(monthPrefix))
      .reduce((sum, [_, val]) => sum + val.totalIncome, 0);
  }, [dailyDataMap, monthPrefix]);

  const monthNet = monthTotalIncome - monthTotalExpense;

  // Selected Day Transactions
  const selectedDayData = selectedDayDate ? dailyDataMap[selectedDayDate] : null;

  const weekDayLabels = lang === 'bn'
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          maxWidth: '820px',
          maxHeight: '92vh',
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
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>
                {lang === 'bn' ? 'ভিজ্যুয়াল ক্যাশফ্লো ক্যালেন্ডার' : 'Visual Cashflow Calendar'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {lang === 'bn' ? 'তারিখ অনুযায়ী আয়, ব্যয় ও খরচের ঘনত্ব (হিটম্যাপ)' : 'Daily income, expenses, and cashflow heatmap'}
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

        {/* Month Navigation & Summary Ribbon */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: '1.05rem', fontWeight: '800', minWidth: '160px', textAlign: 'center', color: '#f8fafc' }}>
              {monthName}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#06b6d4',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {lang === 'bn' ? 'আজ' : 'Today'}
            </button>
          </div>

          {/* Month Financial Totals */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>আয়:</span>
              <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
                ৳{monthTotalIncome.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ব্যয়:</span>
              <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                ৳{monthTotalExpense.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>নিট:</span>
              <span style={{ fontSize: '0.92rem', fontWeight: '800', color: monthNet >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                ৳{monthNet.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Main Area: Calendar Grid on left, Day inspection on right */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'grid', gridTemplateColumns: selectedDayDate ? '1.4fr 1fr' : '1fr', gap: '1.25rem' }}>
          {/* Calendar Grid */}
          <div>
            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', textAlign: 'center' }}>
              {weekDayLabels.map((day, i) => (
                <div key={i} style={{ fontSize: '0.75rem', fontWeight: '800', color: i === 5 ? '#ef4444' : '#94a3b8', padding: '4px' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {/* Empty leading padding slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '70px', borderRadius: '10px', background: 'transparent' }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const data = dailyDataMap[dateKey];
                const isSelected = selectedDayDate === dateKey;
                const isToday = new Date().toISOString().startsWith(dateKey);

                const hasIncome = data && data.totalIncome > 0;
                const hasExpense = data && data.totalExpense > 0;

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      playButtonClick();
                      setSelectedDayDate(isSelected ? null : dateKey);
                    }}
                    style={{
                      height: '74px',
                      borderRadius: '12px',
                      padding: '6px',
                      background: isSelected
                        ? 'rgba(6, 182, 212, 0.2)'
                        : isToday
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected
                        ? '1.5px solid #06b6d4'
                        : isToday
                        ? '1.5px solid #6366f1'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: isToday ? '900' : '700', color: isToday ? '#818cf8' : '#f8fafc' }}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {hasIncome && (
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#10b981', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          +৳{data.totalIncome > 999 ? `${(data.totalIncome / 1000).toFixed(1)}k` : data.totalIncome}
                        </span>
                      )}
                      {hasExpense && (
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          -৳{data.totalExpense > 999 ? `${(data.totalExpense / 1000).toFixed(1)}k` : data.totalExpense}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Day Details Panel */}
          {selectedDayDate && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#06b6d4' }}>
                  📅 {selectedDayDate}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedDayDate(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {!selectedDayData || (selectedDayData.expenses.length === 0 && selectedDayData.incomes.length === 0) ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 1rem', fontSize: '0.85rem' }}>
                  এই তারিখে কোনো আয় বা খরচের লেনদেন নেই।
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '55vh' }}>
                  {/* Incomes */}
                  {selectedDayData.incomes.map((inc, idx) => (
                    <div
                      key={`inc-${idx}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                          {inc.title || inc.source || 'আয়'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          আয় খাত
                        </div>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>
                        +৳{Number(inc.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {/* Expenses */}
                  {selectedDayData.expenses.map((exp, idx) => (
                    <div
                      key={`exp-${idx}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                          {exp.title || exp.item || 'খরচ'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {exp.subCategory || exp.category} {exp.familyMember ? `• ${exp.familyMember}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#ef4444', fontFamily: 'monospace' }}>
                        -৳{Number(exp.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
