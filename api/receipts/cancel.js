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

  const { receiptId } = req.query;
  const { reason, cancelledBy } = req.body || {};

  if (!receiptId) {
    return res.status(400).json({ success: false, message: 'Receipt ID is required' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const cancelledAt = new Date().toISOString();

    // 1. Update in samity_deposits
    const { data: dep, error: depErr } = await supabase
      .from('samity_deposits')
      .update({
        approval_status: 'cancelled',
        cancellation_reason: reason || 'অফিস কর্তৃক বাতিলকৃত',
        cancelled_by: cancelledBy || 'অ্যাডমিন দপ্তর',
        cancelled_at: cancelledAt
      })
      .eq('id', receiptId)
      .select()
      .maybeSingle();

    // 2. Also update in documents table if tracked there
    await supabase
      .from('documents')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'বাতিলকৃত',
        cancelled_at: cancelledAt
      })
      .eq('id', receiptId);

    // 3. Write audit log
    await supabase.from('samity_audit_logs').insert({
      action: 'CANCEL_RECEIPT',
      target_id: receiptId,
      reason: reason || 'রসিদ বাতিলকরণ',
      performed_by: cancelledBy || 'Admin',
      created_at: cancelledAt
    });

    return res.status(200).json({
      success: true,
      message: 'রসিদটি সফলভাবে বাতিল করা হয়েছে।',
      data: {
        receiptId,
        status: 'cancelled',
        reason: reason || 'বাতিলকৃত',
        cancelledAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

