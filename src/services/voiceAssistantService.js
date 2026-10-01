/**
 * Universal Bengali Voice Assistant & NLP Service
 * -----------------------------------------------
 * Parses spoken Bengali voice commands for:
 * 1. Personal & Daily Expenses (ব্যক্তিগত ও পারিবারিক খরচ)
 * 2. Business Expenses (দোকান ও ব্যবসা পরিচালনা খরচ)
 * 3. Products & Inventory Addition (নতুন পণ্য সংযোজন)
 * 4. General Speech-to-Text for any form field
 */

import {
  convertBengaliDigitsToNumber,
  BENGALI_WORD_NUMBERS,
  normalizeBengaliWord,
  speakVoiceConfirmation
} from './voiceBillingService';

// Category keyword mappings for personal & daily expenses
const EXPENSE_CATEGORY_MAP = [
  {
    category: 'bazaar',
    subCategory: 'কাঁচা শাকসবজি',
    keywords: ['কাঁচাবাজার', 'বাজার', 'শাকসবজি', 'সবজি', 'তরকারি', 'শাক', 'আলু', 'পটল', 'পেঁয়াজ', 'রসুন', 'আদা', 'টমেটো', 'কাঁচামরিচ']
  },
  {
    category: 'bazaar',
    subCategory: 'তাজা মাছ',
    keywords: ['মাছ', 'রুই', 'ইলিশ', 'কাতল', 'চিংড়ি', 'শিং', 'মাগুর', 'তেলাপিয়া', 'পাঙ্গাস']
  },
  {
    category: 'bazaar',
    subCategory: 'মাংস (মুরগি/গরু)',
    keywords: ['মাংস', 'মুরগি', 'গরুর মাংস', 'খাসি', 'ব্রয়লার', 'কক', 'বিফ', 'মাটন']
  },
  {
    category: 'bazaar',
    subCategory: 'চাল ও আটা',
    keywords: ['চাল', 'আটা', 'ময়দা', 'পোলাও চাল', 'মিনিকেট']
  },
  {
    category: 'bazaar',
    subCategory: 'ডাল ও সয়াবিন তেল',
    keywords: ['ডাল', 'সয়াবিন তেল', 'সরিষার তেল', 'তেল', 'মসুর ডাল', 'মুগ ডাল']
  },
  {
    category: 'bazaar',
    subCategory: 'ডিম ও দুধ',
    keywords: ['ডিম', 'দুধ', 'হালি ডিম', 'ডজন ডিম', 'গুঁড়ো দুধ']
  },
  {
    category: 'transport',
    subCategory: 'রিকশা ভাড়া',
    keywords: ['রিকশা', 'রিকশা ভাড়া', 'রিকশায়']
  },
  {
    category: 'transport',
    subCategory: 'বাস ভাড়া',
    keywords: ['বাস', 'বাস ভাড়া', 'বাসে']
  },
  {
    category: 'transport',
    subCategory: 'অটো / সিএনজি ভাড়া',
    keywords: ['সিএনজি', 'অটো', 'অটোরিকশা', 'সিএনজি ভাড়া']
  },
  {
    category: 'transport',
    subCategory: 'মোটরসাইকেল তেল',
    keywords: ['পেট্রোল', 'অকটেন', 'বাইকের তেল', 'গাড়ির তেল', 'মোটরসাইকেল']
  },
  {
    category: 'transport',
    subCategory: 'উবার / পাঠাও রাইড',
    keywords: ['পাঠাও', 'উবার', 'রাইড', 'ইনড্রাইভ']
  },
  {
    category: 'utility',
    subCategory: 'বিদ্যুৎ বিল',
    keywords: ['বিদ্যুৎ বিল', 'কারেন্ট বিল', 'বিদ্যুৎ', 'কারেন্ট', 'ডেসকো', 'নেস্কা', 'পল্লী বিদ্যুৎ']
  },
  {
    category: 'utility',
    subCategory: 'ইন্টারনেট বিল',
    keywords: ['ইন্টারনেট', 'ওয়াইফাই', 'ব্রডব্যান্ড', 'নেট বিল']
  },
  {
    category: 'utility',
    subCategory: 'মোবাইল রিচার্জ',
    keywords: ['মোবাইল রিচার্জ', 'রিচার্জ', 'ফ্লেক্সিলোড', 'টপআপ', 'মোবাইল খরচ']
  },
  {
    category: 'utility',
    subCategory: 'গ্যাস বিল',
    keywords: ['গ্যাস বিল', 'সিলিন্ডার', 'এলপিজি']
  },
  {
    category: 'medical',
    subCategory: 'প্রেসক্রিপশনের ওষুধ',
    keywords: ['ওষুধ', 'ঔষধ', 'ট্যাবলেট', 'ফার্মেসি', 'সিরাপ']
  },
  {
    category: 'medical',
    subCategory: 'ডাক্তারের ভিজিট ফি',
    keywords: ['ডাক্তার', 'ডাক্তারের ফি', 'ভিজিট', 'হাসপাতাল', 'ক্লিনিক', 'টেস্ট']
  },
  {
    category: 'education',
    subCategory: 'স্কুলের মাসিক বেতন',
    keywords: ['স্কুল ফি', 'স্কুলের বেতন', 'কলেজের বেতন', 'পরীক্ষার ফি', 'মাদ্রাসা']
  },
  {
    category: 'education',
    subCategory: 'টিউশন ফি',
    keywords: ['টিউশন', 'কোচিং', 'স্যার', 'মাস্টার', 'টিচার']
  },
  {
    category: 'snacks',
    subCategory: 'বিকালের চা-নাস্তা',
    keywords: ['নাস্তা', 'চা', 'সিঙ্গারা', 'সমুচা', 'বিস্কুট', 'কফি', 'মিষ্টি']
  },
  {
    category: 'rent',
    subCategory: 'বাসা ভাড়া',
    keywords: ['বাসা ভাড়া', 'ফ্ল্যাট ভাড়া', 'ভাড়া', 'সার্ভিস চার্জ']
  },
  {
    category: 'shopping',
    subCategory: 'পোশাক ও জুতা',
    keywords: ['জামা', 'কাপড়', 'জুতো', 'শার্ট', 'প্যান্ট', 'শপিং', 'পোশাক']
  }
];

