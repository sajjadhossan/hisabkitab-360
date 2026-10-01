// Initial Mock Data for Personal and Business Profiles

export const initialData = {
  // ---------------------------------------------
  // PERSONAL PROFILE INITIAL DATA
  // ---------------------------------------------
  personalExpenses: [
    {
      id: "pex-1",
      title: "সাপ্তাহিক কাঁচাবাজার (চাল, মাছ, মুরগি ও সবজি)",
      amount: 4200,
      category: "bazaar",
      type: "daily",
      date: "2026-09-28",
      note: "কারওয়ান বাজার থেকে কেনা"
    },
    {
      id: "pex-2",
      title: "অফিস যাতায়াত ও সিএনজি ভাড়া",
      amount: 450,
      category: "transport",
      type: "daily",
      date: "2026-09-29",
      note: "মিরপুর থেকে গুলশান যাতায়াত"
    },
    {
      id: "pex-3",
      title: "পরিবারের বাসা ভাড়া (সেপ্টেম্বর)",
      amount: 22000,
      category: "rent",
      type: "family",
      date: "2026-09-05",
      note: "ফ্ল্যাট ভাড়া পরিশোধ করা হয়েছে"
    },
    {
      id: "pex-4",
      title: "বিদ্যুৎ ও গ্যাস ইউটিলিটি বিল",
      amount: 3200,
      category: "utility",
      type: "family",
      date: "2026-09-12",
      note: "ডেসকো ও তিতাস গ্যাস বিল"
    },
    {
      id: "pex-5",
      title: "সন্তানের স্কুলের মাসিক বেতন ও কোচিং",
      amount: 4500,
      category: "education",
      type: "family",
      date: "2026-09-10",
      note: "ইংলিশ ভার্সন স্কুল ফি"
    },
    {
      id: "pex-6",
      title: "আম্মা ও আব্বার প্রেসার ও ডায়াবেটিসের ওষুধ",
      amount: 2800,
      category: "medical",
      type: "family",
      date: "2026-09-15",
      note: "মাসিক প্রেসক্রিপশন"
    },
    {
      id: "pex-7",
      title: "বাসার হাইস্পিড ব্রডব্যান্ড ইন্টারনেট বিল",
      amount: 1200,
      category: "internet",
      type: "family",
      date: "2026-09-08",
      note: "কার্নিভাল ইন্টারনেট ৫০ এমবিপিএস"
    },
    {
      id: "pex-8",
      title: "বিকালের কফি ও স্ন্যাক্স",
      amount: 320,
      category: "snacks",
      type: "daily",
      date: "2026-09-29",
      note: "বন্ধুদের সাথে চায়ের আড্ডা"
    }
  ],

  personalIncomes: [
    {
      id: "pin-1",
      source: "মাসিক পার্সোনাল ড্রয়িং / কনসালটেন্সি",
      amount: 85000,
      date: "2026-09-01",
      note: "ব্যাংক অ্যাকাউন্টে ট্রান্সফার"
    },
    {
      id: "pin-2",
      source: "অনলাইন ফ্রিল্যান্সিং রেমিট্যান্স",
      amount: 35000,
      date: "2026-09-18",
      note: "ইউএস ক্লায়েন্ট প্রজেক্ট পেমেন্ট"
    }
  ],

  personalSavings: [
    {
      id: "psav-1",
      title: "জরুরি পারিবারিক ফান্ড (Emergency Reserve)",
      target: 150000,
      saved: 95000,
      color: "#10b981"
    },
    {
      id: "psav-2",
      title: "বার্ষিক ডিপিএস ও বিনিয়োগ (Annual DPS)",
      target: 120000,
      saved: 70000,
      color: "#06b6d4"
    },
    {
      id: "psav-3",
      title: "পারিবারিক অবকাশ ভ্রমণ (Family Tour)",
      target: 60000,
      saved: 38000,
      color: "#f59e0b"
    }
  ],

  // ---------------------------------------------
  // BUSINESS PROFILE INITIAL DATA
  // ---------------------------------------------
  businessProducts: [
    {
      id: "prod-1",
      name: "প্রিমিয়াম মিনিকেট চাল (২৫ কেজি বস্তা)",
      sku: "RICE-MIN-25",
      barcode: "8901001001",
      category: "খাদ্যপণ্য",
      costPrice: 1750,
      sellPrice: 2050,
      stock: 45,
      minAlert: 10,
      unit: "বস্তা"
    },
    {
      id: "prod-rice-pran",
      name: "প্রাণ চিনিগুঁড়া সুগন্ধি পোলাও চাল (১ কেজি)",
      sku: "RICE-PRAN-01",
      barcode: "8901001009",
      category: "খাদ্যপণ্য",
      costPrice: 135,
      sellPrice: 160,
      stock: 65,
      minAlert: 10,
      unit: "কেজি"
    },
    {
      id: "prod-rice-naj",
      name: "নাজিরশাইল প্রিমিয়াম চাল (২৫ কেজি বস্তা)",
      sku: "RICE-NAJ-25",
      barcode: "8901001010",
      category: "খাদ্যপণ্য",
      costPrice: 1950,
      sellPrice: 2150,
      stock: 30,
      minAlert: 5,
      unit: "বস্তা"
    },
    {
      id: "prod-rice-bas",
      name: "প্রাণ প্রিমিয়াম বাসমতী চাল (৫ কেজি)",
      sku: "RICE-BAS-05",
      barcode: "8901001011",
      category: "খাদ্যপণ্য",
      costPrice: 820,
      sellPrice: 950,
      stock: 25,
      minAlert: 5,
      unit: "ব্যাগ"
    },
    {
      id: "prod-rice-rashid",
      name: "রশিদ অটো মিনিকেট চাল (৫০ কেজি বস্তা)",
      sku: "RICE-MIN-50",
      barcode: "8901001012",
      category: "খাদ্যপণ্য",
      costPrice: 3600,
      sellPrice: 3950,
      stock: 18,
      minAlert: 4,
      unit: "বস্তা"
    },
    {
      id: "prod-rice-chashi",
      name: "চাষী সুগন্ধি চিনিগুঁড়া চাল (১ কেজি)",
      sku: "RICE-CHAS-01",
      barcode: "8901001013",
      category: "খাদ্যপণ্য",
      costPrice: 130,
      sellPrice: 155,
      stock: 40,
      minAlert: 8,
      unit: "প্যাকেট"
    },
    {
      id: "prod-2",
      name: "খাঁটি ঘানির সরিষার তেল (১ লিটার)",
      sku: "OIL-MUST-01",
      barcode: "8901001002",
      category: "তেল ও ঘি",
      costPrice: 240,
      sellPrice: 290,
      stock: 15,
      minAlert: 12,
      unit: "বোতল"
    },
    {
      id: "prod-oil-rup",
      name: "রূপচাঁদা ফর্টিফাইড সয়াবিন তেল (৫ লিটার)",
      sku: "OIL-RUP-05",
      barcode: "8901001014",
      category: "তেল ও ঘি",
      costPrice: 880,
      sellPrice: 950,
      stock: 45,
      minAlert: 8,
      unit: "বোতল"
    },
    {
      id: "prod-oil-teer",
      name: "তীর পিওর সয়াবিন তেল (২ লিটার)",
      sku: "OIL-TEER-02",
      barcode: "8901001015",
      category: "তেল ও ঘি",
      costPrice: 345,
      sellPrice: 380,
      stock: 38,
      minAlert: 10,
      unit: "বোতল"
    },
    {
      id: "prod-soap-lux",
      name: "লাক্স বিউটি সাবান (১০০ গ্রাম)",
      sku: "SOAP-LUX-100",
      barcode: "8901001016",
      category: "কসমেটিকস ও কেয়ার",
      costPrice: 52,
      sellPrice: 65,
      stock: 85,
      minAlert: 15,
      unit: "পিস"
    },
    {
      id: "prod-soap-lb",
      name: "লাইফবয় টোটাল জার্ম প্রটেকশন সাবান (১০০ গ্রাম)",
      sku: "SOAP-LB-100",
      barcode: "8901001017",
      category: "হাইজিন",
      costPrice: 44,
      sellPrice: 55,
      stock: 70,
      minAlert: 15,
      unit: "পিস"
    },
    {
      id: "prod-dal-mos",
      name: "প্রাণ প্রিমিয়াম মসুর ডাল (১ কেজি)",
      sku: "DAL-MOS-01",
      barcode: "8901001018",
      category: "খাদ্যপণ্য",
      costPrice: 120,
      sellPrice: 140,
      stock: 55,
      minAlert: 10,
      unit: "কেজি"
    },
    {
      id: "prod-flour-teer",
      name: "তীর ফ্রেশ আটা (২ কেজি)",
      sku: "FLR-TEER-02",
      barcode: "8901001019",
      category: "খাদ্যপণ্য",
      costPrice: 102,
      sellPrice: 120,
      stock: 40,
      minAlert: 10,
      unit: "প্যাকেট"
    },
    {
      id: "prod-egg-farm",
      name: "ফার্মের লাল ডিম (১ হালি / ৪ পিস)",
      sku: "EGG-FARM-04",
      barcode: "8901001020",
      category: "খাদ্যপণ্য",
      costPrice: 40,
      sellPrice: 48,
      stock: 120,
      minAlert: 20,
      unit: "হালি"
    },
    {
      id: "prod-3",
      name: "নেসক্যাফে গোল্ড ব্লেন্ড কফি (২০০ গ্রাম)",
      sku: "COF-GLD-200",
      barcode: "8901001003",
      category: "পানীয়",
      costPrice: 920,
      sellPrice: 1150,
      stock: 22,
      minAlert: 5,
      unit: "জার"
    },
    {
      id: "prod-4",
      name: "ডিপ্লোমা ফুল ক্রিম গুঁড়ো দুধ (১ কেজি)",
      sku: "MILK-DIP-01",
      barcode: "8901001004",
      category: "দুগ্ধজাত",
      costPrice: 860,
      sellPrice: 980,
      stock: 15,
      minAlert: 8,
      unit: "প্যাকেট"
    },
    {
      id: "prod-5",
      name: "তাজা প্রিমিয়াম ব্ল্যাক টি (৪০০ গ্রাম)",
      sku: "TEA-TAZ-400",
      barcode: "8901001005",
      category: "পানীয়",
      costPrice: 210,
      sellPrice: 260,
      stock: 35,
      minAlert: 10,
      unit: "প্যাকেট"
    },
    {
      id: "prod-6",
      name: "এসিআই পিওর ভ্যাকিউম লবণ (১ কেজি)",
      sku: "SALT-ACI-01",
      barcode: "8901001006",
      category: "মশলা ও নিত্যপণ্য",
      costPrice: 34,
      sellPrice: 42,
      stock: 80,
      minAlert: 20,
      unit: "প্যাকেট"
    },
    {
      id: "prod-7",
      name: "সানসিল্ক ব্ল্যাক শাইন শ্যাম্পু (৩৫০ মিলি)",
      sku: "SHMP-SUN-350",
      barcode: "8901001007",
      category: "কসমেটিকস ও কেয়ার",
      costPrice: 380,
      sellPrice: 450,
      stock: 19,
      minAlert: 6,
      unit: "বোতল"
    },
    {
      id: "prod-8",
      name: "ডেটলে অ্যান্টিব্যাকটেরিয়াল হ্যান্ডওয়াশ (২৫০ মিলি)",
      sku: "WASH-DET-250",
      barcode: "8901001008",
      category: "হাইজিন",
      costPrice: 125,
      sellPrice: 160,
      stock: 14,
      minAlert: 10,
      unit: "বোতল"
    }
  ],

  businessDamagedGoods: [
    {
      id: "dmg-1",
      productId: "prod-2",
      productName: "খাঁটি ঘানির সরিষার তেল (১ লিটার)",
      sku: "OIL-MUST-01",
      quantity: 2,
      unitCost: 240,
      totalLoss: 480,
      date: "2026-09-27",
      reason: "ভাঙা / বোতল লিক (Broken/Leakage)",
      reportedBy: "মোঃ রফিকুল ইসলাম",
      actionTaken: "নষ্ট হিসেবে বাতিল",
      note: "আড়ৎ থেকে মালামাল নামানোর সময় ২ বোতল ড্রপ করে ফেটে যায়।"
    },
    {
      id: "dmg-2",
      productId: "prod-4",
      productName: "ডিপ্লোমা ফুল ক্রিম গুঁড়ো দুধ (১ কেজি)",
      sku: "MILK-DIP-01",
      quantity: 1,
      unitCost: 860,
      totalLoss: 860,
      date: "2026-09-28",
      reason: "প্যাকেজিং নষ্ট / আর্দ্রতা (Damaged Foil)",
      reportedBy: "আল-আমিন হোসেন",
      actionTaken: "সাপ্লায়ার রিটার্ন ক্লেইম",
      note: "প্যাকেট কেটে বাতাস ঢুকে দুধ জমাট বেঁধে নষ্ট হয়েছিল।"
    }
  ],

  businessCustomers: [
    {
      id: "cust-1",
      name: "হাজী আব্দুর রহমান",
      companyName: "মেসার্স রহমান ট্রেডার্স",
      customerType: "পাইকারি (Wholesale)",
      phone: "01711-224466",
      altPhone: "01811-335577",
      email: "abdur.rahman@example.com",
      address: "বাড়ি #৪৫, রোড #১০, মিরপুর-১২, ঢাকা",
      nidNo: "1982269201928172",
      tradeLicenseNo: "TRAD/DNCC/88219/2023",
      creditLimit: 50000,
      totalPurchased: 98500,
      outstandingDue: 14200,
      hasNidDoc: true,
      hasTradeLicenseDoc: true,
      createdDate: "2025-06-12"
    },
    {
      id: "cust-2",
      name: "ইঞ্জি. তানভীর আহমেদ",
      companyName: "তানভীর কনস্ট্রাকশন অ্যান্ড ইন্টেরিয়র",
      customerType: "কর্পোরেট (Corporate)",
      phone: "01822-998877",
      altPhone: "",
      email: "tanveer.bd@example.com",
      address: "ব্লক সি, মিরপুর ডিওএইচএস, ঢাকা",
      nidNo: "1989269123849182",
      tradeLicenseNo: "TRAD/DSCC/019283/2024",
      creditLimit: 30000,
      totalPurchased: 45800,
      outstandingDue: 3500,
      hasNidDoc: true,
      hasTradeLicenseDoc: false,
      createdDate: "2025-09-01"
    },
    {
      id: "cust-3",
      name: "ডা. নুসরাত জাহান",
      companyName: "নুসরাত হেলথ কেয়ার চেম্বার",
      customerType: "ভিআইপি (VIP Retail)",
      phone: "01933-445566",
      altPhone: "",
      email: "dr.nusrat@example.com",
      address: "সেকশন-৬, মিরপুর, ঢাকা",
      nidNo: "1991269384920193",
      tradeLicenseNo: "",
      creditLimit: 20000,
      totalPurchased: 32400,
      outstandingDue: 0,
      hasNidDoc: true,
      hasTradeLicenseDoc: false,
      createdDate: "2025-11-15"
    },
    {
      id: "cust-4",
      name: "মোঃ নাজমুল হাসান",
      companyName: "হাসান জেনারেল স্টোর",
      customerType: "খুচরা (Retail)",
      phone: "01655-778899",
      altPhone: "",
      email: "nazmul.h@example.com",
      address: "পল্লবী, মিরপুর, ঢাকা",
      nidNo: "1995269485920194",
      tradeLicenseNo: "TRAD/DNCC/110294/2024",
      creditLimit: 15000,
      totalPurchased: 15600,
      outstandingDue: 850,
      hasNidDoc: false,
      hasTradeLicenseDoc: true,
      createdDate: "2026-01-20"
    }
  ],

  businessEmployees: [
    {
      id: "emp-1",
      name: "মোঃ রফিকুল ইসলাম",
      role: "স্টোর ও সেলস ম্যানেজার",
      phone: "01715-001122",
      baseSalary: 28000,
      status: "Paid",
      joinDate: "2024-03-15",
      lastDisbursed: "2026-09-01"
    },
    {
      id: "emp-2",
      name: "রাসেল মাহমুদ",
      role: "POS কাউন্টার ক্যাশিয়ার",
      phone: "01820-334455",
      baseSalary: 18000,
      status: "Paid",
      joinDate: "2025-01-10",
      lastDisbursed: "2026-09-01"
    },
    {
      id: "emp-3",
      name: "আল-আমিন হোসেন",
      role: "ইনভেন্টরি ও ডেলিভারি সহকারী",
      phone: "01912-667788",
      baseSalary: 15000,
      status: "Pending", // Needs salary disbursement
      joinDate: "2025-07-01",
      lastDisbursed: "2026-08-01"
    }
  ],

  businessSuppliers: [
    {
      id: "sup-1",
      name: "মেঘনা গ্রুপ ডিস্ট্রিবিউশন",
      contact: "01711-550000",
      items: "তেল, আটা, চিনি",
      payableBalance: 32000
    },
    {
      id: "sup-2",
      name: "স্কয়ার কনজিউমার প্রডাক্টস",
      contact: "01819-223344",
      items: "মশলা ও স্যানিটারি সামগ্রী",
      payableBalance: 14500
    },
    {
      id: "sup-3",
      name: "প্রাণ-আরএফএল ডিলার",
      contact: "01911-889900",
      items: "পানীয় ও স্ন্যাক্স",
      payableBalance: 8200
    }
  ],

  businessExpenses: [
    {
      id: "bex-1",
      title: "দোকানের মাসিক স্পেস ভাড়া",
      amount: 25000,
      category: "ভাড়া",
      date: "2026-09-05",
      note: "সেপ্টেম্বর মাসের শপ রেন্ট"
    },
    {
      id: "bex-2",
      title: "বাণিজ্যিক বিদ্যুৎ বিল ও জেনারেটর সার্ভিস",
      amount: 4800,
      category: "ইউটিলিটি",
      date: "2026-09-12",
      note: "কমার্শিয়াল মিটার"
    },
    {
      id: "bex-3",
      title: "পণ্য পরিবহন ও ভ্যান ভাড়া",
      amount: 3200,
      category: "পরিবহন",
      date: "2026-09-20",
      note: "আড়ৎ থেকে মালামাল আনয়ন"
    },
    {
      id: "bex-4",
      title: "স্টাফ ও মেহমানদের নাস্তা ও চা খরচ",
      amount: 1850,
      category: "আপ্যায়ন",
      date: "2026-09-27",
      note: "সাপ্তাহিক টি-টাইম বিল"
    }
  ],

  businessSalesHistory: [
    {
      id: "INV-2026-0929-01",
      customerName: "ইঞ্জি. তানভীর আহমেদ",
      customerPhone: "01822-998877",
      date: "2026-09-29 11:24",
      items: [
        { name: "প্রিমিয়াম মিনিকেট চাল (২৫ কেজি)", qty: 1, price: 2050, subtotal: 2050 },
        { name: "নেসক্যাফে গোল্ড ব্লেন্ড কফি", qty: 1, price: 1150, subtotal: 1150 }
      ],
      subtotal: 3200,
      discount: 100,
      vat: 155,
      grandTotal: 3255,
      paymentMethod: "bkash",
      status: "paid"
    },
    {
      id: "INV-2026-0929-02",
      customerName: "সাধারণ ক্রেতা (Walk-in)",
      customerPhone: "",
      date: "2026-09-29 13:45",
      items: [
        { name: "তাজা প্রিমিয়াম ব্ল্যাক টি", qty: 2, price: 260, subtotal: 520 },
        { name: "এসিআই পিওর লবণ", qty: 3, price: 42, subtotal: 126 }
      ],
      subtotal: 646,
      discount: 0,
      vat: 32,
      grandTotal: 678,
      paymentMethod: "cash",
      status: "paid"
    }
  ],

  businessInvoices: [
    {
      id: "INV-2026-001",
      customerName: "হাজী আব্দুর রহমান",
      customerPhone: "01711-224466",
      customerEmail: "abdur.rahman@example.com",
      customerAddress: "বাড়ি #৪৫, রোড #১০, মিরপুর-১২",
      date: "2026-09-28",
      dueDate: "2026-10-12",
      paymentTerms: "Net 14 Days",
      items: [
        { id: "item-1", name: "প্রিমিয়াম মিনিকেট চাল (২৫ কেজি)", sku: "RICE-MIN-25", qty: 4, price: 2050, subtotal: 8200 },
        { id: "item-2", name: "রূপচাঁদা সয়াবিন তেল (৫ লিটার)", sku: "OIL-RUP-05", qty: 3, price: 890, subtotal: 2670 }
      ],
      subtotal: 10870,
      discount: 370,
      vatRate: 5,
      vat: 525,
      grandTotal: 11025,
      paidAmount: 5000,
      dueAmount: 6025,
      status: "partial",
      paymentMethod: "bkash",
      paymentHistory: [
        { id: "pay-101", date: "2026-09-28", amount: 5000, method: "bkash", note: "বিকাশ আংশিক পেমেন্ট (কিস্তি ১)" }
      ],
      notes: "পণ্য সরবরাহের ৭ দিনের মধ্যে ব্যাংক অ্যাকাউন্টে অথবা ডাচ-বাংলা ব্যাংকে অবশিষ্ট টাকা জমা দিন।"
    },
    {
      id: "INV-2026-002",
      customerName: "ইঞ্জি. তানভীর আহমেদ",
      customerPhone: "01822-998877",
      customerEmail: "tanveer.bd@example.com",
      customerAddress: "ব্লক সি, মিরপুর ডিওএইচএস",
      date: "2026-09-29",
      dueDate: "2026-10-05",
      paymentTerms: "Due on Receipt",
      items: [
        { id: "item-1", name: "নেসক্যাফে গোল্ড ব্লেন্ড কফি (২০০ গ্রাম)", sku: "COF-NES-200", qty: 2, price: 1150, subtotal: 2300 },
        { id: "item-2", name: "তাজা প্রিমিয়াম ব্ল্যাক টি (৪০০ গ্রাম)", sku: "TEA-TAZ-400", qty: 4, price: 260, subtotal: 1040 }
      ],
      subtotal: 3340,
      discount: 100,
      vatRate: 5,
      vat: 162,
      grandTotal: 3402,
      paidAmount: 3402,
      dueAmount: 0,
      status: "paid",
      paymentMethod: "cash",
      paymentHistory: [
        { id: "pay-102", date: "2026-09-29", amount: 3402, method: "cash", note: "সম্পূর্ণ নগদ পরিশোধ" }
      ],
      notes: "নগদে সম্পূর্ণ বিল পরিশোধ করা হয়েছে।"
    },
    {
      id: "INV-2026-003",
      customerName: "মেসার্স রহমান ট্রেডার্স",
      customerPhone: "01711-224466",
      customerAddress: "বাড়ি #৪৫, রোড #১০, মিরপুর-১২",
      date: "2026-09-26",
      dueDate: "2026-10-10",
      paymentTerms: "Net 14 Days",
      items: [
        { id: "item-1", productId: "prod-1", name: "প্রিমিয়াম মিনিকেট চাল (২৫ কেজি)", sku: "RICE-MIN-25", qty: 10, returnedQty: 4, price: 2050, subtotal: 20500 },
        { id: "item-2", productId: "prod-5", name: "তাজা প্রিমিয়াম ব্ল্যাক টি (৪০০ গ্রাম)", sku: "TEA-TAZ-400", qty: 5, returnedQty: 0, price: 260, subtotal: 1300 }
      ],
      subtotal: 21800,
      discount: 300,
      vatRate: 5,
      vat: 1075,
      grandTotal: 22575,
      returnTotal: 8200, // ৪টি চাল ফেরত (4 * 2050)
      adjustedTotal: 14375,
      paidAmount: 10000,
      dueAmount: 4375,
      status: "partial_return",
      paymentMethod: "bank",
      paymentHistory: [
        { id: "pay-103", date: "2026-09-26", amount: 10000, method: "bank", note: "ব্যাংক ট্রান্সফার আংশিক পেমেন্ট" }
      ],
      returns: [
        {
          id: "ret-101",
          date: "2026-09-28",
          reason: "১০ বস্তার মধ্যে ৪ বস্তা অতিরিক্ত এসেছিল, গ্রাহক ফেরত পাঠিয়েছেন",
          refundType: "deduct_due",
          totalRefundAmount: 8200,
          restocked: true,
          items: [
            { productId: "prod-1", name: "প্রিমিয়াম মিনিকেট চাল (২৫ কেজি)", returnedQty: 4, refundPrice: 2050, subtotal: 8200 }
          ]
        }
      ],
      notes: "১০ বস্তা চাল পাঠানো হয়েছিল, ৪ বস্তা ফেরত এসেছে এবং বকেয়া থেকে ৮,২০০ টাকা সমন্বয় করা হয়েছে।"
    }
  ],

  businessQuotations: [
    {
      id: "QT-2026-001",
      customerName: "ডা. নুসরাত জাহান",
      customerPhone: "01933-445566",
      customerEmail: "dr.nusrat@example.com",
      customerAddress: "সেকশন-৬, ঢাকা",
      date: "2026-09-27",
      validUntil: "2026-10-15",
      items: [
        { id: "item-1", name: "প্রিমিয়াম মিনিকেট চাল (২৫ কেজি)", sku: "RICE-MIN-25", qty: 10, price: 2000, subtotal: 20000 },
        { id: "item-2", name: "রূপচাঁদা সয়াবিন তেল (৫ লিটার)", sku: "OIL-RUP-05", qty: 10, price: 870, subtotal: 8700 },
        { id: "item-3", name: "প্রাণ চিনিগুড়া সুগন্ধি পোলাও চাল", sku: "RICE-POL-05", qty: 8, price: 650, subtotal: 5200 }
      ],
      subtotal: 33900,
      discount: 900,
      vatRate: 5,
      vat: 1650,
      grandTotal: 34650,
      status: "sent",
      terms: "১. এই কোটেশনটি আগামী ১৫ অক্টোবর পর্যন্ত কার্যকর থাকবে।\n২. অগ্রিম ৫০% পেমেন্ট সাপেক্ষে ডেলিভারি নিশ্চিত করা হবে।\n৩. ডেলিভারি চার্জ সম্পূর্ণ ফ্রি।"
    },
    {
      id: "QT-2026-002",
      customerName: "মোঃ নাজমুল হাসান",
      customerPhone: "01655-778899",
      customerEmail: "nazmul.h@example.com",
      customerAddress: "পল্লবী, মিরপুর",
      date: "2026-09-25",
      validUntil: "2026-10-10",
      items: [
        { id: "item-1", name: "ডেটলে অ্যান্টিব্যাকটেরিয়াল হ্যান্ডওয়াশ", sku: "WASH-DET-250", qty: 25, price: 150, subtotal: 3750 },
        { id: "item-2", name: "তাজা প্রিমিয়াম ব্ল্যাক টি", sku: "TEA-TAZ-400", qty: 15, price: 250, subtotal: 3750 }
      ],
      subtotal: 7500,
      discount: 250,
      vatRate: 5,
      vat: 362,
      grandTotal: 7612,
      status: "converted",
      convertedInvoiceId: "INV-2026-003",
      terms: "অফিস সাপ্লাই কোটেশন। গ্রহণ করা হয়েছে এবং ইনভয়েসে রূপান্তর করা হয়েছে।"
    }
  ],

  businessSettings: {
    companyName: "মেসার্স আল-মদিনা সুপার শপ ও ট্রেডার্স",
    tagline: "গুণগত মান ও আস্থার প্রতীক",
    phone: "+880 1712-345678",
    altPhone: "+880 1819-001122",
    email: "contact@almadinastore.com",
    website: "www.almadinastore.com",
    address: "দোকান #১২-১৩, মেইন রোড, মিরপুর-১০, ঢাকা-১২১৬",
    binNo: "004829104-0101",
    tradeLicenseNo: "TRAD/DNCC/029182/2024",
    tradeLicenseDoc: null,
    companyLogo: null,
    signatureStamp: null,
    vatRate: 5,
    currency: "৳",

    // Print & Receipt Customization
    headerGreeting: "বিসমিল্লাহির রাহমানির রাহিম",
    invoiceFooter: "আমাদের সাথে থাকার জন্য আন্তরিক ধন্যবাদ! বিক্রিত পণ্য ৭ দিনের মধ্যে পরিবর্তনের সুযোগ আছে।",
    returnPolicy: "ক্যাশ মেমো ছাড়া কোনো পণ্য পরিবর্তন বা ফেরত নেওয়া হবে না। প্যাকেট অক্ষত থাকতে হবে।",
    bankName: "ব্র্যাক ব্যাংক পিএলসি",
    bankAccountName: "মেসার্স আল-মদিনা ট্রেডার্স",
    bankAccountNo: "1501204892019001",
    bankBranch: "মিরপুর-১০ শাখা, ঢাকা",
    bkashMerchant: "01712-345678",
    nagadMerchant: "01712-345678",

    // Toggles for Receipt & Invoice Printing
    showLogoOnReceipt: true,
    showGreetingOnReceipt: true,
    showAddressOnReceipt: true,
    showPhoneOnReceipt: true,
    showEmailOnReceipt: true,
    showBinOnReceipt: true,
    showCustomerDetails: true,
    showSkuOnReceipt: true,
    showBarcodeOnReceipt: true,
    showSignatureOnReceipt: true,
    showReturnPolicyOnReceipt: true,
    receiptPaperWidth: "80mm",

    // POS Hardware (Cash Drawer & Barcode Scanner)
    autoOpenCashDrawer: true,
    cashDrawerKickEnabled: true,
    enableGlobalScanner: true,

    // Automatic & Cloud Backup Settings
    autoBackupEnabled: true,
    autoBackupInterval: "daily", // "daily", "weekly", "realtime"
    autoBackupLastRun: new Date().toISOString().split('T')[0],
    googleDriveEnabled: true,
    googleDriveWebhookUrl: "https://script.google.com/macros/s/AKfycbzFVruwt9PDxxmcKAtxxAtATUnLhxf9ZAFAJBN-UYU-dvsiTp5GLgMeVyApwKXfdEjj/exec",
    googleDriveFolder: "HisabKitab-360-Backups",
    googleDriveLastSync: new Date().toISOString()
  },

  // ---------------------------------------------
  // DEBTS & CASH LOANS (দেনা-পাওনা খাতা)
  // ---------------------------------------------
  personalDebts: [
    {
      id: "pdebt-1",
      name: "জনাব রফিক আহমেদ",
      phone: "01712-998877",
      address: "মিরপুর-২, ঢাকা",
      relation: "বন্ধু",
      createdAt: "2026-09-20",
      notes: "বিশ্বস্ত বন্ধু, নিয়মিত লেনদেন আছে",
      transactions: [
        {
          id: "ptx-101",
          date: "2026-09-20",
          type: "lend",
          amount: 5000,
          purpose: "জরুরি চিকিৎসা বাবদ",
          dueDate: "2026-10-10",
          method: "bkash",
          note: "বিকাশে পাঠানো হয়েছে"
        },
        {
          id: "ptx-102",
          date: "2026-09-25",
          type: "repay_lend",
          amount: 2000,
          purpose: "আংশিক ফেরত প্রদান",
          dueDate: "",
          method: "cash",
          note: "নগদে ২,০০০ টাকা ফেরত দিয়েছে"
        }
      ]
    },
    {
      id: "pdebt-2",
      name: "খালাতো ভাই সোহেল",
      phone: "01811-445566",
      address: "উত্তরা সেক্টর ৭, ঢাকা",
      relation: "আত্মীয়",
      createdAt: "2026-09-15",
      notes: "বাইক মেরামতের জন্য ধার নিয়েছিল",
      transactions: [
        {
          id: "ptx-201",
          date: "2026-09-15",
          type: "lend",
          amount: 3000,
          purpose: "বাইকের পার্টস ক্রয়",
          dueDate: "2026-09-28",
          method: "cash",
          note: "২৮ তারিখের মধ্যে দেওয়ার কথা ছিল"
        }
      ]
    },
    {
      id: "pdebt-3",
      name: "চাচা মাহমুদ উল্লাহ",
      phone: "01912-332211",
      address: "বাড্ডা, ঢাকা",
      relation: "পরিবার",
      createdAt: "2026-09-10",
      notes: "বাড়ি ভাড়ার শর্টেজের সময় উনার কাছ থেকে নেওয়া হয়েছিল",
      transactions: [
        {
          id: "ptx-301",
          date: "2026-09-10",
          type: "borrow",
          amount: 10000,
          purpose: "বাসার অগ্রিম শর্টফল",
          dueDate: "2026-10-25",
          method: "bank",
          note: "ব্যাংক ট্রান্সফারে নিয়েছিলাম"
        },
        {
          id: "ptx-302",
          date: "2026-09-22",
          type: "repay_borrow",
          amount: 4000,
          purpose: "আংশিক পরিশোধ",
          dueDate: "",
          method: "cash",
          note: "৪,০০০ টাকা শোধ করেছি"
        }
      ]
    }
  ],

  businessDebts: [
    {
      id: "bdebt-1",
      name: "মেসার্স হক ট্রেডার্স (কামাল ভাই)",
      phone: "01722-114477",
      address: "চকবাজার, ঢাকা",
      relation: "ব্যবসায়ী পার্টনার",
      createdAt: "2026-09-18",
      notes: "পাইকারি মালামাল ছাড়াতে নগদ ধার দেওয়া হয়েছিল",
      transactions: [
        {
          id: "btx-101",
          date: "2026-09-18",
          type: "lend",
          amount: 15000,
          purpose: "পোর্টে কাস্টমস ডিউটি শর্টেজ",
          dueDate: "2026-10-05",
          method: "bank",
          note: "চেক দিয়ে নগদ ক্যাশ প্রদান"
        },
        {
          id: "btx-102",
          date: "2026-09-26",
          type: "lend",
          amount: 5000,
          purpose: "জরুরি লেবার বিল মেটানো",
          dueDate: "2026-10-05",
          method: "cash",
          note: "কাউন্টার থেকে নগদ দেওয়া"
        }
      ]
    },
    {
      id: "bdebt-2",
      name: "হাজী মহাজন সামসুল আলম",
      phone: "01819-887766",
      address: "ইসলামপুর, ঢাকা",
      relation: "মহাজন",
      createdAt: "2026-09-01",
      notes: "ঈদের মালামাল স্টক করার জন্য নগদ ক্যাশ ঋণ নেওয়া",
      transactions: [
        {
          id: "btx-201",
          date: "2026-09-01",
          type: "borrow",
          amount: 50000,
          purpose: "বড় লট ক্রয় ইনভেস্টমেন্ট",
          dueDate: "2026-11-01",
          method: "bank",
          note: "২ কিস্তিতে পরিশোধযোগ্য"
        },
        {
          id: "btx-202",
          date: "2026-09-25",
          type: "repay_borrow",
          amount: 25000,
          purpose: "প্রথম কিস্তি পরিশোধ",
          dueDate: "",
          method: "bank",
          note: "ব্র্যাক ব্যাংক থেকে ১ম কিস্তি শোধ"
        }
      ]
    }
  ]
};
