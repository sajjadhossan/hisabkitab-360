import { translateSamityText } from '../somiti-360/src/utils/samityDictionary.js';

const testStrings = [
  "সদস্য কোড / আইডি",
  "মাসিক সঞ্চয় কিস্তি (টাকা)",
  "জমা দেওয়া হয়েছে",
  "বকেয়া ও ডিউ তালিকা",
  "মোট নিবন্ধিত সদস্য সংখ্যা",
  "সমিতির নীট তহবিল ব্যালেন্স (Fund Balance)",
  "সফলভাবে সংরক্ষিত হয়েছে",
  "কোনো তথ্য পাওয়া যায়নি",
  "নতুন সদস্য ভর্তি ফর্ম"
];

console.log("=== TRANSLATION ENGINE TEST ===");
for (const s of testStrings) {
  console.log(`[BN]: ${s} => [EN]: ${translateSamityText(s, 'en')}`);
}
