// HisabKitab 360 - Version Management
// Auto-incremented on each verified release build

export const APP_VERSION = '2.4.2';
export const BUILD_NUMBER = 288;
export const APP_BUILD_NUMBER = 288;
export const APP_VERSION_NAME = `v${APP_VERSION}`;
export const APP_RELEASE_TAG = `v${APP_VERSION}`;
export const APP_DISPLAY_BADGE = `v${APP_VERSION} (Build ${BUILD_NUMBER})`;
export const APP_RELEASE_DATE = '2026-11-02';
export const RELEASE_CHANNEL = 'stable';
export const RELEASE_DATE = '2026-11-02';
export const APP_APK_FILENAME = `HisabKitab-360-v${APP_VERSION}-build${BUILD_NUMBER}-android.apk`;

export const APP_RELEASE_NOTES = {
  bn: `হিসাবকিতাব ৩৬০ v${APP_VERSION} (Build ${BUILD_NUMBER}) — ১০০+ ইন্ডাস্ট্রির বিশুদ্ধ ডোমেইন আইসোলেশন, নির্দিষ্ট কলাম, BAJUS গোল্ড, DGDA ড্রাগ মেমো, বাস টিকেট এবং ভার্টিক্যাল স্টাফ রোলস।`,
  en: `HisabKitab 360 v${APP_VERSION} (Build ${BUILD_NUMBER}) — 14-Pillar pure domain isolation across 100+ templates with archetype receipts and vertical roles.`
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
    '14-Pillar pure domain isolation across 100+ industry templates',
    'Domain-specific inventory columns, terminology, and legal receipts',
    'Customized BAJUS gold, DGDA pharmacy, and transport tickets',
    'Archetype-driven vertical staff roles, hotkeys & label printer'
  ]
};

export default VERSION_METADATA;
