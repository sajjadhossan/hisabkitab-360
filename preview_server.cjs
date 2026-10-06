/**
 * HisabKitab 360 - Host & Mobile Preview Server
 */
process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

const { createServer } = require('vite');
const os = require('os');
const { exec, execSync } = require('child_process');
const path = require('path');

function freePort(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = out.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /F /PID ${pid} >nul 2>nul`);
          } catch {}
        }
      }
    }
  } catch {}
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  const preferred = ips.find(ip => ip.startsWith('192.168.'));
  return preferred || ips[0] || 'localhost';
}

async function start() {
  const port = 5173;
  freePort(port);

  const localIp = getLocalIp();

  console.log('===================================================================');
  console.log('       HISABKITAB 360 - MOBILE AND LOCAL HOST PREVIEW SERVER       ');
  console.log('===================================================================');
  console.log('\n[1] সার্ভার লোড হচ্ছে...');

  try {
    const server = await createServer({
      root: __dirname,
      server: {
        host: '0.0.0.0',
        port: port,
        strictPort: true
      }
    });

    await server.listen();

    console.log('\n===================================================================');
    console.log('🚀 সার্ভার সফলভাবে চালু হয়েছে!');
    console.log('===================================================================');
    console.log('\n💻 আপনার কম্পিউটারের ব্রাউজারে দেখতে:');
    console.log(`      👉 http://localhost:${port}`);
    console.log('\n📱 আপনার অ্যান্ড্রয়েড মোবাইল থেকে দেখতে:');
    console.log('   ১. মোবাইল ও কম্পিউটার একই Wi-Fi বা মোবাইল হটস্পটে কানেক্ট করুন।');
    console.log('   ২. মোবাইলের যেকোনো ব্রাউজার (Chrome) খুলে নিচের লিংকে যান:');
    console.log(`\n      👉 http://${localIp}:${port}\n`);
    console.log('💡 টিপস: যদি মোবাইল থেকে না ঢুকে:');
    console.log('   - নিশ্চিত করুন মোবাইল ও ল্যাপটপ একই Wi-Fi নেটওয়ার্কে আছে।');
    console.log('   - ল্যাপটপ থেকে "Mobile Hotspot" চালু করে ফোনে কানেক্ট করতে পারেন।');
    console.log('===================================================================');
    console.log('🛑 সার্ভার বন্ধ করতে কিবোর্ডে Ctrl + C চাপুন।\n');

    // Automatically open in default browser on PC
    setTimeout(() => {
      try {
        exec(`start http://localhost:${port}`);
      } catch {}
    }, 1200);

  } catch (err) {
    console.error('\n[ERROR] সার্ভার চালু করতে সমস্যা হয়েছে:', err.message || err);
    process.exit(1);
  }
}

start();
