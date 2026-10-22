/**
 * Somiti 360 (সমিতি ৩৬০) - High-Speed Production Host & Mobile Preview Server
 * --------------------------------------------------------------------------
 * Serves the pre-compiled production bundle (somiti-360/dist/) on port 5174.
 * Features:
 * - Instant startup (<50ms)
 * - Automatic Local IP / LAN IP detection for phone/tablet testing
 * - Automatic browser launcher to http://localhost:5174
 * - Full SPA route fallback for document verification URLs (/verify?ref=...)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const DIST_DIR = path.join(__dirname, 'somiti-360', 'dist');
const DEFAULT_PORT = 5174;

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

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ name, address: net.address });
      }
    }
  }
  return addresses;
}

function serveStatic(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Normalize path to prevent directory traversal
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\' || safePath === '.') {
      safePath = 'index.html';
    }

    let filePath = path.join(DIST_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
      } else {
        // SPA Fallback: send index.html for all client-side routes
        const fallbackPath = path.join(DIST_DIR, 'index.html');
        fs.readFile(fallbackPath, (fallbackErr, data) => {
          if (fallbackErr) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end('সমিতি ৩৬০ বিল্ড ফাইল পাওয়া যায়নি। দয়া করে "npm run build" চালান।');
          } else {
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=UTF-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
          }
        });
      }
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Internal Server Error: ' + err.message);
  }
}

function startServer(port = DEFAULT_PORT) {
  // Check if dist folder exists
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.log('📦 সমিতি ৩৬০-এর প্রোডাকশন বিল্ড তৈরি করা হচ্ছে...');
    try {
      require('child_process').execSync('npx vite build', { cwd: path.join(__dirname, 'somiti-360'), stdio: 'inherit' });
    } catch (e) {
      console.error('বিল্ড ত্রুটি:', e);
    }
  }

  const server = http.createServer(serveStatic);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ পোর্ট ${port} ব্যস্ত। পরবর্তী পোর্ট ${port + 1}-এ চেষ্টা করা হচ্ছে...`);
      startServer(port + 1);
    } else {
      console.error('সার্ভার ত্রুটি:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const localIps = getLocalIpAddresses();
    console.clear();
    console.log('===================================================================');
    console.log('        🏢 সমিতি ৩৬০ (Somiti 360) - লোকাল ও মোবাইল লাইভ প্রিভিউ');
    console.log('===================================================================');
    console.log('');
    console.log(`  💻 আপনার পিসিতে দেখতে লিংকে ক্লিক করুন:`);
    console.log(`     👉 \x1b[36mhttp://localhost:${port}\x1b[0m`);
    console.log('');
    if (localIps.length > 0) {
      console.log('  📱 একই ওয়াইফাই রাউটারে মোবাইল থেকে টেস্ট করার লিংক:');
      localIps.forEach(ip => {
        console.log(`     👉 \x1b[32mhttp://${ip.address}:${port}\x1b[0m (${ip.name})`);
      });
      console.log('');
      console.log('  💡 টিপস: মোবাইল দিয়ে উপরের লিংকটি ক্রোম বা সাফারি ব্রাউজারে খুলুন।');
    }
    console.log('===================================================================');
    console.log('  সার্ভার রানিং রয়েছে... বন্ধ করতে কিবোর্ডে Ctrl+C চাপুন।');
    console.log('===================================================================');
    console.log('');

    // Open default browser automatically
    const startUrl = `http://localhost:${port}`;
    const startCmd = process.platform === 'win32'
      ? `start "" "${startUrl}"`
      : process.platform === 'darwin'
      ? `open "${startUrl}"`
      : `xdg-open "${startUrl}"`;

    exec(startCmd, () => {});
  });
}

startServer();
