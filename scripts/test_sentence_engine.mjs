import { SAMITY_DICTIONARY, SAMITY_WHOLE_WORD_MAP } from '../somiti-360/src/utils/samityDictionary.js';

// Pre-build a master lookup of base words
const MASTER_MAP = new Map();

for (const [k, v] of Object.entries(SAMITY_DICTIONARY)) {
  if (!k.includes(' ') && k.length >= 2) {
    MASTER_MAP.set(k, v);
  }
}
for (const [k, v] of Object.entries(SAMITY_WHOLE_WORD_MAP)) {
  MASTER_MAP.set(k, v);
}

MASTER_MAP.set("একাউন্ট", "Account");
MASTER_MAP.set("অ্যাকাউন্ট", "Account");
MASTER_MAP.set("সদস্য", "Member");
MASTER_MAP.set("মাস", "Month");
MASTER_MAP.set("খরচ", "Expense");
MASTER_MAP.set("আদায়", "Collection");
MASTER_MAP.set("অফিস", "Office");
MASTER_MAP.set("কিস্তি", "Installment");
MASTER_MAP.set("জমা", "Deposit");
MASTER_MAP.set("বকেয়া", "Due");
MASTER_MAP.set("টাকা", "Tk");
MASTER_MAP.set("তারিখ", "Date");
MASTER_MAP.set("শাখা", "Branch");
MASTER_MAP.set("ব্যাংক", "Bank");
MASTER_MAP.set("যাবতীয়", "All");
MASTER_MAP.set("চলতি", "Current");
MASTER_MAP.set("পাঠানো", "Sent");
MASTER_MAP.set("হয়েছে", "Done");

// Common multi-word phrases (Safe Longest-match replacements)
const COMMON_PHRASES = [
  { bn: "জমা দিন", en: "Make Deposit" },
  { bn: "জমা করুন", en: "Submit Deposit" },
  { bn: "পাঠানো হয়েছে", en: "has been sent" },
  { bn: "দেওয়া হয়েছে", en: "has been given" },
  { bn: "হালনাগাদ করা হয়েছে", en: "has been updated" },
  { bn: "সংরক্ষণ করা হয়েছে", en: "has been saved" },
  { bn: "অনুমোদন করা হয়েছে", en: "has been approved" },
  { bn: "বাতিল করা হয়েছে", en: "has been cancelled" },
  { bn: "চাঁদা আদায়", en: "Subscription Collection" },
  { bn: "চাঁদা আদায়ের", en: "Subscription Collection's" },
  { bn: "বকেয়া খতিয়ান", en: "Due Ledger" },
  { bn: "বকেয়া তালিকা", en: "Defaulters List" },
  { bn: "নতুন সদস্যের", en: "New Member's" },
  { bn: "নতুন সদস্য", en: "New Member" },
  { bn: "চলতি মাসের", en: "Current Month's" },
  { bn: "মাসিক কিস্তির", en: "Monthly Installment's" },
  { bn: "মাসিক সঞ্চয়", en: "Monthly Savings" },
  { bn: "ব্যাংক একাউন্টে", en: "to Bank Account" },
  { bn: "যাবতীয় খরচসমূহ", en: "All Expenses" },
  { bn: "যাবতীয় খরচ", en: "All Expenses" }
];

const SUFFIX_RULES = [
  { suffix: 'সমূহের', transform: (base) => `${base}s'` },
  { suffix: 'গুলোর', transform: (base) => `${base}s'` },
  { suffix: 'গুলির', transform: (base) => `${base}s'` },
  { suffix: 'সমূহ', transform: (base) => `${base}s` },
  { suffix: 'গুলো', transform: (base) => `${base}s` },
  { suffix: 'গুলি', transform: (base) => `${base}s` },
  { suffix: 'দের', transform: (base) => `${base}s'` },
  { suffix: 'গণের', transform: (base) => `${base}s'` },
  { suffix: 'গণ', transform: (base) => `${base}s` },
  { suffix: 'টির', transform: (base) => `${base}'s` },
  { suffix: 'টার', transform: (base) => `${base}'s` },
  { suffix: 'টি', transform: (base) => `${base}` },
  { suffix: 'টা', transform: (base) => `${base}` },
  { suffix: 'ের', transform: (base) => `${base}'s` },
  { suffix: 'এর', transform: (base) => `${base}'s` },
  { suffix: 'র', transform: (base) => `${base}'s` },
  { suffix: 'কে', transform: (base) => `${base}` },
  { suffix: 'তে', transform: (base) => `${base}` },
  { suffix: 'ে', transform: (base) => `${base}` },
  { suffix: 'ায়', transform: (base) => `${base}` },
  { suffix: 'য়ে', transform: (base) => `${base}` },
  { suffix: 'য়', transform: (base) => `${base}` }
];

function stemAndTranslateWord(word) {
  if (MASTER_MAP.has(word)) return MASTER_MAP.get(word);

  for (const rule of SUFFIX_RULES) {
    if (word.endsWith(rule.suffix) && word.length > rule.suffix.length) {
      const stem = word.slice(0, -rule.suffix.length);
      if (MASTER_MAP.has(stem)) {
        return rule.transform(MASTER_MAP.get(stem));
      }
    }
  }

  return word;
}

export function translateSentence(text) {
  if (!text || typeof text !== 'string') return text;
  let translated = text.trim();

  // 1. Exact full dictionary match
  if (SAMITY_DICTIONARY[translated]) return SAMITY_DICTIONARY[translated];

  // 2. Safe whole-phrase replacement
  for (const p of COMMON_PHRASES) {
    if (translated.includes(p.bn)) {
      translated = translated.split(p.bn).join(p.en);
    }
  }

  // 3. Multi-word phrase matches from dictionary (ordered by length)
  const dictPhraseKeys = Object.keys(SAMITY_DICTIONARY)
    .filter(k => k.includes(' ') && k.length >= 4)
    .sort((a, b) => b.length - a.length);

  for (const k of dictPhraseKeys) {
    if (translated.includes(k)) {
      translated = translated.split(k).join(SAMITY_DICTIONARY[k]);
    }
  }

  // 4. Token-level morphological translation for remaining Bengali words
  // Match contiguous Bengali words with their punctuation preserved
  translated = translated.replace(/[\u0980-\u09FF]+/g, (match) => {
    return stemAndTranslateWord(match);
  });

  // 5. Clean up extra spaces
  return translated.replace(/\s+/g, ' ').trim();
}

const testStrings = [
  "নতুন সদস্যের তালিকা",
  "সমিতির মোট জমা",
  "চলতি মাসের চাঁদা আদায়ের তালিকা",
  "সদস্যদের বকেয়া খতিয়ান",
  "ব্যাংক একাউন্টে জমা দিন",
  "অফিসের যাবতীয় খরচসমূহ",
  "সদস্যকে রিমাইন্ডার পাঠানো হয়েছে",
  "মাসিক কিস্তির পরিমাণ"
];

console.log("=== SENTENCE TRANSLATION ENGINE TEST ===");
for (const s of testStrings) {
  console.log(`[RAW]: "${s}" => [TRANSLATED]: "${translateSentence(s)}"`);
}
