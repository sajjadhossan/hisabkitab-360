// Unified Bilingual Translation & Localization Engine for Somiti 360
// Supports real-time dynamic switching between Bengali (বাংলা) and English (English)
import { useEffect, useCallback } from 'react';

export const SAMITY_DICTIONARY = {
  // Navigation & Clusters
  "ড্যাশবোর্ড": "Dashboard",
  "লাইভ ড্যাশবোর্ড": "Live Dashboard",
  "সদস্য ও সমাজকল্যাণ": "Members & Welfare",
  "সদস্য তালিকা ও ভর্তি": "Members Roster & Admission",
  "দৈনন্দিন ক্যাশ ও লেনদেন": "Daily Cash & Financials",
  "ক্যাশ ও আর্থিক কার্যক্রম": "Cash & Financial Operations",
  "অফিসিয়াল সচিবালয় ও প্যাড": "Secretariat & Official Pad",
  "অফিসিয়াল প্যাড ও নোটিশ": "Official Pad & Notices",
  "অডিট, রিপোর্ট ও গভর্ন্যান্স": "Audit, Reports & Governance",
  "পূর্ণাঙ্গ রিপোর্ট ও অডিট": "Full Reports & Audit",
  "পূর্ণাঙ্গ অডিট ও বিজনেস রিপোর্ট": "Audit & Business Reports",
  "সকল ফিচার সূচি": "All Modules Directory",
  "সকল মডিউল": "All Modules",
  "পূর্ণাঙ্গ বিজনেস সার্ভিস ও ফিচার ডিরেক্টরি": "Full Business Services & Features Directory",
  "সমিতির দৈনন্দিন কার্যক্রম, ব্যাংকিং, হিসাব ও প্রশাসনের সকল সার্ভিস লাইভ ও সম্পূর্ণ প্রস্তুত অবস্থায় নিচে তালিকাভুক্ত রয়েছে।": "All services for samity daily operations, banking, accounts, and administration are live and fully operational below.",
  "সম্পূর্ণ এন্টারপ্রাইজ সার্ভিস সক্রিয় (Enterprise Active)": "Full Enterprise Suite Active",
  "সম্পূর্ণ এন্টারপ্রাইজ সার্ভিস সক্রিয়": "Full Enterprise Suite Active",
  "স্বপ্ন সাজাই ভবিষ্যৎ গড়ি": "Building Dreams, Securing the Future",
  "স্বপ্নছোঁয়া সমবায় সমিতি": "Shopnochoa Co-operative Samity",

  // Top Bar & Controls
  "সমিতি ৩৬০": "Somiti 360",
  "সমিতি, সমবায় সংস্থা, সঞ্চয় ও ঋণদান ব্যবস্থাপনা প্ল্যাটফর্ম": "Samity, Cooperative, Savings & Microcredit Management Platform",
  "ভেরিফিকেশন পোর্টাল": "Verification Portal",
  "লগআউট": "Logout",
  "লগআউট করুন": "Logout Now",
  "সক্রিয় সমিতি": "Active Samity",
  "সমিতি পরিবর্তন": "Switch Samity",
  "নতুন সমিতি যোগ": "Add New Samity",
  "নতুন সমিতি": "New Samity",
  "সমিতি ও শাখা": "Branches & Samity",
  "শাখা / সমিতি": "Branch / Samity",
  "শাখা / সমিতি:": "Branch / Samity:",
  "সমিতি নির্বাচন করুন": "Select Samity",
  "প্রোফাইল": "Profile",
  "সেটিংস": "Settings",

  // Quick Action Buttons
  "জমা এন্ট্রি": "Deposit Entry",
  "নতুন সদস্য": "New Member",
  "নতুন সদস্য যোগ": "Add Member",
  "বাল্ক জমা": "Bulk Deposit",
  "ভাউচার হাব": "Voucher Hub",
  "খরচ এন্ট্রি": "Expense Entry",
  "ফান্ড ব্যালেন্স": "Fund Balance",

  // 28 Modules List Full Titles
  "১. সমিতি সেটআপ মডিউল": "1. Samity Setup Module",
  "২. সদস্য ব্যবস্থাপনা মডিউল": "2. Member Management Module",
  "৩. সাবস্ক্রিপশন / চাঁদা কনফিগারেশন": "3. Subscription Policy & Config Module",
  "৪. ব্যাংক ও নগদ জমা মডিউল": "4. Bank & Cash Deposit Module",
  "৫. বাল্ক ব্যাংক জমা মডিউল": "5. Bulk Bank Deposit Module",
  "৬. পেমেন্ট স্ট্যাটাস ড্যাশবোর্ড": "6. Payment Status Module",
  "৭. বকেয়া / ডিউ ব্যবস্থাপনা ও মওকুফ": "7. Due Defaulters & Waiver Module",
  "৮. পেইড রশিদ ও ভাউচার মডিউল": "8. Paid Receipt & Voucher Module",
  "৯. সেন্ট্রাল রিমাইন্ডার ইঞ্জিন": "9. Central Reminder Engine",
  "১০. হোয়াটসঅ্যাপ রিমাইন্ডার মডিউল": "10. WhatsApp Reminder Module",
  "১১. এসএমএস রিমাইন্ডার মডিউল": "11. SMS Reminder Module",
  "১২. টেলিগ্রাম রিমাইন্ডার মডিউল": "12. Telegram Reminder Module",
  "১৩. ফেসবুক / মেসেঞ্জার রিমাইন্ডার": "13. Facebook / Messenger Reminder Module",
  "১৪. ব্যয় / খরচ ব্যবস্থাপনা মডিউল": "14. Expense Management Module",
  "১৫. ফান্ড ও একাউন্টস ব্যালেন্স": "15. Fund & Balance Module",
  "১৬. ২৮টি পূর্ণাঙ্গ রিপোর্ট মডিউল": "16. 28 Full Reports Module",
  "১৭. লেটারহেড ও প্রিন্ট টেমপ্লেট": "17. Letterhead & Print Template Module",
  "১৮. স্বাক্ষর ও সিল ব্যবস্থাপনা": "18. Signature & Seal Management Module",
  "১৯. ডকুমেন্ট জেনারেটর মডিউল": "19. Document Generator Module",
  "২০. ইউজার, রোল ও পারমিশন মডিউল": "20. User, Role & Permission Module",
  "২১. অনুমোদন ওয়ার্কফ্লো মডিউল": "21. Approval Workflow Module",
  "২২. অডিট ট্রেইল ও হিস্টোরি লগ": "22. Audit Trail & History Module",
  "২৩. নোটিফিকেশন সেন্টার মডিউল": "23. Notification Center Module",
  "২৪. লাইভ এক্সিকিউটিভ ড্যাশবোর্ড": "24. Live Executive Dashboard",
  "২৫. কনফিগারেশন ও সেটিংস মডিউল": "25. Configuration & Settings Module",
  "২৬. রেস্ট এপিআই ও ওয়েবহুক মডিউল": "26. REST API & Webhook Module",
  "২৭. মাল্টি-ল্যাঙ্গুয়েজ মডিউল": "27. Multi-language Module",
  "২৮. ব্যাকআপ, এক্সপোর্ট ও ইমপোর্ট": "28. Backup, Export & Import Module",

  // Tabs & Sub-Tabs
  "সদস্য তালিকা": "Member List",
  "নতুন সদস্য ভর্তি": "New Member Admission",
  "সদস্য বিবরণী": "Member Details",
  "সদস্য প্রোফাইল": "Member Profile",
  "সদস্যের তথ্য": "Member Information",
  "ব্যাংক ও নগদ জমা": "Bank & Cash Deposits",
  "বাল্ক ব্যাংক জমা": "Bulk Bank Deposits",
  "একসাথে একাধিক জমা": "Bulk Deposit Entry",
  "পেইড রিসিট ও ভাউচার হাব": "Paid Receipts & Vouchers",
  "আদায়কৃত রসিদ খাতা": "Receipt Ledger",
  "সমিতির যাবতীয় খরচ": "Samity Expenses",
  "খরচ খতিয়ান": "Expense Ledger",
  "তহবিল ও ব্যাংক ব্যালেন্স": "Fund & Bank Balance",
  "ফান্ড ও ক্যাশ ব্যালেন্স": "Fund & Cash Balance",
  "চাঁদা ও পলিসি কনফিগ": "Fee Policy & Config",
  "চাঁদা পলিসি ও অটো-বিলিং": "Subscription Policy & Auto-Billing",
  "বকেয়া ও ডিউ ব্যবস্থাপনা": "Due Management",
  "বকেয়া খাতা": "Due Defaulters",
  "স্মার্ট তাগাদা ও নোটিশ": "Smart Reminders & Notices",
  "অফিসিয়াল লেটারহেড প্যাড": "Official Letterhead Pad",
  "নথি ও রেজুলেশন খাতা": "Documents & Resolutions",
  "ডিজিটাল স্বাক্ষর ও সিল": "Digital Signatures & Seal",
  "ডিজিタル স্বাক্ষর ও সিল": "Digital Signatures & Seal",
  "অনুমোদন পেন্ডিং কিউ": "Pending Approvals Queue",
  "লেনদেন অনুমোদন হাব": "Approvals Hub",
  "২৮টি পূর্ণাঙ্গ বিজনেস রিপোর্ট": "All 28 Business Reports",
  "সেন্ট্রাল ব্যাকআপ ও রিস্টোর": "Central Backup & Restore",
  "ব্যাকআপ ও রিস্টোর": "Backup & Restore",
  "সমিতি সেটআপ ও প্রোফাইল": "Samity Setup & Profile",
  "সমিতি ও শাখা সেটআপ": "Samity & Branch Setup",
  "ইউজার রোল ও RBAC পারমিশন": "User Roles & RBAC Permissions",
  "ইউজার রোল ও RBAC": "User Roles & RBAC",
  "অডিট ট্রেইল ও সিকিউরিটি লগ": "Audit Trail & Security Logs",
  "অডিট ট্রেইল ও হিস্টোরি": "Audit Trail & History",
  "SQL ডাটাবেজ স্কিমা ও API": "SQL Schema & API",
  "হোয়াটসঅ্যাপ ক্লাউড এপিআই": "WhatsApp Cloud API",
  "এসএমএস গেটওয়ে": "SMS Gateway",
  "টেলিগ্রাম বট হাব": "Telegram Bot Hub",
  "ফেসবুক ও মেসেঞ্জার": "Facebook & Messenger",

  // Metrics & Financial Cards
  "মোট সদস্য": "Total Members",
  "মোট নিবন্ধিত সদস্য": "Total Registered Members",
  "সক্রিয় সদস্য": "Active Members",
  "নিষ্ক্রিয় সদস্য": "Inactive Members",
  "মোট ফান্ড": "Total Fund",
  "নীট তহবিল ব্যালেন্স": "Net Fund Balance",
  "চলতি মাসের মোট আদায়": "Current Month Collection",
  "চলতি মাসের বকেয়া চাঁদা": "Current Month Due",
  "মোট বকেয়া": "Total Due",
  "মোট বকেয়া চাঁদা": "Total Overdue Amount",
  "চলতি মাসের আদায় হার": "Current Month Collection Rate",
  "মোট সঞ্চয়": "Total Savings",
  "মোট জমা": "Total Deposits",
  "মোট অনুমোদিত সঞ্চয় জমা": "Total Approved Deposits",
  "মোট উত্তোলন": "Total Withdrawals",
  "মোট আয়": "Total Income",
  "মোট ব্যয়": "Total Expense",
  "মোট খরচ": "Total Expenses",
  "মোট অনুমোদিত ব্যয় ও খরচ": "Total Approved Expenses",
  "বর্তমান ব্যালেন্স": "Current Balance",
  "হাতে নগদ স্থিতি": "Cash in Hand",
  "হাতে নগদ": "Cash in Hand",
  "ব্যাংক হিসাবের মোট স্থিতি": "Total Bank Account Balance",
  "ব্যাংক জমা": "Bank Deposits",
  "মোবাইল ব্যাংকিং স্থিতি": "Mobile Banking Balance",
  "রিজার্ভ ফান্ড": "Reserve Fund",
  "কল্যাণ ফান্ড": "Welfare Fund",
  "উন্নয়ন ফান্ড": "Development Fund",
  "জরুরি ফান্ড": "Emergency Fund",
  "লভ্যাংশ বন্টন": "Dividend Distribution",
  "লভ্যাংশ": "Dividend",
  "মাসিক চাঁদা": "Monthly Subscription",
  "মাসিক সঞ্চয় কিস্তি": "Monthly Savings Installment",
  "সঞ্চয় কিস্তি": "Savings Installment",
  "কিস্তি আদায়": "Installment Collection",
  "কিস্তি আদায়ের শিট": "Collection Sheet",

  // Member Fields & Labels
  "সদস্য কোড": "Member Code",
  "সদস্য আইডি": "Member ID",
  "সদস্যের নাম": "Member Name",
  "সদস্যের নাম (বাংলা)": "Member Name (Bengali)",
  "সদস্যের নাম (ইংরেজি)": "Member Name (English)",
  "নাম (বাংলা)": "Name (Bengali)",
  "নাম (ইংরেজি)": "Name (English)",
  "সদস্যপদ শ্রেণি": "Membership Type",
  "সাধারণ সদস্য": "General Member",
  "স্থায়ী সদস্য": "Permanent Member",
  "सहযোগী সদস্য": "Associate Member",
  "আজীবন সদস্য": "Life Member",
  "নির্বাহী সদস্য": "Executive Member",
  "প্রতিষ্ঠাতা সদস্য": "Founder Member",
  "সভাপতি": "President",
  "সহ-সভাপতি": "Vice President",
  "সাধারণ সম্পাদক": "General Secretary",
  "যুগ্ম সাধারণ সম্পাদক": "Joint General Secretary",
  "সাংগঠনিক সম্পাদক": "Organizing Secretary",
  "অর্থ সম্পাদক": "Finance Secretary",
  "কোষাধ্যক্ষ": "Treasurer",
  "প্রচার সম্পাদক": "Publicity Secretary",
  "দপ্তর সম্পাদক": "Office Secretary",
  "সমাজকল্যাণ সম্পাদক": "Welfare Secretary",
  "ধর্ম বিষয়ক সম্পাদক": "Religious Affairs Secretary",
  "ক্রীড়া ও সাংস্কৃতিক সম্পাদক": "Sports & Cultural Secretary",
  "মহিলা বিষয়ক সম্পাদক": "Women Affairs Secretary",
  "কার্যনির্বাহী সদস্য": "Executive Member",
  "উপদেষ্টা": "Advisor",
  "পিতার নাম": "Father's Name",
  "মাতার নাম": "Mother's Name",
  "স্বামীর নাম": "Husband's Name",
  "জাতীয় পরিচয়পত্র": "National ID (NID)",
  "এনআইডি নম্বর": "NID Number",
  "এনআইডি নম্বর (NID)": "NID Number",
  "পাসপোর্ট নম্বর": "Passport Number",
  "মোবাইল নম্বর": "Mobile Number",
  "বিকল্প মোবাইল": "Alternative Mobile",
  "বিকল্প মোবাইল নম্বর": "Alternative Mobile No",
  "হোয়াটসঅ্যাপ নম্বর": "WhatsApp Number",
  "ইমেইল": "Email",
  "ইমেইল ঠিকানা": "Email Address",
  "বর্তমান ঠিকানা": "Present Address",
  "স্থায়ী ঠিকানা": "Permanent Address",
  "পেশা": "Profession",
  "কর্মস্থল / প্রতিষ্ঠান": "Workplace / Organization",
  "রক্তের গ্রুপ": "Blood Group",
  "জন্ম তারিখ": "Date of Birth",
  "বয়স": "Age",
  "লিঙ্গ": "Gender",
  "পুরুষ": "Male",
  "মহিলা": "Female",
  "অন্যান্য": "Other",
  "যোগদানের তারিখ": "Joining Date",
  "সদস্যপদ শুরুর তারিখ": "Membership Start Date",
  "নমিনীর নাম": "Nominee Name",
  "নমিনীর মোবাইল": "Nominee Mobile",
  "নমিনীর সাথে সম্পর্ক": "Relation with Nominee",
  "নমিনীর এনআইডি": "Nominee NID",
  "নমিনীর অংশ (%)": "Nominee Share (%)",

  // Deposit & Payment Fields
  "ভাউচার নম্বর": "Voucher No",
  "রসিদ নম্বর": "Receipt No",
  "মানি রিসিট": "Money Receipt",
  "জমা রসিদ": "Deposit Receipt",
  "জমার তারিখ": "Deposit Date",
  "তারিখ": "Date",
  "আমানতকারীর নাম": "Depositor Name",
  "আমানতকারীর মোবাইল": "Depositor Mobile",
  "জমার খাত": "Deposit Category",
  "জমার খাত / ধরন": "Deposit Category / Type",
  "জমার মাধ্যম": "Deposit Method",
  "মাধ্যম": "Method",
  "ব্যাংক কাউন্টার": "Bank Counter",
  "ব্যাংক ট্রান্সফার / EFT": "Bank Transfer / EFT",
  "ক্যাশ কাউন্টার": "Cash Counter",
  "মোবাইল ব্যাংকিং (বিকাশ/নগদ/রকেট)": "Mobile Banking (bKash/Nagad/Rocket)",
  "ব্যাংকের নাম": "Bank Name",
  "শাখার নাম": "Branch Name",
  "হিসাব নম্বর": "Account Number",
  "রাউটিং নম্বর": "Routing Number",
  "ট্রানজেকশন আইডি (TrxID)": "Transaction ID (TrxID)",
  "জমার পরিমাণ": "Deposit Amount",
  "জমার পরিমাণ (টাকা)": "Deposit Amount (BDT)",
  "অনুমোদন স্ট্যাটাস": "Approval Status",
  "অনুমোদিত": "Approved",
  "অপেক্ষমাণ": "Pending",
  "বাতিল": "Cancelled",
  "পরিশোধিত": "Paid",
  "বকেয়া": "Due",
  "বকেয়া পরিমাণ": "Due Amount",
  "বকেয়া পরিমাণ (টাকা)": "Due Amount (BDT)",
  "বিলম্ব ফি": "Late Fee",
  "জরিমানা": "Fine / Penalty",
  "মোট প্রদেয়": "Total Payable",
  "পরিশোধের তারিখ": "Payment Date",
  "আংশিক পরিশোধ": "Partially Paid",
  "সম্পূর্ণ বকেয়া": "Fully Due",

  // Expense Fields
  "খরচের খাত": "Expense Category",
  "খরচের শিরোনাম": "Expense Title",
  "খরচের বিবরণ": "Expense Description",
  "খরচের পরিমাণ": "Expense Amount",
  "খরচের তারিখ": "Expense Date",
  "পরিশোধের মাধ্যম": "Payment Method",
  "প্রাপকের নাম": "Paid To",
  "বিল / ইনভয়েস নম্বর": "Bill / Invoice No",
  "ভাউচার ভিউ": "View Voucher",

  // Common UI Actions & Buttons
  "অনুসন্ধান": "Search",
  "অনুসন্ধান করুন": "Search here...",
  "নাম, মোবাইল বা কোড দিয়ে খুঁজুন": "Search by name, mobile, or code...",
  "ফিল্টার": "Filter",
  "ফিল্টার করুন": "Apply Filter",
  "সব": "All",
  "সকল": "All",
  "সকল সদস্য": "All Members",
  "সকল জমা": "All Deposits",
  "সকল খরচ": "All Expenses",
  "যোগ করুন": "Add",
  "নতুন যোগ": "Add New",
  "সম্পাদনা": "Edit",
  "সম্পাদনা করুন": "Edit Details",
  "মুছে ফেলুন": "Delete",
  "মুছুন": "Delete",
  "সংরক্ষণ": "Save",
  "সংরক্ষণ করুন": "Save Changes",
  "বাতিল করুন": "Cancel",
  "বাতিল": "Cancel",
  "বন্ধ করুন": "Close",
  "প্রিন্ট": "Print",
  "প্রিন্ট করুন": "Print Now",
  "ডাউনলোড": "Download",
  "ডাউনলোড করুন": "Download File",
  "রিলোড": "Reload",
  "রিফ্রেশ": "Refresh",
  "এক্সপোর্ট": "Export",
  "এক্সেল এক্সপোর্ট": "Excel Export",
  "পিডিএফ এক্সপোর্ট": "PDF Export",
  "সিএসভি এক্সপোর্ট": "CSV Export",
  "ইম্পোর্ট": "Import",
  "আপলোড": "Upload",
  "ছবি আপলোড": "Upload Photo",
  "স্বাক্ষর আপলোড": "Upload Signature",
  "বিস্তারিত": "Details",
  "দেখুন": "View",
  "অ্যাকশন": "Action",
  "স্ট্যাটাস": "Status",
  "বিবরণ": "Description",
  "মন্তব্য": "Remarks",
  "নোট": "Note",
  "স্বাক্ষর": "Signature",
  "সিল": "Seal",
  "অফিশিয়াল সিল": "Official Seal",
  "স্মারক নম্বর": "Memo / Ref No",
  "স্মারক নং": "Memo No",
  "প্রতিবেদন তৈরির তারিখ": "Report Generated Date",

  // Samity Launch & Status
  "সমিতি চালু করুন": "Launch Samity",
  "সমিতি সাময়িক স্থগিত / খসড়া করুন": "Pause Samity to Draft",
  "সমিতি সফলভাবে চালু ও সক্রিয় করা হয়েছে!": "Samity launched & activated successfully!",
  "সমিতি খসড়া/প্রস্তুতিমূলক মোডে রাখা হয়েছে": "Samity placed in Draft/Setup mode",
  "সক্রিয়": "Active",
  "নিষ্ক্রিয়": "Inactive",
  "খসড়া": "Draft",
  "স্থগিত": "Suspended",

  // Toasts & Alerts
  "সফলভাবে সংরক্ষিত হয়েছে": "Saved successfully",
  "সফলভাবে তৈরি করা হয়েছে": "Created successfully",
  "সফলভাবে আপডেট হয়েছে": "Updated successfully",
  "সফলভাবে মুছে ফেলা হয়েছে": "Deleted successfully",
  "কোনো তথ্য পাওয়া যায়নি": "No records found",
  "অনুগ্রহ করে সব তথ্য দিন": "Please fill all required fields",
  "সঠিক জমার পরিমাণ উল্লেখ করুন": "Enter a valid deposit amount",
  "সদস্যের নাম (বাংলা বা ইংরেজি) প্রদান করুন": "Provide member name in Bengali or English",
  "সদস্যের ব্যক্তিগত মোবাইল নম্বর আবশ্যক": "Member mobile number is required",
  "টাকা": "BDT",
  "ক্রমিক": "SL",
  "মাস": "Month",
  "বছর": "Year",
  "অর্থবছর": "Financial Year",
  "জানুয়ারি": "January",
  "ফেব্রুয়ারি": "February",
  "মার্চ": "March",
  "এপ্রিল": "April",
  "মে": "May",
  "জুন": "June",
  "জুলাই": "July",
  "আগস্ট": "August",
  "সেপ্টেম্বর": "September",
  "অক্টোবর": "October",
  "নভেম্বর": "November",
  "ডিসেম্বর": "December",

  // Auth & Security
  "সাইন ইন": "Sign In",
  "লগইন": "Login",
  "সাইন আপ": "Sign Up",
  "নতুন অ্যাকাউন্ট খুলুন": "Create New Account",
  "পাসওয়ার্ড": "Password",
  "পাসওয়ার্ড ভুলে গেছেন?": "Forgot Password?",
  "পিন দিয়ে প্রবেশ করুন": "Enter with Quick PIN",
  "ইমেইল দিয়ে প্রবেশ করুন": "Enter with Email",
  "মনে রাখুন": "Remember Me",
  "গুগল দিয়ে প্রবেশ করুন": "Continue with Google",
  "পূর্ণ নাম": "Full Name",
  "পাসওয়ার্ড নিশ্চিত করুন": "Confirm Password",
  "নিরাপদ সেশন যাচাই করা হচ্ছে...": "Verifying secure session...",
  "লগইন সফল হয়েছে": "Login successful",
  "নিবন্ধন সফল হয়েছে": "Registration successful",

  // Official Documents
  "স্মারক নং: সছস/২০২৬/০১": "Ref No: SCHS/2026/01",
  "জরুরি সাধারণ সভার নোটিশ": "Urgent General Meeting Notice",
  "কার্যবিবরণী": "Meeting Minutes",
  "প্রত্যয়ন পত্র": "Certificate of Clearance",
  "সদস্যপদ প্রত্যয়নপত্র": "Membership Certificate",
  "নোটিশ প্রাপক": "Notice Recipient",
  "অনুমোদিত কর্মকর্তা": "Authorized Officers",
  "অনুমোদিত সিল": "Authorized Seal",

  // Language Bar
  "ভাষা": "Language",
  "বাংলা": "Bangla",
  "ইংরেজি": "English",
  "বাংলা ভাষায় পরিবর্তন করুন": "Switch to Bengali",
  "Switch to English": "Switch to English"
};

