import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ygigujzrnghxtcwykhjo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWd1anpybmdoeHRjd3lraGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDUwMDUsImV4cCI6MjA1OTA4MTAwNX0.uFk-rN_sM7V679hYVl08R1j17uFjK50M5h7K6wR4vP8';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { receiptId } = req.query;

  if (!receiptId) {
    return res.status(400).json({ success: false, message: 'Receipt ID is required' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: dep } = await supabase
      .from('samity_deposits')
      .select('*')
      .eq('id', receiptId)
      .maybeSingle();

    const domain = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://somiti-360.vercel.app';
    const rcptNo = dep?.receipt_no || `RCPT-${receiptId}`;
    const shortCode = dep?.short_verification_code || `S360-${String(receiptId).slice(0, 6).toUpperCase()}`;

    return res.status(200).json({
      success: true,
      data: {
        receiptId,
        receiptNumber: rcptNo,
        shortVerificationCode: shortCode,
        verificationUrl: `${domain}/verify/receipt/${receiptId}?code=${shortCode}`,
        pdfFileName: `receipt-${rcptNo}.pdf`,
        status: dep?.approval_status || 'valid',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

