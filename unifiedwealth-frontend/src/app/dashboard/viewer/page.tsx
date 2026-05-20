"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWealthStore } from "@/store/useWealthStore";
import { AssetAllocationPie } from "@/components/charts/AssetAllocationPie";
import { PerformanceArea } from "@/components/charts/PerformanceArea";
import { CreditCard, TrendingUp, Landmark, Building2, RefreshCw, Key } from "lucide-react";

export default function ViewerInvestorDashboard() {
  const { token } = useAuth();
  const { portfolioData, setPortfolioData, triggerToast } = useWealthStore();
  const [loading, setLoading] = useState(false);

  // Identity Map Account Linking Form States
  const [panNumber, setPanNumber] = useState("");
  const [equityId, setEquityId] = useState("");
  const [equityPassword, setEquityPassword] = useState("");
  const [mfRef, setMfRef] = useState("");
  const [mfPassword, setMfPassword] = useState("");

  const pullAggregatedWealthDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 🌐 DIRECT CALL: Leverages direct Server 3 pipeline query calls
      const res = await fetch("http://localhost:5002/api/v1/core/portfolio", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || " Downstream timeout.");
      setPortfolioData(payload.data);
    } catch (err: any) {
      triggerToast(err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 🌐 DIRECT CALL: Direct invocation matching Server 3's core tracking logic
      const res = await fetch("http://localhost:5002/api/v1/core/link-identity", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ panNumber, equityId, equityPassword, mfRef, mfPassword })
      });
      if (!res.ok) throw new Error("Linkage processing fault.");
      triggerToast("Financial mapping link executed successfully. Syncing metrics...", "success");
      pullAggregatedWealthDashboard();
    } catch (err: any) {
      triggerToast(err.message, "danger");
    }
  };

  useEffect(() => { if (token) pullAggregatedWealthDashboard(); }, [token]);

  // Transform raw data fields into layout models for visualization charts
  const processPieWeights = () => {
    if (!portfolioData) return [];
    const eqTotal = portfolioData.slices.equity.holdings.reduce((acc: number, item: any) => acc + (parseFloat(item.quantity) * parseFloat(item.current_market_price)), 0);
    const mfTotal = portfolioData.slices.mutualFunds.positions.reduce((acc: number, item: any) => acc + parseFloat(item.current_value), 0);
    const reTotal = portfolioData.slices.realEstate.reduce((acc: number, item: any) => acc + parseFloat(item.latest_valuation), 0);
    return [
      { name: "Equities / Shares", value: eqTotal },
      { name: "Mutual Funds / SIP", value: mfTotal },
      { name: "Real Estate Properties", value: reTotal }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Welcome Back, {portfolioData?.investorProfile?.name || "Investor"}</h1>
          <p className="text-sub">Account Permanent Account Number Mapping: <span className="font-mono text-white font-bold">{portfolioData?.investorProfile?.pan || "PENDING LINK"}</span></p>
        </div>
        <button onClick={pullAggregatedWealthDashboard} disabled={loading} className="p-3 bg-[#111827] border border-[#374151] rounded-xl hover:bg-[#1F2937] text-[#94A3B8] hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {!portfolioData && !loading ? (
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 max-w-xl">
          <h3 className="flex items-center gap-2"><Key className="text-blue-500 w-5 h-5" /> Cross-Service Identity Link Required</h3>
          <p className="text-sm text-sub mt-2 mb-6">Map your third-party independent sub-passwords to establish automated aggregation paths through Server 3[cite: 4, 11].</p>
          <form onSubmit={handleLinkIdentitySubmit} className="space-y-4">
            <input type="text" placeholder="PAN Number Input (e.g. ABCDE1234F)" required value={panNumber} onChange={e => setPanNumber(e.target.value)} className="w-full bg-[#0B0F19] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Equity User Ref" value={equityId} onChange={e => setEquityId(e.target.value)} className="bg-[#0B0F19] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white" />
              <input type="password" placeholder="Equity Sub Password" value={equityPassword} onChange={e => setEquityPassword(e.target.value)} className="bg-[#0B0F19] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Mutual Fund Customer Ref" value={mfRef} onChange={e => setMfRef(e.target.value)} className="bg-[#0B0F19] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white" />
              <input type="password" placeholder="Mutual Fund Password" value={mfPassword} onChange={e => setMfPassword(e.target.value)} className="bg-[#0B0F19] border border-[#374151] rounded-xl py-2.5 px-4 text-sm text-white" />
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">Bind Downstream Assets Map</button>
          </form>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssetAllocationPie data={processPieWeights()} />
            <PerformanceArea data={[
              { timeline: "Q1 2025", capital: 12000000 },
              { timeline: "Q2 2025", capital: 15400000 },
              { timeline: "Q3 2025", capital: 19800000 },
              { timeline: "Q4 2025", capital: 22000000 },
              { timeline: "Current 2026", capital: 25422605 }
            ]} />
          </div>

          <h3 className="pt-4">Active Integrated Sub-System Slices</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Server 1 Equity Segment */}
            <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#374151] pb-3">
                <div className="flex items-center gap-2"><TrendingUp className="text-emerald-500 w-5 h-5" /> <h4>Server 1 Equities</h4></div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">{portfolioData?.slices?.equity?.status}</span>
              </div>
              {portfolioData?.slices?.equity?.holdings.map((hold: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#1F2937]/50 last:border-0">
                  <div>
                    <span className="font-bold text-white block">{hold.stock_symbol}</span>
                    <span className="text-light text-xs font-mono">{hold.quantity} Units // {hold.exchange}</span>
                  </div>
                  <span className="font-mono text-white font-bold text-right">₹{(parseFloat(hold.quantity) * parseFloat(hold.current_market_price)).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Server 2 Mutual Fund Segment */}
            <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#374151] pb-3">
                <div className="flex items-center gap-2"><Landmark className="text-blue-500 w-5 h-5" /> <h4>Server 2 Mutual Funds</h4></div>
                <span className="text-[10px] font-mono bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded">{portfolioData?.slices?.mutualFunds?.status}</span>
              </div>
              {portfolioData?.slices?.mutualFunds?.positions.map((pos: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#1F2937]/50 last:border-0">
                  <div>
                    <span className="font-bold text-white block">{pos.scheme_name}</span>
                    <span className="text-light text-xs font-mono">NAV: ₹{pos.nav_value}</span>
                  </div>
                  <span className="font-mono text-white font-bold text-right">₹{parseFloat(pos.current_value).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* Internal Real Estate Module Segment */}
            <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#374151] pb-3">
                <div className="flex items-center gap-2"><Building2 className="text-amber-500 w-5 h-5" /> <h4>Internal Properties</h4></div>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-900 px-2 py-0.5 rounded">LOCAL_DB</span>
              </div>
              {portfolioData?.slices?.realEstate.map((prop: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[#1F2937]/50 last:border-0">
                  <div>
                    <span className="font-bold text-white block">{prop.property_name}</span>
                    <span className="text-light text-xs text-emerald-400 font-mono">Rent: +₹{parseFloat(prop.total_rental_collected).toLocaleString('en-IN')}</span>
                  </div>
                  <span className="font-mono text-white font-bold text-right">₹{parseFloat(prop.latest_valuation).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}