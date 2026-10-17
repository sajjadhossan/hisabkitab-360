/**
 * HisabKitab 360 - Smart Grocery Catalog & Price Memory Service (Price Intelligence)
 * ---------------------------------------------------------------------------------
 * Manages regular shopping folders, items, custom user folders, weight/rate calculations,
 * and tracks item-wise historical purchase prices across time.
 */

const STORAGE_KEY_PRICE_MEMORY = 'hk360_grocery_price_memory';
const STORAGE_KEY_CUSTOM_FOLDERS = 'hk360_grocery_custom_folders';

export const DEFAULT_GROCERY_CATALOG = [
  {
    id: 'veg',
    folderName: 'কাঁচাবাজার ও শাকসবজি',
    icon: '🥦',
    color: '#10b981',
    items: [
      { id: 'v1', name: 'আলু', defaultUnit: 'কেজি', defaultRate: 60 },
      { id: 'v2', name: 'দেশি পেঁয়াজ', defaultUnit: 'কেজি', defaultRate: 110 },
      { id: 'v3', name: 'রসুন', defaultUnit: 'কেজি', defaultRate: 220 },
      { id: 'v4', name: 'আদা', defaultUnit: 'কেজি', defaultRate: 260 },
      { id: 'v5', name: 'টমেটো', defaultUnit: 'কেজি', defaultRate: 100 },
      { id: 'v6', name: 'কাঁচামরিচ', defaultUnit: 'গ্রাম', defaultRate: 200 },
      { id: 'v7', name: 'বেগুন', defaultUnit: 'কেজি', defaultRate: 80 },
      { id: 'v8', name: 'গাজর', defaultUnit: 'কেজি', defaultRate: 90 },
      { id: 'v9', name: 'পটল', defaultUnit: 'কেজি', defaultRate: 60 },
      { id: 'v10', name: 'শসা', defaultUnit: 'কেজি', defaultRate: 50 },
      { id: 'v11', name: 'ধনেপাতা', defaultUnit: 'গ্রাম', defaultRate: 150 },
      { id: 'v12', name: 'ফুলকপি', defaultUnit: 'পিস', defaultRate: 40 },
      { id: 'v13', name: 'বাঁধাকপি', defaultUnit: 'পিস', defaultRate: 40 },
      { id: 'v14', name: 'লাউ', defaultUnit: 'পিস', defaultRate: 70 },
      { id: 'v15', name: 'লেবু', defaultUnit: 'হালি', defaultRate: 30 }
    ]
  },
  {
    id: 'fruits',
    folderName: 'তাজা ফলমূল',
    icon: '🍎',
    color: '#f59e0b',
    items: [
      { id: 'f1', name: 'আপেল', defaultUnit: 'কেজি', defaultRate: 280 },
      { id: 'f2', name: 'মাল্টা / কমলা', defaultUnit: 'কেজি', defaultRate: 240 },
      { id: 'f3', name: 'কলা (সবরি/সাগর)', defaultUnit: 'ডজন', defaultRate: 120 },
      { id: 'f4', name: 'আঙুর', defaultUnit: 'কেজি', defaultRate: 350 },
      { id: 'f5', name: 'বেদানা / ডালিম', defaultUnit: 'কেজি', defaultRate: 420 },
      { id: 'f6', name: 'পেয়ারা', defaultUnit: 'কেজি', defaultRate: 80 },
      { id: 'f7', name: 'ড্রাগন ফল', defaultUnit: 'কেজি', defaultRate: 300 },
      { id: 'f8', name: 'পাকা পেঁপে', defaultUnit: 'কেজি', defaultRate: 90 }
    ]
  },
  {
    id: 'grocery',
    folderName: 'মুদিখানা ও মসলা',
    icon: '🍚',
    color: '#3b82f6',
    items: [
      { id: 'g1', name: 'মিনিকেট চাল', defaultUnit: 'কেজি', defaultRate: 75 },
      { id: 'g2', name: 'নাজিরশাইল চাল', defaultUnit: 'কেজি', defaultRate: 85 },
      { id: 'g3', name: 'সয়াবিন তেল', defaultUnit: 'লিটার', defaultRate: 185 },
      { id: 'g4', name: 'সরিষার তেল', defaultUnit: 'লিটার', defaultRate: 260 },
      { id: 'g5', name: 'মসুর ডাল (চিকন)', defaultUnit: 'কেজি', defaultRate: 140 },
      { id: 'g6', name: 'চিনি', defaultUnit: 'কেজি', defaultRate: 135 },
      { id: 'g7', name: 'আয়োডিনযুক্ত লবণ', defaultUnit: 'কেজি', defaultRate: 40 },
      { id: 'g8', name: 'আটা / ময়দা', defaultUnit: 'কেজি', defaultRate: 55 },
      { id: 'g9', name: 'হলুদ গুঁড়া', defaultUnit: 'গ্রাম', defaultRate: 300 },
      { id: 'g10', name: 'মরিচ গুঁড়া', defaultUnit: 'গ্রাম', defaultRate: 450 },
      { id: 'g11', name: 'জিরা গুঁড়া / গোটা জিরা', defaultUnit: 'গ্রাম', defaultRate: 900 },
      { id: 'g12', name: 'ফার্মের ডিম', defaultUnit: 'ডজন', defaultRate: 160 }
    ]
  },
  {
    id: 'fish_meat',
    folderName: 'মাছ, মুরগি ও মাংস',
    icon: '🥩',
    color: '#ef4444',
    items: [
      { id: 'm1', name: 'ব্রয়লার মুরগি', defaultUnit: 'কেজি', defaultRate: 190 },
      { id: 'm2', name: 'কক / সোনালী মুরগি', defaultUnit: 'কেজি', defaultRate: 300 },
      { id: 'm3', name: 'দেশি মুরগি', defaultUnit: 'কেজি', defaultRate: 580 },
      { id: 'm4', name: 'গরুর মাংস', defaultUnit: 'কেজি', defaultRate: 750 },
      { id: 'm5', name: 'খাসির মাংস', defaultUnit: 'কেজি', defaultRate: 1150 },
      { id: 'm6', name: 'রুই মাছ', defaultUnit: 'কেজি', defaultRate: 340 },
      { id: 'm7', name: 'কাতল মাছ', defaultUnit: 'কেজি', defaultRate: 360 },
      { id: 'm8', name: 'ইলিশ মাছ', defaultUnit: 'কেজি', defaultRate: 1300 },
      { id: 'm9', name: 'চিংড়ি মাছ', defaultUnit: 'কেজি', defaultRate: 750 },
      { id: 'm10', name: 'তেলাপিয়া মাছ', defaultUnit: 'কেজি', defaultRate: 200 }
    ]
  },
  {
    id: 'dairy_bakery',
    folderName: 'দুধ, ডেইরি ও নাস্তা',
    icon: '🥛',
    color: '#8b5cf6',
    items: [
      { id: 'd1', name: 'তরল দুধ (প্যাকেট/খাঁটি)', defaultUnit: 'লিটার', defaultRate: 90 },
      { id: 'd2', name: 'গুঁড়ো দুধ', defaultUnit: 'কেজি', defaultRate: 850 },
      { id: 'd3', name: 'খাঁটি গাওয়া ঘি', defaultUnit: 'কেজি', defaultRate: 1500 },
      { id: 'd4', name: 'মাখন / বাটার', defaultUnit: 'গ্রাম', defaultRate: 600 },
      { id: 'd5', name: 'পাউরুটি', defaultUnit: 'পিস', defaultRate: 50 },
      { id: 'd6', name: 'মিষ্টি দই / টক দই', defaultUnit: 'কেজি', defaultRate: 250 }
    ]
  },
  {
    id: 'cleaning',
    folderName: 'টয়লেট্রিজ ও ঘর পরিষ্কার',
    icon: '🧼',
    color: '#06b6d4',
    items: [
      { id: 'c1', name: 'গোসলের সাবান', defaultUnit: 'পিস', defaultRate: 65 },
      { id: 'c2', name: 'কাপড় কাচার ডিটারজেন্ট', defaultUnit: 'কেজি', defaultRate: 160 },
      { id: 'c3', name: 'ডিশওয়াশিং বার / লিকুইড', defaultUnit: 'পিস', defaultRate: 55 },
      { id: 'c4', name: 'টয়লেট ক্লিনার', defaultUnit: 'পিস', defaultRate: 140 },
      { id: 'c5', name: 'টুথপেস্ট', defaultUnit: 'পিস', defaultRate: 110 },
      { id: 'c6', name: 'শ্যাম্পু', defaultUnit: 'পিস', defaultRate: 320 }
    ]
  }
];

