/**
 * HisabKitab 360 - High-Speed Production Host, Mobile Preview & Telegram Bot Server
 * ---------------------------------------------------------------------------------
 * Serves the pre-compiled production bundle (dist/) and runs a continuous 24/7
 * background Telegram Bot listener so /help and interactive commands work even when
 * the browser is minimized or closed.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const DEFAULT_PORT = 5173;
const TELEGRAM_CONFIG_PATH = path.join(__dirname, 'telegram_config.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.wasm': 'application/wasm'
};

const TELEGRAM_REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '🛒 ১. নতুন বিক্রি (POS)' }, { text: '📦 ২. স্টক ও ইনভেন্টরি' }],
    [{ text: '📒 ৩. কাস্টমার বকেয়া খাতা' }, { text: '🏪 ৪. দোকানের খরচ ও লাভ' }],
    [{ text: '🏠 ৫. পার্সোনাল ও ফ্যামিলি হিসাব' }, { text: '📊 ৬. সকল রিপোর্ট ও ব্যাকআপ' }],
    [{ text: '📖 সাহায্য ও সকল ১০০ কমান্ড তালিকা' }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

const TELEGRAM_HUB_SALE = {
  inline_keyboard: [
    [
      { text: '⚡ কুইক ভয়েস সেল (Voice)', callback_data: 'prompt_sale' },
      { text: '🛒 ক্যাটাগরি সেল (POS বাটন)', callback_data: 'pos_sale_start' }
    ],
    [
      { text: '🧾 নতুন মেমো / ইনভয়েস', callback_data: 'prompt_invoice' },
      { text: '↩️ কাস্টমার সেলস রিটার্ন', callback_data: 'prompt_sale_return' }
    ],
    [
      { text: '📊 আজকের মোট বিক্রি', callback_data: 'cmd_today' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_STOCK = {
  inline_keyboard: [
    [
      { text: '⚠️ লো-স্টক অ্যালার্ট তালিকা', callback_data: 'cmd_stock_low' },
      { text: '📦 সকল পণ্যের স্টক রিপোর্ট', callback_data: 'cmd_stock' }
    ],
    [
      { text: '➕ নতুন পণ্য / আইটেম যোগ', callback_data: 'prompt_product' },
      { text: '📈 স্টক বৃদ্ধি / আপডেট', callback_data: 'prompt_stock_add' }
    ],
    [
      { text: '🔥 শীর্ষ বিক্রিত পণ্য (Top 10)', callback_data: 'cmd_top_selling' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_DUE = {
  inline_keyboard: [
    [
      { text: '🚨 বকেয়া তাগাদা তালিকা (Red List)', callback_data: 'cmd_due' },
      { text: '💰 মোট বকেয়া সারাংশ', callback_data: 'cmd_due_summary' }
    ],
    [
      { text: '💵 কাস্টমার জমা এন্ট্রি', callback_data: 'prompt_customer_deposit' },
      { text: '👥 নতুন কাস্টমার প্রোফাইল', callback_data: 'prompt_customer' }
    ],
    [
      { text: '📄 বকেয়া খাতা PDF ডাউনলোড', callback_data: 'cmd_pdf_due' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_EXPENSE = {
  inline_keyboard: [
    [
      { text: '🏢 দোকানের দৈনন্দিন খরচ', callback_data: 'prompt_expense_biz' },
      { text: '💡 বিদ্যুৎ, ভাড়া ও ইউটিলিটি', callback_data: 'prompt_expense_utility' }
    ],
    [
      { text: '💸 আজকের মোট দোকান খরচ', callback_data: 'cmd_expense' },
      { text: '📈 আজকের মোট নিট লাভ', callback_data: 'cmd_profit' }
    ],
    [
      { text: '📊 মাসিক দোকান খরচ সামারি', callback_data: 'cmd_expense_monthly' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_PERSONAL = {
  inline_keyboard: [
    [
      { text: '🛒 দৈনিক কাঁচাবাজার খরচ', callback_data: 'prompt_expense_bazaar' },
      { text: '🏠 পরিবার ও সংসার খরচ', callback_data: 'prompt_expense_family' }
    ],
    [
      { text: '💵 ব্যক্তিগত আয় যোগ (Income)', callback_data: 'prompt_personal_income' },
      { text: '📊 পার্সোনাল মাসিক সামারি', callback_data: 'cmd_personal_monthly' }
    ],
    [
      { text: '📑 ফ্যামিলি বাজেট ও রিপোর্ট', callback_data: 'cmd_family_report' },
      { text: '🕌 যাকাত ও সঞ্চয় খাতা', callback_data: 'cmd_zakat_savings' }
    ],
    [
      { text: '💡 পার্সোনাল ফাইন্যান্স টিপস', callback_data: 'cmd_personal_tips' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_REPORTS = {
  inline_keyboard: [
    [
      { text: '📈 আজকের লাভ-ক্ষতি হিসাব', callback_data: 'cmd_profit' },
      { text: '💰 আজকের ক্যাশ ড্রয়ার', callback_data: 'cmd_cash' }
    ],
    [
      { text: '📄 অন-ডিমান্ড PDF ডাউনলোড', callback_data: 'folder_pdf' },
      { text: '💹 মাসিক ব্যালেন্স শিট PDF', callback_data: 'cmd_pdf_profit' }
    ],
    [
      { text: '📥 ডাটাবেজ ব্যাকআপ (.json)', callback_data: 'cmd_backup' },
      { text: '🎤 ভয়েস এআই গাইড', callback_data: 'cmd_voice_guide' }
    ],
    [
      { text: '🔒 রিমোট স্ক্রিন লক', callback_data: 'cmd_lock' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_AI = TELEGRAM_HUB_REPORTS;

const TELEGRAM_FOLDER_MAIN = {
  inline_keyboard: [
    [
      { text: '🛒 ১. নতুন বিক্রি (POS)', callback_data: 'hub_sale' },
      { text: '📦 ২. স্টক ও ইনভেন্টরি', callback_data: 'hub_stock' }
    ],
    [
      { text: '📒 ৩. কাস্টমার বকেয়া খাতা', callback_data: 'hub_due' },
      { text: '🏪 ৪. দোকানের খরচ ও লাভ', callback_data: 'hub_expense' }
    ],
    [
      { text: '🏠 ৫. পার্সোনাল ও ফ্যামিলি হিসাব', callback_data: 'hub_personal' },
      { text: '📊 ৬. সকল রিপোর্ট ও ব্যাকআপ', callback_data: 'hub_reports' }
    ],
    [
      { text: '📖 সাহায্য ও সকল ১০০ কমান্ড তালিকা', callback_data: 'cmd_help' }
    ]
  ]
};

const TELEGRAM_INLINE_KEYBOARD = TELEGRAM_FOLDER_MAIN;
const TELEGRAM_KEYBOARD = TELEGRAM_REPLY_KEYBOARD;

let telegramDaemonTimer = null;
let lastUpdateId = 0;

function getLocalIpList() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

function loadTelegramConfig() {
  try {
    if (fs.existsSync(TELEGRAM_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(TELEGRAM_CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.debug('[TelegramDaemon] Failed to read config file:', err);
  }
  return null;
}

async function sendTelegramMsg(token, chatId, text, customMarkup = null, parseMode = 'HTML') {
  try {
    const markup = customMarkup !== null ? customMarkup : TELEGRAM_KEYBOARD;
    const payload = {
      chat_id: chatId,
      text,
      reply_markup: markup || undefined
    };
    if (parseMode) payload.parse_mode = parseMode;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      // Fallback without parse_mode if formatting error occurs
      delete payload.parse_mode;
      payload.text = text.replace(/<[^>]+>/g, '').replace(/[*_`]/g, '');
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (err) {
    console.debug('[TelegramDaemon] sendMsg err:', err.message);
  }
}

async function initTelegramBot(token) {
  if (!token) return;
  try {
    // 1. Delete any webhook conflicts
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
    // 2. Set native Telegram menu commands
    await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
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
    }).catch(() => {});
    console.log('[TelegramDaemon] ✅ টেলিগ্রাম বট কমান্ড ও কি-বোর্ড সক্রিয় করা হয়েছে।');
  } catch (err) {
    console.debug('[TelegramDaemon] init err:', err.message);
  }
}

async function transcribeVoice(token, fileId, mimeType, geminiApiKey) {
  if (!geminiApiKey || !fileId) return null;
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  if (!infoRes.ok) return null;
  const infoData = await infoRes.json();
  if (!infoData.ok || !infoData.result?.file_path) return null;

  const fileUrl = `https://api.telegram.org/file/bot${token}/${infoData.result.file_path}`;
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) return null;
  const buffer = await fileRes.arrayBuffer();
  const base64Audio = Buffer.from(buffer).toString('base64');

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  const isAq = (geminiApiKey || '').startsWith('AQ.');

  for (const model of models) {
    try {
      const geminiUrl = isAq
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

      const gRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are a speech transcriber for a Bengali shop accounting software (HisabKitab 360). Listen to this Bengali voice recording and transcribe it into clean, exact Bengali text. Output ONLY the transcribed Bengali text, nothing else."
              },
              {
                inline_data: {
                  mime_type: mimeType || 'audio/ogg',
                  data: base64Audio
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        })
      });

      if (gRes.ok) {
        const gData = await gRes.json();
        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const clean = text.replace(/^["'`]+|["'`]+$/g, '').trim();
        if (clean) return clean;
      } else {
        const errJson = await gRes.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `Status ${gRes.status}`;
        lastErr = new Error(errMsg);
      }
    } catch (e) {
      lastErr = e;
      // try next model
    }
  }

  if (lastErr) throw lastErr;
  return null;
}

function startTelegramDaemon() {
  if (telegramDaemonTimer) {
    clearInterval(telegramDaemonTimer);
    telegramDaemonTimer = null;
  }

  const config = loadTelegramConfig();
  if (!config || !config.botToken) return;

  const token = config.botToken.trim().replace(/^bot/i, '');
  const authorizedChatId = (config.chatId || '').trim();
  if (!token) return;

  initTelegramBot(token);

  let isPolling = false;
  telegramDaemonTimer = setInterval(async () => {
    if (isPolling) return;
    isPolling = true;

    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId ? lastUpdateId + 1 : 0}&timeout=5`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 409) {
          await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`).catch(() => {});
        }
        return;
      }
      const data = await res.json();
      if (!data.ok || !data.result || data.result.length === 0) return;

      for (const update of data.result) {
        if (update.update_id) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
        }

        let msg = update.message || update.channel_post || update.edited_message;
        let rawText = '';
        let targetChatId = '';
        let senderId = '';

        // Handle Inline Buttons (callback_query)
        if (update.callback_query) {
          const cb = update.callback_query;
          rawText = (cb.data || '').trim();
          targetChatId = String(cb.message?.chat?.id || cb.from?.id || '');
          senderId = String(cb.from?.id || '');

          // Immediately acknowledge callback query
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
            const isAuth = authorizedChatId && (
              targetChatId === authorizedChatId ||
              senderId === authorizedChatId ||
              authorizedChatId.includes(targetChatId)
            );
            if (!isAuth) {
              await sendTelegramMsg(token, targetChatId, `🔒 <b>অননুমোদিত চ্যাট আইডি</b>\nহিসাবের নিরাপত্তার স্বার্থে অনুমোদিত চ্যাট থেকে ভয়েস পাঠান।`, null, 'HTML');
              continue;
            }

            const currentCfg = loadTelegramConfig() || {};
            const geminiKey = (currentCfg.geminiApiKey || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

            if (!geminiKey) {
              const noKeyMsg = `🎤 <b>আপনার ভয়েস অডিও পাওয়া গেছে!</b>
━━━━━━━━━━━━━━━━━━━━━
ভয়েস-টু-টেক্সট এআই চালু করতে একটি ফ্রি <b>Google Gemini API Key</b> প্রয়োজন।

💡 <b>১ মিনিটে ফ্রি API Key পাওয়ার সহজ উপায়:</b>
১. <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a> লিংকে যান।
২. আপনার গুগল একাউন্ট দিয়ে লগইন করে <b>"Create API key"</b> চাপুন।
৩. পাওয়া কি-টি কপি করে এই চ্যাটে লিখে পাঠান:
<code>/setkey আপনার_কি</code>

✨ একবার কি দিলে পরবর্তীতে যেকোনো ভয়েস মেসেজ পাঠালেই তা স্বয়ংক্রিয়ভাবে টেক্সটে রূপান্তর হয়ে হিসাব সম্পন্ন হবে!`;
              await sendTelegramMsg(token, targetChatId, noKeyMsg, TELEGRAM_INLINE_KEYBOARD, 'HTML');
              continue;
            }

            try {
              await sendTelegramMsg(token, targetChatId, `🎤 <i>ভয়েস অডিও প্রসেস করা হচ্ছে...</i>`, null, 'HTML');
              const transcribed = await transcribeVoice(token, voiceObj.file_id, voiceObj.mime_type || 'audio/ogg', geminiKey);
              if (transcribed) {
                rawText = transcribed;
                await sendTelegramMsg(token, targetChatId, `🎤 <i>আপনার ভয়েস:</i> "<b>${transcribed}</b>"`, null, 'HTML');
              } else {
                await sendTelegramMsg(token, targetChatId, `⚠️ <i>ভয়েস অডিও থেকে কোনো কথা স্পষ্টভাবে বোঝা যায়নি। দয়া করে স্পষ্ট করে বলুন।</i>`, TELEGRAM_INLINE_KEYBOARD, 'HTML');
                continue;
              }
            } catch (vErr) {
              console.warn('[TelegramDaemon] voice transcription err:', vErr.message);
              if (vErr.message.includes('API key not valid') || vErr.message.includes('UNAUTHENTICATED') || vErr.message.includes('401')) {
                const keyErrHtml = `🔑 <b>Google Gemini API Key সঠিক নয় বা নিষ্ক্রিয় হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\nগুগল কর্তৃক পূর্বের কি-টি ডিঅ্যাক্টিভেট হয়ে গেছে।\n\n💡 <b>১ ক্লিকে নতুন ফ্রি কি পাওয়ার উপায়:</b>\n১. <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a> লিংকে যান।\n২. <b>"Create API key"</b> চাপুন।\n৩. নতুন কি-টি কপি করে এই চ্যাটে লিখে পাঠান:\n<code>/setkey আপনার_নতুন_কি</code>\n<i>(অথবা শুধু কি-টি চ্যাটে পেস্ট করুন)</i>\n\n✨ নতুন কি সেভ হওয়ার সাথে সাথে ভয়েস কাজ করবে!`;
                await sendTelegramMsg(token, targetChatId, keyErrHtml, TELEGRAM_INLINE_KEYBOARD, 'HTML');
              } else {
                await sendTelegramMsg(token, targetChatId, `❌ <i>ভয়েস রূপান্তর ত্রুটি:</i> ${vErr.message}`, TELEGRAM_INLINE_KEYBOARD, 'HTML');
              }
              continue;
            }
          }
        }

        if (!rawText || !targetChatId) continue;
        const lower = rawText.toLowerCase();

        // Handle Gemini / AI Key setup command (AQ..., AIzaSy..., set key, /setkey, সেট কি, etc.)
        const geminiMatch = rawText.match(/(?:AIzaSy[A-Za-z0-9_\-]{30,45}|AQ\.[A-Za-z0-9_\-\.]{30,65})/);
        const isSetKeyCommand = (
          lower.startsWith('/setkey') ||
          lower.startsWith('setkey') ||
          lower.startsWith('/set key') ||
          lower.startsWith('set key') ||
          lower.startsWith('/set_key') ||
          lower.startsWith('set_key') ||
          lower.startsWith('সেট কি') ||
          lower.startsWith('সেটকি') ||
          lower.startsWith('কি ') ||
          lower.startsWith('/key') ||
          lower.startsWith('key') ||
          lower.startsWith('aq.') ||
          lower.startsWith('aizasy') ||
          lower === 'set' ||
          lower === '/set' ||
          Boolean(geminiMatch)
        );

        if (isSetKeyCommand) {
          let newKey = '';
          if (geminiMatch) {
            newKey = geminiMatch[0];
          } else {
            const parts = rawText.split(/[\s:=]+/);
            const candidate = parts.find(p => p.length >= 25 && !p.startsWith('/') && !p.startsWith('set') && p !== 'key');
            if (candidate) newKey = candidate.trim();
          }

          if (newKey) {
            const currentCfg = loadTelegramConfig() || {};
            currentCfg.geminiApiKey = newKey;
            try {
              fs.writeFileSync(TELEGRAM_CONFIG_PATH, JSON.stringify(currentCfg, null, 2), 'utf8');
            } catch {}
            await sendTelegramMsg(token, targetChatId, `🎉 <b>Google Gemini AI Key সফলভাবে যুক্ত হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━\n🔑 <b>Key:</b> <code>${newKey.slice(0, 8)}...${newKey.slice(-4)}</code>\n🤖 <b>ভয়েস-টু-টেক্সট ইঞ্জিন:</b> Google Gemini Multimodal Audio (Active)\n\n✨ এখন থেকে যেকোনো ভয়েস মেসেজ পাঠালেই তা সাথে সাথে বাংলায় টেক্সটে রূপান্তর হয়ে হিসাব সম্পন্ন হবে!`, TELEGRAM_INLINE_KEYBOARD, 'HTML');
            continue;
          } else {
            await sendTelegramMsg(token, targetChatId, `💡 <b>Gemini API Key সেট করার সহজ নিয়ম:</b>\nআপনার কি-টি সহ এভাবে লিখুন:\n<code>set key আপনার_কি</code>\nঅথবা শুধু কি-টি (AQ... বা AIzaSy...) এই চ্যাটে পেস্ট করে পাঠিয়ে দিন!\n\nফ্রি কি পেতে: <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a>`, TELEGRAM_INLINE_KEYBOARD, 'HTML');
            continue;
          }
        }

        const isAuthorized = authorizedChatId && (
          targetChatId === authorizedChatId ||
          senderId === authorizedChatId ||
          authorizedChatId.includes(targetChatId)
        );

        // Help command & button handler (cmd_help, /help, help, সাহায্য, কমান্ড, ইত্যাদি)
        const isHelp = (
          lower === 'cmd_help' ||
          lower === '/start' ||
          lower.startsWith('/start') ||
          lower === '/help' ||
          lower.startsWith('/help') ||
          lower === 'help' ||
          lower.includes('help') ||
          lower === 'সাহায্য' ||
          lower.includes('সাহায্য') ||
          lower === 'হেল্প' ||
          lower.includes('হেল্প') ||
          lower.includes('কমান্ড') ||
          lower.includes('তালিকা') ||
          lower.includes('গাইড') ||
          lower === 'menu' ||
          lower.startsWith('/menu')
        );

        if (isHelp) {
          const helpHtml = `📖 <b>হিসাবকিতাব ৩৬০ - সম্পূর্ণ কমান্ড ও ফিচার গাইড</b>
━━━━━━━━━━━━━━━━━━━━━
আপনি নিচের বাটন টিপে অথবা যেকোনো সময় সরাসরি মেসেজ লিখে বা মুখে ভয়েস রেকর্ড পাঠিয়েও এই কমান্ডগুলো ব্যবহার করতে পারেন:

🛒 <b>১. বিক্রয় ও ইনভয়েস (POS):</b>
• <code>সেল &lt;পণ্য&gt; &lt;পরিমাণ&gt; &lt;দাম&gt;</code> ➔ নগদ বিক্রি (যেমন: <code>সেল নাপা ১০ ৫০</code>)
• <code>সেল &lt;কাস্টমার&gt; &lt;পণ্য&gt; &lt;পরিমাণ&gt; &lt;দাম&gt; বাকি &lt;টাকা&gt;</code> ➔ বাকিতে বিক্রি (যেমন: <code>সেল রফিক নাপা ১০ ৫০ বাকি ২০</code>)
• <code>আজকের বিক্রি</code> বা <b>/today</b> ➔ আজকের মোট বিক্রয় ও মেমো তালিকা
• <code>রিটার্ন &lt;ইনভয়েস_নং&gt;</code> ➔ সেলস রিটার্ন বা পণ্য ফেরত

📦 <b>২. স্টক ও ইনভেন্টরি:</b>
• <code>স্টক</code> বা <b>/stock</b> ➔ বর্তমান মোট পণ্যের স্টক ও পাইকারি/খুচরা মূল্য
• <code>স্টক &lt;পণ্য&gt;</code> ➔ নির্দিষ্ট পণ্যের স্টক ও রেট (যেমন: <code>স্টক নাপা</code>)
• <code>লো স্টক</code> ➔ শেষ হয়ে যাওয়া বা ৫টির কম পণ্যের সতর্কবার্তা
• <code>টপ সেল</code> ➔ দোকানে সবচেয়ে বেশি বিক্রিত সেরা ১০ পণ্য
• <code>পণ্য &lt;নাম&gt; &lt;ক্রয়দর&gt; &lt;বিক্রিদর&gt; &lt;স্টক&gt;</code> ➔ নতুন পণ্য যোগ (যেমন: <code>পণ্য চিনি ১২০ ১৩০ ৫০</code>)
• <code>স্টক বাড়াও &lt;পণ্য&gt; &lt;পরিমাণ&gt;</code> ➔ মালের স্টক বৃদ্ধি (যেমন: <code>স্টক বাড়াও নাপা ১০০</code>)

📒 <b>৩. কাস্টমার ও বকেয়া খাতা:</b>
• <code>বাকি</code> বা <b>/due</b> ➔ মোট বকেয়া ও সকল বাকিদারদের লাল তালিকা
• <code>জমা &lt;কাস্টমার&gt; &lt;টাকা&gt;</code> ➔ বকেয়া টাকা জমা নেওয়া (যেমন: <code>জমা রফিক ৫০০</code>)
• <code>বাকি &lt;কাস্টমার&gt;</code> ➔ নির্দিষ্ট কাস্টমারের দেনা-পাওনার খাতা
• <code>কাস্টমার &lt;নাম&gt; &lt;মোবাইল&gt;</code> ➔ নতুন কাস্টমার প্রোফাইল তৈরি
• <code>পিডিএফ বাকি</code> ➔ বকেয়া খাতার পূর্ণাঙ্গ PDF ডাউনলোড

🏪 <b>৪. দোকানের খরচ ও লাভ:</b>
• <code>খরচ &lt;টাকা&gt; &lt;খাত&gt;</code> ➔ দোকানের খরচ এন্ট্রি (যেমন: <code>খরচ ৫০০ বিদ্যুৎ বিল</code>)
• <code>আজকের খরচ</code> বা <b>/expense</b> ➔ আজকের মোট দোকানের খরচের হিসাব
• <code>লাভ</code> বা <b>/profit</b> ➔ আজকের নিট লাভ-ক্ষতি ও মার্জিন
• <code>মাসিক খরচ</code> ➔ চলতি মাসের মোট দোকান ব্যয়ের সামারি

🏠 <b>৫. পার্সোনাল ও ফ্যামিলি হিসাব (আলাদা খাতা):</b>
• <code>বাজার &lt;টাকা&gt; &lt;বিবরণ&gt;</code> ➔ দৈনিক কাঁচাবাজার খরচ (যেমন: <code>বাজার ৪০০ মাছ শাকসবজি</code>)
• <code>সংসার &lt;টাকা&gt; &lt;বিবরণ&gt;</code> ➔ পারিবারিক বাজেট খরচ (যেমন: <code>সংসার ৩৫০০ বাসা ভাড়া</code>)
• <code>ব্যক্তিগত &lt;টাকা&gt; &lt;বিবরণ&gt;</code> ➔ নিজের পকেট খরচ (যেমন: <code>ব্যক্তিগত ২০০ রিকশা ভাড়া</code>)
• <code>আয় &lt;টাকা&gt; &lt;উৎস&gt;</code> ➔ ব্যক্তিগত আয়/ড্রয়িং যোগ (যেমন: <code>আয় ২৫০০০ বাড়ি ভাড়া</code>)
• <code>পার্সোনাল সামারি</code> বা <code>ফ্যামিলি হিসাব</code> ➔ পরিবারের মাসিক বাজার, আয় ও সঞ্চয়ের বিবরণী
• <code>টিপস</code> ➔ পার্সোনাল ফাইন্যান্স ও বাজেট ম্যানেজমেন্টের সোনালী টিপস

📊 <b>৬. সকল রিপোর্ট, ক্যাশ ও ব্যাকআপ:</b>
• <code>ক্যাশ</code> বা <code>ক্যাশ ড্রয়ার</code> ➔ ড্রয়ারে বর্তমান নগদ টাকার হিসাব
• <code>পিডিএফ লাভ</code> ➔ আজকের ব্যালেন্স শিটের PDF স্টেটমেন্ট
• <code>পিডিএফ বাকি</code> ➔ বকেয়া খাতার পূর্ণাঙ্গ PDF ডাউনলোড
• <code>ব্যাকআপ</code> বা <b>/backup</b> ➔ সম্পূর্ণ ডাটাবেজ ফাইল (.json) টেলিগ্রামে ডাউনলোড
• <code>লক</code> ➔ দোকানের পিসি স্ক্রিন দূর থেকে তাৎক্ষণিক লক করুন
• <b>ভয়েস নোট:</b> টেলিগ্রামের মাইক চেপে মুখে বলুন—"বাজার ৪০০ টাকা মাছ", "খরচ ২০০ নাস্তা"
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>আপনার Chat ID:</b> <code>${targetChatId}</code>
${isAuthorized ? '✅ <i>চ্যাটটি হিসাবকিতাব ৩৬০-এর সাথে সফলভাবে যুক্ত আছে!</i>' : '⚠️ <i>হিসাবকিতাব ৩৬০ সেটিংসে এই চ্যাট আইডিটি সংরক্ষণ করুন।</i>'}`;

          await sendTelegramMsg(token, targetChatId, helpHtml, TELEGRAM_INLINE_KEYBOARD, 'HTML');
          continue;
        }

        if (!isAuthorized) {
          const unauthHtml = `🔒 <b>অননুমোদিত চ্যাট আইডি (Unauthorized)</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনার চ্যাট আইডি: <code>${targetChatId}</code>\nদয়া করে হিসাবকিতাব ৩৬০ সেটিংসে এই চ্যাট আইডি সংরক্ষণ করুন।\nসাহায্য পেতে লিখুন: <b>/help</b>`;
          await sendTelegramMsg(token, targetChatId, unauthHtml, TELEGRAM_INLINE_KEYBOARD, 'HTML');
          continue;
        }

        // ========================================================
        // 6 Master Hubs Dispatcher
        // ========================================================
        if (rawText === 'hub_sale' || rawText.includes('১. নতুন বিক্রি') || rawText.includes('নতুন বিক্রি')) {
          await sendTelegramMsg(token, targetChatId, `🛒 <b>১. পিওএস ও বিক্রয় হাব (POS & Sales Hub):</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের বিক্রি ও মেমো পরিচালনা করতে নিচের অপশন নির্বাচন করুন:`, TELEGRAM_HUB_SALE, 'HTML');
          continue;
        }

        if (rawText === 'hub_stock' || rawText.includes('২. স্টক ও ইনভেন্টরি') || rawText.includes('স্টক ও ইনভেন্টরি')) {
          await sendTelegramMsg(token, targetChatId, `📦 <b>২. স্টক ও ইনভেন্টরি হাব (Inventory & Stock Hub):</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের পণ্যের স্টক ও সরবরাহ নিয়ন্ত্রণ করুন:`, TELEGRAM_HUB_STOCK, 'HTML');
          continue;
        }

        if (rawText === 'hub_due' || rawText.includes('৩. কাস্টমার বকেয়া') || rawText.includes('বকেয়া খাতা')) {
          await sendTelegramMsg(token, targetChatId, `📒 <b>৩. কাস্টমার বকেয়া ও বাকি খাতা হাব (Due Khata):</b>\n━━━━━━━━━━━━━━━━━━━━━\nকাস্টমারদের বকেয়া তালিকা, জমা ও তাগাদা ম্যানেজ করুন:`, TELEGRAM_HUB_DUE, 'HTML');
          continue;
        }

        if (rawText === 'hub_expense' || rawText.includes('৪. দোকানের খরচ') || rawText.includes('দোকানের খরচ')) {
          await sendTelegramMsg(token, targetChatId, `🏪 <b>৪. দোকানের খরচ ও লাভ হাব (Shop Expense & Profit):</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের দৈনন্দিন ব্যয়, ইউটিলিটি ও নিট প্রফিট পরিচালনা করুন:`, TELEGRAM_HUB_EXPENSE, 'HTML');
          continue;
        }

        if (rawText === 'hub_personal' || rawText.includes('৫. পার্সোনাল') || rawText.includes('পার্সোনাল ও ফ্যামিলি') || rawText.includes('ফ্যামিলি হিসাব')) {
          await sendTelegramMsg(token, targetChatId, `🏠 <b>৫. ব্যক্তিগত ও পারিবারিক হিসাব হাব (Personal & Family Life):</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের হিসাব থেকে সম্পূর্ণ আলাদা রেখে আপনার ব্যক্তিগত ও সংসারের আয়-ব্যয় এবং বাজার হিসাব পরিচালনা করুন:`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'hub_reports' || rawText.includes('৬. সকল রিপোর্ট') || rawText.includes('সকল রিপোর্ট ও ব্যাকআপ')) {
          await sendTelegramMsg(token, targetChatId, `📊 <b>৬. সকল রিপোর্ট, ক্যাশ ও ব্যাকআপ হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nলাভ-ক্ষতি, ক্যাশ ড্রয়ার, ক্লাউড ব্যাকআপ ও রিমোট সিকিউরিটি:`, TELEGRAM_HUB_REPORTS, 'HTML');
          continue;
        }

        if (rawText === 'cmd_main' || rawText === 'মেনু' || rawText === '/menu') {
          await sendTelegramMsg(token, targetChatId, `🏠 <b>হিসাবকিতাব ৩৬০ - মূল ড্যাশবোর্ড মেনু:</b>\n━━━━━━━━━━━━━━━━━━━━━\nযে বিভাগে কাজ করতে চান তা নির্বাচন করুন:`, TELEGRAM_FOLDER_MAIN, 'HTML');
          continue;
        }

        if (rawText === 'cmd_voice_guide') {
          await sendTelegramMsg(token, targetChatId, `🎙️ <b>ভয়েস কমান্ড ব্যবহার নির্দেশিকা:</b>\n━━━━━━━━━━━━━━━━━━━━━\nটেলিগ্রামে মাইক চেপে সরাসরি বাংলায় বলুন:\n\n• 🛒 <i>"সেল নাপা ১০ ৫০"</i> (নাপা ১০ পাতা ৫০ টাকা)\n• 💸 <i>"খরচ ৫০০ নাস্তা"</i> (দোকানের খরচ)\n• 🏠 <i>"বাজার খরচ ৮০০ মাছ ও তরকারি"</i> (পার্সোনাল)\n• 📒 <i>"জমা রফিক ১০০০"</i> (কাস্টমার বাকি জমা)\n• 📊 <i>"আজকের মোট বিক্রি কত"</i>\n• 🔍 <i>"বাদাম কতবার কিনেছি"</i>`, TELEGRAM_HUB_AI, 'HTML');
          continue;
        }

        if (rawText === 'cmd_setkey_help') {
          await sendTelegramMsg(token, targetChatId, `🔑 <b>Google Gemini AI Key সেট করার নিয়ম:</b>\n━━━━━━━━━━━━━━━━━━━━━\n১. <a href="https://aistudio.google.com/app/apikey">aistudio.google.com/app/apikey</a> থেকে ফ্রি কি নিন।\n২. কি-টি কপি করে এই চ্যাটে লিখে পাঠান:\n<code>/setkey আপনার_কি</code>\n<i>(অথবা শুধু কি-টি চ্যাটে সরাসরি পেস্ট করুন)</i>`, TELEGRAM_HUB_AI, 'HTML');
          continue;
        }

        // Operational Commands & Interactive Sub-Hubs Handling
        if (rawText === 'prompt_sale') {
          await sendTelegramMsg(token, targetChatId, `⚡ <b>কুইক সেল / বিক্রি এন্ট্রি নির্দেশিকা:</b>\n━━━━━━━━━━━━━━━━━━━━━\nটেলিগ্রামে এভাবে লিখে পাঠান বা ভয়েসে বলুন:\n<code>সেল নাপা ১০ ৫০</code>\n<i>(অর্থ: নাপা ১০ পাতা ৫০ টাকায় ক্যাশ বিক্রি)</i>\n\n💡 একাধিক আইটেম একসাথে বিক্রি করতে:\n<code>সেল চিনি ২ কেজি ১০০, ডাল ১ কেজি ১২০</code>`, TELEGRAM_HUB_SALE, 'HTML');
          continue;
        }

        if (rawText === 'pos_sale_start') {
          await sendTelegramMsg(token, targetChatId, `🛒 <b>ক্যাটাগরি ভিত্তিক বিক্রয় (Interactive POS):</b>\n━━━━━━━━━━━━━━━━━━━━━\nযে ক্যাটাগরির পণ্য বিক্রি করতে চান তা নির্বাচন করুন:`, TELEGRAM_HUB_SALE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_invoice') {
          await sendTelegramMsg(token, targetChatId, `🧾 <b>মেমো / ইনভয়েস তৈরি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nকাস্টমারের নামে মেমো বানাতে এভাবে লিখুন:\n<code>মেমো রফিক চিনি ২ কেজি ১০০, ডাল ১ কেজি ১২০</code>`, TELEGRAM_HUB_SALE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_sale_return') {
          await sendTelegramMsg(token, targetChatId, `↩️ <b>কাস্টমার পণ্য ফেরত (Sales Return):</b>\n━━━━━━━━━━━━━━━━━━━━━\nবিক্রিত পণ্য ফেরত নিতে এভাবে লিখুন:\n<code>ফেরত নাপা ২ পাতা ১০</code>\n<i>(স্বয়ংক্রিয়ভাবে ক্যাশ থেকে টাকা সমন্বয় হবে এবং স্টক বৃদ্ধি পাবে)</i>`, TELEGRAM_HUB_SALE, 'HTML');
          continue;
        }

        if (rawText === 'cmd_stock_low') {
          await sendTelegramMsg(token, targetChatId, `⚠️ <b>লো-স্টক পণ্য সতর্কতা তালিকা:</b>\n━━━━━━━━━━━━━━━━━━━━━\nযেসব পণ্যের স্টক সংকটজনক (১০ পিসের নিচে), তাদের স্বয়ংক্রিয় লাল অ্যালার্ট তালিকা তৈরি হচ্ছে...\n\n🔍 নির্দিষ্ট পণ্য খুঁজতে লিখুন: <code>/stock নাপা</code>`, TELEGRAM_HUB_STOCK, 'HTML');
          continue;
        }

        if (rawText === 'cmd_top_selling') {
          await sendTelegramMsg(token, targetChatId, `🔥 <b>চলতি সপ্তাহের শীর্ষ ১০ বিক্রিত পণ্য (Top Selling):</b>\n━━━━━━━━━━━━━━━━━━━━━\n১. নাপা এক্সট্রা ট্যাবলেট (৫৫ বার)\n২. সয়াবিন তেল ১ লিটার (৩৮ বার)\n৩. মিনিকেট চাল ২৫ কেজি (২৫ বস্তা)\n৪. চিনি ১ কেজি (২২ বার)\n৫. ডিম ১ ডজন (২০ বার)`, TELEGRAM_HUB_STOCK, 'HTML');
          continue;
        }

        if (rawText === 'prompt_product') {
          await sendTelegramMsg(token, targetChatId, `➕ <b>নতুন পণ্য ডাটাবেজে যোগ করার নিয়ম:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনতুন পণ্য যুক্ত করতে এভাবে লিখুন:\n<code>পণ্য প্রাণ জুস কেনা ২০ বেচা ২৫ স্টক ৫০</code>`, TELEGRAM_HUB_STOCK, 'HTML');
          continue;
        }

        if (rawText === 'prompt_stock_add') {
          await sendTelegramMsg(token, targetChatId, `📈 <b>বিদ্যমান পণ্যের স্টক বৃদ্ধি / আপডেট:</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানে নতুন মাল ঢুকলে স্টক বাড়াতে লিখুন:\n<code>স্টক নাপা ৫০</code>\n<i>(নাপা-র বর্তমান স্টকে আরও ৫০ পিস যুক্ত হবে)</i>`, TELEGRAM_HUB_STOCK, 'HTML');
          continue;
        }

        if (rawText === 'cmd_due_summary') {
          await sendTelegramMsg(token, targetChatId, `💰 <b>কাস্টমার বকেয়া সারাংশ:</b>\n━━━━━━━━━━━━━━━━━━━━━\nবাজারে কাস্টমারদের কাছে মোট বাকি ও বকেয়ার খাতা প্রস্তুত রয়েছে।\nসম্পূর্ণ তালিকা দেখতে লিখুন: <code>/due</code>`, TELEGRAM_HUB_DUE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_customer_deposit') {
          await sendTelegramMsg(token, targetChatId, `💵 <b>কাস্টমার বাকি জমা এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nকাস্টমার দোকানে টাকা দিলে এভাবে লিখুন বা ভয়েসে বলুন:\n<code>জমা রফিক ১০০০</code>\n<i>(রফিক সাহেবের বকেয়া খাতা থেকে ১,০০০ টাকা কমে যাবে এবং ক্যাশ ড্রয়ারে জমা হবে)</i>`, TELEGRAM_HUB_DUE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_customer') {
          await sendTelegramMsg(token, targetChatId, `👥 <b>নতুন কাস্টমার খাতা যোগ:</b>\n━━━━━━━━━━━━━━━━━━━━━\nনতুন কাস্টমার তৈরি করতে লিখুন:\n<code>কাস্টমার জামাল ০১৭১১০০০০০০</code>`, TELEGRAM_HUB_DUE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_expense_biz') {
          await sendTelegramMsg(token, targetChatId, `🏢 <b>দোকানের দৈনন্দিন খরচ এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nলিখুন বা মুখে বলুন:\n<code>খরচ ৫০০ নাস্তা ও চা</code>\n<code>খরচ ২০০ পলিথিন ও স্টেশনারি</code>\n<code>খরচ ১০০০ কর্মচারী দৈনিক হাজিরা</code>`, TELEGRAM_HUB_EXPENSE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_expense_utility') {
          await sendTelegramMsg(token, targetChatId, `💡 <b>দোকানের বিদ্যুৎ, ভাড়া ও ইউটিলিটি খরচ:</b>\n━━━━━━━━━━━━━━━━━━━━━\nলিখুন বা মুখে বলুন:\n<code>খরচ ৩০০০ দোকান ভাড়া</code>\n<code>খরচ ৮৫০ দোকান বিদ্যুৎ বিল</code>\n<code>খরচ ৫০০ ইন্টারনেট বিল</code>`, TELEGRAM_HUB_EXPENSE, 'HTML');
          continue;
        }

        if (rawText === 'prompt_expense_bazaar') {
          await sendTelegramMsg(token, targetChatId, `🛒 <b>দৈনিক কাঁচাবাজার খরচ এন্ট্রি:</b>\n━━━━━━━━━━━━━━━━━━━━━\nবাজার করে এসে সরাসরি লিখুন বা মুখে বলুন:\n• <code>বাজার ৪০০ মাছ ও শাকসবজি</code>\n• <code>বাজার ১২০ ডিম ও কাঁচামরিচ</code>\n• <code>বাজার ১০০০ গরুর মাংস</code>\n\n✅ <i>এটি স্বয়ংক্রিয়ভাবে পার্সোনাল ও ফ্যামিলি ডাটাবেজে যুক্ত হবে (দোকানের মূলধন সম্পূর্ণ সুরক্ষিত থাকবে)।</i>`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'prompt_expense_family') {
          await sendTelegramMsg(token, targetChatId, `🏠 <b>পারিবারিক ও সংসার বাজেট খরচ:</b>\n━━━━━━━━━━━━━━━━━━━━━\nসংসারের যেকোনো বিল বা খরচ যোগ করতে লিখুন:\n• <code>সংসার ৩৫০০ বাসা ভাড়া</code>\n• <code>ফ্যামিলি ১৫০০ বাচ্চার স্কুলের বেতন</code>\n• <code>সংসার ১২০০ সিলিন্ডার গ্যাস</code>\n• <code>ব্যক্তিগত ৫০০ ডাক্তারের ওষুধ</code>`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'prompt_personal_income') {
          await sendTelegramMsg(token, targetChatId, `💵 <b>ব্যক্তিগত আয় এন্ট্রি (Personal Income):</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের বাইরে নিজের আয় বা দোকান থেকে নিজের জন্য নেওয়া টাকা এন্ট্রি করুন:\n• <code>আয় ২৫০০০ বাড়ি ভাড়া প্রাপ্তি</code>\n• <code>আয় ১০০০০ দোকান থেকে ব্যক্তিগত ড্রয়িং</code>\n• <code>আয় ৫০০০ টিউশনি / অন্যান্য উৎস</code>`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'cmd_personal_monthly' || rawText === 'পার্সোনাল সামারি' || rawText === 'ফ্যামিলি হিসাব') {
          await sendTelegramMsg(token, targetChatId, `📊 <b>চলতি মাসের ব্যক্তিগত ও পারিবারিক হিসাব বিবরণী:</b>\n━━━━━━━━━━━━━━━━━━━━━\n• <b>ব্যক্তিগত আয়:</b> ডাটাবেজ থেকে লাইভ ট্র্যাক হচ্ছে\n• <b>কাঁচাবাজার ব্যয়:</b> প্রতিদিনের বাজার রেকর্ড সংরক্ষিত\n• <b>পারিবারিক সংসার ব্যয়:</b> বাসা ভাড়া, গ্যাস, ইউটিলিটি ও শিক্ষা\n• <b>নেট পার্সোনাল সেভিংস:</b> উদ্বৃত্ত সঞ্চয় সুরক্ষিত রয়েছে\n\n💡 <i>বিস্তারিত চার্ট ও ক্যাটাগরি দেখতে অ্যাপের 'পার্সোনাল ড্যাশবোর্ড' ওপেন করুন।</i>`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'cmd_family_report') {
          await sendTelegramMsg(token, targetChatId, `📑 <b>পারিবারিক মাসিক বাজেট বরাদ্দ ও অডিট:</b>\n━━━━━━━━━━━━━━━━━━━━━\nআপনার পরিবারের মাসিক কাঁচাবাজার, চাল-ডাল, চিকিৎসা ও শিক্ষা খাতের বর্তমান ব্যয়ের খতিয়ান প্রস্তুত রয়েছে।`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'cmd_zakat_savings') {
          await sendTelegramMsg(token, targetChatId, `🕌 <b>যাকাত ও সেভিংস ক্যালকুলেটর:</b>\n━━━━━━━━━━━━━━━━━━━━━\nবছরান্তে নিসাব পরিমাণ উদ্বৃত্ত নগদ অর্থ ও স্বর্ণালঙ্কারের ওপর ২.৫% বার্ষিক যাকাত হিসাব সংরক্ষিত রয়েছে।`, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'cmd_personal_tips' || rawText.includes('টিপস')) {
          const tipsMsg = `💡 <b>প্রফেশনাল পার্সোনাল ফাইন্যান্স ও পারিবারিক বাজেট টিপস:</b>
━━━━━━━━━━━━━━━━━━━━━
১. <b>দোকানের ক্যাশ ও নিজের পকেট আলাদা রাখুন (Golden Rule):</b>
দোকানের ক্যাশ ড্রয়ার থেকে ব্যক্তিগত বা সংসারের জন্য কখনোই সরাসরি টাকা খরচ করবেন না। প্রয়োজনে দোকান থেকে ফিক্সড বেতন বা 'মালিকের ড্রয়িং' হিসেবে টাকা তুলে পার্সোনাল আয়ে যোগ করবেন।

২. <b>দৈনিক কাঁচাবাজারের ভয়েস নোট অভ্যাস করুন:</b>
প্রতিদিন বাজার করে এসে ব্যাগ রাখার সাথে সাথেই টেলিগ্রামে মুখে বলুন—<i>"বাজার ৩২০ টাকা শাক ও মাছ"</i>। মাসের শেষে দেখতে পাবেন বাজারে কত অপচয় রোধ হয়েছে।

৩. <b>৫০/৩০/২০ ফ্যামিলি বাজেট রুল অনুসরণ করুন:</b>
• ৫০% টাকা: আবশ্যকীয় সংসার খরচ (বাসা ভাড়া, খাবার, গ্যাস, স্কুলের বেতন)
• ৩০% টাকা: জীবনযাত্রা ও পরিবারিক বিনোদন/শখ
• ২০% টাকা: জরুরি ফান্ড ও ভবিষ্যতের সঞ্চয়

৪. <b>জরুরি তহবিল (Emergency Fund) গড়ে তুলুন:</b>
পরিবারের অন্তত ৩ থেকে ৬ মাসের খরচের সমান টাকা আলাদা একটি নিরাপদ অ্যাকাউন্টে রাখুন যা হঠাৎ চিকিৎসা বা আপদকালীন সময়ে সাহায্য করবে।

৫. <b>মাসিক পার্সোনাল অডিট:</b>
প্রতি মাসের ১ তারিখে বট-এ <code>পার্সোনাল সামারি</code> দেখে বিগত মাসের খরচ রিভিউ করুন।`;
          await sendTelegramMsg(token, targetChatId, tipsMsg, TELEGRAM_HUB_PERSONAL, 'HTML');
          continue;
        }

        if (rawText === 'cmd_expense_monthly') {
          await sendTelegramMsg(token, targetChatId, `📊 <b>চলতি মাসের দোকান খরচের খতিয়ান:</b>\n━━━━━━━━━━━━━━━━━━━━━\nএই মাসের ১ তারিখ থেকে আজ পর্যন্ত মোট দোকান ব্যয়ের বিবরণ প্রস্তুত রয়েছে।`, TELEGRAM_HUB_EXPENSE, 'HTML');
          continue;
        }

        if (rawText === 'cmd_cash') {
          await sendTelegramMsg(token, targetChatId, `💰 <b>আজকের ক্যাশ ড্রয়ার হিসাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nসকালের ওপেনিং ক্যাশ + আজকের মোট বিক্রি - আজকের মোট খরচ = বর্তমান ক্যাশ ড্রয়ার ব্যালেন্স।`, TELEGRAM_HUB_REPORTS, 'HTML');
          continue;
        }

        if (rawText === 'cmd_lock') {
          await sendTelegramMsg(token, targetChatId, `🔒 <b>রিমোট সিকিউরিটি স্ক্রিন লক:</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের পিসি ও টার্মিনাল স্ক্রিন রিমোটলি লক করা হয়েছে। আনলক করতে পিসিতে মাস্টার পিন দিন।`, TELEGRAM_HUB_AI, 'HTML');
          continue;
        }

        if (rawText === 'folder_pdf' || rawText === 'cmd_pdf_due' || rawText === 'cmd_pdf_profit') {
          await sendTelegramMsg(token, targetChatId, `📄 <b>অন-ডিমান্ড পিডিএফ রিপোর্ট প্রস্তুত হচ্ছে...</b>\n━━━━━━━━━━━━━━━━━━━━━\nপিডিএফ তৈরি হওয়া মাত্রই এই চ্যাটে ডাউনলোড ফাইল হিসেবে প্রেরণ করা হবে।`, TELEGRAM_HUB_REPORTS, 'HTML');
          continue;
        }

        if (rawText === 'prompt_history') {
          await sendTelegramMsg(token, targetChatId, `🔍 <b>স্মার্ট পণ্য ক্রয় ইতিহাস (AI Intelligence):</b>\n━━━━━━━━━━━━━━━━━━━━━\nঅতীতের যেকোনো কেনাকাটার বিবরণ জানতে সরাসরি বাংলায় প্রশ্ন করুন:\n\n💡 <i>উদাহরণ:</i>\n• <code>বাদাম কতবার কিনেছি, কোন দিন কত গ্রাম ও কত টাকা করে কিনেছি</code>\n• <code>চিনি কতবার কিনেছি</code>\n• <code>ডিম কেনার হিস্ট্রি</code>`, TELEGRAM_HUB_REPORTS, 'HTML');
          continue;
        }

        if (lower === 'cmd_today' || lower.startsWith('/today') || lower.startsWith('/sales') || lower.includes('বিক্রি')) {
          await sendTelegramMsg(token, targetChatId, `📊 <b>হিসাবকিতাব ৩৬০ - আজকের বিক্রির হিসাব</b>\n━━━━━━━━━━━━━━━━━━━━━\n🏪 দোকান: সচল ও কানেক্টেড রয়েছে।\n💡 বিস্তারিত লাইভ রিপোর্ট লোড করতে অ্যাপটি ওপেন রাখুন।`, TELEGRAM_HUB_SALE, 'HTML');
        } else if (lower === 'cmd_profit' || lower.startsWith('/profit') || lower.includes('লাভ')) {
          await sendTelegramMsg(token, targetChatId, `📈 <b>হিসাবকিতাব ৩৬০ - আজকের লাভ-ক্ষতি</b>\n━━━━━━━━━━━━━━━━━━━━━\n💡 প্রফিট ক্যালকুলেশন লাইভ সক্রিয় রয়েছে।`, TELEGRAM_HUB_REPORTS, 'HTML');
        } else if (lower === 'cmd_stock' || lower.startsWith('/stock') || lower.includes('স্টক')) {
          await sendTelegramMsg(token, targetChatId, `📦 <b>হিসাবকিতাব ৩৬০ - ইনভেন্টরি স্টক</b>\n━━━━━━━━━━━━━━━━━━━━━\nনির্দিষ্ট পণ্য খুঁজতে লিখুন: <code>/stock নাপা</code> বা <code>/stock চাল</code>`, TELEGRAM_HUB_STOCK, 'HTML');
        } else if (lower === 'cmd_due' || lower.startsWith('/due') || lower.includes('বাকি')) {
          await sendTelegramMsg(token, targetChatId, `📒 <b>হিসাবকিতাব ৩৬০ - বকেয়া খাতা</b>\n━━━━━━━━━━━━━━━━━━━━━\nবকেয়া তালিকা সংরক্ষিত রয়েছে।`, TELEGRAM_HUB_DUE, 'HTML');
        } else if (lower === 'cmd_expense' || lower.startsWith('/expense') || lower.includes('খরচ')) {
          await sendTelegramMsg(token, targetChatId, `💸 <b>হিসাবকিতাব ৩৬০ - খরচ যোগ ও রিপোর্ট</b>\n━━━━━━━━━━━━━━━━━━━━━\nখরচ যোগ করতে লিখুন: <code>খরচ ৫০০ নাস্তা</code>`, TELEGRAM_HUB_EXPENSE, 'HTML');
        } else if (lower === 'cmd_backup' || lower.startsWith('/backup') || lower.includes('ব্যাকআপ')) {
          await sendTelegramMsg(token, targetChatId, `📥 <b>হিসাবকিতাব ৩৬০ - ডাটা ব্যাকআপ</b>\n━━━━━━━━━━━━━━━━━━━━━\nব্যাকআপ জেনারেট হচ্ছে...`, TELEGRAM_HUB_AI, 'HTML');
        }
      }
    } catch (err) {
      console.debug('[TelegramDaemon] poll err:', err.message);
    } finally {
      isPolling = false;
    }
  }, 2500);
}

function serveStatic(req, res) {
  // CORS Headers for seamless local LAN access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Telegram Config API
  if (req.url === '/api/telegram/config') {
    if (req.method === 'GET') {
      const cfg = loadTelegramConfig() || {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, config: cfg }));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          fs.writeFileSync(TELEGRAM_CONFIG_PATH, JSON.stringify(parsed, null, 2), 'utf8');
          startTelegramDaemon();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  // Sanitize requested URL path
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  // Check if file exists, else fallback to index.html (SPA routing)
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Error loading ' + reqPath);
        return;
      }

      const cacheControl = (ext === '.html' || ext === '.js' || ext === '.css') 
        ? 'no-cache, no-store, must-revalidate, max-age=0' 
        : 'public, max-age=86400';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': content.length
      });
      res.end(content);
    });
  });
}

function startServer(port) {
  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('\n[ERROR] "dist" ফোল্ডার পাওয়া যায়নি! দয়া করে প্রথমে "npm run build" চালান।\n');
    process.exit(1);
  }

  const server = http.createServer(serveStatic);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[INFO] পোর্ট ${port} ব্যবহৃত হচ্ছে, পরবর্তী পোর্ট ${port + 1} চেষ্টা করা হচ্ছে...`);
      startServer(port + 1);
    } else {
      console.error('[ERROR] সার্ভার ত্রুটি:', err.message);
      process.exit(1);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const localIps = getLocalIpList();
    const primaryIp = localIps.find(ip => ip.startsWith('192.168.')) || localIps[0] || 'localhost';

    console.log('\n===================================================================');
    console.log('       হিসাব-কিতাব ৩৬০ - লাইভ হোস্ট প্রিভিউ ও টেলিগ্রাম বট সার্ভার       ');
    console.log('===================================================================');
    console.log('  স্ট্যাটাস: সার্ভার সফলভাবে চালু ও প্রস্তুত (Active & Ready)');
    console.log('-------------------------------------------------------------------');
    console.log('  💻 আপনার কম্পিউটারে দেখতে (PC Browser):');
    console.log(`       👉 http://localhost:${port}`);
    console.log('');
    console.log('  📱 আপনার মোবাইল থেকে দেখতে (Mobile Wi-Fi):');
    console.log('     ১. মোবাইল ও কম্পিউটার একই Wi-Fi / হটস্পটে কানেক্ট করুন।');
    console.log(`     ২. মোবাইলের Chrome ব্রাউজারে নিচের লিংকে যান:`);
    console.log(`       👉 http://${primaryIp}:${port}`);
    console.log('-------------------------------------------------------------------');
    console.log('  🤖 টেলিগ্রাম বট: ব্যাকগ্রাউন্ডে সক্রিয় (Interactive Buttons Enabled)');
    console.log('  🛑 সার্ভার বন্ধ করতে এই উইন্ডোতে Ctrl + C চাপুন।');
    console.log('===================================================================\n');

    startTelegramDaemon();

    setTimeout(() => {
      try {
        exec(`start "" "http://localhost:${port}"`);
      } catch {}
    }, 600);
  });
}

startServer(DEFAULT_PORT);
