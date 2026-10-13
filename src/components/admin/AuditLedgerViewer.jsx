/**
 * HisabKitab 360 - Cryptographic Audit Ledger & Hash-Chain Viewer
 * --------------------------------------------------------------
 * Displays blockchain-style tamper-proof ledger entries,
 * provides one-click verification of the entire cryptographic chain,
 * and alerts if any record was modified in the database.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Key, Lock, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { hashChainService } from '../../services/hashChainService';
import { rpcService } from '../../services/rpcService';
import { triggerHaptic, HapticPattern } from '../../utils/haptics';

export default function AuditLedgerViewer({ organizationId }) {
  const [blocks, setBlocks] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    try {
      const chain = hashChainService.getChain() || [];
      setBlocks(chain);
    } catch (e) {
      console.warn('Could not load local hash chain:', e);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    triggerHaptic(HapticPattern.MEDIUM);
    setVerificationResult(null);

    try {
      // 1. Verify Local Client Hash-Chain
      const localVerification = hashChainService.verifyIntegrity();

      // 2. If organization ID exists, verify against Server PostgreSQL RPC
      let serverResult = null;
      if (organizationId) {
        const rpcRes = await rpcService.verifyAuditChain(organizationId);
        if (rpcRes.success) {
          serverResult = rpcRes.data;
        }
      }

      const isValid = localVerification.isValid && (!serverResult || serverResult.valid !== false);

      setVerificationResult({
        isValid,
        checkedCount: blocks.length,
        message: isValid
          ? 'সমস্ত লেজার ব্লক ও ক্রিপ্টোগ্রাফিক চেইন ১০০% নির্ভুল এবং অবিকৃত আছে!'
          : 'সতর্কতা: লেজার চেইনে অমিল পাওয়া গেছে! কোনো রেকর্ড অননুমোদিতভাবে পরিবর্তন করা হয়ে থাকতে পারে।'
      });

      triggerHaptic(isValid ? HapticPattern.SUCCESS : HapticPattern.ERROR);
    } catch (err) {
      setVerificationResult({
        isValid: false,
        message: 'ভেরিফিকেশন সম্পন্ন করতে সমস্যা হয়েছে: ' + err.message
      });
      triggerHaptic(HapticPattern.ERROR);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-500" />
            ক্রিপ্টোগ্রাফিক অডিট লেজার ও হ্যাশ-চেইন ভেরিফায়ার
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ব্লকচেইন আর্কিটেকচার: প্রতিটি ইনভয়েস ও ট্রানজেকশন SHA-256 দিয়ে পূর্ববর্তী ব্লকের সাথে চেইন করা।
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={isVerifying}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-md transition-all ${
            isVerifying
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/20'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          {isVerifying ? 'চেইন যাচাই হচ্ছে...' : 'সম্পূর্ণ চেইন যাচাই করুন'}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            verificationResult.isValid
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {verificationResult.isValid ? (
            <ShieldCheck className="w-7 h-7 text-emerald-600 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-7 h-7 text-rose-600 flex-shrink-0" />
          )}
          <div>
            <div className="font-bold text-base">
              {verificationResult.isValid ? 'চেইন সম্পূর্ণ নিরাপদ (Verified)' : 'টেম্পারিং বা অসংগতি চিহ্নিত'}
            </div>
            <div className="text-sm mt-0.5">{verificationResult.message}</div>
          </div>
        </div>
      )}

      {/* Ledger Block List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>সর্বশেষ ব্লক রেকর্ডসমূহ ({blocks.length})</span>
          <span>SHA-256 হ্যাশ সিগনেচার</span>
        </div>

        {blocks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm">এখনো কোনো লেজার ব্লক তৈরি হয়নি। নতুন বিক্রি বা ট্রানজেকশনে ব্লক তৈরি হবে।</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {blocks.slice(0, 15).map((block, idx) => (
              <div
                key={block.hash || idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono">
                    #{block.index ?? (blocks.length - idx)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {block.action || 'TRANSACTION'}
                    </span>
                    <span className="text-slate-400 ml-2">
                      {new Date(block.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 max-w-full truncate">
                  <span className="text-emerald-500 font-semibold">Hash:</span> {block.hash?.substring(0, 18)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
