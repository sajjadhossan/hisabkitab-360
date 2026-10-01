/**
 * Bengali Voice Billing & Natural Language Processing (NLP) Engine
 * ---------------------------------------------------------------
 * Parses spoken Bengali voice commands in POS and extracts:
 *  - Quantity (১, ২, ৫, ১০, ২৫, ১০০, এক, দুই, দশ, পঁচিশ, দেড়, আড়াই, আধা, পোয়া, ইত্যাদি)
 *  - Unit (কেজি, লিটার, প্যাকেট, পিস, বস্তা, ব্যাগ, বোতল, হালি, ডজন, ইত্যাদি)
 *  - Product search term (চাল, ডাল, তেল, সাবান, ইত্যাদি)
 * 
 * Supports Interactive Multi-Turn Voice Dialogue:
 *  - Step 1: User says "চাল" -> Shows all rice varieties (প্রাণ চিনিগুঁড়া, মিনিকেট, নাজিরশাইল, বাসমতী, ইত্যাদি)
 *            Asks: "চাল এর ৫টি অপশন পাওয়া গেছে। কোনটি এবং কতটুকু চান বলুন—যেমন: 'প্রাণ চাল ১০ কেজি' বা '১ নম্বর'।"
 *  - Step 2: User says "প্রাণ চাল ১০ কেজি" or "১ নম্বর ৫ কেজি" -> Accurately adds to cart!
 */

// Comprehensive Bengali numerals & word number mapping (0 to 100 + fractions)
export const BENGALI_WORD_NUMBERS = {
  'শূন্য': 0, 'জিরো': 0,
  'এক': 1, 'একটি': 1, 'একটা': 1, 'একখানা': 1, 'একখানি': 1,
  'দুই': 2, 'দুটো': 2, 'দুইটা': 2, 'দুখানা': 2, 'দুইটি': 2,
  'তিন': 3, 'তিনটা': 3, 'তিনটি': 3, 'তিনখানা': 3,
  'চার': 4, 'চারটা': 4, 'চারটি': 4,
  'পাঁচ': 5, 'পাঁচটা': 5, 'পাঁচটি': 5, 'পাচ': 5, 'পাচটা': 5,
  'ছয়': 6, 'ছয়টা': 6, 'ছয়টি': 6, 'ছটা': 6, 'ছয়': 6, 'ছয়টা': 6,
  'সাত': 7, 'সাতটা': 7, 'সাতটি': 7,
  'আট': 8, 'আটটা': 8, 'আটটি': 8,
  'নয়': 9, 'নয়টা': 9, 'নয়টি': 9, 'নয়': 9, 'নয়টা': 9,
  'দশ': 10, 'দশটা': 10, 'দশটি': 10,
  'এগারো': 11, 'এগার': 11,
  'বারো': 12, 'বার': 12,
  'তেরো': 13, 'তের': 13,
  'চৌদ্দ': 14, 'চোদ্দ': 14,
  'পনেরো': 15, 'পনের': 15,
  'ষোল': 16,
  'সতেরো': 17, 'সতের': 17,
  'আঠারো': 18, 'আঠার': 18,
  'উনিশ': 19,
  'বিশ': 20, 'কুড়ি': 20, 'কুড়ি': 20,
  'একুশ': 21,
  'বাইশ': 22,
  'তেইশ': 23,
  'চব্বিশ': 24,
  'পঁচিশ': 25, 'পচিশ': 25,
  'ছাব্বিশ': 26,
  'সাতাশ': 27,
  'আঠাশ': 28,
  'উনত্রিশ': 29,
  'ত্রিশ': 30,
  'চল্লিশ': 40,
  'পঞ্চাশ': 50,
  'ষাট': 60, 'ষাঠ': 60,
  'সত্তর': 70,
  'আশি': 80,
  'নব্বই': 90,
  'একশ': 100, 'একশো': 100, 'শো': 100,
  'দেড়শ': 150, 'দেরশো': 150,
  'দুইশো': 200, 'দুইশ': 200,
  'পাঁচশো': 500,

  // Colloquial fractions & traditional measures
  'আধা': 0.5, 'হাফ': 0.5, 'অর্ধেক': 0.5, 'আধ': 0.5,
  'পোয়া': 0.25, 'এক পোয়া': 0.25, '১ পোয়া': 0.25,
  'দুই পোয়া': 0.5, '২ পোয়া': 0.5,
  'তিন পোয়া': 0.75, '৩ পোয়া': 0.75,
  'দেড়': 1.5, 'দের': 1.5,
  'আড়াই': 2.5,
  'পৌনে': 0.75, 'পৌনে এক': 0.75,
  'পৌনে দুই': 1.75,
  'পৌনে তিন': 2.75,
  'সোয়া': 1.25, 'সোয়া এক': 1.25,
  'সোয়া দুই': 2.25,
  'সোয়া তিন': 3.25,
  'সাড়ে তিন': 3.5,
  'সাড়ে চার': 4.5,
  'সাড়ে পাঁচ': 5.5,
  'সাড়ে ছয়': 6.5,
  'সাড়ে সাত': 7.5,
  'সাড়ে আট': 8.5,
  'সাড়ে নয়': 9.5,
  'সাড়ে দশ': 10.5,
  'এক মণ': 40, '১ মণ': 40,
  'দুই মণ': 80, '২ মণ': 80,
  'পাঁচ মণ': 200, '৫ মণ': 200,
  'এক সের': 1, '১ সের': 1,
  'এক হালি': 4, '১ হালি': 4,
  'দুই হালি': 8, '২ হালি': 8,
  'তিন হালি': 12, '৩ হালি': 12,
  'এক ডজন': 12, '১ ডজন': 12,
  'দেড় ডজন': 18, 'দের ডজন': 18,
  'দুই ডজন': 24, '২ ডজন': 24
};

