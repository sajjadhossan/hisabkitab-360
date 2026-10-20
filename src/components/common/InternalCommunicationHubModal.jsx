import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ArrowLeft,
  UserCheck,
  Phone,
  Truck
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

  // Screen Width & Responsive State
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // Active target state: default to super_admin or first channel
  const [activeTarget, setActiveTarget] = useState(() => ({
    type: 'dm',
    id: 'super_admin',
    title: 'সুপার এডমিন হেল্পডেস্ক',
    role: 'সুপার এডমিন',
    phone: null
  }));

  const [messages, setMessages] = useState(() => getStoredMessages());
  const [inputText, setInputText] = useState('');
  const [msgCategory, setMsgCategory] = useState('normal'); // 'normal' | 'notice' | 'handover' | 'invoice'
  const [searchQuery, setSearchQuery] = useState('');
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

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Helper: check if message matches target
  const isMessageForTarget = (m, target) => {
    if (!target) return false;
    if (target.type === 'channel') {
      return m.channelId === target.id;
    }

    const targetId = target.id;
    const targetEmail = (target.email || '').toLowerCase().trim();
    const targetPhone = (target.phone || '').trim();
    const myId = activeUserId;
    const myEmail = (activeUserEmail || '').toLowerCase().trim();

    const isSenderMe =
      m.senderDeviceId === myLocalDeviceId ||
      m.senderId === myId ||
      (isSuperAdmin && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন')) ||
      (isOwner && (m.senderId === 'owner' || m.senderRole === 'Owner' || m.senderRole === 'admin' || m.senderRole === 'মালিক')) ||
      (myEmail && m.senderEmail?.toLowerCase() === myEmail);

    const isRecipientMe =
      m.recipientId === myId ||
      (isSuperAdmin && (m.recipientId === 'super_admin' || m.recipientRole === 'Super Admin' || m.recipientRole === 'সুপার এডমিন')) ||
      (isOwner && (m.recipientId === 'owner' || m.recipientId === 'merchant' || m.recipientId === 'merchant_owner')) ||
      (myEmail && m.recipientEmail?.toLowerCase() === myEmail) ||
      (user?.phone && m.recipientPhone === user.phone);

    const isSenderTarget =
      m.senderId === targetId ||
      (targetId === 'super_admin' && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন')) ||
      (targetId === 'merchant_owner' && (m.senderId === 'owner' || m.senderRole === 'Owner' || m.senderRole === 'admin' || m.senderRole === 'মালিক')) ||
      (targetEmail && m.senderEmail?.toLowerCase() === targetEmail) ||
      (targetPhone && m.senderPhone === targetPhone);

    const isRecipientTarget =
      m.recipientId === targetId ||
      (targetId === 'super_admin' && (m.recipientId === 'super_admin' || m.recipientRole === 'Super Admin')) ||
      (targetId === 'merchant_owner' && (m.recipientId === 'owner' || m.recipientId === 'merchant' || m.recipientId === 'merchant_owner')) ||
      (targetEmail && m.recipientEmail?.toLowerCase() === targetEmail) ||
      (targetPhone && m.recipientPhone === targetPhone);

    return (isSenderMe && isRecipientTarget) || (isSenderTarget && isRecipientMe);
  };

  // Helper: get the last message for a contact or channel
  const getLastMessageInfo = (target) => {
    const matched = messages.filter((m) => isMessageForTarget(m, target));
    if (!matched.length) return null;
    const last = matched[matched.length - 1];

    let snippet = last.text || '';
    if (!snippet) {
      if (last.attachment?.type === 'invoice') snippet = `🧾 ইনভয়েস #${last.attachment.invoiceNumber || ''}`;
      else if (last.attachment?.type === 'image') snippet = '📷 ছবি';
      else if (last.attachment?.type === 'document') snippet = '📎 ডকুমেন্ট';
      else if (last.meta?.handoverAmount) snippet = `💵 ক্যাশ: ৳${last.meta.handoverAmount}`;
      else snippet = 'বার্তা';
    }

    const isMe =
      last.senderId === activeUserId ||
      (activeUserEmail && last.senderEmail?.toLowerCase() === activeUserEmail);

    const timeStr = last.timestamp
      ? new Date(last.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      : '';
    const readKey = `hk360_read_msgs_${activeUserId}`;
    let readIds = new Set();
    try {
      readIds = new Set(JSON.parse(localStorage.getItem(readKey) || '[]'));
    } catch {}

    const unreadCount = matched.filter((m) => !m.read && !readIds.has(m.id) && m.senderDeviceId !== myLocalDeviceId && m.senderId !== activeUserId).length;

    return {
      last,
      snippet: isMe ? `আপনি: ${snippet}` : snippet,
      timeStr,
      timestamp: last.timestamp,
      unreadCount
    };
  };

  // Current messages for active target
  const currentMessages = useMemo(() => {
    return messages.filter((m) => isMessageForTarget(m, activeTarget));
  }, [messages, activeTarget, myLocalDeviceId, activeUserId, activeUserEmail, isSuperAdmin, isOwner]);

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
    if (window.confirm(lang === 'bn' ? 'মেসেজটি সবার জন্য মুছে ফেলতে চান?' : 'Delete message for everyone?')) {
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

  // Contacts generation list
  const contactDirectory = useMemo(() => {
    const list = [];

    // 1. Super Admin Support Desk (Visible to Merchant & Staff)
    if (!isSuperAdmin) {
      list.push({
        type: 'dm',
        id: 'super_admin',
        title: 'সুপার এডমিন সাপোর্ট ডেস্ক',
        role: 'সুপার এডমিন',
        badge: 'SUPPORT',
        color: '#ef4444',
        icon: ShieldCheck,
        phone: null,
        desc: 'সরাসরি সফটওয়্যার মালিক ও টেকনিক্যাল হেল্প'
      });
    }

    // 2. Staff View: Store Owner
    if (isCashier || isSalesman || isSR || user?.isStaffUser) {
      list.push({
        type: 'dm',
        id: 'merchant_owner',
        title: businessSettings?.companyName || 'দোকান মালিক / পরিচালক',
        role: 'প্রতিষ্ঠান মালিক',
        badge: 'OWNER',
        color: '#10b981',
        icon: Store,
        phone: businessSettings?.phone || null,
        desc: 'মালিকের সাথে সরাসরি মেসেজ ও রিপোর্ট'
      });
    }

    // 3. Store Owner View: Cashiers, Salesmen, SRs, Staff
    if (isOwner) {
      staffAccounts.forEach((stf) => {
        const isSales = stf.role === 'salesman';
        const isSrRole = stf.role === 'sr';
        const isCashierRole = stf.role === 'cashier';

        list.push({
          type: 'dm',
          id: stf.id,
          title: stf.name,
          role: isCashierRole
            ? 'কাউন্টার ক্যাশিয়ার'
            : isSales
            ? 'দোকান সেলসম্যান'
            : isSrRole
            ? 'ফিল্ড এসআর (SR)'
            : 'স্টাফ',
          badge: isCashierRole ? 'CASHIER' : isSales ? 'SALES' : isSrRole ? 'SR' : 'STAFF',
          color: isCashierRole ? '#10b981' : isSales ? '#f59e0b' : isSrRole ? '#6366f1' : '#8b5cf6',
          icon: isCashierRole ? Wallet : isSales ? ShoppingBag : isSrRole ? Truck : User,
          phone: stf.phone,
          desc: `মোবাইল: ${stf.phone || 'N/A'}`
        });
      });
    }

    // 4. Staff/Salesman/Cashier: Chat with Colleagues
    if (!isOwner && !isSuperAdmin && staffAccounts.length > 0) {
      staffAccounts
        .filter((stf) => stf.id !== user?.id && stf.phone !== user?.phone)
        .forEach((stf) => {
          const isSales = stf.role === 'salesman';
          const isSrRole = stf.role === 'sr';
          const isCashierRole = stf.role === 'cashier';

          list.push({
            type: 'dm',
            id: stf.id,
            title: stf.name,
            role: isCashierRole ? 'সহকর্মী ক্যাশিয়ার' : isSales ? 'সহকর্মী সেলসম্যান' : isSrRole ? 'সহকর্মী এসআর' : 'সহকর্মী স্টাফ',
            badge: isCashierRole ? 'CASHIER' : isSales ? 'SALES' : isSrRole ? 'SR' : 'COLLEAGUE',
            color: isCashierRole ? '#10b981' : isSales ? '#f59e0b' : isSrRole ? '#6366f1' : '#8b5cf6',
            icon: isCashierRole ? Wallet : isSales ? ShoppingBag : isSrRole ? Truck : User,
            phone: stf.phone,
            desc: `মোবাইল: ${stf.phone || 'N/A'}`
          });
        });
    }

    // 5. Super Admin View: Registered Merchant Clients
    if (isSuperAdmin) {
      clientLicensesRegistry.forEach((c) => {
        list.push({
          type: 'dm',
          id: c.id || c.clientEmail,
          email: c.clientEmail,
          phone: c.clientPhone,
          title: c.clientShopName || 'নিবন্ধিত ব্যবসায়ী',
          role: 'মার্চেন্ট মালিক',
          badge: 'CLIENT',
          color: '#3b82f6',
          icon: Building2,
          desc: `${c.clientEmail || c.clientPhone || 'সক্রিয় লাইসেন্স'}`
        });
      });
    }

    // Attach last message info to each contact and sort
    const enriched = list.map((c) => {
      const info = getLastMessageInfo(c);
      return {
        ...c,
        lastMessage: info?.snippet || '',
        lastTimestamp: info?.timestamp || 0,
        lastTimeStr: info?.timeStr || '',
        unreadCount: info?.unreadCount || 0
      };
    });

    // Sort by latest message first
    enriched.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));

    return enriched;
  }, [
    isSuperAdmin,
    isOwner,
    isCashier,
    isSalesman,
    isSR,
    user,
    staffAccounts,
    clientLicensesRegistry,
    businessSettings,
    messages
  ]);

  // Channels enriched with last message
  const channelDirectory = useMemo(() => {
    return CHANNELS.map((ch) => {
      const targetObj = { type: 'channel', id: ch.id, title: ch.name };
      const info = getLastMessageInfo(targetObj);
      return {
        type: 'channel',
        id: ch.id,
        title: ch.name,
        desc: ch.desc,
        role: 'গ্রুপ চ্যানেল',
        color: ch.id === 'super_admin_desk' ? '#ef4444' : ch.id === 'cashier_desk' ? '#10b981' : ch.id === 'sales_team' ? '#f59e0b' : '#8b5cf6',
        lastMessage: info?.snippet || '',
        lastTimestamp: info?.timestamp || 0,
        lastTimeStr: info?.timeStr || '',
        unreadCount: info?.unreadCount || 0
      };
    }).sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
  }, [messages]);

  // Filtered lists by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contactDirectory;
    const q = searchQuery.toLowerCase().trim();
    return contactDirectory.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [contactDirectory, searchQuery]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channelDirectory;
    const q = searchQuery.toLowerCase().trim();
    return channelDirectory.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [channelDirectory, searchQuery]);

  // Invoices for attachment
  const allInvoicesPool = useMemo(() => {
    return [
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
  }, [invoices, salesHistory]);

  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return allInvoicesPool.slice(0, 15);
    const q = invoiceSearch.toLowerCase();
    return allInvoicesPool
      .filter(
        (inv) =>
          (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [allInvoicesPool, invoiceSearch]);

  const selectTarget = (target) => {
    setActiveTarget(target);
    markChannelAsRead(target.id, activeUserId);
    if (isMobile) {
      setMobileView('chat');
    }
    setTimeout(scrollToBottom, 80);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1250,
        padding: isMobile ? 0 : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)'
      }}
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          width: isMobile ? '100%' : '100%',
          maxWidth: isMobile ? '100%' : '1120px',
          height: isMobile ? '100%' : '88vh',
          maxHeight: isMobile ? '100dvh' : '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
          borderRadius: isMobile ? 0 : '16px',
          background: 'var(--surface-color)',
          border: isMobile ? 'none' : '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* ========================================================
            TOP NAVIGATION / HEADER (RESPONSIVE)
            ======================================================== */}
        <div
          style={{
            padding: isMobile ? '12px 14px' : '12px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-main)',
            gap: '10px',
            flexShrink: 0
          }}
        >
          {/* Header Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            {/* Mobile Back Button (when inside Chat View on mobile) */}
            {isMobile && mobileView === 'chat' && (
              <button
                type="button"
                onClick={() => setMobileView('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  flexShrink: 0
                }}
              >
                <ArrowLeft size={16} />
                <span>তালিকা</span>
              </button>
            )}

            {/* Title / Target info */}
            {(!isMobile || mobileView === 'list') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isSuperAdmin
                      ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                      : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {isSuperAdmin ? <ShieldCheck size={20} /> : <MessageSquare size={20} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: isMobile ? '0.92rem' : '1.02rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isSuperAdmin ? 'সেন্ট্রাল মার্চেন্ট ও সাপোর্ট হাব' : 'যোগাযোগ, ১-অন-১ ও সাপোর্ট হাব'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang === 'bn' ? 'সরাসরি রিয়েলটাইম কথোপকথন ও নোটিশ' : 'Direct 1-on-1 conversations & team announcements'}
                  </div>
                </div>
              </div>
            ) : (
              // Chat Header details on mobile
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: activeTarget.color ? `${activeTarget.color}25` : 'rgba(99, 102, 241, 0.2)',
                    color: activeTarget.color || '#6366f1',
                    border: `1.5px solid ${activeTarget.color || '#6366f1'}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: '800'
                  }}
                >
                  {activeTarget.title?.slice(0, 1) || '💬'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeTarget.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span style={{ color: activeTarget.color || 'var(--business-primary)', fontWeight: '700' }}>
                      {activeTarget.role || 'ব্যক্তি'}
                    </span>
                    {activeTarget.phone ? ` • 📱 ${activeTarget.phone}` : ''}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Header Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleCloudSync}
              disabled={isCloudSyncing}
              title={lang === 'bn' ? 'ক্লাউড থেকে মেসেজ সিঙ্ক করুন' : 'Sync messages'}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.74rem'
              }}
            >
              <RefreshCw size={13} className={isCloudSyncing ? 'animate-spin' : ''} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>
                {isCloudSyncing ? (lang === 'bn' ? 'সিঙ্ক...' : 'Syncing...') : (lang === 'bn' ? 'সিঙ্ক' : 'Sync')}
              </span>
            </button>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ========================================================
            MAIN BODY: SIDEBAR DIRECTORY + CHAT VIEW
            ======================================================== */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* ========================================================
              LEFT SIDEBAR: CONTACT DIRECTORY & CHANNELS
              ======================================================== */}
          <div
            style={{
              width: isMobile ? '100%' : '330px',
              borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: isMobile && mobileView === 'chat' ? 'none' : 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Search Input Box */}
            <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ব্যবসায়ী, সেলসম্যান, ক্যাশিয়ার খুঁজুন...' : 'Search contacts or messages...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar View Tabs: 1-on-1 vs Channels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                padding: '8px 10px',
                gap: '8px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--surface-color)'
              }}
            >
              <button
                type="button"
                onClick={() => setSidebarTab('direct')}
                style={{
                  padding: '7px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: sidebarTab === 'direct' ? 'var(--business-primary)' : 'rgba(255,255,255,0.04)',
                  color: sidebarTab === 'direct' ? '#fff' : 'var(--text-muted)',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={14} />
                <span>ব্যক্তি ও কর্মী ({filteredContacts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('channels')}
                style={{
                  padding: '7px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: sidebarTab === 'channels' ? 'var(--business-primary)' : 'rgba(255,255,255,0.04)',
                  color: sidebarTab === 'channels' ? '#fff' : 'var(--text-muted)',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={14} />
                <span>টিম চ্যানেল ({filteredChannels.length})</span>
              </button>
            </div>

            {/* CONTACTS / CHANNEL SCROLLABLE FEED */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {sidebarTab === 'direct' ? (
                filteredContacts.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {searchQuery ? 'কোনো ব্যক্তি বা সেলসম্যান পাওয়া যায়নি' : 'কোনো কন্টাক্ট তৈরি নেই'}
                  </div>
                ) : (
                  filteredContacts.map((c) => {
                    const isActive = activeTarget.type === 'dm' && (activeTarget.id === c.id || (c.email && activeTarget.email === c.email));
                    const IconComponent = c.icon || User;
                    const contactColor = c.color || '#6366f1';

                    return (
                      <div
                        key={c.id || c.email}
                        onClick={() => selectTarget(c)}
                        style={{
                          padding: '10px 12px',
                          margin: '3px 0',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: isActive ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                          border: isActive ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: `${contactColor}18`,
                            color: contactColor,
                            border: `1.5px solid ${contactColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <IconComponent size={20} />
                        </div>

                        {/* Info & Last message snippet */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <div
                              style={{
                                fontWeight: isActive ? '800' : '700',
                                fontSize: '0.86rem',
                                color: isActive ? contactColor : 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '170px'
                              }}
                            >
                              {c.title}
                            </div>
                            {c.lastTimeStr && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                {c.lastTimeStr}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div
                              style={{
                                fontSize: '0.73rem',
                                color: c.lastMessage ? 'var(--text-muted)' : contactColor,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '180px'
                              }}
                            >
                              {c.lastMessage || c.role || 'চ্যাট শুরু করতে ট্যাপ করুন'}
                            </div>

                            {c.unreadCount > 0 && (
                              <span
                                style={{
                                  background: '#ef4444',
                                  color: '#fff',
                                  borderRadius: '10px',
                                  padding: '1px 6px',
                                  fontSize: '0.65rem',
                                  fontWeight: '900',
                                  lineHeight: 1.2,
                                  flexShrink: 0
                                }}
                              >
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* CHANNELS TAB */
                filteredChannels.map((ch) => {
                  const isActive = activeTarget.type === 'channel' && activeTarget.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => selectTarget({ type: 'channel', id: ch.id, title: ch.title, role: 'Group Channel' })}
                      style={{
                        padding: '10px 12px',
                        margin: '3px 0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: `${ch.color}20`,
                          color: ch.color,
                          border: `1.5px solid ${ch.color}45`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {ch.id === 'super_admin_desk' ? (
                          <ShieldCheck size={20} />
                        ) : ch.id === 'cashier_desk' ? (
                          <Wallet size={20} />
                        ) : ch.id === 'sales_team' ? (
                          <ShoppingBag size={20} />
                        ) : (
                          <Megaphone size={20} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.86rem', color: isActive ? ch.color : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ch.title}
                          </div>
                          {ch.lastTimeStr && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {ch.lastTimeStr}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ch.lastMessage || ch.desc}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================
              RIGHT CHAT WINDOW: ACTIVE CONVERSATION
              ======================================================== */}
          <div
            style={{
              flex: 1,
              display: isMobile && mobileView === 'list' ? 'none' : 'flex',
              flexDirection: 'column',
              background: 'var(--bg-main)',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Desktop Target Sub-Header */}
            {!isMobile && (
              <div
                style={{
                  padding: '10px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--surface-color)',
                  flexShrink: 0
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.96rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      {activeTarget.type === 'dm' ? `🎯 ১-অন-১ (${activeTarget.role || 'ব্যক্তি'})` : '👥 গ্রুপ চ্যানেল'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {activeTarget.phone ? `মোবাইল: ${activeTarget.phone} • ` : ''}
                    {activeTarget.type === 'dm'
                      ? 'আপনার পাঠানো মেসেজ ডানে (Right) ও অপরপক্ষের মেসেজ বামে (Left) সাজানো রয়েছে।'
                      : 'এই চ্যানেলের মেসেজ সংশ্লিষ্ট সকল সদস্য দেখতে পাবেন।'}
                  </div>
                </div>

                {activeTarget.type === 'channel' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(lang === 'bn' ? 'এই চ্যানেলের সকল লোকাল মেসেজ হিস্ট্রি ক্লিয়ার করবেন?' : 'Clear local history?')) {
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
            )}

            {/* MESSAGES FEED */}
            <div
              style={{
                flex: 1,
                padding: isMobile ? '12px 10px' : '16px 20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-main)'
              }}
            >
              {currentMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '340px', padding: '20px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <MessageSquare size={26} style={{ opacity: 0.6 }} />
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'কোনো পূর্ববর্তী বার্তা নেই' : 'No messages yet'}
                  </div>
                  <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? `"${activeTarget.title}"-এর সাথে সরাসরি মেসেজ লিখতে বা চালান পাঠাতে নিচে লিখুন।`
                      : 'Send text, invoices, or files below to start communicating.'}
                  </div>
                </div>
              ) : (
                currentMessages.map((m) => {
                  const isSentByTarget =
                    m.senderId === activeTarget.id ||
                    (activeTarget.email && m.senderEmail?.toLowerCase() === activeTarget.email?.toLowerCase()) ||
                    (activeTarget.phone && m.senderPhone === activeTarget.phone);

                  let isMe = false;
                  if (isSentByTarget) {
                    isMe = false;
                  } else if (m.senderId === activeUserId || (activeUserEmail && m.senderEmail?.toLowerCase() === activeUserEmail)) {
                    isMe = true;
                  } else if (isSuperAdmin && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন')) {
                    isMe = true;
                  } else if (isOwner && (m.senderId === 'owner' || m.senderId === user?.id || m.senderRole === 'Owner' || m.senderRole === 'admin' || m.senderRole === 'মালিক')) {
                    isMe = true;
                  } else if (m.recipientId === activeTarget.id) {
                    isMe = true;
                  }

                  const isFromSuperAdmin = m.senderRole === 'Super Admin' || m.senderRole === 'সুপার এডমিন' || m.senderId === 'super_admin';
                  const timeFormatted = m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                    : '';

                  if (m.isDeleted) {
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px dashed var(--border-color)',
                          color: 'var(--text-muted)',
                          fontSize: '0.74rem',
                          fontStyle: 'italic',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{lang === 'bn' ? '🚫 এই বার্তাটি মুছে ফেলা হয়েছে' : '🚫 Message deleted'}</span>
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
                        maxWidth: isMobile ? '88%' : '76%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        marginLeft: isMe ? 'auto' : '0',
                        marginRight: isMe ? '0' : 'auto'
                      }}
                    >
                      {/* Compact Sender Tag for received messages */}
                      {!isMe && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            marginBottom: '3px',
                            color: isFromSuperAdmin ? '#ef4444' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{m.senderName}</span>
                          <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>
                            {m.senderRole || 'স্টাফ'}
                          </span>
                        </div>
                      )}

                      {/* Bubble Container */}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                          background: isMe
                            ? 'linear-gradient(135deg, #4f46e5, #4338ca)'
                            : isFromSuperAdmin
                            ? 'rgba(239, 68, 68, 0.12)'
                            : m.category === 'notice'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'var(--surface-color)',
                          border: isMe
                            ? '1px solid rgba(255, 255, 255, 0.18)'
                            : isFromSuperAdmin
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : m.category === 'notice'
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid var(--border-color)',
                          color: isMe ? '#ffffff' : 'var(--text-main)',
                          boxShadow: isMe ? '0 4px 14px rgba(79, 70, 229, 0.28)' : '0 2px 8px rgba(0,0,0,0.08)',
                          wordBreak: 'break-word'
                        }}
                      >
                        {/* Notice Header */}
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
                              <span>{lang === 'bn' ? 'জরুরি নোটিশ / ঘোষণা' : 'ANNOUNCEMENT'}</span>
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
                              background: isMe ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.06)',
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
                              minWidth: '200px'
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
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', display: 'block' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                right: '6px',
                                background: 'rgba(0,0,0,0.65)',
                                color: '#fff',
                                borderRadius: '4px',
                                padding: '2px 6px',
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

                        {/* Attached Document */}
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
                              <span style={{ fontSize: '0.78rem', fontWeight: '700', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                              background: isMe ? 'rgba(0,0,0,0.18)' : 'rgba(16, 185, 129, 0.1)',
                              border: '1px dashed rgba(16, 185, 129, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Wallet size={16} color="#10b981" />
                            <div>
                              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                                {lang === 'bn' ? 'ক্যাশ হ্যান্ডওভার পরিমাণ' : 'Cash Handover Amount'}
                              </div>
                              <div style={{ fontWeight: '800', fontSize: '0.94rem', fontFamily: 'monospace' }}>
                                ৳{m.meta.handoverAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer: Time + Actions */}
                      <div
                        style={{
                          fontSize: '0.66rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{timeFormatted}</span>

                        <button
                          type="button"
                          onClick={() => setReplyingTo(m)}
                          title="উত্তর দিন"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                        >
                          <Reply size={12} />
                        </button>

                        {(isMe || isSuperAdmin || isOwner) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMsg(m.id)}
                            title="মুছে ফেলুন"
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}

                        {isMe && (
                          m.read ? (
                            <span
                              title={lang === 'bn' ? 'পঠিত (Seen / Read)' : 'Read'}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#10b981', fontSize: '0.62rem', fontWeight: '800' }}
                            >
                              <CheckCheck size={12} color="#10b981" />
                              <span>{lang === 'bn' ? 'পঠিত' : 'Read'}</span>
                            </span>
                          ) : (
                            <span
                              title={lang === 'bn' ? 'প্রেরিত (Sent)' : 'Sent'}
                              style={{ display: 'inline-flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.65)' }}
                            >
                              <Check size={12} />
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quoted Message Banner */}
            {replyingTo && (
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  borderTop: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <Reply size={14} color="#6366f1" />
                  <strong style={{ color: '#6366f1' }}>{replyingTo.senderName}-কে উত্তর:</strong>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
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

            {/* Attached Invoice Banner */}
            {attachedInvoice && (
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  borderTop: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={15} color="#3b82f6" />
                  <span>চালান: <strong>#{attachedInvoice.invoiceNumber}</strong> (৳{attachedInvoice.grandTotal?.toLocaleString()}) - {attachedInvoice.customerName}</span>
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

            {/* Attached Media Banner */}
            {attachedMedia && (
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderTop: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {attachedMedia.type === 'image' ? <ImageIcon size={15} color="#10b981" /> : <FileText size={15} color="#10b981" />}
                  <span>ফাইল: <strong>{attachedMedia.name}</strong> ({Math.round((attachedMedia.size || 0) / 1024)} KB)</span>
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

            {/* Handover Amount Input */}
            {msgCategory === 'handover' && (
              <div style={{ padding: '8px 14px', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <Wallet size={16} color="#10b981" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>ক্যাশ পরিমাণ (৳):</span>
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

            {/* INPUT FORM (OPTIMIZED FOR MOBILE & DESKTOP) */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: isMobile ? '8px 10px' : '10px 16px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                flexShrink: 0
              }}
            >
              {/* Horizontally scrollable category pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  paddingBottom: '2px',
                  alignItems: 'center',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'notice' ? 'normal' : 'notice'))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    border: msgCategory === 'notice' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    background: msgCategory === 'notice' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: msgCategory === 'notice' ? '#ef4444' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={12} />
                  <span>নোটিশ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'handover' ? 'normal' : 'handover'))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    border: msgCategory === 'handover' ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: msgCategory === 'handover' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: msgCategory === 'handover' ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <Wallet size={12} />
                  <span>ক্যাশ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInvoicePicker(true)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    border: attachedInvoice ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: attachedInvoice ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: attachedInvoice ? '#3b82f6' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <Receipt size={12} />
                  <span>চালান</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    border: attachedMedia ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: attachedMedia ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: attachedMedia ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <Paperclip size={12} />
                  <span>ছবি/ডকুমেন্ট</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Main Input Row */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={
                    msgCategory === 'notice'
                      ? 'জরুরি অফিশিয়াল নোটিশ লিখুন...'
                      : `${activeTarget.title}-এর জন্য বার্তা লিখুন...`
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
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      !inputText.trim() && !attachedInvoice && !attachedMedia && !handoverAmount
                        ? 'rgba(255,255,255,0.08)'
                        : isSuperAdmin
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #4f46e5, #3730a3)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.86rem',
                    cursor: !inputText.trim() && !attachedInvoice && !attachedMedia && !handoverAmount ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    flexShrink: 0
                  }}
                >
                  <span style={{ display: isMobile ? 'none' : 'inline' }}>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: INVOICE ATTACHMENT PICKER
          ======================================================== */}
      {showInvoicePicker && (
        <div className="modal-overlay" style={{ zIndex: 1350, padding: '12px' }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '1.2rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                <Receipt size={17} color="#3b82f6" />
                <span>{lang === 'bn' ? 'চ্যাটে পাঠানোর জন্য চালান নির্বাচন' : 'Select Invoice'}</span>
              </h3>
              <button type="button" onClick={() => setShowInvoicePicker(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'চালান নং বা ক্রেতার নাম...' : 'Search invoice...'}
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
                        {inv.customerName || 'খুচরা ক্রেতা'}
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

      {/* ========================================================
          FULLSCREEN IMAGE ZOOM MODAL
          ======================================================== */}
      {zoomImage && (
        <div
          className="modal-overlay animate-fade-in"
          style={{ zIndex: 1400, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
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
