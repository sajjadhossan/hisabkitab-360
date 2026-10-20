/**
 * HisabKitab 360 - Multi-Tier Internal Communication & Messaging Service (Cross-Device Cloud & Realtime)
 * -------------------------------------------------------------------------------------------------------
 * Supports:
 * 1. Super Admin <-> Business Owner (Platform announcements, licensing & direct 1-on-1 support)
 * 2. Business Owner <-> Store Staff (Counter Cashier, Salesman, Delivery)
 * 3. Role Channels (#super_admin_desk, #store_general, #cashier_desk, #sales_team)
 * 4. 1-on-1 Direct Messaging between Super Admin and any Merchant / Staff
 * 5. Supabase Realtime WebSocket broadcast (<150ms delivery) across Android APK, Windows PC, and Web
 * 6. Supabase Cloud audit_logs persistence so offline devices pull missed messages on boot
 * 7. Web Audio chime notification & haptic feedback
 */

import { playSuccessChime } from './soundFeedback';
import { broadcastLiveEvent, subscribeLiveSync, getLocalDeviceId } from './liveSyncService';
import { getSupabase, isSupabaseReady } from './supabaseClient';
import { hapticFeedback } from './nativeAppService';

const STORAGE_KEY = 'hk360_internal_messages';
const UNREAD_KEY = 'hk360_unread_msg_count';
const CLOUD_CHAT_ACTION = 'INTERNAL_CHAT_MESSAGE';
const CLOUD_DELETE_ACTION = 'INTERNAL_CHAT_MESSAGE_DELETED';

export const CHANNELS = [
  {
    id: 'super_admin_desk',
    name: 'সুপার এডমিন হেল্পডেস্ক ও নোটিশ',
    nameEn: 'Super Admin Desk',
    category: 'platform',
    icon: 'ShieldCheck',
    desc: 'প্ল্যাটফর্ম আপডেট, সাবস্ক্রিপশন ও কেন্দ্রীয় সাপোর্ট'
  },
  {
    id: 'store_general',
    name: 'দোকান সাধারণ আলোচনা ও নোটিশ',
    nameEn: 'General Announcements',
    category: 'store',
    icon: 'Megaphone',
    desc: 'সকল কর্মচারীদের জন্য সাধারণ জরুরি নোটিশ'
  },
  {
    id: 'cashier_desk',
    name: 'ক্যাশ ও কাউন্টার ডেস্ক',
    nameEn: 'Cashier & Counter Desk',
    category: 'store',
    icon: 'Wallet',
    desc: 'ক্যাশ হ্যান্ডওভার, ড্রয়ার ক্লোজিং ও দৈনিক সেলস ট্যালি'
  },
  {
    id: 'sales_team',
    name: 'সেলস ও ডেলিভারি টিম',
    nameEn: 'Sales & Delivery Team',
    category: 'store',
    icon: 'ShoppingBag',
    desc: 'অর্ডার ডিসপ্যাচ, কাস্টমার রিকোয়েস্ট ও সেলস টার্গেট'
  }
];

export const getStoredMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('Failed to parse internal messages:', e);
    return [];
  }
};

/**
 * Saves a message locally, broadcasts via Realtime WebSocket, and saves to Cloud
 */
export const saveMessage = (msg) => {
  try {
    const current = getStoredMessages();
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      senderDeviceId: getLocalDeviceId(),
      ...msg
    };
    
    // 1. Optimistic Local Save
    const updated = [...current, newMsg];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Local feedback
    try {
      playSuccessChime();
      hapticFeedback.light();
    } catch {}

    // 3. Dispatch local event for instant UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_internal_msg_received', { detail: newMsg }));
    }

    // 4. Instant Realtime WebSocket broadcast to all connected devices (<150ms)
    try {
      broadcastLiveEvent('INTERNAL_CHAT_MESSAGE', newMsg);
    } catch (bcErr) {
      console.debug('[InternalChat] Broadcast notice:', bcErr);
    }

    // 5. Asynchronous Cloud Persistence in Supabase (so offline devices receive it later)
    persistMessageToCloud(newMsg).catch((err) => {
      console.warn('[InternalChat] Cloud persist background error:', err);
    });

    return newMsg;
  } catch (err) {
    console.error('Failed to save message:', err);
    return null;
  }
};