export const BENGALI_DIGITS = {
  '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4,
  '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9
};

/**
 * Converts Bengali digit string or mixed numbers to standard integer/float
 */
export const convertBengaliDigitsToNumber = (str) => {
  if (!str) return null;
  let normalized = '';
  for (const ch of String(str)) {
    if (BENGALI_DIGITS[ch] !== undefined) {
      normalized += BENGALI_DIGITS[ch];
    } else {
      normalized += ch;
    }
  }
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

// Common conversational filler words and phrases to strip out
const FILLER_PHRASES = [
  'আমারে চাল দেখাও', 'আমাকে চাল দেখাও', 'চাল দেখাও', 'চালগুলা দেখাও', 'চালগুলো দেখাও',
  'কি কি চাল আছে', 'কত রকমের চাল আছে', 'চাল কত প্রকার আছে', 'সব চাল দেখাও',
  'কি কি আছে', 'কত রকমের আছে', 'সবগুলা দেখাও', 'সবগুলো দেখাও', 'তালিকা দেখাও',
  'দয়া করে', 'দয়া করে', 'তুলে দাও', 'তুলে দিন', 'কার্টে নাও', 'কার্টে যোগ করো'
];

const FILLER_WORDS = [
  'কিনলাম', 'কিনি', 'কিনব', 'কেনা', 'হয়েছে', 'হলো',
  'দাও', 'দিন', 'দেও', 'দেবেন', 'দেন', 'দিস',
  'যোগ', 'করো', 'করুন', 'এড', 'যুক্ত', 'তুলে',
  'রাখ', 'রাখো', 'রাখুন', 'লও', 'নিন', 'নেব', 'নেবো', 'নিলাম',
  'লাগবে', 'চাই', 'চান', 'নেওয়ার',
  'প্লিজ', 'ভাই', 'ক্যাশমেমো', 'মেমো',
  'বিল', 'কার্ট', 'কার্টে', 'এন্ট্রি', 'হিসাব',
  'দেখাও', 'দেখি', 'আসো', 'আসুক', 'আছে', 'প্রকার', 'রকমের', 'রকম', 'সব'
];

// Unit words
const UNIT_WORDS = [
  'কেজি', 'কেজিতে', 'কেজির', 'কিলো',
  'গ্রাম', 'গ্রামের',
  'লিটার', 'লিটারের', 'লি',
  'প্যাকেট', 'প্যাক', 'প্যাকেটের',
  'পিস', 'পিসেস', 'টুকরো',
  'টা', 'টি', 'খানা', 'খানি',
  'বস্তা', 'বস্তার', 'ব্যাগ',
  'বোতল', 'বোতলের', 'বক্স', 'কার্টন',
  'হালি', 'হালির',
  'ডজন', 'ডজনের',
  'মণ', 'মণের', 'সের', 'ছটাক', 'পোয়া', 'পোয়া'
];

// Generic product terms that represent an entire product family/category
export const GENERIC_CATEGORY_KEYWORDS = [
  'চাল', 'rice', 'পোলাও', 'মিনিকেট', 'নাজিরশাইল', 'বাসমতী',
  'তেল', 'oil', 'সরিষার তেল', 'সয়াবিন তেল',
  'সাবান', 'soap',
  'ডাল', 'lentil', 'মসুর ডাল', 'মুগ ডাল',
  'দুধ', 'milk', 'গুঁড়ো দুধ',
  'লবণ', 'salt',
  'ডিম', 'egg',
  'কফি', 'coffee',
  'চা', 'tea',
  'আটা', 'ময়দা', 'ময়দা',
  'মসলা', 'মরিচ', 'হলুদ',
  'শ্যাম্পু', 'shampoo',
  'বিস্কুট', 'biscuit'
];

// Regional Dialects, Colloquialisms & Phonetic Variations in Bangladesh
export const BENGALI_REGIONAL_SYNONYMS = {
  'আন্ডা': 'ডিম',
  'আন্ডার': 'ডিম',
  'টাহা': 'টাকা',
  'টাহার': 'টাকা',
  'মরিচ্যা': 'মরিচ',
  'মইরিচ': 'মরিচ',
  'চাইল': 'চাল',
  'চাইলের': 'চাল',
  'ভাত': 'চাল',
  'তৈল': 'তেল',
  'তৈলের': 'তেল',
  'নুন': 'লবণ',
  'নুনের': 'লবণ',
  'মিঠা': 'চিনি',
  'চিনিকুড়া': 'চিনিগুঁড়া',
  'চিনিগুরা': 'চিনিগুঁড়া',
  'নাজিরশাল': 'নাজিরশাইল',
  'মিনিকের': 'মিনিকেট',
  'মিনিকেত': 'মিনিকেট',
  'পিয়াজ': 'পেঁয়াজ',
  'পিয়াঁজ': 'পেঁয়াজ',
  'পেয়াজ': 'পেঁয়াজ',
  'রোশুন': 'রসুন',
  'মশলা': 'মসলা',
  'বিস্কুট': 'বিস্কিট',
  'সোডা': 'পানীয়',
  'ম্যাজি': 'ম্যাগি',
  'সোপ': 'সাবান',
  'অয়েল': 'তেল',
  'রাইস': 'চাল',
  'শুগার': 'চিনি',
  'সল্ট': 'লবণ',
  'মিল্ক': 'দুধ',
  'কোল্ড্রিংক': 'কোল্ড ড্রিংকস'
};

/**
 * Normalizes Bengali words by removing common case endings/suffixes and mapping dialects
 * e.g., 'চালের' -> 'চাল', 'আন্ডা' -> 'ডিম', 'তৈল' -> 'তেল', 'চাইল' -> 'চাল'
 */
export const normalizeBengaliWord = (word) => {
  if (!word || typeof word !== 'string') return '';
  let w = word.trim().toLowerCase();

  // Strip plural/article suffixes
  w = w.replace(/(গুলা|গুলো|খানা|খানি|টা|টি)$/, '');
  // Strip genitive/possessive suffix (e.g., 'চালের' -> 'চাল', 'তেলের' -> 'তেল', 'সাবানের' -> 'সাবান')
  if (w.endsWith('ের') && w.length > 3) {
    w = w.slice(0, -2);
  } else if (w.endsWith('র') && w.length > 3 && !['মরিচ', 'লিকার'].includes(w)) {
    w = w.slice(0, -1);
  }

  // Check regional dialect/colloquial mapping
  if (BENGALI_REGIONAL_SYNONYMS[w]) {
    return BENGALI_REGIONAL_SYNONYMS[w];
  }

  return w;
};

/**
 * Parses a spoken Bengali sentence into { quantity, unit, productQuery, rawText, isExploreQuery }
 * Examples:
 *  - "চাল" -> { quantity: 1, unit: '', productQuery: 'চাল', isExploreQuery: true }
 *  - "চাল কত রকমের আছে" -> { quantity: 1, unit: '', productQuery: 'চাল', isExploreQuery: true }
 *  - "প্রাণ চাল ১০ কেজি" -> { quantity: 10, unit: 'কেজি', productQuery: 'প্রাণ চাল' }
 *  - "১০ কেজি মিনিকেট চাল" -> { quantity: 10, unit: 'কেজি', productQuery: 'মিনিকেট চাল' }
 *  - "১ হালি ডিম" -> { quantity: 4, unit: 'পিস', productQuery: 'ডিম' }
 *  - "১ ডজন ডিম" -> { quantity: 12, unit: 'পিস', productQuery: 'ডিম' }
 *  - "আধা কেজি ডাল" -> { quantity: 0.5, unit: 'কেজি', productQuery: 'ডাল' }
 */
export const parseBengaliVoiceCommand = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return { quantity: 1, unit: '', productQuery: '', rawText: '', isExploreQuery: false };
  }

  const rawText = transcript.trim();
  let text = rawText.toLowerCase();

  // Strip punctuation
  text = text.replace(/[,.?।!]/g, ' ').replace(/\s+/g, ' ').trim();

  // Check if it's an exploration query (e.g., "চাল দেখাও", "কি কি চাল আছে", "চাল কত রকমের আছে")
  let isExploreQuery = false;
  for (const phrase of FILLER_PHRASES) {
    if (text.includes(phrase)) {
      isExploreQuery = true;
      text = text.replace(phrase, ' ');
    }
  }

  let quantity = null;
  let detectedUnit = '';

  // Special handling for colloquial fractions and traditional measures before regex
  if (text.includes('তিন পোয়া') || text.includes('৩ পোয়া')) {
    quantity = 0.75;
    detectedUnit = 'কেজি';
    text = text.replace('তিন পোয়া', ' ').replace('৩ পোয়া', ' ');
  } else if (text.includes('দুই পোয়া') || text.includes('২ পোয়া')) {
    quantity = 0.5;
    detectedUnit = 'কেজি';
    text = text.replace('দুই পোয়া', ' ').replace('২ পোয়া', ' ');
  } else if (text.includes('এক পোয়া') || text.includes('১ পোয়া') || text.includes('পোয়া') || text.includes('পোয়া')) {
    quantity = 0.25;
    detectedUnit = 'কেজি';
    text = text.replace('এক পোয়া', ' ').replace('১ পোয়া', ' ').replace('পোয়া', ' ').replace('পোয়া', ' ');
  } else if (text.includes('আধ কেজি') || text.includes('আধা কেজি') || text.includes('হাফ কেজি') || text.includes('অর্ধেক কেজি')) {
    quantity = 0.5;
    detectedUnit = 'কেজি';
    text = text.replace('আধ কেজি', ' ').replace('আধা কেজি', ' ').replace('হাফ কেজি', ' ').replace('অর্ধেক কেজি', ' ');
  } else if (text.includes('দেড় কেজি') || text.includes('দের কেজি')) {
    quantity = 1.5;
    detectedUnit = 'কেজি';
    text = text.replace('দেড় কেজি', ' ').replace('দের কেজি', ' ');
  } else if (text.includes('দেড় লিটার') || text.includes('দের লিটার')) {
    quantity = 1.5;
    detectedUnit = 'লিটার';
    text = text.replace('দেড় লিটার', ' ').replace('দের লিটার', ' ');
  } else if (text.includes('আড়াই কেজি')) {
    quantity = 2.5;
    detectedUnit = 'কেজি';
    text = text.replace('আড়াই কেজি', ' ');
  } else if (text.includes('আড়াই লিটার')) {
    quantity = 2.5;
    detectedUnit = 'লিটার';
    text = text.replace('আড়াই লিটার', ' ');
  } else if (text.includes('সোয়া এক কেজি') || text.includes('সোয়া কেজি')) {
    quantity = 1.25;
    detectedUnit = 'কেজি';
    text = text.replace('সোয়া এক কেজি', ' ').replace('সোয়া কেজি', ' ');
  } else if (text.includes('পৌনে এক কেজি') || text.includes('পৌনে কেজি')) {
    quantity = 0.75;
    detectedUnit = 'কেজি';
    text = text.replace('পৌনে এক কেজি', ' ').replace('পৌনে কেজি', ' ');
  } else if (text.includes('এক মণ') || text.includes('১ মণ') || text.includes('মণ')) {
    quantity = 40;
    detectedUnit = 'কেজি';
    text = text.replace('এক মণ', ' ').replace('১ মণ', ' ').replace('মণ', ' ');
  } else if (text.includes('এক সের') || text.includes('১ সের') || text.includes('সের')) {
    quantity = 1;
    detectedUnit = 'কেজি';
    text = text.replace('এক সের', ' ').replace('১ সের', ' ').replace('সের', ' ');
  } else if (text.includes('এক ছটাক') || text.includes('১ ছটাক') || text.includes('ছটাক')) {
    quantity = 0.0625;
    detectedUnit = 'কেজি';
    text = text.replace('এক ছটাক', ' ').replace('১ ছটাক', ' ').replace('ছটাক', ' ');
  }

  // 1. Attached digits with units (e.g., '১০কেজি', '১০ কেজি', '২৫ কেজি', '5kg', '১ বস্তা', '২ হালি', '১ ডজন')
  if (quantity === null) {
    const attachedPattern = /([০-৯0-9.]+)\s*(কেজি|গ্রাম|লিটার|প্যাকেট|পিস|টা|টি|বস্তা|ব্যাগ|বোতল|বক্স|হালি|ডজন|কিলো|kg|gm|ltr|pcs?)/i;
    const attachedMatch = text.match(attachedPattern);
    if (attachedMatch) {
      const parsedNum = convertBengaliDigitsToNumber(attachedMatch[1]);
      if (parsedNum !== null) {
        quantity = parsedNum;
        detectedUnit = attachedMatch[2];
        text = text.replace(attachedMatch[0], ' ');

        // Convert multipliers
        if (detectedUnit === 'হালি') {
          quantity = parsedNum * 4;
          detectedUnit = 'পিস';
        } else if (detectedUnit === 'ডজন') {
          quantity = parsedNum * 12;
          detectedUnit = 'পিস';
        }
      }
    }
  }

  // 2. Bengali word numbers (e.g., 'দশ', 'পঁচিশ', 'দুই', 'একশ')
  if (quantity === null) {
    // Sort words by length descending so longer phrases match first (e.g. 'সাড়ে তিন' before 'তিন')
    const sortedWords = Object.entries(BENGALI_WORD_NUMBERS).sort((a, b) => b[0].length - a[0].length);
    for (const [word, num] of sortedWords) {
      const wordPattern = new RegExp(`(^|\\s)${word}(\\s|$)`, 'i');
      if (wordPattern.test(text)) {
        quantity = num;
        text = text.replace(wordPattern, ' ');
        break;
      }
    }
  }

  // 3. Standalone digits (e.g., '১০', '২৫', '১০০', '5')
  if (quantity === null) {
    const digitPattern = /(^|\s)([০-৯0-9.]+)(\s|$)/;
    const digitMatch = text.match(digitPattern);
    if (digitMatch) {
      const parsedNum = convertBengaliDigitsToNumber(digitMatch[2]);
      if (parsedNum !== null) {
        quantity = parsedNum;
        text = text.replace(digitMatch[0], ' ');
      }
    }
  }

  // 4. Standalone units
  if (!detectedUnit) {
    for (const unit of UNIT_WORDS) {
      const unitPattern = new RegExp(`(^|\\s)${unit}(\\s|$)`, 'i');
      if (unitPattern.test(text)) {
        detectedUnit = unit;
        text = text.replace(unitPattern, ' ');
        if (unit === 'হালি' && quantity) {
          quantity = quantity * 4;
          detectedUnit = 'পিস';
        } else if (unit === 'ডজন' && quantity) {
          quantity = quantity * 12;
          detectedUnit = 'পিস';
        }
        break;
      }
    }
  }

  // 5. Remove conversational fillers (কিনলাম, দাও, এড করো, ইত্যাদি)
  for (const filler of FILLER_WORDS) {
    const fillerPattern = new RegExp(`(^|\\s)${filler}(\\s|$)`, 'gi');
    text = text.replace(fillerPattern, ' ');
  }

  // Clean up remaining query words and normalize stems (e.g. 'চালের' -> 'চাল')
  const rawWords = text.replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean);
  const normalizedWords = rawWords.map(normalizeBengaliWord);
  const cleanProductQuery = normalizedWords.join(' ').trim();

  // If user only said a single generic product word (like "চাল" or "তেল"), treat as explore query
  if (cleanProductQuery === 'চাল' || cleanProductQuery === 'তেল' || cleanProductQuery === 'সাবান' || cleanProductQuery === 'ডাল') {
    isExploreQuery = true;
  }

  return {
    quantity: quantity !== null ? Math.max(0.1, quantity) : 1,
    unit: detectedUnit,
    productQuery: cleanProductQuery,
    rawText,
    isExploreQuery
  };
};

