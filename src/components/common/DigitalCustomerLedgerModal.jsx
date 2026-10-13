/**
 * HisabKitab 360 - Customer Self-Service Digital Ledger Modal
 * ------------------------------------------------------------
 * Tip 9: Interactive customer portal displaying real-time debit/credit
 * statements, invoice history, payment receipts, and one-click WhatsApp statement dispatch.
 */

import React, { useState } from 'react';
import { X, FileText, Send, QrCode, ArrowDownRight, ArrowUpRight, Phone, Printer } from 'lucide-react';
import { automatedMessagingGateway } from '../../services/automatedMessagingGateway';
import { triggerHaptic, HapticPattern } from '../../utils/haptics';

export default function DigitalCustomerLedgerModal({ isOpen, onClose, customer, invoices = [], debts = [] }) {
  if (!isOpen || !customer) return null;

  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'pay_qr'

  const customerInvoices = invoices.filter(inv => inv.customerId === customer.id || inv.customerPhone === customer.phone);
  const totalPurchases = customerInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal || inv.total) || 0), 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount || inv.paid) || 0), 0);
  const totalDue = Number(customer.totalDue || customer.due || 0);

  const handleShareWhatsApp = () => {
    triggerHaptic(HapticPattern.MEDIUM);
    const summary = `🧾 *হিসাবকিতাব ৩৬০ - ডিজিটাল খাতা বিবরণী*\n` +
      `গ্রাহক: ${customer.name}\n` +
      `মোট কেনাকাটা: ৳${totalPurchases.toLocaleString('bn-BD')}\n` +
      `মোট পরিশোধ: ৳${totalPaid.toLocaleString('bn-BD')}\n` +
      `বর্তমান বকেয়া: ৳${totalDue.toLocaleString('bn-BD')}\n` +
      `অনুগ্রহ করে বকেয়া পরিশোধের জন্য যোগাযোগ করুন। ধন্যবাদ!`;

    const url = automatedMessagingGateway.getWhatsAppShareUrl(customer.phone, summary);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              {customer.name?.charAt(0) || 'ক'}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                {customer.name}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  ডিজিটাল খাতা
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> {customer.phone || 'ফোন নম্বর নেই'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-800/40 dark:via-indigo-950/20 dark:to-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-center">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">মোট কেনাকাটা</div>
            <div className="text-base font-black text-slate-800 dark:text-white mt-1">৳{totalPurchases.toLocaleString('bn-BD')}</div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">মোট জমা/পরিশোধ</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">৳{totalPaid.toLocaleString('bn-BD')}</div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="text-xs text-rose-500 font-medium">বর্তমান বকেয়া</div>
            <div className="text-base font-black text-rose-600 mt-1">৳{totalDue.toLocaleString('bn-BD')}</div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>লেনদেন হিস্ট্রি ({customerInvoices.length} টি ইনভয়েস)</span>
            <span>পরিমাণ ও স্ট্যাটাস</span>
          </div>

          {customerInvoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm">এই গ্রাহকের পূর্বের কোনো চালান রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            customerInvoices.map((inv, idx) => (
              <div
                key={inv.id || idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {inv.invoiceNo || `INV-${idx + 1}`}
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {new Date(inv.date || inv.created_at || Date.now()).toLocaleDateString('bn-BD')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-slate-800 dark:text-white">
                    ৳{Number(inv.grandTotal || inv.total || 0).toLocaleString('bn-BD')}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block mt-0.5 ${
                    Number(inv.dueAmount || inv.due || 0) > 0
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-900'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-900'
                  }`}>
                    {Number(inv.dueAmount || inv.due || 0) > 0 ? `বাকি: ৳${inv.dueAmount || inv.due}` : 'পরিশোধিত'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট বিবরণী
          </button>

          <button
            onClick={handleShareWhatsApp}
            disabled={!customer.phone}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> হোয়াটসঅ্যাপে খাতা পাঠান
          </button>
        </div>
      </div>
    </div>
  );
}
