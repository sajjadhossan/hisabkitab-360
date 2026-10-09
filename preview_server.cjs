/**
 * HisabKitab 360 - High-Speed Production Host & Mobile Preview Server
 * -------------------------------------------------------------------
 * Serves the pre-compiled, optimized production bundle (dist/) with
 * zero lag, robust SPA routing, automatic port discovery, and mobile Wi-Fi access.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const DEFAULT_PORT = 5173;

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

function serveStatic(req, res) {
  // CORS Headers for seamless local LAN access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
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

      // Cache control: assets with hash cache for 1 day, HTML no-cache for instant updates
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
    console.log('       হিসাব-কিতাব ৩৬০ - লাইভ হোস্ট প্রিভিউ সার্ভার (HisabKitab 360)      ');
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
    console.log('  🛑 সার্ভার বন্ধ করতে এই উইন্ডোতে Ctrl + C চাপুন।');
    console.log('===================================================================\n');

    // Auto open in default browser on PC
    setTimeout(() => {
      try {
        exec(`start "" "http://localhost:${port}"`);
      } catch {}
    }, 600);
  });
}

startServer(DEFAULT_PORT);
