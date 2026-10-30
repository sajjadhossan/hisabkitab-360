import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ygigujzrnghxtcwykhjo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWd1anpybmdoeHRjd3lraGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDUwMDUsImV4cCI6MjA1OTA4MTAwNX0.uFk-rN_sM7V679hYVl08R1j17uFjK50M5h7K6wR4vP8';

const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateShortCode(receiptId, receiptNo) {
  const raw = String(receiptId || '') + '-' + String(receiptNo || '');
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash = hash & hash;
  }
  let code = '';
  let h = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += chars[h % chars.length];
    h = Math.floor(h / 32) + (raw.charCodeAt(i % raw.length) || 17) * 31;
  }
  return `S360-${code}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { receiptId } = req.query;
  const body = req.body || {};
  const token = body.token || req.query.token || `sec_${Date.now()}`;
  const receiptNo = body.receiptNo || req.query.receiptNo || `RCPT-${receiptId || '0001'}`;

  if (!receiptId) {
    return res.status(400).json({ success: false, message: 'Receipt ID is required' });
  }

  try {
    const domain = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://somiti-360.vercel.app';
    const shortCode = body.shortVerificationCode || generateShortCode(receiptId, receiptNo);
    const verificationUrl = `${domain}/verify/receipt/${encodeURIComponent(receiptId)}?token=${encodeURIComponent(token)}&code=${encodeURIComponent(shortCode)}`;

    // High contrast 400x400 PNG QR Data URL
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update in Supabase asynchronously if client is available
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      await supabase
        .from('samity_deposits')
        .update({
          short_verification_code: shortCode,
          qr_generated_at: new Date().toISOString()
        })
        .eq('id', receiptId);
    } catch (_) {}

    return res.status(200).json({
      success: true,
      data: {
        receiptId,
        receiptNumber: receiptNo,
        shortVerificationCode: shortCode,
        verificationUrl,
        qrImageUrl: `${domain}/api/receipts/${encodeURIComponent(receiptId)}/qr.png`,
        qrSvgUrl: `${domain}/api/receipts/${encodeURIComponent(receiptId)}/qr.svg`,
        qrDataUrl,
        status: 'valid'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

