/**
 * HisabKitab 360 - Micro-Interactions & Haptics Engine
 * ----------------------------------------------------
 * Provides subtle tactile and vibration feedback for touch devices,
 * POS quick keys, barcode scans, and payment confirmations.
 * Compatible with Browser Web Vibration API and Capacitor Haptics.
 */

export const HapticPattern = {
  LIGHT: 'light',       // 10ms click on button tap
  MEDIUM: 'medium',     // 25ms on selection / add to cart
  HEAVY: 'heavy',       // 50ms on invoice completion
  SUCCESS: 'success',   // double tap 20ms-50ms-20ms
  WARNING: 'warning',   // 40ms pulse
  ERROR: 'error'        // 80ms-40ms-80ms vibration
};

export function triggerHaptic(pattern = HapticPattern.LIGHT) {
  try {
    // 1. Try Capacitor Native Haptics if available
    if (window?.Capacitor?.isPluginAvailable?.('Haptics')) {
      const Haptics = window.Capacitor.Plugins?.Haptics;
      if (Haptics) {
        if (pattern === HapticPattern.LIGHT) Haptics.impact({ style: 'Light' });
        else if (pattern === HapticPattern.MEDIUM) Haptics.impact({ style: 'Medium' });
        else if (pattern === HapticPattern.HEAVY) Haptics.impact({ style: 'Heavy' });
        else if (pattern === HapticPattern.SUCCESS) Haptics.notification({ type: 'SUCCESS' });
        else if (pattern === HapticPattern.WARNING) Haptics.notification({ type: 'WARNING' });
        else if (pattern === HapticPattern.ERROR) Haptics.notification({ type: 'ERROR' });
        return;
      }
    }

    // 2. Fallback to Browser Vibration API
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      switch (pattern) {
        case HapticPattern.LIGHT:
          navigator.vibrate(10);
          break;
        case HapticPattern.MEDIUM:
          navigator.vibrate(25);
          break;
        case HapticPattern.HEAVY:
          navigator.vibrate(55);
          break;
        case HapticPattern.SUCCESS:
          navigator.vibrate([20, 40, 25]);
          break;
        case HapticPattern.WARNING:
          navigator.vibrate([35, 30, 35]);
          break;
        case HapticPattern.ERROR:
          navigator.vibrate([70, 50, 70]);
          break;
        default:
          navigator.vibrate(15);
      }
    }
  } catch (err) {
    // Non-blocking
  }
}
