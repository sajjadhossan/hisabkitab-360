import React, { useRef } from 'react';
import { Barcode, Printer, X, Check, Droplet, User, Calendar, Clock, AlertCircle } from 'lucide-react';

export const PhlebotomyBarcodeModal = ({ isOpen, onClose, order }) => {
  const printRef = useRef(null);

  if (!isOpen || !order) return null;

  // Identify sample tube types based on tests
  const tests = order.tests || [];
  const tubesNeeded = [];

  const hasCBC = tests.some(t => t.test_code?.includes('CBC') || t.test_name?.toLowerCase().includes('blood') || t.test_name?.toLowerCase().includes('cbc'));
  const hasBiochem = tests.some(t => t.test_code?.includes('LFT') || t.test_code?.includes('RFT') || t.test_code?.includes('LIPID') || t.test_name?.toLowerCase().includes('creatinine') || t.test_name?.toLowerCase().includes('serum'));
  const hasSugar = tests.some(t => t.test_code?.includes('FBS') || t.test_name?.toLowerCase().includes('sugar') || t.test_name?.toLowerCase().includes('glucose'));
  const hasUrine = tests.some(t => t.test_code?.includes('URINE') || t.test_name?.toLowerCase().includes('urine'));

  if (hasCBC || tubesNeeded.length === 0) {
    tubesNeeded.push({
      tubeType: 'K2 EDTA (পার্পল টিউব)',
      color: '#8b5cf6',
      sampleType: 'Whole Blood',
      department: 'Hematology',
      barcodeSuffix: 'EDTA-1'
    });
  }
  if (hasBiochem) {
    tubesNeeded.push({
      tubeType: 'Gel & Clot Activator (হলুদ টিউব)',
      color: '#f59e0b',
      sampleType: 'Serum',
      department: 'Biochemistry',
      barcodeSuffix: 'SRM-2'
    });
  }
  if (hasSugar) {
    tubesNeeded.push({
      tubeType: 'Sodium Fluoride (ধূসর টিউব)',
      color: '#64748b',
      sampleType: 'Plasma',
      department: 'Clinical Bio',
      barcodeSuffix: 'FLU-3'
    });
  }
  if (hasUrine) {
    tubesNeeded.push({
      tubeType: 'Sterile Urine Container (ইউরিন পট)',
      color: '#eab308',
      sampleType: 'Clean Catch Midstream Urine',
      department: 'Clinical Pathology',
      barcodeSuffix: 'URN-4'
    });
  }

  const handlePrintStickers = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Barcode size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                ফ্লেবোটমি স্যাম্পল টিউব বারকোড স্টিকার
              </h3>
              <p className="text-xs text-slate-500">
                অর্ডার: <strong className="font-mono text-purple-700">{order.lab_order_id}</strong> | রোগী: <strong>{order.patient_name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
          <Droplet size={16} className="text-purple-600 flex-shrink-0" />
          <span>
            রক্তের নমুনা সংগ্রহের পূর্বে প্রতিটি টিউবের গায়ে এই বারকোড স্টিকারগুলো সঠিকভাবে সাঁটানো নিশ্চিত করুন।
          </span>
        </div>

        {/* Printable Stickers Preview Area */}
        <div ref={printRef} className="space-y-4">
          {tubesNeeded.map((tube, index) => {
            const barcodeNumber = `${order.lab_order_id}-${tube.barcodeSuffix}`;

            return (
              <div
                key={index}
                className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl relative hover:border-purple-400 transition-all shadow-sm"
              >
                {/* Tube Type Color Pill */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ background: tube.color }}
                    />
                    <span className="font-bold text-xs text-slate-900">
                      {tube.tubeType}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {tube.sampleType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Sticker #{index + 1}
                  </span>
                </div>

                {/* Barcode Visual Representation */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-1">
                  {/* Simulated High-Res Vector Barcode Lines */}
                  <div className="flex items-center justify-center gap-[2px] h-11 w-64 bg-white p-1 rounded border border-slate-200 overflow-hidden">
                    {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                      <span
                        key={i}
                        className="bg-slate-900 h-full inline-block"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>

                  <div className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                    *{barcodeNumber}*
                  </div>
                </div>

                {/* Patient & Test Details on Sticker */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div>
                    <div>রোগী: <strong className="text-slate-900">{order.patient_name}</strong> ({order.patient_id})</div>
                    <div>বিভাগ: <strong>{tube.department}</strong></div>
                  </div>
                  <div className="text-right">
                    <div>তারিখ: <strong>{new Date().toLocaleDateString('en-GB')}</strong></div>
                    <div>টেস্ট: <span className="font-semibold text-purple-700">{tests.map(t => t.test_code).slice(0, 3).join(', ')}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            মোট স্টিকার সংখ্যা: <strong>{tubesNeeded.length} টি</strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
            >
              বন্ধ করুন
            </button>
            <button
              onClick={handlePrintStickers}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Printer size={15} />
              <span>🖨️ স্টিকার প্রিন্ট করুন</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
