import React from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Calendar,
  FileText,
  FlaskConical,
  Pill,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Lock,
  Unlock
} from 'lucide-react';

export const HealthcareDashboard = () => {
  const {
    patients,
    doctors,
    appointments,
    prescriptions,
    labOrders,
    pharmacyMedicines,
    isAdvancedSuiteApproved,
    acceptanceChecklist,
    setActiveHealthcareTab
  } = useHealthcare();

  const waitingAppointments = appointments.filter(a => a.appointment_status === 'Waiting');
  const inConsultation = appointments.filter(a => a.appointment_status === 'In Consultation');
  const pendingLabResults = labOrders.filter(o => o.order_status === 'Sample Pending' || o.order_status === 'Processing');
  const readyReports = labOrders.filter(o => o.order_status === 'Report Ready');

  // Revenue estimation
  const appointmentRevenue = appointments.reduce((sum, a) => sum + (Number(a.paid_amount) || 0), 0);
  const labRevenue = labOrders.reduce((sum, o) => sum + (Number(o.paid_amount) || 0), 0);
  const totalHealthcareRevenue = appointmentRevenue + labRevenue;

  // Near expiry medicines (<= 180 days)
  const nearExpiryMedicines = pharmacyMedicines.filter(m => {
    return m.batches?.some(b => {
      const expDate = new Date(b.expiry_date);
      const diffMonths = (expDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
      return diffMonths <= 6;
    });
  });

  const completedChecklistCount = acceptanceChecklist ? acceptanceChecklist.filter(c => c.completed).length : 0;
  const checklistPercent = acceptanceChecklist ? Math.round((completedChecklistCount / acceptanceChecklist.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 4 Premium Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-teal-50/40 border border-teal-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-teal-500/10 text-teal-600 rounded-2xl">
              <Users size={22} />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full flex items-center gap-1">
              <TrendingUp size={11} /> +১২% বৃদ্ধি
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{patients.length} জন</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">নিবন্ধিত রোগী (Registered Patients)</div>
          </div>
          <button
            onClick={() => setActiveHealthcareTab('patients')}
            className="pt-2 border-t border-slate-100 text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center justify-between"
          >
            <span>রোগী প্রোফাইল দেখুন</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-blue-50/40 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
              <Calendar size={22} />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {waitingAppointments.length} জন অপেক্ষমাণ
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{appointments.length} টি</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">আজকের অ্যাপয়েন্টমেন্ট (Appointments)</div>
          </div>
          <button
            onClick={() => setActiveHealthcareTab('doctor_rx')}
            className="pt-2 border-t border-slate-100 text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center justify-between"
          >
            <span>টোকেন কিউ পরিচালনা</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-purple-50/40 border border-purple-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl">
              <FlaskConical size={22} />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
              {readyReports.length} রিপোর্ট প্রস্তুত
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{labOrders.length} টি</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">ডায়াগনস্টিক ল্যাব অর্ডার (LIMS Orders)</div>
          </div>
          <button
            onClick={() => setActiveHealthcareTab('lims_lab')}
            className="pt-2 border-t border-slate-100 text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center justify-between"
          >
            <span>ল্যাব ওয়ার্কলিস্ট দেখুন</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Activity size={22} />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              আজকের ক্যাশ
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-700 font-mono">৳{totalHealthcareRevenue}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">হেলথকেয়ার রাজস্ব (Total Healthcare Revenue)</div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>কনসালটেশন: ৳{appointmentRevenue}</span>
            <span>ল্যাব: ৳{labRevenue}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Active Doctor Queue + LIMS Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Doctor Token Queue */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Stethoscope size={18} className="text-emerald-600" />
                <span>লাইভ ডক্টর কনসালটেশন কিউ (Live Chamber Queue)</span>
              </h2>
              <p className="text-xs text-slate-500">চেম্বারের লাইভ টোকেন স্ট্যাটাস ও পরামর্শরত রোগী</p>
            </div>
            <button
              onClick={() => setActiveHealthcareTab('doctor_rx')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>সকল দেখুন</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {appointments.slice(0, 4).map(apt => (
              <div
                key={apt.appointment_id}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-emerald-700 shadow-sm">
                    {apt.token_number}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{apt.patient_name}</h3>
                    <p className="text-[11px] text-slate-500">আইডি: {apt.patient_id} | ডাক্তার: {apt.doctor_name || 'Dr. Tanvir Ahmed'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                    apt.appointment_status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : apt.appointment_status === 'In Consultation'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {apt.appointment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Section 24 Acceptance Checklist Progress Banner */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold flex items-center gap-1.5 text-teal-300">
                <ShieldCheck size={16} />
                প্রোডাকশন কমপ্লায়েন্স ও গো-লাইভ প্রস্তুতি
              </span>
              <span className="font-mono font-bold text-emerald-400">{checklistPercent}% সম্পন্ন</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-300 pt-1">
              <span>{completedChecklistCount} / {acceptanceChecklist.length} আইটেম ভেরিফাইড</span>
              <button
                onClick={() => setActiveHealthcareTab('compliance_suite')}
                className="text-teal-300 font-bold hover:underline"
              >
                চেকলিস্ট দেখুন →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: LIMS Pipeline & Pharmacy Alerts */}
        <div className="lg:col-span-5 space-y-6">
          {/* LIMS Pipeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <FlaskConical size={18} className="text-teal-600" />
                <span>ডায়াগনস্টিক ল্যাব পাইপলাইন</span>
              </h2>
              <span className="text-xs font-mono font-bold text-slate-500">{labOrders.length} টি অর্ডার</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                <div className="text-[10px] text-amber-700 font-bold uppercase">স্যাম্পল পেন্ডিং</div>
                <div className="text-xl font-black text-amber-900 font-mono">
                  {labOrders.filter(o => o.order_status === 'Sample Pending').length}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1">
                <div className="text-[10px] text-blue-700 font-bold uppercase">প্রক্রিয়াধীন (Lab)</div>
                <div className="text-xl font-black text-blue-900 font-mono">
                  {labOrders.filter(o => o.order_status === 'Processing' || o.order_status === 'Result Entered').length}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                <div className="text-[10px] text-emerald-700 font-bold uppercase">রিপোর্ট প্রস্তুত</div>
                <div className="text-xl font-black text-emerald-900 font-mono">
                  {readyReports.length}
                </div>
              </div>
            </div>
          </div>

          {/* Pharmacy FEFO Expiry Alerts */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Pill size={18} className="text-rose-600" />
                <span>ফার্মেসি FEFO মেয়াদ সতর্কতা ({nearExpiryMedicines.length})</span>
              </h2>
              <button
                onClick={() => setActiveHealthcareTab('pharmacy')}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                ফার্মেসি যান
              </button>
            </div>

            <div className="space-y-2">
              {nearExpiryMedicines.slice(0, 3).map(med => (
                <div
                  key={med.medicine_id}
                  className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/70 text-xs flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-slate-800">{med.brand_name}</h3>
                    <p className="text-[11px] text-slate-500">{med.generic_name} ({med.manufacturer})</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded-md">
                    FEFO সতর্কতা
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