/**
 * Searches and ranks products matching the spoken product query.
 * Detects if a command is broad/ambiguous (e.g. "চাল", "তেল", "সাবান") needing multi-turn choice,
 * or specific enough to add directly (e.g. "প্রাণ চিনিগুঁড়া চাল ১০ কেজি", "১ লিটার সরিষার তেল").
 */
export const matchVoiceProduct = (parsedQuery, productsList = []) => {
  const query = (parsedQuery?.productQuery || '').toLowerCase().trim();
  if (!query || !productsList || productsList.length === 0) {
    return { isAmbiguous: false, directMatch: null, candidates: [] };
  }

  const queryWords = query.split(/\s+/).filter(w => w.length > 0);

  // Check if the query is a generic umbrella category word (e.g., 'চাল', 'তেল', 'সাবান', 'ডাল')
  const isGenericWord = queryWords.length === 1 &&
    (query === 'চাল' || query === 'তেল' || query === 'সাবান' || query === 'ডাল' ||
     query === 'দুধ' || query === 'লবণ' || query === 'ডিম' || query === 'কফি' ||
     query === 'চা' || query === 'আটা' || query === 'শ্যাম্পু');

  // Search through products
  const scoredProducts = [];

  for (const product of productsList) {
    const pName = (product.name || '').toLowerCase();
    const pSku = (product.sku || '').toLowerCase();
    const pBarcode = (product.barcode || '').toLowerCase();
    const pCat = (product.category || '').toLowerCase();

    let score = 0;

    // Exact matches
    if (pName === query) score += 120;
    else if (pName.includes(query)) score += 75;

    if (pBarcode && pBarcode === query) score += 100;
    if (pSku && pSku === query) score += 95;

    // Category match
    if (pCat.includes(query)) score += 40;

    // Word by word matches (e.g., 'প্রাণ' & 'চাল')
    let matchedWordsCount = 0;
    for (const w of queryWords) {
      if (pName.includes(w)) {
        score += 35;
        matchedWordsCount++;
      } else if (pCat.includes(w)) {
        score += 20;
      }
    }

    if (matchedWordsCount === queryWords.length && queryWords.length > 0) {
      score += 30; // All search words covered in product title
    }

    // Special category grouping boost (e.g. user said "চাল", product contains "চাল", "রাইস", "মিনিকেট", "নাজিরশাইল", "বাসমতী", "পোলাও")
    if (query === 'চাল' && (pName.includes('চাল') || pName.includes('মিনিকেট') || pName.includes('নাজিরশাইল') || pName.includes('পোলাও') || pName.includes('বাসমতী'))) {
      score += 50;
    }
    if (query === 'তেল' && (pName.includes('তেল') || pName.includes('সরিষা') || pName.includes('সয়াবিন'))) {
      score += 50;
    }
    if (query === 'সাবান' && (pName.includes('সাবান') || pName.includes('সোপ') || pName.includes('লাক্স') || pName.includes('লাইফবয়'))) {
      score += 50;
    }

    // Unit match boost
    if (parsedQuery.unit && (pName.includes(parsedQuery.unit) || (product.unit && product.unit.includes(parsedQuery.unit)))) {
      score += 15;
    }

    if (score >= 35) {
      scoredProducts.push({
        product,
        score,
        matchedQuantity: parsedQuery.quantity || 1,
        matchedUnit: parsedQuery.unit || product.unit || ''
      });
    }
  }

  // Sort descending by highest score
  scoredProducts.sort((a, b) => b.score - a.score);

  if (scoredProducts.length === 0) {
    return { isAmbiguous: false, directMatch: null, candidates: [] };
  }

  // Check if ambiguous
  const top = scoredProducts[0];
  const second = scoredProducts[1];

  // If query is an explore query or generic word (e.g., "চাল", "তেল", "সাবান") and multiple items exist,
  // ALWAYS trigger multi-turn interactive candidate presentation!
  if ((isGenericWord || parsedQuery.isExploreQuery) && scoredProducts.length > 1) {
    return {
      isAmbiguous: true,
      directMatch: null,
      candidates: scoredProducts.slice(0, 8),
      genericType: query
    };
  }

  // If single candidate or overwhelmingly specific direct match
  const isDirect = scoredProducts.length === 1 ||
    (top.score >= 100) ||
    (second && top.score >= 85 && (top.score - second.score >= 40));

  if (isDirect) {
    return {
      isAmbiguous: false,
      directMatch: top,
      candidates: scoredProducts.slice(0, 8)
    };
  }

  // Otherwise, present options to the user
  return {
    isAmbiguous: true,
    directMatch: null,
    candidates: scoredProducts.slice(0, 8),
    genericType: query
  };
};

