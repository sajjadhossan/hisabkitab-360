import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  CreditCard,
  QrCode,
  Sparkles,
  CheckCircle2,
  Download,
  Settings,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { generateQrDataUrl, createInvoiceVerificationUrl } from '../../services/qrService';
import { printElement } from '../../services/printService';

export const PrintCenterManager = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('rx_pad');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const docData = {
      id: `HC-DOC-${selectedTemplate.toUpperCase()}-2026`,
      date: new Date().toISOString().split('T')[0],
      customerName: selectedTemplate === 'lab_report' ? 'মোসা: সুমি আক্তার' : 'মো: রফিকুল ইসলাম',
      customerPhone: '01711-223344',
      grandTotal: selectedTemplate === 'invoice_receipt' ? 1450 : 0,
      paidAmount: selectedTemplate === 'invoice_receipt' ? 1450 : 0,
      dueAmount: 0,
      status: 'verified',
      paymentMethod: 'হাসপাতাল কেন্দ্রীয় ক্যাশ',
      items: [
        { name: `ক্লিনিক্যাল ডকুমেন্ট: ${selectedTemplate}`, qty: 1, price: 0 }
      ]
    };
    const verifyUrl = createInvoiceVerificationUrl(docData);
    generateQrDataUrl(verifyUrl, { width: 140, margin: 1 }).then(url => {
      if (url) setQrCodeUrl(url);
    });
  }, [selectedTemplate]);

  const handlePrint = () => {
    printElement('clinical-print-preview-pad', {
      title: `Healthcare-Document-${selectedTemplate}`,
      paperType: 'a4'
    });
  };

  const printDocs = [
    { id: 'rx_pad', title: 'ডাক্তারি প্রেসক্রিপশন প্যাড (Rx Pad)', desc: 'চিফ কমপ্লেইন্টস, ড্রাগস, ভাইটালস ও ডাক্তারের সিল সহ প্রিন্ট' },
    { id: 'lab_report', title: 'ডায়াগনস্টিক ল্যাব রিপোর্ট (LIMS)', desc: 'রেফারেন্স রেঞ্জ, হাই/লো ফ্ল্যাগ ও কিউআর ভেরিফিকেশন সহ' },
    { id: 'token_slip', title: 'সিরিয়াল টোকেন ও ভিজিট স্লিপ', desc: 'থার্মাল বা সাধারণ সাইজে অপেক্ষমাণ রোগী টোকেন স্লিপ' },
    { id: 'invoice_receipt', title: 'সেন্ট্রাল বিল ও ক্যাশ রসিদ', desc: 'কনসালটেন্সি + ল্যাব + ফার্মেসি সমন্বিত মানি রিসিট' },
    { id: 'discharge_cert', title: 'হাসপাতাল ছাড়পত্র ফরম (Discharge)', desc: 'ভর্তি রোগীর চিকিৎসা বিবরণ ও ফলো-আপ নির্দেশনা' },
    { id: 'patient_card', title: 'রোগী ডিজিটাল পরিচয়পত্র (UHID Card)', desc: 'বারকোড ও ছবি সহ স্থায়ী রোগী আইডি কার্ড' }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <Sparkles size={13} />
              <span>মডিউল ১৬: পেশাদার ক্লিনিক্যাল প্রিন্ট ও ডকুমেন্টস হাব</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">প্রিন্ট ও কাগজপত্র কেন্দ্র (Print Center)</h2>
            <p className="text-sm text-teal-100/80 mt-1">
              প্রেসক্রিপশন, ল্যাব টেস্ট রিপোর্ট, মানি রিসিট, টোকেন স্লিপ ও রোগীর কার্ড এক ক্লিকে প্রিন্ট ও PDF।
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-sm shadow-lg flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Printer size={16} />
            <span>সরাসরি প্রিন্ট করুন (Print Now)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-black text-slate-900 mb-2">প্রিন্ট টেমপ্লেট নির্বাচন করুন</h3>
          {printDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => setSelectedTemplate(doc.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedTemplate === doc.id
                  ? 'bg-teal-50/80 border-teal-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">{doc.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{doc.desc}</p>
                </div>
                {selectedTemplate === doc.id && (
                  <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Live Preview Pad (7 cols) */}
        <div className="lg:col-span-7">
          <div id="clinical-print-preview-pad" className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg text-slate-900 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
              <div>
                <h2 className="text-xl font-black text-teal-800">হেলথকেয়ার 360° হাসপাতাল ও মেডিকেল সেন্টার</h2>
                <p className="text-[11px] text-slate-600">বাড়ি #১২, রোড #০৫, ধানমন্ডি, ঢাকা • ফোন: ০৯৬১১-২২৩৩৪৪</p>
                <p className="text-[10px] text-slate-400">DGHS Reg: 2026/HC-360-DHAKA • 24/7 ইমার্জেন্সি ও ল্যাব</p>
              </div>
              <div className="p-2 border border-slate-300 rounded-lg text-center bg-white shadow-sm">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Verify QR" className="w-16 h-16 mx-auto block" />
                ) : (
                  <QrCode size={36} className="text-slate-800 mx-auto" />
                )}
                <span className="text-[8px] font-bold text-emerald-700 block mt-1">✓ অফিসিয়াল QR ভেরিফাইড</span>
              </div>
            </div>

            {/* Content depending on template */}
            {selectedTemplate === 'rx_pad' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 text-xs">
                  <div><strong>রোগীর নাম:</strong> মো: রফিকুল ইসলাম (৪৫ বছর, পুরুষ)</div>
                  <div><strong>UHID:</strong> UHID-2026-001 • তারিখ: ১০/১০/২০২৬</div>
                </div>
                <div className="p-2 bg-teal-50/50 rounded-lg text-xs font-bold text-teal-900">
                  ভাইটালস: BP: 120/80 mmHg | Pulse: 78 bpm | Temp: 98.6°F | Weight: 68 kg
                </div>
                <div className="space-y-2 pt-2">
                  <div className="text-base font-black text-slate-900">℞ ওষধসমূহ:</div>
                  <ol className="list-decimal pl-5 text-xs space-y-1.5 text-slate-800">
                    <li><strong>Tab. Napa Extra 500mg</strong> — ১+০+১ (খাবারের পর, ৫ দিন)</li>
                    <li><strong>Cap. Seclo 20mg</strong> — ১+০+১ (খাবারের ২০ মিনিট আগে, ১৪ দিন)</li>
                    <li><strong>Tab. Ciprocin 500mg</strong> — ১+০+১ (খাবারের পর, ৭ দিন)</li>
                  </ol>
                </div>
                <div className="pt-2 text-xs">
                  <strong>পরামর্শকৃত টেস্ট:</strong> CBC with ESR, Urine R/E
                </div>
              </div>
            )}

            {selectedTemplate === 'lab_report' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 text-xs">
                  <div><strong>রোগী:</strong> মোসা: সুমি আক্তার (৩২ বছর, মহিলা)</div>
                  <div><strong>ল্যাব আইডি:</strong> LAB-2026-402 • স্যাম্পল: রক্ত (EDTA)</div>
                </div>
                <div className="text-sm font-black text-teal-900 border-b pb-1">কমপ্লিট ব্লাড কাউন্ট (CBC) টেস্ট রিপোর্ট</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-slate-500 font-bold">
                      <th className="text-left py-1">প্যারামিটার</th>
                      <th className="text-center py-1">ফলাফল</th>
                      <th className="text-center py-1">একক</th>
                      <th className="text-right py-1">রেফারেন্স রেঞ্জ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold">Hemoglobin (Hb)</td>
                      <td className="text-center font-black text-rose-600">10.2 (Low)</td>
                      <td className="text-center">g/dL</td>
                      <td className="text-right">11.5 - 15.5</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold">ESR</td>
                      <td className="text-center font-black text-emerald-700">14</td>
                      <td className="text-center">mm/1st hr</td>
                      <td className="text-right">0 - 20</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5 font-bold">Total Platelet Count</td>
                      <td className="text-center font-black text-emerald-700">280,000</td>
                      <td className="text-center">/cumm</td>
                      <td className="text-right">150,000 - 450,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedTemplate !== 'rx_pad' && selectedTemplate !== 'lab_report' && (
              <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900">{printDocs.find(d => d.id === selectedTemplate)?.title}</div>
                <p>ক্লিনিক্যাল ফরম্যাট অনুযায়ী প্রিভিউ সফলভাবে লোড হয়েছে। সরাসরি প্রিন্ট করতে পারেন।</p>
              </div>
            )}

            {/* Footer Signatures */}
            <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-[10px] text-slate-500">
              <div className="text-center">
                <div className="w-24 border-b border-slate-400 mb-1"></div>
                <span>প্রস্তুতকারী কর্মী</span>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-800 mb-1"></div>
                <span className="font-bold text-slate-800">অনুমোদিত বিশেষজ্ঞ ডাক্তার</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintCenterManager;
