/**
 * HisabKitab 360 - Central Unified Version Registry
 * ---------------------------------------------------------
 * Version Parity Rule:
 * All platforms (Web, Android APK, Windows PC, Desktop)
 * share this exact version and build code.
 * Incremented on every single delivery so user can verify!
 */
export const APP_VERSION = '2.3.8';
export const APP_BUILD_NUMBER = 284;
export const APP_VERSION_NAME = `v${APP_VERSION} (Build ${APP_BUILD_NUMBER})`;
export const APP_DISPLAY_BADGE = `v${APP_VERSION}`;
export const APP_RELEASE_TAG = `v${APP_VERSION}`;
export const APP_RELEASE_DATE = '2026-11-01';
export const APP_APK_FILENAME = `HisabKitab-360-v${APP_VERSION}-build${APP_BUILD_NUMBER}-android.apk`;

export const APP_RELEASE_NOTES = {
  bn: `হিসাবকিতাব ৩৬০ ${APP_VERSION_NAME} — ম্যাকবুক (ইনটেল x64 ও অ্যাপল সিলিকন M1/M2/M3/M4) নেটিভ রিলিজ, টেলিগ্রাম ২০-সেকেন্ড অটো-ব্যাকআপ, লাইভ নোটিফিকেশন ও ভার্সেল প্রোডাকশন সিঙ্ক।`,
  en: `HisabKitab 360 ${APP_VERSION_NAME} — MacBook (Intel x64 & Apple Silicon M-Series) Native Release, Telegram 20s Auto-Backup, Live Alerts & Vercel Production Sync.`
};

export default {
  version: APP_VERSION,
  buildNumber: APP_BUILD_NUMBER,
  versionName: APP_VERSION_NAME,
  displayBadge: APP_DISPLAY_BADGE,
  releaseTag: APP_RELEASE_TAG,
  releaseDate: APP_RELEASE_DATE,
  apkFilename: APP_APK_FILENAME,
  releaseNotes: APP_RELEASE_NOTES
};
