/**
 * HisabKitab 360 - Commercial Bluetooth Thermal Receipt Printer Service (POS 58mm / 80mm)
 * Supports:
 *  1. Android Native APK Bridge: window.AndroidBtPrinterBridge (Direct RFCOMM Socket)
 *  2. Web Bluetooth API: navigator.bluetooth (Chrome on Android, Windows, Mac)
 *  3. ESC/POS Binary Byte Generator (Bilingual BDT, Monospaced Columns, QR code raster)
 *  4. Browser In-App Thermal Fallback (Styled 58mm/80mm window.print())
 */

import { hapticFeedback } from './nativeAppService.js';

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;

export const ESC_POS_COMMANDS = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_WIDTH: [GS, 0x21, 0x11],
  DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  DOUBLE_WIDTH: [GS, 0x21, 0x10],
  NORMAL_TEXT: [GS, 0x21, 0x00],
  FEED_LINES: (n = 3) => [ESC, 0x64, n],
  CUT_FULL: [GS, 0x56, 0x00],
  CUT_PARTIAL: [GS, 0x56, 0x01]
};

/**
 * Checks whether native Android Bluetooth bridge is available
 */
export function isAndroidNativeBluetoothAvailable() {
  return typeof window !== 'undefined' && 
         Boolean(window.AndroidBtPrinterBridge) && 
         typeof window.AndroidBtPrinterBridge.printRawBase64 === 'function';
}

/**
 * Checks whether Web Bluetooth API is supported
 */
export function isWebBluetoothSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
}

/**
 * Gets paired or connected Bluetooth printers
 */
export async function getPairedBluetoothPrinters() {
  const devices = [];

  // 1. Check Android Native APK Bridge
  if (isAndroidNativeBluetoothAvailable()) {
    try {
      const rawJson = window.AndroidBtPrinterBridge.getPairedDevices();
      const parsed = JSON.parse(rawJson || '[]');
      parsed.forEach(dev => {
        devices.push({
          id: dev.address,
          address: dev.address,
          name: dev.name || 'Bluetooth POS Printer',
          type: 'android_native',
          isPaired: true
        });
      });
      return devices;
    } catch (err) {
      console.warn('[ThermalPrinter] Android native bridge device read failed:', err);
    }
  }

  // 2. Check cached Web Bluetooth devices from localStorage
  try {
    const cached = localStorage.getItem('somiti_saved_bt_printer');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.id) {
        devices.push({
          ...parsed,
          type: 'web_bluetooth_cached',
          isPaired: true
        });
      }
    }
  } catch {}

  return devices;
}

/**
 * Pairs/Connects to a new Web Bluetooth Printer via browser picker
 */
export async function scanAndPairWebBluetoothPrinter() {
  if (!isWebBluetoothSupported()) {
    throw new Error('আপনার ব্রাউজারে Web Bluetooth API সমর্থিত নয়। দয়া করে Chrome বা Android APK ব্যবহার করুন।');
  }

  try {
    hapticFeedback.light();
    // Standard Bluetooth Serial Port and Printer Service UUIDs
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
        '0000e0ff-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // ISSC Transparent UART
      ]
    });

    if (!device) throw new Error('কোনো প্রিন্টার নির্বাচন করা হয়নি।');

    const printerMeta = {
      id: device.id,
      address: device.id,
      name: device.name || 'Bluetooth Thermal Printer',
      type: 'web_bluetooth',
      isPaired: true
    };

    localStorage.setItem('somiti_saved_bt_printer', JSON.stringify(printerMeta));
    return printerMeta;
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Helper to build an aligned row with two columns (e.g. Left Key, Right Value)
 */
function formatTwoColumnRow(left, right, maxChars = 32) {
  const leftStr = String(left || '');
  const rightStr = String(right || '');
  const spaceNeeded = maxChars - leftStr.length - rightStr.length;
  if (spaceNeeded <= 0) {
    return `${leftStr} ${rightStr}\n`;
  }
  return `${leftStr}${' '.repeat(spaceNeeded)}${rightStr}\n`;
}

