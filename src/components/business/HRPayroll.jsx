import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { printElement } from '../../services/printService';
import { showConfirmDialog } from '../../services/dialogService';
import {
  BadgeDollarSign,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  Phone,
  FileCheck,
  Truck,
  Package,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  Edit,
  ShoppingCart,
  ArrowRight,
  Store,
  MapPin,
  ClipboardList,
  Sparkles,
  Fingerprint,
  Send,
  QrCode
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { StaffAttendanceSheet } from './attendance/StaffAttendanceSheet';
import { MonthlyAttendanceReport } from './attendance/MonthlyAttendanceReport';
import { TelegramConfigModal } from './attendance/TelegramConfigModal';
import { StaffQrScannerModal } from './attendance/StaffQrScannerModal';
import { filterOutDemoItems } from '../../utils/demoDataSanitizer';

export const HRPayroll = () => {
  const {
    employees: rawEmployees = [],
    addEmployee,
    disburseSalary,
    businessSettings,
    t,
    lang,
    fieldOrders = [],
    createFieldOrder,
    updateFieldOrderDelivery,
    markOrderFullyDelivered,
    deleteFieldOrder,
    customers = [],
    products = [],
    activeBranch
  } = useApp();

  const employees = filterOutDemoItems(rawEmployees);

  // Primary sub-tab: 'attendance' | 'attendance_report' | 'payroll' | 'delivery'
  const [activeSubTab, setActiveSubTab] = useState('attendance');
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showQrScannerModal, setShowQrScannerModal] = useState(false);
  const [selectedEmpForQr, setSelectedEmpForQr] = useState(null);

  // ----------------------------------------------------
  // PAYROLL STATE
  // ----------------------------------------------------
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: '',
    phone: '',
    baseSalary: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + e.baseSalary, 0);
  const paidCount = employees.filter(e => e.status === 'Paid').length;
  const pendingCount = employees.length - paidCount;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.baseSalary) return;
    addEmployee(employeeForm);
    setEmployeeForm({
      name: '',
      role: '',
      phone: '',
      baseSalary: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
  };

  const handleDisburseSalary = (emp) => {
    disburseSalary(emp.id);
    triggerSoundboxPayment({
      amount: Number(emp.baseSalary) || 0,
      method: 'cash',
      customerName: emp.name,
      type: 'debt_collection'
    });
  };

  // ----------------------------------------------------
  // HR FIELD ORDERS & DELIVERY TRACKING STATE
  // ----------------------------------------------------
  const [deliverySearchTerm, setDeliverySearchTerm] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all'); // 'all' | 'delivered' | 'partial' | 'pending'
  const [deliveryEmployeeFilter, setDeliveryEmployeeFilter] = useState('all');

  // New Field Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderEmployeeId, setNewOrderEmployeeId] = useState('');
  const [newOrderCustomerId, setNewOrderCustomerId] = useState('');
  const [newOrderProductSearch, setNewOrderProductSearch] = useState('');
  const [newOrderItems, setNewOrderItems] = useState([]); // [{ productId, name, price, orderedQty, deliveredQty, subtotal }]
  const [newOrderNote, setNewOrderNote] = useState('');

  // Update Delivery Modal
  const [activeUpdatingOrder, setActiveUpdatingOrder] = useState(null);
  const [updatingItems, setUpdatingItems] = useState([]);
  const [updatingNote, setUpdatingNote] = useState('');

  // Print Delivery Slip Modal
  const [printDeliverySlipOrder, setPrintDeliverySlipOrder] = useState(null);

  // Delivery Counts
  const totalFieldOrders = fieldOrders.length;
  const deliveredOrdersCount = fieldOrders.filter(o => o.deliveryStatus === 'delivered').length;
  const partialOrdersCount = fieldOrders.filter(o => o.deliveryStatus === 'partial').length;
  const pendingOrdersCount = fieldOrders.filter(o => o.deliveryStatus === 'pending').length;

  // Filtered Field Orders
  const filteredFieldOrders = fieldOrders.filter(order => {
    // Search
    const searchLower = deliverySearchTerm.toLowerCase();
    const matchesSearch =
      order.id.toLowerCase().includes(searchLower) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
      (order.employeeName && order.employeeName.toLowerCase().includes(searchLower)) ||
      (order.customerPhone && order.customerPhone.includes(searchLower));

    // Status filter
    const matchesStatus = deliveryStatusFilter === 'all' || order.deliveryStatus === deliveryStatusFilter;

    // Employee filter
    const matchesEmployee = deliveryEmployeeFilter === 'all' || order.employeeId === deliveryEmployeeFilter;

    return matchesSearch && matchesStatus && matchesEmployee;
  });

  // Handle adding product to new order cart
  const handleAddProductToNewOrder = (prod) => {
    const existing = newOrderItems.find(i => i.productId === prod.id);
    if (existing) {
      setNewOrderItems(newOrderItems.map(i =>
        i.productId === prod.id
          ? { ...i, orderedQty: i.orderedQty + 1, subtotal: (i.orderedQty + 1) * i.price }
          : i
      ));
    } else {
      setNewOrderItems([...newOrderItems, {
        productId: prod.id,
        name: prod.name,
        price: prod.sellPrice,
        orderedQty: 1,
        deliveredQty: 0,
        subtotal: prod.sellPrice
      }]);
    }
  };

  const handleUpdateItemQty = (productId, delta) => {
    setNewOrderItems(newOrderItems.map(i => {
      if (i.productId === productId) {
        const newQty = Math.max(1, i.orderedQty + delta);
        return { ...i, orderedQty: newQty, subtotal: newQty * i.price };
      }
      return i;
    }));
  };

  const handleRemoveItem = (productId) => {
    setNewOrderItems(newOrderItems.filter(i => i.productId !== productId));
  };

  const handleCreateFieldOrderSubmit = (e) => {
    e.preventDefault();
    if (!newOrderEmployeeId || !newOrderCustomerId || newOrderItems.length === 0) return;

    const emp = employees.find(e => e.id === newOrderEmployeeId);
    const cust = customers.find(c => c.id === newOrderCustomerId);

    createFieldOrder({
      employeeId: emp?.id || '',
      employeeName: emp?.name || 'অফিসার',
      employeeRole: emp?.role || 'ফিল্ড অফিসার',
      customerId: cust?.id || '',
      customerName: cust?.name || 'দোকানদার',
      customerPhone: cust?.phone || '',
      items: newOrderItems,
      deliveryNote: newOrderNote
    });

    // Reset form
    setNewOrderEmployeeId('');
    setNewOrderCustomerId('');
    setNewOrderItems([]);
    setNewOrderNote('');
    setShowNewOrderModal(false);
  };

  // Open Update Delivery Modal
  const handleOpenUpdateDelivery = (order) => {
    setActiveUpdatingOrder(order);
    setUpdatingItems(order.items.map(item => ({ ...item })));
    setUpdatingNote(order.deliveryNote || '');
  };

  // Save Delivery Updates
  const handleSaveDeliveryUpdate = (e) => {
    e.preventDefault();
    if (!activeUpdatingOrder) return;

    updateFieldOrderDelivery(activeUpdatingOrder.id, updatingItems, updatingNote);
    setActiveUpdatingOrder(null);
  };

  // 1-Click All Delivered in Modal
  const handleSetAllDeliveredInModal = () => {
    setUpdatingItems(updatingItems.map(item => ({
      ...item,
      deliveredQty: item.orderedQty
    })));
  };

  // Calculate live status for Update Delivery modal preview
  const getLiveModalStatus = () => {
    if (!updatingItems || updatingItems.length === 0) return { status: 'pending', text: 'ডেলিভারি হয়নি', color: '#ef4444' };
    const totalOrdered = updatingItems.reduce((acc, i) => acc + Number(i.orderedQty || 0), 0);
    const totalDelivered = updatingItems.reduce((acc, i) => acc + Number(i.deliveredQty || 0), 0);

    if (totalDelivered === totalOrdered && totalOrdered > 0) {
      return { status: 'delivered', text: `🟢 সবগুলো পণ্য (${totalDelivered}/${totalOrdered}) ডেলিভারি সম্পন্ন`, color: '#10b981' };
    } else if (totalDelivered > 0) {
      const remaining = totalOrdered - totalDelivered;
      return { status: 'partial', text: `🟡 আংশিক ডেলিভারি (${totalDelivered}টি ডেলিভারি হয়েছে, ${remaining}টি বাকি/কম)`, color: '#f59e0b' };
    } else {
      return { status: 'pending', text: '🔴 ডেলিভারি হয়নি (০টি ডেলিভারি)', color: '#ef4444' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--business-primary)' }} />
            <span>{lang === 'bn' ? 'এইচআর ও ফিল্ড টিম অপারেশন হাব' : 'HR & Field Operations Hub'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn'
              ? 'HR কর্মীদের ফিল্ড প্রোডাক্ট কাটিং, ডেলিভারি ট্র্যাকিং ও কর্মচারীদের বেতন ম্যানেজমেন্ট'
              : 'Field product cutting, order delivery status tracking, and staff salary management'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary press-scale"
            style={{
              borderColor: 'rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              fontWeight: '800',
              background: 'rgba(16, 185, 129, 0.08)'
            }}
            onClick={() => {
              setSelectedEmpForQr(null);
              setShowQrScannerModal(true);
            }}
          >
            <QrCode size={16} />
            <span>{lang === 'bn' ? '📷 কিউআর হাজিরা টার্মিনাল' : 'QR Attendance Terminal'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary press-scale"
            style={{
              borderColor: 'rgba(56, 189, 248, 0.4)',
              color: '#0284c7',
              fontWeight: '800',
              background: 'rgba(56, 189, 248, 0.08)'
            }}
            onClick={() => {
              if (window.__openFieldForceRadar) window.__openFieldForceRadar();
            }}
            title={lang === 'bn' ? 'সেলসম্যান ও ফিল্ড কর্মীদের লাইভ লোকেশন ম্যাপ' : 'Field Force Live GPS Radar'}
          >
            <MapPin size={16} />
            <span>{lang === 'bn' ? '📍 লাইভ জিপিএস রাডার' : 'Live GPS Radar'}</span>
          </button>

          {activeSubTab === 'delivery' ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (employees.length > 0 && !newOrderEmployeeId) setNewOrderEmployeeId(employees[0].id);
                if (customers.length > 0 && !newOrderCustomerId) setNewOrderCustomerId(customers[0].id);
                setShowNewOrderModal(true);
              }}
            >
              <Plus size={16} />
              <span>{lang === 'bn' ? '+ নতুন ফিল্ড অর্ডার কাটুন' : '+ Book Field Order'}</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>{t.business.addEmployee}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sub-Tab Switcher (Horizontal Touch Strip) */}
      <div className="horizontal-touch-strip" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`btn ${activeSubTab === 'attendance' ? 'btn-primary' : 'btn-secondary'} press-scale`}
          style={{ padding: '8px 16px', fontSize: '0.88rem', fontWeight: '800', whiteSpace: 'nowrap' }}
        >
          <Fingerprint size={17} />
          <span>{lang === 'bn' ? '🕒 ডেইলি স্টাফ হাজিরা (Anti-Cheat)' : 'Daily Attendance'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance_report')}
          className={`btn ${activeSubTab === 'attendance_report' ? 'btn-primary' : 'btn-secondary'} press-scale`}
          style={{ padding: '8px 16px', fontSize: '0.88rem', fontWeight: '800', whiteSpace: 'nowrap' }}
        >
          <Calendar size={17} />
          <span>{lang === 'bn' ? '📊 মাসিক হাজিরা ও স্যালারি সামারি' : 'Attendance Register & Pay'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`btn ${activeSubTab === 'payroll' ? 'btn-primary' : 'btn-secondary'} press-scale`}
          style={{ padding: '8px 16px', fontSize: '0.88rem', fontWeight: '800', whiteSpace: 'nowrap' }}
        >
          <Users size={17} />
          <span>{lang === 'bn' ? '👥 কর্মচারী তালিকা ও মূল বেতন' : 'Staff & Roster'}</span>
          <span className="badge" style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', fontSize: '0.75rem' }}>
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('delivery')}
          className={`btn ${activeSubTab === 'delivery' ? 'btn-primary' : 'btn-secondary'} press-scale`}
          style={{ padding: '8px 16px', fontSize: '0.88rem', fontWeight: '800', whiteSpace: 'nowrap' }}
        >
          <Truck size={17} />
          <span>{lang === 'bn' ? '📦 ফিল্ড কাটিং ও ডেলিভারি' : 'Field Orders'}</span>
          <span className="badge" style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', fontSize: '0.75rem' }}>
            {totalFieldOrders}
          </span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* SUB-TAB: ATTENDANCE (DAILY ROLL CALL)                */}
      {/* ==================================================== */}
      {activeSubTab === 'attendance' && (
        <StaffAttendanceSheet
          employees={employees}
          onOpenTelegramModal={() => setShowTelegramModal(true)}
        />
      )}

      {/* ==================================================== */}
      {/* SUB-TAB: ATTENDANCE REGISTER & MONTHLY PAYROLL       */}
      {/* ==================================================== */}
      {activeSubTab === 'attendance_report' && (
        <MonthlyAttendanceReport
          employees={employees}
        />
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 1: PRODUCT CUTTING & DELIVERY TRACKING       */}
      {/* ==================================================== */}
      {activeSubTab === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top 4 Delivery Summary Stat Cards */}
          <div className="stats-grid">
            {/* 1. Total Orders */}
            <div className="glass-card stat-card glow-card" style={{ cursor: 'pointer' }} onClick={() => setDeliveryStatusFilter('all')}>
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <ClipboardList size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মোট ফিল্ড অর্ডার কাটা' : 'Total Orders Cut'}</h3>
                <div className="stat-value">{totalFieldOrders}</div>
                <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'সকল ফিল্ড বুকিং' : 'All Field Bookings'}
                </div>
              </div>
            </div>

            {/* 2. Full Delivered */}
            <div className="glass-card stat-card glow-card" style={{ cursor: 'pointer', borderLeft: '4px solid #10b981' }} onClick={() => setDeliveryStatusFilter('delivered')}>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#10b981' }}>{lang === 'bn' ? '🟢 ডেলিভারি সম্পন্ন' : 'Delivered (Full)'}</h3>
                <div className="stat-value" style={{ color: '#10b981' }}>{deliveredOrdersCount}</div>
                <div className="stat-trend" style={{ color: '#10b981' }}>
                  {lang === 'bn' ? 'সবগুলো প্রোডাক্ট ডেলিভারি হয়েছে' : '100% Items Delivered'}
                </div>
              </div>
            </div>

            {/* 3. Partial Delivered */}
            <div className="glass-card stat-card glow-card" style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b' }} onClick={() => setDeliveryStatusFilter('partial')}>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#f59e0b' }}>{lang === 'bn' ? '🟡 আংশিক ডেলিভারি' : 'Partial Delivery'}</h3>
                <div className="stat-value" style={{ color: '#f59e0b' }}>{partialOrdersCount}</div>
                <div className="stat-trend" style={{ color: '#f59e0b' }}>
                  {lang === 'bn' ? 'কিছু প্রোডাক্ট কম / বাকি হয়েছে' : 'Some Items Remaining'}
                </div>
              </div>
            </div>

            {/* 4. Not Delivered / Pending */}
            <div className="glass-card stat-card glow-card" style={{ cursor: 'pointer', borderLeft: '4px solid #ef4444' }} onClick={() => setDeliveryStatusFilter('pending')}>
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3 style={{ color: '#ef4444' }}>{lang === 'bn' ? '🔴 ডেলিভারি হয়নি' : 'Not Delivered'}</h3>
                <div className="stat-value" style={{ color: '#ef4444' }}>{pendingOrdersCount}</div>
                <div className="stat-trend" style={{ color: '#ef4444' }}>
                  {lang === 'bn' ? 'ডেলিভারি অপেক্ষমাণ / বাকি' : 'Pending Dispatch'}
                </div>
              </div>
            </div>
          </div>

          {/* Search, Status Filters & Employee Filter Toolbar */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'অর্ডার নং, দোকানদার বা কর্মচারীর নাম দিয়ে খুঁজুন...' : 'Search by order no, customer, employee...'}
                  value={deliverySearchTerm}
                  onChange={(e) => setDeliverySearchTerm(e.target.value)}
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '0.88rem' }}
                />
              </div>

              {/* HR Employee Filter Dropdown */}
              <div style={{ flex: '0 1 220px' }}>
                <select
                  className="input-field"
                  value={deliveryEmployeeFilter}
                  onChange={(e) => setDeliveryEmployeeFilter(e.target.value)}
                  style={{ height: '38px', fontSize: '0.85rem' }}
                >
                  <option value="all">{lang === 'bn' ? '👤 সব কর্মচারী / HR স্টাফ' : 'All Staff Members'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="horizontal-touch-strip" style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => setDeliveryStatusFilter('all')}
                className={`btn ${deliveryStatusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                {lang === 'bn' ? 'সবগুলো' : 'All'} ({totalFieldOrders})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryStatusFilter('delivered')}
                className={`btn ${deliveryStatusFilter === 'delivered' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  background: deliveryStatusFilter === 'delivered' ? '#10b981' : undefined,
                  borderColor: '#10b981',
                  color: deliveryStatusFilter === 'delivered' ? '#fff' : '#10b981'
                }}
              >
                🟢 {lang === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered'} ({deliveredOrdersCount})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryStatusFilter('partial')}
                className={`btn ${deliveryStatusFilter === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  background: deliveryStatusFilter === 'partial' ? '#f59e0b' : undefined,
                  borderColor: '#f59e0b',
                  color: deliveryStatusFilter === 'partial' ? '#fff' : '#f59e0b'
                }}
              >
                🟡 {lang === 'bn' ? 'আংশিক ডেলিভারি / কম' : 'Partial Delivery'} ({partialOrdersCount})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryStatusFilter('pending')}
                className={`btn ${deliveryStatusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  background: deliveryStatusFilter === 'pending' ? '#ef4444' : undefined,
                  borderColor: '#ef4444',
                  color: deliveryStatusFilter === 'pending' ? '#fff' : '#ef4444'
                }}
              >
                🔴 {lang === 'bn' ? 'ডেলিভারি হয়নি' : 'Not Delivered'} ({pendingOrdersCount})
              </button>
            </div>
          </div>

          {/* Orders List / Cards */}
          {filteredFieldOrders.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={42} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>
                {lang === 'bn' ? 'কোনো ফিল্ড অর্ডার রেকর্ড পাওয়া যায়নি' : 'No Field Orders Found'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {lang === 'bn' ? 'নতুন ফিল্ড অর্ডার কাটতে ওপরের "+ নতুন ফিল্ড অর্ডার কাটুন" বাটনে চাপ দিন' : 'Click "+ Book Field Order" above to create an order'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredFieldOrders.map((order) => {
                const isDelivered = order.deliveryStatus === 'delivered';
                const isPartial = order.deliveryStatus === 'partial';
                const isPending = order.deliveryStatus === 'pending';

                // Status configuration
                let badgeBg = 'rgba(239, 68, 68, 0.12)';
                let badgeColor = '#ef4444';
                let badgeText = lang === 'bn' ? '🔴 ডেলিভারি হয়নি (পেন্ডিং)' : '🔴 Not Delivered';
                let badgeBorder = '#ef4444';

                if (isDelivered) {
                  badgeBg = 'rgba(16, 185, 129, 0.12)';
                  badgeColor = '#10b981';
                  badgeText = lang === 'bn' ? '🟢 ডেলিভারি সম্পন্ন' : '🟢 Delivered (Full)';
                  badgeBorder = '#10b981';
                } else if (isPartial) {
                  badgeBg = 'rgba(245, 158, 11, 0.12)';
                  badgeColor = '#f59e0b';
                  badgeText = lang === 'bn' ? '🟡 আংশিক ডেলিভারি' : '🟡 Partial Delivery';
                  badgeBorder = '#f59e0b';
                }

                return (
                  <div
                    key={order.id}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderLeft: `5px solid ${badgeColor}`,
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Order ID, Staff, Customer & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                            {order.id}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {order.date}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--business-primary)', fontWeight: '700' }}>
                            <Users size={14} />
                            <span>{order.employeeName} ({order.employeeRole || 'ফিল্ড অফিসার'})</span>
                          </span>

                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: '600' }}>
                            <Store size={14} />
                            <span>{order.customerName}</span>
                          </span>

                          {order.customerPhone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              <Phone size={12} />
                              <span>{order.customerPhone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prominent Delivery Status Badge */}
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontWeight: '800',
                            fontSize: '0.85rem'
                          }}
                        >
                          {badgeText}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: badgeColor, fontWeight: '700', marginTop: '3px' }}>
                          {order.deliverySummary}
                        </div>
                      </div>
                    </div>

                    {/* Products Itemized Delivery Breakdown Table */}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700' }}>
                        <span>পণ্য তালিকা ও ডেলিভারি বিবরণ ({order.items.length}টি আইটেম)</span>
                        <span style={{ color: 'var(--business-primary)' }}>মোট অর্ডার মূল্য: ৳{order.totalAmount.toLocaleString()}</span>
                      </div>

                      <div className="table-responsive" style={{ margin: 0 }}>
                        <table className="data-table" style={{ fontSize: '0.82rem', width: '100%' }}>
                          <thead>
                            <tr style={{ background: 'transparent' }}>
                              <th style={{ padding: '6px 10px' }}>পণ্যের নাম</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px' }}>অর্ডারকৃত সংখ্যা</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px' }}>ডেলিভারি হয়েছে</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px' }}>বাকি / ঘাটতি</th>
                              <th style={{ textAlign: 'center', padding: '6px 10px' }}>অবস্থা</th>
                              <th style={{ textAlign: 'right', padding: '6px 10px' }}>মূল্য</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => {
                              const remaining = Math.max(0, item.orderedQty - (item.deliveredQty || 0));
                              const itemDelivered = (item.deliveredQty || 0) >= item.orderedQty;
                              const itemPartial = (item.deliveredQty || 0) > 0 && (item.deliveredQty || 0) < item.orderedQty;

                              return (
                                <tr key={idx} style={{ borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                  <td style={{ padding: '8px 10px', fontWeight: '700' }}>
                                    {item.name}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '8px 10px', fontWeight: '700' }}>
                                    {item.orderedQty} পিস
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: itemDelivered ? 'rgba(16, 185, 129, 0.15)' : (itemPartial ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                                        color: itemDelivered ? '#10b981' : (itemPartial ? '#f59e0b' : '#ef4444'),
                                        fontWeight: '800'
                                      }}
                                    >
                                      {item.deliveredQty || 0} পিস
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                                    {remaining > 0 ? (
                                      <span style={{ color: '#ef4444', fontWeight: '800' }}>
                                        {remaining} পিস বাকি
                                      </span>
                                    ) : (
                                      <span style={{ color: '#10b981', fontWeight: '700' }}>
                                        ✓ সম্পন্ন
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                                    {itemDelivered ? (
                                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem' }}>
                                        সম্পূর্ণ
                                      </span>
                                    ) : itemPartial ? (
                                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem' }}>
                                        কম হয়েছে (-{remaining})
                                      </span>
                                    ) : (
                                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.72rem' }}>
                                        ডেলিভারি হয়নি
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '8px 10px', fontWeight: '700' }}>
                                    ৳{(item.subtotal || item.price * item.orderedQty).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Delivery Note & Details */}
                    {order.deliveryNote && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid var(--border-color)' }}>
                        <strong>মন্তব্য / নোট:</strong> {order.deliveryNote}
                        {order.deliveryDate && <span> (আপডেট: {order.deliveryDate})</span>}
                      </div>
                    )}

                    {/* Action Bar (Update Delivery, Print Slip, Delete) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* 1-Click Fully Delivered quick button */}
                        {!isDelivered && (
                          <button
                            type="button"
                            onClick={() => markOrderFullyDelivered(order.id)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: '700', color: '#10b981', borderColor: '#10b981' }}
                            title="এক ক্লিকে সবগুলো পণ্য ডেলিভারি সম্পন্ন করুন"
                          >
                            <CheckCircle2 size={14} />
                            <span>সব ডেলিভারি সম্পন্ন</span>
                          </button>
                        )}

                        {/* Interactive Update Delivery Modal button */}
                        <button
                          type="button"
                          onClick={() => handleOpenUpdateDelivery(order)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: '700' }}
                        >
                          <Truck size={14} />
                          <span>ডেলিভারি আপডেট করুন</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Print Challan / Delivery Slip */}
                        <button
                          type="button"
                          onClick={() => setPrintDeliverySlipOrder(order)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Printer size={14} />
                          <span>ডেলিভারি স্লিপ</span>
                        </button>

                        {/* Delete Order */}
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await showConfirmDialog({
                              title: lang === 'bn' ? 'অর্ডার মুছে ফেলবেন?' : 'Delete Field Order?',
                              message: lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই ফিল্ড অর্ডারটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this field order?',
                              confirmText: lang === 'bn' ? 'মুছে ফেলুন' : 'Delete',
                              type: 'danger'
                            });
                            if (ok) {
                              deleteFieldOrder(order.id);
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#ef4444' }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 2: EMPLOYEE ROSTER & PAYROLL                 */}
      {/* ==================================================== */}
      {activeSubTab === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top HR Stats */}
          <div className="stats-grid">
            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <Users size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মোট সক্রিয় কর্মচারী' : 'Total Employees'}</h3>
                <div className="stat-value">{employees.length}</div>
                <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? 'স্টাফ ও টিম সদস্য' : 'Staff Members'}
                </div>
              </div>
            </div>

            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <BadgeDollarSign size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'মাসিক মোট স্যালারি বাজেট' : 'Monthly Payroll Budget'}</h3>
                <div className="stat-value">৳{totalMonthlyPayroll.toLocaleString()}</div>
                <div className="stat-trend" style={{ color: '#10b981' }}>
                  {paidCount} {lang === 'bn' ? 'জনের পরিশোধিত' : 'Paid'}
                </div>
              </div>
            </div>

            <div className="glass-card stat-card glow-card">
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{lang === 'bn' ? 'বকেয়া স্যালারি' : 'Pending Disbursements'}</h3>
                <div className="stat-value" style={{ color: pendingCount > 0 ? '#f59e0b' : '#10b981' }}>
                  {pendingCount}
                </div>
                <div className="stat-trend" style={{ color: pendingCount > 0 ? '#f59e0b' : '#10b981' }}>
                  {pendingCount > 0 ? (lang === 'bn' ? 'বেতন বিতরণ বাকি' : 'Needs Payout') : (lang === 'bn' ? 'সবাই পরিশোধিত' : 'All Cleared')}
                </div>
              </div>
            </div>
          </div>

          {/* Staff & Payroll Roster Table */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>
              {lang === 'bn' ? 'কর্মচারীদের তালিকা ও বেতন প্রদান রেকর্ড' : 'Employee Roster & Salary Disbursement'}
            </h3>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.business.employeeName}</th>
                    <th>{t.business.role}</th>
                    <th>{lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}</th>
                    <th style={{ textAlign: 'right' }}>{t.business.baseSalary}</th>
                    <th style={{ textAlign: 'center' }}>{t.business.payStatus}</th>
                    <th style={{ textAlign: 'center' }}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Phone size={11} style={{ display: 'inline', marginRight: '4px' }} />
                          {emp.phone}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                          {emp.role}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {emp.joinDate}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.95rem' }}>
                        ৳{emp.baseSalary.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${emp.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {emp.status === 'Paid' ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') : (lang === 'bn' ? 'বকেয়া' : 'Pending')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: '#10b981',
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              fontWeight: '700'
                            }}
                            onClick={() => {
                              setSelectedEmpForQr(emp);
                              setShowQrScannerModal(true);
                            }}
                            title={lang === 'bn' ? `${emp.name}-এর কিউআর হাজিরা দিন` : `QR Attendance for ${emp.name}`}
                          >
                            <QrCode size={13} />
                            <span>{lang === 'bn' ? 'হাজিরা' : 'Punch'}</span>
                          </button>

                          {emp.status !== 'Paid' ? (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => handleDisburseSalary(emp)}
                            >
                              <FileCheck size={13} />
                              <span>{t.business.disburseSalary}</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => setSelectedPaySlip(emp)}
                              title={lang === 'bn' ? 'পে-স্লিপ প্রিন্ট করুন' : 'Print Payslip'}
                            >
                              <Printer size={13} />
                              <span>{lang === 'bn' ? 'পে-স্লিপ' : 'Slip'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: NEW FIELD ORDER BOOKING                       */}
      {/* ==================================================== */}
      {showNewOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'নতুন ফিল্ড প্রোডাক্ট অর্ডার বুক করুন' : 'Book New Field Order'}</span>
            </h3>

            <form onSubmit={handleCreateFieldOrderSubmit}>
              {/* Employee and Customer Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>HR স্টাফ / অর্ডার কাটার অফিসার *</label>
                  <select
                    className="input-field"
                    value={newOrderEmployeeId}
                    onChange={(e) => setNewOrderEmployeeId(e.target.value)}
                    required
                  >
                    <option value="">-- স্টাফ নির্বাচন করুন --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>দোকান / কাস্টমার নির্বাচন করুন *</label>
                  <select
                    className="input-field"
                    value={newOrderCustomerId}
                    onChange={(e) => setNewOrderCustomerId(e.target.value)}
                    required
                  >
                    <option value="">-- দোকান বাছাই করুন --</option>
                    {customers.map(cust => (
                      <option key={cust.id} value={cust.id}>{cust.name} ({cust.phone || 'ফোন নেই'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Selection List */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>পণ্য নির্বাচন করুন (ক্লিক করে অর্ডারে যোগ করুন)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="পণ্যের নাম লিখে ফিল্টার করুন..."
                  value={newOrderProductSearch}
                  onChange={(e) => setNewOrderProductSearch(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  {products
                    .filter(p => p.name.toLowerCase().includes(newOrderProductSearch.toLowerCase()))
                    .map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleAddProductToNewOrder(prod)}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{prod.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--business-primary)', fontWeight: '700' }}>
                          ৳{prod.sellPrice}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Order Cart Items List */}
              <div style={{ marginBottom: '12px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.82rem', fontWeight: '700' }}>
                  <span>অর্ডারকৃত পণ্য তালিকা:</span>
                  <span>{newOrderItems.length} প্রকার</span>
                </div>

                {newOrderItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    ওপর থেকে পণ্য ক্লিক করে যোগ করুন
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {newOrderItems.map(item => (
                      <div
                        key={item.productId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 8px',
                          background: 'var(--bg-primary)',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            একক: ৳{item.price} • মোট: ৳{item.subtotal}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.productId, -1)}
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}
                          >
                            -
                          </button>
                          <strong style={{ minWidth: '24px', textAlign: 'center' }}>{item.orderedQty}</strong>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.productId, 1)}
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="btn btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '0.75rem', color: '#ef4444', height: '24px', marginLeft: '4px' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)', fontWeight: '800', fontSize: '0.95rem' }}>
                      <span>মোট টাকা:</span>
                      <span style={{ color: 'var(--business-primary)' }}>
                        ৳{newOrderItems.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Note */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>অর্ডার বা ডেলিভারি নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: দ্রুত ডেলিভারির তাগিদ রয়েছে..."
                  value={newOrderNote}
                  onChange={(e) => setNewOrderNote(e.target.value)}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={newOrderItems.length === 0 || !newOrderEmployeeId || !newOrderCustomerId}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', fontWeight: '700' }}
                >
                  <CheckCircle2 size={16} />
                  <span>অর্ডার সংরক্ষণ ও কাটিং রেকর্ড তৈরি করুন</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewOrderModal(false)}
                >
                  {t.close}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: UPDATE DELIVERY STATUS & ITEM QUANTITIES      */}
      {/* ==================================================== */}
      {activeUpdatingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} style={{ color: 'var(--business-primary)' }} />
              <span>ডেলিভারি স্ট্যাটাস ও প্রোডাক্ট সংখ্যা আপডেট করুন</span>
            </h3>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              অর্ডার নং: <strong>{activeUpdatingOrder.id}</strong> • কাস্টমার: <strong>{activeUpdatingOrder.customerName}</strong>
            </div>

            {/* Quick 1-Click All Delivered Button */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#10b981', fontSize: '0.88rem' }}>সবগুলো পণ্য ডেলিভারি হয়েছে?</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>১-ক্লিকে সব আইটেম ১০০% ডেলিভারি সেট করুন</div>
              </div>
              <button
                type="button"
                onClick={handleSetAllDeliveredInModal}
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                ✓ সব ডেলিভারি সম্পন্ন
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryUpdate}>
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {updatingItems.map((item, idx) => {
                  const rem = Math.max(0, item.orderedQty - (Number(item.deliveredQty) || 0));
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{item.name}</strong>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          অর্ডারকৃত: <strong>{item.orderedQty} পিস</strong> • বাকি/কম: <strong style={{ color: rem > 0 ? '#ef4444' : '#10b981' }}>{rem} পিস</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ডেলিভারি:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQty}
                          value={item.deliveredQty}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(item.orderedQty, Number(e.target.value) || 0));
                            setUpdatingItems(updatingItems.map((it, i) => i === idx ? { ...it, deliveredQty: val } : it));
                          }}
                          className="input-field"
                          style={{ width: '70px', textAlign: 'center', fontWeight: '800', height: '34px', fontSize: '0.9rem' }}
                        />
                        <span style={{ fontSize: '0.78rem' }}>/ {item.orderedQty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Status Preview Banner */}
              {(() => {
                const live = getLiveModalStatus();
                return (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${live.color}`,
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>আপডেটের পর স্ট্যাটাস হবে:</span>
                    <strong style={{ color: live.color, fontSize: '0.9rem' }}>{live.text}</strong>
                  </div>
                );
              })()}

              {/* Delivery Note */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>ডেলিভারি বিবরণ / নোট</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="যেমন: ৩ পিস স্টকে ঘাটতি থাকায় পরে দেওয়া হবে..."
                  value={updatingNote}
                  onChange={(e) => setUpdatingNote(e.target.value)}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.9rem', fontWeight: '800' }}
                >
                  <CheckCircle2 size={16} />
                  <span>সংরক্ষণ করুন</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveUpdatingOrder(null)}
                >
                  {t.close}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PRINT DELIVERY CHALLAN / SLIP                 */}
      {/* ==================================================== */}
      {printDeliverySlipOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', width: '95%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} style={{ color: 'var(--business-primary)' }} />
              <span>ডেলিভারি চালান ও রসিদ প্রিভিউ</span>
            </h3>

            <div
              id="printable-delivery-challan"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: "'Courier New', monospace"
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>
                {activeBranch?.name || businessSettings?.companyName || 'হিসাব কিতাব ৩৬০'}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', margin: '2px 0 8px' }}>
                ফিল্ড প্রোডাক্ট ডেলিভারি চালান ও প্রাপ্তি স্বীকার
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>চালান নং:</span>
                <strong>{printDeliverySlipOrder.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>তারিখ:</span>
                <span>{printDeliverySlipOrder.deliveryDate || printDeliverySlipOrder.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>এইচআর অফিসার:</span>
                <span>{printDeliverySlipOrder.employeeName}</span>
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>দোকান / গ্রাহক:</span>
                <strong>{printDeliverySlipOrder.customerName}</strong>
              </div>
              {printDeliverySlipOrder.customerPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>মোবাইল:</span>
                  <span>{printDeliverySlipOrder.customerPhone}</span>
                </div>
              )}

              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              {/* Items Table */}
              <div style={{ fontWeight: '800', margin: '6px 0 4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>পণ্য ও বিবরণ</span>
                <span>অর্ডার / ডেলিভারি</span>
              </div>

              {printDeliverySlipOrder.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>{idx + 1}. {it.name}</span>
                  <strong>{it.deliveredQty || 0} / {it.orderedQty}</strong>
                </div>
              ))}

              <div style={{ borderTop: '1px dashed #000', margin: '8px 0 6px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>ডেলিভারি অবস্থা:</span>
                <span>{printDeliverySlipOrder.deliveryStatus === 'delivered' ? 'ডেলিভারি সম্পন্ন' : (printDeliverySlipOrder.deliveryStatus === 'partial' ? 'আংশিক ডেলিভারি' : 'ডেলিভারি হয়নি')}</span>
              </div>

              {printDeliverySlipOrder.deliveryNote && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '11px' }}>
                  নোট: {printDeliverySlipOrder.deliveryNote}
                </div>
              )}

              <div style={{ marginTop: '35px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>গ্রাহকের স্বাক্ষর ও সিল</span>
                <span style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>ডেলিভারিম্যানের স্বাক্ষর</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => printElement('printable-delivery-challan', { title: 'Delivery Challan - ' + printDeliverySlipOrder.id, paperType: 'receipt' })}
              >
                <Printer size={16} />
                <span>প্রিন্ট করুন</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPrintDeliverySlipOrder(null)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD EMPLOYEE                                  */}
      {/* ==================================================== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>
              {t.business.addEmployee}
            </h3>

            {/* Smart Voice Auto-Fill Banner for Employee */}
            <div style={{ marginBottom: '1rem' }}>
              <SmartVoiceFormBanner
                mode="customer"
                lang={lang}
                onParsed={(parsed) => {
                  setEmployeeForm(prev => ({
                    ...prev,
                    name: parsed.name || prev.name,
                    phone: parsed.phone || prev.phone
                  }));
                }}
              />
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>{t.business.employeeName} *</label>
                  <VoiceInputButton
                    onTranscript={(txt) => setEmployeeForm(prev => ({ ...prev, name: txt }))}
                    title="মুখে বলুন কর্মচারীর নাম"
                    size={13}
                  />
                </div>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder={lang === 'bn' ? 'যেমন: মোঃ রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>{t.business.role} *</label>
                    <VoiceInputButton
                      onTranscript={(txt) => setEmployeeForm(prev => ({ ...prev, role: txt }))}
                      title="মুখে বলুন পদবী"
                      size={13}
                    />
                  </div>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: ফিল্ড অফিসার / ক্যাশিয়ার' : 'e.g. Field Officer'}
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{t.business.phone}</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="01700-000000"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>{t.business.baseSalary} *</label>
                    <VoiceInputButton
                      onTranscript={(txt) => {
                        const num = Number(txt.replace(/[^0-9]/g, ''));
                        if (num) setEmployeeForm(prev => ({ ...prev, baseSalary: num }));
                      }}
                      title="মুখে বলুন বেতন"
                      size={13}
                    />
                  </div>
                  <input
                    type="number"
                    required
                    className="input-field"
                    placeholder="25000"
                    value={employeeForm.baseSalary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>{lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}</label>
                  <input
                    type="date"
                    className="input-field"
                    value={employeeForm.joinDate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, joinDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {t.save}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SALARY PAYSLIP / VOUCHER                      */}
      {/* ==================================================== */}
      {selectedPaySlip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', width: '95%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} style={{ color: 'var(--business-primary)' }} />
              <span>{lang === 'bn' ? 'কর্মচারী পে-স্লিপ ও বেতন রসিদ' : 'Employee Salary Payslip'}</span>
            </h3>

            <div
              id="printable-salary-voucher"
              style={{
                background: '#ffffff',
                color: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: "'Courier New', monospace"
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>
                {activeBranch?.name || businessSettings?.companyName || 'হিসাব কিতাব ৩৬০'}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569', margin: '2px 0 8px' }}>
                কর্মচারী বেতন বিতরণ ভাউচার (Salary Voucher)
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Employee Name:</span>
                <strong>{selectedPaySlip.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Designation:</span>
                <span>{selectedPaySlip.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Phone:</span>
                <span>{selectedPaySlip.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>Date:</span>
                <span>{selectedPaySlip.lastDisbursed || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800' }}>
                <span>Disbursed Amount:</span>
                <span>৳{selectedPaySlip.baseSalary.toLocaleString()}</span>
              </div>

              <div style={{ borderTop: '1px dashed #94a3b8', margin: '14px 0 8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '10px', color: '#64748b' }}>
                <span>Employee Signature</span>
                <span>Authorized Signatory</span>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => printElement('printable-salary-voucher', { title: 'Salary Voucher - ' + selectedPaySlip.name, paperType: 'receipt' })}
              >
                <Printer size={16} />
                <span>{lang === 'bn' ? 'স্লিপ প্রিন্ট করুন' : 'Print Voucher'}</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedPaySlip(null)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM BOT NOTIFICATION CONFIG MODAL */}
      {showTelegramModal && (
        <TelegramConfigModal
          isOpen={showTelegramModal}
          onClose={() => setShowTelegramModal(false)}
          totalStaff={employees.length}
        />
      )}

      {/* STAFF QR ATTENDANCE MODAL */}
      {showQrScannerModal && (
        <StaffQrScannerModal
          isOpen={showQrScannerModal}
          onClose={() => {
            setShowQrScannerModal(false);
            setSelectedEmpForQr(null);
          }}
          employees={employees}
          defaultEmployee={selectedEmpForQr}
        />
      )}
    </div>
  );
};