// Standalone whole-word fallback map (ONLY applied to full standalone words, NEVER as sub-strings)
export const SAMITY_WHOLE_WORD_MAP = {
  "সদস্য": "Member",
  "সদস্যগণ": "Members",
  "সদস্যদের": "Members'",
  "সমিতি": "Samity",
  "সমিতির": "Samity's",
  "চাঁদা": "Subscription",
  "সঞ্চয়": "Savings",
  "কিস্তি": "Installment",
  "জমা": "Deposit",
  "খরচ": "Expense",
  "বকেয়া": "Due",
  "মোট": "Total",
  "আদায়": "Collected",
  "পরিশোধ": "Payment",
  "পরিশোধিত": "Paid",
  "অপেক্ষমাণ": "Pending",
  "অনুমোদিত": "Approved",
  "বাতিল": "Cancel",
  "সক্রিয়": "Active",
  "নিষ্ক্রিয়": "Inactive",
  "খসড়া": "Draft",
  "তারিখ": "Date",
  "শাখা": "Branch",
  "ব্যাংক": "Bank",
  "নগদ": "Cash",
  "ভাউচার": "Voucher",
  "রসিদ": "Receipt",
  "রশিদ": "Receipt",
  "নাম": "Name",
  "মোবাইল": "Mobile",
  "নম্বর": "Number",
  "ঠিকানা": "Address",
  "পেশা": "Profession",
  "স্ট্যাটাস": "Status",
  "বিবরণ": "Description",
  "মন্তব্য": "Remarks",
  "শতাংশ": "Percentage",
  "সংরক্ষণ": "Save",
  "সম্পাদনা": "Edit",
  "মুছুন": "Delete",
  "প্রিন্ট": "Print",
  "ডাউনলোড": "Download",
  "এক্সপোর্ট": "Export",
  "ইম্পোর্ট": "Import",
  "নতুন": "New",
  "যোগ": "Add",
  "তহবিল": "Fund",
  "ব্যালেন্স": "Balance",
  "মুনাফা": "Profit",
  "ক্ষতি": "Loss",
  "রিপোর্ট": "Report",
  "নোটিশ": "Notice",
  "স্বাক্ষর": "Signature",
  "সিল": "Seal"
};

