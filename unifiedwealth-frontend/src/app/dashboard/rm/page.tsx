"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWealthStore } from "@/store/useWealthStore";
import { Users, Link2, GitCommit, RefreshCw, UserCheck, Shuffle, ShieldAlert } from "lucide-react";

export default function RmMappingControlDesk() {
  const { token } = useAuth();
  const { triggerToast } = useWealthStore();

  // Core API Ingestion States
  const [investorsList, setInvestorsList] = useState<any[]>([]);
  const [opsStaffList, setOpsStaffList] = useState<any[]>([]);
  const [assignmentsLedger, setAssignmentsLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Value Model Hooks
  const [opsUserId, setOpsUserId] = useState("");
  const [investorUserId, setInvestorUserId] = useState("");

  const loadRmOrchestrationData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 🌐 FETCH 1: Gather clean lookup properties arrays
      const metaRes = await fetch("http://localhost:5002/api/v1/core/rm/lookup-meta", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const metaPayload = await metaRes.json();
      if (metaRes.ok && metaPayload.status === "SUCCESS") {
        setInvestorsList(metaPayload.data.investors || []);
        setOpsStaffList(metaPayload.data.opsStaff || []);
      }

      // 🌐 FETCH 2: Gather current structural map matrix rows
      const ledgerRes = await fetch("http://localhost:5002/api/v1/core/rm/assignments-ledger", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const ledgerPayload = await ledgerRes.json();
      if (ledgerRes.ok && ledgerPayload.status === "SUCCESS") {
        setAssignmentsLedger(ledgerPayload.data || []);
      }
    } catch (err: any) {
      triggerToast("Failed to sync orchestration data pipelines.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const executeDelegationMapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opsUserId || !investorUserId) {
      triggerToast("Select an active Operations Engineer and an Investor profile.", "warning");
      return;
    }
    try {
      // 🌐 TARGET ACTION: Direct update submission interceptor
      const res = await fetch("http://localhost:5002/api/v1/core/assign-ops", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ opsUserId, investorUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delegation update statement rejected.");
      
      triggerToast("Investor tracking assignment successfully updated across databases.", "success");
      setInvestorUserId("");
      setOpsUserId("");
      loadRmOrchestrationData(); // Refresh relational matrix view boards instantly
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    }
  };

  const triggerDirectInlineSwap = (invId: string, opsId: string) => {
    setInvestorUserId(invId);
    setOpsUserId(opsId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => { 
    if (token) loadRmOrchestrationData(); 
  }, [token]);

  return (
    <div className="space-y-8 pt-12 md:pt-0">
      <div>
        <h1>Account Lifecycle Delegation Desk</h1>
        <p className="text-sub">Relationship Management Controls for Operations Assignment Mapping</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Dynamic Controls Assignment Dropdown Section */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 space-y-4 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <h4 className="flex items-center gap-2 text-white font-bold"><Users className="text-blue-500 w-4 h-4" /> Mutate Management Vector</h4>
          <p className="text-xs text-sub leading-relaxed">Select active entities to dynamically construct or adjust servicing mapping rules instantly.</p>
          
          <form onSubmit={executeDelegationMapSubmit} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#94A3B8] uppercase block">1. Select Target Investor Profile</label>
              <select 
                required 
                value={investorUserId} 
                onChange={e => setInvestorUserId(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#374151] rounded-xl py-3 px-3 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="">-- Choose Active Investor account --</option>
                {investorsList.map(inv => (
                  <option key={inv.user_id} value={inv.user_id}>
                    {inv.full_name} ({inv.pan_number || "PAN Pending"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#94A3B8] uppercase block">2. Select Servicing Operations Node</label>
              <select 
                required 
                value={opsUserId} 
                onChange={e => setOpsUserId(e.target.value)}
                className="w-full bg-[#0B0F19] border border-[#374151] rounded-xl py-3 px-3 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="">-- Choose Operational Engineer --</option>
                {opsStaffList.map(ops => (
                  <option key={ops.user_id} value={ops.user_id}>
                    {ops.full_name} // {ops.email}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 cursor-pointer">
              <Link2 className="w-4 h-4" /> Bind Operational Management Map
            </button>
          </form>
        </div>

        {/* Real-time Matrix Connections Tracking List View */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#374151] rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 bg-[#1F2937]/30 border-b border-[#374151] flex justify-between items-center select-none">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-emerald-500" /> Live Relationship Assignment Ledger
            </span>
            <button 
              onClick={loadRmOrchestrationData} 
              disabled={loading}
              className="p-2 bg-[#0B0F19] hover:bg-[#1F2937] border border-[#374151] text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0B0F19]/60 text-[#64748B] font-mono text-xs border-b border-[#374151]">
                  <th className="p-4 pl-6">Linked Investor Client</th>
                  <th className="p-4 text-center text-[10px] uppercase">Connection Stream</th>
                  <th className="p-4">Assigned Operations Engineer</th>
                  <th className="p-4 text-center pr-6">Quick Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/40 text-[#CBD5E1]">
                {assignmentsLedger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xs font-mono text-slate-500 uppercase tracking-wider">
                      {loading ? "Re-indexing live database connections..." : "Zero client relationship structures found across tables."}
                    </td>
                  </tr>
                ) : (
                  assignmentsLedger.map((row, i) => (
                    <tr key={row.assignment_id || i} className="hover:bg-[#1F2937]/20 transition-all duration-150">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-white text-xs sm:text-sm">{row.investor_name}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">{row.investor_email}</div>
                      </td>
                      <td className="p-4 text-center font-mono text-xs text-blue-500">
                        <div className="flex items-center justify-center gap-1.5 bg-[#0B0F19] px-2 py-1 rounded-md border border-[#374151]/40 w-fit mx-auto">
                          <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-400">SECURE_LINK</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {row.ops_name ? (
                          <>
                            <div className="font-semibold text-slate-200 text-xs sm:text-sm">{row.ops_name}</div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">{row.ops_email}</div>
                          </>
                        ) : (
                          <span className="text-rose-400 font-mono text-xs font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> UNASSIGNED SECURITY FRAUD ALERT
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center pr-6">
                        <button 
                          onClick={() => triggerDirectInlineSwap(row.investor_user_id, row.ops_user_id || "")}
                          className="px-3 py-1.5 bg-[#1F2937] hover:bg-blue-600 border border-[#374151] hover:border-blue-500 text-slate-300 hover:text-white text-[11px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 mx-auto active:scale-95 cursor-pointer"
                        >
                          <Shuffle className="w-3 h-3" /> Reassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}