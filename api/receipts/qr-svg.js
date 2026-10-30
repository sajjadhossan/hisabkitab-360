import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ygigujzrnghxtcwykhjo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWd1anpybmdoeHRjd3lraGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDUwMDUsImV4cCI6MjA1OTA4MTAwNX0.uFk-rN_sM7V679hYVl08R1j17uFjK50M5h7K6wR4vP8';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { receiptId } = req.query;

  if (!receiptId) {
    return res.status(400).send('Receipt ID is required');
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: dep } = await supabase
      .from('samity_deposits')
      .select('*')
      .eq('id', receiptId)
      .maybeSingle();

    const domain = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://somiti-360.vercel.app';
    const shortCode = dep?.short_verification_code || `S360-${String(receiptId).slice(0, 6).toUpperCase()}`;
    const verificationUrl = `${domain}/verify/receipt/${encodeURIComponent(receiptId)}?code=${encodeURIComponent(shortCode)}`;

    // Generate lossless Scalable Vector Graphics string
    const svgString = await QRCode.toString(verificationUrl, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.status(200).send(svgString);
  } catch (err) {
    console.error('QR SVG error:', err);
    return res.status(500).send('Failed to generate QR SVG');
  }
}
