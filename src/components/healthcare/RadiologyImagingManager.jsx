import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { generateHealthcareId } from '../../services/healthcareIdService';

const INITIAL_IMAGING_SERVICES = [
  { id: 'IMG-001', modality: 'USG', name: 'USG of Whole Abdomen with PVR', body_part: 'Abdomen', price: 1500, tat: '2 Hours' },
  { id: 'IMG-002', modality: 'USG', name: 'USG of Pregnancy Profile (Anomaly)', body_part: 'Pelvis', price: 2000, tat: '2 Hours' },
  { id: 'IMG-003', modality: 'X-Ray', name: 'X-Ray Chest P/A View (Digital)', body_part: 'Chest', price: 700, tat: '1 Hour' },
  { id: 'IMG-004', modality: 'X-Ray', name: 'X-Ray Lumbo-Sacral Spine B/V', body_part: 'Spine', price: 1200, tat: '2 Hours' },
  { id: 'IMG-005', modality: 'ECG', name: '12-Lead Digital ECG with Rhythm Strip', body_part: 'Heart', price: 500, tat: '30 Mins' },
  { id: 'IMG-006', modality: 'Echo', name: '2D Color Doppler Echocardiogram', body_part: 'Cardiovascular', price: 3000, tat: '4 Hours' }
];

