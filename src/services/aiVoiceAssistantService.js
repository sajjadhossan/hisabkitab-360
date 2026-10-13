/**
 * HisabKitab 360 - AI Voice & Natural Language Parser
 * --------------------------------------------------
 * Parses Bengali & English conversational audio/text into structured ERP commands:
 * Examples:
 * - "৫ কেজি চিনি বিক্রি ১০০ টাকা" -> { action: 'POS_ADD_ITEM', product: 'চিনি', qty: 5, unit: 'কেজি', price: 100 }
 * - "আজকের মোট লাভ কত" -> { action: 'QUERY_DAILY_PROFIT' }
 * - "বকেয়া কাস্টমার তালিকা দেখাও" -> { action: 'NAVIGATE_DEBTS' }
 */

class AiVoiceAssistantService {
  /**
   * Parse natural speech query into an actionable command
   */
  parseCommand(input) {
    if (!input || typeof input !== 'string') return null;
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Profit / Sales Queries
    if (text.includes('লাভ কত') || lower.includes('profit') || text.includes('আজকের বিক্রি')) {
      return {
        intent: 'QUERY_ANALYTICS',
        metric: 'profit_and_sales',
        rawText: text,
        feedbackBn: 'আজকের বিক্রি ও লাভের হিসাব ড্যাশবোর্ডে দেখানো হচ্ছে'
      };
    }

    // 2. Due / Debt Queries
    if (text.includes('বকেয়া') || text.includes('বাকি') || lower.includes('due') || lower.includes('debt')) {
      return {
        intent: 'NAVIGATE_DEBTS',
        rawText: text,
        feedbackBn: 'বকেয়া খাতার পেজ ওপেন করা হচ্ছে'
      };
    }

    // 3. Quick Sale / POS Voice Billing
    // Example: "৫ পিস সাবান বিক্রি ৫০ টাকা" or "১০ কেজি চাল"
    const saleMatch = text.match(/([০-৯0-9.]+)\s*(কেজি|পিস|লিটার|কার্টুন|বক্স|বস্তা|টা)?\s*([^\d]+?)\s*(বিক্রি|যোগ)?\s*([০-৯0-9.]+)?\s*(টাকা|টাকায়)?/);
    if (saleMatch) {
      const rawQty = saleMatch[1];
      const unit = saleMatch[2] || 'পিস';
      const productName = saleMatch[3]?.trim();
      const rawPrice = saleMatch[5];

      // Convert Bengali digits to English
      const parseDigits = (str) => {
        if (!str) return null;
        const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return Number(str.replace(/[০-৯]/g, (d) => bnDigits.indexOf(d)));
      };

      const quantity = parseDigits(rawQty) || 1;
      const price = rawPrice ? parseDigits(rawPrice) : null;

      if (productName && productName.length > 1) {
        return {
          intent: 'POS_ADD_ITEM',
          productName,
          quantity,
          unit,
          price,
          rawText: text,
          feedbackBn: `${quantity} ${unit} ${productName} বিলিং কার্টে যুক্ত করা হলো`
        };
      }
    }

    // Default fallback
    return {
      intent: 'GENERAL_SEARCH',
      query: text,
      feedbackBn: `"${text}" দিয়ে তথ্য খোঁজা হচ্ছে`
    };
  }
}

export const aiVoiceAssistantService = new AiVoiceAssistantService();
