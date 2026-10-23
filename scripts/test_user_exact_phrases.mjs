import { translateSamityText } from '../somiti-360/src/utils/samityDictionary.js';

const testPhrases = [
  // Example 1: Due module
  "Due / বকেয়া Management Module",
  "মাসিক বকেয়া গণনা, বিলম্ব ফি, বকেয়া নোটিশ প্রিন্ট ও বিশেষ মওকুফ (Waiver)",

  // Example 2: Dutch Bangla Bank Mirpur Branch
  "ডাচ্-বাংলা ব্যাংক (মিরপুর শাখা)",
  "ডাচ্-বাংলা ব্যাংক",
  "মিরপুর শাখা",

  // Example 3: Members & Welfare KPI & Dropdowns
  "চলতি মাসে বকেয়া",
  "0 জন",
  "১৫ জন",
  "সব পেমেন্ট অবস্থা",
  "সব সদস্য পদবি (0)",
  "সব সদস্য পদবি",
  "সব স্ট্যাটাস",

  // Example 4: Bank & Cash deposit table & headers
  "ব্যাংক ও নগদ জমা এন্ট্রি মডিউল (Bank Deposit Entry Module)",
  "ভাউচার নম্বর, ব্যাংক রসিদ, চেক, অনলাইন TrxID, স্লিপ ইমেজ ও অনুমোদনসহ পূর্ণাঙ্গ আমানত ব্যবস্থাপনা",
  "ভাউচার ও রসিদ নং",
  "তারিখ ও সময়",
  "পরিশোধিত সময়কাল",
  "ডকুমেন্ট / স্লিপ",
  "সব জমার ধরন (All Types)",
  "সব মাধ্যম (All Methods)"
];

console.log("=== USER REPORTED EXACT PHRASES TEST ===");
for (const p of testPhrases) {
  console.log(`[RAW]: ${p}`);
  console.log(`[EN ]: ${translateSamityText(p, 'en')}\n`);
}
