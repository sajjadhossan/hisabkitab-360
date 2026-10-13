/**
 * HisabKitab 360 - Telemetry & Client APM Service
 * -----------------------------------------------
 * Tracks uncaught runtime errors, network latency, offline transitions,
 * and memory metrics to proactively detect bugs before users report them.
 */

class TelemetryService {
  constructor() {
    this.logs = [];
    this.MAX_LOGS = 150;
    this.initialized = false;
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // 1. Capture Unhandled Exceptions
    window.addEventListener('error', (event) => {
      this.captureError('UNCAUGHT_EXCEPTION', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // 2. Capture Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError('UNHANDLED_REJECTION', {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      });
    });

    // 3. Network Online/Offline Events
    window.addEventListener('online', () => this.recordEvent('NETWORK_ONLINE', { time: Date.now() }));
    window.addEventListener('offline', () => this.recordEvent('NETWORK_OFFLINE', { time: Date.now() }));
  }

  captureError(type, payload) {
    const errorEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      payload,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.logs.unshift(errorEntry);
    if (this.logs.length > this.MAX_LOGS) this.logs.pop();
    console.error(`[Telemetry APM] ${type}:`, payload);
  }

  recordEvent(eventName, data = {}) {
    this.logs.unshift({
      id: `evt_${Date.now()}`,
      type: eventName,
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      payload: data
    });
    if (this.logs.length > this.MAX_LOGS) this.logs.pop();
  }

  getRecentLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const telemetryService = new TelemetryService();
