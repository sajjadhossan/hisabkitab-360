import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  Tag,
  Trash2,
  Edit2,
  Scale,
  X,
  ArrowLeft,
  CheckCircle2,
  Printer,
  TrendingDown,
  Layers,
  Folder,
  Home,
  ShoppingCart,
  GraduationCap,
  Heart,
  Palmtree,
  Wrench,
  Activity,
  FileText,
  AlertCircle,
  Filter,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { DataExportImportModal } from '../common/DataExportImportModal';

// Event Categories Configuration
const EVENT_CATEGORIES = {
  education: {
    labelBn: 'শিক্ষা ও স্কুল-কলেজ খরচ',
    labelEn: 'Education & School',
    icon: GraduationCap,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)'
  },
  wedding: {
    labelBn: 'বিয়ে ও পারিবারিক অনুষ্ঠান',
    labelEn: 'Wedding & Ceremony',
    icon: Heart,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)'
  },
  festival: {
    labelBn: 'ঈদ, পূজা ও উৎসব',
    labelEn: 'Festivals & Holidays',
    icon: Sparkles,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)'
  },
  renovation: {
    labelBn: 'বাড়ি সংস্কার ও নির্মাণ',
    labelEn: 'Home Renovation',
    icon: Wrench,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)'
  },
  tour: {
    labelBn: 'ভ্রমণ ও পারিবারিক ট্যুর',
    labelEn: 'Travel & Vacations',
    icon: Palmtree,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)'
  },
  medical: {
    labelBn: 'চিকিৎসা ও অপারেশন',
    labelEn: 'Medical & Healthcare',
    icon: Activity,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)'
  },
  other: {
    labelBn: 'অন্যান্য বিশেষ উপলক্ষ',
    labelEn: 'Other Occasions',
    icon: Layers,
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)'
  }
};

