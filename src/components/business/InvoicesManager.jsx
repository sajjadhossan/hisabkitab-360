import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  AlertCircle,
  Building,
  DollarSign,
  TrendingUp,
  X,
  CreditCard,
  User,
  RotateCcw,
  Edit3,
  AlertTriangle,
  ShoppingBag,
  PackageCheck,
  Calendar,
  Layers,
  MessageCircle,
  Download
} from 'lucide-react';
import { printInvoiceDirectly, printReceiptDirectly } from '../../services/printService';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { exportInvoicesToCSV } from '../../services/exportService';

export const InvoicesManager = () => {
  const {
    invoices,
    addInvoice,
    editInvoice,
    processSalesReturn,
    updateInvoiceStatus,
    recordInvoicePayment,
    deleteInvoice,
    openInvoicePrint,
    openShareInvoice,
    products,
    customers,
    businessSettings,
    lang,
    t,
    showToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | paid | partial | unpaid | returned
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Payment Collection Modal State
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('cash');
  const [collectDate, setCollectDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [collectNote, setCollectNote] = useState('');

  // ----------------------------------------------------
  // SALES RETURN MODAL STATE
  // ----------------------------------------------------
  const [selectedReturnInvoice, setSelectedReturnInvoice] = useState(null);
  const [returnItemsState, setReturnItemsState] = useState([]);
  const [refundType, setRefundType] = useState('deduct_due'); // 'deduct_due' | 'cash_refund'
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('');
  const [restockToInventory, setRestockToInventory] = useState(true);

  // ----------------------------------------------------
  // EDIT INVOICE MODAL STATE
  // ----------------------------------------------------
  const [selectedEditInvoice, setSelectedEditInvoice] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Form State for New Invoice
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('Net 14 Days');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [vatRate, setVatRate] = useState(businessSettings.vatRate || 5);

  // Partial Payment Form Controls
  const [paymentType, setPaymentType] = useState('partial'); // 'paid' | 'partial' | 'due'
  const [customPaidAmount, setCustomPaidAmount] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Item rows: [{ id, name, sku, qty, price, subtotal }]
  const [items, setItems] = useState([
    { id: `it-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }
  ]);

  // Handle customer dropdown selection
  const handleCustomerChange = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find(c => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
      setCustomerAddress(found.address || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setItems([
      ...items,
      { id: `it-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (rowId) => {
    if (items.length > 1) {
      setItems(items.filter(it => it.id !== rowId));
    }
  };

  // Handle Item Row change
  const handleItemChange = (rowId, field, value) => {
    setItems(items.map(row => {
      if (row.id !== rowId) return row;

      const updated = { ...row, [field]: value };

      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated.name = prod.name;
          updated.sku = prod.sku;
          updated.price = prod.sellPrice;
          updated.subtotal = prod.sellPrice * updated.qty;
        }
      } else if (field === 'qty' || field === 'price') {
        const q = field === 'qty' ? Number(value) : row.qty;
        const p = field === 'price' ? Number(value) : row.price;
        updated.subtotal = q * p;
      }

      return updated;
    }));
  };

  // Real-time calculations for new invoice
  const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  const discount = Math.min(Number(discountAmount) || 0, subtotal);
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = Math.round(taxableAmount * (Number(vatRate) / 100));
  const grandTotal = taxableAmount + vat;

  // Compute calculated paid and due amounts based on paymentType
  let calculatedPaid = 0;
  if (paymentType === 'paid') {
    calculatedPaid = grandTotal;
  } else if (paymentType === 'partial') {
    calculatedPaid = Math.min(Number(customPaidAmount) || 0, grandTotal);
  } else if (paymentType === 'due') {
    calculatedPaid = 0;
  }
  const calculatedDue = Math.max(0, grandTotal - calculatedPaid);

  // Handle Create Invoice Submission
  const handleCreateInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert(lang === 'bn' ? 'গ্রাহকের নাম দিন' : 'Please provide customer name');
      return;
    }

    const validItems = items.filter(it => it.name.trim() && it.qty > 0);
    if (validItems.length === 0) {
      alert(lang === 'bn' ? 'কমপক্ষে একটি বৈধ পণ্য যোগ করুন' : 'Add at least one valid item');
      return;
    }

    const newInvoice = {
      customerId: selectedCustomerId || null,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      dueDate,
      paymentTerms,
      notes: notes.trim(),
      items: validItems,
      subtotal,
      discount,
      vatRate: Number(vatRate),
      vat,
      grandTotal,
      paidAmount: calculatedPaid,
      dueAmount: calculatedDue,
      status: calculatedDue === 0 ? 'paid' : (calculatedPaid > 0 ? 'partial' : 'unpaid'),
      paymentMethod: customPaymentMethod,
      paymentNote: paymentNote.trim(),
      paymentHistory: calculatedPaid > 0 ? [{
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: calculatedPaid,
        method: customPaymentMethod,
        note: paymentNote.trim() || (lang === 'bn' ? (calculatedPaid === grandTotal ? 'সম্পূর্ণ পরিশোধ' : 'প্রাথমিক আংশিক পেমেন্ট') : 'Initial Payment')
      }] : []
    };

    const created = addInvoice(newInvoice);
    setShowCreateModal(false);

    // Reset Form
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setNotes('');
    setDiscountAmount('');
    setCustomPaidAmount('');
    setPaymentNote('');
    setPaymentType('partial');
    setItems([{ id: `it-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }]);

    if (created) {
      openInvoicePrint(created);
    }
  };

  // ----------------------------------------------------
  // 1-CLICK DIRECT PRINT HANDLERS (A4 INVOICE & THERMAL)
  // ----------------------------------------------------
  const handleDirectInvoicePrint = async (inv) => {
    if (showToast) {
      showToast(
        lang === 'bn' ? `ইনভয়েস #${inv.id} প্রিন্ট ডায়লগ ওপেন হচ্ছে...` : `Opening print preview for #${inv.id}...`,
        'info'
      );
    }
    try {
      await printInvoiceDirectly(inv, businessSettings, lang);
    } catch (err) {
      console.warn('Direct print fallback to modal:', err);
      openInvoicePrint(inv);
    }
  };

  const handleDirectReceiptPrint = async (inv) => {
    if (showToast) {
      showToast(
        lang === 'bn' ? `রসিদ #${inv.id} থার্মাল প্রিন্ট ডায়লগ ওপেন হচ্ছে...` : `Opening thermal receipt print for #${inv.id}...`,
        'info'
      );
    }
    try {
      await printReceiptDirectly(inv, businessSettings, lang);
    } catch (err) {
      console.warn('Direct receipt print fallback:', err);
    }
  };

  // ----------------------------------------------------
  // SALES RETURN HANDLERS
  // ----------------------------------------------------
  const handleOpenReturnModal = (inv) => {
    setSelectedReturnInvoice(inv);
    const itemsWithReturn = (inv.items || []).map(it => {
      const alreadyReturned = Number(it.returnedQty) || 0;
      const maxReturnable = Math.max(0, Number(it.qty) - alreadyReturned);
      return {
        ...it,
        alreadyReturned,
        maxReturnable,
        returnQty: 0,
        refundPrice: it.price || 0
      };
    });
    setReturnItemsState(itemsWithReturn);
    const dueVal = inv.dueAmount !== undefined ? Number(inv.dueAmount) : (inv.status === 'paid' ? 0 : Number(inv.grandTotal));
    setRefundType(dueVal > 0 ? 'deduct_due' : 'cash_refund');
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnReason('');
    setRestockToInventory(true);
  };

  const handleReturnItemQtyChange = (itemId, val) => {
    setReturnItemsState(prev => prev.map(it => {
      if (it.id === itemId) {
        const qtyNum = Math.max(0, Math.min(Number(val) || 0, it.maxReturnable));
        return { ...it, returnQty: qtyNum };
      }
      return it;
    }));
  };

  const totalReturnRefund = returnItemsState.reduce((sum, it) => sum + (Number(it.returnQty) || 0) * (Number(it.refundPrice) || 0), 0);

  const handleProcessReturnSubmit = (e) => {
    e.preventDefault();
    const validReturns = returnItemsState
      .filter(it => Number(it.returnQty) > 0)
      .map(it => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        sku: it.sku,
        returnedQty: Number(it.returnQty),
        refundPrice: Number(it.refundPrice),
        subtotal: Number(it.returnQty) * Number(it.refundPrice)
      }));

    if (validReturns.length === 0) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পণ্যের ফেরত পরিমাণ লিখুন' : 'Please specify return quantity for at least one item');
      return;
    }

    processSalesReturn(selectedReturnInvoice.id, {
      returnedItems: validReturns,
      refundType,
      returnDate,
      reason: returnReason,
      restockToInventory
    });

    setSelectedReturnInvoice(null);
  };

  // ----------------------------------------------------
  // EDIT INVOICE HANDLERS
  // ----------------------------------------------------
  const handleOpenEditModal = (inv) => {
    setSelectedEditInvoice(inv);
    setEditForm({
      ...inv,
      customerId: inv.customerId || '',
      customerName: inv.customerName || '',
      customerPhone: inv.customerPhone || '',
      customerAddress: inv.customerAddress || '',
      date: inv.date || new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate || '',
      paymentTerms: inv.paymentTerms || 'Net 14 Days',
      discount: inv.discount !== undefined ? inv.discount : 0,
      vatRate: inv.vatRate !== undefined ? inv.vatRate : 5,
      paidAmount: inv.paidAmount !== undefined ? inv.paidAmount : (inv.status === 'paid' ? inv.grandTotal : 0),
      notes: inv.notes || '',
      items: (inv.items || []).map(it => ({ ...it }))
    });
  };

  const handleEditItemChange = (idx, field, val) => {
    if (!editForm) return;
    const updatedItems = [...editForm.items];
    const target = { ...updatedItems[idx], [field]: val };
    if (field === 'qty' || field === 'price') {
      const q = field === 'qty' ? Number(val) : Number(target.qty);
      const p = field === 'price' ? Number(val) : Number(target.price);
      target.subtotal = q * p;
    }
    updatedItems[idx] = target;
    setEditForm({ ...editForm, items: updatedItems });
  };

  const handleAddEditItemRow = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      items: [
        ...editForm.items,
        { id: `it-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }
      ]
    });
  };

  const handleRemoveEditItemRow = (idx) => {
    if (!editForm || editForm.items.length <= 1) return;
    const updated = editForm.items.filter((_, i) => i !== idx);
    setEditForm({ ...editForm, items: updated });
  };

  const handleEditInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!editForm.customerName.trim()) {
      alert(lang === 'bn' ? 'গ্রাহকের নাম দিন' : 'Enter customer name');
      return;
    }

    const editSubtotal = editForm.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const editDiscount = Number(editForm.discount) || 0;
    const taxable = Math.max(0, editSubtotal - editDiscount);
    const editVat = Math.round(taxable * ((Number(editForm.vatRate) || 0) / 100));
    const editGrandTotal = taxable + editVat;
    const editPaid = Math.min(Number(editForm.paidAmount) || 0, editGrandTotal);
    const editDue = Math.max(0, editGrandTotal - (Number(editForm.returnTotal) || 0) - editPaid);
    const editStatus = editDue === 0 ? 'paid' : (editPaid > 0 ? 'partial' : 'unpaid');

    editInvoice(selectedEditInvoice.id, {
      ...editForm,
      subtotal: editSubtotal,
      discount: editDiscount,
      vat: editVat,
      grandTotal: editGrandTotal,
      paidAmount: editPaid,
      dueAmount: editDue,
      status: editStatus
    });

    setSelectedEditInvoice(null);
    setEditForm(null);
  };

  // ----------------------------------------------------
  // DELETE INVOICE WITH RESTOCK CONFIRMATION
  // ----------------------------------------------------
  const handleDeleteInvoiceClick = (inv) => {
    const confirmMsg = lang === 'bn'
      ? `আপনি কি নিশ্চিত যে ইনভয়েস #${inv.id} মুছে ফেলতে চান?\n\n[OK] চাপলে ইনভয়েসটি মুছে যাবে এবং বিক্রিত পণ্যগুলো স্বয়ংক্রিয়ভাবে ইনভেন্টরি স্টকে ফেরত (Restock) যোগ হবে।`
      : `Delete invoice #${inv.id}? Sold products will be restocked to inventory.`;
    if (window.confirm(confirmMsg)) {
      deleteInvoice(inv.id, true);
    }
  };

  // Filtered List
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv.customerPhone || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'paid') return inv.status === 'paid';
    if (statusFilter === 'partial') return inv.status === 'partial';
    if (statusFilter === 'unpaid') return inv.status === 'unpaid' || inv.dueAmount === inv.grandTotal;
    if (statusFilter === 'returned') return inv.status === 'returned' || inv.status === 'partial_return' || (inv.returns && inv.returns.length > 0);
    return true;
  });

  // KPI Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => {
    if (inv.paidAmount !== undefined) return sum + Number(inv.paidAmount);
    return sum + (inv.status === 'paid' ? Number(inv.grandTotal) : 0);
  }, 0);
  const totalDue = invoices.reduce((sum, inv) => {
    if (inv.dueAmount !== undefined) return sum + Number(inv.dueAmount);
    return sum + (inv.status === 'paid' ? 0 : Number(inv.grandTotal));
  }, 0);
  const totalReturnsValue = invoices.reduce((sum, inv) => sum + (Number(inv.returnTotal) || 0), 0);

  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const partialInvoices = invoices.filter(i => i.status === 'partial');
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
  const returnedInvoices = invoices.filter(i => i.status === 'returned' || i.status === 'partial_return' || (i.returns && i.returns.length > 0));

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} style={{ color: 'var(--business-primary)' }} />
            <span>{lang === 'bn' ? 'ইনভয়েস ও বিলিং ম্যানেজমেন্ট' : 'Invoices & Billing Management'}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'অফিসিয়াল ইনভয়েস তৈরি, আংশিক পেমেন্ট/কিস্তি আদায়, সেলস রিটার্ন ও এডিট নিয়ন্ত্রণ' : 'Official invoices, installment collection, sales return and editing'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportInvoicesToCSV(invoices, lang)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
            title={lang === 'bn' ? 'সকল ইনভয়েস ও বিক্রির হিসাব এক্সেলে ডাউনলোড করুন' : 'Export invoices to Excel CSV'}
          >
            <Download size={16} />
            <span>{lang === 'bn' ? 'এক্সেল এক্সপোর্ট' : 'Excel Export'}</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{lang === 'bn' ? '+ নতুন ইনভয়েস' : '+ Create Invoice'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট ইনভয়েস' : 'Total Invoiced'}</h3>
            <div className="stat-value">৳{totalInvoiced.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {invoices.length} {lang === 'bn' ? 'টি ইনভয়েস ইস্যু' : 'invoices issued'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'আদায়কৃত মোট টাকা' : 'Paid & Collected'}</h3>
            <div className="stat-value" style={{ color: '#10b981' }}>৳{totalCollected.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              {paidInvoices.length} {lang === 'bn' ? 'টি সম্পূর্ণ পরিশোধ' : 'fully paid'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'আংশিক পরিশোধ (কিস্তি)' : 'Partial Invoices'}</h3>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{partialInvoices.length}</div>
            <div className="stat-trend" style={{ color: '#f59e0b' }}>
              {lang === 'bn' ? 'চলমান কিস্তি আদায়যোগ্য' : 'Active installments'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট বকেয়া পাওনা' : 'Total Due Balance'}</h3>
            <div className="stat-value" style={{ color: '#ef4444' }}>৳{totalDue.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#ef4444' }}>
              {unpaidInvoices.length} {lang === 'bn' ? 'টি সম্পূর্ণ বাকি' : 'fully due'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Tabs Bar */}
      <div className="glass-card" style={{ padding: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px', paddingRight: '42px', fontSize: '0.9rem' }}
            placeholder={lang === 'bn' ? 'ইনভয়েস নং, গ্রাহকের নাম বা মোবাইল দিয়ে খুঁজুন...' : 'Search by invoice #, customer name or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ position: 'absolute', right: '6px' }}>
            <VoiceInputButton
              onVoiceInput={(text) => setSearchTerm(text)}
              tooltip={lang === 'bn' ? 'ভয়েসে ইনভয়েস খুঁজুন' : 'Search invoice by voice'}
              size="sm"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            {lang === 'bn' ? 'সকল' : 'All'} ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`btn ${statusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            {lang === 'bn' ? 'পরিশোধিত' : 'Paid'} ({paidInvoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`btn ${statusFilter === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: statusFilter === 'partial' ? '#f59e0b' : undefined }}
          >
            {lang === 'bn' ? 'আংশিক পরিশোধ' : 'Partial'} ({partialInvoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`btn ${statusFilter === 'unpaid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            {lang === 'bn' ? 'বকেয়া' : 'Due'} ({unpaidInvoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            className={`btn ${statusFilter === 'returned' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: statusFilter === 'returned' ? '#f97316' : undefined,
              background: statusFilter === 'returned' ? 'rgba(249, 115, 22, 0.2)' : undefined,
              color: statusFilter === 'returned' ? '#f97316' : undefined
            }}
          >
            <RotateCcw size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {lang === 'bn' ? 'ফেরত / রিটার্ন' : 'Returned'} ({returnedInvoices.length})
          </button>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'ইনভয়েস নং' : 'Invoice #'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'গ্রাহক / ক্লায়েন্ট' : 'Customer'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'ইস্যুর তারিখ' : 'Date'}</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>{lang === 'bn' ? 'মোট বিল' : 'Total'}</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>{lang === 'bn' ? 'পরিশোধিত' : 'Paid'}</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>{lang === 'bn' ? 'বকেয়া' : 'Due'}</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  {lang === 'bn' ? 'কোনো ইনভয়েস পাওয়া যায়নি' : 'No invoices found'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const grandTotal = Number(inv.grandTotal) || 0;
                const paidVal = inv.paidAmount !== undefined ? Number(inv.paidAmount) : (inv.status === 'paid' ? grandTotal : 0);
                const dueVal = inv.dueAmount !== undefined ? Number(inv.dueAmount) : (inv.status === 'paid' ? 0 : grandTotal);
                const isPaid = inv.status === 'paid';
                const isPartial = inv.status === 'partial';
                const isPartialReturn = inv.status === 'partial_return';
                const isReturned = inv.status === 'returned';

                return (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--business-primary)', fontFamily: 'monospace' }}>
                      {inv.id}
                      {inv.returnTotal > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#f97316', fontWeight: '600' }}>
                          (রিটার্ন: ৳{Number(inv.returnTotal).toLocaleString()})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{inv.customerName}</div>
                      {inv.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div>{inv.date}</div>
                      {inv.dueDate && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>মেয়াদ: {inv.dueDate}</div>}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                      ৳{grandTotal.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace', color: '#10b981' }}>
                      ৳{paidVal.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: dueVal > 0 ? '#ef4444' : 'var(--text-dim)' }}>
                      ৳{dueVal.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      {isReturned ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#a855f7',
                            border: '1px solid #a855f7',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>{lang === 'bn' ? 'সম্পূর্ণ ফেরত' : 'Returned'}</span>
                        </span>
                      ) : isPartialReturn ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(249, 115, 22, 0.15)',
                            color: '#f97316',
                            border: '1px solid #f97316',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RotateCcw size={12} />
                          <span>{lang === 'bn' ? `আংশিক ফেরত` : `Partial Return`}</span>
                        </span>
                      ) : isPaid ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          <span>{lang === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
                        </span>
                      ) : isPartial ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid #f59e0b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Clock size={12} />
                          <span>{lang === 'bn' ? `আংশিক (বাকি ৳${dueVal.toLocaleString()})` : `Partial (৳${dueVal})`}</span>
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={12} />
                          <span>{lang === 'bn' ? 'বকেয়া' : 'Due'}</span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Collect Payment / Installment Button */}
                        {dueVal > 0 && !isReturned && (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedPaymentInvoice(inv);
                              setCollectAmount(dueVal);
                              setCollectMethod('cash');
                              setCollectDate(new Date().toISOString().split('T')[0]);
                              setCollectNote('');
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#10b981',
                              borderColor: '#10b981'
                            }}
                            title={lang === 'bn' ? 'পেমেন্ট গ্রহণ / কিস্তি আদায় করুন' : 'Collect payment / installment'}
                          >
                            <CreditCard size={13} />
                            <span>{lang === 'bn' ? 'পেমেন্ট' : 'Collect'}</span>
                          </button>
                        )}

                        {/* Sales Return Button */}
                        {!isReturned && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleOpenReturnModal(inv)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#f97316',
                              borderColor: 'rgba(249, 115, 22, 0.4)'
                            }}
                            title={lang === 'bn' ? 'পণ্য ফেরত / সেলস রিটার্ন গ্রহণ করুন' : 'Process sales return'}
                          >
                            <RotateCcw size={13} />
                            <span>{lang === 'bn' ? 'রিটার্ন' : 'Return'}</span>
                          </button>
                        )}

                        {/* Edit Invoice Button */}
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleOpenEditModal(inv)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#6366f1'
                          }}
                          title={lang === 'bn' ? 'ইনভয়েস এডিট করুন (মালামালের সংখ্যা ও তথ্য সংশোধন)' : 'Edit invoice details and items'}
                        >
                          <Edit3 size={13} />
                          <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                        </button>

                        {/* WhatsApp Share Button */}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openShareInvoice(inv)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(37, 211, 102, 0.12)',
                            color: '#16a34a',
                            borderColor: 'rgba(37, 211, 102, 0.35)'
                          }}
                          title={lang === 'bn' ? 'হোয়াটসঅ্যাপ ও সোশ্যাল মিডিয়ায় পাঠান' : 'Share to WhatsApp'}
                        >
                          <MessageCircle size={13} />
                          <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                        </button>

                        {/* View Invoice Preview Modal */}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openInvoicePrint(inv)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={lang === 'bn' ? 'ইনভয়েস বিস্তারিত প্রিভিউ দেখুন' : 'View Full Invoice'}
                        >
                          <Eye size={13} />
                          <span>{lang === 'bn' ? 'ভিউ' : 'View'}</span>
                        </button>

                        {/* 1-Click Direct Print A4 Invoice */}
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDirectInvoicePrint(inv)}
                          style={{
                            padding: '4px 9px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '700',
                            boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                          }}
                          title={lang === 'bn' ? '১-ক্লিকে সরাসরি A4 ইনভয়েস প্রিন্ট করুন' : '1-Click Direct Print A4 Invoice'}
                        >
                          <Printer size={13} />
                          <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                        </button>

                        {/* Direct POS Thermal Receipt Print */}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDirectReceiptPrint(inv)}
                          style={{
                            padding: '4px 7px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: 'rgba(99, 102, 241, 0.08)',
                            color: 'var(--business-primary)',
                            borderColor: 'rgba(99, 102, 241, 0.25)'
                          }}
                          title={lang === 'bn' ? 'থার্মাল পিওএস রসিদ প্রিন্ট করুন' : 'Print POS Thermal Receipt'}
                        >
                          <span>🧾 {lang === 'bn' ? 'রসিদ' : 'Slip'}</span>
                        </button>

                        {/* Delete Invoice Button */}
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteInvoiceClick(inv)}
                          style={{ color: '#ef4444', padding: '4px' }}
                          title={lang === 'bn' ? 'ইনভয়েস মুছুন (পণ্য স্টকে ফেরত যাবে)' : 'Delete invoice and restock'}
                        >
                          <Trash2 size={15} />
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

      {/* ======================================================== */}
      {/* SALES RETURN MODAL */}
      {/* ======================================================== */}
      {selectedReturnInvoice && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '750px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'বিক্রিত পণ্য ফেরত (Sales Return)' : 'Process Sales Return'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ইনভয়েস #{selectedReturnInvoice.id} • {selectedReturnInvoice.customerName}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedReturnInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessReturnSubmit}>
              {/* Summary Card */}
              <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট ইনভয়েস বিল' : 'Grand Total'}</div>
                  <div style={{ fontWeight: '800', fontFamily: 'monospace' }}>৳{Number(selectedReturnInvoice.grandTotal).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{lang === 'bn' ? 'আদায়কৃত পেইড' : 'Paid Amount'}</div>
                  <div style={{ fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>৳{(selectedReturnInvoice.paidAmount || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>{lang === 'bn' ? 'বর্তমান বকেয়া' : 'Current Due'}</div>
                  <div style={{ fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>৳{(selectedReturnInvoice.dueAmount || 0).toLocaleString()}</div>
                </div>
                {selectedReturnInvoice.returnTotal > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#f97316' }}>{lang === 'bn' ? 'পূর্বে ফেরতকৃত' : 'Already Returned'}</div>
                    <div style={{ fontWeight: '800', color: '#f97316', fontFamily: 'monospace' }}>৳{Number(selectedReturnInvoice.returnTotal).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* Items Return Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={16} style={{ color: '#f97316' }} />
                  <span>{lang === 'bn' ? 'ফেরতযোগ্য পণ্যের তালিকা ও পরিমাণ নির্ধারণ করুন:' : 'Select Items & Quantities to Return:'}</span>
                </div>

                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 10px' }}>{lang === 'bn' ? 'পণ্যের নাম' : 'Item Name'}</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>{lang === 'bn' ? 'বিক্রি' : 'Sold Qty'}</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>{lang === 'bn' ? 'পূর্বে ফেরত' : 'Prev Ret'}</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'দর (৳)' : 'Price'}</th>
                        <th style={{ padding: '8px 10px', width: '130px', textAlign: 'center' }}>{lang === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty'}</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>{lang === 'bn' ? 'ফেরত মূল্য' : 'Refund'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItemsState.map((it) => {
                        const lineRefund = (Number(it.returnQty) || 0) * (Number(it.refundPrice) || 0);
                        return (
                          <tr key={it.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{it.name}</div>
                              {it.sku && <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{it.sku}</div>}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700' }}>
                              {it.qty} টি
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: it.alreadyReturned > 0 ? '#f97316' : 'var(--text-dim)' }}>
                              {it.alreadyReturned} টি
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                              ৳{it.refundPrice}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                max={it.maxReturnable}
                                className="input-field"
                                style={{ width: '85px', textAlign: 'center', padding: '4px', fontWeight: '800', color: it.returnQty > 0 ? '#f97316' : undefined }}
                                value={it.returnQty}
                                onChange={(e) => handleReturnItemQtyChange(it.id, e.target.value)}
                                disabled={it.maxReturnable <= 0}
                              />
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                                {lang === 'bn' ? `সর্বোচ্চ ${it.maxReturnable} টি` : `Max ${it.maxReturnable}`}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '800', fontFamily: 'monospace', color: lineRefund > 0 ? '#f97316' : 'var(--text-dim)' }}>
                              ৳{lineRefund.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Refund Banner */}
              {totalReturnRefund > 0 && (
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px dashed #f97316', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316' }}>
                    <RotateCcw size={18} />
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                      {lang === 'bn' ? 'মোট ফেরত মূল্য (Refund Credit):' : 'Total Return Credit:'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f97316', fontFamily: 'monospace' }}>
                    ৳{totalReturnRefund.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Refund Options & Reason */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '700' }}>
                    {lang === 'bn' ? 'অর্থ সমন্বয় পদ্ধতি:' : 'Refund / Adjustment Method:'}
                  </label>
                  <select
                    className="input-field"
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value)}
                  >
                    <option value="deduct_due">{lang === 'bn' ? 'বকেয়া বিল থেকে সমন্বয় করুন (Deduct Due)' : 'Deduct from Due Balance'}</option>
                    <option value="cash_refund">{lang === 'bn' ? 'নগদ ক্যাশ / ডিজিটাল ফেরত (Cash Refund)' : 'Cash / Mobile Refund'}</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ফেরতের তারিখ:' : 'Return Date:'}</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Restock Checkbox */}
              <div style={{ marginBottom: '1rem', background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={restockToInventory}
                    onChange={(e) => setRestockToInventory(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--business-primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'পণ্য পুনরায় ইনভেন্টরি স্টকে ফেরত যোগ করুন (Restock Items to Inventory)' : 'Restock items back to inventory'}
                  </span>
                </label>
              </div>

              {/* Return Reason Note */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="field-label">{lang === 'bn' ? 'পণ্য ফেরতের কারণ / বিবরণ:' : 'Return Reason:'}</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder={lang === 'bn' ? 'যেমন: গ্রাহক ৪টি অতিরিক্ত নিয়েছিলেন বা ডিফেক্ট ছিল...' : 'Reason for return...'}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedReturnInvoice(null)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#f97316', borderColor: '#f97316', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                  disabled={totalReturnRefund <= 0}
                >
                  <RotateCcw size={16} />
                  <span>{lang === 'bn' ? 'রিটার্ন নিশ্চিত করুন' : 'Confirm Sales Return'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT INVOICE MODAL (सेल এডিট / আইটেম সংশোধন) */}
      {/* ======================================================== */}
      {selectedEditInvoice && editForm && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '780px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--business-primary)' }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'ইনভয়েস ও সেল এডিট করুন' : 'Edit Invoice & Sales'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ইনভয়েস #{editForm.id} • {lang === 'bn' ? 'পণ্যের সংখ্যা, দর বা পেমেন্ট সংশোধন করুন' : 'Modify items, quantities, or payments'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedEditInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Explanatory Banner */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--business-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                {lang === 'bn'
                  ? '💡 মালামালের সংখ্যা কমালে (যেমন ১০ থেকে ৬) অবশিষ্ট পণ্য স্বয়ংক্রিয়ভাবে ইনভেন্টরি স্টকে ফেরত যাবে। বাড়ালে স্টক থেকে বাদ যাবে।'
                  : 'Adjusting quantities automatically updates inventory stock and customer due balances.'}
              </div>
            </div>

            <form onSubmit={handleEditInvoiceSubmit}>
              {/* Customer & Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer Name:'}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ইস্যুর তারিখ:' : 'Invoice Date:'}</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="field-label" style={{ fontWeight: '700', margin: 0 }}>
                    {lang === 'bn' ? 'পণ্য ও মালামালের তালিকা:' : 'Invoice Items:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditItemRow}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} />
                    <span>{lang === 'bn' ? '+ আইটেম যোগ করুন' : '+ Add Item'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editForm.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 2fr) 90px 100px 110px 36px',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'var(--bg-primary)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <input
                        type="text"
                        required
                        className="input-field"
                        style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                        value={it.name}
                        onChange={(e) => handleEditItemChange(idx, 'name', e.target.value)}
                        placeholder="Item name"
                      />

                      <div>
                        <input
                          type="number"
                          min="1"
                          required
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem', textAlign: 'center', fontWeight: '700' }}
                          value={it.qty}
                          onChange={(e) => handleEditItemChange(idx, 'qty', e.target.value)}
                          placeholder="Qty"
                        />
                      </div>

                      <div>
                        <input
                          type="number"
                          min="0"
                          required
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem', textAlign: 'right' }}
                          value={it.price}
                          onChange={(e) => handleEditItemChange(idx, 'price', e.target.value)}
                          placeholder="Price"
                        />
                      </div>

                      <div style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        ৳{((Number(it.qty) || 0) * (Number(it.price) || 0)).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEditItemRow(idx)}
                        disabled={editForm.items.length <= 1}
                        style={{ background: 'transparent', border: 'none', color: editForm.items.length <= 1 ? 'var(--text-dim)' : '#ef4444', cursor: editForm.items.length <= 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials: Discount, VAT, Paid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'ছাড় / ডিসকাউন্ট (৳):' : 'Discount (৳):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={editForm.discount}
                    onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ভ্যাট হার (%):' : 'VAT Rate (%):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={editForm.vatRate}
                    onChange={(e) => setEditForm({ ...editForm, vatRate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'পরিশোধিত টাকা / পেইড (৳):' : 'Paid Amount (৳):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    style={{ fontWeight: '700', color: '#10b981' }}
                    value={editForm.paidAmount}
                    onChange={(e) => setEditForm({ ...editForm, paidAmount: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="field-label">{lang === 'bn' ? 'ইনভয়েস নোট / শর্তাবলী:' : 'Notes:'}</label>
                <textarea
                  className="input-field"
                  rows="2"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedEditInvoice(null)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE INVOICE MODAL */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div
            className="modal-content animate-fade-in"
            style={{
              maxWidth: '780px',
              width: '95%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.5rem'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--business-primary)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'নতুন অফিসিয়াল ইনভয়েস তৈরি' : 'Create New Official Invoice'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'গ্রাহকের তথ্য, পণ্য এবং পেমেন্ট শর্ত দিয়ে ইনভয়েস জেনারেট করুন' : 'Fill details to generate formal invoice'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)} title={t.close}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit}>
              {/* Customer Selector / Input */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem', background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'CRM গ্রাহক নির্বাচন:' : 'Select Customer:'}</label>
                  <select
                    className="input-field"
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                  >
                    <option value="">{lang === 'bn' ? '-- নতুন / ক্যাজুয়াল গ্রাহক --' : '-- Walk-in / New Customer --'}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} - {c.companyName || ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer Name:'} <span style={{ color: '#ef4444' }}>*</span></label>
                    <VoiceInputButton
                      onVoiceInput={(text) => setCustomerName(text)}
                      tooltip={lang === 'bn' ? 'ভয়েসে নাম বলুন' : 'Speak customer name'}
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: হাজী আব্দুর রহমান' : 'Customer Name'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone Number:'}</label>
                    <VoiceInputButton
                      onVoiceInput={(text) => setCustomerPhone(text.replace(/[^0-9+]/g, ''))}
                      tooltip={lang === 'bn' ? 'ভয়েসে মোবাইল বলুন' : 'Speak phone number'}
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="017xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'ঠিকানা:' : 'Address:'}</label>
                    <VoiceInputButton
                      onVoiceInput={(text) => setCustomerAddress(text)}
                      tooltip={lang === 'bn' ? 'ভয়েসে ঠিকানা বলুন' : 'Speak address'}
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'রোড #১০, মিরপুর-১২, ঢাকা' : 'Full Address'}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Dates & Payment Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'পরিশোধের মেয়াদ (Due Date):' : 'Due Date:'}</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'পেমেন্ট শর্ত (Terms):' : 'Payment Terms:'}</label>
                  <select
                    className="input-field"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                  >
                    <option value="Net 14 Days">Net 14 Days (১৪ দিন)</option>
                    <option value="Net 30 Days">Net 30 Days (৩০ দিন)</option>
                    <option value="Due on Receipt">Due on Receipt (তাৎক্ষণিক)</option>
                    <option value="Cash on Delivery">Cash on Delivery (ক্যাশ অন ডেলিভারি)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="field-label" style={{ fontWeight: '700', margin: 0 }}>
                    {lang === 'bn' ? 'পণ্যের তালিকা (Items):' : 'Invoice Items:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} />
                    <span>{lang === 'bn' ? '+ নতুন আইটেম' : '+ Add Item'}</span>
                  </button>
                </div>

                {/* Item List Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((row, idx) => (
                    <div
                      key={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 2fr) minmax(120px, 1.5fr) 70px 90px 100px 32px',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'var(--bg-primary)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {/* Product Selector */}
                      <div>
                        <select
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                          value={row.productId}
                          onChange={(e) => handleItemChange(row.id, 'productId', e.target.value)}
                        >
                          <option value="">{lang === 'bn' ? '-- ইনভেন্টরি থেকে নির্বাচন --' : '-- From Inventory --'}</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (মজুদ: {p.stock})</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Item Name (if not in inventory) */}
                      <div>
                        <input
                          type="text"
                          required
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                          placeholder={lang === 'bn' ? 'পণ্যের নাম' : 'Item name'}
                          value={row.name}
                          onChange={(e) => handleItemChange(row.id, 'name', e.target.value)}
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <input
                          type="number"
                          min="1"
                          required
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem', textAlign: 'center' }}
                          value={row.qty}
                          onChange={(e) => handleItemChange(row.id, 'qty', e.target.value)}
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <input
                          type="number"
                          min="0"
                          required
                          className="input-field"
                          style={{ padding: '6px 8px', fontSize: '0.85rem', textAlign: 'right' }}
                          value={row.price}
                          onChange={(e) => handleItemChange(row.id, 'price', e.target.value)}
                        />
                      </div>

                      {/* Subtotal */}
                      <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        ৳{Number(row.subtotal).toLocaleString()}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(row.id)}
                        disabled={items.length === 1}
                        style={{ background: 'transparent', border: 'none', color: items.length === 1 ? 'var(--text-dim)' : '#ef4444', cursor: items.length === 1 ? 'not-allowed' : 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials & Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'ডিসকাউন্ট / ছাড় (৳):' : 'Discount (৳):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ভ্যাট হার (%):' : 'VAT Rate (%):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'পেমেন্ট ধরন ও শর্ত:' : 'Payment Type:'}</label>
                  <select
                    className="input-field"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                  >
                    <option value="partial">{lang === 'bn' ? 'আংশিক পেমেন্ট (Partial Payment)' : 'Partial Payment'}</option>
                    <option value="paid">{lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত (Full Paid)' : 'Full Paid'}</option>
                    <option value="due">{lang === 'bn' ? 'সম্পূর্ণ বাকি / ক্রেডিট (Full Credit / Due)' : 'Full Credit (Due)'}</option>
                  </select>
                </div>
              </div>

              {/* Partial Payment Specific Inputs */}
              {paymentType === 'partial' && (
                <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f59e0b', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={15} />
                    <span>{lang === 'bn' ? 'আংশিক পেমেন্ট কনফিগারেশন' : 'Partial Payment Details'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    <div>
                      <label className="field-label">{lang === 'bn' ? 'পরিশোধিত অর্থ / জমা (৳):' : 'Paid Amount (৳):'}</label>
                      <input
                        type="number"
                        min="1"
                        max={grandTotal}
                        required
                        className="input-field"
                        placeholder="৳ পরিমাণ"
                        value={customPaidAmount}
                        onChange={(e) => setCustomPaidAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</label>
                      <select
                        className="input-field"
                        value={customPaymentMethod}
                        onChange={(e) => setCustomPaymentMethod(e.target.value)}
                      >
                        <option value="cash">{lang === 'bn' ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                        <option value="bkash">{lang === 'bn' ? 'বিকাশ / নগদ (bKash/Nagad)' : 'bKash / Mobile'}</option>
                        <option value="bank">{lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">{lang === 'bn' ? 'পেমেন্ট নোট / বিবরণ:' : 'Payment Note:'}</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder={lang === 'bn' ? 'যেমন: কিস্তি ১ অগ্রিম জমা' : 'Note'}
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Financial Breakdown */}
              <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#10b981' }}>
                    <span>{lang === 'bn' ? 'ছাড় / ডিসকাউন্ট:' : 'Discount:'}</span>
                    <span style={{ fontFamily: 'monospace' }}>-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                {vat > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{lang === 'bn' ? `ভ্যাট (${vatRate}%):` : `VAT (${vatRate}%):`}</span>
                    <span style={{ fontFamily: 'monospace' }}>+৳{vat.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginBottom: '8px', fontSize: '1rem', fontWeight: '800' }}>
                  <span>{lang === 'bn' ? 'মোট ইনভয়েস বিল:' : 'Grand Total:'}</span>
                  <span style={{ color: 'var(--business-primary)', fontFamily: 'monospace' }}>৳{grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '700', color: '#10b981' }}>
                  <span>{lang === 'bn' ? 'পরিশোধিত (Paid):' : 'Paid Amount:'}</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{calculatedPaid.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '700', color: calculatedDue > 0 ? '#ef4444' : 'var(--text-muted)', marginTop: '4px' }}>
                  <span>{lang === 'bn' ? 'অবশিষ্ট বকেয়া (Due):' : 'Remaining Due:'}</span>
                  <span style={{ fontFamily: 'monospace' }}>৳{calculatedDue.toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="field-label">{lang === 'bn' ? 'ইনভয়েস নোট / শর্তাবলী:' : 'Invoice Notes / Terms:'}</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder={lang === 'bn' ? 'যেমন: পণ্য সরবরাহের ৭ দিনের মধ্যে ব্যাংক অ্যাকাউন্টে বকেয়া টাকা জমা দিন।' : 'Terms & conditions...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{lang === 'bn' ? 'ইনভয়েস তৈরি ও প্রিন্ট করুন' : 'Generate & Print Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAYMENT COLLECTION MODAL (বকেয়া / কিস্তি আদায়) */}
      {/* ======================================================== */}
      {selectedPaymentInvoice && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'কিস্তি / বকেয়া পেমেন্ট গ্রহণ' : 'Collect Installment Payment'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'ইনভয়েসের বকেয়া টাকা আদায় ও রেকর্ড করুন' : 'Record payment against outstanding due'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedPaymentInvoice(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Invoice Summary Box */}
            <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'ইনভয়েস নম্বর:' : 'Invoice No:'}</span>
                <span style={{ fontWeight: '700', fontFamily: 'monospace', color: 'var(--business-primary)' }}>#{selectedPaymentInvoice.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer Name:'}</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedPaymentInvoice.customerName}</span>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট বিল' : 'Total Bill'}</div>
                  <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>৳{Number(selectedPaymentInvoice.grandTotal).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{lang === 'bn' ? 'আদায়কৃত' : 'Paid So Far'}</div>
                  <div style={{ fontWeight: '700', color: '#10b981', fontFamily: 'monospace' }}>
                    ৳{(selectedPaymentInvoice.paidAmount || (selectedPaymentInvoice.status === 'paid' ? selectedPaymentInvoice.grandTotal : 0)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>{lang === 'bn' ? 'বর্তমান বকেয়া' : 'Current Due'}</div>
                  <div style={{ fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                    ৳{(selectedPaymentInvoice.dueAmount !== undefined ? selectedPaymentInvoice.dueAmount : (selectedPaymentInvoice.status === 'paid' ? 0 : selectedPaymentInvoice.grandTotal)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number(collectAmount);
                recordInvoicePayment(selectedPaymentInvoice.id, {
                  amount: amt,
                  method: collectMethod,
                  date: collectDate,
                  note: collectNote
                });
                triggerSoundboxPayment({
                  amount: amt,
                  customerName: selectedPaymentInvoice.customerName,
                  paymentMethod: collectMethod,
                  type: 'debt_repay'
                });
                setSelectedPaymentInvoice(null);
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="field-label" style={{ fontWeight: '700', margin: 0 }}>
                    {lang === 'bn' ? 'আদায়কৃত টাকার পরিমাণ (৳):' : 'Payment Amount to Collect (৳):'}
                  </label>
                  <VoiceInputButton
                    onVoiceInput={(text) => {
                      const num = text.replace(/[^0-9.]/g, '');
                      if (num) setCollectAmount(num);
                    }}
                    tooltip={lang === 'bn' ? 'ভয়েসে টাকা বলুন' : 'Speak amount'}
                    size="sm"
                  />
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedPaymentInvoice.dueAmount !== undefined ? selectedPaymentInvoice.dueAmount : selectedPaymentInvoice.grandTotal}
                  required
                  autoFocus
                  className="input-field"
                  style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: 'monospace', color: '#10b981' }}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'পেমেন্ট মেথড:' : 'Payment Method:'}</label>
                  <select
                    className="input-field"
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value)}
                  >
                    <option value="cash">{lang === 'bn' ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                    <option value="bkash">{lang === 'bn' ? 'বিকাশ / নগদ (bKash/Nagad)' : 'bKash / Mobile'}</option>
                    <option value="bank">{lang === 'bn' ? 'ব্যাংক কার্ড / ট্রান্সফার' : 'Bank Transfer'}</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'পেমেন্ট তারিখ:' : 'Payment Date:'}</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'নোট / ট্রানজেকশন রেফারেন্স:' : 'Transaction Ref / Note:'}</label>
                  <VoiceInputButton
                    onVoiceInput={(text) => setCollectNote(text)}
                    tooltip={lang === 'bn' ? 'ভয়েসে নোট বলুন' : 'Speak note'}
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder={lang === 'bn' ? 'যেমন: বিকাশ ট্রানজেকশন নং বা কিস্তি নং ২' : 'e.g. bKash TrxID or Installment #2'}
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                />
              </div>

              {/* Prior Payment History Logs Table (if any) */}
              {selectedPaymentInvoice.paymentHistory && selectedPaymentInvoice.paymentHistory.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {lang === 'bn' ? 'পূর্ববর্তী কিস্তি ও পেমেন্ট হিস্টোরি:' : 'Payment History Logs:'}
                  </div>
                  <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '6px 8px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                          <th style={{ padding: '6px 8px' }}>{lang === 'bn' ? 'মাধ্যম' : 'Method'}</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                          <th style={{ padding: '6px 8px' }}>{lang === 'bn' ? 'নোট' : 'Note'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPaymentInvoice.paymentHistory.map((ph, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{ph.date}</td>
                            <td style={{ padding: '5px 8px', textTransform: 'uppercase', fontWeight: '600' }}>{ph.method}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: '700', color: '#10b981', fontFamily: 'monospace' }}>
                              ৳{Number(ph.amount).toLocaleString()}
                            </td>
                            <td style={{ padding: '5px 8px', color: 'var(--text-dim)' }}>{ph.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPaymentInvoice(null)}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                >
                  <CreditCard size={16} />
                  <span>{lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন' : 'Confirm Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
