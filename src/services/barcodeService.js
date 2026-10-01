/**
 * Barcode & Dynamic Payment QR Generator Service
 * Generates Code128 Barcode SVGs and Dynamic bKash/Nagad Payment QR Codes
 */
import QRCode from 'qrcode';

// Code128 Table B patterns
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encodes text into Code128B bar widths
 */
export const encodeCode128B = (text) => {
  if (!text) return '';
  const clean = text.replace(/[^\x20-\x7E]/g, '');
  if (!clean) return '';

  let checksum = START_CODE_B;
  const indices = [START_CODE_B];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    indices.push(code);
    checksum += code * (i + 1);
  }

  const checkDigit = checksum % 103;
  indices.push(checkDigit);
  indices.push(STOP_CODE);

  let patternStr = '';
  for (const idx of indices) {
    patternStr += CODE128_PATTERNS[idx] || '';
  }

  return patternStr;
};

/**
 * Generates an SVG string for a Code128 Barcode
 */
export const generateBarcodeSVG = (text, options = {}) => {
  const pattern = encodeCode128B(text);
  if (!pattern) return '';

  const barWidth = options.barWidth || 2;
  const height = options.height || 50;
  const showText = options.showText !== undefined ? options.showText : true;
  const fontSize = options.fontSize || 12;

  let totalWidth = 0;
  for (let i = 0; i < pattern.length; i++) {
    totalWidth += parseInt(pattern[i], 10) * barWidth;
  }

  const quietZone = 10 * barWidth;
  const svgWidth = totalWidth + (quietZone * 2);
  const svgHeight = height + (showText ? fontSize + 8 : 4);

  let x = quietZone;
  let rects = '';
  let isBar = true;

  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10) * barWidth;
    if (isBar) {
      rects += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000000" />`;
    }
    x += width;
    isBar = !isBar;
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${height + fontSize + 2}" font-family="monospace, monospace" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="#000000">${text}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">${rects}${textElement}</svg>`;
};

/**
 * Generates a Dynamic bKash/Nagad Payment QR Code Data URL
 */
export const generatePaymentQrDataUrl = async ({
  merchantNumber,
  amount,
  reference,
  provider = 'bkash' // 'bkash' | 'nagad' | 'upay'
}) => {
  if (!merchantNumber) return null;

  let payload = '';
  const cleanPhone = merchantNumber.replace(/[^0-9]/g, '');

  if (provider === 'bkash') {
    // Official bKash Payment URL format
    payload = `https://shop.bkash.com/${cleanPhone}/payment?amount=${amount || 0}&reference=${encodeURIComponent(reference || 'Invoice')}`;
  } else if (provider === 'nagad') {
    payload = `nagad://payment?merchant=${cleanPhone}&amount=${amount || 0}&ref=${encodeURIComponent(reference || 'Memo')}`;
  } else {
    payload = `tel:${cleanPhone}`;
  }

  try {
    return await QRCode.toDataURL(payload, {
      width: 250,
      margin: 1,
      color: {
        dark: provider === 'bkash' ? '#e2136e' : provider === 'nagad' ? '#f7941d' : '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.warn('Payment QR generation error:', err);
    return null;
  }
};