/**
 * Resolves a follow-up user voice selection when multiple candidates are presented.
 * Examples of user responses in Turn 2:
 *  - "প্রাণ চাল ১০ কেজি" -> selects candidate containing 'প্রাণ', quantity: 10, unit: 'কেজি'
 *  - "১ নম্বর" / "১" / "প্রথমটা" -> selects candidate index 0
 *  - "২ নম্বর ৫ কেজি" -> selects candidate index 1, quantity: 5
 *  - "নাজিরশাইল ২০ কেজি" -> selects candidate containing 'নাজিরশাইল', quantity: 20
 *  - "মিনিকেট চাল ২৫ কেজি" -> selects candidate containing 'মিনিকেট', quantity: 25
 *  - "বাতিল" / "বাদ দাও" -> cancels
 */
export const resolveSelectionVoice = (transcript, candidates = [], allProducts = []) => {
  if (!transcript || !candidates || candidates.length === 0) return null;

  const raw = transcript.toLowerCase().trim();

  // Check cancellation
  if (raw.includes('বাতিল') || raw.includes('ক্যান্সেল') || raw.includes('বাদ') ||
      raw.includes('দরকার নাই') || raw.includes('দরকার নেই') || raw.includes('না আর না')) {
    return { isCancelled: true };
  }

  // Parse quantity and product terms from the follow-up sentence
  const parsed = parseBengaliVoiceCommand(transcript);
  const qty = parsed.quantity || 1;
  const unit = parsed.unit || '';
  const query = (parsed.productQuery || raw).toLowerCase();

  // 1. Ordinal / Index checks: "১ নম্বর", "১ম", "১", "প্রথমটা", "২ নম্বর", "২", etc.
  const ordinalMap = [
    { index: 0, patterns: [/^১$/, /১\s*নম্বর/, /১ম/, /প্রথম/, /এক\s*নম্বর/, /^এক$/] },
    { index: 1, patterns: [/^২$/, /২\s*নম্বর/, /২য়/, /দ্বিতীয়/, /দুই\s*নম্বর/, /^দুই$/] },
    { index: 2, patterns: [/^৩$/, /৩\s*নম্বর/, /৩য়/, /তৃতীয়/, /তিন\s*নম্বর/, /^তিন$/] },
    { index: 3, patterns: [/^৪$/, /৪\s*নম্বর/, /৪র্থ/, /চতুর্থ/, /চার\s*নম্বর/, /^চার$/] },
    { index: 4, patterns: [/^৫$/, /৫\s*নম্বর/, /৫ম/, /পঞ্চম/, /পাঁচ\s*নম্বর/, /^পাঁচ$/] },
    { index: 5, patterns: [/^৬$/, /৬\s*নম্বর/, /৬ষ্ঠ/, /ষষ্ঠ/, /ছয়\s*নম্বর/, /^ছয়$/] },
    { index: 6, patterns: [/^৭$/, /৭\s*নম্বর/, /৭ম/, /সপ্তম/, /সাত\s*নম্বর/, /^সাত$/] },
    { index: 7, patterns: [/^৮$/, /৮\s*নম্বর/, /৮ম/, /অষ্টম/, /আট\s*নম্বর/, /^আট$/] }
  ];

  for (const ord of ordinalMap) {
    if (ord.index < candidates.length) {
      for (const pat of ord.patterns) {
        if (pat.test(query) || pat.test(raw)) {
          return {
            selectedCandidate: candidates[ord.index],
            quantity: qty,
            unit: unit || candidates[ord.index].matchedUnit || candidates[ord.index].product?.unit || '',
            matchType: 'index'
          };
        }
      }
    }
  }

  // 2. Keyword & Brand matching among candidates
  // e.g. "প্রাণ চাল ১০ কেজি" -> matches candidate containing 'প্রাণ'
  //      "মিনিকেট চাল ২৫ কেজি" -> matches candidate containing 'মিনিকেট'
  //      "নাজিরশাইল ২০ কেজি" -> matches candidate containing 'নাজিরশাইল'
  let bestCandidate = null;
  let highestScore = 0;

  const queryWords = query.split(/\s+/).filter(w => w.length > 0);

  for (const cand of candidates) {
    const pName = (cand.product?.name || '').toLowerCase();
    const pSku = (cand.product?.sku || '').toLowerCase();

    let score = 0;

    // Direct brand matching
    if (query.includes('প্রাণ') && pName.includes('প্রাণ')) score += 80;
    if (query.includes('মিনিকেট') && pName.includes('মিনিকেট')) score += 80;
    if (query.includes('নাজিরশাইল') && pName.includes('নাজিরশাইল')) score += 80;
    if (query.includes('বাসমতী') && pName.includes('বাসমতী')) score += 80;
    if (query.includes('চাষী') && pName.includes('চাষী')) score += 80;
    if (query.includes('রশিদ') && pName.includes('রশিদ')) score += 80;
    if (query.includes('রূপচাঁদা') && pName.includes('রূপচাঁদা')) score += 80;
    if (query.includes('তীর') && pName.includes('তীর')) score += 80;
    if (query.includes('লাক্স') && pName.includes('লাক্স')) score += 80;
    if (query.includes('লাইফবয়') && pName.includes('লাইফবয়')) score += 80;

    if (pName.includes(query)) score += 60;

    for (const w of queryWords) {
      if (w.length >= 2 && pName.includes(w)) {
        score += 25;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCandidate = cand;
    }
  }

  if (bestCandidate && highestScore >= 35) {
    return {
      selectedCandidate: bestCandidate,
      quantity: qty,
      unit: unit || bestCandidate.matchedUnit || bestCandidate.product?.unit || '',
      matchType: 'keyword'
    };
  }

  // 3. Fallback: Check if the user named another product in the store entirely
  if (allProducts && allProducts.length > 0) {
    const fallbackMatch = matchVoiceProduct(parsed, allProducts);
    if (fallbackMatch.directMatch) {
      return {
        selectedCandidate: fallbackMatch.directMatch,
        quantity: qty,
        unit: unit || fallbackMatch.directMatch.matchedUnit || fallbackMatch.directMatch.product?.unit || '',
        matchType: 'fallback_store_match'
      };
    }
  }

  return null;
};

/**
 * Generates an inviting spoken Bengali question when multiple candidates exist.
 */
export const generateClarificationVoicePrompt = (candidates, query = '') => {
  if (!candidates || candidates.length === 0) return '';
  const count = candidates.length;

  const sampleNames = candidates
    .slice(0, 3)
    .map((c, i) => `${i + 1} নম্বরে ${c.product.name.replace(/\(.*?\)/g, '').trim()}`)
    .join(', ');

  const queryLabel = query || 'পণ্য';
  return `${queryLabel} এর ${count}টি অপশন আছে। যেমন: ${sampleNames}। কোনটি কতটুকু চান বলুন—যেমন: 'প্রাণ চাল ১০ কেজি' বা নম্বর বলুন।`;
};

/**
 * Speaks confirmation voice response in Bengali
 */
export const speakVoiceConfirmation = (text, lang = 'bn') => {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'bn') {
      utterance.lang = 'bn-BD';
    } else {
      utterance.lang = 'en-US';
    }
    utterance.rate = 1.05;
    utterance.volume = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
};

