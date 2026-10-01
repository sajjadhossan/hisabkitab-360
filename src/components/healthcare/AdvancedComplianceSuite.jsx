import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Search,
  Plus,
  Users,
  Building,
  Trash2,
  Box,
  TrendingUp,
  Headphones,
  CheckSquare,
  Award,
  Zap,
  Info
} from 'lucide-react';

export default function AdvancedComplianceSuite() {
  const {
    isAdvancedSuiteApproved,
    approvalAudit,
    approveAdvancedSuite,
    revokeAdvancedSuite,
    lqmsObjectives,
    controlledSops,
    incidentsLog,
    capaRisks,
    biomedicalWaste,
    labConsumables,
    insuranceTpa,
    callCenterTickets,
    acceptanceChecklist,
    toggleChecklistItem
  } = useHealthcare();

  const [activeSubTab, setActiveSubTab] = useState('lqms'); // 'lqms' | 'sops' | 'incidents' | 'biosafety' | 'consumables' | 'insurance' | 'tickets' | 'bi' | 'checklist'
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [adminName, setAdminName] = useState('সুপার অ্যাডমিন (Super Admin)');
  const [approvalNotes, setApprovalNotes] = useState('ক্লিনিক্যাল কমপ্লায়েন্স ও কোয়ালিটি স্ট্যান্ডার্ড রিভিউ করে প্রোডাকশন অনুমোদন দেওয়া হলো।');

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    approveAdvancedSuite(adminName, approvalNotes);
    setShowApprovalModal(false);
  };

  const completedChecklistCount = acceptanceChecklist.filter(c => c.completed).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Template Status & Admin Approval */}
      <div className={`rounded-3xl p-6 shadow-xl border relative overflow-hidden transition-all duration-300 ${
        isAdvancedSuiteApproved
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/30'
          : 'bg-gradient-to-r from-amber-900/90 via-slate-900 to-indigo-950 text-white border-amber-500/30'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${
                isAdvancedSuiteApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isAdvancedSuiteApproved ? <Unlock size={13} /> : <Lock size={13} />}
                {isAdvancedSuiteApproved ? 'অ্যাডমিন অনুমোদিত ও সক্রিয় (Live Active)' : 'টেমপ্লেট মোড: অ্যাডমিন অনুমোদন অপেক্ষমাণ (Template Mode)'}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Section 24: Enterprise LQMS & Compliance
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              {isAdvancedSuiteApproved ? '✅ কোয়ালিটি ম্যানেজমেন্ট ও কমপ্লায়েন্স স্যুট' : '🔒 অ্যাডভান্সড কোয়ালিটি ও অপারেশনাল টেমপ্লেট'}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
              {isAdvancedSuiteApproved
                ? `সিস্টেমটি সম্পূর্ণ সক্রিয়। অনুমোদক: ${approvalAudit?.approved_by || 'Super Admin'} (${approvalAudit?.approved_at || 'Verified'})। সকল ১৮টি অ্যাডভান্সড মডিউল লাইভ অপারেশনে সংযুক্ত।`
                : 'এই মডিউলে ল্যাব কোয়ালিটি (LQMS), এসওপি কন্ট্রোল, মেথড ভ্যালিডেশন, ইনসিডেন্ট ও CAPA, বায়োসেফটি, কনজিউমেবলস, ইনস্যুরেন্স ও গো-লাইভ চেকলিস্ট প্রস্তুত রয়েছে। অ্যাডমিন অনুমোদন দিলে এটি লাইভ অপারেশনে আসবে।'}
            </p>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {!isAdvancedSuiteApproved ? (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all text-xs flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                <span>🛡️ অ্যাডমিন অনুমোদন দিন ও চালু করুন</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm('আপনি কি এই অ্যাডভান্সড মডিউলগুলো পুনরায় ড্রাফট/টেমপ্লেট মোডে ফিরিয়ে নিতে চান?')) {
                    revokeAdvancedSuite();
                  }
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-xl text-xs font-semibold"
              >
                লক / টেমপ্লেটে রূপান্তর
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Sub-Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        {[
          { id: 'lqms', label: '🎯 LQMS কোয়ালিটি অবজেক্টিভস' },
          { id: 'sops', label: '📑 এসওপি ও ডকুমেন্ট কন্ট্রোল' },
          { id: 'incidents', label: '⚠️ ইনসিডেন্ট ও CAPA ঝুঁকি' },
          { id: 'biosafety', label: '☣️ বায়োসেফটি ও বর্জ্য' },
          { id: 'consumables', label: '📦 ল্যাব কনজিউমেবলস' },
          { id: 'insurance', label: '🏢 ইনস্যুরেন্স ও TPA' },
          { id: 'tickets', label: '🎧 সাপোর্ট ও হেল্পডেস্ক' },
          { id: 'bi', label: '📈 এআই প্রেডিক্টিভ অ্যানালিটিক্স' },
          { id: 'checklist', label: `✅ গো-লাইভ চেকলিস্ট (${completedChecklistCount}/${acceptanceChecklist.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white shadow-md font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: LQMS QUALITY OBJECTIVES */}
      {activeSubTab === 'lqms' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>🎯</span> ল্যাব কোয়ালিটি ম্যানেজমেন্ট সিস্টেম (LQMS Quality Objectives)
              </h2>
              <p className="text-xs text-slate-500">পরিমাপযোগ্য কোয়ালিটি সূচক, নমুনা বাতিল হার হ্রাস ও বেঞ্চমার্ক ট্র্যাকিং</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
              ISO 15189 Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lqmsObjectives.map(obj => (
              <div key={obj.id} className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-slate-500">{obj.id}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                    {obj.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm leading-snug">{obj.title}</h3>
                <div className="text-[11px] text-slate-500">বিভাগ: <strong>{obj.department}</strong></div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">বেসলাইন</div>
                    <div className="font-bold text-slate-700">{obj.baseline_value}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-600 font-bold">টার্গেট</div>
                    <div className="font-bold text-emerald-700">{obj.target_value}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-600 font-bold">বর্তমান</div>
                    <div className="font-bold text-blue-800">{obj.current_value}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1">
                  <strong>অ্যাকশন প্ল্যান:</strong> {obj.action_plan}
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
                  <span>দায়িত্বপ্রাপ্ত: {obj.responsible_person}</span>
                  <span>মেয়াদ: {obj.due_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SOP & DOCUMENT CONTROL */}
      {activeSubTab === 'sops' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                এসওপি ও নিয়ন্ত্রিত ডকুমেন্ট রেজিস্টার (Controlled SOPs & Policies)
              </h2>
              <p className="text-xs text-slate-500">অনুমোদিত ভার্সন কন্ট্রোল, রিভিউ সাইকেল ও বিতরণ লগ</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <th className="p-3">ডকুমেন্ট কোড</th>
                  <th className="p-3">ডকুমেন্টের নাম</th>
                  <th className="p-3">টাইপ ও বিভাগ</th>
                  <th className="p-3">ভার্সন</th>
                  <th className="p-3">অনুমোদনকারী</th>
                  <th className="p-3">রিভিউ তারিখ</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {controlledSops.map(doc => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{doc.document_code}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{doc.document_title}</div>
                      <div className="text-[11px] text-slate-400">অ্যাক্সেস: {doc.access_level}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                        {doc.document_type}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{doc.department}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{doc.version_number}</td>
                    <td className="p-3 text-slate-700">{doc.approved_by}</td>
                    <td className="p-3 font-mono text-slate-500">{doc.review_date}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                        {doc.document_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INCIDENTS, OCCURRENCE & CAPA */}
      {activeSubTab === 'incidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Incident Log */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span>⚠️</span> সাম্প্রতিক ইনসিডেন্ট ও ত্রুটি লগ (Incident Management)
            </h2>

            <div className="space-y-3">
              {incidentsLog.map(inc => (
                <div key={inc.incident_id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-slate-500">{inc.incident_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inc.severity === 'Minor' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {inc.severity}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm">{inc.incident_type}</h3>
                  <p className="text-xs text-slate-600">{inc.description}</p>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <div><strong>মূল কারণ (Root Cause):</strong> {inc.root_cause}</div>
                    <div className="text-emerald-700"><strong>সংশোধনমূলক ব্যবস্থা (CAPA):</strong> {inc.corrective_action}</div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                    <span>রিপোর্টকারী: {inc.reported_by}</span>
                    <span>স্ট্যাটাস: <strong className="text-emerald-700">{inc.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: CAPA & Risk Assessment */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <span>🛡️</span> প্রসেস ঝুঁকি নিরুপণ (Risk Assessment Matrix)
            </h2>

            <div className="space-y-3">
              {capaRisks.map(rsk => (
                <div key={rsk.risk_id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {rsk.risk_id}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm mt-1">{rsk.process_name}</h3>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">রিস্ক স্কোর</div>
                      <div className="text-base font-black text-rose-600">{rsk.risk_score} (L{rsk.likelihood} × I{rsk.impact})</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{rsk.risk_description}</p>
                  <div className="p-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs">
                    <strong>বর্তমান নিয়ন্ত্রণ ব্যবস্থা:</strong> {rsk.existing_control}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BIOSAFETY & BIOMEDICAL WASTE */}
      {activeSubTab === 'biosafety' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                বায়োমেডিকেল বর্জ্য ও ফ্যাসিলিটি সেফটি (Biomedical Waste & Facility Biosafety)
              </h2>
              <p className="text-xs text-slate-500">ধারালো ও সংক্রামক বর্জ্য পৃথকীকরণ, ভেন্ডর হ্যান্ডওভার ও অগ্নিনির্বাপক নজরদারি</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {biomedicalWaste.map(w => (
              <div key={w.waste_id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {w.waste_id}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border">
                    {w.quantity_kg}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm">{w.category}</h3>
                <div className="text-xs text-slate-600">উৎস: <strong>{w.department}</strong></div>
                <div className="text-xs text-slate-600">কন্টেইনার: {w.container}</div>
                <div className="text-xs text-slate-600">ডিসপোজাল ভেন্ডর: {w.disposal_vendor}</div>
                <div className="text-xs text-emerald-700 font-semibold">পদ্ধতি: {w.disposal_method}</div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{w.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONSUMABLES INVENTORY */}
      {activeSubTab === 'consumables' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                ল্যাবরেটরি কনজিউমেবলস ও টিউব ইনভেন্টরি (Lab Consumables & Reagents)
              </h2>
              <p className="text-xs text-slate-500">ভ্যাকুটেইনার, গ্লাভস, স্লাইড ও প্রিন্টিং পেপার রোল ট্র্যাকিং</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <th className="p-3">কোড</th>
                  <th className="p-3">আইটেম নাম ও ব্র্যান্ড</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">বর্তমান স্টক</th>
                  <th className="p-3">রি-অর্ডার লেভেল</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labConsumables.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-700">{item.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400">ব্র্যান্ড: {item.brand}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-600">{item.category}</td>
                    <td className="p-3 font-bold text-slate-900">{item.current_stock} {item.unit}</td>
                    <td className="p-3 font-mono text-slate-500">{item.reorder_level} {item.unit}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.status === 'Low Stock' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: INSURANCE & TPA */}
      {activeSubTab === 'insurance' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                ইন্স্যুরেন্স, টিপিএ ও ক্লেইম ম্যানেজমেন্ট (Insurance & TPA Claims)
              </h2>
              <p className="text-xs text-slate-500">কর্পোরেট স্বাস্থ্যবীমা প্রোভাইডার, ক্রেডিট লিমিট ও সরাসরি ক্লেইম সেটেলমেন্ট</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insuranceTpa.map(ins => (
              <div key={ins.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {ins.id}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {ins.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-base">{ins.company_name}</h3>
                <div className="text-xs text-slate-600">TPA পার্টনার: <strong>{ins.tpa_name}</strong></div>
                <div className="text-xs text-slate-600">যোগাযোগ: {ins.contact_person} ({ins.mobile})</div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400">ক্রেডিট সীমা: </span>
                    <strong className="text-slate-900 font-bold">{ins.credit_limit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">পেমেন্ট টার্ম: </span>
                    <strong className="text-slate-900 font-bold">{ins.payment_terms}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CALL CENTER & TICKETS */}
      {activeSubTab === 'tickets' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                কল সেন্টার, সাপোর্ট ও পেশেন্ট টিকিট (Patient Support & Tickets)
              </h2>
              <p className="text-xs text-slate-500">রোগীর অভিযোগ, রিপোর্ট বিলম্ব ও হোম কালেকশন সাপোর্ট হেল্পডেস্ক</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {callCenterTickets.map(tck => (
              <div key={tck.ticket_id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {tck.ticket_id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    tck.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {tck.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm">{tck.patient_name}</h3>
                <div className="text-xs text-slate-500">ফোন: {tck.phone} | টাইপ: <strong>{tck.type}</strong></div>
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  {tck.description}
                </p>

                {tck.resolution && (
                  <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                    <strong>সমাধান:</strong> {tck.resolution}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: BI & ADVISORY FORECASTING */}
      {activeSubTab === 'bi' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>📈</span> অ্যাডভান্সড বিজনেস ইন্টেলিজেন্স ও প্রেডিক্টিভ ফোরকাস্টিং
              </h2>
              <p className="text-xs text-slate-500">রোগীর বৃদ্ধি, রিএজেন্ট রিঅর্ডার পূর্বাভাস ও বিভাগীয় লাভ-ক্ষতি</p>
            </div>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl">
              * অ্যাডভাইজরি অ্যালগরিদম ভিত্তিক
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">মাসিক রাজস্ব পূর্বাভাস</span>
              <div className="text-2xl font-black text-emerald-700">৳১৪,৫০,০০০</div>
              <p className="text-xs text-slate-600">গত ৩ মাসের ট্রেন্ড অনুযায়ী চলতি মাসে সম্ভাব্য ১০% রাজস্ব বৃদ্ধি সূচক।</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 space-y-2">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">রিএজেন্ট রি-অর্ডার প্রস্তাবনা</span>
              <div className="text-2xl font-black text-blue-700">৩টি রিএজেন্ট</div>
              <p className="text-xs text-slate-600">CBC Diluent ও Glucose রিএজেন্ট আগামী ১০ দিনের মধ্যে রিঅর্ডার প্রয়োজন।</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 space-y-2">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">রোগী আগমন পূর্বাভাস</span>
              <div className="text-2xl font-black text-purple-700">১,২০০+ জন</div>
              <p className="text-xs text-slate-600">শুক্রবার ও শনিবার ডক্টরস চেম্বার ও ডায়াগনস্টিক্সে পিক লোড প্রত্যাশিত।</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: GO-LIVE ACCEPTANCE CHECKLIST */}
      {activeSubTab === 'checklist' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>✅</span> ফাইনাল প্রোডাকশন গো-লাইভ অ্যাকসেপ্টেন্স চেকলিস্ট (Section 24.18)
              </h2>
              <p className="text-xs text-slate-500">প্রোডাকশন উদ্বোধনের পূর্বে যাচাইযোগ্য ৩৩টি গুরুত্বপূর্ণ কারিগরি ও আইনি কমপ্লায়েন্স আইটেম</p>
            </div>
            <div className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-black rounded-xl text-xs">
              অগ্রগতি: {completedChecklistCount} / {acceptanceChecklist.length} ({(completedChecklistCount / acceptanceChecklist.length * 100).toFixed(0)}%)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {acceptanceChecklist.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  item.completed
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                  item.completed ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300'
                }`}>
                  {item.completed && '✓'}
                </div>
                <div className="text-xs space-y-0.5">
                  <div className={`font-bold ${item.completed ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {item.title}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-scale-up">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">অ্যাডমিন অনুমোদন ও সক্রিয়করণ</h3>
                  <p className="text-xs text-slate-500">Section 24 অ্যাডভান্সড কমপ্লায়েন্স মডিউল লাইভ অ্যাক্টিভেশন</p>
                </div>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">অনুমোদনকারী অ্যাডমিন নাম:</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">অনুমোদন নোট / অডিট বিবরণ:</label>
                <textarea
                  rows={3}
                  required
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                ✓ অনুমোদন দিলে LQMS, SOP ডকুমেন্ট কন্ট্রোল, ইনসিডেন্ট ও CAPA, বায়োসেফটি, কনজিউমেবলস ও গো-লাইভ চেকলিস্ট তাৎক্ষণিকভাবে সিস্টেমে লাইভ যুক্ত হবে।
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Check size={16} />
                  <span>অনুমোদন নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
