/**
 * HisabKitab 360 - Automated SMS & WhatsApp Messaging Gateway
 * -----------------------------------------------------------
 * Tip 2: Dispatches invoice summaries & payment links via:
 * - One-click Direct WhatsApp API (`wa.me`)
 * - Bangladeshi Bulk SMS Gateways (Greenweb, BulkSMSBD, AlphaSMS)
 */

class AutomatedMessagingGateway {
  /**
   * Format Bengali Invoice Message
   */
  formatInvoiceMessage({ storeName = 'হিসাবকিতাব ৩৬০', invoiceNo, customerName, grandTotal, paidAmount, dueAmount }) {
    const lines = [
      `🧾 *${storeName}*`,
      `চালান নং: ${invoiceNo}`,
      customerName ? `গ্রাহক: ${customerName}` : null,
      `মোট টাকা: ৳${grandTotal}`,
      `পরিশোধ: ৳${paidAmount}`,
      dueAmount > 0 ? `⚠️ অবশিষ্ট বকেয়া: ৳${dueAmount}` : '✅ সম্পূর্ণ পরিশোধিত',
      `ধন্যবাদ, আবার আসবেন!`,
      `ডিজিটাল হিসাব: HisabKitab 360`
    ].filter(Boolean);

    return lines.join('\n');
  }

  /**
   * Generate Direct WhatsApp Click-to-Chat URL
   */
  getWhatsAppShareUrl(customerPhone, messageText) {
    if (!customerPhone) return '';
    let cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = `88${cleanPhone}`;
    } else if (!cleanPhone.startsWith('88')) {
      cleanPhone = `880${cleanPhone}`;
    }

    const encoded = encodeURIComponent(messageText);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }

  /**
   * Open WhatsApp directly in a new tab / mobile app
   */
  sendWhatsAppInvoice(invoice, customerPhone) {
    const text = this.formatInvoiceMessage(invoice);
    const url = this.getWhatsAppShareUrl(customerPhone, text);
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true, url };
    }
    return { success: false, message: 'সঠিক ফোন নম্বর পাওয়া যায়নি' };
  }

  /**
   * Send SMS via Configured Provider
   */
  async sendSms({ apiKey, senderId, phone, message }) {
    if (!phone || !message) {
      return { success: false, message: 'ফোন নম্বর এবং মেসেজ প্রয়োজন' };
    }

    // If API credentials provided, call gateway
    if (apiKey) {
      try {
        const response = await fetch('https://api.sms-gateway.example/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, senderId, phone, message })
        });
        return { success: response.ok, simulated: false };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Default: Log simulated SMS in development
    console.log(`[SMS Gateway Simulated] To: ${phone} | Msg: ${message}`);
    return { success: true, simulated: true };
  }
}

export const automatedMessagingGateway = new AutomatedMessagingGateway();
