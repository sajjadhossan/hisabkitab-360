/**
 * HisabKitab 360 - Phase 1 Automation & Real-Time Payment Control Hub
 * -------------------------------------------------------------------
 * Interactive Command Center for testing and managing all Phase 1 capabilities:
 * 1. bKash / Nagad / Rocket Webhook Real-time Settlement
 * 2. Automated WhatsApp & SMS Dispatcher
 * 3. Edge Scheduled Nightly Executive Summary
 * 4. Interoperable Dynamic Bangla QR Generator
 * 5. Smart Soundbox Voice Announcements
 * 6. Automated Supplier Purchase Requisition (Low-Stock Auto Re-order)
 * 7. End-of-Day Payment Reconciliation Engine
 * 8. Multi-Printer Routing Center
 */

import React, { useState } from 'react';
import {
  Zap,
  QrCode,
  Volume2,
  Send,
  Calendar,
  Package,
  Scale,
  Printer,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { mfsWebhookService } from '../../services/mfsWebhookService';
import { banglaQrService } from '../../services/banglaQrService';
import { soundboxService } from '../../services/soundboxService';
import { automatedMessagingGateway } from '../../services/automatedMessagingGateway';
import { edgeScheduledJobService } from '../../services/edgeScheduledJobService';
import { autoPurchaseOrderService } from '../../services/autoPurchaseOrderService';
import { paymentReconciliationService } from '../../services/paymentReconciliationService';
import { printerRoutingService, PrinterTarget } from '../../services/printerRoutingService';
import { triggerHaptic, HapticPattern } from '../../utils/haptics';

export default function Phase1AutomationHub({ products = [], salesHistory = [], businessSettings = {} }) {
  // 1. MFS Webhook State
  const [mfsGateway, setMfsGateway] = useState('bkash');
  const [mfsAmount, setMfsAmount] = useState('1250');
  const [mfsInvoice, setMfsInvoice] = useState('INV-261013-001');
  const [mfsResult, setMfsResult] = useState(null);

  // 2. Bangla QR State
  const [qrAmount, setQrAmount] = useState('500');
  const [qrPayload, setQrPayload] = useState('');

  // 3. Auto Reorder State
  const [reorderResult, setReorderResult] = useState(null);

  // 4. Payment Reconciliation State
  const [reconCashCount, setReconCashCount] = useState('15000');
  const [reconMfsCount, setReconMfsCount] = useState('8500');
  const [reconResult, setReconResult] = useState(null);

  // 5. Nightly Summary State
  const [nightlyResult, setNightlyResult] = useState(null);

  // Handlers
  const handleSimulateWebhook = () => {
    triggerHaptic(HapticPattern.MEDIUM);
    const res = mfsWebhookService.processPaymentWebhook({
      gateway: mfsGateway,
      trxId: `TRX_${Date.now().toString().slice(-6)}`,
      amount: Number(mfsAmount) || 0,
      invoiceNo: mfsInvoice,
      customerPhone: '01700000000'
    });
    setMfsResult(res);
  };

  const handleGenerateBanglaQr = () => {
    triggerHaptic(HapticPattern.LIGHT);
    const payload = banglaQrService.generateBanglaQrPayload({
      merchantName: businessSettings.companyName || 'হিসাবকিতাব ৩৬০ মার্চেন্ট',
      merchantCity: 'Dhaka',
      merchantAccount: '01711000000',
      amount: Number(qrAmount) || 0,
      invoiceNo: 'INV-DEMO'
    });
    setQrPayload(payload);
  };

  const handleTestSoundbox = () => {
    triggerHaptic(HapticPattern.SUCCESS);
    soundboxService.announceSalePayment(Number(mfsAmount) || 500, mfsGateway);
  };

  const handleScanAutoReorder = () => {
    triggerHaptic(HapticPattern.MEDIUM);
    const result = autoPurchaseOrderService.generateReplenishmentOrders(products);
    setReorderResult(result);
  };

  const handleRunReconciliation = () => {
    triggerHaptic(HapticPattern.HEAVY);
    const result = paymentReconciliationService.reconcileDailyPayments({
      salesHistory,
      physicalCashCount: Number(reconCashCount) || 0,
      reportedMfs: Number(reconMfsCount) || 0,
      reportedCard: 0
    });
    setReconResult(result);
  };

  const handleRunNightlySummary = async () => {
    triggerHaptic(HapticPattern.LIGHT);
    const result = await edgeScheduledJobService.generateDailyExecutiveSummary();
    setNightlyResult(result);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white uppercase tracking-wider">
              স্মার্ট অটোমেশন হাব
            </span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              রিয়েল-টাইম অটোমেশন ও পেমেন্ট ইকোসিস্টেম হাব
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            MFS Webhook, বাংলা QR, স্মার্ট সাউন্ডবক্স, অটো-রিঅর্ডার এবং অটোমেটেড রিকনসিলিয়েশন কন্ট্রোল সেন্টার।
          </p>
        </div>
      </div>

      {/* Grid of Automation Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: bKash/Nagad Webhook Simulator */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <Zap className="w-5 h-5 text-rose-500" />
              bKash / Nagad লাইভ Webhook সিমুলেটর
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Active Listener
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">গেটওয়ে</label>
              <select
                value={mfsGateway}
                onChange={(e) => setMfsGateway(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
              >
                <option value="bkash">bKash Merchant</option>
                <option value="nagad">Nagad Wallet</option>
                <option value="rocket">Rocket Pay</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">টাকার পরিমাণ (৳)</label>
              <input
                type="number"
                value={mfsAmount}
                onChange={(e) => setMfsAmount(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSimulateWebhook}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all active:scale-95"
            >
              <Play className="w-4 h-4" /> Webhook ফায়ার ও অটো-সেটেলমেন্ট
            </button>
            <button
              onClick={handleTestSoundbox}
              className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-300 transition-colors"
              title="সাউন্ডবক্স ভয়েস টেস্ট"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {mfsResult && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{mfsResult.message} (TrxID: {mfsResult.trxId})</span>
            </div>
          )}
        </div>

        {/* Tool 2: Bangla QR Standard Generator */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <QrCode className="w-5 h-5 text-indigo-500" />
              বাংলাদেশ ব্যাংক ইন্টারঅপারেবল বাংলা QR
            </h3>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              EMVCo Standard
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">বিল/চালান অ্যামাউন্ট (৳)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={qrAmount}
                onChange={(e) => setQrAmount(e.target.value)}
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
              />
              <button
                onClick={handleGenerateBanglaQr}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
              >
                QR পেলোড তৈরি
              </button>
            </div>
          </div>

          {qrPayload && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono break-all text-slate-600 dark:text-slate-300">
              <span className="font-bold text-indigo-500">Bangla QR Payload:</span> {qrPayload}
            </div>
          )}
        </div>

        {/* Tool 3: Automated Supplier Purchase Requisition */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <Package className="w-5 h-5 text-amber-500" />
              ঘাটতি পণ্য অটো-রিঅর্ডার ইঞ্জিন (PO Auto-Gen)
            </h3>
            <button
              onClick={handleScanAutoReorder}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all"
            >
              স্টক স্ক্যান করুন
            </button>
          </div>

          {reorderResult ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                ঘাটতি পণ্য পাওয়া গেছে: <strong>{reorderResult.totalLowStockItems}</strong> টি।
                জেনারেট করা ড্রাফট অর্ডার: <strong>{reorderResult.ordersGenerated}</strong> টি।
              </div>
              {reorderResult.orders.map(po => (
                <div key={po.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{po.supplier}</div>
                    <div className="text-[10px] text-slate-400">{po.itemCount} টি পণ্য | {po.id}</div>
                  </div>
                  <div className="font-black text-amber-600">৳{po.totalAmount.toLocaleString('bn-BD')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              "স্টক স্ক্যান করুন" চাপলে ন্যূনতম স্টকের নিচে থাকা পণ্যের ড্রাফট পারচেজ অর্ডার তৈরি হবে।
            </p>
          )}
        </div>

        {/* Tool 4: Payment Reconciliation Engine */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <Scale className="w-5 h-5 text-teal-500" />
              দৈনিক ক্যাশ ও পেমেন্ট রিকনসিলিয়েশন
            </h3>
            <button
              onClick={handleRunReconciliation}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
            >
              হিসাব মেলান
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">ড্রয়ারের ক্যাশ (৳)</label>
              <input
                type="number"
                value={reconCashCount}
                onChange={(e) => setReconCashCount(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:white font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">MFS ব্যালেন্স (৳)</label>
              <input
                type="number"
                value={reconMfsCount}
                onChange={(e) => setReconMfsCount(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:white font-bold"
              />
            </div>
          </div>

          {reconResult && (
            <div className={`p-3 rounded-xl border text-xs ${
              reconResult.discrepancies.isBalanced
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
            }`}>
              <div className="font-bold">
                স্ট্যাটাস: {reconResult.discrepancies.isBalanced ? '✅ হিসাব ১০০% মিলেছে' : `⚠️ গরমিল: ৳${reconResult.discrepancies.total}`}
              </div>
              <div className="text-[11px] mt-1 text-slate-500">
                সিস্টেম বিক্রি: ৳{reconResult.systemTotals.totalRevenue} | ড্রয়ারে গণনা: ৳{reconResult.actualTotals.physicalCash}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer: Printer Router & Nightly Summary */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Printer className="w-5 h-5 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            মাল্টি-প্রিন্টার রাউটিং: কাউন্টার (80mm) | গোডাউন (58mm) | অফিস (A4)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => printerRoutingService.dispatchPrintJob(PrinterTarget.COUNTER_POS, {})}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300 transition-colors"
          >
            কাউন্টার টেস্ট প্রিন্ট
          </button>
          <button
            onClick={handleRunNightlySummary}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all"
          >
            🌙 দৈনিক সারাংশ রিপোর্ট
          </button>
        </div>
      </div>
    </div>
  );
}
