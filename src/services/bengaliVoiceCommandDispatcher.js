/**
 * HisabKitab 360 - AI Bengali Voice Command & POS Dispatcher (Tip 45)
 * Bengali natural language processing engine and Web Speech API wrapper.
 * Decodes retail intents and automatically triggers POS actions with Bengali voice feedback.
 */

class BengaliVoiceCommandDispatcher {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.listeners = new Set();
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'bn-BD'; // Bengali (Bangladesh)

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          this.handleTranscript(transcript);
        };

        this.recognition.onerror = (err) => {
          this.isListening = false;
          this.notifyListeners({ type: 'ERROR', error: err.error });
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.notifyListeners({ type: 'STATUS', isListening: false });
        };
      }
    }
  }

  /**
   * Parse Bengali text for retail intent & parameters
   */
  parseIntent(text = '') {
    if (!text) return { intent: 'UNKNOWN', confidence: 0 };
    const query = text.trim();

    // 1. Add to Cart / Sell Item (e.g., "৫ কেজি চাল বিক্রি করো", "২ পিস সাবান যোগ করো")
    if (/(?:বিক্রি|যোগ|দাও|অ্যাড|বিল|কার্ট)/.test(query)) {
      // Extract quantity (Bengali or English digit)
      const qtyMatch = query.match(/(\d+|[০-৯]+)\s*(?:কেজি|পিস|লিটার|টা|কার্টন|kg|pcs)?/);
      let quantity = 1;
      if (qtyMatch) {
        const bnDigits = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
        const rawNum = qtyMatch[1];
        if (/[০-৯]/.test(rawNum)) {
          quantity = Number(rawNum.split('').map(c => bnDigits[c] !== undefined ? bnDigits[c] : c).join(''));
        } else {
          quantity = Number(rawNum);
        }
      }

      // Extract item name by removing keywords
      const cleaned = query
        .replace(/(\d+|[০-৯]+)\s*(?:কেজি|পিস|লিটার|টা|কার্টন|kg|pcs)?/g, '')
        .replace(/(?:বিক্রি|করো|যোগ|দাও|অ্যাড|বিল|কার্ট|টাকার)/g, '')
        .trim();

      return {
        intent: 'ADD_TO_CART',
        productQuery: cleaned || 'চাল',
        quantity: quantity || 1,
        rawText: query
      };
    }

    // 2. Due Ledger Inquiry ("বাকি কত আছে", "মোট বকেয়া কত")
    if (/(?:বাকি|বকেয়া|পাওনা|বাকির হিসাব)/.test(query)) {
      return {
        intent: 'INQUIRE_DUE',
        rawText: query
      };
    }

    // 3. Today's Sales / Cash Summary ("আজকের বিক্রি কত", "ক্যাশ রিপোর্ট")
    if (/(?:আজকের বিক্রি|মোট বিক্রি|ক্যাশ রিপোর্ট|দৈনিক হিসাব|আজকের কালেকশন)/.test(query)) {
      return {
        intent: 'SALES_SUMMARY',
        rawText: query
      };
    }

    // 4. Print Memo / Receipt ("মেমো প্রিন্ট করো", "রশিদ দাও")
    if (/(?:প্রিন্ট|রশিদ|মেমো ছাপাও|রসিদ)/.test(query)) {
      return {
        intent: 'PRINT_RECEIPT',
        rawText: query
      };
    }

    // 5. Open Cash Drawer ("ড্রয়ার খোলো", "ক্যাশ ড্রয়ার")
    if (/(?:ড্রয়ার|ক্যাশ বক্স|খোলো)/.test(query)) {
      return {
        intent: 'OPEN_DRAWER',
        rawText: query
      };
    }

    // 6. Stock Check ("চিনি কি স্টকে আছে?", "মাল আছে কিনা")
    if (/(?:স্টক|স্টকে আছে|মাল আছে|কয়টা আছে)/.test(query)) {
      const cleaned = query.replace(/(?:স্টক|স্টকে আছে|মাল আছে|কয়টা আছে|কি|আছে)/g, '').trim();
      return {
        intent: 'CHECK_STOCK',
        productQuery: cleaned,
        rawText: query
      };
    }

    return {
      intent: 'GENERIC_SEARCH',
      productQuery: query,
      rawText: query
    };
  }

  /**
   * Speak out Bengali voice confirmation
   */
  speakBengali(text = '') {
    if (typeof window !== 'undefined' && window.speechSynthesis && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'bn-BD';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Handle incoming text command directly or from speech
   */
  handleTranscript(transcript) {
    const parsed = this.parseIntent(transcript);
    this.notifyListeners({ type: 'INTENT', parsed, transcript });
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.notifyListeners({ type: 'STATUS', isListening: true });
      } catch (e) {
        console.warn('Speech recognition start failed', e);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        this.notifyListeners({ type: 'STATUS', isListening: false });
      } catch (e) {
        console.warn('Speech recognition stop failed', e);
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(payload) {
    this.listeners.forEach(fn => {
      try { fn(payload); } catch (e) { console.error(e); }
    });
  }
}

export const bengaliVoiceCommandDispatcher = new BengaliVoiceCommandDispatcher();
export default bengaliVoiceCommandDispatcher;