export default function RadiologyImagingManager() {
  const { patients, doctors } = useHealthcare();
  const [activeModality, setActiveModality] = useState('All');
  const [imagingOrders, setImagingOrders] = useState([
    {
      order_id: 'IMG-ORD-20261001-0001',
      patient_id: 'PT-000001',
      patient_name: 'আব্দুল করিম (Abdul Karim)',
      patient_age: '৪৫ বছর',
      service_name: 'USG of Whole Abdomen with PVR',
      modality: 'USG',
      doctor_name: 'Dr. Md. Rafiqul Islam',
      status: 'Pending Report', // 'Pending Scan' | 'Pending Report' | 'Verified'
      findings: 'Liver is normal in size and echotexture. Gall bladder is well distended, wall thickness normal. No calculus or mass lesion. Kidneys, Spleen and Pancreas appear unremarkable. PVR is insignificant.',
      impression: 'Normal study of Whole Abdomen.',
      recommendation: 'Clinical correlation recommended.',
      radiologist: 'Prof. Dr. Shamsul Huda, DMRD (Radiologist)',
      date: '2026-10-01 11:30 AM'
    },
    {
      order_id: 'IMG-ORD-20261001-0002',
      patient_id: 'PT-000002',
      patient_name: 'মোছাঃ নাসরিন আক্তার (Nasrin Akter)',
      patient_age: '৩২ বছর',
      service_name: 'X-Ray Chest P/A View (Digital)',
      modality: 'X-Ray',
      doctor_name: 'Dr. Nusrat Jahan',
      status: 'Verified',
      findings: 'Lung fields are clear. No active parenchymal lesion seen. Both costophrenic angles are clear. Cardiothoracic ratio is within normal limits. Bony thorax intact.',
      impression: 'Normal digital chest radiograph.',
      recommendation: 'Routine follow-up.',
      radiologist: 'Prof. Dr. Shamsul Huda, DMRD (Radiologist)',
      date: '2026-10-01 09:15 AM'
    }
  ]);

  const [selectedOrderForReport, setSelectedOrderForReport] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  // New Booking State
  const [newPatientId, setNewPatientId] = useState('');
  const [newServiceId, setNewServiceId] = useState(INITIAL_IMAGING_SERVICES[0].id);
  const [newDoctorId, setNewDoctorId] = useState(doctors[0]?.doctor_id || '');

  const modalities = ['All', 'USG', 'X-Ray', 'ECG', 'Echo', 'CT Scan', 'MRI'];

  const handleBookImaging = (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.patient_id === newPatientId);
    if (!patient) {
      alert('রোগী নির্বাচন করুন');
      return;
    }
    const service = INITIAL_IMAGING_SERVICES.find(s => s.id === newServiceId);
    const doctor = doctors.find(d => d.doctor_id === newDoctorId);

    const newOrder = {
      order_id: `IMG-ORD-20261001-${String(imagingOrders.length + 1).padStart(4, '0')}`,
      patient_id: patient.patient_id,
      patient_name: patient.full_name,
      patient_age: `${patient.calculated_age} ${patient.age_unit}`,
      service_name: service.name,
      modality: service.modality,
      doctor_name: doctor ? doctor.doctor_name : 'Walk-in Referral',
      status: 'Pending Scan',
      findings: '',
      impression: '',
      recommendation: '',
      radiologist: 'Prof. Dr. Shamsul Huda, DMRD (Radiologist)',
      date: new Date().toLocaleString('bn-BD')
    };

    setImagingOrders([newOrder, ...imagingOrders]);
    alert(`ইমেজিং অর্ডার সফলভাবে বুক করা হয়েছে! আইডি: ${newOrder.order_id}`);
    setNewPatientId('');
  };

  const handleSaveReport = (findings, impression, recommendation) => {
    setImagingOrders(prev => prev.map(o => {
      if (o.order_id === selectedOrderForReport.order_id) {
        return {
          ...o,
          findings,
          impression,
          recommendation,
          status: 'Verified'
        };
      }
      return o;
    }));
    setSelectedOrderForReport(null);
  };

  const filteredOrders = imagingOrders.filter(o =>
    activeModality === 'All' ? true : o.modality === activeModality
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xl">🩻</span>
            <h1 className="text-2xl font-bold text-slate-800">রেডিওলজি ও মেডিকেল ইমেজিং (Radiology & Imaging Workflow)</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            এক্স-রে, আল্ট্রাসনোগ্রাফি, ইসিজি, ইকোকার্ডিওগ্রাফি এবং সিটি স্ক্যান রিপোর্টিং ও ভেরিফিকেশন সিস্টেম
          </p>
        </div>

        {/* Modality Filter */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto text-xs">
          {modalities.map(m => (
            <button
              key={m}
              onClick={() => setActiveModality(m)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                activeModality === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: New Booking */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-fit">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>📅</span> নতুন ইমেজিং বুকিং (New Imaging Order)
          </h2>

          <form onSubmit={handleBookImaging} className="space-y-3 text-xs">
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
              <label className="block text-slate-600 font-medium mb-1">ইমেজিং সেবা:</label>
              <select
                value={newServiceId}
                onChange={e => setNewServiceId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {INITIAL_IMAGING_SERVICES.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.modality}] {s.name} - ৳{s.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">রেফার করা ডাক্তার:</label>
              <select
                value={newDoctorId}
                onChange={e => setNewDoctorId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {doctors.map(d => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    {d.doctor_name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all mt-2"
            >
              + ইমেজিং অর্ডার নিশ্চিত করুন
            </button>
          </form>

          {/* Imaging Services Price List */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-700 text-xs mb-2">সেবাসমূহ ও টেস্ট ফি:</h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              {INITIAL_IMAGING_SERVICES.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                  <span className="truncate pr-2 font-medium">{s.name}</span>
                  <span className="font-bold text-slate-800 shrink-0">৳{s.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Orders & Worklist */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">
              ইমেজিং ওয়ার্কলিস্ট ও রিপোর্ট ম্যানেজমেন্ট ({filteredOrders.length})
            </h2>
          </div>

          <div className="space-y-3">
            {filteredOrders.map(order => (
              <div
                key={order.order_id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                      {order.order_id}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                      {order.modality}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      order.status === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'Pending Report'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base">{order.service_name}</h3>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>রোগী: <strong>{order.patient_name}</strong> ({order.patient_age})</span>
                    <span>রেফারেল: {order.doctor_name}</span>
                    <span>তারিখ: {order.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.status !== 'Verified' ? (
                    <button
                      onClick={() => setSelectedOrderForReport(order)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      📝 রিপোর্ট লিখুন
                    </button>
                  ) : (
                    <button
                      onClick={() => setPreviewReport(order)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      🖨️ A4 প্রিন্ট প্রিভিউ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Entry Modal */}
      {selectedOrderForReport && (
        <ReportEditorModal
          order={selectedOrderForReport}
          onClose={() => setSelectedOrderForReport(null)}
          onSave={handleSaveReport}
        />
      )}

      {/* A4 Printable Report Modal */}
      {previewReport && (
        <A4RadiologyReportModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
}

function ReportEditorModal({ order, onClose, onSave }) {
  const [findings, setFindings] = useState(order.findings || '');
  const [impression, setImpression] = useState(order.impression || '');
  const [recommendation, setRecommendation] = useState(order.recommendation || '');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-start pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg text-slate-800">রেডিওলজি রিপোর্ট এন্ট্রি (Radiologist Findings)</h3>
            <p className="text-xs text-slate-500">{order.service_name} | {order.patient_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">ফাইন্ডিংস (Findings):</label>
            <textarea
              rows={5}
              value={findings}
              onChange={e => setFindings(e.target.value)}
              placeholder="অঙ্গপ্রত্যঙ্গের স্বাভাবিক ও অস্বাভাবিক বিবরণ লিখুন..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">ইম্প্রেশন / চূড়ান্ত সিদ্ধান্ত (Impression):</label>
            <textarea
              rows={2}
              value={impression}
              onChange={e => setImpression(e.target.value)}
              placeholder="প্রধান রোগ বা স্বাভাবিক অবস্থা..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">পরামর্শ (Recommendation):</label>
            <input
              type="text"
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              placeholder="ক্লিনিক্যাল কো-রিলেশন বা ফলো-আপ..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            বাতিল
          </button>
          <button
            onClick={() => onSave(findings, impression, recommendation)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
          >
            ✓ রিপোর্ট অনুমোদন ও সাইন করুন
          </button>
        </div>
      </div>
    </div>
  );
}

function A4RadiologyReportModal({ report, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start pb-4 border-b-2 border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">হিসাবকিতাব ৩৬০ ডিজিটাল ডায়াগনস্টিক অ্যান্ড ইমেজিং</h1>
            <p className="text-xs text-slate-600">বাড়ি # ১২, রোড # ৪, ধানমন্ডি, ঢাকা-১২০৫ | ফোন: +880 1800 000000</p>
            <p className="text-xs font-semibold text-blue-700 mt-1">রেডিওলজি ও ইমেজিং বিভাগ (Department of Radiology & Imaging)</p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] font-mono text-center">
              QR CODE<br/>VERIFIED
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <div>
            <div>রোগীর নাম: <strong className="text-slate-900">{report.patient_name}</strong></div>
            <div>রোগী আইডি: <strong className="font-mono">{report.patient_id}</strong></div>
            <div>বয়স: {report.patient_age}</div>
          </div>
          <div>
            <div>অর্ডার আইডি: <strong className="font-mono">{report.order_id}</strong></div>
            <div>রেফারেল ডাক্তার: <strong>{report.doctor_name}</strong></div>
            <div>রিপোর্ট প্রকাশের তারিখ: {report.date}</div>
          </div>
        </div>

        {/* Test Name Header */}
        <div className="text-center py-2 border-y border-slate-300">
          <h2 className="text-lg font-bold text-slate-900 underline underline-offset-4">{report.service_name}</h2>
        </div>

        {/* Clinical Report Content */}
        <div className="space-y-4 text-xs text-slate-800 leading-relaxed min-h-[220px]">
          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">FINDINGS:</h3>
            <p className="whitespace-pre-line bg-slate-50/50 p-3 rounded-lg border border-slate-100">{report.findings}</p>
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">IMPRESSION:</h3>
            <p className="font-bold text-slate-900 p-2.5 bg-blue-50/40 rounded-lg border border-blue-100">{report.impression}</p>
          </div>

          {report.recommendation && (
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">RECOMMENDATION:</h3>
              <p className="italic text-slate-600">{report.recommendation}</p>
            </div>
          )}
        </div>

        {/* Signature & Disclaimer */}
        <div className="pt-8 border-t border-slate-300 flex justify-between items-end">
          <div className="text-[10px] text-slate-400">
            * এটি একটি কম্পিউটারাইজড স্বাক্ষরিত মেডিকেল রিপোর্ট।<br/>
            যে কোনো প্রয়োজনে আপনার চিকিৎসকের সাথে পরামর্শ করুন।
          </div>
          <div className="text-right text-xs">
            <div className="font-serif italic text-base text-blue-900 font-bold mb-1">Signed Digitally</div>
            <div className="font-bold text-slate-900">{report.radiologist}</div>
            <div className="text-slate-500 text-[11px]">কনসালট্যান্ট রেডিওলজিস্ট</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
          >
            🖨️ প্রিন্ট করুন (A4 Print)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
