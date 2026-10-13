/**
 * HisabKitab 360 - Form Crash & Power-Loss Draft Protection Engine
 * Tip 30: Instant Micro-Snapshots & Automated Recovery
 * ---------------------------------------------------------------
 * Continuously persists in-flight cart entries, invoice drafts, and form fields.
 * If power cuts, battery dies, or browser tab crashes, the cashier can restore
 * the exact draft with 1-click on the next boot.
 */

const STORAGE_CRASH_DRAFT_PREFIX = 'hk360_active_draft_';

class FormCrashDraftService {
  saveDraft(formId = 'pos_cart', data = {}) {
    if (!formId || !data) return;
    try {
      const payload = {
        formId,
        data,
        savedAt: new Date().toISOString(),
        version: Date.now()
      };
      localStorage.setItem(`${STORAGE_CRASH_DRAFT_PREFIX}${formId}`, JSON.stringify(payload));
    } catch {}
  }

  getDraft(formId = 'pos_cart') {
    try {
      const raw = localStorage.getItem(`${STORAGE_CRASH_DRAFT_PREFIX}${formId}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  clearDraft(formId = 'pos_cart') {
    try {
      localStorage.removeItem(`${STORAGE_CRASH_DRAFT_PREFIX}${formId}`);
    } catch {}
  }

  getAllPendingDrafts() {
    const drafts = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_CRASH_DRAFT_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            drafts.push(JSON.parse(raw));
          }
        }
      }
    } catch {}
    return drafts;
  }
}

export const formCrashDraftService = new FormCrashDraftService();
export default formCrashDraftService;