// Business expense categories mapping
const BIZ_EXPENSE_CATEGORY_MAP = [
  {
    category: 'দোকান/অফিস ভাড়া',
    keywords: ['দোকান ভাড়া', 'অফিস ভাড়া', 'গোডাউন ভাড়া', 'ভাড়া']
  },
  {
    category: 'কর্মচারীর বেতন/মজুরি',
    keywords: ['বেতন', 'কর্মচারী', 'মজুরি', 'স্টাফ', 'স্যালারি']
  },
  {
    category: 'বিদ্যুৎ ও ইউটিলিটি বিল',
    keywords: ['বিদ্যুৎ বিল', 'কারেন্ট বিল', 'পানি বিল', 'গ্যাস বিল', 'ইন্টারনেট বিল', 'ওয়াইফাই']
  },
  {
    category: 'পরিবহন ও যাতায়াত',
    keywords: ['মাল পরিবহন', 'গাড়ি ভাড়া', 'ভ্যান ভাড়া', 'পরিবহন', 'পিকআপ', 'ট্রাক ভাড়া', 'কুরিয়ার']
  },
  {
    category: 'আপ্যায়ন ও মেহমানদারি',
    keywords: ['আপ্যায়ন', 'চা নাস্তা', 'কাস্টমার আপ্যায়ন', 'মেহমানদারি', 'খাবার']
  },
  {
    category: 'প্যাকেজিং ও পলিথিন',
    keywords: ['প্যাকেট', 'ব্যাগ', 'পলিথিন', 'কার্টন', 'প্যাকেজিং']
  },
  {
    category: 'মেরামত ও রক্ষণাবেক্ষণ',
    keywords: ['মেরামত', 'সার্ভিসিং', 'লাইট', 'ফ্যান মেরামত', 'রক্ষণাবেক্ষণ']
  },
  {
    category: 'বিজ্ঞাপন ও প্রচারণা',
    keywords: ['বিজ্ঞাপন', 'ব্যানার', 'লিফলেট', 'মাইকিং']
  }
];

// Payment methods
const PAYMENT_METHODS = [
  { method: 'বিকাশ (bKash)', keywords: ['বিকাশ', 'বিকাশে', 'bkash'] },
  { method: 'নগদ (Nagad)', keywords: ['নগদ অ্যাপ', 'নগদে', 'nagad'] },
  { method: 'রকেট (Rocket)', keywords: ['রকেট', 'রকেটে', 'rocket'] },
  { method: 'ব্যাংক কার্ড / ট্রান্সফার', keywords: ['ব্যাংক', 'কার্ড', 'কার্ডে', 'চেক'] },
  { method: 'নগদ ক্যাশ (Cash)', keywords: ['ক্যাশ', 'ক্যাশে', 'নগদ টাকা', 'হাতে'] }
];

