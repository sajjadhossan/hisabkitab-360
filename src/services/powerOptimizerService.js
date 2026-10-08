/**
 * Battery Saver & Low Power Mode Adaptor for Mobile POS Shifts
 * -------------------------------------------------------------
 * Detects battery level, disables heavy CSS filters & animations to prolong
 * smartphone battery during busy 10-12 hour shopkeeper shifts.
 */

let isLowPowerEnabled = localStorage.getItem('hk360_power_saver') === 'true';
let batteryLevel = 1.0;
let isCharging = true;
let listeners = new Set();

export const isLowPowerModeActive = () => isLowPowerEnabled;

const applyPowerClass = () => {
  if (typeof document === 'undefined') return;
  if (isLowPowerEnabled) {
    document.body.classList.add('low-power-mode');
  } else {
    document.body.classList.remove('low-power-mode');
  }
};

export const toggleLowPowerMode = () => {
  isLowPowerEnabled = !isLowPowerEnabled;
  localStorage.setItem('hk360_power_saver', String(isLowPowerEnabled));
  applyPowerClass();
  notifyListeners();
  return isLowPowerEnabled;
};

const notifyListeners = () => {
  const status = {
    isLowPower: isLowPowerEnabled,
    batteryLevel: Math.round(batteryLevel * 100),
    isCharging
  };
  listeners.forEach((fn) => {
    try { fn(status); } catch {}
  });
};

export const subscribeToPowerStatus = (callback) => {
  listeners.add(callback);
  callback({
    isLowPower: isLowPowerEnabled,
    batteryLevel: Math.round(batteryLevel * 100),
    isCharging
  });
  return () => listeners.delete(callback);
};

export const initPowerOptimizer = async () => {
  applyPowerClass();

  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      batteryLevel = battery.level;
      isCharging = battery.charging;

      // Auto-enable low power mode if battery < 20% and not charging
      if (batteryLevel < 0.20 && !isCharging && localStorage.getItem('hk360_power_saver') === null) {
        isLowPowerEnabled = true;
        applyPowerClass();
      }

      battery.addEventListener('levelchange', () => {
        batteryLevel = battery.level;
        if (batteryLevel < 0.20 && !battery.charging) {
          isLowPowerEnabled = true;
          applyPowerClass();
        }
        notifyListeners();
      });

      battery.addEventListener('chargingchange', () => {
        isCharging = battery.charging;
        notifyListeners();
      });

      notifyListeners();
    } catch (err) {
      console.debug('Battery API not available:', err);
    }
  }
};