export const getPriceMemory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRICE_MEMORY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getItemPriceMemory = (itemName) => {
  if (!itemName) return null;
  const memory = getPriceMemory();
  const normalized = itemName.trim().toLowerCase();
  return memory[normalized] || memory[itemName.trim()] || null;
};

export const recordItemPrice = (itemName, { rate, unit = 'কেজি', amount = 0, quantity = '', date = null }) => {
  if (!itemName || !rate) return;
  try {
    const memory = getPriceMemory();
    const key = itemName.trim().toLowerCase();
    const prev = memory[key];

    const currentEntry = {
      itemName: itemName.trim(),
      lastRate: Number(rate),
      lastUnit: unit,
      lastAmount: Number(amount),
      lastQuantity: quantity,
      lastDate: date || new Date().toISOString().split('T')[0],
      previousRate: prev?.lastRate || null,
      previousDate: prev?.lastDate || null,
      updatedAt: Date.now()
    };

    memory[key] = currentEntry;
    localStorage.setItem(STORAGE_KEY_PRICE_MEMORY, JSON.stringify(memory));
  } catch (err) {
    console.warn('[PriceMemory] Could not persist price memory:', err);
  }
};

export const comparePrice = (itemName, currentRate) => {
  const prev = getItemPriceMemory(itemName);
  const current = Number(currentRate);

  if (!prev || !prev.lastRate || isNaN(current) || current <= 0) {
    return {
      hasHistory: false,
      trend: 'new',
      label: 'নতুন আইটেম (পূর্বে কেনা হয়নি)',
      diff: 0,
      percent: 0,
      prevRate: null,
      prevDate: null
    };
  }

  const prevRate = Number(prev.lastRate);
  const diff = current - prevRate;
  const percent = prevRate > 0 ? Math.round((diff / prevRate) * 100) : 0;

  if (diff > 0) {
    return {
      hasHistory: true,
      trend: 'up',
      label: `দর বেড়েছে: +৳${diff}/একক (+${percent}%)`,
      diff,
      percent,
      prevRate,
      prevDate: prev.lastDate
    };
  } else if (diff < 0) {
    return {
      hasHistory: true,
      trend: 'down',
      label: `দর কমেছে: -৳${Math.abs(diff)}/একক (${percent}%)`,
      diff,
      percent,
      prevRate,
      prevDate: prev.lastDate
    };
  } else {
    return {
      hasHistory: true,
      trend: 'same',
      label: `দর অপরিবর্তিত (পূর্বের দর ৳${prevRate}/একক)`,
      diff: 0,
      percent: 0,
      prevRate,
      prevDate: prev.lastDate
    };
  }
};

export const getCustomFolders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FOLDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCustomFolder = (folderName, icon = '📁') => {
  if (!folderName || !folderName.trim()) return null;
  const current = getCustomFolders();
  const newFolder = {
    id: 'custom_' + Date.now(),
    folderName: folderName.trim(),
    icon,
    color: '#8b5cf6',
    items: []
  };
  const updated = [...current, newFolder];
  localStorage.setItem(STORAGE_KEY_CUSTOM_FOLDERS, JSON.stringify(updated));
  return newFolder;
};

export const addCustomItemToFolder = (folderId, itemName, defaultUnit = 'কেজি', defaultRate = 0) => {
  if (!folderId || !itemName || !itemName.trim()) return;
  const custom = getCustomFolders();
  const folder = custom.find(f => f.id === folderId);
  if (folder) {
    folder.items.push({
      id: 'item_' + Date.now(),
      name: itemName.trim(),
      defaultUnit,
      defaultRate: Number(defaultRate) || 0
    });
    localStorage.setItem(STORAGE_KEY_CUSTOM_FOLDERS, JSON.stringify(custom));
  }
};

export const getAllGroceryFolders = () => {
  const custom = getCustomFolders();
  return [...DEFAULT_GROCERY_CATALOG, ...custom];
};