// Convert Bengali numerals to English numerals
export function toEnglishDigits(str) {
  if (str === null || str === undefined) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[০-৯]/g, (d) => bnDigits.indexOf(d));
}

// Convert English numerals to Bengali numerals
export function toBengaliDigits(str) {
  if (str === null || str === undefined) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
}

// Format numbers according to active language
export function formatLocalizedNumber(num, lang = 'bn') {
  if (num === null || num === undefined || num === '') return '';
  if (lang === 'en') {
    return toEnglishDigits(num);
  }
  return toBengaliDigits(num);
}

// Translate a Bengali phrase or sentence to English cleanly without corrupting words
export function translateSamityText(text, targetLang = 'en') {
  if (targetLang === 'bn' || !text || typeof text !== 'string') return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Direct exact dictionary match
  if (SAMITY_DICTIONARY[trimmed]) {
    return text.replace(trimmed, SAMITY_DICTIONARY[trimmed]);
  }

  // 2. Stripped punctuation match
  const cleanKey = trimmed.replace(/[:\?\.,!/]/g, '').trim();
  if (SAMITY_DICTIONARY[cleanKey]) {
    return text.replace(cleanKey, SAMITY_DICTIONARY[cleanKey]);
  }

  // 3. Multi-phrase longest-match substitution (phrases > 3 characters)
  let translated = trimmed;
  let hasReplaced = false;

  const sortedKeys = Object.keys(SAMITY_DICTIONARY).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (k.length >= 3 && translated.includes(k)) {
      translated = translated.split(k).join(SAMITY_DICTIONARY[k]);
      hasReplaced = true;
    }
  }

  // 4. Strict whole-word replacement using Unicode letter boundary checking
  // (Prevents "বিজনেস" -> "বিPersonsসেস" or "দৈনন্দিন" -> "দৈনন্দDays")
  for (const [bnWord, enWord] of Object.entries(SAMITY_WHOLE_WORD_MAP)) {
    try {
      const regex = new RegExp('(?:^|(?<=[^\\p{L}\\p{M}]))' + bnWord + '(?=[^\\p{L}\\p{M}]|$)', 'gu');
      if (regex.test(translated)) {
        translated = translated.replace(regex, enWord);
        hasReplaced = true;
      }
    } catch {
      // Fallback if environment doesn't support unicode property escapes
      if (translated === bnWord) {
        translated = enWord;
        hasReplaced = true;
      }
    }
  }

  // 5. Convert any remaining Bengali digits to English digits in English mode
  if (/[০-৯]/.test(translated)) {
    translated = toEnglishDigits(translated);
    hasReplaced = true;
  }

  return hasReplaced ? text.replace(trimmed, translated) : text;
}

