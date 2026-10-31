import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Bluetooth, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Smartphone,
  Sliders,
  Sparkles
} from 'lucide-react';
import { 
  getPairedBluetoothPrinters, 
  scanAndPairWebBluetoothPrinter, 
  buildReceiptEscPosBuffer, 
  sendBufferToPrinter,
  isAndroidNativeBluetoothAvailable,
  isWebBluetoothSupported
} from '../../services/thermalPrinterService';
import { hapticFeedback } from '../../services/nativeAppService';

export default function BluetoothThermalPrinterModal({
  isOpen,
  onClose,
  deposit,
  samityInfo = {},
  onSuccessPrint = () => {}
}) {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [paperWidth, setPaperWidth] = useState(58); // 58mm or 80mm
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  const isAndroidNative = isAndroidNativeBluetoothAvailable();
  const isWebBt = isWebBluetoothSupported();

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
      setPrintStatus(null);
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const list = await getPairedBluetoothPrinters();
      setPrinters(list);
      if (list.length > 0 && !selectedPrinter) {
        setSelectedPrinter(list[0]);
      }
    } catch (err) {
      console.warn('Failed to load printers:', err);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handlePairNewDevice = async () => {
    hapticFeedback.light();
    try {
      setIsLoadingPrinters(true);
      const newDev = await scanAndPairWebBluetoothPrinter();
      if (newDev) {
        setPrinters(prev => [newDev, ...prev.filter(p => p.id !== newDev.id)]);
        setSelectedPrinter(newDev);
        setPrintStatus({ type: 'success', message: `প্রিন্টার "${newDev.name}" সফলভাবে যুক্ত হয়েছে!` });
      }
    } catch (err) {
      setPrintStatus({ type: 'error', message: err.message || 'নতুন প্রিন্টার সংযোগ ব্যর্থ হয়েছে।' });
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleSendPrint = async () => {
    if (!deposit) return;
    hapticFeedback.medium();
    setIsPrinting(true);
    setPrintStatus({ type: 'info', message: 'প্রিন্টারে কমান্ড পাঠানো হচ্ছে...' });

    try {
      const buffer = buildReceiptEscPosBuffer(deposit, samityInfo, { paperWidth });
      const result = await sendBufferToPrinter(buffer, selectedPrinter || {});

      if (result.success) {
        setPrintStatus({ type: 'success', message: result.message });
        onSuccessPrint(deposit);
      } else if (result.useBrowserFallback) {
        setPrintStatus({ type: 'info', message: result.message });
        handleBrowserPrintFallback();
      }
    } catch (err) {
      setPrintStatus({ type: 'error', message: err.message || 'প্রিন্টিং প্রক্রিয়ায় ত্রুটি দেখা দিয়েছে।' });
      hapticFeedback.error();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrintFallback = () => {
    hapticFeedback.light();
    const printArea = document.getElementById('somiti-thermal-receipt-preview');
    if (!printArea) {
      window.print();
      return;
    }
    const win = window.open('', '', 'width=450,height=650');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Thermal Receipt - ${deposit?.receiptNo || 'RCPT'}</title>
          <style>
            @page { size: ${paperWidth}mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 11px; 
              margin: 0; 
              padding: 8px; 
              color: #000;
              width: ${paperWidth === 80 ? '72mm' : '52mm'};
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 4px 0; }
            .double-divider { border-bottom: 2px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .amount { font-size: 16px; font-weight: bold; margin: 6px 0; text-align: center; }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (!isOpen) return null;

  const samityName = samityInfo.nameBn || samityInfo.name || 'সমিতি ৩৬০ লিমিটেড';
  const receiptNo = deposit?.receiptNo || deposit?.voucherNo || `RCPT-${deposit?.id || '001'}`;
  const amountFormatted = Number(deposit?.amount || 0).toLocaleString('en-US');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                ব্লুটুথ থার্মাল POS প্রিন্টার
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
                  {paperWidth}mm
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ফিল্ড অফিসার ও কাউন্টার রসিদ (ESC/POS সরাসরি ব্লুটুথ সংযোগ)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Hardware Connection Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Bluetooth className="w-4 h-4 text-blue-500" />
                কানেক্টেড ব্লুটুথ প্রিন্টার:
              </span>
              <div className="flex items-center gap-1">
                {isAndroidNative && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold">
                    APK Native RFCOMM
                  </span>
                )}
                {isWebBt && (
                  <button
                    onClick={handlePairNewDevice}
                    disabled={isLoadingPrinters}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-2 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                    নতুন পেয়ার করুন
                  </button>
                )}
              </div>
            </div>

            {printers.length > 0 ? (
              <select
                value={selectedPrinter?.id || ''}
                onChange={(e) => {
                  const p = printers.find(x => x.id === e.target.value);
                  setSelectedPrinter(p || null);
                  hapticFeedback.selection();
                }}
                className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {printers.map(p => (
                  <option key={p.id} value={p.id}>
                    🖨️ {p.name} ({p.address || 'Bluetooth'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">কোনো ব্লুটুথ থার্মাল প্রিন্টার সংযুক্ত পাওয়া যায়নি।</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    মোবাইলের ব্লুটুথ অন করে প্রিন্টারের সাথে পেয়ার করুন, অথবা নিচে সরাসরি ব্রাউজার প্রিন্ট ব্যবহার করুন।
                  </p>
                </div>
              </div>
            )}

            {/* Paper Size Selector */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">কাগজের সাইজ:</span>
              <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setPaperWidth(58); hapticFeedback.selection(); }}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                    paperWidth === 58
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ৫৮ মিমি (58mm)
                </button>
                <button
                  type="button"
                  onClick={() => { setPaperWidth(80); hapticFeedback.selection(); }}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                    paperWidth === 80
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ৮০ মিমি (80mm)
                </button>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {printStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
              printStatus.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : printStatus.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
            }`}>
              {printStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : printStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              )}
              <span>{printStatus.message}</span>
            </div>
          )}

          {/* Live Thermal Receipt Visual Slip Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              থার্মাল প্রিন্ট প্রিভিউ ({paperWidth}mm ESC/POS Layout):
            </span>
            <div className="bg-amber-50/50 dark:bg-slate-950 p-4 rounded-xl border border-amber-200/60 dark:border-slate-800 flex justify-center">
              <div 
                id="somiti-thermal-receipt-preview"
                className={`bg-white text-slate-900 p-4 rounded shadow-md font-mono text-[11px] leading-tight select-none border border-slate-300 ${
                  paperWidth === 80 ? 'w-[320px]' : 'w-[260px]'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <div className="text-center font-bold text-[13px]">{samityName}</div>
                {samityInfo.address && <div className="text-center text-[10px] text-slate-600">{samityInfo.address}</div>}
                {samityInfo.regNo && <div className="text-center text-[10px] text-slate-600">রেজি: {samityInfo.regNo} | ফোন: {samityInfo.phone || '-'}</div>}
                <div className="border-b-2 border-dashed border-slate-800 my-1.5"></div>
                
                <div className="text-center font-bold text-[12px] uppercase">** জমা আদায় রসিদ **</div>
                <div className="text-center text-[9px] uppercase tracking-wider text-slate-500">PAID MONEY RECEIPT</div>
                <div className="border-b border-dashed border-slate-400 my-1"></div>

                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">রসিদ নং:</span>
                  <span className="font-bold">{receiptNo}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">তারিখ:</span>
                  <span>{deposit?.depositDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">সদস্য নাম:</span>
                  <span className="font-semibold truncate max-w-[140px]">
                    {deposit?.memberName || deposit?.depositorName || 'সদস্য'}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">সদস্য আইডি:</span>
                  <span>{deposit?.memberIdNo || deposit?.memberId || '-'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">আদায়ের খাত:</span>
                  <span className="font-medium">{deposit?.type || deposit?.depositType || 'মাসিক সঞ্চয়'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">মাধ্যম:</span>
                  <span>{deposit?.paymentMethod || 'ক্যাশ'}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 my-1.5"></div>

                {/* Amount Big Highlight */}
                <div className="text-center py-1">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest">মোট আদায়কৃত পরিমাণ</div>
                  <div className="text-lg font-black text-slate-900 tracking-tight">
                    Tk. {amountFormatted}/=
                  </div>
                  {deposit?.amountInWordsBn && (
                    <div className="text-[10px] text-slate-600 italic mt-0.5">({deposit.amountInWordsBn})</div>
                  )}
                </div>
                <div className="border-b border-dashed border-slate-400 my-1.5"></div>

                <div className="flex justify-between py-0.5 text-[10px]">
                  <span className="text-slate-600">আদায়কারী:</span>
                  <span>{deposit?.collectorName || 'অফিস কাউন্টার'}</span>
                </div>
                <div className="flex justify-between py-0.5 text-[10px]">
                  <span className="text-slate-600">যাচাই রেফারেন্স:</span>
                  <span className="font-bold">#{deposit?.shortCode || deposit?.id?.toString().slice(0, 8) || 'VERIFIED'}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-dotted border-slate-400 flex justify-between text-[9px] text-slate-500">
                  <span>সদস্য স্বাক্ষর</span>
                  <span>অনুমোদিত স্বাক্ষর</span>
                </div>

                <div className="border-b-2 border-dashed border-slate-800 my-2"></div>
                <div className="text-center text-[9px] text-slate-500">
                  ডিজিটালভাবে তৈরি • www.somiti360.com
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleBrowserPrintFallback}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            ব্রাউজার প্রিন্ট / PDF
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={handleSendPrint}
              disabled={isPrinting || (!selectedPrinter && !isAndroidNative)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'প্রিন্ট হচ্ছে...' : '🖨️ থার্মাল প্রিন্ট পাঠান'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
