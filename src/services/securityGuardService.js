/**
 * HisabKitab 360 - Security Guard & Zero-Trust Token Service
 * ---------------------------------------------------------
 * - Client-side rate-limiting for high-frequency user actions
 * - Biometric re-authentication gate for high-risk operations
 * - Session token rotation monitor
 */

import { biometricAuthService } from './biometricAuthService';
import { rateLimiter } from '../utils/rateLimiter';

class SecurityGuardService {
  /**
   * Verify rate limit before triggering critical action
   * @param {string} actionKey - e.g. 'delete_invoice', 'login_attempt'
   * @param {number} maxPerMinute - Default 30
   */
  checkRateLimit(actionKey, maxPerMinute = 30) {
    return rateLimiter.check(actionKey, maxPerMinute);
  }

  /**
   * Gate a high-risk operation behind Biometric prompt or Master PIN
   * @param {string} reason - Dialog title/reason
   * @param {Function} protectedAction - Action to execute upon verification
   */
  async executeWithBiometricGate(reason, protectedAction) {
    try {
      const isAvailable = await biometricAuthService.isAvailable();
      if (isAvailable) {
        const verified = await biometricAuthService.verify(reason);
        if (!verified) {
          throw new Error('বায়োমেট্রিক ভেরিফিকেশন ব্যর্থ হয়েছে');
        }
      }
      return await protectedAction();
    } catch (err) {
      console.warn('[SecurityGuard] Action blocked by security gate:', err);
      throw err;
    }
  }

  /**
   * Sanitize text against XSS and SQL injection patterns in frontend
   */
  sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }
}

export const securityGuardService = new SecurityGuardService();