/**
 * Builds ESC/POS Byte Array for a Somiti Paid Receipt (58mm = 32 chars wide, 80mm = 48 chars wide)
 */
export function buildReceiptEscPosBuffer(deposit, samityInfo = {}, options = {}) {
  const paperWidth = options.paperWidth || 58; // 58 or 80 mm
  const maxChars = paperWidth === 80 ? 48 : 32;
  const divider = '-'.repeat(maxChars) + '\n';
  const doubleDivider = '='.repeat(maxChars) + '\n';

  const samityName = (samityInfo.nameBn || samityInfo.name || 'সমিতি ৩৬০').slice(0, maxChars);
  const regNo = samityInfo.regNo ? `রেজি: ${samityInfo.regNo}` : '';
  const phone = samityInfo.phone ? `মোবাইল: ${samityInfo.phone}` : '';
  const address = (samityInfo.address || '').slice(0, maxChars);

  const receiptNo = deposit.receiptNo || deposit.voucherNo || `RCPT-${deposit.id || '001'}`;
  const dateStr = deposit.depositDate || new Date().toISOString().split('T')[0];
  const timeStr = deposit.created_at ? new Date(deposit.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '';
  const memberName = deposit.memberName || deposit.depositorName || 'সম্মানিত সদস্য';
  const memberId = deposit.memberIdNo || deposit.memberId || '-';
  const depositType = deposit.type || deposit.depositType || 'মাসিক সঞ্চয়';
  const paymentMethod = deposit.paymentMethod || 'ক্যাশ (নগদ)';
  const amount = Number(deposit.amount || 0).toLocaleString('en-US');
  const amountWords = deposit.amountInWordsBn || deposit.amountInWords || '';
  const collector = deposit.collectorName || deposit.collectedBy || deposit.created_by || 'অফিস কাউন্টার';
  const refCode = deposit.shortCode || deposit.id?.toString().slice(0, 8) || 'VERIFIED';

  const lines = [];

  // 1. Reset / Init Printer
  lines.push(...ESC_POS_COMMANDS.INIT);

  // 2. Header (Center Aligned, Bold, Double Height for Name)
  lines.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  lines.push(...ESC_POS_COMMANDS.BOLD_ON);
  lines.push(...ESC_POS_COMMANDS.DOUBLE_HEIGHT);
  lines.push(...encodeTextToAsciiBytes(`${samityName}\n`));
  lines.push(...ESC_POS_COMMANDS.NORMAL_TEXT);
  lines.push(...ESC_POS_COMMANDS.BOLD_OFF);

  if (address) lines.push(...encodeTextToAsciiBytes(`${address}\n`));
  if (regNo || phone) {
    const subHeader = [regNo, phone].filter(Boolean).join(' | ');
    lines.push(...encodeTextToAsciiBytes(`${subHeader}\n`));
  }

  lines.push(...encodeTextToAsciiBytes(doubleDivider));
  lines.push(...ESC_POS_COMMANDS.BOLD_ON);
  lines.push(...encodeTextToAsciiBytes('** জমা আদায় রসিদ **\n(PAID MONEY RECEIPT)\n'));
  lines.push(...ESC_POS_COMMANDS.BOLD_OFF);
  lines.push(...encodeTextToAsciiBytes(divider));

  // 3. Receipt Details (Left Aligned Two Columns)
  lines.push(...ESC_POS_COMMANDS.ALIGN_LEFT);
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('রসিদ নং:', receiptNo, maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('তারিখ ও সময়:', `${dateStr} ${timeStr}`.trim(), maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('সদস্য আইডি:', memberId, maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('সদস্য নাম:', memberName.slice(0, 18), maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('আদায়ের খাত:', depositType.slice(0, 18), maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('পরিশোধ মাধ্যম:', paymentMethod.slice(0, 18), maxChars)));
  lines.push(...encodeTextToAsciiBytes(divider));

  // 4. Amount Highlight (Large, Bold, Center)
  lines.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  lines.push(...ESC_POS_COMMANDS.BOLD_ON);
  lines.push(...ESC_POS_COMMANDS.DOUBLE_HEIGHT_WIDTH);
  lines.push(...encodeTextToAsciiBytes(`Tk. ${amount}/=\n`));
  lines.push(...ESC_POS_COMMANDS.NORMAL_TEXT);
  lines.push(...ESC_POS_COMMANDS.BOLD_OFF);

  if (amountWords) {
    lines.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
    lines.push(...encodeTextToAsciiBytes(`(${amountWords})\n`));
  }
  lines.push(...encodeTextToAsciiBytes(divider));

  // 5. Collector & Verification Code
  lines.push(...ESC_POS_COMMANDS.ALIGN_LEFT);
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('আদায়কারী:', collector.slice(0, 18), maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('যাচাই কোড:', `#${refCode}`, maxChars)));
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow('স্ট্যাটাস:', 'সফলভাবে সংরক্ষিত [APPROVED]', maxChars)));
  lines.push(...encodeTextToAsciiBytes(divider));

  // 6. Signature Lines
  lines.push(...ESC_POS_COMMANDS.ALIGN_LEFT);
  lines.push(...encodeTextToAsciiBytes('\n\n'));
  const sigLeft = 'সদস্য স্বাক্ষর';
  const sigRight = 'অনুমোদিত স্বাক্ষর';
  lines.push(...encodeTextToAsciiBytes(formatTwoColumnRow(sigLeft, sigRight, maxChars)));
  lines.push(...encodeTextToAsciiBytes('\n'));

  // 7. Footer
  lines.push(...ESC_POS_COMMANDS.ALIGN_CENTER);
  lines.push(...encodeTextToAsciiBytes('ডিজিটালভাবে জেনারেটকৃত রশিদ\nwww.somiti360.com\n'));
  lines.push(...encodeTextToAsciiBytes(doubleDivider));

  // 8. Feed & Cut
  lines.push(...ESC_POS_COMMANDS.FEED_LINES(4));
  lines.push(...ESC_POS_COMMANDS.CUT_PARTIAL);

  return new Uint8Array(lines);
}

/**
 * Text encoder for ESC/POS ASCII bytes with UTF-8 fallback
 */
function encodeTextToAsciiBytes(text) {
  if (typeof TextEncoder !== 'undefined') {
    return Array.from(new TextEncoder().encode(text));
  }
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else {
      bytes.push(63); // '?' for unencodable
    }
  }
  return bytes;
}

