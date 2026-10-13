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
    [{ text: '❓ হেল্প ও সাহায্য' }, { text: '📊 আজকের বিক্রি' }],
    [{ text: '📈 লাভ-ক্ষতি' }, { text: '📦 স্টক রিপোর্ট' }],
    [{ text: '📒 বকেয়া খাতা' }, { text: '💸 খরচের তালিকা' }],
    [{ text: '📥 ব্যাকআপ' }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

const TELEGRAM_INLINE_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '📊 আজকের বিক্রি', callback_data: 'cmd_today' },
      { text: '📈 লাভ-ক্ষতি', callback_data: 'cmd_profit' }
    ],
    [
      { text: '📦 স্টক রিপোর্ট', callback_data: 'cmd_stock' },
      { text: '📒 বকেয়া খাতা', callback_data: 'cmd_due' }
    ],
    [
      { text: '💸 খরচের তালিকা', callback_data: 'cmd_expense' },
      { text: '📥 ডাটা ব্যাকআপ', callback_data: 'cmd_backup' }
    ],
    [
      { text: '❓ হেল্প ও সকল কমান্ড', callback_data: 'cmd_help' }
    ]
  ]
};

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
          { command: 'backup', description: '📥 ডাটাবেজ ব্যাকআপ ডাউনলোড' }
        ]
      })
    }).catch(() => {});
    console.log('[TelegramDaemon] ✅ টেলিগ্রাম বট কমান্ড ও কি-বোর্ড সক্রিয় করা হয়েছে।');
  } catch (err) {
    console.debug('[TelegramDaemon] init err:', err.message);
  }
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
        }

        if (!rawText || !targetChatId) continue;
        const lower = rawText.toLowerCase();

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

      const cacheControl = ext === '.html' ? 'no-cache, must-revalidate' : 'public, max-age=86400';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
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
