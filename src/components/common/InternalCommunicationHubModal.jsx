import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  ShieldCheck,
  Megaphone,
  Wallet,
  ShoppingBag,
  User,
  Paperclip,
  CheckCheck,
  Clock,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Trash2,
  Info,
  Sparkles,
  Users,
  Store,
  Building2,
  RefreshCw,
  Search,
  Reply,
  Image as ImageIcon,
  FileText,
  Download,
  Eye,
  Check,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getLocalDeviceId } from '../../services/liveSyncService';
import {
  CHANNELS,
  getStoredMessages,
  saveMessage,
  markChannelAsRead,
  clearChannelHistory,
  syncCloudMessages,
  deleteMessage,
  compressImageFile
} from '../../services/internalChatService';

export const InternalCommunicationHubModal = ({ isOpen, onClose }) => {
  const {
    lang,
    showToast,
    businessSettings,
    employees = [],
    clientLicensesRegistry = [],
    salesHistory = [],
    invoices = [],
    branches = []
  } = useApp();

  const {
    user,
    isSuperAdmin,
    role,
    staffAccounts = [],
    isOwner,
    isCashier,
    isSalesman,
    isSR
  } = useAuth();

  // Active target state: default to 1-on-1 or appropriate channel
  const [activeTarget, setActiveTarget] = useState(() => ({
    type: 'channel',
    id: 'super_admin_desk',
    title: 'সুপার এডমিন হেল্পডেস্ক ও নোটিশ',
    role: 'Platform',
    phone: null
  }));

  const [messages, setMessages] = useState(() => getStoredMessages());
  const [inputText, setInputText] = useState('');
  const [msgCategory, setMsgCategory] = useState('normal'); // 'normal' | 'notice' | 'handover' | 'invoice'
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('direct'); // 'direct' | 'channels'

  // Advanced Attachments & Reply States
  const [replyingTo, setReplyingTo] = useState(null);
  const [attachedInvoice, setAttachedInvoice] = useState(null);
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [showInvoicePicker, setShowInvoicePicker] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [zoomImage, setZoomImage] = useState(null);
  const [handoverAmount, setHandoverAmount] = useState('');

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const myLocalDeviceId = getLocalDeviceId();

  const activeUserId = isSuperAdmin ? 'super_admin' : (user?.id || (isOwner ? 'owner' : 'staff'));
  const activeUserName = isSuperAdmin
    ? 'সুপার এডমিন (Super Admin)'
    : (user?.name || businessSettings?.companyName || 'ব্যবসা পরিচালক');
  const activeUserEmail = user?.email || (isSuperAdmin ? 'superadmin@hisabkitab360.com' : '');
  const activeUserRole = isSuperAdmin
    ? 'সুপার এডমিন'
    : (isOwner ? 'মালিক' : (isCashier ? 'ক্যাশিয়ার' : (isSalesman || isSR ? 'এসআর/সেলসম্যান' : 'স্টাফ')));

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const refreshed = await syncCloudMessages();
      setMessages(refreshed);
    } catch {}
    setIsCloudSyncing(false);
  };

  useEffect(() => {
    if (isOpen) {
      setMessages(getStoredMessages());
      markChannelAsRead(activeTarget.id, activeUserId);
      handleCloudSync();
      setTimeout(scrollToBottom, 120);
    }
  }, [isOpen, activeTarget]);

  // Listen to message updates & deletions
  useEffect(() => {
    const handleNewMsg = () => {
      setMessages(getStoredMessages());
      if (isOpen) {
        markChannelAsRead(activeTarget.id, activeUserId);
        setTimeout(scrollToBottom, 100);
      }
    };

    window.addEventListener('hk360_internal_msg_received', handleNewMsg);
    window.addEventListener('hk360_internal_msg_cleared', handleNewMsg);
    return () => {
      window.removeEventListener('hk360_internal_msg_received', handleNewMsg);
      window.removeEventListener('hk360_internal_msg_cleared', handleNewMsg);
    };
  }, [isOpen, activeTarget, activeUserId]);

  if (!isOpen) return null;

  // Filter messages for current target with robust cross-device and multi-role matching
  const currentMessages = messages.filter((m) => {
    if (activeTarget.type === 'channel') {
      return m.channelId === activeTarget.id;
    }

    // 1-on-1 Direct Message Matching
    const targetId = activeTarget.id;
    const targetEmail = (activeTarget.email || '').toLowerCase().trim();
    const targetPhone = (activeTarget.phone || '').trim();
    const myId = activeUserId;
    const myEmail = (activeUserEmail || '').toLowerCase().trim();

    // Check if message was sent by me
    const isSenderMe =
      m.senderDeviceId === myLocalDeviceId ||
      m.senderId === myId ||
      (isSuperAdmin && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন')) ||
      (isOwner && (m.senderId === 'owner' || m.senderRole === 'Owner' || m.senderRole === 'admin' || m.senderRole === 'মালিক')) ||
      (myEmail && m.senderEmail?.toLowerCase() === myEmail);

    // Check if message was meant for me
    const isRecipientMe =
      m.recipientId === myId ||
      (isSuperAdmin && (m.recipientId === 'super_admin' || m.recipientRole === 'Super Admin' || m.recipientRole === 'সুপার এডমিন')) ||
      (isOwner && (m.recipientId === 'owner' || m.recipientId === 'merchant' || m.recipientId === 'merchant_owner')) ||
      (myEmail && m.recipientEmail?.toLowerCase() === myEmail) ||
      (user?.phone && m.recipientPhone === user.phone);

    // Check if message was sent by target
    const isSenderTarget =
      m.senderId === targetId ||
      (targetId === 'super_admin' && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন')) ||
      (targetId === 'merchant_owner' && (m.senderId === 'owner' || m.senderRole === 'Owner' || m.senderRole === 'admin' || m.senderRole === 'মালিক')) ||
      (targetEmail && m.senderEmail?.toLowerCase() === targetEmail) ||
      (targetPhone && m.senderPhone === targetPhone);

    // Check if message was meant for target
    const isRecipientTarget =
      m.recipientId === targetId ||
      (targetId === 'super_admin' && (m.recipientId === 'super_admin' || m.recipientRole === 'Super Admin')) ||
      (targetId === 'merchant_owner' && (m.recipientId === 'owner' || m.recipientId === 'merchant' || m.recipientId === 'merchant_owner')) ||
      (targetEmail && m.recipientEmail?.toLowerCase() === targetEmail) ||
      (targetPhone && m.recipientPhone === targetPhone);

    return (isSenderMe && isRecipientTarget) || (isSenderTarget && isRecipientMe);
  });

  // Handle File Upload & Auto Compression
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, 1024, 0.75);
        setAttachedMedia({
          type: 'image',
          name: file.name,
          size: compressed.size,
          dataUrl: compressed.dataUrl
        });
      } catch (err) {
        console.warn('Image compress failed, using fallback:', err);
        const reader = new FileReader();
        reader.onload = (re) => {
          setAttachedMedia({
            type: 'image',
            name: file.name,
            size: file.size,
            dataUrl: re.target.result
          });
        };
        reader.readAsDataURL(file);
      }
    } else {
      // Document (PDF, Word, etc.)
      if (file.size > 8 * 1024 * 1024) {
        alert(lang === 'bn' ? 'ফাইল সাইজ সর্বোচ্চ ৮ মেগাবাইট হতে পারবে।' : 'File size must be under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (re) => {
        setAttachedMedia({
          type: 'document',
          name: file.name,
          size: file.size,
          dataUrl: re.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !attachedInvoice && !attachedMedia && !handoverAmount) return;

    const payload = {
      senderId: activeUserId,
      senderName: activeUserName,
      senderEmail: activeUserEmail,
      senderPhone: user?.phone || null,
      senderRole: activeUserRole,
      senderDeviceId: myLocalDeviceId,
      channelId: activeTarget.type === 'channel' ? activeTarget.id : null,
      recipientId: activeTarget.type === 'dm' ? activeTarget.id : null,
      recipientName: activeTarget.title,
      recipientRole: activeTarget.role || (activeTarget.type === 'dm' ? 'Staff' : 'Channel'),
      recipientEmail: activeTarget.type === 'dm' ? (activeTarget.email || null) : null,
      recipientPhone: activeTarget.type === 'dm' ? (activeTarget.phone || null) : null,
      recipientShopName: activeTarget.type === 'dm' ? activeTarget.title : null,
      text: inputText.trim(),
      category: msgCategory,
      replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName, text: replyingTo.text } : null,
      attachment: attachedInvoice
        ? { type: 'invoice', ...attachedInvoice }
        : attachedMedia
        ? { ...attachedMedia }
        : null,
      meta: {
        handoverAmount: handoverAmount ? Number(handoverAmount) : null
      }
    };

    saveMessage(payload);
    setInputText('');
    setReplyingTo(null);
    setAttachedInvoice(null);
    setAttachedMedia(null);
    setHandoverAmount('');
    setMsgCategory('normal');
    setTimeout(scrollToBottom, 60);
  };

  const handleDeleteMsg = async (msgId) => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত এই মেসেজটি সবার জন্য মুছে ফেলতে চান?' : 'Delete this message for everyone?')) {
      await deleteMessage(msgId, true);
    }
  };

  const handleAcknowledgeNotice = (msgId) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg) return;

    saveMessage({
      senderId: activeUserId,
      senderName: activeUserName,
      senderEmail: activeUserEmail,
      senderRole: activeUserRole,
      senderDeviceId: myLocalDeviceId,
      channelId: activeTarget.type === 'channel' ? activeTarget.id : null,
      recipientId: activeTarget.type === 'dm' ? activeTarget.id : null,
      recipientName: targetMsg.senderName,
      recipientRole: targetMsg.senderRole,
      recipientEmail: activeTarget.type === 'dm' ? (activeTarget.email || null) : null,
      text: `✅ ${activeUserName} নোটিশটি দেখেছেন এবং বুঝে পেয়েছেন।`,
      category: 'normal',
      replyTo: { id: targetMsg.id, senderName: targetMsg.senderName, text: targetMsg.text }
    });
  };

  const getChannelIcon = (id) => {
    switch (id) {
      case 'super_admin_desk':
        return <ShieldCheck size={18} color="#3b82f6" />;
      case 'cashier_desk':
        return <Wallet size={18} color="#10b981" />;
      case 'sales_team':
        return <ShoppingBag size={18} color="#f59e0b" />;
      default:
        return <Megaphone size={18} color="#8b5cf6" />;
    }
  };

  // Filter clients for SuperAdmin search
  const filteredClients = clientLicensesRegistry.filter((c) => {
    if (!clientSearchQuery.trim()) return true;
    const q = clientSearchQuery.toLowerCase();
    return (
      (c.clientShopName && c.clientShopName.toLowerCase().includes(q)) ||
      (c.clientEmail && c.clientEmail.toLowerCase().includes(q)) ||
      (c.clientPhone && c.clientPhone.includes(q)) ||
      (c.licenseKey && c.licenseKey.toLowerCase().includes(q))
    );
  });

  // Recent invoices pool (from invoices & salesHistory)
  const allInvoicesPool = [
    ...(invoices || []),
    ...(salesHistory || []).map((s) => ({
      id: s.id || s.invoiceNumber,
      invoiceNumber: s.invoiceNumber || s.id,
      customerName: s.customerName || 'সাধারণ ক্রেতা',
      grandTotal: s.grandTotal || s.totalAmount || 0,
      date: s.date || s.timestamp,
      itemsCount: s.items?.length || 1
    }))
  ];

  const filteredInvoices = allInvoicesPool.filter((inv) => {
    if (!invoiceSearch.trim()) return true;
    const q = invoiceSearch.toLowerCase();
    return (
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q))
    );
  }).slice(0, 15);

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, padding: '10px' }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '1150px',
          width: '100%',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-main)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isSuperAdmin
                  ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              {isSuperAdmin ? <ShieldCheck size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {isSuperAdmin
                    ? (lang === 'bn' ? 'সুপার এডমিন সেন্ট্রাল সাপোর্ট ও ১-অন-১ মার্চেন্ট হাব' : 'Super Admin Central Support & 1-on-1 Merchant Hub')
                    : (lang === 'bn' ? 'সেন্ট্রাল ১-অন-১ চ্যাট, ইনভয়েস ও টিম হাব' : 'Internal 1-on-1 Chat, Invoice & Team Hub')}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  REALTIME CLOUD SYNC
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'সাইডবার থেকে ব্যক্তি নির্বাচন করুন: আপনার পাঠানো মেসেজ ডানে (Right), অপরের মেসেজ বামে (Left) আলাদা থাকবে।'
                  : 'Select contact from sidebar: Sent messages appear on the Right, Received on the Left.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCloudSync}
              disabled={isCloudSyncing}
              title={lang === 'bn' ? 'ক্লাউড থেকে মেসেজ রিফ্রেশ করুন' : 'Refresh messages from Cloud'}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem'
              }}
            >
              <RefreshCw size={13} className={isCloudSyncing ? 'animate-spin' : ''} />
              <span>{isCloudSyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'সিঙ্ক' : 'Sync')}</span>
            </button>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content: Left Sidebar + Right Chat Window */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar: Distinct Contacts Directory */}
          <div
            style={{
              width: '310px',
              borderRight: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Sidebar View Tabs: 1-on-1 vs Channels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px', gap: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setSidebarTab('direct')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: sidebarTab === 'direct' ? 'var(--business-primary)' : 'transparent',
                  color: sidebarTab === 'direct' ? '#fff' : 'var(--text-muted)',
                  fontWeight: '800',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <User size={13} />
                <span>১-অন-১ ব্যক্তি</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('channels')}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: sidebarTab === 'channels' ? 'var(--business-primary)' : 'transparent',
                  color: sidebarTab === 'channels' ? '#fff' : 'var(--text-muted)',
                  fontWeight: '800',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Users size={13} />
                <span>টিম চ্যানেল</span>
              </button>
            </div>

            {/* TAB 1: 1-ON-1 DIRECT CONTACTS */}
            {sidebarTab === 'direct' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* 1. Super Admin Support Desk (Visible to Merchant & Staff) */}
                {!isSuperAdmin && (
                  <>
                    <div style={{ padding: '10px 14px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🛡️ সুপার এডমিন সরাসরি সাপোর্ট
                    </div>
                    <div
                      onClick={() =>
                        setActiveTarget({
                          type: 'dm',
                          id: 'super_admin',
                          title: 'সুপার এডমিন (Super Admin Helpdesk)',
                          role: 'সুপার এডমিন',
                          phone: null
                        })
                      }
                      style={{
                        padding: '10px 12px',
                        margin: '2px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: activeTarget.type === 'dm' && activeTarget.id === 'super_admin' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        border: activeTarget.type === 'dm' && activeTarget.id === 'super_admin' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid transparent',
                        color: activeTarget.type === 'dm' && activeTarget.id === 'super_admin' ? '#ef4444' : 'var(--text-main)',
                        fontWeight: activeTarget.type === 'dm' && activeTarget.id === 'super_admin' ? '800' : '500',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <ShieldCheck size={18} color="#ef4444" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '800' }}>সুপার এডমিন হেল্পডেস্ক</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>সফটওয়্যার মালিকের সাথে সরাসরি চ্যাট</div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Super Admin View: List of all registered merchants/clients */}
                {isSuperAdmin && (
                  <>
                    <div style={{ padding: '10px 14px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🛡️ নিবন্ধিত ব্যবসায়ী ও মার্চেন্ট ({clientLicensesRegistry.length})
                    </div>

                    <div style={{ padding: '0 8px 6px' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="ব্যবসায়ী বা দোকান খুঁজুন..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '5px 8px 5px 26px',
                            fontSize: '0.74rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-main)',
                            color: 'var(--text-main)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '6px' }}>
                      {filteredClients.length === 0 ? (
                        <div style={{ padding: '8px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          কোনো ব্যবসায়ী পাওয়া যায়নি
                        </div>
                      ) : (
                        filteredClients.map((client) => {
                          const isActive = activeTarget.type === 'dm' && (activeTarget.id === client.id || activeTarget.email === client.clientEmail);
                          return (
                            <div
                              key={client.id || client.clientEmail}
                              onClick={() =>
                                setActiveTarget({
                                  type: 'dm',
                                  id: client.id || client.clientEmail,
                                  email: client.clientEmail,
                                  phone: client.clientPhone,
                                  title: client.clientShopName || 'ব্যবসায়ী',
                                  role: 'মার্চেন্ট মালিক'
                                })
                              }
                              style={{
                                padding: '8px 12px',
                                margin: '2px 8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                                color: isActive ? '#10b981' : 'var(--text-main)',
                                fontWeight: isActive ? '800' : '500'
                              }}
                            >
                              <Store size={15} color="#10b981" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {client.clientShopName || 'নিবন্ধিত ব্যবসায়ী'}
                                </div>
                                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                                  {client.clientEmail || client.clientPhone}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}

                {/* 3. Staff View: 1-on-1 Direct Chat with Merchant Owner */}
                {(isCashier || isSalesman || isSR || user?.isStaffUser) && (
                  <>
                    <div style={{ padding: '10px 14px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      👑 প্রতিষ্ঠান মালিক / ব্যবসা পরিচালক
                    </div>
                    <div
                      onClick={() =>
                        setActiveTarget({
                          type: 'dm',
                          id: 'merchant_owner',
                          title: businessSettings?.companyName || 'দোকান মালিক',
                          role: 'প্রতিষ্ঠান মালিক',
                          phone: businessSettings?.phone || null
                        })
                      }
                      style={{
                        padding: '10px 12px',
                        margin: '2px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: activeTarget.type === 'dm' && activeTarget.id === 'merchant_owner' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        border: activeTarget.type === 'dm' && activeTarget.id === 'merchant_owner' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                        color: activeTarget.type === 'dm' && activeTarget.id === 'merchant_owner' ? '#10b981' : 'var(--text-main)',
                        fontWeight: activeTarget.type === 'dm' && activeTarget.id === 'merchant_owner' ? '800' : '500'
                      }}
                    >
                      <Store size={18} color="#10b981" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '800' }}>
                          {businessSettings?.companyName || 'দোকান মালিক'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          মালিকের সাথে সরাসরি ব্যক্তিগত বার্তা ও রিপোর্ট
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 4. Merchant View: 1-on-1 with Cashiers & POS Counters */}
                {isOwner && (
                  <>
                    <div style={{ padding: '12px 14px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🖥️ কাউন্টার ক্যাশিয়ারবৃন্দ
                    </div>
                    {staffAccounts.filter((s) => s.role === 'cashier').length === 0 ? (
                      <div style={{ padding: '4px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        কোনো ক্যাশিয়ার একাউন্ট তৈরি নেই
                      </div>
                    ) : (
                      staffAccounts.filter((s) => s.role === 'cashier').map((stf) => {
                        const isActive = activeTarget.type === 'dm' && activeTarget.id === stf.id;
                        return (
                          <div
                            key={stf.id}
                            onClick={() =>
                              setActiveTarget({
                                type: 'dm',
                                id: stf.id,
                                phone: stf.phone,
                                title: stf.name,
                                role: 'কাউন্টার ক্যাশিয়ার'
                              })
                            }
                            style={{
                              padding: '8px 12px',
                              margin: '2px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                              border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                              color: isActive ? '#10b981' : 'var(--text-main)',
                              fontWeight: isActive ? '800' : '500'
                            }}
                          >
                            <Wallet size={15} color="#10b981" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{stf.name}</div>
                              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>ক্যাশিয়ার • {stf.phone}</div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* 5. Merchant View: 1-on-1 with Salesmen & SR Officers */}
                    <div style={{ padding: '12px 14px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🛵 সেলসম্যান ও ফিল্ড অফিসার (SR)
                    </div>
                    {staffAccounts.filter((s) => s.role === 'salesman' || s.role === 'sr').length === 0 ? (
                      <div style={{ padding: '4px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        কোনো এসআর বা সেলসম্যান একাউন্ট তৈরি নেই
                      </div>
                    ) : (
                      staffAccounts.filter((s) => s.role === 'salesman' || s.role === 'sr').map((stf) => {
                        const isActive = activeTarget.type === 'dm' && activeTarget.id === stf.id;
                        return (
                          <div
                            key={stf.id}
                            onClick={() =>
                              setActiveTarget({
                                type: 'dm',
                                id: stf.id,
                                phone: stf.phone,
                                title: stf.name,
                                role: stf.role === 'sr' ? 'এসআর ফিল্ড অফিসার' : 'সেলসম্যান'
                              })
                            }
                            style={{
                              padding: '8px 12px',
                              margin: '2px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                              border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                              color: isActive ? '#6366f1' : 'var(--text-main)',
                              fontWeight: isActive ? '800' : '500'
                            }}
                          >
                            <ShoppingBag size={15} color="#6366f1" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{stf.name}</div>
                              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{stf.role === 'sr' ? 'ফিল্ড এসআর' : 'সেলসম্যান'} • {stf.phone}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: STORE & TEAM GROUP CHANNELS */}
            {sidebarTab === 'channels' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px 14px 4px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  গ্রুপ চ্যানেল
                </div>
                {CHANNELS.map((c) => {
                  const isActive = activeTarget.type === 'channel' && activeTarget.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveTarget({ type: 'channel', id: c.id, title: c.name, role: 'Group Channel' })}
                      style={{
                        padding: '10px 14px',
                        margin: '2px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                        color: isActive ? '#6366f1' : 'var(--text-main)',
                        fontWeight: isActive ? '800' : '500'
                      }}
                    >
                      {getChannelIcon(c.id)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {c.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Main Chat Window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
            {/* Chat Target Header: Shows exactly who you are chatting with */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface-color)'
              }}
            >
              <div>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{activeTarget.title}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: activeTarget.type === 'dm' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: activeTarget.type === 'dm' ? '#10b981' : '#6366f1',
                      border: `1px solid ${activeTarget.type === 'dm' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                      fontWeight: '800'
                    }}
                  >
                    {activeTarget.type === 'dm' ? `🎯 ১-অন-১ সরাসরি (${activeTarget.role || 'ব্যক্তি'})` : '👥 গ্রুপ চ্যানেল'}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeTarget.phone ? `মোবাইল: ${activeTarget.phone} • ` : ''}
                  {activeTarget.type === 'dm'
                    ? 'আপনার পাঠানো বার্তাগুলো ডানে (Right) এবং ওনার বার্তাগুলো বামে (Left) সাজানো থাকবে।'
                    : 'এই চ্যানেলের সকল বার্তা সংশ্লিষ্ট সকল অনুমোদিত সদস্য দেখতে পাবেন।'}
                </div>
              </div>

              {activeTarget.type === 'channel' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(lang === 'bn' ? 'এই চ্যানেলের সকল লোকাল মেসেজ হিস্ট্রি ক্লিয়ার করবেন?' : 'Clear local channel history?')) {
                      clearChannelHistory(activeTarget.id);
                    }
                  }}
                  title={lang === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear Chat'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Messages Feed: Strict Right (Sent by Me) vs Left (From Others) */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {currentMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '380px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}
                  >
                    <MessageSquare size={26} style={{ opacity: 0.5 }} />
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'কোনো পূর্ববর্তী বার্তা নেই' : 'No messages yet'}
                  </div>
                  <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? `"${activeTarget.title}"-এর সাথে সরাসরি কথা বলতে, চালান বা ডকুমেন্ট পাঠাতে নিচে মেসেজ লিখুন।`
                      : 'Send text, sales invoice cards, or documents below to start communicating.'}
                  </div>
                </div>
              ) : (
                currentMessages.map((m) => {
                  // Strict check: Was this message sent by me on this client/device?
                  let isMe = false;
                  if (m.senderDeviceId && m.senderDeviceId === myLocalDeviceId) {
                    isMe = true;
                  } else if (isSuperAdmin) {
                    isMe = (m.senderId === 'super_admin' || m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন' || m.senderEmail === activeUserEmail);
                  } else if (isOwner) {
                    isMe = (m.senderId === 'owner' || m.senderId === user?.id || m.senderRole === 'Owner' || m.senderRole === 'মালিক');
                  } else {
                    isMe = (m.senderId === user?.id || (user?.phone && m.senderPhone === user.phone));
                  }

                  const isFromSuperAdmin = m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন' || m.senderId === 'super_admin';
                  const timeFormatted = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                  if (m.isDeleted) {
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          marginLeft: isMe ? 'auto' : '0',
                          marginRight: isMe ? '0' : 'auto',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px dashed var(--border-color)',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontStyle: 'italic',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{lang === 'bn' ? '🚫 এই বার্তাটি মুছে ফেলা হয়েছে' : '🚫 This message was deleted'}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        marginLeft: isMe ? 'auto' : '0',
                        marginRight: isMe ? '0' : 'auto'
                      }}
                    >
                      {/* Explicit Sender ➔ Recipient Header Badge */}
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isMe ? (
                          <>
                            <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '1px 7px', borderRadius: '4px', fontWeight: '800' }}>
                              📤 প্রেরক: আপনি
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>➔</span>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>
                              🎯 প্রাপক: {m.recipientName || m.recipientShopName || activeTarget.title}
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1px 7px', borderRadius: '4px', fontWeight: '800' }}>
                              📥 প্রেরক: {m.senderName} ({m.senderRole || 'স্টাফ'})
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>➔</span>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>
                              🎯 প্রাপক: আপনি
                            </span>
                          </>
                        )}
                      </div>

                      {/* Main Message Bubble: Right = Blue/Indigo Gradient, Left = Slate Glass Card */}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isMe
                            ? 'linear-gradient(135deg, #4f46e5, #3730a3)'
                            : isFromSuperAdmin
                            ? 'rgba(239, 68, 68, 0.12)'
                            : m.category === 'notice'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'var(--surface-color)',
                          border: isMe
                            ? '1px solid rgba(255, 255, 255, 0.15)'
                            : isFromSuperAdmin
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : m.category === 'notice'
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid var(--border-color)',
                          color: isMe ? '#ffffff' : 'var(--text-main)',
                          boxShadow: isMe ? '0 4px 12px rgba(79, 70, 229, 0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
                          position: 'relative'
                        }}
                      >
                        {/* Notice Banner */}
                        {m.category === 'notice' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              color: '#ef4444',
                              fontWeight: '800',
                              fontSize: '0.78rem',
                              marginBottom: '6px',
                              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                              paddingBottom: '4px'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={14} />
                              <span>{lang === 'bn' ? 'জরুরি নোটিশ / ঘোষণা' : 'URGENT ANNOUNCEMENT'}</span>
                            </span>
                            {!isMe && (
                              <button
                                type="button"
                                onClick={() => handleAcknowledgeNotice(m.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid #ef4444',
                                  color: '#ef4444',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '0.68rem',
                                  cursor: 'pointer',
                                  fontWeight: '700'
                                }}
                              >
                                {lang === 'bn' ? '✓ বুঝে পেয়েছি' : '✓ Acknowledge'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Quoted / Reply Preview */}
                        {m.replyTo && (
                          <div
                            style={{
                              background: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                              borderLeft: '3px solid #10b981',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginBottom: '6px',
                              fontSize: '0.72rem'
                            }}
                          >
                            <strong style={{ color: '#10b981' }}>{m.replyTo.senderName}:</strong>{' '}
                            <span>{m.replyTo.text ? (m.replyTo.text.length > 50 ? `${m.replyTo.text.slice(0, 50)}...` : m.replyTo.text) : 'সংযুক্ত ফাইল'}</span>
                          </div>
                        )}

                        {/* Text Content */}
                        {m.text && (
                          <div style={{ fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {m.text}
                          </div>
                        )}

                        {/* Attached Invoice Card */}
                        {m.attachment?.type === 'invoice' && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(59, 130, 246, 0.08)',
                              border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(59, 130, 246, 0.3)',
                              minWidth: '220px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '800', color: isMe ? '#fff' : '#3b82f6', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Receipt size={14} /> #{m.attachment.invoiceNumber}
                              </span>
                              <span style={{ fontWeight: '900', color: '#10b981', fontSize: '0.96rem' }}>
                                ৳{(Number(m.attachment.grandTotal) || 0).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '3px' }}>
                              ক্রেতা: {m.attachment.customerName || 'সাধারণ ক্রেতা'}
                            </div>
                          </div>
                        )}

                        {/* Attached Image Preview */}
                        {m.attachment?.type === 'image' && (
                          <div style={{ marginTop: '8px', position: 'relative', cursor: 'pointer' }} onClick={() => setZoomImage(m.attachment.dataUrl)}>
                            <img
                              src={m.attachment.dataUrl}
                              alt={m.attachment.name || 'image'}
                              style={{ maxWidth: '280px', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', display: 'block' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                background: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                borderRadius: '4px',
                                padding: '2px 5px',
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Eye size={10} /> জুম দেখুন
                            </div>
                          </div>
                        )}

                        {/* Attached Document (PDF/Doc) */}
                        {m.attachment?.type === 'document' && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                              border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FileText size={16} color="#3b82f6" />
                              <span style={{ fontSize: '0.78rem', fontWeight: '700', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.attachment.name}
                              </span>
                            </div>
                            <a
                              href={m.attachment.dataUrl}
                              download={m.attachment.name}
                              style={{
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                textDecoration: 'none'
                              }}
                            >
                              <Download size={13} /> ডাউনলোড
                            </a>
                          </div>
                        )}

                        {/* Handover Amount Attachment */}
                        {m.meta?.handoverAmount && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isMe ? 'rgba(0,0,0,0.15)' : 'rgba(16, 185, 129, 0.1)',
                              border: '1px dashed rgba(16, 185, 129, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Wallet size={16} color="#10b981" />
                            <div>
                              <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                                {lang === 'bn' ? 'ক্যাশ হ্যান্ডওভার পরিমাণ' : 'Cash Handover Amount'}
                              </div>
                              <div style={{ fontWeight: '800', fontSize: '0.92rem', fontFamily: 'monospace' }}>
                                ৳{m.meta.handoverAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Footer: Time + Reply/Delete Actions */}
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} />
                          <span>{timeFormatted}</span>
                        </span>

                        {/* Reply Button */}
                        <button
                          type="button"
                          onClick={() => setReplyingTo(m)}
                          title="উত্তর দিন (Reply)"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}
                        >
                          <Reply size={12} />
                        </button>

                        {/* Delete Button (If I am sender or admin/owner) */}
                        {(isMe || isSuperAdmin || isOwner) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMsg(m.id)}
                            title="মেসেজ মুছুন (Delete)"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}

                        {isMe && <CheckCheck size={12} color="#10b981" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quoted Message Banner Above Input */}
            {replyingTo && (
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  borderTop: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Reply size={14} color="#6366f1" />
                  <strong style={{ color: '#6366f1' }}>{replyingTo.senderName}-কে উত্তর দিচ্ছেন:</strong>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>
                    {replyingTo.text || 'সংযুক্তি'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Attached Invoice Preview Pill */}
            {attachedInvoice && (
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  borderTop: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={15} color="#3b82f6" />
                  <span>সংযুক্ত চালান: <strong>#{attachedInvoice.invoiceNumber}</strong> (৳{attachedInvoice.grandTotal?.toLocaleString()}) - {attachedInvoice.customerName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedInvoice(null)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Attached File/Image Preview Pill */}
            {attachedMedia && (
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderTop: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {attachedMedia.type === 'image' ? <ImageIcon size={15} color="#10b981" /> : <FileText size={15} color="#10b981" />}
                  <span>সংযুক্ত ফাইল: <strong>{attachedMedia.name}</strong> ({Math.round((attachedMedia.size || 0) / 1024)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Handover Amount Input Bar */}
            {msgCategory === 'handover' && (
              <div style={{ padding: '8px 16px', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={16} color="#10b981" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>{lang === 'bn' ? 'ক্যাশ পরিমাণ (৳):' : 'Cash Amount (৳):'}</span>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={handoverAmount}
                  onChange={(e) => setHandoverAmount(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    width: '120px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMsgCategory('normal')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  বাতিল
                </button>
              </div>
            )}

            {/* Bottom Quick Tools & Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Mandatory Recipient Lock Badge Bar: Explicitly shows who will receive the message */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.76rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '800', color: '#6366f1' }}>🎯 বার্তাটি পৌঁছাবে:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{activeTarget.title}</strong>
                  <span className="badge" style={{ fontSize: '0.66rem', background: '#10b981', color: '#fff', padding: '1px 6px' }}>
                    {activeTarget.role || 'নির্ধারিত প্রাপক'}
                  </span>
                </div>
                {activeTarget.phone && (
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                    📱 {activeTarget.phone}
                  </span>
                )}
              </div>

              {/* Quick tags & Attachment Triggers */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Notice Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'notice' ? 'normal' : 'notice'))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    border: msgCategory === 'notice' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    background: msgCategory === 'notice' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: msgCategory === 'notice' ? '#ef4444' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <AlertTriangle size={13} />
                  <span>জরুরি নোটিশ</span>
                </button>

                {/* Handover Toggle */}
                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'handover' ? 'normal' : 'handover'))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    border: msgCategory === 'handover' ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: msgCategory === 'handover' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: msgCategory === 'handover' ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Wallet size={13} />
                  <span>ক্যাশ হ্যান্ডওভার</span>
                </button>

                {/* Attach Invoice Button */}
                <button
                  type="button"
                  onClick={() => setShowInvoicePicker(true)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    border: attachedInvoice ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: attachedInvoice ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: attachedInvoice ? '#3b82f6' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Receipt size={13} />
                  <span>ইনভয়েস নির্বাচন</span>
                </button>

                {/* Attach File / Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    border: attachedMedia ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: attachedMedia ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: attachedMedia ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Paperclip size={13} />
                  <span>ডকুমেন্ট / ছবি</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Text Input + Send Button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={
                    msgCategory === 'notice'
                      ? 'জরুরি অফিশিয়াল নোটিশ লিখুন...'
                      : `${activeTarget.title}-এর জন্য বার্তা বা নির্দেশনা লিখুন...`
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedInvoice && !attachedMedia && !handoverAmount}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      !inputText.trim() && !attachedInvoice && !attachedMedia && !handoverAmount
                        ? 'rgba(255,255,255,0.1)'
                        : isSuperAdmin
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #4f46e5, #3730a3)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    cursor: !inputText.trim() && !attachedInvoice && !attachedMedia && !handoverAmount ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: INVOICE PICKER */}
      {showInvoicePicker && (
        <div className="modal-overlay" style={{ zIndex: 1350 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', width: '90%', padding: '1.25rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Receipt size={18} color="#3b82f6" />
                <span>{lang === 'bn' ? 'চ্যাটে পাঠানোর জন্য চালান নির্বাচন করুন' : 'Select Invoice to Attach'}</span>
              </h3>
              <button type="button" onClick={() => setShowInvoicePicker(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'চালান নং বা ক্রেতার নাম খুঁজুন...' : 'Search invoice or customer...'}
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredInvoices.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {lang === 'bn' ? 'কোনো ইনভয়েস পাওয়া যায়নি' : 'No invoices found'}
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv.id || inv.invoiceNumber}
                    onClick={() => {
                      setAttachedInvoice({
                        id: inv.id,
                        invoiceNumber: inv.invoiceNumber || inv.id,
                        grandTotal: inv.grandTotal,
                        customerName: inv.customerName,
                        date: inv.date
                      });
                      setShowInvoicePicker(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#3b82f6' }}>
                        #{inv.invoiceNumber || inv.id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {inv.customerName || 'খুচরা ক্রেতা'} • {inv.date?.split('T')[0] || ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: '900', color: '#10b981', fontSize: '0.92rem' }}>
                      ৳{(Number(inv.grandTotal) || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div
          className="modal-overlay animate-fade-in"
          style={{ zIndex: 1400, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setZoomImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={zoomImage} alt="Zoomed" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              style={{
                position: 'absolute',
                top: '-35px',
                right: '0',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalCommunicationHubModal;
