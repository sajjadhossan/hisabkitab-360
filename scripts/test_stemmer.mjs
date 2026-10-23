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

// Add common roots if not already present
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

// Bengali inflection suffixes ordered by longest first
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
  { suffix: 'ের', transform: (base) => `${base}'s` },   // e-kar + ra (\u09c7\u09b0)
  { suffix: 'এর', transform: (base) => `${base}'s` },   // independent E + ra
  { suffix: 'র', transform: (base) => `${base}'s` },    // ra
  { suffix: 'কে', transform: (base) => `${base}` },     // ka + e-kar
  { suffix: 'তে', transform: (base) => `${base}` },     // ta + e-kar
  { suffix: 'ে', transform: (base) => `${base}` },      // e-kar (\u09c7)
  { suffix: 'ায়', transform: (base) => `${base}` },     // a-kar + ya
  { suffix: 'য়ে', transform: (base) => `${base}` },     // ya + e-kar
  { suffix: 'য়', transform: (base) => `${base}` }       // ya
];

function stemAndTranslateWord(word) {
  // 1. Direct match
  if (MASTER_MAP.has(word)) return MASTER_MAP.get(word);

  // 2. Try inflection stripping
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

const testWords = [
  "সদস্য", "সদস্যের", "সদস্যদের", "সদস্যগণ", "সদস্যকে",
  "সমিতি", "সমিতির", "সমিতিসমূহ",
  "মাস", "মাসের", "মাসিক",
  "কিস্তি", "কিস্তির",
  "খরচ", "খরচের", "খরচসমূহ",
  "আদায়", "আদায়ের",
  "ব্যাংক", "ব্যাংকে",
  "একাউন্ট", "একাউন্টে",
  "শাখা", "শাখায়",
  "তারিখ", "তারিখে",
  "বকেয়া", "বকেয়ার",
  "অফিস", "অফিসের"
];

console.log("=== BENGALI STEMMER TEST (V2) ===");
for (const w of testWords) {
  console.log(`[${w}] => ${stemAndTranslateWord(w)}`);
}
