import React, { useState, useMemo, useEffect } from "react";
import { isModuleEnabled } from "../../services/tenantManagerService";
import { APP_VERSION_NAME } from "../../config/version";
import {
  Users,
  Building2,
  Landmark,
  Wallet,
  Receipt,
  FileText,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  PenTool,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  X,
  Star,
  Layers,
  Database,
  Send,
  QrCode,
  FileSpreadsheet,
  Moon,
  Sun,
  Globe,
  Radio,
  Sliders,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
  Menu,
  FileDown,
  Lock,
  LogOut,
  FolderOpen,
  Calendar,
  CreditCard,
  HeartHandshake,
  DollarSign,
  TrendingUp,
  Activity,
  Award,
  RefreshCw,
  Info,
} from "lucide-react";

export const SamityDrawerNavigation = ({
  activeTab,
  setActiveTab,
  currentSamity = {},
  samities = [],
  activeSamityId,
  setActiveSamityId,
  currentUser = {},
  activeUserRole = "admin",
  isLight = false,
  activeLang = "bn",
  setLang,
  toggleTheme,
  effectiveMetrics = {},
  data = {},
  isOpenMobile = false,
  setIsOpenMobile,
  isCollapsedDesktop = false,
  setIsCollapsedDesktop,
  onAction = () => {},
  t = (bn, en) => bn,
  playButtonClick = () => {},
  triggerHaptic = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    s1_profile: true,
    s2_dashboard: true,
    s3_finance: true,
  });

  const [moduleVersion, setModuleVersion] = useState(0);

  useEffect(() => {
    const handleModuleToggle = () => setModuleVersion((v) => v + 1);
    window.addEventListener("somiti_module_toggled", handleModuleToggle);
    window.addEventListener("somiti_workspace_switched", handleModuleToggle);
    window.addEventListener("somiti_tenants_changed", handleModuleToggle);
    return () => {
      window.removeEventListener("somiti_module_toggled", handleModuleToggle);
      window.removeEventListener("somiti_workspace_switched", handleModuleToggle);
      window.removeEventListener("somiti_tenants_changed", handleModuleToggle);
    };
  }, []);

  const [pinnedModules, setPinnedModules] = useState(() => {
    try {
      const saved = localStorage.getItem("s360_pinned_modules");
      return saved ? JSON.parse(saved) : ["dashboard", "deposits", "members", "paid_receipt"];
    } catch {
      return ["dashboard", "deposits", "members", "paid_receipt"];
    }
  });

  // Toggle Pinned/Favorite Module
  const togglePin = (moduleId, e) => {
    e?.stopPropagation?.();
    playButtonClick?.();
    triggerHaptic?.();
    setPinnedModules((prev) => {
      const updated = prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId];
      try {
        localStorage.setItem("s360_pinned_modules", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle Section Expansion
  const toggleSection = (sectionId) => {
    playButtonClick?.();
    triggerHaptic?.();
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Calculate live badge counts
  const pendingDepositsCount = useMemo(() => {
    return (data.deposits || []).filter((d) => d.status === "pending" || d.approvalStatus === "pending").length;
  }, [data.deposits]);

  const pendingExpensesCount = useMemo(() => {
    return (data.expenses || []).filter((e) => e.status === "pending" || e.approvalStatus === "pending").length;
  }, [data.expenses]);

  const recycleBinCount = useMemo(() => {
    return (data.recycleBinDeposits || []).length;
  }, [data.recycleBinDeposits]);

  const unreadChatCount = useMemo(() => {
    return (data.chatMessages || []).length;
  }, [data.chatMessages]);

  const dueMembersCount = useMemo(() => {
    return effectiveMetrics?.dueMembers || 0;
  }, [effectiveMetrics]);

  // 13 Full Enterprise Menu Sections
  const menuSections = useMemo(() => {
    return [
      // 3.1 Samity Profile
      {
        id: "s1_profile",
        number: "১",
        titleBn: "সমিতি প্রোফাইল",
        titleEn: "Samity Profile",
        descBn: "পরিচিতি, ব্যাংক হিসাব ও কমিটি",
        descEn: "Identity, Bank & Committee",
        icon: Building2,
        color: "#10b981",
        items: [
          {
            id: "samity_profile_info",
            titleBn: "সমিতি প্রোফাইল ও পরিচিতি",
            titleEn: "Samity Profile & Info",
            descBn: "নাম, স্লোগান ও সরকারি রেজিঃ নম্বর",
            descEn: "Name, slogan & registration info",
            icon: Building2,
            targetTab: "samity_setup",
          },
          {
            id: "samity_address_contact",
            titleBn: "ঠিকানা ও যোগাযোগ",
            titleEn: "Address & Contact",
            descBn: "অফিস ঠিকানা, ফোন ও ওয়েবসাইট",
            descEn: "Office address, phone & web",
            icon: Globe,
            targetTab: "samity_setup",
            subAction: "contact",
          },
          {
            id: "samity_bank_accounts",
            titleBn: "ব্যাংক অ্যাকাউন্ট ও মোবাইল ব্যাংকিং",
            titleEn: "Bank Accounts & MFS",
            descBn: "সমিতির ব্যাংক হিসাব ও বিকাশ/নগদ নম্বর",
            descEn: "Bank & mobile financial accounts",
            icon: Landmark,
            targetTab: "samity_setup",
            subAction: "bank",
          },
          {
            id: "samity_signatures_seals",
            titleBn: "সিগনেচার ও অফিসিয়াল সিল",
            titleEn: "Signatures & Seals",
            descBn: "ডিজিটাল সিল ও সভাপতির স্বাক্ষর",
            descEn: "Official rubber stamps & signatures",
            icon: PenTool,
            targetTab: "signatures",
          },
          {
            id: "samity_branch_action",
            titleBn: "শাখা ও সমিতি ব্যবস্থাপনা",
            titleEn: "Branch & Multi-Samity Hub",
            descBn: "শাখা নির্বাচন ও নতুন সমিতি তৈরি",
            descEn: "Select branch or register new society",
            icon: Building2,
            isModalAction: true,
            actionKey: "new_samity",
          },
        ],
      },

      // 3.2 Dashboard
      {
        id: "s2_dashboard",
        number: "২",
        titleBn: "ড্যাশবোর্ড",
        titleEn: "Dashboard",
        descBn: "সমিতির সার্বিক অবস্থা ও মেট্রিক্স",
        descEn: "Executive Summary & Metrics",
        icon: Layers,
        color: "#3b82f6",
        items: [
          {
            id: "dashboard_overview",
            titleBn: "ড্যাশবোর্ড ও সার্বিক সারসংক্ষেপ",
            titleEn: "Live Dashboard Overview",
            descBn: "আদায়, বকেয়া ও তহবিলের লাইভ চিত্র",
            descEn: "Live status of collections & funds",
            icon: Layers,
            targetTab: "dashboard",
            badge: "Live",
            badgeColor: "#10b981",
          },
          {
            id: "dashboard_collection_summary",
            titleBn: "আদায়ের সারসংক্ষেপ ও স্ট্যাটাস",
            titleEn: "Collection Status Matrix",
            descBn: "চলতি মাসের আদায়ের অগ্রগতি ও তালিকা",
            descEn: "Current month collection progress",
            icon: TrendingUp,
            targetTab: "payment_status",
          },
          {
            id: "supervisor_radar_action",
            titleBn: "সুপারভাইজার লাইভ রাডার",
            titleEn: "Supervisor Live Radar",
            descBn: "ফিল্ড অফিসার ট্র্যাকিং ও অডিট রাডার",
            descEn: "Field collection audit radar",
            icon: Radio,
            isModalAction: true,
            actionKey: "supervisor_radar",
            badge: pendingDepositsCount > 0 ? `${pendingDepositsCount}` : null,
            badgeColor: "#f59e0b",
          },
        ],
      },

      // 3.3 Cash & Finance
      {
        id: "s3_finance",
        number: "৩",
        titleBn: "ক্যাশ ও ফিন্যান্স",
        titleEn: "Cash & Finance",
        descBn: "জমা, ব্যয়, তহবিল ও ব্যাংক লেনদেন",
        descEn: "Deposits, Expenses & Funds",
        icon: Wallet,
        color: "#059669",
        items: [
          {
            id: "deposit_entry_action",
            titleBn: "+ ক্যাশ ও কিস্তি ডিপোজিট এন্ট্রি",
            titleEn: "+ Cash & Installment Deposit",
            descBn: "সদস্যের সঞ্চয় ও কিস্তি জমা গ্রহণ",
            descEn: "Receive member savings deposit",
            icon: Plus,
            isModalAction: true,
            actionKey: "deposit_entry",
            badge: "নতুন",
            badgeColor: "#10b981",
          },
          {
            id: "deposits_list",
            titleBn: "জমার তালিকা ও ডিপোজিট লেজার",
            titleEn: "Deposits & Savings Ledger",
            descBn: "অনুমোদিত সঞ্চয় ও কিস্তির খতিয়ান",
            descEn: "Approved deposits history",
            icon: Wallet,
            targetTab: "deposits",
            count: data.deposits?.length || 0,
          },
          {
            id: "bulk_deposit_entry",
            titleBn: "বাল্ক ডিপোজিট (এক স্লিপে বহু সদস্য)",
            titleEn: "Bulk Bank Slip Deposit",
            descBn: "এক ব্যাংক চালানে একাধিক সদস্যের চাঁদা",
            descEn: "Bulk multi-member bank deposit",
            icon: Landmark,
            targetTab: "bulk_deposit",
          },
          {
            id: "expenses_management",
            titleBn: "ব্যয় ও খরচ ভাউচার",
            titleEn: "Expense & Payment Vouchers",
            descBn: "দৈনিক ও নিয়মিত প্রাতিষ্ঠানিক খরচ",
            descEn: "Daily operational expenses",
            icon: Receipt,
            targetTab: "expenses",
            count: data.expenses?.length || 0,
          },
          {
            id: "fund_balance_sheet",
            titleBn: "তহবিল, ক্যাশ ও ব্যাংক রিকনসিলিয়েশন",
            titleEn: "Fund Balance & Reconciliation",
            descBn: "ক্যাশ ইন হ্যান্ড, ব্যাংক ও মোবাইল ব্যালেন্স",
            descEn: "Cash in hand & bank reconciliation",
            icon: Landmark,
            targetTab: "fund_balance",
          },
        ],
      },

      // 3.4 Member & Welfare
      {
        id: "s4_members",
        number: "৪",
        titleBn: "সদস্য ও কল্যাণ",
        titleEn: "Member & Welfare",
        descBn: "সদস্য রোস্টার, বায়োডাটা ও কল্যাণ তহবিল",
        descEn: "Roster, Biodata & Welfare",
        icon: Users,
        color: "#0ea5e9",
        items: [
          {
            id: "new_member_action",
            titleBn: "+ নতুন সদস্য ভর্তি ও নিবন্ধন",
            titleEn: "+ Register New Member",
            descBn: "নতুন সদস্যের ভর্তি ফর্ম ও বায়োডাটা",
            descEn: "Membership registration form",
            icon: Plus,
            isModalAction: true,
            actionKey: "new_member",
            badge: "ভর্তি",
            badgeColor: "#0ea5e9",
          },
          {
            id: "members_roster",
            titleBn: "সদস্য রোস্টার ও পূর্ণাঙ্গ রেজিস্টার",
            titleEn: "Member Directory & Roster",
            descBn: "সকল সক্রিয় ও নিবন্ধিত সদস্যদের প্রোফাইল",
            descEn: "All active registered members",
            icon: Users,
            targetTab: "members",
            count: effectiveMetrics.totalMembers || 0,
          },
        ],
      },

      // 3.5 Subscription & Due
      {
        id: "s5_dues",
        number: "৫",
        titleBn: "চাঁদা ও বকেয়া",
        titleEn: "Subscription & Due",
        descBn: "মাসিক চাঁদা, বকেয়া ও তাগিদপত্র",
        descEn: "Monthly Fees & Dues Control",
        icon: AlertTriangle,
        color: "#f59e0b",
        items: [
          {
            id: "due_management_ledger",
            titleBn: "বকেয়া তালিকা ও বকেয়া ব্যবস্থাপনা",
            titleEn: "Due Management & Overdue List",
            descBn: "সকল বকেয়া সদস্য ও বকেয়া কিস্তির খাতা",
            descEn: "List of members with pending dues",
            icon: AlertTriangle,
            targetTab: "due_mgmt",
            badge: dueMembersCount > 0 ? `${dueMembersCount} জন` : null,
            badgeColor: "#ef4444",
          },
          {
            id: "payment_status_matrix",
            titleBn: "সাবস্ক্রিপশন ও পেমেন্ট স্ট্যাটাস",
            titleEn: "Payment Status Matrix",
            descBn: "পরিশোধিত, অপরিশোধিত ও আংশিক পরিশোধ",
            descEn: "Paid, unpaid & partial payment status",
            icon: Clock,
            targetTab: "payment_status",
          },
          {
            id: "subscription_policy_config",
            titleBn: "চাঁদার হার ও কনফিগারেশন",
            titleEn: "Subscription Fee Configuration",
            descBn: "মাসিক চাঁদা, গ্রেস পিরিয়ড ও জরিমানা",
            descEn: "Monthly fee, grace period & late fees",
            icon: Wallet,
            targetTab: "subscription_cfg",
          },
        ],
      },

      // 3.6 Smart Reminder
      {
        id: "s6_reminders",
        number: "৬",
        titleBn: "স্মার্ট রিমাইন্ডার",
        titleEn: "Smart Reminder",
        descBn: "হোয়াটসঅ্যাপ, এসএমএস ও টেলিগ্রাম তাগাদা",
        descEn: "WhatsApp, SMS & Telegram Hub",
        icon: Send,
        color: "#8b5cf6",
        items: [
          {
            id: "reminders_queue_hub",
            titleBn: "রিমাইন্ডার ড্যাশবোর্ড ও কিউ",
            titleEn: "Reminder Dashboard & Queue",
            descBn: "সকল বকেয়া সদস্যের অটো রিমাইন্ডার শিডিউল",
            descEn: "Automated due reminders queue",
            icon: Send,
            targetTab: "reminders",
            subTab: "queue",
          },
          {
            id: "reminders_whatsapp_hub",
            titleBn: "হোয়াটসঅ্যাপ ওয়ান-ক্লিক রিমাইন্ডার",
            titleEn: "WhatsApp 1-Click Reminder",
            descBn: "সরাসরি ওয়ান-ক্লিক হোয়াটসঅ্যাপ তাগাদা",
            descEn: "Direct WhatsApp broadcast messages",
            icon: MessageSquare,
            targetTab: "reminders",
            subTab: "whatsapp_hub",
          },
          {
            id: "reminders_sms_hub",
            titleBn: "বাংলা ইউনিকোড এসএমএস হাব",
            titleEn: "Unicode SMS Gateway Hub",
            descBn: "মোবাইল এসএমএস গেটওয়ে ও টেমপ্লেট",
            descEn: "Bulk SMS gateway & templates",
            icon: Send,
            targetTab: "reminders",
            subTab: "sms_hub",
          },
          {
            id: "reminders_telegram_hub",
            titleBn: "টেলিগ্রাম বট নোটিফিকেশন",
            titleEn: "Telegram Bot Notifier",
            descBn: "টেলিগ্রাম চ্যানেল ও গ্রুপ নোটিফিকেশন",
            descEn: "Automated Telegram notifications",
            icon: Send,
            targetTab: "reminders",
            subTab: "telegram_hub",
          },
          {
            id: "reminders_history_log",
            titleBn: "রিমাইন্ডার হিস্টোরি ও ডেলিভারি রিপোর্ট",
            titleEn: "Reminder History & Report",
            descBn: "অতীতে প্রেরিত সকল রিমাইন্ডারের ডেলিভারি স্ট্যাটাস",
            descEn: "Delivery status log of past reminders",
            icon: Clock,
            targetTab: "reminders",
            subTab: "history",
          },
        ],
      },

      // 3.7 Documents & QR Verification
      {
        id: "s7_documents",
        number: "৭",
        titleBn: "ডকুমেন্ট ও QR যাচাই",
        titleEn: "Documents & QR",
        descBn: "রিসিট, সনদ, প্যাড ও QR ভেরিফিকেশন",
        descEn: "Receipts, Docs & Verification",
        icon: QrCode,
        color: "#14b8a6",
        items: [
          {
            id: "paid_receipts_hub",
            titleBn: "পেইড মানি রিসিট ও রসিদ খাতা",
            titleEn: "Paid Money Receipts & Ledger",
            descBn: "হাই-রেজুলেশন QR কোড সহ রসিদ প্রিন্ট ও PDF",
            descEn: "Print and download receipts with QR",
            icon: Receipt,
            targetTab: "paid_receipt",
          },
          {
            id: "universal_qr_action",
            titleBn: "🔍 কিউআর কোড স্ক্যানার ও যাচাই",
            titleEn: "🔍 Universal QR Scanner & Verifier",
            descBn: "ক্যামেরা বা ছবি আপলোড করে রিসিট ভেরিফাই",
            descEn: "Verify document by camera or image QR",
            icon: QrCode,
            isModalAction: true,
            actionKey: "universal_qr",
            badge: "স্ক্যানার",
            badgeColor: "#14b8a6",
          },
          {
            id: "letterhead_composer",
            titleBn: "অফিসিয়াল লেটারহেড প্যাড ও চিঠি",
            titleEn: "Official Letterhead Pad",
            descBn: "সমিতির অফিশিয়াল প্যাডে চিঠি ও নোটিস রাইটার",
            descEn: "Official letterhead notice composer",
            icon: FileText,
            targetTab: "letterhead",
          },
          {
            id: "documents_archive_box",
            titleBn: "প্রত্যয়নপত্র, সনদ ও ডকুমেন্টস",
            titleEn: "Membership Certs & Archive",
            descBn: "সদস্য প্রত্যয়নপত্র ও সভার রেজুলেশন দলিল",
            descEn: "Official certificates & resolutions",
            icon: FileText,
            targetTab: "documents",
          },
        ],
      },

      // 3.8 Internal Chat & Communication
      {
        id: "s8_communication",
        number: "৮",
        titleBn: "ইন্টারনাল চ্যাট ও যোগাযোগ",
        titleEn: "Internal Chat",
        descBn: "কমিটি চ্যাট, নোটিস বোর্ড ও ডিভাইস মেশ",
        descEn: "Board Chat & Device Mesh",
        icon: MessageSquare,
        color: "#6366f1",
        items: [
          {
            id: "internal_chat_hub",
            titleBn: "পরিচালনা পর্ষদের অভ্যন্তরীণ চ্যাট",
            titleEn: "Executive Committee Chat",
            descBn: "সমিতির কর্মকর্তাদের নিরাপদ মেসেজিং হাব",
            descEn: "Secure in-app communication hub",
            icon: MessageSquare,
            targetTab: "internal_chat",
            badge: unreadChatCount > 0 ? `${unreadChatCount}` : null,
          },
          {
            id: "device_mesh_action",
            titleBn: "৪-প্ল্যাটফর্ম লাইভ ডিভাইস মেশ",
            titleEn: "4-Platform Live Device Mesh",
            descBn: "ওয়েব, এপিকে, উইন্ডোজ ও ম্যাক লাইভ কানেকশন",
            descEn: "Live sync status across 4 platforms",
            icon: Radio,
            isModalAction: true,
            actionKey: "device_mesh",
          },
        ],
      },

      // 3.9 Office & Administration
      {
        id: "s9_office",
        number: "৯",
        titleBn: "অফিস ও প্রশাসন",
        titleEn: "Office & Administration",
        descBn: "কমিটি, সভার রেজুলেশন ও কার্যবিবরণী",
        descEn: "Committee, Meetings & Minutes",
        icon: Building2,
        color: "#d97706",
        items: [
          {
            id: "meeting_minutes_composer",
            titleBn: "সভার নোটিশ ও রেজুলেশন কার্যবিবরণী",
            titleEn: "Meeting Notices & Minutes",
            descBn: "কার্যনির্বাহী ও সাধারণ সভার রেজুলেশন",
            descEn: "Executive & AGM meeting minutes",
            icon: FileText,
            targetTab: "letterhead",
          },
          {
            id: "saas_guide_action",
            titleBn: "বাণিজ্যিক সফটওয়্যার আর্কিটেকচার",
            titleEn: "Commercial SaaS Architecture Guide",
            descBn: "সফটওয়্যার বিক্রির লাইসেন্সিং ও হোয়াইট-লেবেল গাইড",
            descEn: "Commercial licensing & architecture",
            icon: Sparkles,
            isModalAction: true,
            actionKey: "saas_guide",
          },
        ],
      },

      // 3.10 Paid Notice & Approval
      {
        id: "s10_approvals",
        number: "১০",
        titleBn: "পেইড নোটিস ও অনুমোদন",
        titleEn: "Paid Notice & Approval",
        descBn: "জমা ও খরচের পেন্ডিং অনুমোদন পাইপলাইন",
        descEn: "Pending Deposit & Expense Approvals",
        icon: CheckCircle2,
        color: "#16a34a",
        items: [
          {
            id: "approvals_pipeline",
            titleBn: "অনুমোদনের অপেক্ষায় (পেন্ডিং রিকুয়েস্ট)",
            titleEn: "Pending Approvals Pipeline",
            descBn: "কোষাধ্যক্ষ ও সভাপতির অনুমোদনের পাইপলাইন",
            descEn: "Treasurer & President approval queue",
            icon: CheckCircle2,
            targetTab: "approvals",
            badge:
              pendingDepositsCount + pendingExpensesCount > 0
                ? `${pendingDepositsCount + pendingExpensesCount}টি পেন্ডিং`
                : null,
            badgeColor: "#ea580c",
          },
        ],
      },

      // 3.11 Reports & Analytics
      {
        id: "s11_reports",
        number: "১১",
        titleBn: "রিপোর্ট ও বিশ্লেষণ",
        titleEn: "Reports & Analytics",
        descBn: "২৮টি সম্পূর্ণ অডিট ও আর্থিক রিপোর্ট",
        descEn: "28 Master Cooperative Audit Reports",
        icon: FileSpreadsheet,
        color: "#0284c7",
        items: [
          {
            id: "all_28_reports_suite",
            titleBn: "২৮টি বহুমুখী সমবায় অডিট রিপোর্ট",
            titleEn: "28 Master Cooperative Reports",
            descBn: "দৈনিক খতিয়ান, সদস্য লেজার, এক্সেল ও সিএসভি",
            descEn: "Master audit reports & Excel/CSV export",
            icon: FileSpreadsheet,
            targetTab: "reports",
            badge: "28টি",
            badgeColor: "#0284c7",
          },
          {
            id: "annual_financial_summary",
            titleBn: "আর্থিক স্থিতির সারাংশ ও তহবিল প্রতিবেদন",
            titleEn: "Annual Financial Summary",
            descBn: "সমিতির মোট তহবিল, ক্যাশ ও ব্যালেন্স শিট",
            descEn: "Net fund balance & balance sheet",
            icon: Landmark,
            targetTab: "fund_balance",
          },
        ],
      },

      // 3.12 System Tools
      {
        id: "s12_system_tools",
        number: "১২",
        titleBn: "সিস্টেম টুলস",
        titleEn: "System Tools",
        descBn: "রিসাইকেল বিন, ব্যাকআপ ও সেন্ট্রাল SQL",
        descEn: "Recycle Bin, Backup & SQL Schema",
        icon: Database,
        color: "#475569",
        items: [
          {
            id: "recycle_bin_action",
            titleBn: "রিসাইকেল বিন ও মুছে ফেলা লেনদেন",
            titleEn: "Financial Recycle Bin & Restore",
            descBn: "মুছে ফেলা জমা ও সদস্য রেকর্ড পুনরুদ্ধার",
            descEn: "Restore deleted deposits & members",
            icon: Trash2,
            isModalAction: true,
            actionKey: "recycle_bin",
            badge: recycleBinCount > 0 ? `${recycleBinCount}` : null,
          },
          {
            id: "backup_restore_hub",
            titleBn: "টেলিগ্রাম ও ক্লাউড অটো-ব্যাকআপ",
            titleEn: "Cloud & Telegram Auto-Backup",
            descBn: "স্বয়ংক্রিয় ক্লাউড ব্যাকআপ ও JSON/Excel সংরক্ষণ",
            descEn: "Automated backups & data restore",
            icon: Send,
            targetTab: "backup_restore",
          },
          {
            id: "sql_database_schema",
            titleBn: "পোস্টগ্রেস্কেল ডাটাবেস স্কিমা ও API",
            titleEn: "PostgreSQL Database Schema & API",
            descBn: "সেন্ট্রালাইজড ক্লাউড স্কিমা ও এপিআই এন্ডপয়েন্ট",
            descEn: "Central cloud database schema & endpoints",
            icon: Database,
            targetTab: "sql_schema",
          },
          {
            id: "audit_trail_log",
            titleBn: "লাইভ অ্যাক্টিভিটি ও অডিট ট্রেইল",
            titleEn: "Live Audit Trail & History",
            descBn: "প্রতিটি এডিটিং ও ডিলিটের অপরিবর্তনযোগ্য লগ",
            descEn: "Immutable audit trail of user actions",
            icon: Clock,
            targetTab: "audit_trail",
          },
        ],
      },

      // 3.13 Settings & Support
      {
        id: "s13_settings",
        number: "১৩",
        titleBn: "সেটিংস ও সহায়তা",
        titleEn: "Settings & Support",
        descBn: "ভূমিকা, পারমিশন, ভাষা ও এআই সহকারী",
        descEn: "Roles, RBAC, AI & Preferences",
        icon: Sliders,
        color: "#64748b",
        items: [
          {
            id: "roles_permissions_hub",
            titleBn: "ইউজার রোল ও ভূমিকা পারমিশন (RBAC)",
            titleEn: "User Roles & RBAC Matrix",
            descBn: "সভাপতি, কোষাধ্যক্ষ ও সদস্যদের ক্ষমতা নির্ধারণ",
            descEn: "Control permissions for each role",
            icon: ShieldCheck,
            targetTab: "roles_permissions",
          },
          {
            id: "ai_voice_assistant_action",
            titleBn: "🎙️ এআই ভয়েস সহকারী (Smart AI)",
            titleEn: "🎙️ AI Voice Receipt Assistant",
            descBn: "ভয়েস কম্যান্ডে রসিদ যাচাই ও বায়োডাটা সার্চ",
            descEn: "Voice assistant for receipts & biodata",
            icon: Sparkles,
            isModalAction: true,
            actionKey: "ai_voice",
          },
          {
            id: "system_notifications_center",
            titleBn: "নোটিফিকেশন সেন্টার ও সিস্টেম অ্যালার্ট",
            titleEn: "System Notifications Center",
            descBn: "সমিতির জরুরি নোটিশ ও পেমেন্ট রিমাইন্ডার",
            descEn: "Alerts, notices & reminders",
            icon: Bell,
            targetTab: "notifications",
          },
        ],
      },
    ];
  }, [
    data.deposits,
    data.expenses,
    data.recycleBinDeposits,
    data.chatMessages,
    effectiveMetrics,
    pendingDepositsCount,
    pendingExpensesCount,
    recycleBinCount,
    unreadChatCount,
    dueMembersCount,
  ]);

  // Section & Item SaaS Module Requirements Mapping
  const availableSections = useMemo(() => {
    const SECTION_MODULE_REQ = {
      s4_members: "members",
      s5_dues: "microloan",
      s6_reminders: "sms_gateway",
      s7_documents: "secretariat",
      s10_approvals: "qr_verification",
      s11_reports: "audit_reports",
      s13_settings: "staff_rbac",
    };

    const ITEM_MODULE_REQ = {
      deposits_list: "savings",
      deposit_entry_action: "savings",
      bulk_deposit_entry: "savings",
      expenses_management: "expenses",
      fund_balance_sheet: "bank_funds",
      new_member_action: "members",
      members_roster: "members",
      dues_collection_list: "microloan",
      smart_reminder_center: "sms_gateway",
      official_letterhead: "secretariat",
      official_documents: "secretariat",
      qr_instant_verify: "qr_verification",
      audit_balance_sheet: "audit_reports",
      role_permission_matrix: "staff_rbac",
    };

    return menuSections
      .filter((sec) => {
        const req = SECTION_MODULE_REQ[sec.id];
        return !req || isModuleEnabled(req);
      })
      .map((sec) => {
        const filteredItems = sec.items.filter((it) => {
          const itReq = ITEM_MODULE_REQ[it.id] || ITEM_MODULE_REQ[it.targetTab];
          return !itReq || isModuleEnabled(itReq);
        });
        return {
          ...sec,
          items: filteredItems,
        };
      })
      .filter((sec) => sec.items.length > 0);
  }, [menuSections, moduleVersion]);

  // Flatten all items for search & pinned lookup
  const allItems = useMemo(() => {
    const list = [];
    availableSections.forEach((s) => {
      s.items.forEach((item) => {
        list.push({ ...item, sectionTitleBn: s.titleBn, sectionTitleEn: s.titleEn });
      });
    });
    return list;
  }, [availableSections]);

  // Filter items by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return availableSections;
    const q = searchQuery.toLowerCase().trim();
    return availableSections
      .map((section) => {
        const matchingItems = section.items.filter(
          (item) =>
            item.titleBn.toLowerCase().includes(q) ||
            item.titleEn.toLowerCase().includes(q) ||
            item.descBn?.toLowerCase().includes(q) ||
            item.descEn?.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q)
        );
        const sectionMatches =
          section.titleBn.toLowerCase().includes(q) ||
          section.titleEn.toLowerCase().includes(q);
        if (sectionMatches || matchingItems.length > 0) {
          return {
            ...section,
            items: sectionMatches ? section.items : matchingItems,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [availableSections, searchQuery]);

  // Handle item click
  const handleItemClick = (item) => {
    playButtonClick?.();
    triggerHaptic?.();
    if (setIsOpenMobile) setIsOpenMobile(false);

    if (item.isModalAction) {
      onAction?.(item.actionKey);
      return;
    }

    if (item.targetTab) {
      setActiveTab(item.targetTab);
      if (item.subAction) {
        onAction?.(`sub_action:${item.subAction}`);
      }
      if (item.subTab) {
        onAction?.(`sub_tab:${item.subTab}`);
      }
    }
  };

  const isDark = !isLight;
  const bgColor = isLight ? "#ffffff" : "#0b1120";
  const borderColor = isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)";
  const textColor = isLight ? "#0f172a" : "#f8fafc";
  const mutedTextColor = isLight ? "#64748b" : "#94a3b8";

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => {
            playButtonClick?.();
            setIsOpenMobile(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 1000,
            transition: "opacity 0.25s ease",
          }}
        />
      )}

      {/* Main Drawer Container (Desktop Sidebar + Mobile Slide-over Drawer) */}
      <aside
        className={`samity-drawer-sidebar ${isOpenMobile ? "mobile-open" : ""}`}
        style={{
          width: isCollapsedDesktop ? "80px" : "340px",
          background: bgColor,
          borderRight: `1px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100%",
          maxHeight: "100vh",
          overflow: "hidden",
          position: isOpenMobile ? "fixed" : "relative",
          top: 0,
          left: 0,
          zIndex: isOpenMobile ? 1001 : 30,
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isOpenMobile
            ? "6px 0 32px rgba(0,0,0,0.45)"
            : isCollapsedDesktop
            ? "none"
            : isLight
            ? "2px 0 10px rgba(0,0,0,0.03)"
            : "none",
        }}
      >
        <style>{`
          @media (max-width: 991px) {
            .samity-drawer-sidebar {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              bottom: 0 !important;
              width: 88vw !important;
              max-width: 360px !important;
              transform: translateX(-100%);
            }
            .samity-drawer-sidebar.mobile-open {
              transform: translateX(0) !important;
            }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)"};
            border-radius: 5px;
          }
          .menu-card-item {
            transition: all 0.15s ease;
          }
          .menu-card-item:hover {
            transform: translateX(2px);
          }
          .menu-card-item:active {
            transform: scale(0.98);
          }
        `}</style>

        {/* 1. STICKY DRAWER HEADER: SAMITY PROFILE & CONTROLS */}
        <div
          style={{
            padding: isCollapsedDesktop ? "16px 8px" : "18px 16px 14px",
            borderBottom: `1px solid ${borderColor}`,
            background: isLight
              ? "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)"
              : "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(11, 17, 32, 0.98) 100%)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Top Row: Logo, Name & Close/Collapse */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsedDesktop ? "center" : "space-between",
              gap: "10px",
            }}
          >
            <div
              onClick={() => {
                playButtonClick?.();
                setActiveTab("samity_setup");
                if (isOpenMobile && setIsOpenMobile) setIsOpenMobile(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minWidth: 0,
                cursor: "pointer",
              }}
              title={t("সমিতি প্রোফাইল খুলতে ক্লিক করুন", "Click to open Samity Profile")}
            >
              {/* Samity Logo */}
              <div
                style={{
                  width: isCollapsedDesktop ? "44px" : "48px",
                  height: isCollapsedDesktop ? "44px" : "48px",
                  borderRadius: "12px",
                  background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                  border: `2px solid ${isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.15)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <img
                  src={currentSamity.logo || "/shopnochoa-logo.svg"}
                  alt={currentSamity.nameBn || "Samity"}
                  onError={(e) => {
                    e.currentTarget.src = "/shopnochoa-logo.svg";
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: "2px" }}
                />
              </div>

              {/* Samity Name & Slogan (Expanded view only) */}
              {!isCollapsedDesktop && (
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.98rem",
                      fontWeight: "900",
                      color: textColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {activeLang === "en"
                      ? currentSamity.nameEn || currentSamity.nameBn || "Samity 360"
                      : currentSamity.nameBn || "স্বপ্নছোঁয়া সমবায় সমিতি"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: mutedTextColor,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "2px",
                    }}
                  >
                    {currentSamity.sloganBn || "স্বপ্ন সাজাই, ভবিষ্যৎ গড়ি"}
                  </div>
                </div>
              )}
            </div>

            {/* Close on Mobile or Collapse on Desktop */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isOpenMobile && (
                <button
                  type="button"
                  onClick={() => {
                    playButtonClick?.();
                    setIsOpenMobile(false);
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    border: `1.5px solid ${borderColor}`,
                    background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                    color: textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title={t("ড্রয়ার বন্ধ করুন", "Close Drawer")}
                >
                  <X size={18} />
                </button>
              )}

              {!isOpenMobile && setIsCollapsedDesktop && (
                <button
                  type="button"
                  onClick={() => {
                    playButtonClick?.();
                    triggerHaptic?.();
                    setIsCollapsedDesktop(!isCollapsedDesktop);
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: `1px solid ${borderColor}`,
                    background: "transparent",
                    color: mutedTextColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title={isCollapsedDesktop ? t("সাইডবার বড় করুন", "Expand") : t("সাইডবার ছোট করুন", "Collapse")}
                >
                  {isCollapsedDesktop ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* User Badge, Quick Actions & Theme/Language (Expanded view) */}
          {!isCollapsedDesktop && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: isLight ? "#f1f5f9" : "rgba(15, 23, 42, 0.7)",
                padding: "10px 12px",
                borderRadius: "10px",
                border: `1px solid ${borderColor}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* User avatar & role */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: "900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {(currentUser.name || "U")[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: "800",
                        color: textColor,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {currentUser.name || "সাজ্জাদ হোসেন"}
                    </div>
                    <div
                      onClick={() => {
                        playButtonClick?.();
                        onAction?.("open_role_modal");
                      }}
                      title={t("স্টাফ পারমিশন ও রোল পরিবর্তন করতে ক্লিক করুন", "Click to configure role permissions")}
                      style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      {activeUserRole === "admin"
                        ? t("অ্যাডমিন (Admin)", "Admin")
                        : activeUserRole === "president"
                        ? t("সভাপতি (President)", "President")
                        : activeUserRole === "treasurer"
                        ? t("কোষাধ্যক্ষ (Treasurer)", "Treasurer")
                        : activeUserRole}
                    </div>
                  </div>
                </div>

                {/* Notification Bell, Language & Dark Mode */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      playButtonClick?.();
                      setActiveTab("notifications");
                      if (isOpenMobile && setIsOpenMobile) setIsOpenMobile(false);
                    }}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "7px",
                      border: `1px solid ${borderColor}`,
                      background: "transparent",
                      color: textColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    title={t("নোটিফিকেশন সেন্টার", "Notifications")}
                  >
                    <Bell size={13} />
                    {pendingDepositsCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-2px",
                          right: "-2px",
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#ef4444",
                        }}
                      />
                    )}
                  </button>

                  {setLang && (
                    <button
                      type="button"
                      onClick={() => {
                        playButtonClick?.();
                        setLang(activeLang === "bn" ? "en" : "bn");
                      }}
                      style={{
                        padding: "3px 7px",
                        fontSize: "0.7rem",
                        fontWeight: "800",
                        borderRadius: "7px",
                        border: `1px solid ${borderColor}`,
                        background: "transparent",
                        color: textColor,
                        cursor: "pointer",
                      }}
                      title={t("ভাষা পরিবর্তন", "Switch Language")}
                    >
                      {activeLang === "bn" ? "EN" : "বাং"}
                    </button>
                  )}

                  {toggleTheme && (
                    <button
                      type="button"
                      onClick={() => {
                        playButtonClick?.();
                        toggleTheme();
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        border: `1px solid ${borderColor}`,
                        background: "transparent",
                        color: textColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      title={t("থিম পরিবর্তন", "Toggle Theme")}
                    >
                      {isLight ? <Moon size={13} /> : <Sun size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instant Large Search Bar (Expanded view) */}
          {!isCollapsedDesktop && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: isLight ? "#f1f5f9" : "rgba(15, 23, 42, 0.9)",
                border: `1.5px solid ${borderColor}`,
                borderRadius: "10px",
                padding: "0 12px",
                height: "42px",
              }}
            >
              <Search size={16} color={mutedTextColor} />
              <input
                type="text"
                placeholder={
                  activeLang === "en"
                    ? "Search all 13 modules..."
                    : "মডিউল খুঁজুন (যেমন: জমা, রিসিট, অডিট)..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: textColor,
                  fontSize: "0.86rem",
                  fontWeight: "600",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: mutedTextColor,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. SCROLLABLE MENU BODY: 13 ENTERPRISE SECTIONS */}
        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isCollapsedDesktop ? "12px 6px" : "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Quick Pinned Modules (Expanded view) */}
          {!isCollapsedDesktop && !searchQuery && pinnedModules.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: mutedTextColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "0 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Star size={13} color="#f59e0b" fill="#f59e0b" />
                <span>{t("দ্রুত অ্যাক্সেস / ফেভারিট", "Quick Access / Pinned")}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {pinnedModules.slice(0, 4).map((modId) => {
                  const item = allItems.find((i) => i.id === modId || i.targetTab === modId);
                  if (!item) return null;
                  const Icon = item.icon || Layers;
                  const isCurrent = activeTab === item.targetTab;
                  return (
                    <button
                      key={modId}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 10px",
                        borderRadius: "10px",
                        border: `1.5px solid ${isCurrent ? "#10b981" : borderColor}`,
                        background: isCurrent
                          ? isLight
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(16, 185, 129, 0.22)"
                          : isLight
                          ? "#ffffff"
                          : "rgba(255, 255, 255, 0.04)",
                        color: isCurrent ? "#10b981" : textColor,
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        boxShadow: isLight ? "0 1px 4px rgba(0,0,0,0.03)" : "none",
                      }}
                    >
                      <Icon size={14} color={isCurrent ? "#10b981" : mutedTextColor} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {activeLang === "en" ? item.titleEn : item.titleBn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 13 Enterprise Sections */}
          {filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = searchQuery ? true : expandedSections[section.id] ?? true;
            const hasActiveChild = section.items.some((it) => it.targetTab === activeTab);

            return (
              <div
                key={section.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {/* Section Header Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCollapsedDesktop && setIsCollapsedDesktop) {
                      setIsCollapsedDesktop(false);
                    } else {
                      toggleSection(section.id);
                    }
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsedDesktop ? "center" : "space-between",
                    padding: isCollapsedDesktop ? "10px 0" : "8px 10px",
                    borderRadius: "10px",
                    background: hasActiveChild
                      ? isLight
                        ? "rgba(16, 185, 129, 0.08)"
                        : "rgba(16, 185, 129, 0.16)"
                      : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  title={activeLang === "en" ? section.titleEn : section.titleBn}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: `${section.color}18`,
                        color: section.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <SectionIcon size={16} />
                    </div>
                    {!isCollapsedDesktop && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: "900",
                            color: hasActiveChild ? "#10b981" : textColor,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {activeLang === "en" ? section.titleEn : section.titleBn}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: mutedTextColor, fontWeight: "600" }}>
                          {activeLang === "en" ? section.descEn : section.descBn}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCollapsedDesktop && (
                    <span style={{ color: mutedTextColor, opacity: 0.8 }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  )}
                </button>

                {/* Sub-items in Section: 56dp to 64dp Touch-friendly Card-Style */}
                {(!isCollapsedDesktop || searchQuery) && isExpanded && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      marginTop: "2px",
                      paddingLeft: isCollapsedDesktop ? "0" : "4px",
                    }}
                  >
                    {section.items.map((item) => {
                      const ItemIcon = item.icon || Layers;
                      const isCurrent = activeTab === item.targetTab;
                      const isPinned = pinnedModules.includes(item.id) || pinnedModules.includes(item.targetTab);

                      return (
                        <div
                          key={item.id}
                          className="menu-card-item"
                          onClick={() => handleItemClick(item)}
                          style={{
                            minHeight: "58px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "12px",
                            background: isCurrent
                              ? isLight
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(16, 185, 129, 0.25)"
                              : isLight
                              ? "#ffffff"
                              : "rgba(30, 41, 59, 0.6)",
                            border: `1.5px solid ${isCurrent ? "#10b981" : borderColor}`,
                            cursor: "pointer",
                            boxShadow: isCurrent
                              ? "0 4px 12px rgba(16, 185, 129, 0.2)"
                              : isLight
                              ? "0 2px 6px rgba(0,0,0,0.02)"
                              : "none",
                          }}
                        >
                          {/* Left: Icon & Large Typography with Description */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                background: isCurrent
                                  ? "rgba(16, 185, 129, 0.25)"
                                  : isLight
                                  ? "#f1f5f9"
                                  : "rgba(255, 255, 255, 0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <ItemIcon
                                size={18}
                                color={isCurrent ? "#10b981" : isLight ? "#334155" : "#cbd5e1"}
                              />
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: "0.88rem",
                                  fontWeight: isCurrent ? "900" : "750",
                                  color: isCurrent ? "#10b981" : textColor,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  lineHeight: 1.25,
                                }}
                              >
                                {activeLang === "en" ? item.titleEn : item.titleBn}
                              </div>
                              {item.descBn && (
                                <div
                                  style={{
                                    fontSize: "0.72rem",
                                    color: mutedTextColor,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    marginTop: "2px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {activeLang === "en" ? item.descEn : item.descBn}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Status Badges, Counts & Pin Star */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flexShrink: 0,
                            }}
                          >
                            {item.badge && (
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: "800",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  background: item.badgeColor
                                    ? `${item.badgeColor}22`
                                    : "rgba(16, 185, 129, 0.15)",
                                  color: item.badgeColor || "#10b981",
                                  border: `1px solid ${item.badgeColor || "#10b981"}45`,
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                            {item.count !== undefined && item.count > 0 && (
                              <span
                                style={{
                                  fontSize: "0.74rem",
                                  fontWeight: "800",
                                  color: mutedTextColor,
                                  background: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                                  padding: "2px 7px",
                                  borderRadius: "8px",
                                }}
                              >
                                {item.count}
                              </span>
                            )}
                            {/* Star Toggle */}
                            <button
                              type="button"
                              onClick={(e) => togglePin(item.id, e)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: "4px",
                                cursor: "pointer",
                                opacity: isPinned ? 1 : 0.3,
                                color: isPinned ? "#f59e0b" : mutedTextColor,
                              }}
                              title={isPinned ? t("আনপিন করুন", "Unpin") : t("পিন করুন", "Pin")}
                            >
                              <Star size={13} fill={isPinned ? "#f59e0b" : "none"} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. STICKY FOOTER: CLOUD SYNC & APP VERSION */}
        <div
          style={{
            padding: isCollapsedDesktop ? "12px 6px" : "12px 16px",
            borderTop: `1px solid ${borderColor}`,
            background: isLight ? "#f8fafc" : "rgba(15, 23, 42, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsedDesktop ? "center" : "space-between",
            flexShrink: 0,
            position: "sticky",
            bottom: 0,
            zIndex: 10,
          }}
        >
          {!isCollapsedDesktop ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
                <span style={{ fontSize: "0.74rem", color: mutedTextColor, fontWeight: "700" }}>
                  {t("সেন্ট্রাল ক্লাউড: সিঙ্কড", "Central Cloud: Synced")}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    color: "#10b981",
                    background: isLight ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {APP_VERSION_NAME}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    playButtonClick?.();
                    window.dispatchEvent(new CustomEvent('somiti_trigger_update_check'));
                  }}
                  title={t("নতুন আপডেট চেক করুন", "Check for Updates")}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: isLight ? '#0284c7' : '#38bdf8',
                    background: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)',
                    border: isLight ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={10} />
                  <span>{t('আপডেট চেক', 'Update')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playButtonClick?.();
                    window.dispatchEvent(new CustomEvent('somiti_trigger_diagnostic'));
                  }}
                  title={t("সিস্টেম ডায়াগনস্টিক ও ৫০-পয়েন্ট হেলথ চেক (Ctrl+Shift+D)", "System Diagnostics & Health (Ctrl+Shift+D)")}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: '#10b981',
                    background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)',
                    border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Activity size={10} />
                  <span>{t('হেলথ', 'Health')}</span>
                </button>
              </div>
            </>
          ) : (
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 10px #10b981",
              }}
              title={`Cloud Connected (${APP_VERSION_NAME})`}
            />
          )}
        </div>
      </aside>
    </>
  );
};

export default SamityDrawerNavigation;
