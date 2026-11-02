// HisabKitab 360 - Version Management
// Auto-incremented on each verified release build

export const APP_VERSION = '2.4.3';
export const BUILD_NUMBER = 289;
export const APP_BUILD_NUMBER = 289;
export const APP_VERSION_NAME = `v${APP_VERSION}`;
export const APP_RELEASE_TAG = `v${APP_VERSION}`;
export const APP_DISPLAY_BADGE = `v${APP_VERSION} (Build ${BUILD_NUMBER})`;
export const APP_RELEASE_DATE = '2026-11-02';
export const RELEASE_CHANNEL = 'stable';
export const RELEASE_DATE = '2026-11-02';
export const APP_APK_FILENAME = `HisabKitab-360-v${APP_VERSION}-build${BUILD_NUMBER}-android.apk`;

export const APP_RELEASE_NOTES = {
  bn: `হিসাবকিতাব ৩৬০ v${APP_VERSION} (Build ${BUILD_NUMBER}) — ৫০টি বাস্তব অসামঞ্জস্যের সমাধান: বাসের জেন্ডার-লক Pink Protection, ফার্মেসির লুজ ট্যাবলেট ক্যালকুলেটর, রেস্তোরাঁ KOT ও ডোমেইন হেলথ ড্যাশবোর্ড কার্ড।`,
  en: `HisabKitab 360 v${APP_VERSION} (Build ${BUILD_NUMBER}) — Resolution of 50 field discrepancies: bus gender-lock, pharmacy loose tablets, KOT kitchen tickets and domain health KPI cards.`
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
    'Resolution of 50 field friction points across POS, dashboard and templates',
    'Bus Pink Protection gender-lock seat matrix',
    'Pharmacy loose tablet fraction calculator directly to POS cart',
    'Domain-specific KPI and health cards in Business Cockpit'
  ]
};

export default VERSION_METADATA;