/**
 * Persists message to Supabase audit_logs table
 */
export const persistMessageToCloud = async (msg) => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) return false;

  try {
    const { error } = await supabase.from('audit_logs').insert([{
      action: CLOUD_CHAT_ACTION,
      entity_type: 'chat_message',
      entity_id: msg.id,
      actor_name: msg.senderName || 'ব্যবহারকারী',
      details: msg
    }]);

    if (error) {
      console.warn('[InternalChat] Supabase save error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[InternalChat] Failed to push message to cloud:', e);
    return false;
  }
};

/**
 * Compresses an image file client-side into WebP/JPEG dataURL (reduces 5MB to ~80-120KB)
 */
export const compressImageFile = (file, maxWidth = 1024, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve({
          name: file.name,
          type: 'image/webp',
          size: Math.round((dataUrl.length * 3) / 4),
          dataUrl
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Deletes a message locally and broadcasts/persists deletion to Cloud
 */
export const deleteMessage = async (messageId, deleteForEveryone = true) => {
  try {
    const current = getStoredMessages();
    const target = current.find((m) => m.id === messageId);
    if (!target) return false;

    const updated = current.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          isDeleted: true,
          text: '🚫 এই বার্তাটি মুছে ফেলা হয়েছে',
          attachment: null,
          meta: null
        };
      }
      return m;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Local dispatch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_internal_msg_received', { detail: { id: messageId, isDeleted: true } }));
    }

    if (deleteForEveryone) {
      // 1. Realtime Broadcast
      try {
        broadcastLiveEvent('INTERNAL_CHAT_MESSAGE_DELETED', { messageId });
      } catch {}

      // 2. Cloud persistence of deletion
      const supabase = getSupabase();
      if (supabase && isSupabaseReady()) {
        try {
          await supabase.from('audit_logs').insert([{
            action: CLOUD_DELETE_ACTION,
            entity_type: 'chat_message',
            entity_id: messageId,
            actor_name: 'ব্যবহারকারী',
            details: { messageId, deletedAt: new Date().toISOString() }
          }]);
        } catch (e) {
          console.warn('[InternalChat] Supabase delete log failed:', e);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to delete message:', err);
    return false;
  }
};

/**
 * Pulls missed messages from Supabase Cloud and merges into local storage
 */
export const syncCloudMessages = async () => {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseReady()) return getStoredMessages();

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) return getStoredMessages();

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, details, created_at')
      .in('action', [CLOUD_CHAT_ACTION, CLOUD_DELETE_ACTION])
      .order('created_at', { ascending: false })
      .limit(150);

    if (error || !data || !Array.isArray(data)) {
      return getStoredMessages();
    }

    const localMsgs = getStoredMessages();
    const localMap = new Map(localMsgs.map((m) => [m.id, m]));
    let hasChanges = false;

    // Filter out deletions and add new messages
    data.reverse().forEach((row) => {
      if (row.action === CLOUD_DELETE_ACTION) {
        const deletedId = row.details?.messageId;
        if (deletedId && localMap.has(deletedId)) {
          const existing = localMap.get(deletedId);
          if (!existing.isDeleted) {
            localMap.set(deletedId, {
              ...existing,
              isDeleted: true,
              text: '🚫 এই বার্তাটি মুছে ফেলা হয়েছে',
              attachment: null,
              meta: null
            });
            hasChanges = true;
          }
        }
      } else if (row.action === CLOUD_CHAT_ACTION) {
        const msg = row.details;
        if (msg && msg.id && !localMap.has(msg.id)) {
          localMap.set(msg.id, msg);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      const merged = Array.from(localMap.values());
      // Sort by timestamp
      merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hk360_internal_msg_received'));
      }
      return merged;
    }

    return localMsgs;
  } catch (err) {
    console.warn('[InternalChat] syncCloudMessages error:', err);
    return getStoredMessages();
  }
};

/**
 * Initializes Realtime WebSocket listener for incoming cross-device chat
 */
export const initChatRealtimeListener = (onIncomingMessage) => {
  // 1. Initial Cloud Sync
  syncCloudMessages().catch(() => {});

  // 2. Subscribe to Supabase Realtime WebSocket broadcast
  const unsubscribe = subscribeLiveSync((eventObj) => {
    if (eventObj?.eventType === 'INTERNAL_CHAT_MESSAGE') {
      const incoming = eventObj.data;
      if (!incoming || !incoming.id) return;

      const myDeviceId = getLocalDeviceId();
      if (eventObj.senderDeviceId === myDeviceId || incoming.senderDeviceId === myDeviceId) {
        // Echo of own message
        return;
      }

      // Check if already in local storage
      const current = getStoredMessages();
      if (current.some((m) => m.id === incoming.id)) {
        return;
      }

      // Append new message
      const updated = [...current, incoming];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Trigger Audio & Haptic
      try {
        playSuccessChime();
        hapticFeedback.medium();
      } catch {}

      // Dispatch window event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hk360_internal_msg_received', { detail: incoming }));
      }

      // Callback for App-level toast / notifications
      if (typeof onIncomingMessage === 'function') {
        try {
          onIncomingMessage(incoming);
        } catch {}
      }
    } else if (eventObj?.eventType === 'INTERNAL_CHAT_MESSAGE_DELETED') {
      const { messageId } = eventObj.data || {};
      if (!messageId) return;

      const current = getStoredMessages();
      let changed = false;
      const updated = current.map((m) => {
        if (m.id === messageId && !m.isDeleted) {
          changed = true;
          return {
            ...m,
            isDeleted: true,
            text: '🚫 এই বার্তাটি মুছে ফেলা হয়েছে',
            attachment: null,
            meta: null
          };
        }
        return m;
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hk360_internal_msg_received', { detail: { id: messageId, isDeleted: true } }));
        }
      }
    }
  });

  // Periodic heartbeat sync (every 60s)
  const timer = setInterval(() => {
    syncCloudMessages().catch(() => {});
  }, 60000);

  return () => {
    unsubscribe();
    clearInterval(timer);
  };
};

export const getUnreadCount = (activeUserId = 'owner') => {
  try {
    const msgs = getStoredMessages();
    const readIds = new Set(JSON.parse(localStorage.getItem(`hk360_read_msgs_${activeUserId}`) || '[]'));
    const isSuper = activeUserId === 'super_admin';
    const unread = msgs.filter((m) => {
      if (m.senderId === activeUserId) return false;
      if (isSuper && (m.senderRole === 'সুপার এডমিন' || m.senderRole === 'Super Admin' || m.senderId === 'super_admin')) return false;
      if (m.read) return false;
      if (readIds.has(m.id)) return false;
      if (isSuper) {
        return m.recipientId === 'super_admin' || m.channelId === 'super_admin_desk';
      }
      return true;
    });
    return unread.length;
  } catch {
    return 0;
  }
};

export const markChannelAsRead = (channelOrTargetId, activeUserId = 'owner') => {
  try {
    const msgs = getStoredMessages();
    const readKey = `hk360_read_msgs_${activeUserId}`;
    const readIds = new Set(JSON.parse(localStorage.getItem(readKey) || '[]'));
    let changed = false;

    msgs.forEach((m) => {
      const match = (
        m.channelId === channelOrTargetId ||
        m.recipientId === channelOrTargetId ||
        m.senderId === channelOrTargetId ||
        (m.recipientEmail && m.recipientEmail === channelOrTargetId) ||
        (m.senderEmail && m.senderEmail === channelOrTargetId) ||
        (channelOrTargetId === 'super_admin' && (m.recipientId === 'super_admin' || m.senderId === 'super_admin' || m.channelId === 'super_admin_desk'))
      );
      if (match) {
        readIds.add(m.id);
        if (!m.read) {
          m.read = true;
          m.readAt = Date.now();
          changed = true;
        }
      }
    });

    localStorage.setItem(readKey, JSON.stringify(Array.from(readIds)));
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_internal_msg_read'));
    }
  } catch (e) {
    console.warn('Error marking messages as read:', e);
  }
};

export const clearChannelHistory = (channelId) => {
  try {
    const current = getStoredMessages();
    const filtered = current.filter((m) => m.channelId !== channelId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_internal_msg_cleared'));
    }
    return true;
  } catch {
    return false;
  }
};
