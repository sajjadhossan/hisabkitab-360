import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  Settings,
  Building,
  Check,
  Save,
  Globe,
  Printer,
  Smartphone,
  Shield,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const HealthcareSettingsManager = ({ onInstitutionTypeChange }) => {
  const [instType, setInstType] = useState(() => {
    try {
      return localStorage.getItem('hisabkitab_hc_inst_type') || 'hospital_diag_pharmacy';
    } catch {
      return 'hospital_diag_pharmacy';
    }
  });

  const [settings, setSettings] = useState({
    hospitalName: 'হেলথকেয়ার 360° হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স',
    tagline: 'হাসপাতাল, ডায়াগনস্টিক, ডাক্তার চেম্বার ও ফার্মেসি সেবা',
    phone: '০৯৬১১-২২৩৩৪৪',
    email: 'info@healthcare360.com',
    address: 'বাড়ি #১২, রোড #০৫, ধানমন্ডি, ঢাকা-১২০৫',
    dghsReg: 'DGHS-REG-2026-9812',
    uhidPrefix: 'UHID-2026',
    invoicePrefix: 'INV-2026',
    defaultLanguage: 'বাংলা',
    slipSize: 'A4 / প্যাড সাইজ (Full)',
    enableSms: true,
    enableQrOnReports: true
  });

  const institutionTypes = [
    { id: 'doctor_chamber', label: 'ডাক্তার চেম্বার', icon: '🩺', desc: 'শুধুমাত্র একক বা যৌথ ডাক্তার কনসালটেন্সি ও প্রেসক্রিপশন' },
    { id: 'diagnostic_center', label: 'ডায়াগনস্টিক সেন্টার', icon: '🔬', desc: 'প্যাথলজিক্যাল ল্যাব, স্যাম্পল কালেকশন ও রিপোর্ট প্রদান' },
    { id: 'pharmacy', label: 'ফার্মেসি', icon: '💊', desc: 'ওষুধ বিক্রয় POS, FEFO ব্যাচ ও স্টক ম্যানেজমেন্ট' },
    { id: 'clinic', label: 'ক্লিনিক / ছোট হাসপাতাল', icon: '🏥', desc: 'আউটডোর ও সীমিত ইনডোর বেড সহ ডে-কেয়ার চিকিৎসা' },
    { id: 'hospital_diag_pharmacy', label: 'হাসপাতাল + ডায়াগনস্টিক + ফার্মেসি', icon: '🌐', desc: 'সম্পূর্ণ সমন্বিত ৩-ইন-১ 360° ইকোসিস্টেম (প্রস্তাবিত)', recommended: true },
    { id: 'multi_branch', label: 'একাধিক শাখার প্রতিষ্ঠান', icon: '🏢', desc: 'কেন্দ্রীয় সার্ভার ও ব্রাঞ্চভিত্তিক মাল্টি-লোকেশান সুবিধা' }
  ];

  const handleSelectType = (id) => {
    setInstType(id);
    localStorage.setItem('hisabkitab_hc_inst_type', id);
    if (onInstitutionTypeChange) onInstitutionTypeChange(id);
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('hisabkitab_hc_inst_type', instType);
    localStorage.setItem('hisabkitab_hc_general_settings', JSON.stringify(settings));
    alert('প্রতিষ্ঠানের ধরন ও সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-2">
              <Sparkles size={13} />
              <span>মডিউল ১৭: প্রতিষ্ঠান কনফিগারেশন ও সিস্টেম সেটিংস</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">প্রতিষ্ঠানের ধরন ও কনফিগারেশন</h2>
            <p className="text-sm text-teal-100/80 mt-1">
              আপনার সেন্টারের ধরন নির্বাচন করুন—ডাক্তার চেম্বার, ডায়াগনস্টিক, ফার্মেসি কিংবা ৩-ইন-১ পূর্ণাঙ্গ হাসপাতাল।
            </p>
          </div>
        </div>
      </div>

      {/* INSTITUTION TYPE SELECTION MATRIX */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900">প্রতিষ্ঠানের ধরন নির্বাচন করুন (Organization Profile)</h3>
          <p className="text-xs text-slate-500">আপনার নির্বাচন অনুযায়ী প্রাসঙ্গিক কাউন্টার ও টুলস অগ্রাধিকার পাবে</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {institutionTypes.map(item => {
            const isSelected = instType === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectType(item.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-teal-50 to-emerald-50/50 border-teal-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-teal-600 text-white">
                        <Check size={13} />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-900">{item.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>

                {item.recommended && (
                  <span className="mt-3 inline-block self-start px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[10px] font-extrabold">
                    ★ সর্বাধিক ব্যবহৃত (360°)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* GENERAL BRANDING SETTINGS FORM */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          সাধারণ প্রতিষ্ঠান ও প্রিন্ট তথ্য
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">প্রতিষ্ঠানের নাম</label>
            <input
              type="text"
              value={settings.hospitalName}
              onChange={e => setSettings({ ...settings, hospitalName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">স্লোগান / ট্যাগলাইন</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">হেল্পলাইন / ফোন নম্বর</label>
            <input
              type="text"
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ঠিকানা</label>
            <input
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">DGHS রেজিস্ট্রেশন নম্বর</label>
            <input
              type="text"
              value={settings.dghsReg}
              onChange={e => setSettings({ ...settings, dghsReg: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ডিফল্ট প্রিন্ট সাইজ</label>
            <select
              value={settings.slipSize}
              onChange={e => setSettings({ ...settings, slipSize: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-teal-500 text-sm"
            >
              <option value="A4 / প্যাড সাইজ (Full)">A4 / প্যাড সাইজ (Full)</option>
              <option value="A5 সাইজ">A5 সাইজ</option>
              <option value="থার্মাল ৮০ মিমি রসিদ">থার্মাল ৮০ মিমি রসিদ (POS)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md flex items-center gap-2"
          >
            <Save size={16} />
            <span>সেটিংস সংরক্ষণ করুন (Save Settings)</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthcareSettingsManager;
