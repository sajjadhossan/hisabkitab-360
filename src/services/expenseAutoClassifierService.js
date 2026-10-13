/**
 * HisabKitab 360 - Smart Expense Categorization & Ledger Auto-Classifier (Tip 49)
 * Natural Language Processing classifier for expense descriptions.
 * Automatically tags unstructured entries into standard Chart of Accounts ledgers.
 */

class ExpenseAutoClassifierService {
  constructor() {
    this.categories = [
      {
        id: 'UTILITY_BILL',
        nameBn: 'ইউটিলিটি ও বিদ্যুৎ বিল',
        nameEn: 'Electricity & Utility Expense',
        icon: 'Zap',
        taxDeductible: true,
        keywords: ['বিদ্যুৎ', 'পল্লী বিদ্যুৎ', 'ডেসকো', 'নেসকো', 'কারেন্ট', 'ওয়াসা', 'পানি', 'গ্যাস', 'ইন্টারনেট', 'ওয়াইফাই', 'বিল', 'electric', 'wasa', 'desco', 'wifi', 'utility']
      },
      {
        id: 'SHOP_RENT',
        nameBn: 'দোকান ও গোডাউন ভাড়া',
        nameEn: 'Rent & Lease Expense',
        icon: 'Home',
        taxDeductible: true,
        keywords: ['ভাড়া', 'দোকান ভাড়া', 'গোডাউন ভাড়া', 'মার্কেট ভাড়া', 'এডভান্স', 'rent', 'lease', 'godown']
      },
      {
        id: 'ENTERTAINMENT',
        nameBn: 'আপ্যায়ন ও নাস্তা খরচ',
        nameEn: 'Refreshment & Entertainment',
        icon: 'Coffee',
        taxDeductible: false,
        keywords: ['চা', 'নাস্তা', 'বিস্কুট', 'মিষ্টি', 'আপ্যায়ন', 'কাস্টমার নাস্তা', 'দুপুরের খাবার', 'লাঞ্চ', 'ডিনার', 'পানি কেনা', 'tea', 'snacks', 'lunch', 'refreshment']
      },
      {
        id: 'TRANSPORTATION',
        nameBn: 'পরিবহন ও কুরিয়ার খরচ',
        nameEn: 'Transportation & Logistics',
        icon: 'Truck',
        taxDeductible: true,
        keywords: ['ভ্যান ভাড়া', 'গাড়ি ভাড়া', 'রিকশা ভাড়া', 'কুরিয়ার', 'সুন্দরবন', 'রেডেক্স', 'পাঠাও', 'পরিবহন', 'তেল খরচ', 'পেট্রোল', 'অকটেন', 'transport', 'courier', 'fuel']
      },
      {
        id: 'SALARY_WAGES',
        nameBn: 'কর্মচারী বেতন ও মজুরি',
        nameEn: 'Staff Salary & Wages',
        icon: 'Users',
        taxDeductible: true,
        keywords: ['বেতন', 'মজুরি', 'হাজিরা', 'বোনাস', 'ওভারটাইম', 'কর্মচারী', 'স্টাফ', 'salary', 'wage', 'bonus', 'payroll']
      },
      {
        id: 'REPAIR_MAINTENANCE',
        nameBn: 'মেরামত ও রক্ষণাবেক্ষণ',
        nameEn: 'Repair & Maintenance',
        icon: 'Wrench',
        taxDeductible: true,
        keywords: ['মেরামত', 'সার্ভিসিং', 'লাইট লাগানো', 'তার', 'সুইচ', 'রং', 'কাঠমিস্ত্রি', 'ইলেকট্রিশিয়ান', 'repair', 'hardware', 'maintenance']
      },
      {
        id: 'STATIONERY',
        nameBn: 'স্টেশনারি ও খাতা-কলম',
        nameEn: 'Stationery & Printing',
        icon: 'BookOpen',
        taxDeductible: true,
        keywords: ['খাতা', 'কলম', 'পেপার', 'প্রিন্টিং কাগজ', 'রিবন', 'কালি', 'মেমো বই', 'পেপার রোল', 'stationery', 'paper', 'pos roll']
      },
      {
        id: 'MARKETING',
        nameBn: 'প্রচারণা ও মার্কেটিং',
        nameEn: 'Marketing & Advertising',
        icon: 'Megaphone',
        taxDeductible: true,
        keywords: ['বিজ্ঞাপন', 'ব্যানার', 'লিফলেট', 'মাইকিং', 'ফেসবুক বুস্টিং', 'প্রচার', 'marketing', 'ad', 'leaflet']
      }
    ];
  }

  /**
   * Classify an unstructured expense note
   * @param {string} description - Free-text expense narration (Bengali or English)
   * @param {number} amount - Expense amount
   * @returns {Object} Classified ledger head with confidence score
   */
  classifyExpense(description = '', amount = 0) {
    if (!description || typeof description !== 'string') {
      return {
        category: {
          id: 'MISCELLANEOUS',
          nameBn: 'বিবিধ খরচ',
          nameEn: 'Miscellaneous Expense',
          icon: 'Folder',
          taxDeductible: false
        },
        confidence: 0.1,
        matchedKeyword: null,
        amount: Number(amount || 0)
      };
    }

    const lower = description.toLowerCase();
    let bestCategory = null;
    let highestScore = 0;
    let matchedKeyword = null;

    for (const cat of this.categories) {
      let score = 0;
      for (const kw of cat.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += 1;
          if (!matchedKeyword) matchedKeyword = kw;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestCategory = cat;
      }
    }

    if (!bestCategory) {
      bestCategory = {
        id: 'MISCELLANEOUS',
        nameBn: 'বিবিধ খরচ',
        nameEn: 'Miscellaneous Expense',
        icon: 'Folder',
        taxDeductible: false
      };
    }

    const confidence = highestScore > 0 ? Math.min(0.98, 0.65 + (highestScore * 0.15)) : 0.3;

    return {
      category: bestCategory,
      confidence: Number(confidence.toFixed(2)),
      matchedKeyword,
      originalDescription: description,
      amount: Number(amount || 0),
      isTaxDeductible: bestCategory.taxDeductible
    };
  }

  /**
   * Get available category master list
   */
  getCategories() {
    return this.categories;
  }
}

export const expenseAutoClassifierService = new ExpenseAutoClassifierService();
export default expenseAutoClassifierService;
