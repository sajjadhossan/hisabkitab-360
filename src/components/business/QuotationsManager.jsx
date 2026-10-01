import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCheck,
  Plus,
  Search,
  Printer,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  X,
  Send,
  Building
} from 'lucide-react';
import { VoiceInputButton } from '../common/VoiceInputButton';

export const QuotationsManager = () => {
  const {
    quotations,
    addQuotation,
    updateQuotationStatus,
    deleteQuotation,
    convertQuotationToInvoice,
    openQuotationPrint,
    products,
    customers,
    businessSettings,
    lang,
    t
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [discountAmount, setDiscountAmount] = useState('');
  const [vatRate, setVatRate] = useState(businessSettings.vatRate || 5);
  const [terms, setTerms] = useState(
    lang === 'bn'
      ? '১. এই কোটেশনের নির্ধারিত দর আগামী ১৫ দিন পর্যন্ত কার্যকর থাকবে।\n২. কার্যাদেশ চূড়ান্ত হলে ৫০% অগ্রিম প্রদেয় এবং ডেলিভারি সম্পন্ন হলে অবশিষ্ট ৫০% পরিশোধযোগ্য।\n৩. ডেলিভারি সময়সীমা ৩-৫ কার্যদিবস।'
      : '1. Prices valid for 15 days from issue date.\n2. 50% advance payment required upon order confirmation.\n3. Delivery within 3-5 business days.'
  );

  const [items, setItems] = useState([
    { id: `qit-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }
  ]);

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

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { id: `qit-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }
    ]);
  };

  const handleRemoveItemRow = (rowId) => {
    if (items.length > 1) {
      setItems(items.filter(it => it.id !== rowId));
    }
  };

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

  const formSubtotal = items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
  const formDiscount = Math.min(formSubtotal, Number(discountAmount) || 0);
  const formTaxable = Math.max(0, formSubtotal - formDiscount);
  const formVat = Math.round(formTaxable * (Number(vatRate) / 100));
  const formGrandTotal = formTaxable + formVat;

  const handleCreateQuotationSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ক্লায়েন্টের নাম দিন' : 'Please provide client name');
      return;
    }

    const validItems = items.filter(it => it.name.trim() && it.qty > 0);
    if (validItems.length === 0) {
      alert(lang === 'bn' ? 'কমপক্ষে একটি পণ্যের বিবরণ ও পরিমাণ দিন' : 'Add at least one item');
      return;
    }

    const created = addQuotation({
      customerName,
      customerPhone,
      customerAddress,
      validUntil,
      terms,
      items: validItems,
      subtotal: formSubtotal,
      discount: formDiscount,
      vatRate: Number(vatRate),
      vat: formVat,
      grandTotal: formGrandTotal,
      status: 'sent'
    });

    setShowCreateModal(false);
    // Reset
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedCustomerId('');
    setDiscountAmount('');
    setItems([{ id: `qit-${Date.now()}`, productId: '', name: '', sku: '', qty: 1, price: 0, subtotal: 0 }]);

    openQuotationPrint(created);
  };

  // Metrics
  const totalQuotationsCount = quotations.length;
  const convertedCount = quotations.filter(q => q.status === 'converted').length;
  const activeCount = quotations.filter(q => q.status === 'sent' || q.status === 'draft').length;
  const totalValue = quotations.reduce((sum, q) => sum + Number(q.grandTotal), 0);

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch =
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerPhone && q.customerPhone.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={26} style={{ color: 'var(--business-primary)' }} />
            {lang === 'bn' ? 'দরপত্র ও কোটেশন (Quotations & Estimates)' : 'Quotations & Estimates'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'ক্লায়েন্টদের জন্য প্রফেশনাল প্রস্তাবনা তৈরি ও ১-ক্লিকে ইনভয়েসে রূপান্তর' : 'Create professional quotes and convert to invoices in 1 click'}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem', fontWeight: '700' }}
        >
          <Plus size={18} />
          <span>{lang === 'bn' ? '+ নতুন কোটেশন তৈরি করুন' : '+ Create New Quotation'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {lang === 'bn' ? 'মোট প্রস্তাবিত কোটেশন' : 'Total Quotations Value'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'monospace' }}>
            ৳{totalValue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {totalQuotationsCount} {lang === 'bn' ? 'টি দরপত্র প্রস্তাবনা' : 'quotations issued'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {lang === 'bn' ? 'সক্রিয় / পেন্ডিং কোটেশন' : 'Active / Pending'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#3b82f6', fontFamily: 'monospace' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '4px' }}>
            {lang === 'bn' ? 'সিদ্ধান্তের অপেক্ষায়' : 'awaiting client approval'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {lang === 'bn' ? 'ইনভয়েসে রূপান্তরিত (Converted)' : 'Converted to Invoices'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
            {convertedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
            {totalQuotationsCount > 0 ? Math.round((convertedCount / totalQuotationsCount) * 100) : 0}% {lang === 'bn' ? 'সফল রূপান্তর হার' : 'success rate'}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px', paddingRight: '42px', fontSize: '0.9rem' }}
            placeholder={lang === 'bn' ? 'কোটেশন নং বা ক্লায়েন্টের নাম দিয়ে খুঁজুন...' : 'Search by quote # or client...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ position: 'absolute', right: '8px' }}>
            <VoiceInputButton
              onVoiceInput={(text) => setSearchTerm(text)}
              tooltip={lang === 'bn' ? 'ভয়েসে কোটেশন খুঁজুন' : 'Search quote by voice'}
              size="sm"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'sent', 'converted', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {st === 'all'
                ? (lang === 'bn' ? 'সব কোটেশন' : 'All')
                : st === 'sent'
                ? (lang === 'bn' ? 'প্রেরিত' : 'Sent')
                : st === 'converted'
                ? (lang === 'bn' ? 'রূপান্তরিত' : 'Converted')
                : (lang === 'bn' ? 'খসড়া' : 'Draft')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'কোটেশন নং' : 'Quote #'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'ক্লায়েন্ট' : 'Client'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'মেয়াদ' : 'Valid Until'}</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>{lang === 'bn' ? 'আনুমানিক বাজেট' : 'Estimate'}</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  {lang === 'bn' ? 'কোনো কোটেশন পাওয়া যায়নি' : 'No quotations found'}
                </td>
              </tr>
            ) : (
              filteredQuotations.map((quote) => {
                const isConverted = quote.status === 'converted';
                return (
                  <tr key={quote.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--business-primary)', fontFamily: 'monospace' }}>
                      {quote.id}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{quote.customerName}</div>
                      {quote.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{quote.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {quote.date}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {quote.validUntil || '-'}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                      ৳{Number(quote.grandTotal).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <span className={`badge ${isConverted ? 'badge-success' : 'badge-info'}`} style={{ padding: '4px 10px' }}>
                        {isConverted ? (lang === 'bn' ? 'রূপান্তরিত' : 'Converted') : (lang === 'bn' ? 'প্রেরিত' : 'Sent')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center' }}>
                        {/* 1-Click Convert to Invoice Button */}
                        {!isConverted ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => convertQuotationToInvoice(quote.id)}
                            style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                            title={lang === 'bn' ? 'সরাসরি ইনভয়েসে রূপান্তর করুন' : 'Convert to Invoice'}
                          >
                            <ArrowRight size={14} />
                            <span>{lang === 'bn' ? 'ইনভয়েস করুন' : 'To Invoice'}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
                            #{quote.convertedInvoiceId}
                          </span>
                        )}

                        <button
                          className="btn btn-secondary"
                          onClick={() => openQuotationPrint(quote)}
                          style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title={lang === 'bn' ? 'A4 কোটেশন প্রিন্ট ও ভিউ' : 'Print / View A4'}
                        >
                          <Printer size={14} />
                          <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                        </button>

                        <button
                          className="btn-icon"
                          onClick={() => {
                            if (window.confirm(lang === 'bn' ? 'কোটেশনটি মুছে ফেলতে চান?' : 'Delete quotation?')) {
                              deleteQuotation(quote.id);
                            }
                          }}
                          style={{ color: '#ef4444' }}
                          title={t.delete}
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

      {/* CREATE QUOTATION MODAL */}
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
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--business-primary)' }}>
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'নতুন দরপত্র / কোটেশন তৈরি' : 'Create New Quotation'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'ক্লায়েন্টের জন্য প্রাতিষ্ঠানিক মূল্য প্রস্তাবনা ও শর্তাবলী' : 'Commercial proposal with itemized pricing'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)} title={t.close}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuotationSubmit}>
              {/* Client Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem', background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'CRM ক্লায়েন্ট নির্বাচন:' : 'Select Client:'}</label>
                  <select
                    className="input-field"
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                  >
                    <option value="">{lang === 'bn' ? '-- নতুন ক্লায়েন্ট লিখুন --' : '-- Type New Client --'}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'ক্লায়েন্টের নাম *:' : 'Client Name *:'}</label>
                    <VoiceInputButton
                      onVoiceInput={(text) => setCustomerName(text)}
                      tooltip={lang === 'bn' ? 'ভয়েসে ক্লায়েন্টের নাম বলুন' : 'Speak client name'}
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={lang === 'bn' ? 'ক্লায়েন্ট বা প্রতিষ্ঠানের নাম' : 'Client name'}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'মোবাইল নং:' : 'Phone Number:'}</label>
                    <VoiceInputButton
                      onVoiceInput={(text) => setCustomerPhone(text.replace(/[^0-9+]/g, ''))}
                      tooltip={lang === 'bn' ? 'ভয়েসে মোবাইল নম্বর বলুন' : 'Speak phone number'}
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="017XX-XXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'কোটেশনের মেয়াদ শেষ (Valid Until):' : 'Valid Until:'}</label>
                  <input
                    type="date"
                    className="input-field"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'প্রস্তাবিত পণ্য ও দর (Line Items):' : 'Proposed Items:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="btn btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> {lang === 'bn' ? '+ পণ্য যোগ করুন' : '+ Add Item'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(140px, 1.5fr) minmax(140px, 1.5fr) 70px 90px 100px 32px',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'var(--bg-primary)',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <select
                        className="input-field"
                        value={row.productId}
                        onChange={(e) => handleItemChange(row.id, 'productId', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                      >
                        <option value="">{lang === 'bn' ? '-- স্টক থেকে নির্বাচন --' : '-- Select from stock --'}</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (৳{p.sellPrice})</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder={lang === 'bn' ? 'বিবরণ' : 'Description'}
                        value={row.name}
                        onChange={(e) => handleItemChange(row.id, 'name', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                      />

                      <input
                        type="number"
                        min="1"
                        required
                        className="input-field"
                        placeholder="Qty"
                        value={row.qty}
                        onChange={(e) => handleItemChange(row.id, 'qty', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 8px', textAlign: 'center' }}
                      />

                      <input
                        type="number"
                        min="0"
                        required
                        className="input-field"
                        placeholder="Price"
                        value={row.price}
                        onChange={(e) => handleItemChange(row.id, 'price', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace' }}
                      />

                      <div style={{ textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        ৳{Number(row.subtotal).toLocaleString()}
                      </div>

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

              {/* Financials & Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'বিশেষ ছাড় / ডিসকাউন্ট (৳):' : 'Discount (৳):'}</label>
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
                  <label className="field-label">{lang === 'bn' ? 'আনুমানিক ভ্যাট হার (%):' : 'VAT Rate (%):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="field-label" style={{ margin: 0 }}>{lang === 'bn' ? 'বাণিজ্যিক শর্তাবলী ও নিয়মাবলী:' : 'Terms & Conditions:'}</label>
                  <VoiceInputButton
                    onVoiceInput={(text) => setTerms(prev => prev ? `${prev}\n• ${text}` : text)}
                    tooltip={lang === 'bn' ? 'ভয়েসে শর্তাবলী যোগ করুন' : 'Speak terms'}
                    size="sm"
                  />
                </div>
                <textarea
                  className="input-field"
                  rows="3"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>

              {/* Total Summary */}
              <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>{lang === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'} <strong>৳{formSubtotal.toLocaleString()}</strong></span>
                  {formDiscount > 0 && <span style={{ marginLeft: '12px', color: '#10b981' }}>{lang === 'bn' ? 'ছাড়:' : 'Discount:'} -৳{formDiscount.toLocaleString()}</span>}
                  <span style={{ marginLeft: '12px' }}>{lang === 'bn' ? 'ভ্যাট:' : 'VAT:'} +৳{formVat.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--business-primary)', fontFamily: 'monospace' }}>
                  {lang === 'bn' ? 'মোট আনুমানিক বাজেট: ' : 'Total Estimate: '} ৳{formGrandTotal.toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontWeight: '700' }}
                >
                  <FileCheck size={16} />
                  <span>{lang === 'bn' ? 'কোটেশন তৈরি ও প্রিন্ট করুন' : 'Create & Print Quotation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
