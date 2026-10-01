import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';

export default function HomeServicesReferral() {
  const { patients } = useHealthcare();
  const [activeSubTab, setActiveSubTab] = useState('home_sample'); // 'home_sample' | 'medicine_delivery' | 'referral_lab'

  // Home Sample Collection requests
  const [homeSamples, setHomeSamples] = useState([
    {
      id: 'HC-20261001-000001',
      patient_name: 'আব্দুল করিম',
      phone: '01711223344',
      address: 'বাড়ি # ৪২, রোড # ৮, মিরপুর-১০, ঢাকা',
      tests: 'CBC with ESR, Fasting Blood Sugar (FBS)',
      preferred_time: 'সকাল ০৭:৩০ - ০৮:৩০',
      collector: 'মোস্তাফিজুর রহমান (Senior Phlebotomist)',
      status: 'Collector Assigned', // 'Requested' | 'Collector Assigned' | 'Sample Picked' | 'Received at Lab'
      fee: 300,
      payment_status: 'Paid (bKash)'
    },
    {
      id: 'HC-20261001-000002',
      patient_name: 'মোছাঃ নাসরিন আক্তার',
      phone: '01819988776',
      address: 'ফ্ল্যাট ৪বি, ধানমন্ডি লেকভিউ, ঢাকা',
      tests: 'Thyroid Function (TSH, FT4), Serum Creatinine',
      preferred_time: 'সকাল ০৯:০০ - ১০:০০',
      collector: 'হাসান আলী',
      status: 'Sample Picked',
      fee: 250,
      payment_status: 'Cash on Collection'
    }
  ]);

  // Home Medicine Delivery
  const [medicineDeliveries, setMedicineDeliveries] = useState([
    {
      id: 'MD-20261001-000001',
      patient_name: 'আব্দুল করিম',
      phone: '01711223344',
      address: 'মিরপুর-১০, ঢাকা',
      sale_id: 'PH-20261001-000001',
      rider: 'তানভীর আহমেদ',
      items_summary: 'Napa Extra (2 পাতা), Seclo 20mg (1 পাতা)',
      cod_amount: 190,
      delivery_status: 'Out for Delivery', // 'Preparing' | 'Out for Delivery' | 'Delivered'
      otp: '4829'
    }
  ]);

  // Referral / Partner Labs
  const [referralLabs, setReferralLabs] = useState([
    {
      ref_id: 'REF-20261001-0001',
      partner_name: 'ন্যাশনাল রেফারেন্স ল্যাবরেটরি (NRL)',
      patient_name: 'রফিকুল ইসলাম',
      test_name: 'RT-PCR for Viral Panel',
      sent_date: '2026-10-01 10:00 AM',
      courier_tracking: 'SA-PARCEL-9921',
      partner_cost: 1800,
      status: 'Sample Received by Partner' // 'Sent' | 'Sample Received by Partner' | 'Report Received'
    },
    {
      ref_id: 'REF-20261001-0002',
      partner_name: 'বায়োমেড স্পেশালাইজড জেনেটিক ল্যাব',
      patient_name: 'শারমিন সুলতানা',
      test_name: 'Karyotyping & Genetic Karyotype',
      sent_date: '2026-09-30 04:00 PM',
      courier_tracking: 'REDX-7712',
      partner_cost: 4500,
      status: 'Report Received'
    }
  ]);

  // New Request Form states
  const [newPatientId, setNewPatientId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTests, setNewTests] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleCreateHomeSample = (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.patient_id === newPatientId);
    if (!patient) {
      alert('রোগী নির্বাচন করুন');
      return;
    }

    const newReq = {
      id: `HC-20261001-${String(homeSamples.length + 1).padStart(6, '0')}`,
      patient_name: patient.full_name,
      phone: patient.mobile_number,
      address: newAddress || patient.address,
      tests: newTests,
      preferred_time: newTime,
      collector: 'অনুরোধ প্রক্রিয়াধীন (Pending Assignment)',
      status: 'Requested',
      fee: 250,
      payment_status: 'Due'
    };

    setHomeSamples([newReq, ...homeSamples]);
    alert(`হোম কালেকশন অনুরোধ গৃহীত হয়েছে! রিকুয়েস্ট আইডি: ${newReq.id}`);
    setNewPatientId('');
    setNewAddress('');
    setNewTests('');
    setNewTime('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xl">🛵</span>
            <h1 className="text-2xl font-bold text-slate-800">হোম সার্ভিসেস ও পার্টনার রেফারেল (Home Care & Partner Labs)</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            বাসায় গিয়ে রক্তের স্যাম্পল কালেকশন, ওষুধ ডেলিভারি (COD) এবং বাইরের রেফারেন্স ল্যাব টেস্ট ট্র্যাকিং
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('home_sample')}
            className={`px-3 py-2 font-bold rounded-lg transition-all ${
              activeSubTab === 'home_sample' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            🩸 হোম স্যাম্পল কালেকশন ({homeSamples.length})
          </button>
          <button
            onClick={() => setActiveSubTab('medicine_delivery')}
            className={`px-3 py-2 font-bold rounded-lg transition-all ${
              activeSubTab === 'medicine_delivery' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            📦 হোম মেডিসিন ডেলিভারি ({medicineDeliveries.length})
          </button>
          <button
            onClick={() => setActiveSubTab('referral_lab')}
            className={`px-3 py-2 font-bold rounded-lg transition-all ${
              activeSubTab === 'referral_lab' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            🔬 রেফারেল পার্টনার ল্যাব ({referralLabs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: HOME SAMPLE COLLECTION */}
      {activeSubTab === 'home_sample' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-fit">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span>🩸</span> নতুন হোম স্যাম্পল বুকিং
            </h2>

            <form onSubmit={handleCreateHomeSample} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">রোগী নির্বাচন:</label>
                <select
                  required
                  value={newPatientId}
                  onChange={e => setNewPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- রোগী নির্বাচন করুন --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_id} - {p.full_name} ({p.mobile_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">ঠিকানা (বাসা/ফ্ল্যাট):</label>
                <input
                  type="text"
                  required
                  placeholder="সম্পূর্ণ ঠিকানা..."
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">টেস্টের নামসমূহ:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: CBC, FBS, Lipid Profile..."
                  value={newTests}
                  onChange={e => setNewTests(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">পছন্দের সময় (Time Slot):</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সকাল ০৭:৩০ - ০৮:৩০"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all mt-2"
              >
                + বুকিং কনফার্ম করুন (চার্জ: ৳২৫০)
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-base">হোম কালেকশন শিডিউল ও ট্র্যাকিং</h2>

            <div className="space-y-3">
              {homeSamples.map(sample => (
                <div
                  key={sample.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                        {sample.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        ⏰ {sample.preferred_time}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sample.status === 'Sample Picked'
                          ? 'bg-amber-100 text-amber-800'
                          : sample.status === 'Received at Lab'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sample.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base">{sample.patient_name}</h3>
                    <p className="text-xs text-slate-600">ফোন: <strong>{sample.phone}</strong> | ঠিকানা: {sample.address}</p>
                    <p className="text-xs text-indigo-700 font-medium">টেস্ট: {sample.tests}</p>
                    <p className="text-xs text-slate-500">কালেক্টর: <strong>{sample.collector}</strong></p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-xs font-bold text-slate-700">ফি: ৳{sample.fee} ({sample.payment_status})</div>
                    <button
                      onClick={() => {
                        setHomeSamples(prev => prev.map(s => s.id === sample.id ? { ...s, status: 'Received at Lab' } : s));
                        alert('স্যাম্পল ল্যাবে পৌঁছানো নিশ্চিত করা হয়েছে!');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                    >
                      ল্যাবে জমা নিন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEDICINE DELIVERY */}
      {activeSubTab === 'medicine_delivery' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">হোম মেডিসিন ডেলিভারি ও রাইডার ট্র্যাকিং (Medicine Delivery)</h2>
              <p className="text-slate-500 text-xs">ফার্মেসি বিক্রয় থেকে সরাসরি হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি (COD) সেটেলমেন্ট</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicineDeliveries.map(del => (
              <div key={del.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                    {del.id}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    {del.delivery_status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base">{del.patient_name}</h3>
                  <p className="text-xs text-slate-600">ফোন: {del.phone} | ঠিকানা: {del.address}</p>
                  <p className="text-xs text-slate-700 mt-1">আইটেম: <strong>{del.items_summary}</strong></p>
                  <p className="text-xs text-slate-500">রাইডার: <strong>{del.rider}</strong></p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">COD প্রদেয়: </span>
                    <strong className="text-rose-600 font-bold">৳{del.cod_amount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ডেলিভারি OTP: </span>
                    <strong className="font-mono bg-slate-100 px-2 py-0.5 rounded text-indigo-700">{del.otp}</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setMedicineDeliveries(prev => prev.map(d => d.id === del.id ? { ...d, delivery_status: 'Delivered' } : d));
                      alert('ডেলিভারি সম্পন্ন ও ক্যাশ সেটেলমেন্ট গৃহীত হয়েছে!');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm"
                  >
                    ✓ ডেলিভারি নিশ্চিত করুন (COD Received)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL PARTNER LABS */}
      {activeSubTab === 'referral_lab' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">রেফারেল পার্টনার ল্যাবরেটরি ম্যানেজমেন্ট (Partner Labs)</h2>
              <p className="text-slate-500 text-xs">বাইরে পাঠানো বিশেষায়িত টেস্ট (PCR, জেনেটিক্স, বায়োপসি) ট্র্যাকিং ও বিলিং</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">রেফারেল আইডি</th>
                  <th className="p-3">পার্টনার ল্যাব</th>
                  <th className="p-3">রোগীর নাম</th>
                  <th className="p-3">টেস্টের নাম</th>
                  <th className="p-3">কুরিয়ার ট্র্যাকিং</th>
                  <th className="p-3">পাঠানোর তারিখ</th>
                  <th className="p-3">পার্টনার খরচ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referralLabs.map(lab => (
                  <tr key={lab.ref_id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-indigo-700">{lab.ref_id}</td>
                    <td className="p-3 font-bold text-slate-800">{lab.partner_name}</td>
                    <td className="p-3">{lab.patient_name}</td>
                    <td className="p-3 font-semibold text-slate-700">{lab.test_name}</td>
                    <td className="p-3 font-mono text-slate-500">{lab.courier_tracking}</td>
                    <td className="p-3 text-slate-500">{lab.sent_date}</td>
                    <td className="p-3 font-bold text-slate-900">৳{lab.partner_cost}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        lab.status === 'Report Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lab.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
