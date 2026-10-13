/**
 * HisabKitab 360 - Lamport Timestamps & Vector Clocks Engine
 * ---------------------------------------------------------
 * Provides causal ordering across multiple POS counters:
 * - Guarantees deterministic invoice sequencing even when device clocks drift by minutes/hours.
 * - Generates monotonic logical sequence numbers per counter.
 * - Handles offline multi-branch conflict-free merges.
 */

const STORAGE_VCLOCK_KEY = 'hk360_active_vector_clock';

class VectorClockEngine {
  constructor() {
    this.localCounterId = 'CNT-01';
    this.clock = this._loadClock();
    this.lamportTime = 0;
  }

  _loadClock() {
    try {
      const raw = localStorage.getItem(STORAGE_VCLOCK_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _saveClock() {
    try {
      localStorage.setItem(STORAGE_VCLOCK_KEY, JSON.stringify(this.clock));
    } catch {
      // non-blocking
    }
  }

  setCounterId(counterId) {
    if (counterId) {
      this.localCounterId = counterId;
    }
  }

  /**
   * Generates next logical timestamp for a local transaction
   * @param {string} counterId - Optional counter ID
   * @returns {{ vectorClock: object, lamportTime: number, sequenceTag: string }}
   */
  tick(counterId = null) {
    const id = counterId || this.localCounterId;
    const currentSeq = this.clock[id] || 0;
    const nextSeq = currentSeq + 1;

    this.clock[id] = nextSeq;
    this.lamportTime = Math.max(this.lamportTime, nextSeq) + 1;

    this._saveClock();

    const sequenceTag = `VC::${id}#${nextSeq}::L${this.lamportTime}`;

    return {
      vectorClock: { ...this.clock },
      lamportTime: this.lamportTime,
      sequenceTag
    };
  }

  /**
   * Merge external vector clock from incoming cloud delta
   */
  merge(incomingClock) {
    if (!incomingClock || typeof incomingClock !== 'object') return;

    for (const [counterId, seq] of Object.entries(incomingClock)) {
      const localSeq = this.clock[counterId] || 0;
      this.clock[counterId] = Math.max(localSeq, Number(seq) || 0);
      this.lamportTime = Math.max(this.lamportTime, Number(seq) || 0) + 1;
    }

    this._saveClock();
  }

  getSnapshot() {
    return {
      localCounterId: this.localCounterId,
      clock: { ...this.clock },
      lamportTime: this.lamportTime
    };
  }
}

export const vectorClock = new VectorClockEngine();
