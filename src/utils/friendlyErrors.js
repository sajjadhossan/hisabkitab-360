/**
 * Friendly Error Messages Translator
 * -----------------------------------
 * Replaces cryptic tech errors ("Error: TypeError", "QuotaExceededError", "NetworkError")
 * with reassuring, human-readable Bengali & English instructions.
 */

export function toFriendlyErrorMessage(error, lang = 'bn') {
  if (!error) return '';
  const msg = typeof error === 'string' ? error : (error.message || String(error));
  const lower = msg.toLowerCase();

  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('load failed') || lower.includes('offline')) {
    return lang === 'bn'
      ? '🌐 ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। ডাটা লোকাল মেমরিতে সুরক্ষিত রাখা হয়েছে।'
      : 'No internet connection. Data is safely stored in local memory.';
  }

  if (lower.includes('quota') || lower.includes('storage')) {
    return lang === 'bn'
      ? '💾 ডিভাইসের লোকাল স্টোরেজ পূর্ণ হয়ে গেছে। অনুগ্রহ করে পুরনো ব্যাকআপ এক্সপোর্ট করে ক্লিয়ার করুন।'
      : 'Device storage limit reached. Please export and clean old data.';
  }

  if (lower.includes('permission') || lower.includes('denied') || lower.includes('notallowed')) {
    return lang === 'bn'
      ? '🔒 প্রয়োজনীয় পারমিশন (ক্যামেরা/স্টোরেজ/মাইক্রোফোন) চালু করা নেই।'
      : 'Required device permission is not allowed.';
  }

  if (lower.includes('not found') || lower.includes('404')) {
    return lang === 'bn'
      ? '🔍 কাঙ্ক্ষিত তথ্য বা রেকর্ডটি খুঁজে পাওয়া যায়নি।'
      : 'The requested record could not be found.';
  }

  return lang === 'bn'
    ? '⚠️ একটি সাময়িক ত্রুটি ঘটেছে, পুনরায় চেষ্টা করুন।'
    : 'A temporary error occurred, please try again.';
}
