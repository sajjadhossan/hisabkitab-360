/**
 * HisabKitab 360 - Host & Mobile Preview Server
 * Native Vite programmatic integration with zero shell spawn issues.
 */
const { createServer } = require('vite');
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

async function start() {
  const localIp = getLocalIp();
  const port = parseInt(process.env.PORT, 10) || 5173;

  console.log('===================================================================');
  console.log('       HISABKITAB 360 - MOBILE & LOCAL HOST PREVIEW SERVER         ');
  console.log('===================================================================');
  console.log('\n[1] সার্ভার লোড হচ্ছে...');

  try {
    const server = await createServer({
      server: {
        host: '0.0.0.0',
        port: port,
        strictPort: false
      }
    });

    await server.listen();

    const actualPort = server.config.server.port || port;

    console.log('\n===================================================================');
    console.log('📱 আপনার অ্যান্ড্রয়েড মোবাইল থেকে যেভাবে ওপেন করবেন:');
    console.log('   ১. আপনার মোবাইল এবং এই কম্পিউটার একই Wi-Fi বা হটস্পটে কানেক্ট করুন।');
    console.log('   ২. মোবাইলের Chrome বা যেকোনো ব্রাউজারে নিচের লিংকে যান:');
    console.log(`\n      👉 http://${localIp}:${actualPort}\n`);
    console.log('💻 লোকাল কম্পিউটার ব্রাউজারে দেখতে:');
    console.log(`      👉 http://localhost:${actualPort}\n`);
    console.log('🛑 সার্ভার বন্ধ করতে এই উইন্ডোতে Ctrl + C চাপুন।');
    console.log('===================================================================\n');

  } catch (err) {
    console.error('সার্ভার চালু করতে সমস্যা হয়েছে:', err);
    process.exit(1);
  }
}

start();
