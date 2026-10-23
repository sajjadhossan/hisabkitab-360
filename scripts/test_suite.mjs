import { SAMITY_DICTIONARY, SAMITY_WHOLE_WORD_MAP, translateSamityText } from '../somiti-360/src/utils/samityDictionary.js';

// Test a wide variety of real application phrases
const testSuite = [
  "নতুন সদস্যের তালিকা",
  "সমিতির মোট জমা",
  "চলতি মাসের চাঁদা আদায়ের তালিকা",
  "সদস্যদের বকেয়া খতিয়ান",
  "ব্যাংক একাউন্টে জমা দিন",
  "অফিসের যাবতীয় খরচসমূহ",
  "সদস্যকে রিমাইন্ডার পাঠানো হয়েছে",
  "মাসিক কিস্তির পরিমাণ",
  "কার্যনির্বাহী কমিটির মিটিং",
  "সাধারণ সম্পাদক ও কোষাধ্যক্ষের স্বাক্ষর",
  "মাসিক সঞ্চয় কিস্তি (টাকা)",
  "ঋণ অনুমোদন ও মঞ্জুর ফর্ম",
  "ডিপিএস হিসাবের বিবরণী",
  "বকেয়া সদস্যদের তালিকা দেখুন",
  "রিমাইন্ডার পাঠান",
  "সফলভাবে সংরক্ষিত হয়েছে",
  "কোনো তথ্য পাওয়া যায়নি",
  "তথ্য মুছে ফেলতে চান?",
  "হ্যাঁ, নিশ্চিত করুন"
];

console.log("=== COMPREHENSIVE SUITE TEST ===");
for (const s of testSuite) {
  console.log(`[RAW]: ${s}`);
  console.log(`[EN ]: ${translateSamityText(s, 'en')}\n`);
}
