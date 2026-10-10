import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  Key,
  History,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';

export const StaffSecurityManager = () => {
  const [subTab, setSubTab] = useState('roles'); // 'roles' | 'audit'

  const [roles, setRoles] = useState([
    { id: 'admin', name: 'মালিক / চিফ অ্যাডমিন', usersCount: 2, canEditBills: true, canApproveReports: true, canManageStock: true, discountLimit: 10000 },
    { id: 'doctor', name: 'কনসালটেন্ট ডাক্তার', usersCount: 5, canEditBills: false, canApproveReports: true, canManageStock: false, discountLimit: 0 },
    { id: 'pharmacist', name: 'প্রধান ফার্মাসিস্ট', usersCount: 3, canEditBills: false, canApproveReports: false, canManageStock: true, discountLimit: 500 },
    { id: 'lab_tech', name: 'ল্যাব টেকনোলজিস্ট', usersCount: 4, canEditBills: false, canApproveReports: false, canManageStock: false, discountLimit: 0 },
    { id: 'cashier', name: 'বিলিং ক্যাশিয়ার', usersCount: 2, canEditBills: false, canApproveReports: false, canManageStock: false, discountLimit: 200 },
    { id: 'nurse', name: 'ইনডোর নার্সিং স্টাফ', usersCount: 8, canEditBills: false, canApproveReports: false, canManageStock: false, discountLimit: 0 }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '2026-10-10 03:15 PM', user: 'ডা: রফিকুল ইসলাম', action: 'প্রেসক্রিপশন প্রদান', target: 'UHID-2026-001', details: 'ওষুধ ও টেস্ট অর্ডার যোগ করা হয়েছে' },
    { id: 2, time: '2026-10-10 02:40 PM', user: 'শিফট-২ ক্যাশিয়ার', action: 'বিল গ্রহণ ও পেমেন্ট', target: 'INV-2026-1003', details: '৳৭,৭০০ কার্ড পেমেন্ট ক্লিয়ার্ড' },
    { id: 3, time: '2026-10-10 01:20 PM', user: 'ল্যাব অ্যানালিস্ট', action: 'ল্যাব টেস্ট ভেরিফিকেশন', target: 'LAB-2026-401', details: 'CBC টেস্টের রেজাল্ট ইনপুট ও অনুমোদন' },
    { id: 4, time: '2026-10-10 11:05 AM', user: 'ফার্মাসিস্ট-১', action: 'FEFO স্টক ডিসপেন্স', target: 'MED-NAPA-500', details: 'ব্যাচ B-982 থেকে ১০ পিস ওষুধ বিক্রয়' }
  ]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
              <ShieldCheck size={13} />
              <span>মডিউল ১৪ ও ১৫: ভূমিকাভিত্তিক কর্মী অনুমতি ও অডিট ট্রেইল</span>
            </span>
            <h2 className="text-2xl font-black tracking-tight">কর্মী অনুমতি ও নিরাপত্তা অডিট লগ</h2>
            <p className="text-sm text-indigo-100/80 mt-1">
              ব্যবহারকারীর রোলভিত্তিক পারমিশন, ডিসকাউন্ট লিমিট এবং কে কখন কী পরিবর্তন করেছে তার ডিজিটাল অডিট ট্রেইল।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubTab('roles')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'roles' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              কর্মী রোল ও অনুমতি (RBAC)
            </button>
            <button
              onClick={() => setSubTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'audit' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              নিরাপত্তা অডিট লগ
            </button>
          </div>
        </div>
      </div>

      {subTab === 'roles' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">ব্যবহারকারী ভূমিকা ও অনুমতি ম্যাট্রিক্স</h3>
              <p className="text-xs text-slate-500">প্রতিটি স্টাফের ক্ষমতা ও অ্যাক্সেস কনট্রোল তালিকা</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3">ভূমিকা / রোল</th>
                  <th className="p-3">সক্রিয় স্টাফ</th>
                  <th className="p-3 text-center">বিলিং পরিবর্তন</th>
                  <th className="p-3 text-center">রিপোর্ট অনুমোদন</th>
                  <th className="p-3 text-center">স্টক সমন্বয়</th>
                  <th className="p-3">সর্বোচ্চ ডিসকাউন্ট</th>
                  <th className="p-3 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {roles.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-indigo-900 flex items-center gap-2">
                      <span className="p-1 rounded bg-indigo-50 text-indigo-600"><Key size={13} /></span>
                      <span>{r.name}</span>
                    </td>
                    <td className="p-3">{r.usersCount} জন কর্মী</td>
                    <td className="p-3 text-center">
                      {r.canEditBills ? <span className="text-emerald-600 font-bold">✓ অনুমোদিত</span> : <span className="text-slate-300">✗ নিষেধ</span>}
                    </td>
                    <td className="p-3 text-center">
                      {r.canApproveReports ? <span className="text-emerald-600 font-bold">✓ অনুমোদিত</span> : <span className="text-slate-300">✗ নিষেধ</span>}
                    </td>
                    <td className="p-3 text-center">
                      {r.canManageStock ? <span className="text-emerald-600 font-bold">✓ অনুমোদিত</span> : <span className="text-slate-300">✗ নিষেধ</span>}
                    </td>
                    <td className="p-3 font-bold text-slate-900">৳{r.discountLimit}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        সক্রিয়
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">রিয়েলটাইম সিস্টেম অডিট ট্রেইল (Audit Trail)</h3>
              <p className="text-xs text-slate-500">প্রবেশ, সম্পাদনা, বিল ও প্রেসক্রিপশন পরিবর্তনের ডিজিটাল প্রমাণ</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.user}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-extrabold text-[10px]">{log.action}</span>
                    <span className="font-mono text-indigo-700 text-[11px]">({log.target})</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{log.details}</div>
                </div>
                <div className="text-slate-400 font-mono text-[11px] shrink-0">
                  {log.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSecurityManager;