/**
 * Parses spoken Bengali expense sentence into structured expense object:
 * e.g.:
 *  "আজ বাজারে মাছ ও শাকসবজি কিনলাম ৬৫০ টাকা" ->
 *    { title: "মাছ ও শাকসবজি", amount: 650, category: "bazaar", subCategory: "কাঁচা শাকসবজি", paymentMethod: "নগদ ক্যাশ (Cash)" }
 *  "দোকান ভাড়া দিলাম ৮০০০ টাকা ক্যাশ" ->
 *    { title: "দোকান ভাড়া", amount: 8000, bizCategory: "দোকান/অফিস ভাড়া", paymentMethod: "নগদ ক্যাশ (Cash)" }
 */
export const parseBengaliExpenseVoice = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return null;
  }

  const rawText = transcript.trim();
  let text = rawText.toLowerCase();

  // Strip punctuation
  text = text.replace(/[,.?।!]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Extract Amount (টাকা / ৳)
  let extractedAmount = null;

  // Attached digits with 'টাকা' / 'tk' (e.g. '৫০০ টাকা', '৮০০০টাকা', '1200tk')
  const attachedMoneyPattern = /([০-৯0-9.]+)\s*(টাকা|টা|টাকায়|tk|taka)/i;
  const attachedMoneyMatch = text.match(attachedMoneyPattern);
  if (attachedMoneyMatch) {
    const num = convertBengaliDigitsToNumber(attachedMoneyMatch[1]);
    if (num !== null) {
      extractedAmount = num;
      text = text.replace(attachedMoneyMatch[0], ' ');
    }
  }

  // Word numbers followed by 'টাকা' (e.g. 'পাঁচশ টাকা', 'দুই হাজার টাকা', 'দশ টাকা')
  if (extractedAmount === null) {
    if (text.includes('এক হাজার') || text.includes('১ হাজার')) extractedAmount = 1000;
    else if (text.includes('দুই হাজার')) extractedAmount = 2000;
    else if (text.includes('পাঁচ হাজার')) extractedAmount = 5000;
    else if (text.includes('দশ হাজার')) extractedAmount = 10000;
    else if (text.includes('পাঁচশ') || text.includes('পাঁচশো')) extractedAmount = 500;
    else if (text.includes('দুইশো') || text.includes('দুইশ')) extractedAmount = 200;
    else if (text.includes('একশো') || text.includes('একশ')) extractedAmount = 100;
  }

  // Standalone digits
  if (extractedAmount === null) {
    const standaloneMatch = text.match(/(^|\s)([০-৯0-9]{2,8})(\s|$)/);
    if (standaloneMatch) {
      const num = convertBengaliDigitsToNumber(standaloneMatch[2]);
      if (num !== null) {
        extractedAmount = num;
        text = text.replace(standaloneMatch[0], ' ');
      }
    }
  }

  // 2. Extract Payment Method
  let detectedPayment = 'নগদ ক্যাশ (Cash)';
  for (const pm of PAYMENT_METHODS) {
    if (pm.keywords.some(k => text.includes(k))) {
      detectedPayment = pm.method;
      // remove keyword
      for (const k of pm.keywords) {
        text = text.replace(new RegExp(`(^|\\s)${k}(\\s|$)`, 'i'), ' ');
      }
      break;
    }
  }

  // 3. Detect Categories (Personal & Business)
  let detectedCategory = 'other';
  let detectedSubCategory = 'বিবিধ টুকিটাকি';
  let detectedBizCategory = 'অন্যান্য খরচ';

  for (const cm of EXPENSE_CATEGORY_MAP) {
    if (cm.keywords.some(k => text.includes(k))) {
      detectedCategory = cm.category;
      detectedSubCategory = cm.subCategory;
      break;
    }
  }

  for (const bcm of BIZ_EXPENSE_CATEGORY_MAP) {
    if (bcm.keywords.some(k => text.includes(k))) {
      detectedBizCategory = bcm.category;
      break;
    }
  }

  // 4. Clean Action Words & Fillers to get the Title
  const expenseFillers = [
    'আজ', 'আজকে', 'কালকে', 'গেছে', 'খরচ', 'হলো', 'হয়েছে',
    'দিলাম', 'দিয়েছি', 'দিতে', 'কিনলাম', 'কিনেছি', 'কিনব',
    'করলাম', 'করেছি', 'বিল', 'টাকা', 'বাবদ', 'এর', 'জন্য',
    'প্লিজ', 'ভাই', 'এন্ট্রি', 'করো', 'করুন', 'যোগ'
  ];

  let cleanedTitle = text;
  for (const f of expenseFillers) {
    cleanedTitle = cleanedTitle.replace(new RegExp(`(^|\\s)${f}(\\s|$)`, 'gi'), ' ');
  }

  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();
  if (!cleanedTitle) {
    cleanedTitle = detectedSubCategory !== 'বিবিধ টুকিটাকি' ? detectedSubCategory : (detectedBizCategory || 'দৈনিক খরচ');
  }

  return {
    rawTranscript: rawText,
    title: cleanedTitle,
    amount: extractedAmount || '',
    category: detectedCategory,
    subCategory: detectedSubCategory,
    bizCategory: detectedBizCategory,
    paymentMethod: detectedPayment,
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * Parses spoken Bengali product sentence for Inventory additions:
 * e.g.:
 *  "প্রাণ সরিষার তেল ৫০০ মিলি কেনা দাম ১১০ বিক্রয় ১৩০ স্টক ৩০ বোতল" ->
 *    { name: "প্রাণ সরিষার তেল (৫০০ মিলি)", costPrice: 110, sellPrice: 130, stock: 30, unit: "বোতল" }
 */
export const parseBengaliProductVoice = (transcript) => {
  if (!transcript || typeof transcript !== 'string') {
    return null;
  }

  const rawText = transcript.trim();
  let text = rawText.toLowerCase().replace(/[,.?।!]/g, ' ').replace(/\s+/g, ' ').trim();

  let costPrice = '';
  let sellPrice = '';
  let stock = '';
  let unit = 'পিস';

  // 1. Detect Unit
  const units = ['কেজি', 'গ্রাম', 'লিটার', 'মিলি', 'প্যাকেট', 'পিস', 'বস্তা', 'বোতল', 'বক্স', 'কার্টন', 'হালি', 'ডজন'];
  for (const u of units) {
    if (text.includes(u)) {
      unit = u;
      break;
    }
  }

  // 2. Extract Stock (e.g. 'স্টক ৩০ বোতল', 'স্টক ৫০', '২০ পিস')
  const stockPattern = /স্টক\s*([০-৯0-9.]+)/i;
  const stockMatch = text.match(stockPattern);
  if (stockMatch) {
    stock = convertBengaliDigitsToNumber(stockMatch[1]) || '';
    text = text.replace(stockMatch[0], ' ');
  }

  // 3. Extract Buy/Cost Price (কেনা দাম / পাইকারি / ক্রয়মূল্য / cost)
  const costPattern = /(কেনা\s*দাম|ক্রয়\s*দাম|ক্রয়মূল্য|কেনা|পাইকারি|পাইকারি\s*দাম|cost)\s*([০-৯0-9.]+)/i;
  const costMatch = text.match(costPattern);
  if (costMatch) {
    costPrice = convertBengaliDigitsToNumber(costMatch[2]) || '';
    text = text.replace(costMatch[0], ' ');
  }

  // 4. Extract Sell Price (বিক্রয় মূল্য / খুচরা / sell)
  const sellPattern = /(বিক্রয়\s*মূল্য|বিক্রয়\s*দাম|বিক্রয়|খুচরা|খুচরা\s*দাম|sell)\s*([০-৯0-9.]+)/i;
  const sellMatch = text.match(sellPattern);
  if (sellMatch) {
    sellPrice = convertBengaliDigitsToNumber(sellMatch[2]) || '';
    text = text.replace(sellMatch[0], ' ');
  }

  // 5. Clean remaining title
  const productFillers = [
    'নতুন', 'প্রোডাক্ট', 'পণ্য', 'এড', 'করো', 'করুন', 'যোগ',
    'টাকা', 'দাম', 'স্টক', 'আছে', 'কেনা', 'বিক্রয়', 'খুচরা', 'পাইকারি'
  ];
  let cleanedName = text;
  for (const f of productFillers) {
    cleanedName = cleanedName.replace(new RegExp(`(^|\\s)${f}(\\s|$)`, 'gi'), ' ');
  }
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

  // Default fallbacks if prices found in generic order
  if (!costPrice && !sellPrice) {
    const standaloneNumbers = (text.match(/([০-৯0-9.]+)/g) || []).map(convertBengaliDigitsToNumber).filter(Boolean);
    if (standaloneNumbers.length >= 2) {
      costPrice = standaloneNumbers[0];
      sellPrice = standaloneNumbers[1];
      if (standaloneNumbers.length >= 3 && !stock) {
        stock = standaloneNumbers[2];
      }
    }
  }

  return {
    rawTranscript: rawText,
    name: cleanedName || 'নতুন পণ্য',
    costPrice,
    sellPrice,
    stock: stock || 10,
    unit
  };
};

/**
 * Parses spoken Bengali debt & ledger commands:
 * e.g.
 *  - "রহিম ভাইয়ের বকেয়া থেকে ৫০০ টাকা জমা নিলাম" ->
 *      { personName: "রহিম", type: 'repay_lend', amount: 500, note: "বকেয়া জমা" }
 *  - "করিম সাহেবের নতুন বাকি ৩৫০ টাকা" ->
 *      { personName: "করিম", type: 'lend', amount: 350, note: "নতুন বাকি" }
 *  - "সাপ্লায়ার মোশাররফ ভাইকে ৫০০০ টাকা পরিশোধ করলাম" ->
 *      { personName: "মোশাররফ", type: 'repay_borrow', amount: 5000, note: "পাওনা পরিশোধ" }
 */
export const parseBengaliDebtVoice = (transcript, debtList = []) => {
  if (!transcript || typeof transcript !== 'string') return null;

  const rawText = transcript.trim();
  let text = rawText.toLowerCase().replace(/[,.?।!]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Extract Amount
  let amount = null;
  const moneyPattern = /([০-৯0-9.]+)\s*(টাকা|টা|টাকায়|tk)/i;
  const moneyMatch = text.match(moneyPattern);
  if (moneyMatch) {
    amount = convertBengaliDigitsToNumber(moneyMatch[1]);
    text = text.replace(moneyMatch[0], ' ');
  }
  if (!amount) {
    const standaloneMatch = text.match(/(^|\s)([০-৯0-9]{2,8})(\s|$)/);
    if (standaloneMatch) {
      amount = convertBengaliDigitsToNumber(standaloneMatch[2]);
      text = text.replace(standaloneMatch[0], ' ');
    }
  }

  // 2. Detect Transaction Type
  let type = 'repay_lend'; // default: customer paying due
  let isRepay = text.includes('জমা') || text.includes('পরিশোধ') || text.includes('আদায়') || text.includes('আদায়') || text.includes('দিল') || text.includes('রিসিভ');
  let isBorrow = text.includes('সাপ্লায়ার') || text.includes('মহাজন') || text.includes('ধার নিলাম') || text.includes('নিলাম');

  if (isRepay) {
    type = isBorrow ? 'repay_borrow' : 'repay_lend';
  } else {
    // Giving credit / new due
    type = isBorrow ? 'borrow' : 'lend';
  }

  // 3. Match Person from debtList
  let matchedPerson = null;
  for (const p of debtList) {
    const pName = (p.name || '').toLowerCase();
    const pPhone = (p.phone || '').toLowerCase();
    const nameWords = pName.split(/\s+/).filter(Boolean);

    for (const nw of nameWords) {
      if (nw.length >= 3 && text.includes(nw)) {
        matchedPerson = p;
        break;
      }
    }
    if (matchedPerson) break;
  }

  // 4. Clean Person Name fallback
  const debtFillers = [
    'ভাইয়ের', 'ভাই', 'সাহেবের', 'সাহেব', 'থেকে', 'কে', 'হতে',
    'বকেয়া', 'বাকি', 'টাকা', 'জমা', 'নিলাম', 'দিলাম', 'পরিশোধ',
    'করলাম', 'নতুন', 'হিসাব', 'খাতায়', 'লেখো', 'এন্ট্রি', 'করো', 'করুন'
  ];
  let fallbackName = text;
  for (const f of debtFillers) {
    fallbackName = fallbackName.replace(new RegExp(`(^|\\s)${f}(\\s|$)`, 'gi'), ' ');
  }
  fallbackName = fallbackName.replace(/\s+/g, ' ').trim();

  return {
    rawTranscript: rawText,
    matchedPerson,
    personName: matchedPerson ? matchedPerson.name : (fallbackName || 'কাস্টমার'),
    type,
    amount: amount || '',
    note: isRepay ? 'ভয়েসে বকেয়া আদায়/পরিশোধ' : 'ভয়েসে নতুন বাকি এন্ট্রি'
  };
};

/**
 * Parses spoken Bengali customer contact creation:
 * e.g. "নতুন কাস্টমার হাজী আব্দুল কাদের মোবাইল ০১৭১১২২৩৩৪৪ ঠিকানা চকবাজার"
 */
export const parseBengaliCustomerVoice = (transcript) => {
  if (!transcript || typeof transcript !== 'string') return null;

  const rawText = transcript.trim();
  let text = rawText.toLowerCase().replace(/[,.?।!]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Extract Mobile Phone Number (11 digits in Bengali or English)
  let phone = '';
  const phonePattern = /(০১[০-৯]{9}|01[0-9]{9})/;
  const phoneMatch = text.match(phonePattern);
  if (phoneMatch) {
    phone = phoneMatch[0];
    // normalize Bengali digits to English
    let normPhone = '';
    for (const ch of phone) {
      normPhone += convertBengaliDigitsToNumber(ch) !== null ? convertBengaliDigitsToNumber(ch) : ch;
    }
    phone = normPhone;
    text = text.replace(phoneMatch[0], ' ');
  }

  // 2. Extract Address
  let address = '';
  const addressKeywords = ['ঠিকানা', 'বাসা', 'দোকান', 'এলাকা'];
  for (const ak of addressKeywords) {
    if (text.includes(ak)) {
      const parts = text.split(ak);
      if (parts[1]) {
        address = parts[1].replace(/\s+/g, ' ').trim();
        text = parts[0];
      }
      break;
    }
  }

  // 3. Clean Name
  const customerFillers = [
    'নতুন', 'কাস্টমার', 'ক্রেতা', 'মোবাইল', 'ফোন', 'নাম্বার', 'নম্বর',
    'ঠিকানা', 'এড', 'করো', 'করুন', 'যোগ', 'সেভ'
  ];
  let cleanedName = text;
  for (const f of customerFillers) {
    cleanedName = cleanedName.replace(new RegExp(`(^|\\s)${f}(\\s|$)`, 'gi'), ' ');
  }
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

  return {
    rawTranscript: rawText,
    name: cleanedName || 'নতুন কাস্টমার',
    phone: phone || '',
    address: address || ''
  };
};

/**
 * Parses spoken Bazaar / Shopping list items:
 * e.g. "২ কেজি আলু, ১ কেজি পেঁয়াজ আর ৫০০ গ্রাম রসুন"
 */
export const parseBengaliShoppingListVoice = (transcript) => {
  if (!transcript || typeof transcript !== 'string') return [];

  const rawText = transcript.trim();
  // Split on commas, "আর", "এবং", "ও"
  const rawItems = rawText.split(/[,،।\n]|(\s+আর\s+)|\s+এবং\s+|\s+ও\s+/).filter(Boolean);

  const parsedItems = [];
  for (const part of rawItems) {
    const cleanPart = part.replace(/\s+/g, ' ').trim();
    if (!cleanPart || ['আর', 'এবং', 'ও', 'কিনতে হবে', 'বাজারের ফর্দ'].includes(cleanPart)) continue;

    // Parse single item with quantity/unit
    let qty = 1;
    let unit = 'পিস';
    let text = cleanPart;

    const attachedPattern = /([০-৯0-9.]+)\s*(কেজি|গ্রাম|লিটার|প্যাকেট|পিস|টা|টি|হালি|ডজন|আঁটি)/i;
    const match = text.match(attachedPattern);
    if (match) {
      qty = convertBengaliDigitsToNumber(match[1]) || 1;
      unit = match[2];
      text = text.replace(match[0], ' ');
    }

    const itemName = text.replace(/(কিনব|কিনতে হবে|দাও|দিন|লাগবে)/gi, '').replace(/\s+/g, ' ').trim();
    if (itemName) {
      parsedItems.push({
        id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: itemName,
        quantity: qty,
        unit,
        isCompleted: false
      });
    }
  }

  return parsedItems;
};

/**
 * Initializes and starts Web Speech Recognition with callbacks
 */
export const startUniversalSpeechListener = ({ onResult, onInterim, onError, onEnd, lang = 'bn-BD', continuous = false }) => {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('SpeechRecognition not supported in this browser');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (interimStr && onInterim) onInterim(interimStr);
      if (finalStr && onResult) onResult(finalStr);
    };

    recognition.onerror = (event) => {
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognition.start();
    return recognition;
  } catch (err) {
    if (onError) onError(err.message);
    return null;
  }
};


