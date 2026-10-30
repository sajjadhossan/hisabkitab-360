import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ygigujzrnghxtcwykhjo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWd1anpybmdoeHRjd3lraGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDUwMDUsImV4cCI6MjA1OTA4MTAwNX0.uFk-rN_sM7V679hYVl08R1j17uFjK50M5h7K6wR4vP8';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { documentType, documentId, token, code } = req.query;
  const isCodeLookup = documentType === 'code' || !!code;
  const lookupIdentifier = (code || documentId || '').trim();

  if (!lookupIdentifier) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    return res.status(400).json({
      success: false,
      errorCode: 'MISSING_IDENTIFIER',
      message: 'ভেরিফিকেশন কোড বা ডকুমেন্ট আইডি প্রদান করা বাধ্যতামূলক।'
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    let doc = null;

    // 1. If lookup is by short code (e.g. S360-XXXXXX)
    if (isCodeLookup) {
      // Check documents table
      const { data: d1 } = await supabase
        .from('documents')
        .select('*')
        .or(`short_verification_code.eq.${lookupIdentifier},document_number.eq.${lookupIdentifier}`)
        .maybeSingle();

      if (d1) {
        doc = d1;
      } else {
        // Check samity_deposits table
        const { data: dep } = await supabase
          .from('samity_deposits')
          .select('*')
          .or(`short_verification_code.eq.${lookupIdentifier},receipt_no.eq.${lookupIdentifier},voucher_no.eq.${lookupIdentifier}`)
          .maybeSingle();

        if (dep) {
          doc = {
            id: dep.id,
            document_number: dep.receipt_no || dep.voucher_no || `RCPT-${dep.id}`,
            document_type: 'receipt',
            title: 'জমার রসিদ (Money Receipt)',
            samity_id: dep.samity_id,
            recipient_name: dep.member_name || dep.depositor_name || 'সদস্য',
            amount: dep.amount,
            status: dep.approval_status === 'cancelled' ? 'cancelled' : 'valid',
            issue_date: dep.deposit_date,
            cancellation_reason: dep.cancellation_reason || null,
            cancelled_at: dep.cancelled_at || null,
            metadata: {
              shortVerificationCode: dep.short_verification_code || lookupIdentifier,
              paymentMonth: dep.payment_month || '',
              paymentYear: dep.payment_year || '',
              depositType: dep.deposit_type || 'মাসিক সঞ্চয়/চাঁদা',
              depositMethod: dep.deposit_method || 'নগদ'
            }
          };
        }
      }
    } else {
      // 2. Lookup by documentId (or document_number)
      const { data: d1 } = await supabase
        .from('documents')
        .select('*')
        .or(`id.eq.${lookupIdentifier},document_number.eq.${lookupIdentifier}`)
        .maybeSingle();

      if (d1) {
        doc = d1;
      } else {
        const { data: dep } = await supabase
          .from('samity_deposits')
          .select('*')
          .or(`id.eq.${lookupIdentifier},receipt_no.eq.${lookupIdentifier}`)
          .maybeSingle();

        if (dep) {
          doc = {
            id: dep.id,
            document_number: dep.receipt_no || dep.voucher_no || `RCPT-${dep.id}`,
            document_type: 'receipt',
            title: 'জমার রসিদ (Money Receipt)',
            samity_id: dep.samity_id,
            recipient_name: dep.member_name || dep.depositor_name || 'সদস্য',
            amount: dep.amount,
            status: dep.approval_status === 'cancelled' ? 'cancelled' : 'valid',
            issue_date: dep.deposit_date,
            cancellation_reason: dep.cancellation_reason || null,
            cancelled_at: dep.cancelled_at || null,
            metadata: {
              shortVerificationCode: dep.short_verification_code || `S360-${(dep.id || '000000').slice(0, 6).toUpperCase()}`,
              paymentMonth: dep.payment_month || '',
              paymentYear: dep.payment_year || '',
              depositType: dep.deposit_type || 'মাসিক সঞ্চয়/চাঁদা',
              depositMethod: dep.deposit_method || 'নগদ'
            }
          };
        }
      }
    }

    if (!doc) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
      return res.status(404).json({
        success: false,
        isValid: false,
        status: 'not_found',
        message: 'প্রদত্ত কোড বা আইডি দিয়ে কোনো রেকর্ড কেন্দ্রীয় ক্লাউড ডাটাবেজে পাওয়া যায়নি।'
      });
    }

    const isCancelled = doc.status === 'cancelled';
    const isExpired = doc.status === 'expired';

    // Set dynamic cache headers:
    // If document is cancelled or expired, NEVER cache it anywhere (prevent stale validation)
    // If document is active & valid, use safe micro-cache of 30 seconds
    if (isCancelled || isExpired) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=30');
      res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=30, stale-while-revalidate=30');
    }

    // Log verification attempt
    try {
      await supabase.from('document_verifications').insert({
        document_id: doc.id,
        document_number: doc.document_number,
        verification_status: isCancelled ? 'cancelled' : 'valid',
        ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        verified_at: new Date().toISOString()
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      isValid: !isCancelled && !isExpired,
      status: doc.status || 'valid',
      data: {
        documentId: doc.id,
        documentNumber: doc.document_number,
        documentType: doc.document_type || documentType || 'receipt',
        shortVerificationCode: doc.short_verification_code || doc.metadata?.shortVerificationCode || lookupIdentifier,
        title: doc.title || 'জমার রসিদ (Money Receipt)',
        samityId: doc.samity_id,
        samityName: doc.metadata?.samityName || 'স্বপ্নছোঁয়া সমবায় সমিতি',
        issueDate: doc.issue_date,
        recipientName: doc.recipient_name,
        amount: doc.amount,
        currency: doc.currency || 'BDT',
        status: doc.status,
        cancellationReason: doc.cancellation_reason || null,
        cancelledAt: doc.cancelled_at || null,
        metadata: doc.metadata || {},
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Verify API error:', err);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    return res.status(500).json({
      success: false,
      message: 'Server verification error',
      error: err.message
    });
  }
}
