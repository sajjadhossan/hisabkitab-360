/**
 * HisabKitab 360 - Client-Side Circuit Breaker Engine
 * --------------------------------------------------
 * Protects POS cashier UI from network freezes and slow timeouts:
 * - States:
 *   - CLOSED: Normal operation, cloud requests execute normally.
 *   - OPEN: Tripped due to network errors/latency spikes. Fast-fails in 0ms to Local-First mode!
 *   - HALF_OPEN: Probing cloud health with single test request before fully recovering.
 * - Auto-recovers when network health stabilizes.
 */

export const CIRCUIT_STATE = {
  CLOSED: 'CLOSED',       // Cloud Healthy
  OPEN: 'OPEN',           // Cloud Degraded (Local-First Active)
  HALF_OPEN: 'HALF_OPEN'  // Testing recovery
};

class CircuitBreakerService {
  constructor() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.failureThreshold = 3;
    this.recoveryTimeoutMs = 15000; // 15 seconds cooldown
    this.lastStateChange = Date.now();
    this.listeners = new Set();
  }

  /**
   * Subscribe to circuit state transitions
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.getStatus());
      } catch (err) {
        console.warn('Circuit breaker listener error', err);
      }
    });
  }

  /**
   * Execute an operation guarded by the circuit breaker
   * @param {Function} networkFn - Async function performing network call
   * @param {Function} fallbackFn - Fast synchronous/asynchronous local fallback
   */
  async execute(networkFn, fallbackFn) {
    const now = Date.now();

    // Check if recovery probe should begin
    if (this.state === CIRCUIT_STATE.OPEN) {
      if (now - this.lastStateChange > this.recoveryTimeoutMs) {
        this.state = CIRCUIT_STATE.HALF_OPEN;
        this.lastStateChange = now;
        this._notify();
      } else {
        // Fast fail: 0ms fallback execution
        if (typeof fallbackFn === 'function') {
          return fallbackFn();
        }
        throw new Error('Circuit Breaker is OPEN: Cloud degraded, local-first active.');
      }
    }

    try {
      const result = await networkFn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(err);
      if (typeof fallbackFn === 'function') {
        return fallbackFn();
      }
      throw err;
    }
  }

  recordSuccess() {
    this.failureCount = 0;
    if (this.state !== CIRCUIT_STATE.CLOSED) {
      this.state = CIRCUIT_STATE.CLOSED;
      this.lastStateChange = Date.now();
      this._notify();
    }
  }

  recordFailure(err) {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold || this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.state = CIRCUIT_STATE.OPEN;
      this.lastStateChange = Date.now();
      this._notify();
    }
  }

  /**
   * Manual testing helpers
   */
  tripCircuit() {
    this.state = CIRCUIT_STATE.OPEN;
    this.failureCount = this.failureThreshold;
    this.lastStateChange = Date.now();
    this._notify();
  }

  resetCircuit() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.lastStateChange = Date.now();
    this._notify();
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      lastStateChange: new Date(this.lastStateChange).toLocaleTimeString(),
      isDegraded: this.state !== CIRCUIT_STATE.CLOSED
    };
  }
}

export const circuitBreaker = new CircuitBreakerService();
