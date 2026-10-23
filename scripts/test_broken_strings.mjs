import { translateSamityText } from '../somiti-360/src/utils/samityDictionary.js';

const testBrokenStrings = [
  "নতুন সদস্যের তালিকা",
  "সমিতির মোট জমা",
  "চলতি মাসের চাঁদা আদায়ের তালিকা",
  "সদস্যদের বকেয়া খতিয়ান",
  "ব্যাংক একাউন্টে জমা দিন",
  "অফিসের যাবতীয় খরচসমূহ",
  "সদস্যকে রিমাইন্ডার পাঠানো হয়েছে",
  "মাসিক কিস্তির পরিমাণ"
];

console.log("=== TESTING REAL-WORLD STRINGS FOR BROKEN SUFFIXES ===");
for (const s of testBrokenStrings) {
  console.log(`[RAW]: "${s}"`);
  console.log(`[TRANSLATED]: "${translateSamityText(s, 'en')}"\n`);
}
