// =========================================================================
// HisabKitab 360 - Telegram Cloud Bot Backup Service
// 100% Free, Unlimited Cloud Storage, Instant Mobile Notifications
// =========================================================================

import { processTelegramVoiceMessage } from './telegramVoiceToTextService';

const STORAGE_KEY = 'hk360_telegram_backup_config';

export const getTelegramBackupConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          botToken: '',
          chatId: '',
          geminiApiKey: '',
          groqApiKey: '',
          enabled: false,
          autoSync: true,
          lastSync: null,
          lastFileName: null
        };
  } catch {
    return {
      botToken: '',
      chatId: '',
      geminiApiKey: '',
      groqApiKey: '',
      enabled: false,
      autoSync: true,
      lastSync: null,
      lastFileName: null
    };
  }
};

export const saveTelegramBackupConfig = async (config) => {
  try {
    const payload = {
      ...config,
      enabled: config?.botToken ? true : Boolean(config?.enabled)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hk360_telegram_config_updated', { detail: payload }));
      // Notify preview server / local host daemon immediately
      try {
        await fetch('/api/telegram/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // Silently catch if running client-only
      }
    }
  } catch (err) {
    console.warn('Failed to save telegram backup config:', err);
  }
};

// Delete active webhook to prevent 409 Conflict with getUpdates
export const deleteTelegramWebhook = async (botToken) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
  } catch (err) {
    console.debug('deleteTelegramWebhook error:', err);
  }
};

// Register Native Commands with Telegram API (creates native /help button & command menu in Telegram)
export const registerTelegramCommands = async (botToken) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'help', description: '❓ সকল কমান্ড ও সাহায্য মেনু' },
          { command: 'today', description: '📊 আজকের বিক্রি ও সারসংক্ষেপ' },
          { command: 'profit', description: '📈 আজকের লাভ-ক্ষতি হিসাব' },
          { command: 'stock', description: '📦 স্টক ও পণ্যের তথ্য' },
          { command: 'due', description: '📒 কাস্টমার বকেয়া খাতা' },
          { command: 'expense', description: '💸 আজকের খরচের তালিকা' },
          { command: 'backup', description: '📥 ডাটাবেজ ব্যাকআপ ডাউনলোড' },
          { command: 'setkey', description: '🔑 ভয়েস এআই কি সেট করুন (/setkey <KEY>)' }
        ]
      })
    });
    return res.ok;
  } catch (err) {
    console.debug('registerTelegramCommands error:', err);
    return false;
  }
};