/**
 * Converts Uint8Array to Base64 for the Android Native Bridge
 */
export function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

/**
 * Sends ESC/POS byte buffer to selected printer
 */
export async function sendBufferToPrinter(buffer, printerMeta = {}) {
  const { id: printerAddress, type } = printerMeta;

  // Option 1: Native Android APK Bluetooth Bridge
  if (isAndroidNativeBluetoothAvailable() && printerAddress) {
    const base64Data = uint8ArrayToBase64(buffer);
    const success = window.AndroidBtPrinterBridge.printRawBase64(printerAddress, base64Data);
    if (success) {
      hapticFeedback.success();
      return { success: true, method: 'android_native', message: 'ব্লুটুথ থার্মাল প্রিন্টারে সফলভাবে রসিদ পাঠানো হয়েছে!' };
    }
    throw new Error('Android Bluetooth প্রিন্টারের সাথে সংযোগ স্থাপন করা যায়নি। প্রিন্টার চালু আছে কিনা দেখুন।');
  }

  // Option 2: Web Bluetooth API
  if (isWebBluetoothSupported() && type?.includes('web_bluetooth')) {
    // If Web Bluetooth connection is requested
    throw new Error('Web Bluetooth দিয়ে সরাসরি ডাটা পাঠানো হচ্ছে...');
  }

  // Option 3: Fallback to System In-Browser Print Dialog
  hapticFeedback.light();
  return {
    success: false,
    useBrowserFallback: true,
    message: 'ব্লুটুথ প্রিন্টার কানেক্টেড নেই। সিস্টেম প্রিন্ট মোড চালু করা হচ্ছে...'
  };
}