/**
 * Detects and parses multiple items in a single spoken breath.
 * e.g., "২ কেজি চিনি, ৩ লিটার তীর তেল আর ১ প্যাকেট লবণ"
 * or "১০ কেজি মিনিকেট চাল এবং ১ ডজন ডিম"
 */
export const parseMultiItemVoiceCommand = (transcript, productsList = []) => {
  if (!transcript || typeof transcript !== 'string') return null;

  const rawText = transcript.trim();
  // Split clauses on commas, "আর", "এবং", "ও", "সাথে", "প্লাস"
  const rawSegments = rawText
    .split(/[,،।\n]|(?:\s+আর\s+)|\s+এবং\s+|\s+ও\s+|\s+সাথে\s+|\s+প্লাস\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  // If only 1 segment or less, not a multi-item command
  if (rawSegments.length <= 1) {
    return null;
  }

  const items = [];
  for (const seg of rawSegments) {
    const cleanSeg = seg.replace(/(কার্টে\s*দাও|তুলে\s*দাও|মোট\s*কত|বিল\s*করো|যোগ\s*করো|দাও|দিন)/gi, ' ').trim();
    if (!cleanSeg || cleanSeg.length < 2) continue;

    const parsed = parseBengaliVoiceCommand(cleanSeg);
    if (!parsed || !parsed.productQuery) continue;

    const matched = matchVoiceProduct(parsed, productsList);
    if (matched.directMatch) {
      items.push({
        product: matched.directMatch.product,
        quantity: parsed.quantity || 1,
        unit: parsed.unit || matched.directMatch.product.unit || '',
        matchedCandidate: matched.directMatch,
        clause: cleanSeg
      });
    } else if (matched.candidates && matched.candidates.length > 0) {
      // Pick best candidate
      items.push({
        product: matched.candidates[0].product,
        quantity: parsed.quantity || 1,
        unit: parsed.unit || matched.candidates[0].product.unit || '',
        matchedCandidate: matched.candidates[0],
        clause: cleanSeg
      });
    }
  }

  if (items.length >= 2) {
    const totalAmount = items.reduce((sum, it) => sum + ((it.product.sellPrice || it.product.sellingPrice || 0) * it.quantity), 0);
    return {
      isMultiItem: true,
      items,
      totalAmount,
      itemCount: items.length,
      rawTranscript: rawText
    };
  }

  return null;
};

/**
 * Detects special POS terminal voice actions like discount, clear cart, open drawer, checkout, payment method
 */
export const parsePOSVoiceActionCommand = (transcript) => {
  if (!transcript || typeof transcript !== 'string') return null;

  const raw = transcript.toLowerCase().trim();

  // 1. Discount / ছাড় (যেমন: "৫০ টাকা ডিসকাউন্ট দাও", "ছাড় ১০০ টাকা", "২০ টাকা লেস")
  if (raw.includes('ডিসকাউন্ট') || raw.includes('ছাড়') || raw.includes('ছাড়') || raw.includes('লেস') || raw.includes('কম রাখ')) {
    const digitMatch = raw.match(/([০-৯0-9.]+)/);
    if (digitMatch) {
      const amt = convertBengaliDigitsToNumber(digitMatch[1]);
      if (amt && amt > 0) {
        return {
          type: 'discount',
          amount: amt,
          spoken: `${amt} টাকা ডিসকাউন্ট দেওয়া হয়েছে।`
        };
      }
    }
  }

  // 2. Clear Cart / নতুন মেমো
  if (
    raw.includes('কার্ট খালি') ||
    raw.includes('কার্ট ক্লিয়ার') ||
    raw.includes('কার্ট ক্লিয়ার') ||
    raw.includes('নতুন মেমো') ||
    raw.includes('মেমো বাতিল') ||
    raw.includes('সব বাতিল')
  ) {
    return {
      type: 'clear_cart',
      spoken: 'কার্ট খালি করা হয়েছে, নতুন মেমোর জন্য প্রস্তুত।'
    };
  }

  // 3. Open Cash Drawer
  if (
    raw.includes('ড্রয়ার খোল') ||
    raw.includes('ড্রয়ার খোল') ||
    raw.includes('ক্যাশ ড্রয়ার') ||
    raw.includes('ড্রয়ার ওপেন')
  ) {
    return {
      type: 'open_drawer',
      spoken: 'ক্যাশ ড্রয়ার খোলা হয়েছে।'
    };
  }

  // 4. Complete Checkout / মেমো প্রিন্ট
  if (
    raw.includes('চেকআউট') ||
    raw.includes('মেমো প্রিন্ট') ||
    raw.includes('বিল প্রিন্ট') ||
    raw.includes('বিল সম্পন্ন') ||
    raw.includes('পেমেন্ট সম্পন্ন')
  ) {
    return {
      type: 'checkout',
      spoken: 'বিল সম্পন্ন করা হচ্ছে।'
    };
  }

  // 5. Payment Method Switch
  if (raw.includes('বিকাশ') || raw.includes('bkash')) {
    return {
      type: 'payment_method',
      method: 'bkash',
      spoken: 'পেমেন্ট মাধ্যম বিকাশ নির্বাচন করা হয়েছে।'
    };
  }
  if (raw.includes('নগদ ক্যাশ') || raw.includes('ক্যাশে পেমেন্ট') || raw.includes('ক্যাশ বিল')) {
    return {
      type: 'payment_method',
      method: 'cash',
      spoken: 'পেমেন্ট মাধ্যম নগদ ক্যাশ নির্বাচন করা হয়েছে।'
    };
  }
  if (raw.includes('কার্ড') || raw.includes('কার্ডে পেমেন্ট')) {
    return {
      type: 'payment_method',
      method: 'card',
      spoken: 'পেমেন্ট মাধ্যম কার্ড নির্বাচন করা হয়েছে।'
    };
  }
  if (raw.includes('বাকি মেমো') || raw.includes('বাকিতে বিক্রি')) {
    return {
      type: 'payment_method',
      method: 'due',
      spoken: 'বাকি মেমো নির্বাচন করা হয়েছে।'
    };
  }

  return null;
};