// Persistent touchable keyboard buttons for mobile & desktop Telegram (Bottom Sheet)
export const TELEGRAM_REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '❓ হেল্প ও সাহায্য' }, { text: '📊 আজকের বিক্রি' }],
    [{ text: '📈 লাভ-ক্ষতি' }, { text: '📦 স্টক রিপোর্ট' }],
    [{ text: '📒 বকেয়া খাতা' }, { text: '💸 খরচের তালিকা' }],
    [{ text: '📥 ব্যাকআপ' }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

// =========================================================================
// Interactive Inline Folder Keyboards (Full Remote Control Navigation)
// =========================================================================

export const TELEGRAM_FOLDER_MAIN = {
  inline_keyboard: [
    [
      { text: '➕ নতুন এন্ট্রি করুন (Add)', callback_data: 'folder_add' },
      { text: '📊 লাইভ রিপোর্ট (Reports)', callback_data: 'folder_reports' }
    ],
    [
      { text: '📦 স্টক ও পণ্য তালিকা', callback_data: 'cmd_stock' },
      { text: '📒 বকেয়া ও দেনা-পাওনা', callback_data: 'cmd_due' }
    ],
    [
      { text: '⚙️ রিমোট কন্ট্রোল ও লক', callback_data: 'folder_control' },
      { text: '❓ সাহায্য ও গাইড', callback_data: 'cmd_help' }
    ]
  ]
};

export const TELEGRAM_FOLDER_ADD = {
  inline_keyboard: [
    [
      { text: '🏢 ব্যবসার হিসাব এন্ট্রি (Business)', callback_data: 'folder_add_biz' }
    ],
    [
      { text: '🏠 ব্যক্তিগত হিসাব এন্ট্রি (Personal)', callback_data: 'folder_add_pers' }
    ],
    [
      { text: '🔙 মূল মেনুতে ফিরুন (Main Menu)', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_FOLDER_ADD_BIZ = {
  inline_keyboard: [
    [
      { text: '🛒 ক্যাটাগরি সেল (POS বাটন)', callback_data: 'pos_sale_start' },
      { text: '⚡ কুইক সেল টেক্সট', callback_data: 'prompt_sale' }
    ],
    [
      { text: '🧾 মেমো / ইনভয়েস তৈরি', callback_data: 'prompt_invoice' },
      { text: '👥 নতুন কাস্টমার যোগ', callback_data: 'prompt_customer' }
    ],
    [
      { text: '📦 নতুন পণ্য / স্টক যোগ', callback_data: 'prompt_product' },
      { text: '💸 দোকানের খরচ এন্ট্রি', callback_data: 'prompt_expense_biz' }
    ],
    [
      { text: '📒 কাস্টমার বাকি / জমা', callback_data: 'prompt_due' }
    ],
    [
      { text: '🔙 পিছনে যান', callback_data: 'folder_add' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_FOLDER_ADD_PERS = {
  inline_keyboard: [
    [
      { text: '🛒 দৈনিক বাজার খরচ', callback_data: 'prompt_expense_bazaar' },
      { text: '🏠 পারিবারিক বাজেট খরচ', callback_data: 'prompt_expense_family' }
    ],
    [
      { text: '💵 ব্যক্তিগত আয় / বেতন', callback_data: 'prompt_income' },
      { text: '📒 ব্যক্তিগত ধার / দেনা', callback_data: 'prompt_debt_pers' }
    ],
    [
      { text: '🔙 পিছনে যান', callback_data: 'folder_add' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_FOLDER_REPORTS = {
  inline_keyboard: [
    [
      { text: '💰 আজকের ক্যাশ ড্রয়ার', callback_data: 'cmd_cash' },
      { text: '📈 আজকের মোট বিক্রি', callback_data: 'cmd_today' }
    ],
    [
      { text: '💹 লাভ-ক্ষতি হিসাব', callback_data: 'cmd_profit' },
      { text: '⚠️ লো-স্টক সতর্কতা', callback_data: 'cmd_stock_low' }
    ],
    [
      { text: '🚨 বকেয়া তাগাদা তালিকা', callback_data: 'cmd_due' },
      { text: '💸 খরচের সারাংশ', callback_data: 'cmd_expense' }
    ],
    [
      { text: '📄 অন-ডিমান্ড পিডিএফ রিপোর্ট (PDF)', callback_data: 'folder_pdf' },
      { text: '🔍 পণ্যের ক্রয় ইতিহাস (AI)', callback_data: 'prompt_history' }
    ],
    [
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_FOLDER_PDF = {
  inline_keyboard: [
    [
      { text: '🏠 পার্সোনাল খরচ PDF', callback_data: 'cmd_pdf_personal' },
      { text: '🏢 ব্যবসায়ের খরচ PDF', callback_data: 'cmd_pdf_business' }
    ],
    [
      { text: '📒 বকেয়া খাতা PDF', callback_data: 'cmd_pdf_due' },
      { text: '💰 ক্যাশ ফ্লো স্টেটমেন্ট PDF', callback_data: 'cmd_pdf_cash' }
    ],
    [
      { text: '📦 স্টক ও ইনভেন্টরি PDF', callback_data: 'cmd_pdf_stock' },
      { text: '💹 লাভ-ক্ষতি ব্যালেন্স শিট PDF', callback_data: 'cmd_pdf_profit' }
    ],
    [
      { text: '🔙 পিছনে যান', callback_data: 'folder_reports' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_FOLDER_SALE_CATS = {
  inline_keyboard: [
    [
      { text: '🍚 চাল, ডাল ও খাদ্যপণ্য', callback_data: 'pos_cat_food' },
      { text: '🥤 পানীয় ও স্ন্যাক্স', callback_data: 'pos_cat_beverage' }
    ],
    [
      { text: '🧴 তেল ও প্রসাধন সামগ্রী', callback_data: 'pos_cat_toiletries' },
      { text: '💊 ওষুধ ও স্বাস্থ্যপণ্য', callback_data: 'pos_cat_medicine' }
    ],
    [
      { text: '📦 স্টেশনারি ও সাধারণ পণ্য', callback_data: 'pos_cat_general' },
      { text: '📋 সব প্রোডাক্ট তালিকা', callback_data: 'pos_cat_all' }
    ],
    [
      { text: '🔙 পিছনে যান', callback_data: 'folder_add_biz' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_FOLDER_CONTROL = {
  inline_keyboard: [
    [
      { text: '☁️ গুগল ড্রাইভ ব্যাকআপ নাও', callback_data: 'cmd_backup' },
      { text: '🔒 কাউন্টার স্ক্রিন লক করুন', callback_data: 'cmd_lock' }
    ],
    [
      { text: '📱 টার্মিনাল ও কাউন্টার স্ট্যাটাস', callback_data: 'cmd_terminals' },
      { text: '🌐 সফটওয়্যার লাইভ লিঙ্ক', callback_data: 'cmd_links' }
    ],
    [
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

export const TELEGRAM_INLINE_KEYBOARD = TELEGRAM_FOLDER_MAIN;
export const TELEGRAM_KEYBOARD = TELEGRAM_REPLY_KEYBOARD;

// Test Telegram Bot Token & Chat ID with Detailed Diagnostic Feedback
export const testTelegramBackupBot = async (botToken, chatId = null) => {
  const cleanToken = (botToken || '').trim().replace(/^bot/i, '');
  if (!cleanToken) {
    throw new Error('দয়া করে টেলিগ্রাম Bot Token লিখুন।');
  }

  // 1. Verify Bot via getMe
  let botInfo = null;
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    if (!meRes.ok) {
      const errData = await meRes.json().catch(() => ({}));
      if (meRes.status === 401 || meRes.status === 404) {
        throw new Error('বট টোকেনটি (Bot Token) সঠিক নয়। @BotFather থেকে পাওয়া সম্পূর্ণ টোকেনটি হুবহু কপি করে পেস্ট করুন।');
      }
      throw new Error(errData.description || 'বট টোকেনটি যাচাই করা যায়নি।');
    }
    const meData = await meRes.json();
    botInfo = meData.result;
    // Auto-clear conflicting webhook if any exists
    await deleteTelegramWebhook(cleanToken);
  } catch (err) {
    if (err.message && err.message.includes('টোকেন')) {
      throw err;
    }
    throw new Error('টেলিগ্রাম সার্ভারে (api.telegram.org) সংযোগ করা যাচ্ছে না। আপনার ইন্টারনেট বা ওয়াইফাইতে টেলিগ্রাম ব্লক থাকলে VPN অথবা Cloudflare 1.1.1.1 (WARP) চালু করে চেষ্টা করুন।');
  }

  // 2. If Chat ID is provided, test sending message
  const cleanChatId = (chatId || '').trim();
  if (cleanChatId) {
    const testMsg = `🎉 *হিসাবকিতাব ৩৬০ - টেলিগ্রাম ক্লাউড কানেকশন সফল!*\n━━━━━━━━━━━━━━━━━━━━━\n🤖 *বট:* @${botInfo.username}\n⏰ *সময়:* ${new Date().toLocaleString()}\n\n✅ এখন থেকে আপনার হিসাবের পূর্ণাঙ্গ ডাটাবেজ ব্যাকআপ এই চ্যাটে স্বয়ংক্রিয়ভাবে জমা হবে।`;
    
    try {
      const sendRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: testMsg,
          parse_mode: 'Markdown'
        })
      });

      if (!sendRes.ok) {
        const errData = await sendRes.json().catch(() => ({}));
        const desc = (errData.description || '').toLowerCase();
        
        if (desc.includes("can't initiate conversation") || desc.includes("forbidden") || sendRes.status === 403) {
          throw new Error(
            `বটটি প্রস্তুত (@${botInfo.username}), কিন্তু আপনি বটে এখনও একবারও '/start' চাপেননি! দয়া করে টেলিগ্রামে @${botInfo.username} বটে প্রবেশ করে 'START' বাটনে চাপ দিন, তারপর পুনরায় টেস্ট করুন।`
          );
        }
        if (desc.includes("chat not found") || sendRes.status === 400) {
          throw new Error(
            `Chat ID (${cleanChatId}) খুঁজে পাওয়া যায়নি। নিশ্চিত করুন আপনি @userinfobot থেকে আপনার সঠিক ID নিয়েছেন এবং আপনার বটে একবার /start লিখেছেন।`
          );
        }
        if (desc.includes("not a member") || desc.includes("not enough rights")) {
          throw new Error(
            `চ্যানেলে বট যুক্ত নেই। দয়া করে বটটিকে আপনার প্রাইভেট চ্যানেলে Administrator হিসেবে যুক্ত করুন এবং 'Post Messages' অনুমতি দিন।`
          );
        }
        throw new Error(errData.description || 'চ্যাটে মেসেজ পাঠানো যায়নি। Chat ID চেক করুন।');
      }
    } catch (sendErr) {
      throw sendErr;
    }
  }

  return {
    success: true,
    botUsername: botInfo.username,
    botName: botInfo.first_name
  };
};

// Send Full Database Backup File (.json) to Telegram Chat / Channel
export const sendBackupToTelegram = async (backupPayload, customConfig = null) => {
  const config = customConfig || getTelegramBackupConfig();
  const token = (config.botToken || '').trim();
  const chatId = (config.chatId || '').trim();

  if (!token || !chatId) {
    throw new Error('টেলিগ্রাম Bot Token এবং Chat ID কনফিগার করা নেই।');
  }

  const now = new Date();
  const dateFormatted = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `hisabkitab_backup_${dateFormatted}.json`;
  const fileContent = JSON.stringify(backupPayload, null, 2);

  const shopName = backupPayload.companyName || 'HisabKitab Store';
  const totalInvoices = backupPayload.summary?.totalInvoices || 0;
  const totalCustomers = backupPayload.summary?.totalCustomers || 0;
  const totalProducts = backupPayload.summary?.totalProducts || 0;

  const caption = `📦 *হিসাবকিতাব ৩৬০ - ক্লাউড অটো ব্যাকআপ*
📅 *তারিখ:* \`${now.toLocaleDateString()} ${now.toLocaleTimeString()}\`
🏪 *প্রতিষ্ঠান:* *${shopName}*
━━━━━━━━━━━━━━━━━━━━━
📊 *ইনভয়েস:* ${totalInvoices} টি
👥 *গ্রাহক:* ${totalCustomers} জন
📦 *আইটেম:* ${totalProducts} টি
💾 *ফাইল:* \`${fileName}\`
━━━━━━━━━━━━━━━━━━━━━
🔒 _এই ব্যাকআপ ফাইলটি আপনার টেলিগ্রাম ক্লাউডে আজীবন ১০০% সুরক্ষিত থাকবে।_`;

  // Create FormData for sendDocument
  const blob = new Blob([fileContent], { type: 'application/json' });
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', blob, fileName);
  formData.append('caption', caption);
  formData.append('parse_mode', 'Markdown');

  const uploadRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(errData.description || 'টেলিগ্রামে ব্যাকআপ ফাইল পাঠাতে ব্যর্থ হয়েছে।');
  }

  const resData = await uploadRes.json();
  const syncTime = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  // Update local config with lastSync
  const updatedConfig = {
    ...config,
    lastSync: syncTime,
    lastFileName: fileName
  };
  saveTelegramBackupConfig(updatedConfig);

  return {
    success: true,
    timestamp: syncTime,
    fileName,
    messageId: resData.result?.message_id
  };
};

// =========================================================================
// INTERACTIVE TWO-WAY BOT COMMAND ENGINE & REPORTS
// =========================================================================
let lastTelegramUpdateId = 0;
const _cachedStatements = new Map();

export const sendTelegramMessage = async (text, customConfig = null, customMarkup = null, parseMode = 'HTML') => {
  const config = customConfig || getTelegramBackupConfig();
  const token = (config.botToken || '').trim().replace(/^bot/i, '');
  const chatId = (config.chatId || '').trim();
  if (!token || !chatId) return false;

  const reply_markup = customMarkup !== undefined ? customMarkup : TELEGRAM_KEYBOARD;

  try {
    const payload = {
      chat_id: chatId,
      text,
      reply_markup: reply_markup || undefined
    };
    if (parseMode) payload.parse_mode = parseMode;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // If HTML parse failed (status 400), strip formatting and send as plain text
      const cleanText = text.replace(/<[^>]+>/g, '').replace(/[*_`]/g, '');
      const fallbackRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: cleanText,
          reply_markup: reply_markup || undefined
        })
      });
      return fallbackRes.ok;
    }
    return true;
  } catch (err) {
    console.warn('sendTelegramMessage error:', err);
    return false;
  }
};

export const parseSmartExpenseMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  // Convert Bengali numbers (০-৯) to English digits (0-9)
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalizedText = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);

  const lower = normalizedText.toLowerCase();

  // Check if this looks like an expense command
  const isExpenseIntent = (
    lower.includes('খরচ') ||
    lower.includes('expense') ||
    lower.includes('ভাড়া') ||
    lower.includes('বিল') ||
    lower.includes('কিনেছি') ||
    lower.startsWith('/addexpense')
  );

  if (!isExpenseIntent) return null;

  // 1. Amount Extraction (e.g., "১০০ টাকা", "100 tk", "৫০০", "500.50")
  const amountMatch = normalizedText.match(/(?:৳|\$)?\s*(\d+(?:\.\d+)?)\s*(?:টাকা|টাকার|tk|\/-)?/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1]);
  if (!amount || isNaN(amount) || amount <= 0) return null;

  // 2. Personal vs Business detection
  const isPersonal = (
    lower.includes('ব্যক্তিগত') ||
    lower.includes('পার্সোনাল') ||
    lower.includes('নিজের') ||
    lower.includes('পরিবার') ||
    lower.includes('বাসা') ||
    lower.includes('personal')
  );

  // 3. Category Extraction
  let category = '';
  const catMatch = normalizedText.match(/(?:ক্যাটাগরি|ক্যাটেগরি|খাত|category)\s*[:=]?\s*([^\s,;।]+)/i);
  if (catMatch) {
    category = catMatch[1].trim();
  }

  // 4. SubCategory Extraction
  let subCategory = '';
  const subCatMatch = normalizedText.match(/(?:সাবক্যাটাগরি|সাব-ক্যাটাগরি|উপখাত|উপ-খাত|subcategory)\s*[:=]?\s*([^\s,;।]+)/i);
  if (subCatMatch) {
    subCategory = subCatMatch[1].trim();
  }

  // 5. Member / Person Extraction
  let familyMember = '';
  const memberMatch = normalizedText.match(/(?:ব্যক্তি|সদস্য|নাম|person|member)\s*[:=]?\s*([^\s,;।]+)/i);
  if (memberMatch) {
    const rawMember = memberMatch[1].trim();
    if (rawMember.includes('নিজে') || rawMember.includes('আমি')) familyMember = 'নিজে (Self)';
    else if (rawMember.includes('বাবা')) familyMember = 'বাবা (Father)';
    else if (rawMember.includes('মা')) familyMember = 'মা (Mother)';
    else if (rawMember.includes('স্ত্রী') || rawMember.includes('বউ')) familyMember = 'স্ত্রী / স্বামী (Spouse)';
    else if (rawMember.includes('ছেলে') || rawMember.includes('মেয়ে') || rawMember.includes('সন্তান')) familyMember = 'সন্তান (Child)';
    else familyMember = rawMember;
  } else if (isPersonal) {
    familyMember = 'নিজে (Self)';
  }

  // 6. Note Extraction
  let note = '';
  const noteMatch = normalizedText.match(/(?:নোট|মন্তব্য|note)\s*[:=]?\s*([^।\n]+)/i);
  if (noteMatch) {
    note = noteMatch[1].trim();
  }

  // 7. Auto-detect category & subcategory if not explicitly given
  if (!category) {
    if (lower.includes('অটো') || lower.includes('রিকশা') || lower.includes('বাস') || lower.includes('ভাড়া') || lower.includes('যাতায়াত') || lower.includes('তেল')) {
      category = isPersonal ? 'transport' : 'যাতায়াত ও পরিবহন';
      if (!subCategory) subCategory = lower.includes('অটো') ? 'অটো / সিএনজি ভাড়া' : lower.includes('রিকশা') ? 'রিকশা ভাড়া' : 'বাস ভাড়া';
    } else if (lower.includes('ওষুধ') || lower.includes('ঔষধ') || lower.includes('ডাক্তার') || lower.includes('মেডিকেল') || lower.includes('টেস্ট')) {
      category = isPersonal ? 'medical' : 'চিকিৎসা ও ওষুধ';
      if (!subCategory) subCategory = 'প্রেসক্রিপশনের ওষুধ';
    } else if (lower.includes('শাক') || lower.includes('সবজি') || lower.includes('মাছ') || lower.includes('মাংস') || lower.includes('চাল') || lower.includes('ডাল') || lower.includes('বাজার')) {
      category = isPersonal ? 'bazaar' : 'দৈনন্দিন বাজার';
      if (!subCategory) subCategory = 'কাঁচা শাকসবজি';
    } else if (lower.includes('চা') || lower.includes('নাস্তা') || lower.includes('মিষ্টি') || lower.includes('খাবার') || lower.includes('রেস্টুরেন্ট')) {
      category = isPersonal ? 'snacks' : 'আপ্যায়ন ও নাস্তা';
      if (!subCategory) subCategory = 'বিকালের চা-নাস্তা';
    } else if (lower.includes('বিদ্যুৎ') || lower.includes('কারেন্ট') || lower.includes('গ্যাস') || lower.includes('পানি') || lower.includes('বিল')) {
      category = isPersonal ? 'utility' : 'ইউটিলিটি বিল';
      if (!subCategory) subCategory = 'বিদ্যুৎ বিল';
    } else {
      category = isPersonal ? 'daily' : 'সাধারণ খরচ';
    }
  }

  // 8. Title Cleanup
  // Clean off matched keywords, amount, tags to find the specific item title
  let cleanTitle = normalizedText
    .replace(/(?:ব্যক্তিগত\s*খরচ|দোকান\s*খরচ|\/addexpense|খরচ|expense)/gi, '')
    .replace(/(?:৳|\$)?\s*(\d+(?:\.\d+)?)\s*(?:টাকা|টাকার|tk|\/-)?/gi, '')
    .replace(/(?:ক্যাটাগরি|ক্যাটেগরি|খাত|category)\s*[:=]?\s*([^\s,;।]+)/gi, '')
    .replace(/(?:সাবক্যাটাগরি|সাব-ক্যাটাগরি|উপখাত|উপ-খাত|subcategory)\s*[:=]?\s*([^\s,;।]+)/gi, '')
    .replace(/(?:ব্যক্তি|সদস্য|নাম|person|member)\s*[:=]?\s*([^\s,;।]+)/gi, '')
    .replace(/(?:নোট|মন্তব্য|note)\s*[:=]?\s*([^।\n]+)/gi, '')
    .replace(/[,\-–—;:।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = subCategory || note || (isPersonal ? 'ব্যক্তিগত খরচ' : 'দোকানের খরচ');
  }

  return {
    amount,
    title: cleanTitle,
    category,
    subCategory,
    familyMember,
    note,
    isPersonal
  };
};

// Smart Quick Sale Parser
export const parseSmartSaleMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
  const lower = normalized.toLowerCase().trim();

  const isSale = lower.startsWith('সেল') || lower.startsWith('বিক্রি') || lower.startsWith('sale') || lower.startsWith('/sale');
  if (!isSale) return null;

  const body = normalized.replace(/^(?:সেল|বিক্রি|sale|\/sale)\s*/i, '').trim();
  if (!body) return null;

  const parts = body.split(/\s+/);
  const nums = [];
  const words = [];
  for (const p of parts) {
    const clean = p.replace(/[^\d.]/g, '');
    if (clean && !isNaN(clean)) {
      nums.push(Number(clean));
    } else {
      words.push(p);
    }
  }

  let qty = 1;
  let price = 0;
  if (nums.length >= 2) {
    qty = nums[0];
    price = nums[1];
  } else if (nums.length === 1) {
    price = nums[0];
  }

  return {
    productName: words.join(' ').trim() || 'পণ্য',
    qty: qty > 0 ? qty : 1,
    price: price || 0,
    rawText
  };
};

// Smart Invoice / Memo Parser
export const parseSmartInvoiceMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
  const lower = normalized.toLowerCase().trim();

  const isInvoice = lower.startsWith('মেমো') || lower.startsWith('ইনভয়েস') || lower.startsWith('invoice') || lower.startsWith('/invoice');
  if (!isInvoice) return null;

  const body = normalized.replace(/^(?:মেমো|ইনভয়েস|invoice|\/invoice)\s*/i, '').trim();
  if (!body) return null;

  const parts = body.split(/\s+/);
  const words = [];
  const nums = [];
  for (const p of parts) {
    const clean = p.replace(/[^\d.]/g, '');
    if (clean && !isNaN(clean)) {
      nums.push(Number(clean));
    } else {
      words.push(p);
    }
  }

  let customerName = 'সম্মানিত খদ্দের';
  let productName = 'পণ্য';
  if (words.length >= 2) {
    customerName = words[0];
    productName = words.slice(1).join(' ');
  } else if (words.length === 1) {
    productName = words[0];
  }

  let qty = 1;
  let price = 0;
  if (nums.length >= 2) {
    qty = nums[0];
    price = nums[1];
  } else if (nums.length === 1) {
    price = nums[0];
  }

  return {
    customerName,
    productName,
    qty: qty > 0 ? qty : 1,
    price: price || 0,
    rawText
  };
};

// Smart Customer Parser
export const parseSmartCustomerMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
  const lower = normalized.toLowerCase().trim();

  const isCustomer = lower.startsWith('কাস্টমার') || lower.startsWith('customer') || lower.startsWith('/customer') || lower.startsWith('খদ্দের');
  if (!isCustomer) return null;

  const body = normalized.replace(/^(?:কাস্টমার|customer|\/customer|খদ্দের)\s*/i, '').trim();
  if (!body) return null;

  const parts = body.split(/\s+/);
  let name = '';
  let phone = '';
  let due = 0;

  for (const p of parts) {
    if (/^01\d{9}$/.test(p) || /^\+8801\d{9}$/.test(p)) {
      phone = p;
    } else if (!isNaN(p) && Number(p) > 0) {
      if (p.length === 11 && p.startsWith('01')) phone = p;
      else due = Number(p);
    } else {
      name += (name ? ' ' : '') + p;
    }
  }

  return {
    name: name || 'নতুন কাস্টমার',
    phone: phone || '',
    due
  };
};

// Smart Product Parser
export const parseSmartProductMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
  const lower = normalized.toLowerCase().trim();

  const isProduct = lower.startsWith('পণ্য') || lower.startsWith('product') || lower.startsWith('/product') || lower.startsWith('মাল');
  if (!isProduct) return null;

  const body = normalized.replace(/^(?:পণ্য|product|\/product|মাল)\s*/i, '').trim();
  if (!body) return null;

  const parts = body.split(/\s+/);
  const words = [];
  const nums = [];
  for (const p of parts) {
    const clean = p.replace(/[^\d.]/g, '');
    if (clean && !isNaN(clean)) {
      nums.push(Number(clean));
    } else {
      words.push(p);
    }
  }

  const name = words.join(' ').trim() || 'নতুন পণ্য';
  let buyPrice = 0;
  let sellPrice = 0;
  let stock = 0;

  if (nums.length >= 3) {
    buyPrice = nums[0];
    sellPrice = nums[1];
    stock = nums[2];
  } else if (nums.length === 2) {
    sellPrice = nums[0];
    stock = nums[1];
    buyPrice = Math.round(sellPrice * 0.8);
  } else if (nums.length === 1) {
    sellPrice = nums[0];
    stock = 10;
  }

  return {
    name,
    buyPrice,
    sellPrice,
    stock
  };
};

// Smart Due / Payment Parser
export const parseSmartDueMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
  const lower = normalized.toLowerCase().trim();

  const isDue = lower.startsWith('বাকি') || lower.startsWith('due') || lower.startsWith('/due_add');
  const isPayment = lower.startsWith('জমা') || lower.startsWith('payment') || lower.startsWith('আদায়') || lower.startsWith('আদায়ক');
  if (!isDue && !isPayment) return null;

  const body = normalized.replace(/^(?:বাকি|due|\/due_add|জমা|payment|আদায়|আদায়ক)\s*/i, '').trim();
  if (!body) return null;

  const parts = body.split(/\s+/);
  let name = '';
  let amount = 0;

  for (const p of parts) {
    const clean = p.replace(/[^\d.]/g, '');
    if (clean && !isNaN(clean)) {
      amount = Number(clean);
    } else {
      name += (name ? ' ' : '') + p;
    }
  }

  return {
    type: isPayment ? 'payment' : 'due',
    customerName: name || 'কাস্টমার',
    amount: amount || 0
  };
};

// Smart Income Parser
export const parseSmartIncomeMessage = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = rawText.replace(/[০-৯]/g, d => bnToEnMap[d] || d);
  const lower = normalized.toLowerCase().trim();

  const isIncome = lower.startsWith('আয়') || lower.startsWith('আয়') || lower.startsWith('income') || lower.startsWith('/income');
  if (!isIncome) return null;

  const body = normalized.replace(/^(?:আয়|আয়|income|\/income)\s*/i, '').trim();
  if (!body) return null;

  const parts = body.split(/\s+/);
  let source = 'অন্যান্য আয়';
  let amount = 0;

  for (const p of parts) {
    const clean = p.replace(/[^\d.]/g, '');
    if (clean && !isNaN(clean)) {
      amount = Number(clean);
    } else {
      source = p;
    }
  }

  return {
    amount,
    source
  };
};

export const pollTelegramBotCommands = async ({
  botToken,
  chatId,
  products = [],
  customers = [],
  shopName = '',
  onBackupRequested,
  onSummaryRequested,
  onStockRequested,
  onProfitRequested,
  onDueRequested,
  onExpenseListRequested,
  onAddExpenseRequested,
  onAddSaleRequested,
  onAddInvoiceRequested,
  onAddCustomerRequested,
  onAddProductRequested,
  onAddDueRequested,
  onAddIncomeRequested,
  onLockRequested,
  onCashRequested,
  onTerminalsRequested,
  onItemHistoryRequested,
  onPdfReportRequested,
  onSavePdfMonthlyRecordsRequested
}) => {
  const token = (botToken || '').trim().replace(/^bot/i, '');
  const cleanChatId = (chatId || '').trim();
  if (!token) return;

  // Auto register commands once per session
  if (!pollTelegramBotCommands.commandsRegistered) {
    registerTelegramCommands(token);
    pollTelegramBotCommands.commandsRegistered = true;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastTelegramUpdateId ? lastTelegramUpdateId + 1 : 0}&timeout=0`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 409) {
        // Active webhook conflict! Automatically clear webhook so polling works
        await deleteTelegramWebhook(token);
      }
      return;
    }
    const data = await res.json();
    if (!data.ok || !data.result || data.result.length === 0) return;

    for (const update of data.result) {
      if (update.update_id) {
        lastTelegramUpdateId = Math.max(lastTelegramUpdateId, update.update_id);
      }

      let msg = update.message || update.channel_post || update.edited_message;
      let rawText = '';
      let targetChatId = '';
      let senderId = '';

      // Handle Telegram Inline Keyboard Taps (callback_query)
      if (update.callback_query) {
        const cb = update.callback_query;
        rawText = (cb.data || '').trim();
        targetChatId = String(cb.message?.chat?.id || cb.from?.id || '');
        senderId = String(cb.from?.id || '');

        // Immediately acknowledge Telegram callback to stop loading spinner on mobile
        try {
          await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: cb.id })
          });
        } catch {}
      } else if (msg) {
        rawText = (msg.text || msg.caption || '').trim();
        targetChatId = String(msg.chat.id);
        senderId = String(msg.from?.id || '');

        const voiceObj = msg.voice || msg.audio;
        if (!rawText && voiceObj && voiceObj.file_id) {
          const isAuth = cleanChatId && (
            targetChatId === cleanChatId ||
            senderId === cleanChatId ||
            cleanChatId.includes(targetChatId)
          );
          if (!isAuth) {
            const unauthHtml = `🔒 <b>অননুমোদিত চ্যাট আইডি (Unauthorized)</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনার চ্যাট আইডি: <code>${targetChatId}</code>\nহিসাবের নিরাপত্তা রক্ষায় শুধুমাত্র অনুমোদিত চ্যাট থেকে ভয়েস কমান্ড গ্রহণ করা হয়।`;
            await sendTelegramMessage(unauthHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
            continue;
          }

          const currentCfg = getTelegramBackupConfig();
          const geminiKey = (currentCfg.geminiApiKey || '').trim() ||
            (typeof window !== 'undefined' ? (localStorage.getItem('hk360_gemini_api_key') || (import.meta?.env?.VITE_GEMINI_API_KEY || '')) : '');
          const groqKey = (currentCfg.groqApiKey || '').trim() ||
            (typeof window !== 'undefined' ? (localStorage.getItem('hk360_groq_api_key') || '') : '');

          if (!geminiKey && !groqKey) {
            const noKeyHtml = `🎤 <b>আপনার ভয়েস অডিও মেসেজ পাওয়া গেছে!</b>
━━━━━━━━━━━━━━━━━━━━━
ভয়েস-টু-টেক্সট এআই চালু করতে একটি ফ্রি <b>Google Gemini API Key</b> প্রয়োজন।

💡 <b>১ মিনিটে ফ্রি API Key পাওয়ার সহজ উপায়:</b>
১. <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a> লিংকে যান।
২. আপনার গুগল একাউন্ট দিয়ে লগইন করে <b>"Create API key"</b> চাপুন।
৩. পাওয়া কি-টি কপি করে এই চ্যাটে লিখে পাঠান:
<code>/setkey আপনার_কি</code>
<i>(অথবা সফটওয়্যারের টেলিগ্রাম বট সেটিংসে কি-টি সেভ করুন)</i>

✨ একবার কি দিলে পরবর্তীতে যেকোনো ভয়েস মেসেজ পাঠালেই তা স্বয়ংক্রিয়ভাবে টেক্সটে রূপান্তর হয়ে হিসাব সম্পন্ন হবে!`;
            await sendTelegramMessage(noKeyHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
            continue;
          }

          try {
            await sendTelegramMessage(`🎤 <i>ভয়েস অডিও প্রসেস করা হচ্ছে...</i>`, { botToken: token, chatId: targetChatId }, null, 'HTML');
            const vRes = await processTelegramVoiceMessage({
              botToken: token,
              fileId: voiceObj.file_id,
              mimeType: voiceObj.mime_type || 'audio/ogg',
              geminiApiKey: geminiKey,
              groqApiKey: groqKey
            });

            if (vRes?.text) {
              rawText = vRes.text.trim();
              await sendTelegramMessage(`🎤 <i>আপনার ভয়েস:</i> "<b>${rawText}</b>"`, { botToken: token, chatId: targetChatId }, null, 'HTML');
            } else {
              await sendTelegramMessage(`⚠️ <i>ভয়েস অডিও থেকে কোনো কথা স্পষ্টভাবে শনাক্ত করা যায়নি। অনুগ্রহ করে পুনরায় স্পষ্ট করে বলুন।</i>`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
              continue;
            }
          } catch (sttErr) {
            console.warn('Voice STT error:', sttErr);
            await sendTelegramMessage(`❌ <b>ভয়েস রূপান্তর ব্যর্থ হয়েছে:</b> ${sttErr.message}\n💡 আপনার API Key ঠিক আছে কিনা যাচাই করতে <code>/setkey &lt;KEY&gt;</code> লিখে পুনরায় সেট করুন।`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
            continue;
          }
        }
      }

      if (!rawText || !targetChatId) continue;
      const lower = rawText.toLowerCase();

      // Check authorization
      const isAuthorized = cleanChatId && (
        targetChatId === cleanChatId ||
        senderId === cleanChatId ||
        cleanChatId.includes(targetChatId)
      );

      // Handle Gemini / AI Key setup command (/setkey <API_KEY> or directly pasting AIzaSy...)
      const isDirectGeminiKey = rawText.startsWith('AIzaSy') && rawText.length >= 35 && !rawText.includes(' ');
      if (rawText.startsWith('/setkey') || rawText.startsWith('setkey') || isDirectGeminiKey) {
        const newKey = isDirectGeminiKey ? rawText : rawText.replace(/^\/?setkey\s*/i, '').trim();
        if (newKey) {
          const currentCfg = getTelegramBackupConfig();
          const updated = { ...currentCfg, geminiApiKey: newKey };
          saveTelegramBackupConfig(updated);
          if (typeof window !== 'undefined') {
            localStorage.setItem('hk360_gemini_api_key', newKey);
          }
          const successHtml = `🎉 <b>Google Gemini AI Key সফলভাবে যুক্ত হয়েছে!</b>
━━━━━━━━━━━━━━━━━━━━━
🔑 <b>Key:</b> <code>${newKey.slice(0, 8)}...${newKey.slice(-4)}</code>
🤖 <b>ভয়েস-টু-টেক্সট ইঞ্জিন:</b> Google Gemini Multimodal Audio (Active)

✨ এখন থেকে আপনি টেলিগ্রামে যেকোনো ভয়েস মেসেজ পাঠালেই তা সাথে সাথে টেক্সটে রূপান্তর হয়ে সফটওয়্যারে হিসাব জমা হবে!
💡 <b>পরীক্ষা করতে এখনই একটি ভয়েস অডিও পাঠান:</b>
• <i>"সেল নাপা ১০ ৫০"</i>
• <i>"খরচ ৫০০ নাস্তা"</i>
• <i>"আজকের মোট বিক্রি কত"</i>`;
          await sendTelegramMessage(successHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
          continue;
        } else {
          await sendTelegramMessage(`💡 <b>Gemini API Key সেট করার নিয়ম:</b>\n<code>/setkey AIzaSy...</code>\n\nফ্রি কি পেতে: <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a>`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
          continue;
        }
      }

      // ========================================================
      // FOLDER NAVIGATION DISPATCHER (ইনলাইন ফোল্ডার নেভিগেশন)
      // ========================================================
      if (rawText === 'folder_add') {
        const text = `📁 <b>➕ নতুন এন্ট্রি ফোল্ডার:</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনি কোন খাতে নতুন ডাটা বা এন্ট্রি যোগ করতে চান? নির্বাচন করুন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD, 'HTML');
        continue;
      }

      if (rawText === 'folder_add_biz') {
        const text = `🏢 <b>ব্যবসার এন্ট্রি হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের যেকোনো অপশনে চাপ দিন অথবা সরাসরি লিখে পাঠান:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'folder_add_pers') {
        const text = `🏠 <b>ব্যক্তিগত এন্ট্রি হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nদৈনিক বাজার, সংসার বা ব্যক্তিগত আয়-খরচের অপশন নির্বাচন করুন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_PERS, 'HTML');
        continue;
      }

      if (rawText === 'folder_reports') {
        const text = `📊 <b>লাইভ রিপোর্ট হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের রিয়েল-টাইম যেকোনো হিসাব দেখতে চাপুন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_REPORTS, 'HTML');
        continue;
      }

      if (rawText === 'folder_control') {
        const text = `⚙️ <b>রিমোট কন্ট্রোল ও সিকিউরিটি হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকান বা টার্মিনালের রিমোট একশন পরিচালনা করুন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_CONTROL, 'HTML');
        continue;
      }

      if (rawText === 'folder_pdf') {
        const text = `📄 <b>অন-ডিমান্ড পিডিএফ ও প্রিন্ট রিপোর্ট হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nযে রিপোর্টের প্রিন্ট/PDF কপি তৈরি করতে চান তাতে চাপ দিন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_PDF, 'HTML');
        continue;
      }

      if (rawText.startsWith('cmd_pdf_')) {
        const rType = rawText.replace('cmd_pdf_', '');
        if (onPdfReportRequested) {
          await onPdfReportRequested(rType, targetChatId);
        } else {
          await sendTelegramMessage(`📄 <b>পিডিএফ রিপোর্ট প্রস্তুত করা হচ্ছে...</b>`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_PDF, 'HTML');
        }
        continue;
      }

      if (rawText === 'prompt_history') {
        const text = `🔍 <b>স্মার্ট পণ্য ক্রয় ইতিহাস (AI Intelligence):</b>\n━━━━━━━━━━━━━━━━━━━━━\nঅতীতের যেকোনো কেনাকাটার বিবরণ জানতে সরাসরি বাংলায় প্রশ্ন করুন:\n\n💡 <i>উদাহরণ:</i>\n• <code>বাদাম কতবার কিনেছি, কোন দিন কত গ্রাম ও কত টাকা করে কিনেছি</code>\n• <code>চিনি কতবার কিনেছি</code>\n• <code>ডিম কেনার হিস্ট্রি</code>\n• <code>চাল কেনার হিসাব</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_REPORTS, 'HTML');
        continue;
      }

      // Interactive POS Category Picker
      if (rawText === 'pos_sale_start') {
        const text = `🛒 <b>ক্যাটাগরি ভিত্তিক বিক্রয় (Interactive POS):</b>\n━━━━━━━━━━━━━━━━━━━━━\nযে ক্যাটাগরির পণ্য বিক্রি করতে চান তা নির্বাচন করুন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_SALE_CATS, 'HTML');
        continue;
      }

      // Interactive POS Product Picker by Category
      if (rawText.startsWith('pos_cat_')) {
        const catCode = rawText.replace('pos_cat_', '');
        let filtered = products || [];
        if (catCode === 'food') {
          filtered = filtered.filter(p => /চাল|ডাল|খাদ্য|চিনি|আটা|ময়দা|food|rice|sugar/i.test((p.category || '') + ' ' + (p.name || '')));
        } else if (catCode === 'beverage') {
          filtered = filtered.filter(p => /পানীয়|চা|কফি|জুস|কোল্ড|স্ন্যাক্স|বিস্কুট|beverage|tea|juice/i.test((p.category || '') + ' ' + (p.name || '')));
        } else if (catCode === 'toiletries') {
          filtered = filtered.filter(p => /তেল|সাবান|শ্যাম্পু|প্রসাধন|toiletries|soap|oil/i.test((p.category || '') + ' ' + (p.name || '')));
        } else if (catCode === 'medicine') {
          filtered = filtered.filter(p => /ওষুধ|ফার্মা|ট্যাবলেট|ক্যাপসুল|medicine|pharma|napa/i.test((p.category || '') + ' ' + (p.name || '')));
        } else if (catCode === 'general') {
          filtered = filtered.filter(p => !/চাল|ডাল|খাদ্য|চা|কফি|তেল|সাবান|ওষুধ/i.test((p.category || '') + ' ' + (p.name || '')));
        }
        if (filtered.length === 0) filtered = (products || []).slice(0, 8);

        if (filtered.length === 0) {
          const emptyText = `⚠️ <b>স্টকে কোনো পণ্য পাওয়া যায়নি!</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানে নতুন পণ্য যুক্ত করতে নিচের বাটনে চাপ দিন:`;
          await sendTelegramMessage(emptyText, { botToken: token, chatId: targetChatId }, {
            inline_keyboard: [
              [{ text: '➕ নতুন পণ্য যোগ করুন', callback_data: 'prompt_product' }],
              [{ text: '🏠 মূল মেনু', callback_data: 'cmd_main' }]
            ]
          }, 'HTML');
          continue;
        }

        const rows = [];
        filtered.slice(0, 8).forEach(p => {
          const price = p.price || p.sellingPrice || 0;
          const stock = p.stock !== undefined ? p.stock : (p.quantity || 0);
          rows.push([{
            text: `📦 ${p.name.slice(0, 15)} - ৳${price} (${stock}টি)`,
            callback_data: `pos_p_${p.id}`
          }]);
        });
        rows.push([
          { text: '🔙 অন্য ক্যাটাগরি', callback_data: 'pos_sale_start' },
          { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
        ]);

        await sendTelegramMessage(`🛒 <b>পণ্য নির্বাচন করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\nকোন পণ্যটি বিক্রি করতে চান? বাটনে চাপ দিন:`, { botToken: token, chatId: targetChatId }, { inline_keyboard: rows }, 'HTML');
        continue;
      }

      // Interactive POS Quantity Picker
      if (rawText.startsWith('pos_p_')) {
        const prodId = rawText.replace('pos_p_', '');
        const p = (products || []).find(it => String(it.id) === String(prodId)) || { name: 'নির্বাচিত পণ্য', id: prodId, price: 100 };
        const price = p.price || p.sellingPrice || 0;
        const stock = p.stock !== undefined ? p.stock : (p.quantity || 0);

        const qtyKeyboard = {
          inline_keyboard: [
            [
              { text: '1 টি', callback_data: `pos_q_${prodId}_1` },
              { text: '2 টি', callback_data: `pos_q_${prodId}_2` },
              { text: '3 টি', callback_data: `pos_q_${prodId}_3` }
            ],
            [
              { text: '5 টি', callback_data: `pos_q_${prodId}_5` },
              { text: '10 টি', callback_data: `pos_q_${prodId}_10` },
              { text: '20 টি', callback_data: `pos_q_${prodId}_20` }
            ],
            [
              { text: '🔙 পণ্য বদলান', callback_data: 'pos_sale_start' },
              { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
            ]
          ]
        };

        const qtyText = `🔢 <b>পরিমাণ (Quantity) নির্বাচন করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\n📦 <b>পণ্য:</b> ${p.name}\n💵 <b>মূল্য:</b> ৳${price} | 📊 <b>স্টক:</b> ${stock} টি\n\nকতটি বিক্রি করতে চান? চাপ দিন:`;
        await sendTelegramMessage(qtyText, { botToken: token, chatId: targetChatId }, qtyKeyboard, 'HTML');
        continue;
      }

      // Interactive POS Customer Picker
      if (rawText.startsWith('pos_q_')) {
        const parts = rawText.split('_'); // pos, q, prodId, qty
        const prodId = parts[2];
        const qty = Number(parts[3]) || 1;
        const p = (products || []).find(it => String(it.id) === String(prodId)) || { name: 'নির্বাচিত পণ্য', id: prodId, price: 100 };
        const unitPrice = p.price || p.sellingPrice || 100;
        const total = unitPrice * qty;

        const custRows = [
          [{ text: '🚶 নগদ খদ্দের (ক্যাশ পে)', callback_data: `pos_c_${prodId}_${qty}_cash` }]
        ];

        (customers || []).slice(0, 4).forEach((c, idx) => {
          custRows.push([{
            text: `👤 ${c.name.slice(0, 14)} ${c.due ? `(বাকি ৳${c.due})` : ''}`,
            callback_data: `pos_c_${prodId}_${qty}_${c.id || idx}`
          }]);
        });

        custRows.push([
          { text: '🔙 পরিমাণ পরিবর্তন', callback_data: `pos_p_${prodId}` },
          { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
        ]);

        const custText = `👥 <b>কাস্টমার নির্বাচন করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\n📦 <b>পণ্য:</b> ${p.name} (${qty} টি)\n💰 <b>মোট বিল:</b> ৳${total.toLocaleString()}\n\nকোন কাস্টমারের কাছে বিক্রি হচ্ছে?`;
        await sendTelegramMessage(custText, { botToken: token, chatId: targetChatId }, { inline_keyboard: custRows }, 'HTML');
        continue;
      }

      // Interactive POS Sale Execution
      if (rawText.startsWith('pos_c_')) {
        const parts = rawText.split('_'); // pos, c, prodId, qty, custKey
        const prodId = parts[2];
        const qty = Number(parts[3]) || 1;
        const custKey = parts[4];

        const p = (products || []).find(it => String(it.id) === String(prodId)) || { name: 'পণ্য', id: prodId, price: 100 };
        const unitPrice = p.price || p.sellingPrice || 100;
        const totalPrice = unitPrice * qty;

        let custName = 'নগদ খদ্দের (ক্যাশ)';
        let customerObj = null;
        if (custKey && custKey !== 'cash') {
          customerObj = (customers || []).find(c => String(c.id) === String(custKey)) || (customers || [])[Number(custKey)];
          if (customerObj) custName = customerObj.name;
        }

        if (onAddSaleRequested) {
          await onAddSaleRequested({
            productName: p.name,
            productId: p.id,
            qty,
            price: totalPrice,
            customerName: custName,
            customerObj
          }, targetChatId);
        } else {
          await sendTelegramMessage(`✅ <b>বিক্রয় সম্পন্ন হয়েছে!</b>\n📦 ${p.name} (${qty} টি)\n💰 ৳${totalPrice}`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
        }
        continue;
      }

      // Save PDF / Statement Monthly Records
      if (rawText === 'pdf_save_prev') {
        const cached = _cachedStatements.get(targetChatId);
        if (cached && onSavePdfMonthlyRecordsRequested) {
          await onSavePdfMonthlyRecordsRequested('prev', cached.prevMonthItems, targetChatId);
        } else {
          await sendTelegramMessage(`ℹ️ পূর্ববর্তী মাসের কোনো সংরক্ষিত স্টেটমেন্ট ডাটা পাওয়া যায়নি।`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
        }
        continue;
      }

      if (rawText === 'pdf_save_curr') {
        const cached = _cachedStatements.get(targetChatId);
        if (cached && onSavePdfMonthlyRecordsRequested) {
          await onSavePdfMonthlyRecordsRequested('curr', cached.currMonthItems, targetChatId);
        } else {
          await sendTelegramMessage(`ℹ️ চলতি মাসের কোনো সংরক্ষিত স্টেটমেন্ট ডাটা পাওয়া যায়নি।`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
        }
        continue;
      }

      if (rawText === 'cmd_main' || rawText === '/main') {
        const text = `🏠 <b>হিসাবকিতাব ৩৬০ - মূল ড্যাশবোর্ড মেনু</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের হিসাব ও রিমোট কন্ট্রোল পরিচালনা করুন:`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
        continue;
      }

      // ========================================================
      // PROMPT INSTRUCTION GUIDES (কীভাবে লিখে পাঠাবেন)
      // ========================================================
      if (rawText === 'prompt_sale') {
        const text = `⚡ <b>নতুন সেল / বিক্রয় এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে চ্যাটে লিখে পাঠান:\n<code>সেল &lt;পণ্যের নাম&gt; &lt;পরিমাণ&gt; &lt;মোট টাকা&gt;</code>\n\n💡 <i>উদাহরণ:</i>\n<code>সেল নাপা ১০ ৫০</code>\n<code>বিক্রি চিনি ৫ কেজি ৫০০</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'prompt_invoice') {
        const text = `🧾 <b>মেমো / ইনভয়েস তৈরি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে চ্যাটে লিখে পাঠান:\n<code>মেমো &lt;কাস্টমার&gt; &lt;পণ্য&gt; &lt;পরিমাণ&gt; &lt;দাম&gt;</code>\n\n💡 <i>উদাহরণ:</i>\n<code>মেমো রফিক চাল ১ বস্তা ৩২০০</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'prompt_customer') {
        const text = `👥 <b>নতুন কাস্টমার যোগ করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে চ্যাটে লিখে পাঠান:\n<code>কাস্টমার &lt;নাম&gt; &lt;ফোন নম্বর&gt; &lt;পূর্বের বকেয়া&gt;</code>\n\n💡 <i>উদাহরণ:</i>\n<code>কাস্টমার রহিম ০১৭০০১১২২৩৩ ৫০০</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'prompt_product') {
        const text = `📦 <b>নতুন পণ্য স্টকে যোগ করুন:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে চ্যাটে লিখে পাঠান:\n<code>পণ্য &lt;নাম&gt; &lt;কেনা দাম&gt; &lt;বেচা দাম&gt; &lt;স্টক সংখ্যা&gt;</code>\n\n💡 <i>উদাহরণ:</i>\n<code>পণ্য চিনি ১০০ ১২০ ৫০</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'prompt_expense_biz') {
        const text = `💸 <b>দোকানের খরচ এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে লিখে পাঠান:\n<code>খরচ ৫০০ বিকালের নাস্তা</code>\n<code>দোকান খরচ ২০০০ বিদ্যুৎ বিল</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'prompt_due') {
        const text = `📒 <b>কাস্টমার বাকি / জমা এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nবাকি দিতে লিখুন: <code>বাকি করিম ৫০০</code>\nটাকা আদায়/জমা হলে লিখুন: <code>জমা করিম ৫০০</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_BIZ, 'HTML');
        continue;
      }

      if (rawText === 'prompt_expense_bazaar') {
        const text = `🛒 <b>দৈনিক বাজার খরচ এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে লিখে পাঠান:\n<code>বাজার ৪০০ ইলিশ মাছ</code> বা <code>ব্যক্তিগত খরচ ১৫০ শাকসবজি</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_PERS, 'HTML');
        continue;
      }

      if (rawText === 'prompt_expense_family') {
        const text = `🏠 <b>পারিবারিক খরচ এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে লিখে পাঠান:\n<code>পারিবারিক ৫০০০ বাসা ভাড়া</code> বা <code>পারিবারিক ৮০০ গ্যাস বিল</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_PERS, 'HTML');
        continue;
      }

      if (rawText === 'prompt_income') {
        const text = `💵 <b>ব্যক্তিগত আয় জমা:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনিচের ফরম্যাটে লিখে পাঠান:\n<code>আয় ৫০০০০ মাসিক বেতন</code> বা <code>আয় ৫০০০ ব্যবসা লভ্যাংশ</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_PERS, 'HTML');
        continue;
      }

      if (rawText === 'prompt_debt_pers') {
        const text = `📒 <b>ব্যক্তিগত ধার / দেনা এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nকাউকে ধার দিলে: <code>ধার রনি ২০০০</code>\nকারো থেকে ধার নিলে: <code>দেনা শফিক ৫০০০</code>`;
        await sendTelegramMessage(text, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_ADD_PERS, 'HTML');
        continue;
      }

      // Remote Screen Lock Command
      if (rawText === 'cmd_lock' || lower === '/lock' || lower === 'লক' || lower === 'লক করুন') {
        if (onLockRequested) {
          await onLockRequested(targetChatId);
        } else {
          await sendTelegramMessage(`🔒 <b>কাউন্টার স্ক্রিন লক কমান্ড সক্রিয় করা হয়েছে!</b>`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_CONTROL, 'HTML');
        }
        continue;
      }

      // Today's Cash Drawer
      if (rawText === 'cmd_cash' || lower === '/cash' || lower === 'ক্যাশ' || lower.includes('ড্রয়ার')) {
        if (onCashRequested) {
          await onCashRequested(targetChatId);
          continue;
        }
      }

      // Terminals Status
      if (rawText === 'cmd_terminals' || lower === '/terminals' || lower.includes('টার্মিনাল')) {
        if (onTerminalsRequested) {
          await onTerminalsRequested(targetChatId);
          continue;
        }
      }

      // Live App Links
      if (rawText === 'cmd_links' || lower === '/links' || lower.includes('লিঙ্ক')) {
        const linksHtml = `🌐 <b>হিসাবকিতাব ৩৬০ লাইভ টার্মিনাল লিংক:</b>
━━━━━━━━━━━━━━━━━━━━━
💻 <b>পিসি প্রিভিউ:</b> <a href="http://localhost:5173">http://localhost:5173</a>
📱 <b>মোবাইল ওয়াইফাই:</b> <code>http://192.168.1.5:5173</code>
🌐 <b>প্রোডাকশন ওয়েবসাইট:</b> <a href="https://hisabkitab-360.vercel.app">https://hisabkitab-360.vercel.app</a>
━━━━━━━━━━━━━━━━━━━━━
⚡ <i>সকল ডিভাইসে ডাটা রিয়েলটাইমে সিঙ্ক থাকে!</i>`;
        await sendTelegramMessage(linksHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_CONTROL, 'HTML');
        continue;
      }

      // 8. HELP / START COMMAND
      const isHelpCommand = (
        lower === 'cmd_help' ||
        lower === '/start' ||
        lower.startsWith('/start') ||
        lower === '/help' ||
        lower.startsWith('/help') ||
        lower === 'help' ||
        lower === 'সাহায্য' ||
        lower === 'হেল্প' ||
        lower === 'menu' ||
        lower.startsWith('/menu')
      );

      if (isHelpCommand) {
        const helpHtml = `🤖 <b>হিসাবকিতাব ৩৬০ - ফুল রিমোট কন্ট্রোল বট</b>
━━━━━━━━━━━━━━━━━━━━━
দোকান চালু থাকা অবস্থায় ফোন বা যেকোনো স্থান থেকেই পুরো অ্যাপ নিয়ন্ত্রণ করুন:

📁 <b>মেনু ফোল্ডার দিয়ে কাজ করতে নিচের বাটনে চাপ দিন:</b>
• <b>➕ নতুন এন্ট্রি</b> ➔ ব্যবসা ও ব্যক্তিগত সেল, ইনভয়েস, কাস্টমার, স্টক ও খরচ
• <b>📊 লাইভ রিপোর্ট</b> ➔ ক্যাশ ড্রয়ার, বিক্রি, লাভ-ক্ষতি ও বকেয়া খাতা
• <b>⚙️ রিমোট কন্ট্রোল</b> ➔ ড্রাইভ ব্যাকআপ, কাউন্টার স্ক্রিন লক ও টার্মিনাল

💬 <b>অথবা সরাসরি মেসেজ পাঠান:</b>
• <code>সেল নাপা ১০ ৫০</code> ➔ দ্রুত বিক্রয় ও স্টক আপডেট
• <code>মেমো রফিক চাল ১ বস্তা ৩২০০</code> ➔ মেমো তৈরি
• <code>কাস্টমার আকবর ০১৭xxxxxxxx ৫০০</code> ➔ কাস্টমার যোগ
• <code>পণ্য চিনি ১০০ ১২০ ৫০</code> ➔ নতুন পণ্য যোগ
• <code>খরচ ৫০০ নাস্তা</code> ➔ দোকানের খরচ যোগ
• <code>বাজার ৪০০ মাছ</code> ➔ পারিবারিক বাজার খরচ
• <code>লক</code> ➔ দোকানের স্ক্রিন অবিলম্বে লক করা
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>আপনার Chat ID:</b> <code>${targetChatId}</code>
${isAuthorized ? '✅ <i>চ্যাটটি হিসাবকিতাব ৩৬০-এর সাথে যুক্ত ও সক্রিয় আছে!</i>' : '⚠️ <i>অ্যাপের সেটিংসে এই চ্যাট আইডি সংরক্ষণ করুন।</i>'}`;

        await sendTelegramMessage(helpHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
        continue;
      }

      // If unauthorized for shop data operations, guide user to set chat ID
      if (!isAuthorized) {
        const unauthHtml = `🔒 <b>অননুমোদিত চ্যাট আইডি (Unauthorized)</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনার চ্যাট আইডি: <code>${targetChatId}</code>\nহিসাবের নিরাপত্তা রক্ষায় শুধুমাত্র অনুমোদিত চ্যাট থেকে কমান্ড গ্রহণ করা হয়।\n\n💡 এই আইডিটি আপনার হিসাবকিতাব ৩৬০ এর 'ক্লাউড ব্যাকআপ' সেটিংসে Chat ID হিসেবে সংরক্ষণ করুন। সাহায্য পেতে লিখুন: <b>/help</b>`;
        await sendTelegramMessage(unauthHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
        continue;
      }

      // ========================================================
      // SMART TEXT MESSAGE PARSERS
      // ========================================================

      // 1. SMART QUICK SALE PARSER
      const parsedSale = parseSmartSaleMessage(rawText);
      if (parsedSale && onAddSaleRequested) {
        await onAddSaleRequested(parsedSale, targetChatId);
        continue;
      }

      // 2. SMART INVOICE PARSER
      const parsedInvoice = parseSmartInvoiceMessage(rawText);
      if (parsedInvoice && onAddInvoiceRequested) {
        await onAddInvoiceRequested(parsedInvoice, targetChatId);
        continue;
      }

      // 3. SMART CUSTOMER PARSER
      const parsedCustomer = parseSmartCustomerMessage(rawText);
      if (parsedCustomer && onAddCustomerRequested) {
        await onAddCustomerRequested(parsedCustomer, targetChatId);
        continue;
      }

      // 4. SMART PRODUCT PARSER
      const parsedProduct = parseSmartProductMessage(rawText);
      if (parsedProduct && onAddProductRequested) {
        await onAddProductRequested(parsedProduct, targetChatId);
        continue;
      }

      // 5. SMART DUE / PAYMENT PARSER
      const parsedDue = parseSmartDueMessage(rawText);
      if (parsedDue && onAddDueRequested) {
        await onAddDueRequested(parsedDue, targetChatId);
        continue;
      }

      // 6. SMART INCOME PARSER
      const parsedIncome = parseSmartIncomeMessage(rawText);
      if (parsedIncome && onAddIncomeRequested) {
        await onAddIncomeRequested(parsedIncome, targetChatId);
        continue;
      }

      // 7. SMART EXPENSE PARSER (Personal or Business)
      const parsedExpense = parseSmartExpenseMessage(rawText);
      if (parsedExpense && onAddExpenseRequested) {
        await onAddExpenseRequested(parsedExpense, targetChatId);
        continue;
      }

      // 8. BACKUP COMMAND
      if (lower === 'cmd_backup' || lower.startsWith('/backup') || lower.includes('backup') || lower.includes('ব্যাকআপ')) {
        if (onBackupRequested) await onBackupRequested(targetChatId);
        continue;
      }

      // 9. SALES / TODAY SUMMARY
      if (lower === 'cmd_today' || lower.startsWith('/today') || lower.startsWith('/sales') || lower.startsWith('/summary') || lower.includes('হিসাব') || lower.includes('বিক্রি')) {
        if (onSummaryRequested) await onSummaryRequested(targetChatId);
        continue;
      }

      // 10. STOCK & INVENTORY COMMAND
      if (lower === 'cmd_stock' || lower === 'cmd_stock_low' || lower.startsWith('/stock') || lower.startsWith('/search') || lower.includes('স্টক')) {
        let query = '';
        if (lower.startsWith('/stock')) query = rawText.replace(/^\/stock\s*/i, '').trim();
        else if (lower.startsWith('/search')) query = rawText.replace(/^\/search\s*/i, '').trim();
        else if (lower.startsWith('স্টক')) query = rawText.replace(/^স্টক\s*/i, '').trim();
        else if (lower.includes('স্টক')) query = rawText.replace(/স্টক|রিপোর্ট/gi, '').trim();
        if (query === 'cmd_stock' || query === 'cmd_stock_low') query = '';
        
        if (onStockRequested) await onStockRequested(query, targetChatId);
        continue;
      }

      // 11. PROFIT & LOSS COMMAND
      if (lower === 'cmd_profit' || lower.startsWith('/profit') || lower.includes('লাভ') || lower.includes('profit')) {
        if (onProfitRequested) await onProfitRequested(targetChatId);
        continue;
      }

      // 12. DUE / BAKI COMMAND
      if (lower === 'cmd_due' || lower.startsWith('/due') || lower.includes('বাকি') || lower.includes('due') || lower.includes('বকেয়া') || lower.includes('বকেয়া')) {
        if (onDueRequested) await onDueRequested(targetChatId);
        continue;
      }

      // 13. EXPENSE LIST COMMAND
      if (lower === 'cmd_expense' || lower.startsWith('/expense') || lower.includes('খরচ') || lower.includes('expense')) {
        if (onExpenseListRequested) await onExpenseListRequested(targetChatId);
        continue;
      }

      // 14. SMART PDF STATEMENT INGESTION (Multi-line text / statement)
      const parsedStatement = parseSmartPdfStatement(rawText);
      if (parsedStatement) {
        _cachedStatements.set(targetChatId, parsedStatement);
        const stmtSummaryHtml = `📄 <b>স্টেটমেন্ট পর্যালোচনা সম্পন্ন!</b>
━━━━━━━━━━━━━━━━━━━━━
📅 <b>আগের মাসের ট্রানজ্যাকশন (${parsedStatement.prevMonthItems.length} টি):</b> ৳${parsedStatement.prevMonthTotal.toLocaleString()}
📅 <b>চলতি মাসের ট্রানজ্যাকশন (${parsedStatement.currMonthItems.length} টি):</b> ৳${parsedStatement.currMonthTotal.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
স্বয়ংক্রিয়ভাবে হিসাবের খাতায় সেভ করতে নিচের বাটনে চাপ দিন:`;

        const stmtKeyboard = {
          inline_keyboard: [
            [{ text: `📥 আগের মাসেরটা পারসোনালে সেভ করো (৳${parsedStatement.prevMonthTotal.toLocaleString()})`, callback_data: 'pdf_save_prev' }],
            [{ text: `📥 এই মাসেরটা বর্তমান হিসাবে সেভ করো (৳${parsedStatement.currMonthTotal.toLocaleString()})`, callback_data: 'pdf_save_curr' }],
            [{ text: '🏠 মূল মেনু', callback_data: 'cmd_main' }]
          ]
        };
        await sendTelegramMessage(stmtSummaryHtml, { botToken: token, chatId: targetChatId }, stmtKeyboard, 'HTML');
        continue;
      }

      // 15. SMART ITEM HISTORY & GRAM TRACKER ("বাদাম কতবার কিনেছি, কোন দিন কত গ্রাম...")
      const parsedItemHistory = parseSmartItemHistoryQuery(rawText);
      if (parsedItemHistory) {
        if (onItemHistoryRequested) {
          await onItemHistoryRequested(parsedItemHistory.item, targetChatId);
        } else {
          await sendTelegramMessage(`🔍 <b>"${parsedItemHistory.item}"-এর ক্রয়ের ইতিহাস খোঁজা হচ্ছে...</b>`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_REPORTS, 'HTML');
        }
        continue;
      }

      // 16. ON-DEMAND PDF REPORTS (Text Triggers)
      if (lower.startsWith('/pdf') || lower === 'pdf' || lower === 'পিডিএফ' || lower.includes('pdf রিপোর্ট') || lower.includes('পিডিএফ রিপোর্ট')) {
        if (onPdfReportRequested) {
          if (lower.includes('দোকান') || lower.includes('ব্যবসা')) {
            await onPdfReportRequested('business', targetChatId);
          } else if (lower.includes('পার্সোনাল') || lower.includes('ব্যক্তিগত')) {
            await onPdfReportRequested('personal', targetChatId);
          } else if (lower.includes('বাকি') || lower.includes('বকেয়া')) {
            await onPdfReportRequested('due', targetChatId);
          } else if (lower.includes('ক্যাশ')) {
            await onPdfReportRequested('cash', targetChatId);
          } else if (lower.includes('স্টক')) {
            await onPdfReportRequested('stock', targetChatId);
          } else if (lower.includes('লাভ')) {
            await onPdfReportRequested('profit', targetChatId);
          } else {
            await sendTelegramMessage(`📄 <b>অন-ডিমান্ড পিডিএফ রিপোর্ট হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nকোন রিপোর্টটি ডাউনলোড বা প্রিন্ট করতে চান?`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_PDF, 'HTML');
          }
        } else {
          await sendTelegramMessage(`📄 <b>অন-ডিমান্ড পিডিএফ রিপোর্ট হাব:</b>`, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_PDF, 'HTML');
        }
        continue;
      }

      // Fallback: If nothing recognized, show main menu
      const fallbackHtml = `❓ <b>কমান্ডটি স্পষ্ট নয়</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনি যা লিখেছেন: "<code>${rawText}</code>"\nনিচের বাটনগুলো চেপে আপনার প্রয়োজনীয় অপশন নির্বাচন করুন:`;
      await sendTelegramMessage(fallbackHtml, { botToken: token, chatId: targetChatId }, TELEGRAM_FOLDER_MAIN, 'HTML');
    }
  } catch (err) {
    console.debug('Telegram poll notice:', err);
  }
};

export const sendTelegramSalesSummary = async (summaryData, customConfig = null) => {
  const text = `📊 *হিসাবকিতাব ৩৬০ - আজকের বিক্রির হিসাব রিপোর্ট*
📅 *তারিখ:* \`${summaryData.dateStr || new Date().toLocaleDateString()}\`
🏪 *দোকান:* *${summaryData.shopName || 'আমার দোকান'}*
━━━━━━━━━━━━━━━━━━━━━
💰 *আজকের মোট বিক্রি:* ৳${Number(summaryData.todaySales || 0).toLocaleString()}
🧾 *আজকের ইনভয়েস:* ${summaryData.todayInvoices || 0} টি
👥 *মোট গ্রাহক সংখ্যা:* ${summaryData.totalCustomers || 0} জন
📦 *মোট পণ্য সংখ্যা:* ${summaryData.totalProducts || 0} টি
━━━━━━━━━━━━━━━━━━━━━
📈 _লাভ-ক্ষতি দেখতে লিখুন:_ */profit*
📥 _সম্পূর্ণ ডাটাবেজ ব্যাকআপ পেতে লিখুন:_ */backup*`;

  await sendTelegramMessage(text, customConfig);
};

export const sendTelegramStockReport = async ({ products, query, shopName }, customConfig = null) => {
  let text = '';
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    const matched = (products || []).filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.category || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q)
    ).slice(0, 8);

    if (matched.length === 0) {
      text = `🔍 *পণ্য অনুসন্ধান ফলাফল*
━━━━━━━━━━━━━━━━━━━━━
❌ *"${query}"* নামে কোনো পণ্য পাওয়া যায়নি।

💡 সব পণ্যের সাধারণ সামারি দেখতে লিখুন: */stock*`;
    } else {
      text = `🔍 *পণ্য স্টক ও দাম:* (${matched.length} টি পাওয়া গেছে)
━━━━━━━━━━━━━━━━━━━━━\n` +
        matched.map(p => {
          const qty = Number(p.stock !== undefined ? p.stock : p.quantity || 0);
          const icon = qty <= 0 ? '🔴' : qty <= 5 ? '⚠️' : '🟢';
          return `${icon} *${p.name}*\n   📦 স্টক: *${qty}* ${p.unit || 'টি'} | 💵 বিক্রয়মূল্য: ৳${p.price || p.sellingPrice || 0}`;
        }).join('\n\n') +
        `\n━━━━━━━━━━━━━━━━━━━━━\n⚡ _হিসাবকিতাব ৩৬০ ইনভেন্টরি_`;
    }
  } else {
    const totalItems = (products || []).length;
    const totalQty = (products || []).reduce((sum, p) => sum + (Number(p.stock !== undefined ? p.stock : p.quantity || 0)), 0);
    const totalValue = (products || []).reduce((sum, p) => {
      const q = Number(p.stock !== undefined ? p.stock : p.quantity || 0);
      const cost = Number(p.buyPrice || p.costPrice || p.purchasePrice || p.price || 0);
      return sum + (q * cost);
    }, 0);
    const lowStockItems = (products || []).filter(p => Number(p.stock !== undefined ? p.stock : p.quantity || 0) <= 5).slice(0, 6);

    text = `📦 *হিসাবকিতাব ৩৬০ - স্টক ও ইনভেন্টরি রিপোর্ট*
🏪 *দোকান:* *${shopName || 'আমার দোকান'}*
━━━━━━━━━━━━━━━━━━━━━
📋 *মোট পণ্য আইটেম:* ${totalItems} প্রকার
🔢 *মোট পণ্যের স্টক সংখ্যা:* ${totalQty.toLocaleString()} টি
💰 *মোট স্টক মূল্য (কেনা দাম):* ৳${Math.round(totalValue).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
` + (lowStockItems.length > 0
      ? `⚠️ *স্টক প্রায় শেষ / লো-স্টক সতর্কতা (${lowStockItems.length}টি):*\n` +
        lowStockItems.map(p => `• ${p.name}: মাত্র *${p.stock !== undefined ? p.stock : p.quantity || 0}* ${p.unit || 'টি'}`).join('\n') + `\n━━━━━━━━━━━━━━━━━━━━━\n`
      : `✅ আলহামদুলিল্লাহ, সব পণ্যে পর্যাপ্ত স্টক রয়েছে!\n━━━━━━━━━━━━━━━━━━━━━\n`) +
    `🔎 _নির্দিষ্ট কোনো পণ্যের স্টক দেখতে লিখুন:_ */stock [নাম]*\n(যেমন: \`/stock নাপা\`)`;
  }

  await sendTelegramMessage(text, customConfig);
};

export const sendTelegramProfitReport = async ({ todaySales, todayCost, todayExpenses, netProfit, shopName, dateStr }, customConfig = null) => {
  const isProfit = Number(netProfit || 0) >= 0;
  const text = `📈 *হিসাবকিতাব ৩৬০ - আজকের লাভ-ক্ষতি হিসাব*
📅 *তারিখ:* \`${dateStr || new Date().toLocaleDateString()}\`
🏪 *দোকান:* *${shopName || 'আমার দোকান'}*
━━━━━━━━━━━━━━━━━━━━━
💵 *আজকের মোট বিক্রি:* ৳${Number(todaySales || 0).toLocaleString()}
📦 *বিক্রিত পণ্যের ক্রয়মূল্য (COGS):* -৳${Number(todayCost || 0).toLocaleString()}
🏢 *দোকান পরিচালনা খরচ:* -৳${Number(todayExpenses || 0).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
${isProfit ? '🟢' : '🔴'} *আজকের নিট লাভ (Net Profit):* *৳${Number(netProfit || 0).toLocaleString()}*
━━━━━━━━━━━━━━━━━━━━━
💡 _বিস্তারিত স্টক দেখতে লিখুন:_ */stock*`;

  await sendTelegramMessage(text, customConfig);
};

export const sendTelegramDueReport = async ({ totalDue, customerCount, topDebtors, shopName }, customConfig = null) => {
  const text = `📒 *হিসাবকিতাব ৩৬০ - কাস্টমার বাকি ও বকেয়া খাতা*
🏪 *দোকান:* *${shopName || 'আমার দোকান'}*
━━━━━━━━━━━━━━━━━━━━━
💰 *মোট বকেয়া বাকির পরিমাণ:* *৳${Number(totalDue || 0).toLocaleString()}*
👥 *বাকিদার গ্রাহকের সংখ্যা:* ${customerCount || 0} জন
━━━━━━━━━━━━━━━━━━━━━
` + (topDebtors && topDebtors.length > 0
      ? `📋 *সর্বোচ্চ বাকিদারদের তালিকা:*\n` +
        topDebtors.slice(0, 6).map((c, idx) => `${idx + 1}. *${c.name}*: ৳${Number(c.due || c.balance || 0).toLocaleString()}`).join('\n') + `\n━━━━━━━━━━━━━━━━━━━━━\n`
      : `✅ কোনো বকেয়া বাকি নেই!\n━━━━━━━━━━━━━━━━━━━━━\n`) +
    `📥 _সম্পূর্ণ ব্যাকআপ ফাইল পেতে লিখুন:_ */backup*`;

  await sendTelegramMessage(text, customConfig);
};

export const sendTelegramExpenseReport = async ({ todayExpenses, totalAmount, shopName, dateStr }, customConfig = null) => {
  const text = `💸 *হিসাবকিতাব ৩৬০ - আজকের খরচের হিসাব*
📅 *তারিখ:* \`${dateStr || new Date().toLocaleDateString()}\`
🏪 *দোকান:* *${shopName || 'আমার দোকান'}*
━━━━━━━━━━━━━━━━━━━━━
💰 *আজকের মোট খরচ:* *৳${Number(totalAmount || 0).toLocaleString()}*
━━━━━━━━━━━━━━━━━━━━━
` + (todayExpenses && todayExpenses.length > 0
      ? `📋 *আজকের খরচের তালিকা:*\n` +
        todayExpenses.slice(0, 8).map(e => `• ${e.title || e.category || 'খরচ'}: ৳${Number(e.amount || 0).toLocaleString()}`).join('\n') + `\n━━━━━━━━━━━━━━━━━━━━━\n`
      : `ℹ️ আজ এখনও কোনো খরচ যুক্ত করা হয়নি।\n━━━━━━━━━━━━━━━━━━━━━\n`) +
    `➕ *টেলিগ্রাম থেকেই খরচ যোগ করতে লিখুন:*\n\`খরচ ৫০০ নাস্তা\` বা \`ব্যক্তিগত খরচ ২০০ ওষুধ\``;

  await sendTelegramMessage(text, customConfig);
};

export const sendTelegramExpenseAddedConfirmation = async ({
  amount,
  title,
  category,
  subCategory,
  familyMember,
  note,
  isPersonal
}, customConfig = null) => {
  const text = `✅ *${isPersonal ? 'ব্যক্তিগত' : 'দোকানের'} খরচ সফলভাবে সফটওয়্যারে যুক্ত হয়েছে!*
━━━━━━━━━━━━━━━━━━━━━
💰 *টাকার পরিমাণ:* ৳${Number(amount).toLocaleString()}
🏷️ *শিরোনাম:* ${title || 'সাধারণ খরচ'}
📁 *ক্যাটাগরি:* ${category || 'দৈনন্দিন'}
${subCategory ? `📂 *সাব-ক্যাটাগরি:* ${subCategory}\n` : ''}${familyMember ? `👤 *ব্যক্তি:* ${familyMember}\n` : ''}${note ? `📝 *নোট:* ${note}\n` : ''}⏰ *সময়:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
━━━━━━━━━━━━━━━━━━━━━
📊 _আজকের সব খরচ দেখতে লিখুন:_ */expense*`;

  await sendTelegramMessage(text, customConfig);
};

// =========================================================================
// Advanced Telegram Document / PDF Sender
// =========================================================================
export const sendTelegramDocument = async ({
  fileContent,
  fileName,
  caption,
  mimeType = 'text/html',
  customConfig = null
}) => {
  const config = customConfig || getTelegramBackupConfig();
  const token = (config.botToken || '').trim().replace(/^bot/i, '');
  const chatId = (config.chatId || '').trim();
  if (!token || !chatId) return false;

  try {
    const blob = fileContent instanceof Blob ? fileContent : new Blob([fileContent], { type: mimeType });
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', blob, fileName);
    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    return res.ok;
  } catch (err) {
    console.warn('sendTelegramDocument error:', err);
    return false;
  }
};

// =========================================================================
// Smart Item History & NLP Intelligence Query Engine ("বাদাম কতবার কিনেছি...")
// =========================================================================
export const parseSmartItemHistoryQuery = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const lower = rawText.toLowerCase().trim();

  // Exclude regular sales or creation commands
  if (
    lower.startsWith('সেল') ||
    lower.startsWith('বিক্রি') ||
    lower.startsWith('মেমো') ||
    lower.startsWith('কাস্টমার') ||
    lower.startsWith('পণ্য') ||
    lower.startsWith('খরচ') ||
    lower.startsWith('বাজার') ||
    lower.startsWith('আয়') ||
    lower.startsWith('আয়')
  ) {
    return null;
  }

  const isHistoryIntent = (
    lower.includes('কতবার') ||
    lower.includes('হিস্ট্রি') ||
    lower.includes('ইতিহাস') ||
    lower.includes('কবে কবে') ||
    lower.includes('কখন কখন') ||
    (lower.includes('কিনেছি') && (lower.includes('কত') || lower.includes('কবে') || lower.includes('কোন দিন') || lower.includes('লিস্ট'))) ||
    (lower.includes('কিনা') && lower.includes('হিসাব'))
  );

  if (!isHistoryIntent) return null;

  // Clean out common question words to isolate item name
  const cleaned = rawText
    .replace(/[০-৯0-9]/g, '')
    .replace(/কতবার|কিনেছি|কিনেছিলাম|কিনা|হয়েছে|হইছে|হিস্ট্রি|ইতিহাস|লিস্টটা|লিস্ট|দাও|দেখান|সব|সমস্ত|কোন দিন|কত টাকা|কত গ্রাম|করে|খরচের|খরচ|হিসাবটা|হিসাব|আমার|আমাকে|আমি|বটে|কি|দিয়ে|এর/gi, ' ')
    .replace(/[?!,।\-_]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length >= 2);
  const keyword = words[0] || '';
  if (!keyword || keyword.length < 2) return null;

  return {
    item: keyword,
    rawText
  };
};

export const sendTelegramItemHistoryReport = async ({ item, purchases, shopName }, customConfig = null) => {
  if (!purchases || purchases.length === 0) {
    const emptyMsg = `🔍 <b>পণ্য অনুসন্ধান রিপোর্ট: ${item}</b>
━━━━━━━━━━━━━━━━━━━━━
❌ আপনার অতীত খরচের তালিকায় <b>"${item}"</b> ক্রয়ের কোনো রেকর্ড পাওয়া যায়নি।

💡 <i>খরচ লেখার সময় যেমন: "খরচ ২০০ বাদাম ২৫০ গ্রাম" লিখলে বট পরবর্তীতে তার সম্পূর্ণ হিস্ট্রি বের করে দেবে।</i>`;
    await sendTelegramMessage(emptyMsg, customConfig, null, 'HTML');
    return;
  }

  const totalCount = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Extract gram or kg metrics from title or note
  let totalGrams = 0;
  let hasGramMetrics = false;

  purchases.forEach(p => {
    const text = `${p.title || ''} ${p.note || ''}`.toLowerCase();
    const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:কেজি|kg)/i);
    const gramMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:গ্রাম|gm|g)/i);
    if (kgMatch) {
      totalGrams += parseFloat(kgMatch[1]) * 1000;
      hasGramMetrics = true;
    } else if (gramMatch) {
      totalGrams += parseFloat(gramMatch[1]);
      hasGramMetrics = true;
    }
  });

  let qtyFormatted = '';
  if (hasGramMetrics && totalGrams > 0) {
    if (totalGrams >= 1000) {
      const kg = Math.floor(totalGrams / 1000);
      const remGram = totalGrams % 1000;
      qtyFormatted = `${kg} কেজি ${remGram > 0 ? remGram + ' গ্রাম' : ''}`.trim();
    } else {
      qtyFormatted = `${totalGrams} গ্রাম`;
    }
  }

  const avgSpent = Math.round(totalSpent / totalCount);

  let reportHtml = `🥜 <b>পণ্য ক্রয় ইতিহাস ও ইন্টেলিজেন্স রিপোর্ট: ${item}</b>
━━━━━━━━━━━━━━━━━━━━━
🔢 <b>মোট কেনা হয়েছে:</b> ${totalCount} বার
💰 <b>সর্বমোট খরচ:</b> ৳${totalSpent.toLocaleString()}
${qtyFormatted ? `⚖️ <b>মোট পরিমাণ:</b> ${qtyFormatted}\n` : ''}📊 <b>গড় খরচ:</b> প্রতিবারে প্রায় ৳${avgSpent.toLocaleString()}

📋 <b>তারিখভিত্তিক ক্রয়ের তালিকা:</b>\n`;

  purchases.slice(0, 10).forEach((p, idx) => {
    const dateFormatted = p.date ? new Date(p.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : 'তারিখ নেই';
    reportHtml += `\n${idx + 1}. 📅 <b>${dateFormatted}</b>
   • বিবরণ: <b>${p.title || item}</b>
   • টাকা: <b>৳${Number(p.amount).toLocaleString()}</b>${p.note ? ` | নোট: <i>${p.note}</i>` : ''}`;
  });

  reportHtml += `\n\n━━━━━━━━━━━━━━━━━━━━━\n💡 <i>যেকোনো পণ্যের ইতিহাস জানতে লিখুন: "[পণ্য] কতবার কিনেছি" বা "[পণ্য] হিস্ট্রি"</i>`;

  await sendTelegramMessage(reportHtml, customConfig, null, 'HTML');
};

// =========================================================================
// Smart PDF Statement & Multi-Line Transaction Parser
// =========================================================================
export const parseSmartPdfStatement = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const prevMonthItems = [];
  const currMonthItems = [];

  for (const line of lines) {
    const dateMatch = line.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
    const amtMatch = line.match(/(?:৳|\$)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:টাকা|টাকার|tk|\/-)?/i);

    if (dateMatch && amtMatch) {
      const cleanAmt = parseFloat(amtMatch[1].replace(/,/g, ''));
      if (cleanAmt > 0) {
        let itemMonth = currentMonth;
        let itemDateStr = dateMatch[1];
        try {
          const d = new Date(itemDateStr);
          if (!isNaN(d.getTime())) {
            itemMonth = d.getMonth() + 1;
          }
        } catch {}

        const desc = line.replace(dateMatch[0], '').replace(amtMatch[0], '').trim() || 'স্টেটমেন্ট আইটেম';

        const record = {
          date: itemDateStr,
          amount: cleanAmt,
          title: desc,
          note: 'PDF/স্টেটমেন্ট থেকে ইমপোর্টকৃত'
        };

        if (itemMonth === currentMonth) {
          currMonthItems.push(record);
        } else {
          prevMonthItems.push(record);
        }
      }
    }
  }

  if (prevMonthItems.length === 0 && currMonthItems.length === 0) return null;

  return {
    prevMonthItems,
    prevMonthTotal: prevMonthItems.reduce((s, it) => s + it.amount, 0),
    currMonthItems,
    currMonthTotal: currMonthItems.reduce((s, it) => s + it.amount, 0)
  };
};

// =========================================================================
// Professional Printable HTML Report Builder
// =========================================================================
export const generateReportHtmlDoc = ({ title, shopName, dateStr, headers, rows, summary }) => {
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; background: #fff; }
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
    .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { background: #f1f5f9; color: #334155; padding: 10px 8px; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; }
    td { padding: 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .summary-box { margin-top: 25px; padding: 12px 16px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; display: inline-block; min-width: 250px; font-size: 13px; }
    .footer { margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${shopName || 'হিসাবকিতাব ৩৬০'}</h1>
      <div class="sub">${title}</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
      তারিখ: <strong>${dateStr || new Date().toLocaleDateString('bn-BD')}</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>

  ${summary ? `<div class="summary-box">${summary}</div>` : ''}

  <div class="footer">
    প্রস্তুতকৃত: হিসাবকিতাব ৩৬০ ক্লাউড ইকোসিস্টেম • প্রিন্ট বা PDF হিসেবে সেভ করতে Ctrl + P চাপুন
  </div>
</body>
</html>`;
};
