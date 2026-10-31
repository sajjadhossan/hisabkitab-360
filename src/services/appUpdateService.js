/**
 * Somiti 360 - Central App Version & OTA Update Check Service
 * Complies with Section 10 Version Parity Rules
 */

import { APP_VERSION, APP_BUILD_NUMBER, APP_VERSION_NAME } from '../config/version';

const LAST_CHECK_KEY = 'somiti360_last_version_check';
const DISMISSED_VERSION_KEY = 'somiti360_dismissed_update_version';

/**
 * Check if a newer version of Somiti 360 is published
 */
export const checkForAppUpdate = async (forceManual = false) => {
  try {
    // If not manual, throttle check to at most once per 30 minutes
    if (!forceManual) {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck && Date.now() - parseInt(lastCheck, 10) < 30 * 60 * 1000) {
        return { hasUpdate: false, throttled: true };
      }
    }

    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

    // 1. Primary check via backend API /api/app/version
    let updateData = null;
    try {
      const apiRes = await fetch('/api/app/version', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json?.success && json?.data) {
          updateData = json.data;
        }
      }
    } catch (apiErr) {
      console.debug('Local /api/app/version unreachable, checking fallback:', apiErr);
    }

    // 2. Secondary fallback check via public GitHub Releases API
    if (!updateData) {
      try {
        const ghRes = await fetch('https://api.github.com/repos/sajjadhossan/somiti-360/releases/latest', {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (ghRes.ok) {
          const ghJson = await ghRes.json();
          const tag = (ghJson.tag_name || '').replace(/^v/, '');
          updateData = {
            latestVersion: tag,
            buildNumber: 999, // Fallback high
            minimumSupportedVersion: '2.0.0',
            apkDownloadUrl: ghJson.html_url || 'https://github.com/sajjadhossan/somiti-360/releases/latest',
            releaseNotes: {
              bn: ghJson.body || 'নতুন আপডেট প্রকাশিত হয়েছে। অ্যাপটি আপডেট করে নিন।',
              en: ghJson.body || 'New update available on GitHub releases.'
            },
            forceUpdate: false
          };
        }
      } catch (ghErr) {
        console.debug('GitHub release fallback failed:', ghErr);
      }
    }

    if (!updateData || !updateData.latestVersion) {
      return {
        hasUpdate: false,
        currentVersion: APP_VERSION,
        currentBuild: APP_BUILD_NUMBER,
        message: 'সর্বশেষ ভার্সন সক্রিয় রয়েছে।'
      };
    }

    // Compare build numbers or semantic versions
    const serverBuild = parseInt(updateData.buildNumber, 10) || 0;
    const serverVer = String(updateData.latestVersion).replace(/^v/, '').trim();
    const currentVer = String(APP_VERSION).replace(/^v/, '').trim();

    const isNewerBuild = serverBuild > APP_BUILD_NUMBER;
    const isNewerVer = isSemanticVersionNewer(serverVer, currentVer);
    const hasUpdate = isNewerBuild || isNewerVer;

    // Check if dismissed before (unless forceManual or forceUpdate)
    if (hasUpdate && !forceManual && !updateData.forceUpdate) {
      const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
      if (dismissed === updateData.latestVersion) {
        return { hasUpdate: false, dismissed: true };
      }
    }

    return {
      hasUpdate,
      currentVersion: APP_VERSION_NAME,
      latestVersion: `v${updateData.latestVersion}`,
      currentBuild: APP_BUILD_NUMBER,
      latestBuild: updateData.buildNumber,
      releaseNotes: updateData.releaseNotes || {},
      apkDownloadUrl: updateData.apkDownloadUrl || 'https://github.com/sajjadhossan/somiti-360/releases/latest',
      forceUpdate: Boolean(updateData.forceUpdate),
      releaseDate: updateData.releaseDate
    };
  } catch (err) {
    console.warn('App update verification error:', err);
    return {
      hasUpdate: false,
      error: err.message,
      currentVersion: APP_VERSION_NAME
    };
  }
};

/**
 * Dismiss an update for the current session
 */
export const dismissAppUpdate = (version) => {
  try {
    localStorage.setItem(DISMISSED_VERSION_KEY, String(version));
  } catch {}
};

/**
 * Compare two semver strings: returns true if vA > vB
 */
function isSemanticVersionNewer(vA, vB) {
  const partsA = vA.split('.').map(n => parseInt(n, 10) || 0);
  const partsB = vB.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] || 0;
    const b = partsB[i] || 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}
