/**
 * Bio-Data Document & Image Ingestion Parser
 * Supports:
 * 1. PDF Documents (.pdf) - Extracts text streams, font mappings, and metadata directly in-browser
 * 2. Pictures & Images (.png, .jpg, .jpeg, .webp) - Optical Character Recognition (OCR) via native TextDetector or Tesseract.js
 * 3. Raw Text files (.txt)
 */

// Helper to decompress Flate/Deflate PDF streams using browser native DecompressionStream
async function decompressDeflateStream(bytes) {
  if (typeof DecompressionStream === 'undefined') return bytes;
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const arrayBuf = await new Response(ds.readable).arrayBuffer();
    return new Uint8Array(arrayBuf);
  } catch {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const arrayBuf = await new Response(ds.readable).arrayBuffer();
      return new Uint8Array(arrayBuf);
    } catch {
      return bytes;
    }
  }
}

/**
 * Extract text from a PDF ArrayBuffer
 */
export async function extractTextFromPDFBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder('utf-8', { fatal: false });
  const rawString = textDecoder.decode(bytes);

  let extractedLines = [];

  // 1. Find all stream ... endstream blocks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(rawString)) !== null) {
    const streamContent = match[1];

    // Try extracting directly if uncompressed text operators exist
    if (streamContent.includes('BT') && streamContent.includes('ET')) {
      const extracted = parsePDFTextOperators(streamContent);
      if (extracted.length > 0) extractedLines.push(...extracted);
    }

    // Try decompressing binary chunk
    try {
      const streamStart = match.index + match[0].indexOf('\n') + 1;
      const streamEnd = match.index + match[0].lastIndexOf('endstream');
      if (streamEnd > streamStart) {
        const streamBytes = bytes.slice(streamStart, streamEnd);
        const decompressed = await decompressDeflateStream(streamBytes);
        const decompString = textDecoder.decode(decompressed);
        if (decompString.includes('BT') && decompString.includes('ET')) {
          const extracted = parsePDFTextOperators(decompString);
          if (extracted.length > 0) extractedLines.push(...extracted);
        }
      }
    } catch (e) {
      // Ignore individual stream decompress errors
    }
  }

  // 2. Also inspect general metadata fields in PDF
  const titleMatch = rawString.match(/\/Title\s*\(([^)]+)\)/i);
  if (titleMatch) extractedLines.push(titleMatch[1]);
  const authorMatch = rawString.match(/\/Author\s*\(([^)]+)\)/i);
  if (authorMatch) extractedLines.push(authorMatch[1]);
  const subjectMatch = rawString.match(/\/Subject\s*\(([^)]+)\)/i);
  if (subjectMatch) extractedLines.push(subjectMatch[1]);

  // If no structured operators found, extract printable text sequences
  if (extractedLines.length === 0) {
    const rawMatches = rawString.match(/\(([^()]{3,})\)/g);
    if (rawMatches) {
      extractedLines = rawMatches
        .map(s => s.slice(1, -1))
        .filter(s => /[a-zA-Z0-9\u0980-\u09FF]/.test(s));
    }
  }

  return cleanAndNormalizeExtractedText(extractedLines.join('\n'));
}

/**
 * Parse PDF text operators inside BT ... ET blocks
 */
function parsePDFTextOperators(content) {
  const lines = [];
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let btMatch;

  while ((btMatch = btEtRegex.exec(content)) !== null) {
    const block = btMatch[1];

    // Matches Tj (single string)
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    let currentLine = '';
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      currentLine += tjMatch[1] + ' ';
    }

    // Matches TJ (array of strings and kerning offsets)
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrMatch;
    while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
      const arrContent = arrMatch[1];
      const strParts = arrContent.match(/\(([^)]*)\)/g);
      if (strParts) {
        currentLine += strParts.map(s => s.slice(1, -1)).join('') + ' ';
      }
    }

    // Hex strings: <00410042> Tj
    const hexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
    let hexMatch;
    while ((hexMatch = hexTjRegex.exec(block)) !== null) {
      const hex = hexMatch[1];
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      currentLine += decoded + ' ';
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
  }

  return lines;
}

/**
 * Clean up escape sequences and normalize text
 */
