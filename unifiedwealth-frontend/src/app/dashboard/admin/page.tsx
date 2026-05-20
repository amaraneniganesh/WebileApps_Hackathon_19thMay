"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWealthStore } from "@/store/useWealthStore";
import { 
  Radio, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  UserPlus, 
  Shield, 
  Briefcase, 
  User, 
  Layers, 
  Terminal, 
  Building2, 
  TrendingUp, 
  Landmark, 
  PlusCircle, 
  Eye,
  Users,
  Link2,
  GitCommit,
  UserCheck,
  Shuffle,
  ShieldAlert
} from "lucide-react";

export default function AdministrativeControlDashboard() {
  const { token } = useAuth();
  const { portfolioData, setPortfolioData, triggerToast } = useWealthStore();
  
  // Dashboard Navigation Layout Tabs
  const [activeTab, setActiveTab] = useState<"audit" | "provision" | "system-logs" | "asset-staging" | "rm-mapping">("audit");
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"property" | "equity" | "fund">("property");

  // RM Orchestration Logic State Hooks
  const [investorsList, setInvestorsList] = useState<any[]>([]);
  const [opsStaffList, setOpsStaffList] = useState<any[]>([]);
  const [assignmentsLedger, setAssignmentsLedger] = useState<any[]>([]);
  const [opsUserId, setOpsUserId] = useState("");
  const [investorUserId, setInvestorUserId] = useState("");

  // Selection Monitoring States
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Corporate Operator Provision States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState("OPS");

  // Form State Engines - Property
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  
  // Form State Engines - Equity
  const [stockSymbol, setStockSymbol] = useState("");
  const [equityQty, setEquityQty] = useState("");
  const [equityBuyPrice, setEquityBuyPrice] = useState("");
  const [exchange, setExchange] = useState("NSE");

  // Form State Engines - Mutual Funds
  const [schemeCode, setSchemeCode] = useState("");
  const [mfUnits, setMfUnits] = useState("");
  const [mfAmount, setMfAmount] = useState("");

  const pullRegistryLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/v1/core/admin/users", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const payload = await res.json();
      if (res.ok && payload.status === "SUCCESS") { 
        setUsers(payload.data || []); 
      }
    } catch (err: any) { 
      triggerToast("Audit ledger retrieval timed out.", "danger"); 
    } finally { 
      setLoading(false); 
    }
  };

  const pullSystemAuditTrail = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/v1/admin/audit-logs", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const payload = await res.json();
      if (res.ok && payload.status === "SUCCESS") {
        setAuditLogs(payload.matrixLog || payload.data || []);
      }
    } catch (err: any) {
      triggerToast("Failed to pull system security trails.", "danger");
    } finally {
      setLoading(false);
    }
  };

  // RM Mapping Orchestration Data Pipeline Data Ingestion Engine
  const loadRmOrchestrationData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // FETCH 1: Gather lookup arrays
      const metaRes = await fetch("http://localhost:5002/api/v1/core/rm/lookup-meta", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const metaPayload = await metaRes.json();
      if (metaRes.ok && metaPayload.status === "SUCCESS") {
        setInvestorsList(metaPayload.data.investors || []);
        setOpsStaffList(metaPayload.data.opsStaff || []);
      }

      // FETCH 2: Gather assignment mapping rows
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
      loadRmOrchestrationData(); 
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    }
  };

  const triggerDirectInlineSwap = (invId: string, opsId: string) => {
    setInvestorUserId(invId);
    setOpsUserId(opsId);
    const scrollTarget = document.getElementById("rm-control-form-panel");
    if (scrollTarget) {
      scrollTarget.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleState = async (uid: string, currentStatus: boolean) => {
    try {
      const res = await fetch("http://localhost:5002/api/v1/core/admin/users/toggle", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: uid, isEnabled: !currentStatus })
      });
      if (res.ok) { 
        triggerToast("User account lifecycle state toggled cleanly.", "success"); 
        pullRegistryLogs(); 
      }
    } catch (err: any) { 
      triggerToast("Toggle adjustment execution error.", "danger"); 
    }
  };

  const handleStaffCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5002/api/v1/core/admin/create-staff", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim(), email: email.trim().toLowerCase(), password: pass, assignedRole: role })
      });
      const payload = await res.json();
      if (res.ok && payload.status === "SUCCESS") {
        triggerToast(`Deployed corporate operator [${role}] node successfully.`, "success");
        setName(""); setEmail(""); setPass(""); 
        pullRegistryLogs();
        loadRmOrchestrationData(); // Sync list values if RM roles changed
      } else {
        throw new Error(payload.error || "Provisioning rejected.");
      }
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    }
  };

  const openAssetStagingWorkspace = async (client: any) => {
    setSelectedClient(client);
    setActiveTab("asset-staging");
    try {
      const res = await fetch(`http://localhost:5002/api/v1/core/portfolio?userId=${client.user_id}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Access control mapping violation.");
      setPortfolioData(payload.data);
    } catch (err: any) {
      triggerToast(err.message, "danger");
    }
  };

  const handleMasterAssetSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      let endpoint = "http://localhost:5002/api/v1/admin/real-estate/add";
      let body: any = {};

      if (activeFormTab === "property") {
        body = {
          panNumber: selectedClient.pan_number,
          targetUserId: selectedClient.user_id,
          propertyName: propertyName.trim(),
          address: address.trim(),
          purchasePrice: parseFloat(purchasePrice),
          purchaseDate: new Date().toISOString().split('T')[0]
        };
      } else if (activeFormTab === "equity") {
        endpoint = "http://localhost:5002/api/v1/admin/equity/inject-asset";
        body = {
          investorId: selectedClient.equity_id || "INV1001",
          stockSymbol: stockSymbol.trim().toUpperCase(),
          quantity: parseFloat(equityQty),
          avgBuyPrice: parseFloat(equityBuyPrice),
          exchange
        };
      } else {
        endpoint = "http://localhost:5002/api/v1/admin/mutual-funds/inject-asset";
        body = {
          customerRef: selectedClient.mf_ref || "CUST-1001",
          schemeCode: schemeCode.trim().toUpperCase(),
          units: parseFloat(mfUnits),
          investedAmount: parseFloat(mfAmount)
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Asset deployment transaction rejected.");

      triggerToast("Asset created and distributed safely to downstream nodes.", "success");
      
      // Reset forms
      setPropertyName(""); setPurchasePrice(""); setAddress("");
      setStockSymbol(""); setEquityQty(""); setEquityBuyPrice("");
      setSchemeCode(""); setMfUnits(""); setMfAmount("");
      
      openAssetStagingWorkspace(selectedClient);
    } catch (err: any) {
      triggerToast(err.message, "danger");
    }
  };

  useEffect(() => { 
    if (token) {
      pullRegistryLogs();
      pullSystemAuditTrail();
      loadRmOrchestrationData();
    }
  }, [token]);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1>Infrastructure Core Registry</h1>
          <p className="text-sub">Authorized system-wide master orchestration and structural asset provisioning desk.</p>
        </div>
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl select-none text-xs font-bold shrink-0 overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab("audit")} className={`px-4 py-2 rounded-lg transition-all shrink-0 ${activeTab === "audit" ? "bg-blue-600 text-white" : "text-slate-400"}`}>User Audit Ledger</button>
          <button onClick={() => setActiveTab("rm-mapping")} className={`px-4 py-2 rounded-lg transition-all shrink-0 ${activeTab === "rm-mapping" ? "bg-blue-600 text-white" : "text-slate-400"}`}>RM Assignments</button>
          <button onClick={() => setActiveTab("provision")} className={`px-4 py-2 rounded-lg transition-all shrink-0 ${activeTab === "provision" ? "bg-blue-600 text-white" : "text-slate-400"}`}>Create Staff Account</button>
          <button onClick={() => setActiveTab("system-logs")} className={`px-4 py-2 rounded-lg transition-all shrink-0 ${activeTab === "system-logs" ? "bg-blue-600 text-white" : "text-slate-400"}`}>Audit Logs</button>
        </div>
      </div>

      {activeTab === "audit" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-mono font-bold flex items-center gap-2"><Radio className="w-4 h-4 text-blue-500 animate-pulse" /> SYSTEM-WIDE USER INTERCEPT REGISTRY</span>
            <button onClick={pullRegistryLogs} className="p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-lg"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950/20 text-[#64748B] font-mono text-xs border-b border-slate-800">
                <th className="p-4 pl-6">Profile Owner / Email</th>
                <th className="p-4">Authorization Role</th>
                <th className="p-4">Attributes Mapped</th>
                <th className="p-4 text-center pr-6">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {users.map((u, i) => {
                const displayRole = u.assigned_role || "VIEWER";
                return (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-white">{u.full_name}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase bg-blue-950/60 text-blue-400 border-blue-800/50">
                        {displayRole}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-400">
                      {u.pan_number ? `PAN: ${u.pan_number} [EQ-ID: ${u.equity_id || "N/A"}]` : "No financial extensions required"}
                    </td>
                    <td className="p-4 text-center pr-6 flex items-center justify-center gap-2">
                      {displayRole === "VIEWER" && (
                        <button onClick={() => openAssetStagingWorkspace(u)} className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"><PlusCircle className="w-3.5 h-3.5" /> Assign Asset</button>
                      )}
                      <button onClick={() => handleToggleState(u.user_id, u.is_active)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase border transition-all cursor-pointer ${u.is_active ? "bg-emerald-950/40 border-emerald-900 text-emerald-400" : "bg-rose-950/40 border-rose-900 text-rose-400"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "rm-mapping" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Dynamic Controls Assignment Dropdown Section */}
            <div id="rm-control-form-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <h4 className="flex items-center gap-2 text-white font-bold"><Users className="text-blue-500 w-4 h-4" /> Mutate Management Vector</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Select active entities to dynamically construct or adjust servicing mapping rules instantly.</p>
              
              <form onSubmit={executeDelegationMapSubmit} className="space-y-5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#94A3B8] uppercase block">1. Select Target Investor Profile</label>
                  <select 
                    required 
                    value={investorUserId} 
                    onChange={e => setInvestorUserId(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3 px-3 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
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
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-3 px-3 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
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
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 bg-slate-950/30 border-b border-slate-800 flex justify-between items-center select-none">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-emerald-500" /> Live Relationship Assignment Ledger
                </span>
                <button 
                  onClick={loadRmOrchestrationData} 
                  disabled={loading}
                  className="p-2 bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-950/60 text-[#64748B] font-mono text-xs border-b border-slate-800">
                      <th className="p-4 pl-6">Linked Investor Client</th>
                      <th className="p-4 text-center text-[10px] uppercase">Connection Stream</th>
                      <th className="p-4">Assigned Operations Engineer</th>
                      <th className="p-4 text-center pr-6">Quick Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-[#CBD5E1]">
                    {assignmentsLedger.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs font-mono text-slate-500 uppercase tracking-wider">
                          {loading ? "Re-indexing live database connections..." : "Zero client relationship structures found across tables."}
                        </td>
                      </tr>
                    ) : (
                      assignmentsLedger.map((row, i) => (
                        <tr key={row.assignment_id || i} className="hover:bg-slate-800/20 transition-all duration-150">
                          <td className="p-4 pl-6">
                            <div className="font-bold text-white text-xs sm:text-sm">{row.investor_name}</div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">{row.investor_email}</div>
                          </td>
                          <td className="p-4 text-center font-mono text-xs text-blue-500">
                            <div className="flex items-center justify-center gap-1.5 bg-[#0B0F19] px-2 py-1 rounded-md border border-slate-800/40 w-fit mx-auto">
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
                              className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white text-[11px] font-mono font-bold uppercase rounded-lg transition-all flex items-center gap-1 mx-auto active:scale-95 cursor-pointer"
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
      )}

      {activeTab === "asset-staging" && selectedClient && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500" />
          <div className="flex justify-between border-b border-slate-800 pb-4 items-center">
            <div>
              <span className="text-[10px] font-mono bg-blue-950 text-blue-400 px-2 py-0.5 border border-blue-900 rounded uppercase font-bold">Admin Privileged Allocation</span>
              <h3 className="text-lg font-bold text-white mt-1">Staging Multi-Asset Records for {selectedClient.full_name}</h3>
            </div>
            <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs font-bold select-none">
              <button onClick={() => setActiveFormTab("equity")} className={`px-3 py-1.5 rounded-lg transition-all ${activeFormTab === "equity" ? "bg-blue-600 text-white" : "text-slate-400"}`}><TrendingUp className="w-3.5 h-3.5 mr-1 inline" /> Stocks</button>
              <button onClick={() => setActiveFormTab("fund")} className={`px-3 py-1.5 rounded-lg transition-all ${activeFormTab === "fund" ? "bg-purple-600 text-white" : "text-slate-400"}`}><Landmark className="w-3.5 h-3.5 mr-1 inline" /> Mutual Funds</button>
            </div>
          </div>

          <form onSubmit={handleMasterAssetSubmission} className="space-y-4">
            {activeFormTab === "property" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" placeholder="Building Name Descriptor" required value={propertyName} onChange={e => setPropertyName(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500" />
                  <input type="number" placeholder="Purchase Valuation Cost (INR)" required value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono outline-none focus:border-amber-500" />
                </div>
                <input type="text" placeholder="Complete Site Location Address" required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500" />
                <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"><Building2 className="w-4 h-4" /> Deploy Real Estate Position</button>
              </div>
            )}

            {activeFormTab === "equity" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="text" placeholder="Stock Symbol (e.g., RELIANCE)" required value={stockSymbol} onChange={e => setStockSymbol(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono uppercase focus:border-blue-500 outline-none" />
                  <input type="number" placeholder="Quantity Volume" required value={equityQty} onChange={e => setEquityQty(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono focus:border-blue-500 outline-none" />
                  <input type="number" placeholder="Execution Price Cost" required value={equityBuyPrice} onChange={e => setEquityBuyPrice(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono focus:border-blue-500 outline-none" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">Exchange Center:</span>
                  {["NSE", "BSE"].map(ex => (
                    <button key={ex} type="button" onClick={() => setExchange(ex)} className={`px-4 py-1.5 border text-xs font-mono font-bold rounded-lg cursor-pointer transition-all ${exchange === ex ? "bg-blue-950 border-blue-500 text-blue-400 shadow-md" : "bg-[#0B0F19] border-slate-800 text-slate-500"}`}>{ex}</button>
                  ))}
                </div>
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"><TrendingUp className="w-4 h-4" /> Proxy Push Equity Holdings (Server 1)</button>
              </div>
            )}

            {activeFormTab === "fund" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="text" placeholder="Scheme Code Index" required value={schemeCode} onChange={e => setSchemeCode(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono uppercase focus:border-purple-500 outline-none" />
                  <input type="number" step="0.001" placeholder="Allotted Unit Share Volume" required value={mfUnits} onChange={e => setMfUnits(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono focus:border-purple-500 outline-none" />
                  <input type="number" placeholder="Lump-Sum Value" required value={mfAmount} onChange={e => setMfAmount(e.target.value)} className="bg-[#0B0F19] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white font-mono focus:border-purple-500 outline-none" />
                </div>
                <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"><Landmark className="w-4 h-4" /> Proxy Push Mutual Fund Position (Server 2)</button>
              </div>
            )}
          </form>

          {portfolioData?.slices && (
            <div className="mt-4 border-t border-slate-800 pt-4 space-y-2">
              <div className="text-xs font-mono font-bold text-slate-500 flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Current Distributed Balances Roster</div>
              <div className="grid grid-cols-3 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800/40">
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase">Real Estate</span>
                  <span className="text-white font-bold">{portfolioData?.slices?.realEstate?.length || 0} Assets</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase">Stocks</span>
                  <span className="text-white font-bold">{portfolioData?.slices?.equity?.holdings?.length || 0} Positions</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px] uppercase">Mutual Funds</span>
                  <span className="text-emerald-400 font-bold">{portfolioData?.slices?.mutualFunds?.positions?.length || 0} Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "provision" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <h4 className="flex items-center gap-2 border-b border-slate-800 pb-3"><UserPlus className="text-blue-500 w-4 h-4" /> Deploy Operator Staff Node</h4>
          <form onSubmit={handleStaffCreateSubmit} className="space-y-4 pt-4">
            <input type="text" required placeholder="Staff Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
            <input type="email" required placeholder="Corporate Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
            <input type="password" required placeholder="Temporary Workspace Password" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-blue-500 transition-colors" />
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Operational Workgroup Role</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setRole("OPS")} className={`py-3 rounded-xl border font-bold text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${role === "OPS" ? "bg-blue-950 text-blue-400 border-blue-500 shadow-lg" : "bg-slate-950 border-slate-800 text-slate-500"}`}><Briefcase className="w-4 h-4" /> Operations Staff</button>
                <button type="button" onClick={() => setRole("RM")} className={`py-3 rounded-xl border font-bold text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${role === "RM" ? "bg-blue-950 text-blue-400 border-blue-500 shadow-lg" : "bg-slate-950 border-slate-800 text-slate-500"}`}><User className="w-4 h-4" /> Relationship Mgr</button>
              </div>
            </div>
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 font-bold uppercase text-xs text-white rounded-xl shadow-lg cursor-pointer transition-all active:scale-[0.99]">Provision Corporate Node</button>
          </form>
        </div>
      )}

      {activeTab === "system-logs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-mono font-bold flex items-center gap-2"><Terminal className="w-4 h-4 text-amber-500" /> GLOBAL GATEWAY FIREWALL INTERCEPT TRAIL</span>
            <button onClick={pullSystemAuditTrail} className="p-2 border border-slate-800 bg-slate-950 rounded-lg text-slate-400"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
          <div className="max-h-[450px] overflow-y-auto font-mono text-[11px] p-4 bg-slate-950 text-slate-300 space-y-2 divide-y divide-slate-900">
            {auditLogs.length === 0 ? (
              <div className="text-slate-600 text-center uppercase tracking-widest py-8">No network packets recorded yet.</div>
            ) : (
              auditLogs.map((log, index) => (
                <div key={index} className="pt-2 flex justify-between items-start gap-4">
                  <div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold mr-2 ${log.http_method === 'POST' ? 'bg-emerald-950 text-emerald-400' : log.http_method === 'PUT' ? 'bg-blue-950 text-blue-400' : 'bg-rose-950 text-rose-400'}`}>{log.http_method}</span>
                    <span className="text-white font-bold">{log.request_path}</span>
                    <div className="text-slate-500 mt-1">Operator: {log.user_email || "System/Unknown"} // Identity Context: {log.user_role || "Public Call"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={log.status_code < 400 ? "text-emerald-400" : "text-rose-400"}>STATUS {log.status_code}</span>
                    <div className="text-[10px] text-slate-600 mt-0.5">{log.execution_ms}ms Latency</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}