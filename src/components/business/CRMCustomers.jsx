import React, { useState, useMemo, useDeferredValue } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Mail,
  DollarSign,
  ArrowDownLeft,
  CheckCircle2,
  FileText,
  FileBadge,
  Eye,
  Trash2,
  Edit,
  Upload,
  X,
  Building,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Download,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { SmartVoiceFormBanner } from '../common/SmartVoiceFormBanner';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { triggerSoundboxPayment } from '../../services/soundboxService';
import { DueReminderModal } from '../common/DueReminderModal';
import { exportCustomersToCSV } from '../../services/exportService';

export const CRMCustomers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, collectDue, t, lang, businessSettings, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [reminderCustomer, setReminderCustomer] = useState(null);

  // Form State for Add / Edit
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    companyName: '',
    customerType: 'খুচরা (Retail)',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    creditLimit: '20000',
    outstandingDue: '',
    nidNo: '',
    tradeLicenseNo: '',
    nidDoc: null,
    tradeLicenseDoc: null,
    visitingCardDoc: null,
    notes: ''
  });

  const totalCustomers = customers.length;
  const totalMarketDue = useMemo(() => customers.reduce((sum, c) => sum + (Number(c.outstandingDue) || 0), 0), [customers]);
  const customersWithDue = useMemo(() => customers.filter(c => (Number(c.outstandingDue) || 0) > 0).length, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    return customers.filter(c => {
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const matchesDue = !filterDueOnly || (Number(c.outstandingDue) || 0) > 0;
      if (!matchesDue) return false;

      const matchesType = selectedType === 'all' || (c.customerType && c.customerType.includes(selectedType));
      return matchesType;
    });
  }, [customers, deferredSearchTerm, filterDueOnly, selectedType]);

  // Handle file uploads into base64 for instant preview & persistence
  const handleFileUpload = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomerForm(prev => ({
        ...prev,
        [field]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingCustomerId(null);
    setCustomerForm({
      name: '',
      companyName: '',
      customerType: 'খুচরা (Retail)',
      phone: '',
      altPhone: '',
      email: '',
      address: '',
      creditLimit: '20000',
      outstandingDue: '',
      nidNo: '',
      tradeLicenseNo: '',
      nidDoc: null,
      tradeLicenseDoc: null,
      visitingCardDoc: null,
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomerId(cust.id);
    setCustomerForm({
      name: cust.name || '',
      companyName: cust.companyName || '',
      customerType: cust.customerType || 'খুচরা (Retail)',
      phone: cust.phone || '',
      altPhone: cust.altPhone || '',
      email: cust.email || '',
      address: cust.address || '',
      creditLimit: cust.creditLimit || '20000',
      outstandingDue: cust.outstandingDue || '0',
      nidNo: cust.nidNo || '',
      tradeLicenseNo: cust.tradeLicenseNo || '',
      nidDoc: cust.nidDoc || null,
      tradeLicenseDoc: cust.tradeLicenseDoc || null,
      visitingCardDoc: cust.visitingCardDoc || null,
      notes: cust.notes || ''
    });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.phone) return;

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, {
        ...customerForm,
        creditLimit: Number(customerForm.creditLimit) || 0,
        outstandingDue: Number(customerForm.outstandingDue) || 0
      });
    } else {
      addCustomer({
        ...customerForm,
        creditLimit: Number(customerForm.creditLimit) || 0,
        outstandingDue: Number(customerForm.outstandingDue) || 0,
        totalPurchased: 0
      });
    }

    setShowAddModal(false);
  };

  const handleCollectSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !collectionAmount) return;
    const amt = Number(collectionAmount);
    collectDue(selectedCustomer.id, amt);
    triggerSoundboxPayment({
      amount: amt,
      customerName: selectedCustomer.name,
      paymentMethod: 'cash',
      type: 'debt_repay'
    });
    setShowCollectModal(false);
    setCollectionAmount('');
  };

  const handleOpenDetailModal = (cust) => {
    setSelectedCustomer(cust);
    setShowDetailModal(true);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} style={{ color: 'var(--business-primary)' }} />
            <span>{t.business.crmTitle}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? 'কাস্টমার প্রোফাইল, ট্রেড লাইসেন্স ও এনআইডি ডকুমেন্ট এবং বাকি খাতা' : 'Customer profiles, Trade License & NID documents, and due ledger'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportCustomersToCSV(customers, lang)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
            title={lang === 'bn' ? 'সকল কাস্টমার তালিকা এক্সেলে ডাউনলোড করুন' : 'Export customers to Excel CSV'}
          >
            <Download size={16} />
            <span>{lang === 'bn' ? 'এক্সেল এক্সপোর্ট' : 'Excel Export'}</span>
          </button>

          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Plus size={16} />
            <span>{lang === 'bn' ? '+ নতুন কাস্টমার ও ডকুমেন্ট যোগ করুন' : '+ Add Customer & Docs'}</span>
          </button>
        </div>
      </div>

      {/* Top CRM Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'মোট নিবন্ধিত কাস্টমার' : 'Total Customers'}</h3>
            <div className="stat-value">{totalCustomers}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'সক্রিয় ক্রেতা ও ক্লায়েন্ট তালিকা' : 'Active Client Base'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'বাজারে মোট বাকি (পাওনা)' : 'Total Outstanding Due'}</h3>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              ৳{totalMarketDue.toLocaleString()}
            </div>
            <div className="stat-trend" style={{ color: '#ef4444' }}>
              {customersWithDue} {lang === 'bn' ? 'জন কাস্টমারের কাছে বাকি' : 'clients have dues'}
            </div>
          </div>
        </div>

        <div className="glass-card stat-card glow-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>{lang === 'bn' ? 'ডকুমেন্ট ভেরিফাইড ক্লায়েন্ট' : 'Verified Clients'}</h3>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {customers.filter(c => c.nidNo || c.tradeLicenseNo || c.nidDoc || c.tradeLicenseDoc || c.hasNidDoc).length}
            </div>
            <div className="stat-trend" style={{ color: '#10b981' }}>
              {lang === 'bn' ? 'NID / ট্রেড লাইসেন্স সংযুক্ত' : 'NID & Trade License attached'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px', paddingRight: '40px' }}
            placeholder={lang === 'bn' ? 'কাস্টমার বা প্রতিষ্ঠানের নাম, মোবাইল বা ঠিকানা দিয়ে খুঁজুন...' : 'Search by name, company, phone or address...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <VoiceInputButton
              onResult={(text) => setSearchTerm(text)}
              title={lang === 'bn' ? 'কাস্টমার মুখে বলে খুঁজুন' : 'Search customer by voice'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <option value="all">{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            <option value="পাইকারি">{lang === 'bn' ? 'পাইকারি (Wholesale)' : 'Wholesale'}</option>
            <option value="খুচরা">{lang === 'bn' ? 'খুচরা (Retail)' : 'Retail'}</option>
            <option value="কর্পোরেট">{lang === 'bn' ? 'কর্পোরেট (Corporate)' : 'Corporate'}</option>
            <option value="ভিআইপি">{lang === 'bn' ? 'ভিআইপি (VIP)' : 'VIP'}</option>
          </select>

          <button
            className={`btn ${filterDueOnly ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setFilterDueOnly(!filterDueOnly)}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            {filterDueOnly ? (lang === 'bn' ? '✓ শুধু বাকি ফিল্টার করা' : '✓ Due Only') : (lang === 'bn' ? 'শুধু যাদের বাকি আছে' : 'Filter Dues')}
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'গ্রাহক ও প্রতিষ্ঠান' : 'Customer & Company'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'ক্যাটাগরি' : 'Type'}</th>
              <th style={{ padding: '10px' }}>{lang === 'bn' ? 'মোবাইল ও ঠিকানা' : 'Phone & Address'}</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>{lang === 'bn' ? 'সংযুক্ত ডকুমেন্ট' : 'Documents'}</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>{lang === 'bn' ? 'মোট কেনাকাটা' : 'Total Spent'}</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>{lang === 'bn' ? 'বকেয়া পাওনা' : 'Due Amount'}</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  {lang === 'bn' ? 'কোনো কাস্টমার তথ্য পাওয়া যায়নি' : 'No customer found'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => {
                const hasNid = cust.nidDoc || cust.nidNo || cust.hasNidDoc;
                const hasTradeLicense = cust.tradeLicenseDoc || cust.tradeLicenseNo || cust.hasTradeLicenseDoc;
                const hasDue = (Number(cust.outstandingDue) || 0) > 0;

                return (
                  <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{cust.name}</div>
                      {cust.companyName && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--business-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Building size={12} />
                          <span>{cust.companyName}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                        {cust.customerType || 'খুচরা'}
                      </span>
                    </td>

                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                        <Phone size={13} style={{ color: 'var(--text-dim)' }} />
                        <span>{cust.phone}</span>
                      </div>
                      {cust.address && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={11} style={{ color: 'var(--text-dim)' }} />
                          <span style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cust.address}</span>
                        </div>
                      )}
                    </td>

                    {/* Documents Indicator */}
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {hasNid && (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }} title={`NID: ${cust.nidNo || 'Uploaded'}`}>
                            NID ✓
                          </span>
                        )}
                        {hasTradeLicense && (
                          <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 6px' }} title={`Trade License: ${cust.tradeLicenseNo || 'Uploaded'}`}>
                            ট্রেড লাইসেন্স ✓
                          </span>
                        )}
                        {!hasNid && !hasTradeLicense && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>-</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', fontFamily: 'monospace', color: 'var(--text-main)' }}>
                      ৳{(Number(cust.totalPurchased) || 0).toLocaleString()}
                    </td>

                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '800', fontFamily: 'monospace', color: hasDue ? '#ef4444' : '#10b981' }}>
                      ৳{(Number(cust.outstandingDue) || 0).toLocaleString()}
                    </td>

                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center' }}>
                        {/* View Profile & Documents Button */}
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenDetailModal(cust)}
                          title={lang === 'bn' ? 'প্রোফাইল ও ডকুমেন্ট দেখুন' : 'View Profile & Documents'}
                          style={{ color: 'var(--business-primary)' }}
                        >
                          <Eye size={16} />
                        </button>

                        {/* Collect Due Button */}
                        {hasDue && (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => { setSelectedCustomer(cust); setShowCollectModal(true); }}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title={lang === 'bn' ? 'বাকি আদায় করুন' : 'Collect Due'}
                            >
                              <ArrowDownLeft size={13} />
                              <span>{lang === 'bn' ? 'আদায়' : 'Collect'}</span>
                            </button>

                            <button
                              className="btn btn-secondary"
                              onClick={() => setReminderCustomer(cust)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                color: '#25D366',
                                borderColor: 'rgba(37, 211, 102, 0.3)',
                                background: 'rgba(37, 211, 102, 0.1)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={lang === 'bn' ? 'হোয়াটসঅ্যাপ/এসএমএস তাগাদা পাঠান' : 'Send Due Reminder'}
                            >
                              <MessageCircle size={13} />
                              <span>{lang === 'bn' ? 'তাগাদা' : 'Reminder'}</span>
                            </button>
                          </>
                        )}

                        {/* Edit Button */}
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEditModal(cust)}
                          title={t.edit}
                        >
                          <Edit size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          className="btn-icon"
                          onClick={() => {
                            if (window.confirm(lang === 'bn' ? `আপনি কি নিশ্চিত যে "${cust.name}" কে মুছে ফেলতে চান?` : 'Delete customer?')) {
                              deleteCustomer(cust.id);
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

      {/* ADD / EDIT CUSTOMER MODAL WITH DOCUMENT UPLOAD */}
      {showAddModal && (
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
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {editingCustomerId
                      ? (lang === 'bn' ? 'কাস্টমার তথ্য ও ডকুমেন্ট সম্পাদনা' : 'Edit Customer Profile & Documents')
                      : (lang === 'bn' ? 'নতুন কাস্টমার নিবন্ধন ও ডকুমেন্ট আপলোড' : 'Add New Customer & Upload Documents')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'ট্রেড লাইসেন্স, এনআইডি এবং ব্যবসায়িক তথ্য সংরক্ষণ' : 'Store Trade License, NID, and contact details'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowAddModal(false)} title={t.close}>
                <X size={18} />
              </button>
            </div>

            <SmartVoiceFormBanner
              mode="customer"
              onParsed={(result) => {
                setCustomerForm((prev) => ({
                  ...prev,
                  name: result.name || prev.name,
                  phone: result.phone || prev.phone,
                  address: result.address || prev.address
                }));
              }}
            />

            <form onSubmit={handleFormSubmit}>
              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'গ্রাহকের পুরো নাম *:' : 'Customer Full Name *:'}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: হাজী আব্দুর রহমান' : 'Full Name'}
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'প্রতিষ্ঠানের নাম (যদি থাকে):' : 'Company / Shop Name:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'যেমন: মেসার্স রহমান ব্রাদার্স' : 'Company Name'}
                    value={customerForm.companyName}
                    onChange={(e) => setCustomerForm({ ...customerForm, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'গ্রাহকের ধরন / ক্যাটাগরি:' : 'Customer Type:'}</label>
                  <select
                    className="input-field"
                    value={customerForm.customerType}
                    onChange={(e) => setCustomerForm({ ...customerForm, customerType: e.target.value })}
                  >
                    <option value="খুচরা (Retail)">{lang === 'bn' ? 'খুচরা গ্রাহক (Retail)' : 'Retail'}</option>
                    <option value="পাইকারি (Wholesale)">{lang === 'bn' ? 'পাইকারি বিক্রেতা (Wholesale)' : 'Wholesale'}</option>
                    <option value="কর্পোরেট (Corporate)">{lang === 'bn' ? 'কর্পোরেট প্রতিষ্ঠান (Corporate)' : 'Corporate'}</option>
                    <option value="ভিআইপি (VIP Retail)">{lang === 'bn' ? 'ভিআইপি গ্রাহক (VIP)' : 'VIP'}</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'প্রধান মোবাইল নম্বর *:' : 'Primary Phone *:'}</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="017XX-XXXXXX"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'বিকল্প মোবাইল নম্বর:' : 'Alternate Phone:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="018XX-XXXXXX"
                    value={customerForm.altPhone}
                    onChange={(e) => setCustomerForm({ ...customerForm, altPhone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'ইমেইল অ্যাড্রেস:' : 'Email Address:'}</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="client@example.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Address and Credit */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '1.25rem' }}>
                <div>
                  <label className="field-label">{lang === 'bn' ? 'পূর্ণাঙ্গ ঠিকানা (দোকান / বাসা):' : 'Full Address:'}</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={lang === 'bn' ? 'রোড, বাসা, বাজার বা এলাকার ঠিকানা' : 'Address'}
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'বাকি লিমিট (৳):' : 'Credit Limit (৳):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={customerForm.creditLimit}
                    onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">{lang === 'bn' ? 'পূর্বের বকেয়া (৳):' : 'Opening Due (৳):'}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    value={customerForm.outstandingDue}
                    onChange={(e) => setCustomerForm({ ...customerForm, outstandingDue: e.target.value })}
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FileBadge size={18} style={{ color: 'var(--business-primary)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {lang === 'bn' ? 'প্রয়োজনীয় ডকুমেন্ট ও পরিচয়পত্র আপলোড (Documents Upload)' : 'Required Documents & Identity Upload'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {/* NID Card */}
                  <div style={{ border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} style={{ color: '#10b981' }} />
                      <span>{lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)'}</span>
                    </div>

                    <input
                      type="text"
                      className="input-field"
                      placeholder={lang === 'bn' ? 'এনআইডি / স্মার্ট কার্ড নম্বর' : 'NID Number'}
                      value={customerForm.nidNo}
                      onChange={(e) => setCustomerForm({ ...customerForm, nidNo: e.target.value })}
                      style={{ marginBottom: '8px', fontSize: '0.8rem' }}
                    />

                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Upload size={14} />
                        <span>{customerForm.nidDoc ? (lang === 'bn' ? '✓ ফাইল আপলোড করা হয়েছে' : '✓ NID Uploaded') : (lang === 'bn' ? 'NID ছবি বা স্ক্যান আপলোড' : 'Upload NID File')}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload('nidDoc', e.target.files[0])}
                      />
                    </label>

                    {customerForm.nidDoc && (
                      <div style={{ marginTop: '8px', position: 'relative' }}>
                        <img
                          src={customerForm.nidDoc}
                          alt="NID Preview"
                          style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #10b981' }}
                        />
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, nidDoc: null })}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Trade License */}
                  <div style={{ border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} style={{ color: '#3b82f6' }} />
                      <span>{lang === 'bn' ? 'ট্রেড লাইসেন্স (Trade License)' : 'Trade License'}</span>
                    </div>

                    <input
                      type="text"
                      className="input-field"
                      placeholder={lang === 'bn' ? 'ট্রেড লাইসেন্স নম্বর' : 'License Number'}
                      value={customerForm.tradeLicenseNo}
                      onChange={(e) => setCustomerForm({ ...customerForm, tradeLicenseNo: e.target.value })}
                      style={{ marginBottom: '8px', fontSize: '0.8rem' }}
                    />

                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Upload size={14} />
                        <span>{customerForm.tradeLicenseDoc ? (lang === 'bn' ? '✓ লাইসেন্স আপলোড হয়েছে' : '✓ License Uploaded') : (lang === 'bn' ? 'লাইসেন্স কপি আপলোড' : 'Upload License File')}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload('tradeLicenseDoc', e.target.files[0])}
                      />
                    </label>

                    {customerForm.tradeLicenseDoc && (
                      <div style={{ marginTop: '8px', position: 'relative' }}>
                        <img
                          src={customerForm.tradeLicenseDoc}
                          alt="Trade License Preview"
                          style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #3b82f6' }}
                        />
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, tradeLicenseDoc: null })}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Visiting Card or Photo */}
                  <div style={{ border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ImageIcon size={14} style={{ color: '#f59e0b' }} />
                      <span>{lang === 'bn' ? 'ভিজিটিং কার্ড / ছবি' : 'Visiting Card / Photo'}</span>
                    </div>

                    <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'দোকানের ভিজিটিং কার্ড বা কাস্টমারের ছবি' : 'Store card or client photo'}
                    </p>

                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Upload size={14} />
                        <span>{customerForm.visitingCardDoc ? (lang === 'bn' ? '✓ কার্ড আপলোড হয়েছে' : '✓ Card Uploaded') : (lang === 'bn' ? 'ছবি বা কার্ড আপলোড' : 'Upload Card/Photo')}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload('visitingCardDoc', e.target.files[0])}
                      />
                    </label>

                    {customerForm.visitingCardDoc && (
                      <div style={{ marginTop: '8px', position: 'relative' }}>
                        <img
                          src={customerForm.visitingCardDoc}
                          alt="Visiting Card Preview"
                          style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #f59e0b' }}
                        />
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, visitingCardDoc: null })}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontWeight: '700' }}>
                  {editingCustomerId ? (lang === 'bn' ? 'আপডেট সংরক্ষণ করুন' : 'Update Profile') : (lang === 'bn' ? 'কাস্টমার সংরক্ষণ করুন' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS & DOCUMENTS VIEWER MODAL */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div
            className="modal-content animate-fade-in"
            style={{
              maxWidth: '650px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                    {selectedCustomer.name}
                  </h3>
                  <span className="badge badge-primary">{selectedCustomer.customerType || 'Retail'}</span>
                </div>
                {selectedCustomer.companyName && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--business-primary)', fontWeight: '600', marginTop: '2px' }}>
                    🏢 {selectedCustomer.companyName}
                  </div>
                )}
              </div>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)} title={t.close}>
                <X size={18} />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'মোট ক্রয়' : 'Total Spent'}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                  ৳{(Number(selectedCustomer.totalPurchased) || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'বর্তমান বকেয়া' : 'Outstanding'}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
                  ৳{(Number(selectedCustomer.outstandingDue) || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'bn' ? 'বাকি লিমিট' : 'Credit Limit'}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
                  ৳{(Number(selectedCustomer.creditLimit) || 20000).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
              <div><strong>{lang === 'bn' ? 'মোবাইল:' : 'Phone:'}</strong> {selectedCustomer.phone} {selectedCustomer.altPhone && `| ${selectedCustomer.altPhone}`}</div>
              {selectedCustomer.email && <div><strong>{lang === 'bn' ? 'ইমেইল:' : 'Email:'}</strong> {selectedCustomer.email}</div>}
              {selectedCustomer.address && <div><strong>{lang === 'bn' ? 'ঠিকানা:' : 'Address:'}</strong> {selectedCustomer.address}</div>}
              {selectedCustomer.nidNo && <div><strong>{lang === 'bn' ? 'এনআইডি নম্বর:' : 'NID No:'}</strong> {selectedCustomer.nidNo}</div>}
              {selectedCustomer.tradeLicenseNo && <div><strong>{lang === 'bn' ? 'ট্রেড লাইসেন্স নম্বর:' : 'Trade License:'}</strong> {selectedCustomer.tradeLicenseNo}</div>}
            </div>

            {/* Attached Documents Viewer */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileBadge size={16} style={{ color: 'var(--business-primary)' }} />
                <span>{lang === 'bn' ? 'সংযুক্ত নথিপত্র ও প্রমাণপত্র (Uploaded Documents)' : 'Uploaded Documents & IDs'}</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {selectedCustomer.nidDoc ? (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>National ID (NID)</div>
                    <img src={selectedCustomer.nidDoc} alt="NID" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    <ShieldCheck size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                    {selectedCustomer.hasNidDoc ? (lang === 'bn' ? 'NID যাচাইকৃত' : 'NID Verified') : (lang === 'bn' ? 'NID ফাইল নেই' : 'No NID file')}
                  </div>
                )}

                {selectedCustomer.tradeLicenseDoc ? (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Trade License</div>
                    <img src={selectedCustomer.tradeLicenseDoc} alt="Trade License" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    <Building size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                    {selectedCustomer.hasTradeLicenseDoc ? (lang === 'bn' ? 'ট্রেড লাইসেন্স ভেরিফাইড' : 'License Verified') : (lang === 'bn' ? 'ট্রেড লাইসেন্স ফাইল নেই' : 'No License file')}
                  </div>
                )}

                {selectedCustomer.visitingCardDoc && (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>Visiting Card</div>
                    <img src={selectedCustomer.visitingCardDoc} alt="Card" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                {t.close}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenEditModal(selectedCustomer);
                }}
              >
                {t.edit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT DUE MODAL */}
      {showCollectModal && selectedCustomer && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                {t.business.collectDue}
              </h3>
              <button className="btn-icon" onClick={() => setShowCollectModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedCustomer.name}</div>
              {selectedCustomer.companyName && <div style={{ fontSize: '0.78rem', color: 'var(--business-primary)' }}>{selectedCustomer.companyName}</div>}
              <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '4px', fontWeight: '700' }}>
                {lang === 'bn' ? 'বর্তমান মোট বকেয়া:' : 'Total Due:'} ৳{Number(selectedCustomer.outstandingDue).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleCollectSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>{lang === 'bn' ? 'আদায়কৃত টাকার পরিমাণ (৳) *' : 'Amount to Collect *'}</label>
                  <VoiceInputButton
                    onVoiceInput={(text) => {
                      const num = text.replace(/[^0-9.]/g, '');
                      if (num) setCollectionAmount(num);
                    }}
                    tooltip={lang === 'bn' ? 'ভয়েসে টাকা বলুন' : 'Speak amount'}
                    size="sm"
                  />
                </div>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.outstandingDue}
                  required
                  autoFocus
                  className="input-field"
                  placeholder="0"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCollectModal(false)}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontWeight: '700' }}>
                  {lang === 'bn' ? 'বাকি আদায় নিশ্চিত করুন' : 'Confirm Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUE REMINDER MODAL (WHATSAPP & SMS) */}
      <DueReminderModal
        isOpen={Boolean(reminderCustomer)}
        onClose={() => setReminderCustomer(null)}
        customer={reminderCustomer}
        businessSettings={businessSettings}
        lang={lang}
        showToast={showToast}
      />
    </div>
  );
};
