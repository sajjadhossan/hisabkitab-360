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
      .select('id, details, created_at')
      .eq('action', CLOUD_CHAT_ACTION)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || !Array.isArray(data)) {
      return getStoredMessages();
    }

    const localMsgs = getStoredMessages();
    const localIds = new Set(localMsgs.map((m) => m.id));
    let hasNew = false;
    const merged = [...localMsgs];

    // Data is descending, reverse to append chronologically
    data.reverse().forEach((row) => {
      const msg = row.details;
      if (msg && msg.id && !localIds.has(msg.id)) {
        localIds.add(msg.id);
        merged.push(msg);
        hasNew = true;
      }
    });

    if (hasNew) {
      // Sort by timestamp
      merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hk360_internal_msg_received'));
      }
    }

    return merged;
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
    const readIds = JSON.parse(localStorage.getItem(`hk360_read_msgs_${activeUserId}`) || '[]');
    const unread = msgs.filter((m) => m.senderId !== activeUserId && !readIds.includes(m.id));
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

    msgs.forEach((m) => {
      if (
        m.channelId === channelOrTargetId ||
        m.recipientId === channelOrTargetId ||
        m.senderId === channelOrTargetId ||
        (m.recipientEmail && m.recipientEmail === channelOrTargetId) ||
        (m.senderEmail && m.senderEmail === channelOrTargetId)
      ) {
        readIds.add(m.id);
      }
    });

    localStorage.setItem(readKey, JSON.stringify(Array.from(readIds)));
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
