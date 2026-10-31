import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Pin,
  Copy,
  Trash2,
  Paperclip,
  Check,
  Bell,
  Sparkles,
  Users,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  CheckCheck,
  AlertTriangle,
  X,
  ShieldAlert
} from 'lucide-react';
import { playButtonClick, playSuccessChime } from '../../services/soundFeedback';
import { hapticFeedback } from '../../services/nativeAppService';
import { broadcastLiveEvent, subscribeLiveSync } from '../../services/liveSyncService';

export const SamityInternalChatHub = ({
  samityData = {},
  updateAndSave = () => {},
  activeSamityId = '',
  isLight = false,
  showToast = null,
  t = (bn) => bn,
  currentUser = null,
  onClose = null
}) => {
  const currentSamity = useMemo(() => {
    return (samityData.samities || []).find(s => s.id === activeSamityId) || samityData.samities?.[0] || {};
  }, [samityData.samities, activeSamityId]);

  const members = useMemo(() => {
    return (samityData.members || []).filter(m => m.samityId === activeSamityId);
  }, [samityData.members, activeSamityId]);

  // Messages array stored inside samityData.chatMessages
  const messages = useMemo(() => {
    const list = samityData.chatMessages || [];
    return list.filter(m => !m.samityId || m.samityId === activeSamityId);
  }, [samityData.chatMessages, activeSamityId]);

  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('message'); // 'message' | 'notice'
  const [senderRole, setSenderRole] = useState((currentUser && currentUser.role) ? currentUser.role : 'সভাপতি (President)');
  const [senderName, setSenderName] = useState((currentUser && currentUser.name) ? currentUser.name : 'মো: সভাপতি');
  const [attachedFile, setAttachedFile] = useState(null); // { name, type, data }
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pinned' | 'notices'
  const [copiedId, setCopiedId] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);

  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Subscribe to live broadcast for incoming messages
  useEffect(() => {
    const unsubscribe = subscribeLiveSync((evt) => {
      if (evt.eventType === 'SAMITY_CHAT_NEW_MESSAGE' && evt.data?.message) {
        hapticFeedback?.selection?.();
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Send new message / notice
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageText.trim() && !attachedFile) {
      showToast?.(t('মেসেজ বা নোটিশের বিবরণ লিখুন', 'Please type a message or notice'), 'warning');
      return;
    }

    playButtonClick?.();
    hapticFeedback?.light?.();

    const newMessage = {
      id: 'MSG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      samityId: activeSamityId,
      senderName: senderName.trim() || 'প্রতিনিধি',
      senderRole: senderRole,
      text: messageText.trim(),
      type: messageType,
      isPinned: messageType === 'notice', // notices are pinned by default
      attachment: attachedFile,
      createdAt: new Date().toISOString()
    };

    updateAndSave(prev => ({
      ...prev,
      chatMessages: [...(prev.chatMessages || []), newMessage]
    }), {
      action: messageType === 'notice' ? 'NEW_OFFICIAL_NOTICE' : 'NEW_CHAT_MESSAGE',
      module: 'COMMUNICATION',
      details: { text: newMessage.text.slice(0, 40), role: senderRole }
    });

    try {
      broadcastLiveEvent('SAMITY_CHAT_NEW_MESSAGE', { message: newMessage });
    } catch {}

    playSuccessChime?.();
    showToast?.(messageType === 'notice' ? t('📢 জরুরি নোটিশ সফলভাবে পোস্ট হয়েছে!', '📢 Official notice posted successfully!') : t('মেসেজ পাঠানো হয়েছে', 'Message sent'), 'success');

    setMessageText('');
    setAttachedFile(null);
  };

  // Toggle Pin / Unpin
  const handleTogglePin = (msgId) => {
    playButtonClick?.();
    hapticFeedback?.light?.();

    updateAndSave(prev => ({
      ...prev,
      chatMessages: (prev.chatMessages || []).map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m)
    }), {
      action: 'TOGGLE_PIN_MESSAGE',
      module: 'COMMUNICATION',
      recordId: msgId
    });

    showToast?.(t('মেসেজের পিন স্ট্যাটাস পরিবর্তন হয়েছে', 'Message pin status updated'), 'info');
  };

  // 1-Click Copy Text
  const handleCopyMessage = (text, id) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      hapticFeedback?.light?.();
      showToast?.(t('ক্লিপবোর্ডে কপি সম্পন্ন!', 'Copied to clipboard!'), 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast?.('কপি করতে সমস্যা হয়েছে', 'error');
    }
  };

  // Open modern delete confirmation modal
  const promptDeleteMessage = (msg) => {
    playButtonClick?.();
    hapticFeedback?.light?.();
    setDeletingMessage(msg);
  };

  // Confirm delete message (no window.confirm, 100% custom enterprise modal)
  const handleConfirmDelete = () => {
    if (!deletingMessage) return;
    const msgId = deletingMessage.id;

    playButtonClick?.();
    hapticFeedback?.medium?.();

    updateAndSave(prev => ({
      ...prev,
      chatMessages: (prev.chatMessages || []).filter(m => m.id !== msgId)
    }), {
      action: 'DELETE_CHAT_MESSAGE',
      module: 'COMMUNICATION',
      recordId: msgId,
      details: {
        textSnippet: deletingMessage.text?.slice(0, 60),
        deletedBy: currentUser?.name || senderName || 'User',
        timestamp: new Date().toISOString()
      }
    });

    try {
      broadcastLiveEvent('SAMITY_CHAT_MESSAGE_DELETED', { messageId: msgId });
    } catch {}

    setDeletingMessage(null);
    showToast?.(t('✅ মেসেজটি সফলভাবে মুছে ফেলা হয়েছে', '✅ Message successfully deleted'), 'success');
  };

  // Handle Attachment Upload (Images or PDFs)
  const handleAttachmentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast?.(t('ফাইল সাইজ সর্বোচ্চ ৪ মেগাবাইট হতে পারবে', 'Maximum file size is 4MB'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        data: event.target?.result
      });
      showToast?.(t('ফাইল সফলভাবে সংযুক্ত হয়েছে!', 'File attached successfully!'), 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (filterType === 'pinned' && !m.isPinned) return false;
      if (filterType === 'notices' && m.type !== 'notice') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.text?.toLowerCase().includes(q) ||
          m.senderName?.toLowerCase().includes(q) ||
          m.senderRole?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, filterType, searchQuery]);

  // Separate pinned notices for top banner
  const pinnedNotices = useMemo(() => {
    return messages.filter(m => m.isPinned);
  }, [messages]);

  const ROLES = [
    'সভাপতি (President)',
    'সাধারণ সম্পাদক (General Secretary)',
    'কোষাধ্যক্ষ (Treasurer)',
    'মাঠ কর্মকর্তা (Field Officer)',
    'অডিটর (Auditor)',
    'সাধারণ সদস্য (Member)'
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '1080px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Top Header Card */}
      <div
        style={{
          background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          padding: '20px 24px',
          borderRadius: '18px',
          border: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: isLight ? '0 4px 14px rgba(0,0,0,0.04)' : '0 8px 24px rgba(0,0,0,0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              fontSize: '1.4rem'
            }}
          >
            💬
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: isLight ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{t('সমিতি অভ্যন্তরীণ চ্যাট ও নোটিস হাব', 'Samity Internal Chat & Notice Hub')}</span>
              <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', border: '1px solid #10b981', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                🟢 {t('রিয়েল-টাইম লাইভ', 'Real-Time Live')}
              </span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: isLight ? '#475569' : '#94a3b8' }}>
              {t('সভাপতি, সাধারণ সম্পাদক, কোষাধ্যক্ষ ও সকল সদস্যের জন্য অফিশিয়াল বিজ্ঞপ্তি, দিকনির্দেশনা ও চ্যাট প্ল্যাটফর্ম।', 'Official notices, executive instructions, and synchronized chat across all member terminals.')}
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: isLight ? '#94a3b8' : '#64748b' }} />
            <input
              type="text"
              placeholder={t('মেসেজ খুঁজুন...', 'Search messages...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 12px 7px 30px',
                borderRadius: '8px',
                border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontSize: '0.78rem',
                outline: 'none',
                width: '160px'
              }}
            />
          </div>

          <div style={{ display: 'flex', background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.8)', padding: '2px', borderRadius: '8px', border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                border: 'none',
                background: filterType === 'all' ? '#0284c7' : 'transparent',
                color: filterType === 'all' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {t('সকল', 'All')} ({messages.length})
            </button>
            <button
              onClick={() => setFilterType('pinned')}
              style={{
                border: 'none',
                background: filterType === 'pinned' ? '#0284c7' : 'transparent',
                color: filterType === 'pinned' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              📌 {t('পিন্ড', 'Pinned')} ({pinnedNotices.length})
            </button>
            <button
              onClick={() => setFilterType('notices')}
              style={{
                border: 'none',
                background: filterType === 'notices' ? '#0284c7' : 'transparent',
                color: filterType === 'notices' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              📢 {t('বিজ্ঞপ্তি', 'Notices')}
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                playButtonClick?.();
                onClose();
              }}
              title={t('চ্যাট বন্ধ করুন', 'Close Chat')}
              aria-label="Close"
              style={{
                background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
                border: isLight ? '1.5px solid #fca5a5' : '1px solid rgba(239, 68, 68, 0.45)',
                color: '#ef4444',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Pinned Notices Highlight Banner (if any) */}
      {pinnedNotices.length > 0 && filterType !== 'pinned' && (
        <div
          style={{
            background: isLight ? '#fffbeb' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.85))',
            border: isLight ? '1.5px solid #f59e0b' : '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '14px 18px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Pin size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', fontWeight: '900', color: isLight ? '#b45309' : '#fbbf24', textTransform: 'uppercase' }}>
              📌 {t('গুরুত্বপূর্ণ পিন্ড বিজ্ঞপ্তি ও নির্দেশনাবলী', 'Pinned Executive Notices & Instructions')} ({pinnedNotices.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pinnedNotices.slice(0, 3).map(pn => (
              <div
                key={pn.id}
                style={{
                  background: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
                  border: isLight ? '1px solid #fde68a' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7' }}>{pn.senderName} ({pn.senderRole})</span>
                    <span style={{ fontSize: '0.65rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                      {new Date(pn.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: isLight ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pn.text}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleCopyMessage(pn.text, pn.id)}
                    title={t('কপি করুন', 'Copy text')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copiedId === pn.id ? '#10b981' : (isLight ? '#64748b' : '#94a3b8'), padding: '4px' }}
                  >
                    {copiedId === pn.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => handleTogglePin(pn.id)}
                    title={t('আনপিন করুন', 'Unpin notice')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '4px' }}
                  >
                    <Pin size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Stream Container */}
      <div
        style={{
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.9)',
          border: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          minHeight: '440px',
          maxHeight: '560px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.03)' : '0 8px 25px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }}
      >
        {/* Messages List Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {filteredMessages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px', color: isLight ? '#94a3b8' : '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
              <div style={{ fontSize: '0.94rem', fontWeight: '800', color: isLight ? '#475569' : '#cbd5e1' }}>
                {t('এখনো কোনো বার্তা বা নোটিশ নেই', 'No messages or notices yet')}
              </div>
              <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>
                {t('নিচের ইনপুট বক্সে সভাপতি, সাধারণ সম্পাদক বা সদস্য হিসেবে প্রথম বার্তা বা জরুরি নোটিশটি লিখুন।', 'Type the first notice or message below.')}
              </div>
            </div>
          ) : (
            filteredMessages.map(msg => {
              const isNotice = msg.type === 'notice';
              return (
                <div
                  key={msg.id}
                  style={{
                    background: isLight
                      ? (isNotice ? '#fffdf5' : '#f8fafc')
                      : (isNotice ? 'rgba(245, 158, 11, 0.1)' : 'rgba(30, 41, 59, 0.7)'),
                    border: isLight
                      ? (isNotice ? '1.5px solid #f59e0b' : '1px solid #e2e8f0')
                      : (isNotice ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'),
                    borderRadius: '14px',
                    padding: '14px 18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Message Top Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: isNotice ? 'rgba(245, 158, 11, 0.2)' : 'rgba(2, 132, 199, 0.15)',
                          color: isNotice ? '#d97706' : '#0284c7'
                        }}
                      >
                        {isNotice ? '📢 ' + t('অফিশিয়াল নোটিস', 'Official Notice') : '💬 ' + t('সাধারণ বার্তা', 'Message')}
                      </span>
                      <strong style={{ fontSize: '0.84rem', color: isLight ? '#0f172a' : '#f8fafc' }}>
                        {msg.senderName}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                        ({msg.senderRole})
                      </span>
                      {msg.isPinned && (
                        <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', padding: '1px 6px', borderRadius: '6px', fontWeight: '800' }}>
                          📌 {t('পিন্ড', 'Pinned')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: isLight ? '#94a3b8' : '#64748b' }}>
                        {new Date(msg.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}, {new Date(msg.createdAt).toLocaleDateString('bn-BD')}
                      </span>

                      {/* 1-Click Copy */}
                      <button
                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                        title={t('কপি করুন', 'Copy text')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copiedId === msg.id ? '#10b981' : (isLight ? '#64748b' : '#94a3b8'), padding: '4px' }}
                      >
                        {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      {/* Pin Toggle */}
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        title={msg.isPinned ? t('আনপিন করুন', 'Unpin message') : t('পিন করুন', 'Pin message')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: msg.isPinned ? '#f59e0b' : (isLight ? '#64748b' : '#94a3b8'), padding: '4px' }}
                      >
                        <Pin size={14} />
                      </button>

                      {/* Delete Button (Modern Trigger) */}
                      <button
                        onClick={() => promptDeleteMessage(msg)}
                        title={t('মুছে ফেলুন', 'Delete message')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Message Body Content */}
                  <div
                    style={{
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      color: isLight ? '#1e293b' : '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontWeight: '500'
                    }}
                  >
                    {msg.text}
                  </div>

                  {/* Attachment Preview (if any) */}
                  {msg.attachment && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
                        borderRadius: '10px',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        maxWidth: '400px'
                      }}
                    >
                      {msg.attachment.type?.startsWith('image/') ? (
                        <img
                          src={msg.attachment.data}
                          alt="Attachment"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                      ) : (
                        <FileText size={24} color="#0284c7" />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: '800', color: isLight ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {msg.attachment.name}
                        </div>
                        <a
                          href={msg.attachment.data}
                          download={msg.attachment.name}
                          style={{ fontSize: '0.7rem', color: '#0284c7', textDecoration: 'none', fontWeight: '700' }}
                        >
                          ⬇️ {t('ডাউনলোড ফাইল', 'Download File')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Bottom Form */}
        <form
          onSubmit={handleSendMessage}
          style={{
            borderTop: isLight ? '1.5px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 20px',
            background: isLight ? '#f8fafc' : 'rgba(30, 41, 59, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Top Options Bar (Sender Role & Message Type) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Sender Name */}
              <input
                type="text"
                placeholder={t('আপনার নাম', 'Your name')}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  outline: 'none',
                  width: '140px'
                }}
              />

              {/* Sender Role Select */}
              <select
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  color: isLight ? '#0f172a' : '#f8fafc',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  outline: 'none'
                }}
              >
                {ROLES.map(r => (
                  <option key={r} value={r} style={{ background: isLight ? '#fff' : '#0f172a', color: isLight ? '#000' : '#fff' }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Type Toggle */}
            <div style={{ display: 'flex', background: isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.8)', padding: '2px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setMessageType('message')}
                style={{
                  border: 'none',
                  background: messageType === 'message' ? '#0284c7' : 'transparent',
                  color: messageType === 'message' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                💬 {t('সাধারণ বার্তা', 'Message')}
              </button>
              <button
                type="button"
                onClick={() => setMessageType('notice')}
                style={{
                  border: 'none',
                  background: messageType === 'notice' ? '#f59e0b' : 'transparent',
                  color: messageType === 'notice' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                📢 {t('জরুরি নোটিস', 'Official Notice')}
              </button>
            </div>
          </div>

          {/* Attachment Preview (if selected) */}
          {attachedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.74rem', color: '#0284c7' }}>
              <span>📎 {attachedFile.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: '900' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Text Area & Submit Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            {/* Attachment Button */}
            <input
              type="file"
              id="samity-chat-attachment-input"
              style={{ display: 'none' }}
              onChange={handleAttachmentUpload}
              accept="image/*, application/pdf"
            />
            <button
              type="button"
              onClick={() => document.getElementById('samity-chat-attachment-input')?.click()}
              title={t('ছবি বা ফাইল সংযুক্ত করুন', 'Attach photo or file')}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isLight ? '#475569' : '#cbd5e1',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Paperclip size={18} />
            </button>

            {/* Input Text Field */}
            <textarea
              rows={2}
              placeholder={messageType === 'notice' ? t('📢 সমিতির সকল সদস্যের উদ্দেশ্যে জরুরি নোটিস বা সার্কুলার লিখুন...', 'Write an official circular notice for all members...') : t('💬 আপনার বার্তা লিখুন...', 'Type your message...')}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                color: isLight ? '#0f172a' : '#f8fafc',
                fontSize: '0.84rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />

            {/* Send Button */}
            <button
              type="submit"
              style={{
                background: messageType === 'notice' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                padding: '0 18px',
                height: '42px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                flexShrink: 0
              }}
            >
              <Send size={15} />
              <span>{messageType === 'notice' ? t('নোটিস দিন', 'Post Notice') : t('পাঠান', 'Send')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Enterprise Commercial Delete Confirmation Modal */}
      {deletingMessage && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.18s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playButtonClick?.();
              setDeletingMessage(null);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '24px 22px',
              boxShadow: isLight
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(239, 68, 68, 0.15)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(239, 68, 68, 0.3)',
              color: isLight ? '#0f172a' : '#f8fafc',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Close Icon */}
            <button
              onClick={() => {
                playButtonClick?.();
                setDeletingMessage(null);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: isLight ? '#f1f5f9' : '#1e293b',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isLight ? '#64748b' : '#94a3b8'
              }}
              title={t('বন্ধ করুন', 'Close')}
            >
              <X size={16} />
            </button>

            {/* Icon & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0
                }}
              >
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  {t('মেসেজ মুছে ফেলার নিশ্চিতকরণ', 'Delete Message Confirmation')}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                  {t('এই মেসেজটি সমিতি চ্যাট থেকে স্থায়ীভাবে মুছে যাবে।', 'This message will be permanently removed from the samity feed.')}
                </p>
              </div>
            </div>

            {/* Message Preview Snippet */}
            <div
              style={{
                background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '4px solid #ef4444',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.74rem' }}>
                <span style={{ fontWeight: '800', color: isLight ? '#334155' : '#cbd5e1' }}>
                  👤 {deletingMessage.senderName || 'প্রতিনিধি'}
                  {deletingMessage.senderRole && ` • ${deletingMessage.senderRole}`}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: deletingMessage.type === 'notice' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                  color: deletingMessage.type === 'notice' ? '#d97706' : '#0284c7',
                  fontWeight: '700'
                }}>
                  {deletingMessage.type === 'notice' ? t('জরুরি নোটিশ', 'Official Notice') : t('সাধারণ বার্তা', 'Chat Message')}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.84rem',
                  lineHeight: '1.5',
                  color: isLight ? '#1e293b' : '#e2e8f0',
                  maxHeight: '70px',
                  overflowY: 'auto',
                  wordBreak: 'break-word',
                  fontStyle: 'italic'
                }}
              >
                "{deletingMessage.text || (deletingMessage.attachment ? t('সংযুক্ত ফাইল / ছবি', 'Attached file/media') : t('(খালি বার্তা)', '(Empty message)'))}"
              </div>
            </div>

            {/* Cloud Audit & Realtime Protection Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '10px',
                background: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: isLight ? '#b91c1c' : '#f87171',
                fontSize: '0.74rem',
                fontWeight: '600',
                marginBottom: '20px'
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>
                {t('সকল অনলাইন ডিভাইসে রিয়েলটাইমে সিঙ্ক হবে এবং অডিট ট্রেইল সংরক্ষণ করা হবে।', 'Will sync in real-time across all online devices with audit trail.')}
              </span>
            </div>

            {/* Action Buttons (Touch friendly min 46px height) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  playButtonClick?.();
                  setDeletingMessage(null);
                }}
                style={{
                  flex: 1,
                  height: '46px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: isLight ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.18)',
                  background: isLight ? '#f8fafc' : '#1e293b',
                  color: isLight ? '#475569' : '#cbd5e1',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={15} />
                <span>{t('বাতিল করুন', 'Cancel')}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  flex: 1.4,
                  height: '46px',
                  minHeight: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Trash2 size={16} />
                <span>{t('হ্যাঁ, মুছে ফেলুন', 'Yes, Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
