/**
 * Voice AI Business Inquiry & Analytics Service ("জিজ্ঞেস করুন আপনার ব্যবসাকে")
 * -------------------------------------------------------------------------
 * Understands natural Bengali questions asked by shop owners/cashiers and
 * answers vocally and visually with real-time business metrics.
 */

import { speakVoiceConfirmation } from './voiceBillingService';

export const parseVoiceBusinessInquiry = (transcript, data = {}) => {
  if (!transcript || typeof transcript !== 'string') return null;

  const raw = transcript.toLowerCase().trim();
  const todayStr = new Date().toISOString().split('T')[0];

  const salesHistory = data.salesHistory || [];
  const products = data.products || [];
  const customers = data.customers || [];
  const businessDebts = data.businessDebts || [];
  const activeCounter = data.activeCounter || null;

  // 1. Today's Sales Calculations
  const todaySales = salesHistory.filter(s => s.date && s.date.startsWith(todayStr));
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
  const todayBillsCount = todaySales.length;

  // 2. Today's Cash Drawer
  const todayCashSales = todaySales
    .filter(s => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
  const openingFloat = Number(activeCounter?.openingFloat) || 1000;
  const currentDrawerCash = openingFloat + todayCashSales;

  // 3. Low Stock Items
  const lowStockList = products.filter(p => Number(p.stock) <= Number(p.minAlert || 5));

  // 4. Total Outstanding Due & Top Debtor
  let totalDue = 0;
  let topDebtor = null;
  businessDebts.forEach(person => {
    let personDue = 0;
    (person.transactions || []).forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'lend') personDue += amt;
      else if (tx.type === 'repay_lend') personDue -= amt;
    });
    if (personDue > 0) {
      totalDue += personDue;
      if (!topDebtor || personDue > topDebtor.due) {
        topDebtor = { name: person.name, due: personDue };
      }
    }
  });

  // 5. Today's Estimated Gross Profit
  let todayProfit = 0;
  todaySales.forEach(sale => {
    (sale.items || []).forEach(item => {
      const cost = Number(item.costPrice || item.purchasePrice || 0);
      const sell = Number(item.sellPrice || item.sellingPrice || item.price || 0);
      const qty = Number(item.qty || item.quantity || 1);
      if (sell > cost && cost > 0) {
        todayProfit += (sell - cost) * qty;
      }
    });
  });

  // -------------------------------------------------------------
  // Intent Matching
  // -------------------------------------------------------------

  // Intent A: Today's Sales / বিক্রি
  if (
    raw.includes('বিক্রি') ||
    raw.includes('সেল') ||
    raw.includes('মেমো') ||
    raw.includes('আজকের বেচাকেনা') ||
    raw.includes('বেচা বিক্রি')
  ) {
    const formattedTotal = Math.round(todaySalesTotal).toLocaleString('bn-BD');
    const spoken = `আজকের মোট বিক্রি ${formattedTotal} টাকা, এবং মোট মেমো হয়েছে ${todayBillsCount.toLocaleString('bn-BD')}টি।`;
    return {
      type: 'sales',
      title: 'আজকের মোট বিক্রি',
      value: `৳${Math.round(todaySalesTotal).toLocaleString()}`,
      subtitle: `${todayBillsCount} টি মেমো সম্পন্ন`,
      spokenAnswer: spoken
    };
  }

  // Intent B: Cash Drawer / ক্যাশ ড্রয়ার
  if (
    raw.includes('ক্যাশ') ||
    raw.includes('ড্রয়ার') ||
    raw.includes('ড্রয়ার') ||
    raw.includes('নগদ টাকা') ||
    raw.includes('ড্রয়ারে কত')
  ) {
    const formattedCash = Math.round(currentDrawerCash).toLocaleString('bn-BD');
    const spoken = `কাউন্টার ক্যাশ ড্রয়ারে বর্তমান নগদ আছে আনুমানিক ${formattedCash} টাকা।`;
    return {
      type: 'cash',
      title: 'ক্যাশ ড্রয়ার ব্যালেন্স',
      value: `৳${Math.round(currentDrawerCash).toLocaleString()}`,
      subtitle: `ওপেনিং ক্যাশ + আজকের নগদ বিক্রি`,
      spokenAnswer: spoken
    };
  }

  // Intent C: Low Stock / মালের ঘাটতি
  if (
    raw.includes('স্টক') ||
    raw.includes('শেষ') ||
    raw.includes('ঘাটতি') ||
    raw.includes('ফুরাই') ||
    raw.includes('লো স্টক') ||
    raw.includes('মাল নাই')
  ) {
    const count = lowStockList.length;
    let spoken = '';
    if (count === 0) {
      spoken = 'আলহামদুলিল্লাহ, দোকানে বর্তমানে সব পণ্যের পর্যাপ্ত স্টক রয়েছে।';
    } else {
      const topNames = lowStockList.slice(0, 3).map(p => p.name).join(', ');
      spoken = `দোকানে ${count.toLocaleString('bn-BD')}টি পণ্যের স্টক কম আছে। যেমন: ${topNames}।`;
    }
    return {
      type: 'low_stock',
      title: 'লো-স্টক পণ্য সতর্কতা',
      value: `${count} টি পণ্য`,
      subtitle: count > 0 ? lowStockList.slice(0, 3).map(p => p.name).join(', ') : 'সব স্টক পর্যাপ্ত',
      spokenAnswer: spoken
    };
  }

  // Intent D: Debt / বাকি / কার বাকি বেশি
  if (
    raw.includes('বাকি') ||
    raw.includes('বকেয়া') ||
    raw.includes('পাওনা') ||
    raw.includes('দেনা') ||
    raw.includes('পাব')
  ) {
    const formattedDue = Math.round(totalDue).toLocaleString('bn-BD');
    let spoken = `দোকানের মোট বকেয়া বাকি আছে ${formattedDue} টাকা।`;
    if (topDebtor) {
      spoken += ` সবচেয়ে বেশি বাকি ${topDebtor.name} এর কাছে, ${Math.round(topDebtor.due).toLocaleString('bn-BD')} টাকা।`;
    }
    return {
      type: 'debt',
      title: 'দোকানের মোট বাকি',
      value: `৳${Math.round(totalDue).toLocaleString()}`,
      subtitle: topDebtor ? `শীর্ষ বাকিদার: ${topDebtor.name} (৳${topDebtor.due.toLocaleString()})` : 'কোনো বাকি নেই',
      spokenAnswer: spoken
    };
  }

  // Intent E: Profit / লাভ
  if (
    raw.includes('লাভ') ||
    raw.includes('মুনাফা') ||
    raw.includes('প্রফিট')
  ) {
    const formattedProfit = Math.round(todayProfit).toLocaleString('bn-BD');
    const spoken = todayProfit > 0
      ? `আজকে আনুমানিক মোট লাভ হয়েছে ${formattedProfit} টাকা।`
      : `আজকের বিক্রি থেকে আনুমানিক লাভ হিসাব করা হচ্ছে।`;
    return {
      type: 'profit',
      title: 'আজকের আনুমানিক লাভ',
      value: `৳${Math.round(todayProfit).toLocaleString()}`,
      subtitle: 'বিক্রয় ও ক্রয়মূল্যের পার্থক্য',
      spokenAnswer: spoken
    };
  }

  // Intent F: Customers count / কাস্টমার
  if (
    raw.includes('কাস্টমার') ||
    raw.includes('গ্রাহক') ||
    raw.includes('ক্রেতা')
  ) {
    const count = customers.length;
    const spoken = `আপনার দোকানে সর্বমোট ${count.toLocaleString('bn-BD')} জন কাস্টমার নিবন্ধিত আছেন।`;
    return {
      type: 'customers',
      title: 'মোট নিবন্ধিত কাস্টমার',
      value: `${count} জন`,
      subtitle: 'কাস্টমার ডাটাবেজ',
      spokenAnswer: spoken
    };
  }

  // Intent G: Day-End Debrief / দোকান বন্ধ করো / সারাদিনের হিসাব
  if (
    raw.includes('দোকান বন্ধ') ||
    raw.includes('দিন শেষ') ||
    raw.includes('সারাদিনের হিসাব') ||
    raw.includes('আজকের হিসাব দাও') ||
    raw.includes('ক্লোজিং') ||
    raw.includes('ক্লোজ করো') ||
    raw.includes('সারাদিনের রিপোর্ট')
  ) {
    const formattedSales = Math.round(todaySalesTotal).toLocaleString('bn-BD');
    const formattedProfit = Math.round(todayProfit).toLocaleString('bn-BD');
    const formattedCash = Math.round(currentDrawerCash).toLocaleString('bn-BD');
    const spoken = `আজকে আপনার দোকানে মোট ${formattedSales} টাকার পণ্য বিক্রি হয়েছে। মোট মেমো হয়েছে ${todayBillsCount.toLocaleString('bn-BD')}টি এবং আনুমানিক লাভ হয়েছে ${formattedProfit} টাকা। ক্যাশ ড্রয়ার থেকে নগদ ${formattedCash} টাকা বুঝিয়ে নিন। শুভ রাত্রি!`;

    return {
      type: 'day_end_debrief',
      title: '🌙 আজকের দিন শেষের পূর্ণাঙ্গ হিসাব',
      value: `বিক্রি: ৳${Math.round(todaySalesTotal).toLocaleString()} | লাভ: ৳${Math.round(todayProfit).toLocaleString()}`,
      subtitle: `মোট মেমো: ${todayBillsCount}টি | ড্রয়ার ক্যাশ: ৳${Math.round(currentDrawerCash).toLocaleString()}`,
      spokenAnswer: spoken
    };
  }

  // Fallback
  return {
    type: 'general',
    title: 'হিসাব সহকারী উত্তর',
    value: 'পরামর্শ',
    subtitle: 'যেমন: আজকের বিক্রি কত? ক্যাশে কত আছে? কার বাকি বেশি?',
    spokenAnswer: 'দয়া করে প্রশ্নটি স্পষ্ট করে বলুন, যেমন: আজকের বিক্রি কত, অথবা ক্যাশে কত টাকা আছে।'
  };
};

export const speakVoiceAnswer = (text, lang = 'bn') => {
  speakVoiceConfirmation(text, lang);
};
