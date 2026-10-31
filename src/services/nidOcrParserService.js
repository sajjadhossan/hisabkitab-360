/**
 * Smart Bangla NID OCR Parser Service
 * Optimized for Bangladesh National ID Cards:
 * - Smart NID (10 digits)
 * - Old Paper Laminated NID (13 & 17 digits)
 * - Front Side: Name (Bn), Name (En), Father, Mother, Date of Birth, NID No.
 * - Back Side: Address, Blood Group, Issue Date.
 */

import { performImageOCR } from './bioDataDocumentParser';

const BENGALI_MONTHS = {
  'জানু': '01', 'জানুয়ারি': '01', 'ফেব্রু': '02', 'ফেব্রুয়ারি': '02',
  'মার্চ': '03', 'এপ্রিল': '04', 'মে': '05', 'জুন': '06',
  'জুলাই': '07', 'আগস্ট': '08', 'সেপ্টে': '09', 'সেপ্টেম্বর': '09',
  'অক্টো': '10', 'অক্টোবর': '10', 'নভে': '11', 'নভেম্বর': '11', 'ডিসে': '12', 'ডিসেম্বর': '12'
};

const ENGLISH_MONTHS = {
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
  'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
};

/**
 * Preprocess image on HTML canvas to boost OCR contrast (Grayscale + Adaptive Thresholding)
 */
export async function preprocessNidImage(imageBlobOrFile) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return imageBlobOrFile;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlobOrFile);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        // High-contrast grayscale conversion
        for (let i = 0; i < d.length; i += 4) {
          const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Simple dynamic thresholding
          const val = avg > 115 ? Math.min(255, avg * 1.15) : Math.max(0, avg * 0.85);
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob || imageBlobOrFile);
        }, 'image/jpeg', 0.92);
      } catch {
        resolve(imageBlobOrFile);
      }
    };
    img.onerror = () => resolve(imageBlobOrFile);
    img.src = url;
  });
}

/**
 * Normalizes Date to YYYY-MM-DD
 */
export function normalizeDateOfBirth(rawStr) {
  if (!rawStr) return '';
  const s = rawStr.trim();

  // Pattern: 15 Oct 1990 or 15 October 1990
  const engTextMatch = s.match(/([0-9]{1,2})\s+([a-zA-Z]{3,9})\s+([0-9]{4})/);
  if (engTextMatch) {
    const day = engTextMatch[1].padStart(2, '0');
    const monKey = engTextMatch[2].slice(0, 3).toLowerCase();
    const month = ENGLISH_MONTHS[monKey] || '01';
    const year = engTextMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = s.match(/([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern: YYYY-MM-DD
  const isoMatch = s.match(/([0-9]{4})[-/.]([0-9]{1,2})[-/.]([0-9]{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  return rawStr;
}

/**
 * Parses raw text extracted from Smart NID front and back images
 */
export function parseBanglaNidRawText(rawText) {
  if (!rawText) return {};
  const text = rawText.replace(/\r/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {
    nameBn: '',
    nameEn: '',
    fatherName: '',
    motherName: '',
    nidNumber: '',
    dateOfBirth: '',
    bloodGroup: '',
    address: '',
    rawExtracted: text
  };

  // 1. Extract NID Number (10 digit smart NID, 13 or 17 digit)
  const nidRegex = /(?:ID\s*NO|NID\s*NO|National\s*ID|আইডি\s*নং|এনআইডি)[:\s\-]*([0-9]{10,17})/i;
  const nidMatch = text.match(nidRegex) || text.match(/\b([0-9]{10}|[0-9]{13}|[0-9]{17})\b/);
  if (nidMatch) {
    result.nidNumber = nidMatch[1] || nidMatch[0];
  }

  // 2. Extract Date of Birth
  const dobRegex = /(?:Date\s*of\s*Birth|জন্ম\s*তারিখ|DOB)[:\s\-]*([^\n]+)/i;
  const dobMatch = text.match(dobRegex);
  if (dobMatch) {
    result.dateOfBirth = normalizeDateOfBirth(dobMatch[1]);
  } else {
    // Search any line with Date pattern
    const fallbackDob = text.match(/\b([0-9]{1,2}\s+[a-zA-Z]{3}\s+[0-9]{4})\b/) ||
                        text.match(/\b([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{4})\b/);
    if (fallbackDob) {
      result.dateOfBirth = normalizeDateOfBirth(fallbackDob[1]);
    }
  }

  // 3. Extract Blood Group
  const bloodMatch = text.match(/(?:Blood\s*Group|রক্তের\s*গ্রুপ)[:\s\-]*([ABO+-]{1,3})/i) ||
                     text.match(/\b(A|B|AB|O)[+-]\b/i);
  if (bloodMatch) {
    result.bloodGroup = (bloodMatch[1] || bloodMatch[0]).toUpperCase();
  }

  // 4. Extract Names by Line Scan
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bengali Name
    if (/^নাম[:\s]/i.test(line) || (!result.nameBn && line.startsWith('নাম'))) {
      const val = line.replace(/^নাম[:\s]*/i, '').trim();
      if (/[\u0980-\u09FF]/.test(val)) result.nameBn = val;
    }

    // English Name
    if (/^Name[:\s]/i.test(line)) {
      result.nameEn = line.replace(/^Name[:\s]*/i, '').trim();
    }

    // Father's Name
    if (/^পিতা[:\s]/i.test(line)) {
      result.fatherName = line.replace(/^পিতা[:\s]*/i, '').trim();
    }

    // Mother's Name
    if (/^মাতা[:\s]/i.test(line)) {
      result.motherName = line.replace(/^মাতা[:\s]*/i, '').trim();
    }

    // Address (on back side)
    if (/^(?:ঠিকানা|বাসা|গ্রাম|ডাকঘর)[:\s]/i.test(line) || line.includes('বাসা/হোল্ডিং') || line.includes('ডাকঘর')) {
      if (!result.address) {
        result.address = line.replace(/^ঠিকানা[:\s]*/i, '').trim();
      } else {
        result.address += ', ' + line;
      }
    }
  }

  // Fallback: If names were on next lines after labels
  if (!result.nameEn) {
    const nameEnIdx = lines.findIndex(l => /^Name$/i.test(l));
    if (nameEnIdx !== -1 && lines[nameEnIdx + 1]) {
      result.nameEn = lines[nameEnIdx + 1];
    }
  }

  return result;
}

/**
 * Full Pipeline: Preprocess Image -> Run OCR -> Parse Smart NID Fields
 */
export async function scanSmartNidImage(imageFileOrBlob, onProgress = () => {}) {
  onProgress({ step: 'preprocess', progress: 0.15, message: 'ছবির কন্ট্রাস্ট ও লাইটিং অপ্টিমাইজ হচ্ছে...' });
  const preprocessed = await preprocessNidImage(imageFileOrBlob);

  onProgress({ step: 'ocr', progress: 0.4, message: 'বাংলা ও ইংরেজি টেক্সট ওসিআর বিশ্লেষণ চলছে...' });
  const rawText = await performImageOCR(preprocessed, (p) => {
    onProgress({ step: 'ocr', progress: 0.4 + (p.progress * 0.4), message: p.message });
  });

  onProgress({ step: 'parsing', progress: 0.9, message: 'এনআইডি কার্ডের তথ্য (নাম, আইডি, জন্মতারিখ) বিন্যাস করা হচ্ছে...' });
  const parsedData = parseBanglaNidRawText(rawText);

  onProgress({ step: 'complete', progress: 1.0, message: 'এনআইডি স্ক্যান সফল হয়েছে!' });
  return parsedData;
}