export const PersonalEventsManager = () => {
  const {
    personalExpenses,
    personalEvents = [],
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    categories = {},
    lang,
    t
  } = useApp();

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [targetEventForExpense, setTargetEventForExpense] = useState(null);

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);

  // Available Folders and Measurement Units
  const availableFolders = categories.familyExpenseFolders || [
    'বাসা ও ফ্ল্যাট খরচ',
    'বিদ্যুৎ, গ্যাস ও ইউটিলিটি',
    'সন্তানের পড়াশোনা ও স্কুল',
    'পারিবারিক চিকিৎসা ও ওষুধ',
    'ইন্টারনেট ও মোবাইল রিচার্জ',
    'গৃহস্থালি ও নিত্য কেনাকাটা',
    'অন্যান্য পারিবারিক খরচ'
  ];

  const availableUnits = categories.expenseUnits || [
    'গ্রাম (g)',
    'কেজি (kg)',
    'লিটার (L)',
    'মিলি (ml)',
    'ফুট (ft)',
    'ইঞ্চি (in)',
    'টিপ / ট্রিপ (Trip)',
    'অটো ভাড়া',
    'পিস (Pcs)',
    'প্যাকেট (Pkt)',
    'ডজন (Dzn)'
  ];

  // Event Form State
  const [eventFormData, setEventFormData] = useState({
    title: '',
    category: 'education',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active',
    note: ''
  });

  // Expense Form State for adding directly to event
  const [expenseFormData, setExpenseFormData] = useState({
    type: 'family',
    folder: availableFolders[0] || 'অন্যান্য পারিবারিক খরচ',
    item: '',
    quantity: '',
    unit: availableUnits[0] || 'কেজি (kg)',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    eventId: ''
  });

  // Calculate stats for each event
  const eventMetrics = useMemo(() => {
    const metrics = {};
    personalEvents.forEach(evt => {
      metrics[evt.id] = {
        totalSpent: 0,
        count: 0,
        expenses: []
      };
    });

    personalExpenses.forEach(exp => {
      if (exp.eventId && metrics[exp.eventId]) {
        metrics[exp.eventId].totalSpent += Number(exp.amount) || 0;
        metrics[exp.eventId].count += 1;
        metrics[exp.eventId].expenses.push(exp);
      }
    });

    return metrics;
  }, [personalEvents, personalExpenses]);

  // Overall summary metrics
  const totalEvents = personalEvents.length;
  const activeEventsCount = personalEvents.filter(e => e.status === 'active').length;
  const totalSpentAcrossEvents = useMemo(() => {
    return Object.values(eventMetrics).reduce((acc, curr) => acc + curr.totalSpent, 0);
  }, [eventMetrics]);

  const totalBudgetAcrossEvents = useMemo(() => {
    return personalEvents.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);
  }, [personalEvents]);

  // Active / Selected Event object
  const currentEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return personalEvents.find(e => e.id === selectedEventId) || null;
  }, [selectedEventId, personalEvents]);

  // Expenses for currently selected event
  const currentEventExpenses = useMemo(() => {
    if (!selectedEventId) return [];
    return personalExpenses.filter(e => e.eventId === selectedEventId);
  }, [selectedEventId, personalExpenses]);

  // Filtered events list for overview grid
  const filteredEvents = useMemo(() => {
    return personalEvents.filter(evt => {
      const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch = !search ||
        evt.title.toLowerCase().includes(search) ||
        (evt.note && evt.note.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [personalEvents, statusFilter, searchTerm]);

  // Handlers for Event modal
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventFormData({
      title: '',
      category: 'education',
      budget: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      note: ''
    });
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventFormData({
      title: evt.title || '',
      category: evt.category || 'education',
      budget: evt.budget || '',
      startDate: evt.startDate || new Date().toISOString().split('T')[0],
      endDate: evt.endDate || '',
      status: evt.status || 'active',
      note: evt.note || ''
    });
    setShowEventModal(true);
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (!eventFormData.title.trim()) return;

    const payload = {
      title: eventFormData.title.trim(),
      category: eventFormData.category,
      budget: eventFormData.budget ? Number(eventFormData.budget) : 0,
      startDate: eventFormData.startDate || new Date().toISOString().split('T')[0],
      endDate: eventFormData.endDate || '',
      status: eventFormData.status || 'active',
      note: eventFormData.note.trim()
    };

    if (editingEvent) {
      updatePersonalEvent(editingEvent.id, payload);
    } else {
      addPersonalEvent(payload);
    }

    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Handlers for Expense modal
  const handleOpenAddExpense = (targetEvent = null) => {
    const target = targetEvent || currentEvent;
    setEditingExpense(null);
    setTargetEventForExpense(target);
    setExpenseFormData({
      type: 'family',
      folder: availableFolders[0] || 'অন্যান্য পারিবারিক খরচ',
      item: '',
      quantity: '',
      unit: availableUnits[0] || 'কেজি (kg)',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      eventId: target ? target.id : (personalEvents[0]?.id || '')
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setTargetEventForExpense(personalEvents.find(e => e.id === expense.eventId) || null);
    setExpenseFormData({
      type: expense.type || 'family',
      folder: expense.folder || availableFolders[0],
      item: expense.item || expense.title || '',
      quantity: expense.quantity !== null && expense.quantity !== undefined ? expense.quantity : '',
      unit: expense.unit || availableUnits[0] || '',
      amount: expense.amount || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      note: expense.note || '',
      eventId: expense.eventId || ''
    });
    setShowExpenseModal(true);
  };

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const cleanItem = (expenseFormData.item || '').trim();
    if (!cleanItem || !expenseFormData.amount) return;

    const linkedEvent = personalEvents.find(e => e.id === expenseFormData.eventId);

    const payload = {
      title: cleanItem,
      item: cleanItem,
      quantity: expenseFormData.quantity !== '' ? Number(expenseFormData.quantity) : null,
      unit: expenseFormData.quantity !== '' ? expenseFormData.unit : '',
      amount: Number(expenseFormData.amount),
      type: expenseFormData.type,
      folder: expenseFormData.type === 'family' ? expenseFormData.folder : '',
      category: expenseFormData.type === 'family' ? expenseFormData.folder : 'other',
      date: expenseFormData.date || new Date().toISOString().split('T')[0],
      note: expenseFormData.note.trim(),
      eventId: expenseFormData.eventId || '',
      eventName: linkedEvent ? linkedEvent.title : ''
    };

    if (editingExpense) {
      updatePersonalExpense(editingExpense.id, payload);
    } else {
      addPersonalExpense(payload);
    }

    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  // Printable Statement Trigger
  const handlePrintEventStatement = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* ======================================================== */}
      {/* 1. TOP HEADER & SUMMARY METRICS                          */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <span>{lang === 'bn' ? 'ইভেন্ট ও অনুষ্ঠান খরচের খাতা' : 'Event & Project Expense Ledger'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? 'ছেলে-মেয়ের স্কুল খরচ, বিয়ের অনুষ্ঠান, ঈদ বাজার বা বাড়ি সংস্কারের সুনির্দিষ্ট হিসাব ও বাজেট ট্র্যাকার'
              : 'Dedicated expense tracker and budget control for school costs, weddings, trips, and occasions'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {selectedEventId && (
            <button
              onClick={() => setSelectedEventId(null)}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              <span>{lang === 'bn' ? 'সকল ইভেন্টে ফিরে যান' : 'All Events'}</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAddExpense()}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{lang === 'bn' ? 'ইভেন্টে খরচ লিখুন' : 'Add Expense'}</span>
          </button>

          <button
            onClick={() => setShowExportImportModal(true)}
            className="btn btn-secondary"
            title={lang === 'bn' ? 'এক্সেল ও পিডিএফ এক্সপোর্ট বা ইমপোর্ট' : 'Export / Import'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} style={{ color: '#0f766e' }} />
            <span>{lang === 'bn' ? 'এক্সপোর্ট / ইমপোর্ট' : 'Export / Import'}</span>
          </button>

          <button
            onClick={handleOpenAddEvent}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
            }}
          >
            <Plus size={16} />
            <span>{lang === 'bn' ? '+ নতুন ইভেন্ট তৈরি' : '+ New Event'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '1.5rem'
        }}
      >
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <Sparkles size={22} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট ইভেন্ট সংখ্যা' : 'Total Events'}</h3>
            <div className="stat-value">{totalEvents} টি</div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              <CheckCircle2 size={13} /> {activeEventsCount} {lang === 'bn' ? 'টি চলমান' : 'Active'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <TrendingDown size={22} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'ইভেন্টসমূহের মোট ব্যয়' : 'Total Spent on Events'}</h3>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              ৳{totalSpentAcrossEvents.toLocaleString('en-IN')}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'সকল অনুষ্ঠানের মোট খরচ' : 'Sum of all events'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট নির্ধারিত বাজেট' : 'Total Budget Planned'}</h3>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>
              ৳{totalBudgetAcrossEvents.toLocaleString('en-IN')}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {totalBudgetAcrossEvents >= totalSpentAcrossEvents
                ? (lang === 'bn' ? `অবশিষ্ট: ৳${(totalBudgetAcrossEvents - totalSpentAcrossEvents).toLocaleString('en-IN')}` : 'Budget within limits')
                : (lang === 'bn' ? `বাজেট ছাড়িয়েছে: ৳${(totalSpentAcrossEvents - totalBudgetAcrossEvents).toLocaleString('en-IN')}` : 'Over budget')}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT: LIST VIEW vs DETAIL VIEW                */}
      {/* ======================================================== */}
      {!selectedEventId ? (
        /* ---------------------------------------------------- */
        /* A. EVENT CARDS LIST VIEW                             */
        /* ---------------------------------------------------- */
        <div>
          {/* Filter Bar */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '400px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'ইভেন্টের নাম বা নোট দিয়ে খুঁজুন...' : 'Search event name or notes...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="select-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '130px', padding: '6px 10px', fontSize: '0.85rem' }}
              >
                <option value="all">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
                <option value="active">{lang === 'bn' ? '🟢 চলমান' : 'Active'}</option>
                <option value="completed">{lang === 'bn' ? '🔵 সম্পন্ন' : 'Completed'}</option>
              </select>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {filteredEvents.length} {lang === 'bn' ? 'টি ইভেন্ট' : 'events'}
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div
              className="glass-card"
              style={{
                textAlign: 'center',
                padding: '3.5rem 1rem',
                color: 'var(--text-muted)',
                borderRadius: '16px'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎯</div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                {lang === 'bn' ? 'কোনো ইভেন্ট পাওয়া যায়নি' : 'No Events Found'}
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                {lang === 'bn'
                  ? 'আপনার ছেলে-মেয়ের স্কুলের বার্ষিক খরচ, বিয়ে বা কোনো অনুষ্ঠানের হিসাব আলাদা করতে একটি নতুন ইভেন্ট তৈরি করুন।'
                  : 'Create an event to separately track costs for schooling, weddings, trips or renovations.'}
              </p>
              <button onClick={handleOpenAddEvent} className="btn btn-primary">
                <Plus size={16} />
                <span>{lang === 'bn' ? '+ নতুন ইভেন্ট তৈরি করুন' : '+ Create New Event'}</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px'
              }}
            >
              {filteredEvents.map((evt) => {
                const catConfig = EVENT_CATEGORIES[evt.category] || EVENT_CATEGORIES.other;
                const IconComponent = catConfig.icon;
                const stats = eventMetrics[evt.id] || { totalSpent: 0, count: 0 };
                const budgetNum = Number(evt.budget) || 0;
                const pct = budgetNum > 0 ? Math.min(100, Math.round((stats.totalSpent / budgetNum) * 100)) : 0;
                const isOverBudget = budgetNum > 0 && stats.totalSpent > budgetNum;
                const remaining = budgetNum > 0 ? budgetNum - stats.totalSpent : 0;

                return (
                  <div
                    key={evt.id}
                    className="glass-card"
                    style={{
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Top Bar of Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              background: catConfig.bg,
                              color: catConfig.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <IconComponent size={22} />
                          </div>
                          <div>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                color: catConfig.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {lang === 'bn' ? catConfig.labelBn : catConfig.labelEn}
                            </span>
                            <h3
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: '800',
                                color: 'var(--text-main)',
                                margin: '2px 0 0',
                                lineHeight: 1.3
                              }}
                            >
                              {evt.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          className={`badge ${evt.status === 'completed' ? 'badge-info' : 'badge-success'}`}
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                        >
                          {evt.status === 'completed' ? (lang === 'bn' ? '✓ সম্পন্ন' : 'Completed') : (lang === 'bn' ? '🟢 চলমান' : 'Active')}
                        </span>
                      </div>

                      {/* Note / Dates */}
                      {evt.note && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '6px 0 10px', lineHeight: 1.4 }}>
                          {evt.note}
                        </p>
                      )}

                      {/* Spent & Budget Box */}
                      <div
                        style={{
                          background: 'var(--bg-main)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          border: '1px solid var(--border-color)',
                          marginBottom: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {lang === 'bn' ? 'সর্বমোট খরচ:' : 'Total Spent:'}
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                            ৳{stats.totalSpent.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {budgetNum > 0 ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              <span>{lang === 'bn' ? 'বাজেট:' : 'Budget:'} ৳{budgetNum.toLocaleString('en-IN')}</span>
                              <span style={{ fontWeight: '700', color: isOverBudget ? '#ef4444' : '#10b981' }}>
                                {isOverBudget
                                  ? (lang === 'bn' ? `⚠️ ৳${Math.abs(remaining).toLocaleString('en-IN')} বাজেট ছাড়িয়েছে!` : `Over by ৳${Math.abs(remaining).toLocaleString('en-IN')}`)
                                  : (lang === 'bn' ? `অবশিষ্ট: ৳${remaining.toLocaleString('en-IN')}` : `Remaining: ৳${remaining.toLocaleString('en-IN')}`)}
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: isOverBudget ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {lang === 'bn' ? 'কোনো নির্দিষ্ট বাজেট নির্ধারিত নেই' : 'No budget set'}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        <span>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {evt.startDate || '—'} {evt.endDate ? `হতে ${evt.endDate}` : ''}
                        </span>
                        <span>
                          <strong>{stats.count}</strong> {lang === 'bn' ? 'টি আইটেম এন্ট্রি' : 'items'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => setSelectedEventId(evt.id)}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '7px 12px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <FileText size={15} />
                        <span>{lang === 'bn' ? 'বিস্তারিত হিসাব' : 'View Details'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddExpense(evt)}
                        title={lang === 'bn' ? 'এই ইভেন্টে খরচ লিখুন' : 'Add Expense to this event'}
                        className="btn btn-secondary"
                        style={{ padding: '7px 10px', color: '#10b981' }}
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        onClick={() => handleOpenEditEvent(evt)}
                        title={lang === 'bn' ? 'ইভেন্ট এডিট' : 'Edit Event'}
                        className="btn btn-secondary"
                        style={{ padding: '7px 10px', color: 'var(--text-muted)' }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(lang === 'bn' ? `"${evt.title}" ইভেন্টটি মুছে ফেলতে চান?` : `Delete event "${evt.title}"?`)) {
                            deletePersonalEvent(evt.id);
                          }
                        }}
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        className="btn btn-secondary"
                        style={{ padding: '7px 10px', color: '#ef4444' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ---------------------------------------------------- */
        /* B. SELECTED EVENT DETAIL VIEW & EXPENSE STATEMENT    */
        /* ---------------------------------------------------- */
        <div>
          {currentEvent && (
            <>
              {/* Event Detailed Header Banner */}
              <div
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '16px',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',
                        background: (EVENT_CATEGORIES[currentEvent.category] || EVENT_CATEGORIES.other).bg,
                        color: (EVENT_CATEGORIES[currentEvent.category] || EVENT_CATEGORIES.other).color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            color: (EVENT_CATEGORIES[currentEvent.category] || EVENT_CATEGORIES.other).color,
                            textTransform: 'uppercase'
                          }}
                        >
                          {lang === 'bn'
                            ? (EVENT_CATEGORIES[currentEvent.category] || EVENT_CATEGORIES.other).labelBn
                            : (EVENT_CATEGORIES[currentEvent.category] || EVENT_CATEGORIES.other).labelEn}
                        </span>
                        <span
                          className={`badge ${currentEvent.status === 'completed' ? 'badge-info' : 'badge-success'}`}
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        >
                          {currentEvent.status === 'completed' ? (lang === 'bn' ? '✓ সম্পন্ন' : 'Completed') : (lang === 'bn' ? '🟢 চলমান' : 'Active')}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', margin: '4px 0 0' }}>
                        {currentEvent.title}
                      </h2>
                      {currentEvent.note && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {currentEvent.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={handlePrintEventStatement}
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={16} />
                      <span>{lang === 'bn' ? 'প্রিন্ট স্টেটমেন্ট' : 'Print Statement'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddExpense(currentEvent)}
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={16} />
                      <span>{lang === 'bn' ? '+ খরচ যোগ করুন' : '+ Add Expense'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditEvent(currentEvent)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px' }}
                      title={lang === 'bn' ? 'ইভেন্ট এডিট' : 'Edit Event'}
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Event Financial Progress Bar */}
                {(() => {
                  const stats = eventMetrics[currentEvent.id] || { totalSpent: 0, count: 0 };
                  const budgetNum = Number(currentEvent.budget) || 0;
                  const isOverBudget = budgetNum > 0 && stats.totalSpent > budgetNum;
                  const remaining = budgetNum > 0 ? budgetNum - stats.totalSpent : 0;
                  const pct = budgetNum > 0 ? Math.min(100, Math.round((stats.totalSpent / budgetNum) * 100)) : 0;

                  return (
                    <div
                      style={{
                        background: 'var(--bg-main)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        border: '1px solid var(--border-color)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {lang === 'bn' ? 'এই ইভেন্টে মোট খরচ:' : 'Total Event Expense:'}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
                          ৳{stats.totalSpent.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {budgetNum > 0 && (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {lang === 'bn' ? 'নির্ধারিত বাজেট:' : 'Target Budget:'}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
                            ৳{budgetNum.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}

                      {budgetNum > 0 && (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {isOverBudget ? (lang === 'bn' ? 'বাজেট ছাড়িয়েছে:' : 'Over Budget:') : (lang === 'bn' ? 'অবশিষ্ট বাজেট:' : 'Remaining Budget:')}
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isOverBudget ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                            {isOverBudget ? '-' : '+'}৳{Math.abs(remaining).toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {lang === 'bn' ? 'তারিখ ও সময়কাল:' : 'Event Duration:'}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                          {currentEvent.startDate || '—'} {currentEvent.endDate ? `থেকে ${currentEvent.endDate}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Itemized Expenses Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'এই ইভেন্টের সকল খরচের আইটেম তালিকা' : 'Itemized Expenses for this Event'} ({currentEventExpenses.length}টি)
                  </div>
                  <button
                    onClick={() => handleOpenAddExpense(currentEvent)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    <Plus size={14} />
                    <span>{lang === 'bn' ? 'নতুন আইটেম যোগ' : 'Add Item'}</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'খরচের ধরন' : 'Type'}</th>
                        <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'কি কিনলেন / বিবরণ' : 'Item / Description'}</th>
                        <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'পরিমাণ ও একক' : 'Quantity & Unit'}</th>
                        <th style={{ padding: '10px 14px' }}>{lang === 'bn' ? 'নোট / মেমো' : 'Notes'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount (৳)'}</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEventExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>📝</div>
                            <div>{lang === 'bn' ? 'এই ইভেন্টে এখনো কোনো খরচ এন্ট্রি করা হয়নি।' : 'No expenses recorded for this event yet.'}</div>
                            <button
                              onClick={() => handleOpenAddExpense(currentEvent)}
                              className="btn btn-primary"
                              style={{ marginTop: '12px' }}
                            >
                              <Plus size={14} />
                              <span>{lang === 'bn' ? '+ প্রথম খরচটি যুক্ত করুন' : '+ Add First Expense'}</span>
                            </button>
                          </td>
                        </tr>
                      ) : (
                        currentEventExpenses.map((item) => {
                          const hasQty = item.quantity !== null && item.quantity !== undefined && item.quantity !== '';

                          return (
                            <tr
                              key={item.id}
                              style={{
                                borderBottom: '1px solid var(--border-color)',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              {/* Date */}
                              <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                                  <span>{item.date}</span>
                                </div>
                              </td>

                              {/* Scope Type */}
                              <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                <span
                                  className="badge"
                                  style={{
                                    background: item.type === 'family' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                    color: item.type === 'family' ? '#ea580c' : '#10b981'
                                  }}
                                >
                                  {item.type === 'family' ? (
                                    <>
                                      <Home size={11} /> {lang === 'bn' ? 'পারিবারিক' : 'Family'}
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart size={11} /> {lang === 'bn' ? 'দৈনন্দিন' : 'Daily'}
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* Item Description */}
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                  {item.item || item.title}
                                </div>
                                {item.folder && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    📁 {item.folder}
                                  </div>
                                )}
                              </td>

                              {/* Quantity & Unit */}
                              <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                {hasQty ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      background: 'var(--bg-main)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-main)',
                                      fontWeight: '700',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    <Scale size={13} style={{ color: '#06b6d4' }} />
                                    <span>
                                      {item.quantity} {item.unit}
                                    </span>
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                                )}
                              </td>

                              {/* Note */}
                              <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {item.note || '—'}
                              </td>

                              {/* Amount */}
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ef4444', fontSize: '0.95rem' }}>
                                -৳{Number(item.amount).toLocaleString('en-IN')}
                              </td>

                              {/* Action Buttons */}
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', gap: '4px' }}>
                                  <button
                                    className="btn-icon"
                                    onClick={() => handleOpenEditExpense(item)}
                                    title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => {
                                      if (window.confirm(lang === 'bn' ? 'এই খরচের রেকর্ডটি মুছে ফেলতে চান?' : 'Delete this expense?')) {
                                        deletePersonalExpense(item.id);
                                      }
                                    }}
                                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                    style={{ color: '#ef4444' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ADD / EDIT EVENT MODAL                                */}
      {/* ======================================================== */}
      {showEventModal && (
        <div
          className="modal-overlay modal-backdrop modal-top-align"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px 14px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEventModal(false);
          }}
        >
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '520px',
              width: '95%',
              marginTop: '8px',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              padding: '1.5rem',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#ec4899' }} />
                <span>
                  {editingEvent
                    ? (lang === 'bn' ? 'ইভেন্ট / অনুষ্ঠানের তথ্য পরিবর্তন' : 'Edit Event Details')
                    : (lang === 'bn' ? 'নতুন ইভেন্ট বা অনুষ্ঠান তৈরি' : 'Create New Event')}
                </span>
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Event Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'ইভেন্ট বা অনুষ্ঠানের নাম *' : 'Event / Occasion Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: ছেলে-মেয়ের স্কুল খরচ ২০২৬, ছোট বোনের বিয়ে, বাড়ি সংস্কার...' : 'e.g. Children School Fees 2026, Wedding Ceremony...'}
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              {/* Event Category & Status in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ইভেন্টের ধরন / ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={eventFormData.category}
                    onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                  >
                    {Object.entries(EVENT_CATEGORIES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {lang === 'bn' ? config.labelBn : config.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                  </label>
                  <select
                    value={eventFormData.status}
                    onChange={(e) => setEventFormData({ ...eventFormData, status: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                  >
                    <option value="active">{lang === 'bn' ? '🟢 চলমান (Active)' : 'Active'}</option>
                    <option value="completed">{lang === 'bn' ? '🔵 সম্পন্ন (Completed)' : 'Completed'}</option>
                  </select>
                </div>
              </div>

              {/* Target Budget */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'প্রত্যাশিত বাজেট সীমা (৳ - ঐচ্ছিক)' : 'Target Budget (৳ - Optional)'}
                </label>
                <input
                  type="number"
                  placeholder="যেমন: ৫০,০০০ বা ২,০০,০০০ (খালি রাখলে সীমাহীন)"
                  value={eventFormData.budget}
                  onChange={(e) => setEventFormData({ ...eventFormData, budget: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px', fontSize: '1rem', fontWeight: '700' }}
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={eventFormData.startDate}
                    onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'সমাপ্তির তারিখ (ঐচ্ছিক)' : 'End Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={eventFormData.endDate}
                    onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'সংক্ষিপ্ত নোট বা পরিকল্পনা' : 'Description / Notes'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'অনুষ্ঠানের বিশেষ বিবরণ...' : 'Details about the event...'}
                  value={eventFormData.note}
                  onChange={(e) => setEventFormData({ ...eventFormData, note: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
                  }}
                >
                  {editingEvent
                    ? (lang === 'bn' ? 'ইভেন্ট আপডেট করুন' : 'Update Event')
                    : (lang === 'bn' ? 'ইভেন্ট তৈরি করুন' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ADD / EDIT EXPENSE (WITH CONNECTED DROPDOWNS)        */}
      {/* ======================================================== */}
      {showExpenseModal && (
        <div
          className="modal-overlay modal-backdrop modal-top-align"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px 14px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExpenseModal(false);
          }}
        >
          <div
            className="modal-content animate-scale-up"
            style={{
              maxWidth: '540px',
              width: '95%',
              marginTop: '8px',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              padding: '1.5rem',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: '#ec4899' }} />
                <span>
                  {editingExpense
                    ? (lang === 'bn' ? 'খরচের এন্ট্রি পরিবর্তন' : 'Edit Expense')
                    : (lang === 'bn' ? 'ইভেন্টে খরচ যোগ করুন' : 'Record Expense for Event')}
                </span>
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* DROPDOWN 1 & 2: Scope Type & Linked Event */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} style={{ color: '#8b5cf6' }} />
                  <span>{lang === 'bn' ? '১. খরচের ক্ষেত্র ও ইভেন্ট নির্বাচন:' : '1. Select Scope & Event:'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px' }}>
                  {/* Scope Type */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'খরচের ধরন *' : 'Expense Type *'}
                    </label>
                    <select
                      value={expenseFormData.type}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, type: e.target.value })}
                      style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem' }}
                    >
                      <option value="family">🏠 {lang === 'bn' ? 'পারিবারিক খরচ' : 'Family Expense'}</option>
                      <option value="daily">🛒 {lang === 'bn' ? 'দৈনন্দিন খরচ' : 'Daily Expense'}</option>
                    </select>
                  </div>

                  {/* Linked Event Selector */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'ইভেন্ট / অনুষ্ঠান *' : 'Event / Occasion *'}
                    </label>
                    <select
                      required
                      value={expenseFormData.eventId}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, eventId: e.target.value })}
                      style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem', fontWeight: '700' }}
                    >
                      {personalEvents.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          🎯 {evt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* If Family Expense is selected: Show Family Folder dropdown */}
                {expenseFormData.type === 'family' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'পারিবারিক ফোল্ডার' : 'Family Folder'}
                    </label>
                    <select
                      value={expenseFormData.folder}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, folder: e.target.value })}
                      style={{ width: '100%', borderRadius: '6px', fontSize: '0.86rem' }}
                    >
                      {availableFolders.map((f) => (
                        <option key={f} value={f}>
                          📁 {f}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Item Name (কি কিনলেন) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'কি কিনলেন / খরচের শিরোনাম *' : 'Item Description *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'যেমন: স্কুলের বার্ষিক বেতন, বিয়ের মিষ্টি, ডেকোরেশন খরচ...' : 'e.g. School Tuition, Sweets, Catering...'}
                  value={expenseFormData.item}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, item: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              {/* Quantity & Unit in 2 Columns */}
              <div
                style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Scale size={14} style={{ color: '#06b6d4' }} />
                    <span>{lang === 'bn' ? 'পরিমাপ ও একক (কতটুকু কিনলেন):' : 'Quantity & Unit (Measurement):'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowUnitModal(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#06b6d4',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    ⚙️ {lang === 'bn' ? 'একক তালিকা ম্যানেজ' : 'Manage Units'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
                  {/* Quantity */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'পরিমাণ (সংখ্যা)' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={lang === 'bn' ? 'যেমন: ৫০ বা ২ বা ১' : 'e.g. 50, 2, 1'}
                      value={expenseFormData.quantity}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, quantity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        fontWeight: '700'
                      }}
                    />
                  </div>

                  {/* Unit select */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      {lang === 'bn' ? 'পরিমাপের একক' : 'Unit'}
                    </label>
                    <select
                      value={expenseFormData.unit}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setShowUnitModal(true);
                        } else {
                          setExpenseFormData({ ...expenseFormData, unit: e.target.value });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      <option value="__add_new__" style={{ fontWeight: '700', color: '#06b6d4' }}>
                        ➕ {lang === 'bn' ? 'নতুন একক যোগ করুন...' : 'Add Unit...'}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Amount & Date in 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="০"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '800' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'নোট / রসিদ বা মেমো বিবরণ' : 'Notes / Memo'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'স্থান, দোকান বা ভাউচার নম্বর...' : 'Voucher or shop details...'}
                  value={expenseFormData.note}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, note: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
                  }}
                >
                  {editingExpense
                    ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Expense')
                    : (lang === 'bn' ? 'খরচ সংরক্ষণ করুন' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Units Manager Modal */}
      <CategoryManagerModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        defaultGroup="expenseUnits"
        onSelectCategory={(unit) => {
          setExpenseFormData((prev) => ({ ...prev, unit }));
        }}
      />

      {/* Export / Import Modal */}
      <DataExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        defaultTab="export"
        initialTarget="events"
      />
    </div>
  );
};

export default PersonalEventsManager;
