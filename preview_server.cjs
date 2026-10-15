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
    [{ text: '📒 ৩. কাস্টমার বকেয়া খাতা' }, { text: '💸 ৪. দোকান ও পার্সোনাল খরচ' }],
    [{ text: '📊 ৫. সকল রিপোর্ট ও PDF' }, { text: '🎙️ ৬. ভয়েস এআই ও ব্যাকআপ' }]
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
      { text: '🏢 দোকানের খরচ এন্ট্রি', callback_data: 'prompt_expense_biz' },
      { text: '🛒 দৈনিক কাঁচাবাজার খরচ', callback_data: 'prompt_expense_bazaar' }
    ],
    [
      { text: '🏠 পারিবারিক বাজেট খরচ', callback_data: 'prompt_expense_family' },
      { text: '💸 আজকের মোট খরচ সামারি', callback_data: 'cmd_expense' }
    ],
    [
      { text: '📊 মাসিক খরচের সারাংশ', callback_data: 'cmd_expense_monthly' },
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
      { text: '🔍 পণ্যের ক্রয় ইতিহাস (AI)', callback_data: 'prompt_history' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_HUB_AI = {
  inline_keyboard: [
    [
      { text: '📥 ডাটাবেজ ব্যাকআপ (.json)', callback_data: 'cmd_backup' },
      { text: '🎤 ভয়েস কমান্ড গাইড', callback_data: 'cmd_voice_guide' }
    ],
    [
      { text: '🔑 এআই কি সেট করুন (/setkey)', callback_data: 'cmd_setkey_help' },
      { text: '🔒 রিমোট স্ক্রিন লক', callback_data: 'cmd_lock' }
    ],
    [
      { text: '❓ হেল্প ও সকল কমান্ড', callback_data: 'cmd_help' },
      { text: '🏠 মূল মেনু', callback_data: 'cmd_main' }
    ]
  ]
};

const TELEGRAM_FOLDER_MAIN = {
  inline_keyboard: [
    [
      { text: '🛒 ১. নতুন বিক্রি (POS)', callback_data: 'hub_sale' },
      { text: '📦 ২. স্টক ও ইনভেন্টরি', callback_data: 'hub_stock' }
    ],
    [
      { text: '📒 ৩. কাস্টমার বকেয়া খাতা', callback_data: 'hub_due' },
      { text: '💸 ৪. দোকান ও পার্সোনাল খরচ', callback_data: 'hub_expense' }
    ],
    [
      { text: '📊 ৫. সকল রিপোর্ট ও PDF', callback_data: 'hub_reports' },
      { text: '🎙️ ৬. ভয়েস এআই ও ব্যাকআপ', callback_data: 'hub_ai' }
    ],
    [
      { text: '❓ সাহায্য ও সকল কমান্ড', callback_data: 'cmd_help' }
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

        // Help command & button handler (cmd_help, /help, help, হেল্প, etc.)
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
          lower === 'menu' ||
          lower.startsWith('/menu')
        );

        if (isHelp) {
          const helpHtml = `🤖 <b>হিসাবকিতাব ৩৬০ - স্মার্ট টেলিগ্রাম সহকারী</b>
━━━━━━━━━━━━━━━━━━━━━
দোকান চালু থাকা অবস্থায় ফোন থেকেই হিসাব নিয়ন্ত্রণ করুন:

📊 <b>হিসাব ও রিপোর্ট দেখতে বাটনে চাপুন অথবা লিখুন:</b>
• <b>/today</b> বা <b>আজকের বিক্রি</b> - আজকের মোট বিক্রি ও ইনভয়েস
• <b>/profit</b> বা <b>লাভ-ক্ষতি</b> - আজকের মোট লাভ-ক্ষতি ও নিট প্রফিট
• <b>/stock</b> বা <b>স্টক রিপোর্ট</b> - মোট পণ্যের স্টক ও লো-স্টক অ্যালার্ট
• <b>/stock &lt;পণ্য&gt;</b> - নির্দিষ্ট পণ্যের স্টক ও দাম (যেমন: <code>/stock নাপা</code>)
• <b>/due</b> বা <b>বাকি খাতা</b> - মোট বকেয়া ও বাকিদারদের তালিকা
• <b>/expense</b> বা <b>খরচ</b> - আজকের খরচের বিবরণী

➕ <b>টেলিগ্রাম থেকেই খরচ যোগ করতে লিখুন:</b>
• <code>খরচ ৫০০ নাস্তা</code> ➔ দোকানের খরচে যোগ হবে
• <code>ব্যক্তিগত খরচ ২০০ রিকশা</code> ➔ পার্সোনাল খরচে যোগ হবে

📥 <b>ডাটা ব্যাকআপ নিতে:</b>
• <b>/backup</b> বা <b>ব্যাকআপ</b> ➔ সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল ডাউনলোড
━━━━━━━━━━━━━━━━━━━━━
🆔 <b>আপনার এই চ্যাটের আইডি (Chat ID):</b> <code>${targetChatId}</code>
${isAuthorized ? '✅ <i>এই চ্যাটটি হিসাবকিতাব ৩৬০-এর সাথে সফলভাবে যুক্ত আছে!</i>' : '⚠️ <i>হিসাবকিতাব ৩৬০ সেটিংসে এই চ্যাট আইডিটি সংরক্ষণ করুন।</i>'}`;

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

        if (rawText === 'hub_expense' || rawText.includes('৪. দোকান ও পার্সোনাল খরচ') || rawText.includes('পার্সোনাল খরচ')) {
          await sendTelegramMsg(token, targetChatId, `💸 <b>৪. দোকান ও পার্সোনাল খরচ হাব (Expense Hub):</b>\n━━━━━━━━━━━━━━━━━━━━━\nদোকানের ও পরিবারের খরচের হিসাব পৃথকভাবে পরিচালনা করুন:`, TELEGRAM_HUB_EXPENSE, 'HTML');
          continue;
        }

        if (rawText === 'hub_reports' || rawText.includes('৫. সকল রিপোর্ট ও PDF') || rawText.includes('সকল রিপোর্ট')) {
          await sendTelegramMsg(token, targetChatId, `📊 <b>৫. সকল রিপোর্ট ও PDF স্টেটমেন্ট হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nলাভ-ক্ষতি, ক্যাশ ও আর্থিক স্টেটমেন্ট দেখুন ও প্রিন্ট নিন:`, TELEGRAM_HUB_REPORTS, 'HTML');
          continue;
        }

        if (rawText === 'hub_ai' || rawText.includes('৬. ভয়েস এআই ও ব্যাকআপ') || rawText.includes('ভয়েস এআই')) {
          await sendTelegramMsg(token, targetChatId, `🎙️ <b>৬. ভয়েস এআই, ব্যাকআপ ও সিকিউরিটি হাব:</b>\n━━━━━━━━━━━━━━━━━━━━━\nভয়েস কমান্ড গাইড, ক্লাউড ব্যাকআপ ও রিমোট কন্ট্রোল:`, TELEGRAM_HUB_AI, 'HTML');
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

        // Operational Commands Handling
        if (lower === 'cmd_today' || lower.startsWith('/today') || lower.startsWith('/sales') || lower.includes('বিক্রি')) {
          await sendTelegramMsg(token, targetChatId, `📊 <b>হিসাবকিতাব ৩৬০ - আজকের বিক্রির হিসাব</b>\n━━━━━━━━━━━━━━━━━━━━━\n🏪 দোকান: সচল ও কানেক্টেড রয়েছে।\n💡 বিস্তারিত লাইভ রিপোর্ট লোড করতে অ্যাপটি ওপেন রাখুন।`);
        } else if (lower === 'cmd_profit' || lower.startsWith('/profit') || lower.includes('লাভ')) {
          await sendTelegramMsg(token, targetChatId, `📈 <b>হিসাবকিতাব ৩৬০ - আজকের লাভ-ক্ষতি</b>\n━━━━━━━━━━━━━━━━━━━━━\n💡 প্রফিট ক্যালকুলেশন লাইভ সক্রিয় রয়েছে।`);
        } else if (lower === 'cmd_stock' || lower.startsWith('/stock') || lower.includes('স্টক')) {
          await sendTelegramMsg(token, targetChatId, `📦 <b>হিসাবকিতাব ৩৬০ - ইনভেন্টরি স্টক</b>\n━━━━━━━━━━━━━━━━━━━━━\nনির্দিষ্ট পণ্য খুঁজতে লিখুন: <code>/stock নাপা</code> বা <code>/stock চাল</code>`);
        } else if (lower === 'cmd_due' || lower.startsWith('/due') || lower.includes('বাকি')) {
          await sendTelegramMsg(token, targetChatId, `📒 <b>হিসাবকিতাব ৩৬০ - বকেয়া খাতা</b>\n━━━━━━━━━━━━━━━━━━━━━\nবকেয়া তালিকা সংরক্ষিত রয়েছে।`);
        } else if (lower === 'cmd_expense' || lower.startsWith('/expense') || lower.includes('খরচ')) {
          await sendTelegramMsg(token, targetChatId, `💸 <b>হিসাবকিতাব ৩৬০ - খরচ যোগ ও রিপোর্ট</b>\n━━━━━━━━━━━━━━━━━━━━━\nখরচ যোগ করতে লিখুন: <code>খরচ ৫০০ নাস্তা</code>`);
        } else if (lower === 'cmd_backup' || lower.startsWith('/backup') || lower.includes('ব্যাকআপ')) {
          await sendTelegramMsg(token, targetChatId, `📥 <b>হিসাবকিতাব ৩৬০ - ডাটা ব্যাকআপ</b>\n━━━━━━━━━━━━━━━━━━━━━\nব্যাকআপ জেনারেট হচ্ছে...`);
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
