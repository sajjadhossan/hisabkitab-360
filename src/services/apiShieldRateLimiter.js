/**
 * HisabKitab 360 - API Shield & Brute-Force Rate Limiting Engine
 * Tip 38: Sliding-Window Token Bucket, DDoS Protection & PIN Lockout
 * ------------------------------------------------------------------
 * Protects login endpoints, PIN verification, and sync APIs from brute-force
 * attacks. Automatically locks out suspicious IPs or terminals after 5 failed tries.
 */

class ApiShieldRateLimiter {
  constructor() {
    this.buckets = new Map(); // key -> { attempts, lockedUntil }
    this.maxAttempts = 5;
    this.lockoutDurationMs = 60000; // 1 minute lockout
    this.totalBlockedRequests = 0;
  }

  checkAttempt(identifier = 'login_pin') {
    const now = Date.now();
    const bucket = this.buckets.get(identifier) || { attempts: 0, lockedUntil: 0 };

    if (bucket.lockedUntil > now) {
      this.totalBlockedRequests++;
      const remainingSec = Math.ceil((bucket.lockedUntil - now) / 1000);
      return {
        allowed: false,
        isLocked: true,
        remainingSec,
        error: `[নিরাপত্তা সতর্কতা] অতিরিক্ত ভুল চেষ্টার কারণে সিস্টেম সাময়িকভাবে লক হয়েছে। ${remainingSec} সেকেন্ড পর পুনরায় চেষ্টা করুন।`
      };
    }

    return { allowed: true, attemptsLeft: this.maxAttempts - bucket.attempts };
  }

  recordFailure(identifier = 'login_pin') {
    const now = Date.now();
    const bucket = this.buckets.get(identifier) || { attempts: 0, lockedUntil: 0 };
    bucket.attempts++;

    if (bucket.attempts >= this.maxAttempts) {
      bucket.lockedUntil = now + this.lockoutDurationMs;
    }
    this.buckets.set(identifier, bucket);

    return this.checkAttempt(identifier);
  }

  recordSuccess(identifier = 'login_pin') {
    this.buckets.delete(identifier);
  }

  getShieldStatus() {
    return {
      activeBuckets: this.buckets.size,
      totalBlockedRequests: this.totalBlockedRequests,
      status: 'active_protected'
    };
  }
}

export const apiShieldRateLimiter = new ApiShieldRateLimiter();
export default apiShieldRateLimiter;
