"use client";
import React, { useState } from "react";
import { useWealthStore } from "@/store/useWealthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Cpu, ShieldCheck, Landmark, TrendingUp } from "lucide-react";

export default function ComprehensiveRegisterPage() {
  const { triggerToast } = useWealthStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Core Identity Hooks
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Downstream Systems Hooks
  const [equityId, setEquityId] = useState("");
  const [dematAccount, setDematAccount] = useState("");
  const [mfRef, setMfRef] = useState("");
  const [folioNumber, setFolioNumber] = useState("");

  const handleRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Direct variable mapping providing double context compatibility arrays
      const payload = {
        fullName: fullName.trim(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        panNumber: panNumber.trim().toUpperCase(),
        pan_number: panNumber.trim().toUpperCase(),
        equityId: equityId.trim(),
        equity_id: equityId.trim(),
        investorId: equityId.trim(),
        investor_id: equityId.trim(),
        dematAccount: dematAccount.trim().toUpperCase(),
        demat_account: dematAccount.trim().toUpperCase(),
        mfRef: mfRef.trim(),
        mf_ref: mfRef.trim(),
        customerRef: mfRef.trim(),
        customer_ref: mfRef.trim(),
        folioNumber: folioNumber.trim().toUpperCase(),
        folio_number: folioNumber.trim().toUpperCase()
      };

      // 🌐 DIRECT CALL: Targets Port 5002 directly to verify requests in your network tab
      const res = await fetch("http://localhost:5002/api/v1/core/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Onboarding database configuration parameter error.");
      }

      triggerToast("Integrated profiles initialized successfully.", "success");
      router.push("/login");
    } catch (err: any) {
      triggerToast(err.message, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 sm:p-8 selection:bg-blue-500/30">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
        
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-12 h-12 bg-blue-950/70 border border-blue-900/60 rounded-2xl flex items-center justify-center text-blue-400"><UserPlus className="w-6 h-6" /></div>
          <h2>Investor Structural Onboarding</h2>
          <p className="text-sub">Fulfills baseline database validation attributes across all downstream systems simultaneously.</p>
        </div>

        <form onSubmit={handleRegisterFormSubmit} className="space-y-6">
          {/* Section 1: Main Credentials */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" /> 1. Central Profile Space
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" required placeholder="Legal Name" value={fullName} onChange={e => setFullName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 outline-none" />
              <input type="email" required placeholder="Account Email Endpoint" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="password" required placeholder="Choose Account Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 outline-none" />
              <input type="text" required placeholder="Permanent Account Number (PAN)" value={panNumber} onChange={e => setPanNumber(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 uppercase font-mono tracking-wider outline-none" />
            </div>
          </div>

          {/* Section 2: Brokerage Mapping */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> 2. Server 1 Equity Brokerage Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" required placeholder="Investor ID (e.g., INV1001)" value={equityId} onChange={e => setEquityId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 outline-none" />
              <input type="text" required placeholder="Demat Account Registry Number" value={dematAccount} onChange={e => setDematAccount(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 uppercase font-mono tracking-wider outline-none" />
            </div>
          </div>

          {/* Section 3: Mutual Funds Mapping */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <Landmark className="w-4 h-4 text-purple-500" /> 3. Server 2 Mutual Fund Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" required placeholder="Customer Reference (e.g., CUST-1001)" value={mfRef} onChange={e => setMfRef(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 outline-none" />
              <input type="text" required placeholder="Mutual Fund Asset Folio Number" value={folioNumber} onChange={e => setFolioNumber(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:border-blue-500 uppercase font-mono tracking-wider outline-none" />
            </div>
          </div>

          {/* Action Trigger Submit Button */}
          <button type="submit" disabled={submitting} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-xl cursor-pointer">
            {submitting ? "Processing Transaction Profiles..." : "Provision Synchronized Wealth Profile"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already mapped? <Link href="/login" className="text-blue-400 hover:underline font-bold">Launch connection session</Link>
        </div>
      </div>
    </main>
  );
}