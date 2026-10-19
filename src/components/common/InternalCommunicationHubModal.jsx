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
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  CHANNELS,
  getStoredMessages,
  saveMessage,
  markChannelAsRead,
  clearChannelHistory,
  syncCloudMessages
} from '../../services/internalChatService';

export const InternalCommunicationHubModal = ({ isOpen, onClose }) => {
  const { lang, showToast, businessSettings, employees = [], clientLicensesRegistry = [] } = useApp();
  const { user, isSuperAdmin, role } = useAuth();

  const [activeTarget, setActiveTarget] = useState(() => ({
    type: 'channel',
    id: 'super_admin_desk',
    title: 'সুপার এডমিন হেল্পডেস্ক ও নোটিশ'
  }));

  const [messages, setMessages] = useState(() => getStoredMessages());
  const [inputText, setInputText] = useState('');
  const [msgCategory, setMsgCategory] = useState('normal'); // 'normal' | 'notice' | 'handover' | 'invoice'
  const [invoiceRefInput, setInvoiceRefInput] = useState('');
  const [handoverAmount, setHandoverAmount] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const chatEndRef = useRef(null);

  const activeUserId = isSuperAdmin ? 'super_admin' : (user?.id || 'owner');
  const activeUserName = isSuperAdmin
    ? 'সুপার এডমিন (Super Admin)'
    : (user?.name || businessSettings?.companyName || 'ব্যবসা পরিচালক');
  const activeUserEmail = user?.email || (isSuperAdmin ? 'superadmin@hisabkitab360.com' : '');

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
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, activeTarget]);

  // Listen to message updates
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

  // Filter messages for current target with robust cross-device matching
  const currentMessages = messages.filter((m) => {
    if (activeTarget.type === 'channel') {
      return m.channelId === activeTarget.id;
    } else {
      // 1-on-1 Direct Message
      const targetId = activeTarget.id;
      const targetEmail = (activeTarget.email || '').toLowerCase().trim();
      const myId = activeUserId;
      const myEmail = (activeUserEmail || '').toLowerCase().trim();

      const isSenderMe =
        m.senderId === myId ||
        (isSuperAdmin && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin')) ||
        (myEmail && m.senderEmail?.toLowerCase() === myEmail);

      const isRecipientMe =
        m.recipientId === myId ||
        (isSuperAdmin && m.recipientId === 'super_admin') ||
        (!isSuperAdmin && (m.recipientId === 'owner' || m.recipientId === 'merchant')) ||
        (myEmail && m.recipientEmail?.toLowerCase() === myEmail);

      const isSenderTarget =
        m.senderId === targetId ||
        (targetId === 'super_admin' && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin')) ||
        (targetEmail && m.senderEmail?.toLowerCase() === targetEmail);

      const isRecipientTarget =
        m.recipientId === targetId ||
        (targetId === 'super_admin' && m.recipientId === 'super_admin') ||
        (targetEmail && m.recipientEmail?.toLowerCase() === targetEmail);

      return (isSenderMe && isRecipientTarget) || (isSenderTarget && isRecipientMe);
    }
  });

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !invoiceRefInput && !handoverAmount) return;

    const payload = {
      senderId: activeUserId,
      senderName: activeUserName,
      senderEmail: activeUserEmail,
      senderRole: isSuperAdmin ? 'Super Admin' : (role || 'Owner'),
      channelId: activeTarget.type === 'channel' ? activeTarget.id : null,
      recipientId: activeTarget.type === 'dm' ? activeTarget.id : null,
      recipientEmail: activeTarget.type === 'dm' ? (activeTarget.email || null) : null,
      recipientShopName: activeTarget.type === 'dm' ? activeTarget.title : null,
      text: inputText.trim(),
      category: msgCategory,
      meta: {
        invoiceRef: invoiceRefInput.trim() || null,
        handoverAmount: handoverAmount ? Number(handoverAmount) : null
      }
    };

    saveMessage(payload);
    setInputText('');
    setInvoiceRefInput('');
    setHandoverAmount('');
    setMsgCategory('normal');
    setTimeout(scrollToBottom, 60);
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

  return (
    <div className="modal-overlay" style={{ zIndex: 1250, padding: '10px' }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '1050px',
          width: '100%',
          height: '88vh',
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
                width: '36px',
                height: '36px',
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
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>
                  {isSuperAdmin
                    ? (lang === 'bn' ? 'সুপার এডমিন হেল্পডেস্ক ও সেন্ট্রাল কমিউনিকেশন' : 'Super Admin Central Communication Desk')
                    : (lang === 'bn' ? 'অভ্যন্তরীণ যোগাযোগ ও সুপার এডমিন সাপোর্ট' : 'Internal Communication & Support Hub')}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isSuperAdmin
                  ? (lang === 'bn' ? 'সরাসরি যেকোনো ব্যবসায়ীর সাথে চ্যাট করুন বা প্ল্যাটফর্ম ব্রডকাস্ট দিন' : 'Direct 1-on-1 chat with merchants or broadcast platform notices')
                  : (lang === 'bn' ? 'সুপার এডমিন সাপোর্ট, দোকান টিম নোটিশ ও কর্মী চ্যাট' : 'Super Admin support, store channels & staff communication')}
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
          {/* Left Sidebar */}
          <div
            style={{
              width: '290px',
              borderRight: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Platform Super Admin Channel */}
            <div style={{ padding: '12px 14px 6px', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'bn' ? 'সিস্টেম ও সেন্ট্রাল ডেস্ক' : 'Platform & Central Desk'}
            </div>
            {CHANNELS.filter((c) => c.category === 'platform').map((c) => {
              const isActive = activeTarget.type === 'channel' && activeTarget.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveTarget({ type: 'channel', id: c.id, title: c.name })}
                  style={{
                    padding: '10px 14px',
                    margin: '2px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    color: isActive ? '#3b82f6' : 'var(--text-main)',
                    fontWeight: isActive ? '800' : '500',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {getChannelIcon(c.id)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.desc}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Merchant View: 1-on-1 Direct Support with Super Admin */}
            {!isSuperAdmin && (
              <>
                <div style={{ padding: '12px 14px 6px', fontSize: '0.72rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {lang === 'bn' ? 'সুপার এডমিন ১-অন-১ সাপোর্ট' : 'Super Admin 1-on-1 Support'}
                </div>
                <div
                  onClick={() =>
                    setActiveTarget({
                      type: 'dm',
                      id: 'super_admin',
                      title: lang === 'bn' ? '🛡️ সুপার এডমিন সরাসরি সাপোর্ট (Super Admin Helpdesk)' : '🛡️ Super Admin Direct Support'
                    })
                  }
                  style={{
                    padding: '10px 14px',
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
                    <div style={{ fontSize: '0.84rem', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang === 'bn' ? 'সরাসরি সাপোর্ট ডেস্ক' : 'Direct Support Desk'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang === 'bn' ? 'সুপার এডমিনের সাথে ব্যক্তিগত চ্যাট' : 'Private chat with Super Admin'}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Super Admin View: List of all registered merchants/clients */}
            {isSuperAdmin && (
              <>
                <div style={{ padding: '14px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {lang === 'bn' ? '🛡️ নিবন্ধিত ব্যবসায়ী ও ক্লায়েন্ট' : '🛡️ Merchants & Clients'} ({clientLicensesRegistry.length})
                  </span>
                </div>

                {/* Client Search */}
                <div style={{ padding: '0 8px 8px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'ব্যবসায়ী খুঁজুন...' : 'Search merchant...'}
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px 5px 26px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '6px' }}>
                  {filteredClients.length === 0 ? (
                    <div style={{ padding: '8px 14px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {lang === 'bn' ? 'কোনো ব্যবসায়ী পাওয়া যায়নি' : 'No clients found'}
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
                              title: `${client.clientShopName || 'ব্যবসায়ী'} (${client.clientEmail || 'ক্লায়েন্ট'})`
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
                            fontWeight: isActive ? '800' : '500',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '7px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              flexShrink: 0
                            }}
                          >
                            <Store size={14} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {client.clientShopName || 'নিবন্ধিত ব্যবসায়ী'}
                            </div>
                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {client.clientEmail || client.clientPhone || 'সক্রিয় লাইসেন্স'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* Store Channels */}
            <div style={{ padding: '14px 14px 6px', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'bn' ? 'দোকান টিম চ্যানেল' : 'Store Channels'}
            </div>
            {CHANNELS.filter((c) => c.category === 'store').map((c) => {
              const isActive = activeTarget.type === 'channel' && activeTarget.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveTarget({ type: 'channel', id: c.id, title: c.name })}
                  style={{
                    padding: '10px 14px',
                    margin: '2px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                    color: isActive ? '#8b5cf6' : 'var(--text-main)',
                    fontWeight: isActive ? '800' : '500',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {getChannelIcon(c.id)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.desc}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Direct 1-on-1 with Staff */}
            <div style={{ padding: '14px 14px 6px', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'bn' ? '১-অন-১ কর্মী যোগাযোগ' : 'Direct Messages'}
            </div>
            {employees.length === 0 ? (
              <div style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'কোনো কর্মী তালিকা নেই' : 'No staff registered'}
              </div>
            ) : (
              employees.map((emp) => {
                const isActive = activeTarget.type === 'dm' && activeTarget.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setActiveTarget({ type: 'dm', id: emp.id, title: `${emp.name} (${emp.role || 'কর্মী'})` })}
                    style={{
                      padding: '8px 12px',
                      margin: '2px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                      color: isActive ? '#10b981' : 'var(--text-main)',
                      fontWeight: isActive ? '800' : '500',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}
                    >
                      {emp.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {emp.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {emp.role || 'স্টাফ'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Main Chat Window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
            {/* Chat Target Header */}
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
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{activeTarget.title}</span>
                  {activeTarget.id === 'super_admin_desk' && (
                    <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: '800' }}>
                      CENTRAL DESK
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {activeTarget.type === 'channel'
                    ? (lang === 'bn' ? 'সকল অনুমোদিত ব্যবহারকারীর কাছে দৃশ্যমান (ক্লাউড ও রিয়েলটাইম সিঙ্ক)' : 'Visible to role channel participants')
                    : (lang === 'bn' ? 'সুরক্ষিত ১-অন-১ গোপনীয় ক্লাউড চ্যাট' : 'Private Direct Cloud Conversation')}
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

            {/* Messages Feed */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {currentMessages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '340px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}
                  >
                    <MessageSquare size={24} style={{ opacity: 0.5 }} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'কোনো মেসেজ নেই' : 'No messages yet'}
                  </div>
                  <div style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? 'সুপার এডমিন ও ব্যবসায়ীর মধ্যে এই চ্যানেলে এখনো কোনো বার্তা নেই। নিচে মেসেজ লিখে পাঠান।'
                      : 'Send a message or announcement below to start direct communication.'}
                  </div>
                </div>
              ) : (
                currentMessages.map((m) => {
                  const isMe =
                    m.senderId === activeUserId ||
                    (isSuperAdmin && (m.senderId === 'super_admin' || m.senderRole === 'Super Admin')) ||
                    (activeUserEmail && m.senderEmail?.toLowerCase() === activeUserEmail.toLowerCase());

                  const isFromSuperAdmin = m.senderRole === 'Super Admin' || m.senderId === 'super_admin';
                  const timeFormatted = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          color: 'var(--text-muted)',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{m.senderName}</span>
                        {isFromSuperAdmin ? (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                              color: '#ffffff',
                              fontWeight: '900',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <ShieldCheck size={11} />
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                            {m.senderRole}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          background: isMe
                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                            : isFromSuperAdmin
                            ? 'rgba(239, 68, 68, 0.12)'
                            : m.category === 'notice'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'var(--surface-color)',
                          border: isMe
                            ? 'none'
                            : isFromSuperAdmin
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : m.category === 'notice'
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid var(--border-color)',
                          color: isMe ? '#ffffff' : 'var(--text-main)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Notice Header Banner */}
                        {m.category === 'notice' && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#ef4444',
                              fontWeight: '800',
                              fontSize: '0.78rem',
                              marginBottom: '6px'
                            }}
                          >
                            <AlertTriangle size={14} />
                            <span>{lang === 'bn' ? 'জরুরি নোটিশ / ঘোষণা' : 'URGENT ANNOUNCEMENT'}</span>
                          </div>
                        )}

                        {/* Text */}
                        {m.text && (
                          <div style={{ fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {m.text}
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

                        {/* Invoice Reference Attachment */}
                        {m.meta?.invoiceRef && (
                          <div
                            style={{
                              marginTop: '8px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isMe ? 'rgba(0,0,0,0.15)' : 'rgba(59, 130, 246, 0.1)',
                              border: '1px dashed rgba(59, 130, 246, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <Receipt size={16} color="#3b82f6" />
                            <div>
                              <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                                {lang === 'bn' ? 'সংযুক্ত মেমো / চালান নং' : 'Attached Invoice Ref'}
                              </div>
                              <div style={{ fontWeight: '800', fontSize: '0.92rem', fontFamily: 'monospace' }}>
                                #{m.meta.invoiceRef}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '0.64rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Clock size={10} />
                        <span>{timeFormatted}</span>
                        {isMe && <CheckCheck size={12} color="#10b981" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Extra Attachment Selector Bar */}
            {msgCategory === 'invoice' && (
              <div style={{ padding: '8px 16px', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} color="#3b82f6" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700' }}>{lang === 'bn' ? 'মেমো / ইনভয়েস নম্বর:' : 'Invoice No:'}</span>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-001"
                  value={invoiceRefInput}
                  onChange={(e) => setInvoiceRefInput(e.target.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem'
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
                padding: '12px 16px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Quick tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'notice' ? 'normal' : 'notice'))}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
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
                  <AlertTriangle size={12} />
                  <span>জরুরি নোটিশ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'handover' ? 'normal' : 'handover'))}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
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
                  <Wallet size={12} />
                  <span>ক্যাশ হ্যান্ডওভার ট্যাগ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMsgCategory((c) => (c === 'invoice' ? 'normal' : 'invoice'))}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    border: msgCategory === 'invoice' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: msgCategory === 'invoice' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: msgCategory === 'invoice' ? '#3b82f6' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Receipt size={12} />
                  <span>ইনভয়েস ট্যাগ</span>
                </button>
              </div>

              {/* Text Input + Send Button */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={
                    msgCategory === 'notice'
                      ? 'জরুরি নোটিশ লিখুন...'
                      : isSuperAdmin
                      ? (lang === 'bn' ? 'ব্যবসায়ীর জন্য বার্তা বা সাপোর্ট লিখুন...' : 'Type message to merchant...')
                      : (lang === 'bn' ? 'মেসেজ বা নির্দেশনা লিখুন...' : 'Type message...')
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
                  disabled={!inputText.trim() && !invoiceRefInput && !handoverAmount}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      !inputText.trim() && !invoiceRefInput && !handoverAmount
                        ? 'rgba(255,255,255,0.1)'
                        : isSuperAdmin
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: !inputText.trim() && !invoiceRefInput && !handoverAmount ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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
    </div>
  );
};

export default InternalCommunicationHubModal;
