import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ygigujzrnghxtcwykhjo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWd1anpybmdoeHRjd3lraGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDUwMDUsImV4cCI6MjA1OTA4MTAwNX0.uFk-rN_sM7V679hYVl08R1j17uFjK50M5h7K6wR4vP8';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const documentType = req.query.documentType || req.body?.documentType;
  const documentId = req.query.documentId || req.body?.documentId;
  const reason = req.body?.reason || 'কর্তৃপক্ষ কর্তৃক বাতিলকৃত';
  const cancelledBy = req.body?.cancelledBy || 'Admin';

  if (!documentId) {
    return res.status(400).json({ success: false, message: 'Document ID is required' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        updated_at: new Date().toISOString()
      })
      .or(`id.eq.${documentId},document_number.eq.${documentId}`)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'ডকুমেন্ট সফলভাবে বাতিল করা হয়েছে।',
      document: data
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