function cleanAndNormalizeExtractedText(text) {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\([()])/g, '$1')
    .replace(/\\([0-7]{3})/g, (m, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Perform Client-Side Optical Character Recognition (OCR) on an Image
 */
export async function performImageOCR(imageFileOrBlob, onProgress = () => {}) {
  // 1. Try Native Shape Detection TextDetector API (supported on Chrome & Android)
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      onProgress({ status: 'native_ocr', progress: 0.3, message: 'ডিভাইস হার্ডওয়্যার ওসিআর দিয়ে স্ক্যান হচ্ছে...' });
      const detector = new window.TextDetector();
      const bitmap = await createImageBitmap(imageFileOrBlob);
      const results = await detector.detect(bitmap);
      if (results && results.length > 0) {
        const text = results.map(r => r.rawValue).join('\n');
        if (text && text.trim().length > 10) {
          onProgress({ status: 'done', progress: 1, message: 'টেক্সট শনাক্তকরণ সফল হয়েছে' });
          return text;
        }
      }
    } catch (e) {
      console.warn('Native TextDetector fallback:', e);
    }
  }

  // 2. Load Tesseract.js dynamically
  if (typeof window !== 'undefined') {
    if (!window.Tesseract) {
      onProgress({ status: 'loading_engine', progress: 0.25, message: 'স্মার্ট ওসিআর ইঞ্জিন চালু করা হচ্ছে...' });
      await new Promise((resolve, reject) => {
        // Check if already in DOM
        const existing = document.getElementById('tesseract-cdn-script');
        if (existing) {
          existing.addEventListener('load', resolve);
          existing.addEventListener('error', reject);
          return;
        }

        const script = document.createElement('script');
        script.id = 'tesseract-cdn-script';
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Tesseract script could not be loaded'));
        document.head.appendChild(script);
      });
    }

    if (window.Tesseract) {
      onProgress({ status: 'recognizing', progress: 0.45, message: 'ছবি থেকে বাংলা ও ইংরেজি টেক্সট পড়া হচ্ছে...' });
      const worker = await window.Tesseract.createWorker(['ben', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && m.progress) {
            onProgress({
              status: 'recognizing',
              progress: 0.45 + (m.progress * 0.5),
              message: `স্ক্যানিং চলছে: ${Math.round(m.progress * 100)}%`
            });
          }
        }
      });

      const res = await worker.recognize(imageFileOrBlob);
      await worker.terminate();

      onProgress({ status: 'done', progress: 1, message: 'টেক্সট তৈরি সম্পন্ন!' });
      return res.data?.text || '';
    }
  }

  throw new Error('আপনার ব্রাউজার বা ডিভাইসে ওসিআর সমর্থন করে না। সরাসরি টেক্সট পেস্ট করুন।');
}

/**
 * Universal Bio-Data File Reader (PDF, Image, or Text)
 */
export async function parseBioDataFile(file, onProgress = () => {}) {
  if (!file) return { text: '', previewUrl: '' };

  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp)$/i.test(file.name);
  const isText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

  let previewUrl = '';
  if (isImage) {
    previewUrl = URL.createObjectURL(file);
  }

  if (isPDF) {
    onProgress({ status: 'reading_pdf', progress: 0.2, message: 'পিডিএফ ফাইল পড়া হচ্ছে...' });
    const arrayBuffer = await file.arrayBuffer();
    onProgress({ status: 'extracting_pdf', progress: 0.6, message: 'পিডিএফ থেকে টেক্সট ডেটা বের করা হচ্ছে...' });
    const text = await extractTextFromPDFBuffer(arrayBuffer);
    onProgress({ status: 'done', progress: 1, message: 'পিডিএফ বিশ্লেষণ সম্পন্ন!' });
    return { text, previewUrl: '', fileType: 'pdf', fileName: file.name };
  }

  if (isImage) {
    onProgress({ status: 'starting_ocr', progress: 0.1, message: 'ছবি প্রসেস করা হচ্ছে...' });
    const text = await performImageOCR(file, onProgress);
    return { text, previewUrl, fileType: 'image', fileName: file.name };
  }

  if (isText) {
    onProgress({ status: 'reading_text', progress: 0.5, message: 'টেক্সট ফাইল পড়া হচ্ছে...' });
    const text = await file.text();
    onProgress({ status: 'done', progress: 1, message: 'টেক্সট ফাইল সফলভাবে পড়া হয়েছে!' });
    return { text, previewUrl: '', fileType: 'text', fileName: file.name };
  }

  throw new Error('অসমর্থিত ফাইল ফরম্যাট। শুধুমাত্র PDF, JPG, PNG বা TXT ফাইল আপলোড করুন।');
}
