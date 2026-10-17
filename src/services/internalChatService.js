/**
 * HisabKitab 360 - Multi-Tier Internal Communication & Messaging Service
 * ----------------------------------------------------------------------
 * Supports:
 * 1. Super Admin <-> Business Owner (Platform announcements, licensing & direct support)
 * 2. Business Owner <-> Store Staff (Counter Cashier, Salesman, Delivery)
 * 3. Role Channels (#General-Notice, #Cashier-Desk, #Sales-Team)
 * 4. 1-on-1 Direct Messaging between Manager and any Employee
 * 5. Real-time storage persistence and Web Audio chime notification
 */

import { playSuccessChime } from './soundFeedback';

const STORAGE_KEY = 'hk360_internal_messages';
const UNREAD_KEY = 'hk360_unread_msg_count';

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
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse internal messages:', e);
    return [];
  }
};

export const saveMessage = (msg) => {
  try {
    const current = getStoredMessages();
    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...msg
    };
    const updated = [...current, newMsg];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Play chime feedback
    try {
      playSuccessChime();
    } catch {}

    // Dispatch global event for listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_internal_msg_received', { detail: newMsg }));
    }

    return newMsg;
  } catch (err) {
    console.error('Failed to save message:', err);
    return null;
  }
};

export const getUnreadCount = (activeUserId = 'owner') => {
  try {
    const msgs = getStoredMessages();
    const readIds = JSON.parse(localStorage.getItem(`hk360_read_msgs_${activeUserId}`) || '[]');
    const unread = msgs.filter(m => m.senderId !== activeUserId && !readIds.includes(m.id));
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
    
    msgs.forEach(m => {
      if (m.channelId === channelOrTargetId || m.recipientId === channelOrTargetId || m.senderId === channelOrTargetId) {
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
    const filtered = current.filter(m => m.channelId !== channelId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_internal_msg_cleared'));
    }
    return true;
  } catch {
    return false;
  }
};