/**
 * useSamityTranslator Hook
 * Provides high-speed reactive bilingual translation for React components and dynamic DOM
 */
export function useSamityTranslator(containerRef, lang = 'bn') {
  const t = useCallback((bn, en) => {
    if (lang === 'bn') return bn;
    if (en) return en;
    return translateSamityText(bn, 'en');
  }, [lang]);

  useEffect(() => {
    if (!containerRef?.current) return;
    const root = containerRef.current;

    const translateElementTree = (node) => {
      if (node.nodeType === 3) { // Text node
        const val = node.nodeValue;
        if (!val || !val.trim()) return;

        if (lang === 'bn') {
          if (node.__originalBnText !== undefined) {
            node.nodeValue = node.__originalBnText;
          }
        } else {
          // English mode
          if (node.__originalBnText === undefined) {
            node.__originalBnText = val;
          }
          const translated = translateSamityText(node.__originalBnText, 'en');
          if (translated !== node.nodeValue) {
            node.nodeValue = translated;
          }
        }
      } else if (node.nodeType === 1) { // Element node
        const tag = node.tagName?.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'pre' || tag === 'code') return;

        // Translate placeholders
        if (node.placeholder) {
          if (node.__origPlaceholder === undefined) node.__origPlaceholder = node.placeholder;
          node.placeholder = lang === 'en' ? translateSamityText(node.__origPlaceholder, 'en') : node.__origPlaceholder;
        }

        // Translate titles / tooltips
        if (node.title) {
          if (node.__origTitle === undefined) node.__origTitle = node.title;
          node.title = lang === 'en' ? translateSamityText(node.__origTitle, 'en') : node.__origTitle;
        }

        // Translate button text and aria-labels
        if (node.getAttribute && node.getAttribute('aria-label')) {
          const aria = node.getAttribute('aria-label');
          if (node.__origAria === undefined) node.__origAria = aria;
          node.setAttribute('aria-label', lang === 'en' ? translateSamityText(node.__origAria, 'en') : node.__origAria);
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          translateElementTree(node.childNodes[i]);
        }
      }
    };

    // Initial translation execution
    translateElementTree(root);

    // Dynamic Mutation Observer for state changes, tabs switching, modals opening
    let isUpdating = false;
    const observer = new MutationObserver((mutations) => {
      if (isUpdating) return;
      isUpdating = true;
      try {
        for (const m of mutations) {
          if (m.type === 'childList') {
            for (let i = 0; i < m.addedNodes.length; i++) {
              translateElementTree(m.addedNodes[i]);
            }
          } else if (m.type === 'characterData') {
            translateElementTree(m.target);
          }
        }
      } finally {
        isUpdating = false;
      }
    });

    observer.observe(root, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [containerRef, lang]);

  return {
    t,
    translateText: (txt) => translateSamityText(txt, lang),
    formatNumber: (n) => formatLocalizedNumber(n, lang)
  };
}
