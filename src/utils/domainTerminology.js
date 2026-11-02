import { getTemplatePosArchetype } from '../data/industryTemplates.js';

export const DOMAIN_TERMINOLOGY_MAP = {
  restaurant_kot: {
    customerLabel: 'ডাইনার / টেবিল গেস্ট',
    itemLabel: 'খাবার / মেনু আইটেম',
    orderLabel: 'কেয়ার / KOT অর্ডার',
    invoiceLabel: 'ডাইনিং বিল রসিদ',
    dueLabel: 'বকেয়া বিল',
    staffLabel: 'ওয়েটার / শেফ',
    quantityUnit: 'প্লেট / বাটি'
  },
  clinical_fefo: {
    customerLabel: 'রোগী / প্রেসক্রিপশন গ্রাহক',
    itemLabel: 'ওষুধ / হেলথকেয়ার আইটেম',
    orderLabel: 'প্রেসক্রিপশন ডিসপেন্স',
    invoiceLabel: 'মেডিকেল ক্যাশ মেমো',
    dueLabel: 'বাকি ওষুধ খতিয়ান',
    staffLabel: 'ফার্মাসিস্ট / সহকারী',
    quantityUnit: 'পাতা / ফাইল / পিস'
  },
  bhori_gold: {
    customerLabel: 'স্বর্ণ ক্রেতা / ক্লায়েন্ট',
    itemLabel: 'অলংকার / স্বর্ণ আইটেম',
    orderLabel: 'জুয়েলারি চালান',
    invoiceLabel: 'বাজুস হলমার্ক মেমো',
    dueLabel: 'বকেয়া চালান',
    staffLabel: 'কারিগড় / সেলসপার্সন',
    quantityUnit: 'ভরি / আনা / রতি'
  },
  seat_matrix: {
    customerLabel: 'যাত্রী / প্যাসেঞ্জার',
    itemLabel: 'সিট / টিকেট বুকিং',
    orderLabel: 'টিকেট ইস্যু',
    invoiceLabel: 'বোর্ডিং পাস / টিকেট',
    dueLabel: 'বকেয়া টিকেট',
    staffLabel: 'টিকেট কাউন্টারম্যান / চালক',
    quantityUnit: 'সিট / আসন'
  },
  parcel_courier: {
    customerLabel: 'প্রেরক / মার্চেন্ট',
    itemLabel: 'পার্সেল / শিপমেন্ট',
    orderLabel: 'কনসাইনমেন্ট বুকিং',
    invoiceLabel: 'কুরিয়ার ওয়েবিল / চালান',
    dueLabel: 'COD বকেয়া',
    staffLabel: 'রাইডার / ডেলিভারিম্যান',
    quantityUnit: 'পার্সেল / কেজি'
  },
  tailor_fit: {
    customerLabel: 'পোশাক গ্রাহক / কাস্টমার',
    itemLabel: 'মাপ ও কাটিং আইটেম',
    orderLabel: 'টেইলারিং অর্ডার স্লিপ',
    invoiceLabel: 'কাটিং ও ডেলিভারি চালান',
    dueLabel: 'বকেয়া সেলাই মজুরি',
    staffLabel: 'মাস্টার ট্রেইনার / কারিগড়',
    quantityUnit: 'পিস / জোড়া'
  },
  imei_serial: {
    customerLabel: 'ডিভাইস ক্রেতা',
    itemLabel: 'মোবাইল / গ্যাজেট আইটেম',
    orderLabel: 'ওয়্যারেন্টি ইনভয়েস',
    invoiceLabel: 'ডিভাইস ক্যাশ মেমো',
    dueLabel: 'বকেয়া কিস্তি / বিল',
    staffLabel: 'সেলস এক্সিকিউটিভ',
    quantityUnit: 'পিস (IMEI)'
  },
  weight_scale: {
    customerLabel: 'পাইকারি / খুচরা খরিদ্দার',
    itemLabel: 'ওজনকৃত পণ্য',
    orderLabel: 'ওজন চালান',
    invoiceLabel: 'ডিজিটাল ওজন স্লিপ',
    dueLabel: 'খাতা বকেয়া',
    staffLabel: 'ওজনকারী / ক্যাশিয়ার',
    quantityUnit: 'কেজি / গ্রাম'
  },
  cft_materials: {
    customerLabel: 'ঠিকাদার / ক্রেতা',
    itemLabel: 'রড / সিমেন্ট / বালু (CFT)',
    orderLabel: 'বিল্ডিং ম্যাটেরিয়াল চালান',
    invoiceLabel: 'পরিমাপ ক্যাশ মেমো',
    dueLabel: 'বকেয়া খতিয়ান',
    staffLabel: 'ডেলিভারিম্যান / ফোরম্যান',
    quantityUnit: 'CFT / টন / ব্যাগ'
  },
  non_pos_samity: {
    customerLabel: 'সমিতি সদস্য (Member)',
    itemLabel: 'সঞ্চয় / ঋণ স্কিম',
    orderLabel: 'কিস্তি ও আমানত সংগ্রহ',
    invoiceLabel: 'সদস্য জমা রশিদ',
    dueLabel: 'বকেয়া ঋণ কিস্তি',
    staffLabel: 'মাঠকর্মী / ম্যানেজার',
    quantityUnit: 'হিসাব / কিস্তি'
  },
  non_pos_cattle: {
    customerLabel: 'খামার ক্রেতা / খামারী',
    itemLabel: 'গবাদিপশু / দুগ্ধ আইটেম',
    orderLabel: 'খামার পশু ট্র্যাকিং',
    invoiceLabel: 'পশু বিক্রয় ও দুধ মেমো',
    dueLabel: 'বকেয়া খামার বিল',
    staffLabel: 'ভেটেরিনারি / কেয়ারটেকার',
    quantityUnit: 'টি / লিটার'
  },
  rapid_barcode: {
    customerLabel: 'সম্মানিত কাস্টমার',
    itemLabel: 'পণ্য সামগ্রী',
    orderLabel: 'ক্যাশ সেল',
    invoiceLabel: 'ক্যাশ রসিদ / ইনভয়েস',
    dueLabel: 'বাকি খতিয়ান',
    staffLabel: 'ক্যাশিয়ার / সেলসম্যান',
    quantityUnit: 'পিস'
  }
};

export const getDomainTerminology = (templateIdOrArchetype) => {
  if (!templateIdOrArchetype) return DOMAIN_TERMINOLOGY_MAP.rapid_barcode;
  const archetype = getTemplatePosArchetype(templateIdOrArchetype);
  if (DOMAIN_TERMINOLOGY_MAP[archetype]) {
    return DOMAIN_TERMINOLOGY_MAP[archetype];
  }
  if (DOMAIN_TERMINOLOGY_MAP[templateIdOrArchetype]) {
    return DOMAIN_TERMINOLOGY_MAP[templateIdOrArchetype];
  }
  return DOMAIN_TERMINOLOGY_MAP.rapid_barcode;
};
