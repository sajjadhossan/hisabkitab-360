/**
 * HisabKitab 360 - Host & Mobile Preview Runner
 * Spawns Vite development/production preview on 0.0.0.0 and displays exact network URL for Android devices.
 */
const { spawn } = require('child_process');
const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const port = process.env.PORT || 5173;

console.log('====================================================');
console.log('   🚀 HISABKITAB 360 - HOST & MOBILE PREVIEW SERVER');
console.log('====================================================');
console.log(`\n📱 আপনার অ্যান্ড্রয়েড মোবাইল বা অন্য ডিভাইস থেকে ওপেন করুন:`);
console.log(`   👉 http://${localIp}:${port}`);
console.log(`\n💻 আপনার লোকাল কম্পিউটার থেকে ওপেন করুন:`);
console.log(`   👉 http://localhost:${port}\n`);
console.log('⚠️  নোট: মোবাইল ও কম্পিউটার একই Wi-Fi / Hotspot-এ কানেক্টেড থাকতে হবে।');
console.log('====================================================\n');

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['vite', '--host', '0.0.0.0', '--port', String(port)], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`\nServer stopped with code ${code}`);
  process.exit(code || 0);
});
