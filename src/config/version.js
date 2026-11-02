// HisabKitab 360 - Version Management
// Auto-incremented on each verified release build

export const APP_VERSION = '2.4.4';
export const BUILD_NUMBER = 290;
export const APP_BUILD_NUMBER = 290;
export const APP_VERSION_NAME = `v${APP_VERSION}`;
export const APP_RELEASE_TAG = `v${APP_VERSION}`;
export const APP_DISPLAY_BADGE = `v${APP_VERSION} (Build ${BUILD_NUMBER})`;
export const APP_RELEASE_DATE = '2026-11-02';
export const RELEASE_CHANNEL = 'stable';
export const RELEASE_DATE = '2026-11-02';
export const APP_APK_FILENAME = `HisabKitab-360-v${APP_VERSION}-build${BUILD_NUMBER}-android.apk`;

export const APP_RELEASE_NOTES = {
  bn: `হিসাবকিতাব ৩৬০ v${APP_VERSION} (Build ${BUILD_NUMBER}) — থার্মাল রসিদে স্বয়ংক্রিয় জুয়েলারি ওজন-ক্যারেট-মজুরি, বাস সিট জেন্ডার ও ফার্মেসি ব্যাচ নম্বর মেটাডাটা সরাসরি ইন্টিগ্রেশন।`,
  en: `HisabKitab 360 v${APP_VERSION} (Build ${BUILD_NUMBER}) — Receipt thermal integration of jewelry weight-carat-making charges, bus gender seat tagging, and pharmacy FEFO batch metadata.`
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
    'Direct thermal receipt metadata for gold weight, karat, and making charge',
    'Bus passenger gender tag and seat print on receipts',
    'Pharmacy batch and FEFO expiry print on customer slips',
    'Zero-friction domain alignment between POS calculations and final invoice'
  ]
};

export default VERSION_METADATA;
