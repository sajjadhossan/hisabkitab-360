// HisabKitab 360 - Version Management
// Auto-incremented on each verified release build

export const APP_VERSION = '2.4.9';
export const BUILD_NUMBER = 295;
export const APP_BUILD_NUMBER = 295;
export const APP_VERSION_NAME = `v${APP_VERSION}`;
export const APP_RELEASE_TAG = `v${APP_VERSION}`;
export const APP_DISPLAY_BADGE = `v${APP_VERSION} (Build ${BUILD_NUMBER})`;
export const APP_RELEASE_DATE = '2026-11-03';
export const RELEASE_CHANNEL = 'stable';
export const RELEASE_DATE = '2026-11-03';
export const APP_APK_FILENAME = `HisabKitab-360-v${APP_VERSION}-build${BUILD_NUMBER}-android.apk`;

export const APP_RELEASE_NOTES = {
  bn: `হিসাবকিতাব ৩৬০ v${APP_VERSION} (Build ${BUILD_NUMBER}) — ডোমেইন ১ (টিপস ১-৫০): পার্সোনাল ও ফ্যামিলি ফিন্যান্স ইকোসিস্টেম (মাল্টি-ওয়ালেট ক্যাশলেস লেজার, এআই বাজেট ভেলোসিটি ও রানওয়ে প্রেডিক্টর, ১-ট্যাপ মাইক্রো-এক্সপেন্স প্যাড এবং পার্সোনাল নিট-সম্পদ সলভেন্সি গেজ) সংযোজিত।`,
  en: `HisabKitab 360 v${APP_VERSION} (Build ${BUILD_NUMBER}) — Domain 1 (Tips 1-50): Personal & Family Finance Ecosystem (Multi-Wallet Cashless Ledger, AI Budget Velocity & Runaway Predictor, 1-Tap Micro-Expense Fast Pad, and Personal Net-Worth Solvency Gauge) integration.`
};

export const VERSION_METADATA = {
  version: APP_VERSION,
  build: BUILD_NUMBER,
  buildNumber: APP_BUILD_NUMBER,
  versionName: APP_VERSION_NAME,
  displayBadge: APP_DISPLAY_BADGE,
  releaseTag: APP_RELEASE_TAG,
  channel: RELEASE_CHANNEL,
  date: RELEASE_DATE,
  releaseDate: APP_RELEASE_DATE,
  name: `v${APP_VERSION} (Build ${BUILD_NUMBER})`,
  apkFilename: APP_APK_FILENAME,
  releaseNotes: APP_RELEASE_NOTES,
  features: [
    'Open-source zero-internet multi-counter LAN WebSocket relay (<10ms latency, 0 server cost)',
    'High-capacity Persistent Storage engine unlocking multi-GB IndexedDB quota',
    'Dual-track hybrid synchronization (Local store WiFi + Supabase / Neon Cloud)',
    'Safe-area dynamic insets protecting Android mobile notches and status bar clipping',
    'Virtual windowing & infinite scrolling for 10,000+ products'
  ]
};

export default VERSION_METADATA;
