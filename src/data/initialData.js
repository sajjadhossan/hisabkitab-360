// Clean Slate Initial Data for Personal and Business Profiles
// Zero Mock Data Policy (Rule 7: Real data only, clean empty arrays)

export const initialData = {
  // ---------------------------------------------
  // PERSONAL PROFILE INITIAL DATA (EMPTY SLATE)
  // ---------------------------------------------
  personalExpenses: [],
  personalIncomes: [],
  personalSavings: [],
  personalDebts: [],

  // ---------------------------------------------
  // BUSINESS PROFILE INITIAL DATA (EMPTY SLATE)
  // ---------------------------------------------
  businessProducts: [],
  businessSalesHistory: [],
  businessCustomers: [],
  businessEmployees: [],
  businessSuppliers: [],
  businessExpenses: [],
  businessInvoices: [],
  businessQuotations: [],
  businessDamagedGoods: [],
  businessDebts: [],
  businessFieldOrders: [],

  // Business Base Settings
  businessSettings: {
    shopName: 'আমার প্রতিষ্ঠান',
    phone: '',
    address: '',
    taxRate: 0,
    discountRate: 0,
    defaultCurrency: '৳',
    invoicePrefix: 'INV-',
    enableStockAlert: true,
    enableSmsAlert: false,
    googleDriveEnabled: true,
    googleDriveWebhookUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_DRIVE_WEBHOOK_URL) || 'https://script.google.com/macros/s/AKfycbzFVruwt9PDxxmcKAtxxAtATUnLhxf9ZAFAJBN-UYU-dvsiTp5GLgMeVyApwKXfdEjj/exec'
  }
};
