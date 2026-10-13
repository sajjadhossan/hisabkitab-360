/**
 * HisabKitab 360 - Bangla QR Standard Payload Generator
 * -----------------------------------------------------
 * Tip 5: Generates Bangladesh Bank interoperable "Bangla QR" standard
 * payloads (EMVCo specification) supporting bKash, Nagad, Rocket, Upay,
 * and Visa/Mastercard QR scanning apps with exact payable amounts.
 */

class BanglaQrService {
  /**
   * Helper to format EMVCo TLV (Tag-Length-Value)
   */
  _formatTlv(tag, value) {
    const valStr = String(value);
    const lenStr = valStr.length < 10 ? `0${valStr.length}` : `${valStr.length}`;
    return `${tag}${lenStr}${valStr}`;
  }

  /**
   * Generate Bangla QR payload string
   * @param {Object} options
   * @param {string} options.merchantName - e.g. "মেসার্স সততা এন্টারপ্রাইজ"
   * @param {string} options.merchantCity - e.g. "Dhaka"
   * @param {string} options.merchantAccount - bKash / Nagad / Bank Account
   * @param {number} options.amount - Exact invoice amount
   * @param {string} options.invoiceNo - Reference bill number
   */
  generateBanglaQrPayload({
    merchantName = 'HisabKitab 360 Merchant',
    merchantCity = 'Dhaka',
    merchantAccount = '01700000000',
    amount = 0,
    invoiceNo = 'INV-001'
  }) {
    let payload = '';

    // 00: Payload Format Indicator (01)
    payload += this._formatTlv('00', '01');

    // 01: Point of Initiation Method (12 = Dynamic QR with amount)
    payload += this._formatTlv('01', amount > 0 ? '12' : '11');

    // 26: Merchant Account Information (Bangla QR ID)
    const merchantInfo = this._formatTlv('00', 'BD.BANGLAQR') + this._formatTlv('01', merchantAccount);
    payload += this._formatTlv('26', merchantInfo);

    // 52: Merchant Category Code (5411 = Grocery/Retail)
    payload += this._formatTlv('52', '5411');

    // 53: Transaction Currency (050 = BDT)
    payload += this._formatTlv('53', '050');

    // 54: Transaction Amount
    if (amount > 0) {
      payload += this._formatTlv('54', Number(amount).toFixed(2));
    }

    // 58: Country Code (BD)
    payload += this._formatTlv('58', 'BD');

    // 59: Merchant Name
    payload += this._formatTlv('59', merchantName.substring(0, 25));

    // 60: Merchant City
    payload += this._formatTlv('60', merchantCity.substring(0, 15));

    // 62: Additional Data Field (Invoice / Reference)
    const refData = this._formatTlv('01', invoiceNo.substring(0, 20));
    payload += this._formatTlv('62', refData);

    return payload;
  }
}

export const banglaQrService = new BanglaQrService();
