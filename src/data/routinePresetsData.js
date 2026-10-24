/**
 * Routine Shopping Presets Master Catalog
 * Initial presets for personal family routine shopping and business supplies
 */

export const DEFAULT_ROUTINE_PRESETS = [
  {
    id: 'preset-fam-weekly',
    name: 'সাপ্তাহিক পারিবারিক বাজার',
    profile: 'personal',
    folder: 'গৃহস্থালি ও নিত্য কেনাকাটা',
    subFolder: 'কাঁচা শাকসবজি',
    familyMember: 'পুরো পরিবার (সবার জন্য)',
    type: 'daily',
    items: [
      { id: 'it-1', name: 'মিনিকেট চাল', unit: '৫ কেজি', defaultAmount: 400 },
      { id: 'it-2', name: 'সয়াবিন তেল', unit: '২ লিটার', defaultAmount: 380 },
      { id: 'it-3', name: 'দেশি ডিম', unit: '১ ডজন', defaultAmount: 160 },
      { id: 'it-4', name: 'আলু ও পেঁয়াজ', unit: '৩ কেজি', defaultAmount: 220 },
      { id: 'it-5', name: 'তাজা মাছ ও শাকসবজি', unit: 'বাজার', defaultAmount: 650 },
      { id: 'it-6', name: 'গরু/মুরগির মাংস', unit: '১ কেজি', defaultAmount: 350 }
    ]
  },
  {
    id: 'preset-fam-daily',
    name: 'দৈনন্দিন নিত্য মুদি বাজার',
    profile: 'personal',
    folder: 'দৈনন্দিন বাজার খরচ',
    subFolder: 'কাঁচা শাকসবজি',
    familyMember: 'নিজে (Self)',
    type: 'daily',
    items: [
      { id: 'it-7', name: 'দুধ ও পাউরুটি', unit: '১ প্যাকেট', defaultAmount: 120 },
      { id: 'it-8', name: 'কাঁচাবাজার ও কাঁচামরিচ', unit: 'বাজার', defaultAmount: 150 },
      { id: 'it-9', name: 'মিনারেল ওয়াটার / নাস্তা', unit: 'আইটেম', defaultAmount: 80 }
    ]
  },
  {
    id: 'preset-biz-supplies',
    name: 'দোকানের নিয়মিত সাপ্লাই ও টিফিন',
    profile: 'business',
    folder: 'দোকান ও টিফিন খরচ',
    subFolder: 'স্টাফ নাস্তা ও টিফিন',
    familyMember: 'দোকান স্টাফ',
    type: 'business',
    items: [
      { id: 'it-10', name: 'স্টাফ চা, বিস্কুট ও নাস্তা', unit: 'দৈনিক', defaultAmount: 180 },
      { id: 'it-11', name: 'দোকান পরিষ্কারের সামগ্রী', unit: 'প্যাক', defaultAmount: 120 },
      { id: 'it-12', name: 'প্যাকেজিং পলিথিন ও টেপ', unit: 'রোল', defaultAmount: 350 }
    ]
  }
];
