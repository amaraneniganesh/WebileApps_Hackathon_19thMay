"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWealthStore } from "@/store/useWealthStore";
import { Briefcase, Eye, Building2, PlusCircle, UserCheck, TrendingUp, Landmark, Layers, Trash2, Edit3, CheckCircle, XCircle } from "lucide-react";

export default function AdvancedOpsServicingConsole() {
  const { token } = useAuth();
  const { portfolioData, setPortfolioData, triggerToast } = useWealthStore();
  
  const [allocatedInvestors, setAllocatedInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<"property" | "equity" | "fund">("property");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Form States - Property Ingestion
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  // Form States - Equity Ingestion (Server 1 Proxy)
  const [stockSymbol, setStockSymbol] = useState("");
  const [equityQty, setEquityQty] = useState("");
  const [equityBuyPrice, setEquityBuyPrice] = useState("");
  const [exchange, setExchange] = useState("NSE");

  // Form States - Mutual Fund Ingestion (Server 2 Proxy)
  const [schemeCode, setSchemeCode] = useState("");
  const [mfUnits, setMfUnits] = useState("");
  const [mfAmount, setMfAmount] = useState("");

  // Universal Inline Editing Frame State Engine (For Multi-Asset CRUD Overrides)
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [fieldA, setFieldA] = useState("");
  const [fieldB, setFieldB] = useState("");
  const [fieldC, setFieldC] = useState("");
  const [fieldD, setFieldD] = useState("OWNED");

  const pullMyAllocatedInvestorsList = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5002/api/v1/core/my-investors", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to download assigned roster map.");
      setAllocatedInvestors(payload.data || []);
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    } finally { 
      setLoading(false); 
    }
  };

  const inspectTargetClientPortfolio = async (client: any) => {
    setSelectedClient(client);
    setEditingRowId(null);
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

  const handleAssetSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      let endpoint = "http://localhost:5002/api/v1/admin/real-estate/add";
      let body: any = {};

      if (activeFormTab === "property") {
        body = { 
          panNumber: selectedClient.pan_number, 
          targetUserId: selectedClient.user_id, 
          propertyName, 
          address, 
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
      if (!res.ok) throw new Error(payload.error || "Insertion pipeline rejected entry statement.");
      
      triggerToast("Asset position allocated completely and synchronized.", "success");
      
      // Reset input form buckets
      setPropertyName(""); setPurchasePrice(""); setAddress("");
      setStockSymbol(""); setEquityQty(""); setEquityBuyPrice("");
      setSchemeCode(""); setMfUnits(""); setMfAmount("");
      
      inspectTargetClientPortfolio(selectedClient);
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    }
  };

  const executeAssetUpdateRow = async (assetType: "RE" | "STK" | "MF", uniqueRecordId: string) => {
    try {
      let endpoint = "http://localhost:5002/api/v1/admin/real-estate/update";
      let body: any = {};

      if (assetType === "RE") {
        body = { propertyId: uniqueRecordId, propertyName: fieldA, address: fieldB, purchasePrice: parseFloat(fieldC), currentStatus: fieldD };
      } else if (assetType === "STK") {
        endpoint = "http://localhost:5002/api/v1/admin/equity/update-asset";
        body = { investorId: selectedClient.equity_id, id: uniqueRecordId, stockSymbol: fieldA, quantity: parseFloat(fieldB), avgBuyPrice: parseFloat(fieldC) };
      } else {
        endpoint = "http://localhost:5002/api/v1/admin/mutual-funds/update-asset";
        body = { customerRef: selectedClient.mf_ref, id: uniqueRecordId, schemeCode: fieldA, units: parseFloat(fieldB), investedAmount: parseFloat(fieldC) };
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Asset structural update was rejected by server rules.");
      
      triggerToast("Position updated cleanly across distributed servers.", "success");
      setEditingRowId(null);
      inspectTargetClientPortfolio(selectedClient);
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    }
  };

  const executeAssetPurgeRow = async (assetType: "RE" | "STK" | "MF", targetId: string) => {
    if (!window.confirm("Purge selected portfolio asset record slot? This operation is permanent!")) return;
    try {
      let url = `http://localhost:5002/api/v1/admin/real-estate/delete/${targetId}`;
      if (assetType === "STK") {
        url = `http://localhost:5002/api/v1/admin/equity/delete-asset/${selectedClient.equity_id}/${targetId}`;
      } else if (assetType === "MF") {
        url = `http://localhost:5002/api/v1/admin/mutual-funds/delete-asset/${selectedClient.mf_ref}/${targetId}`;
      }

      const res = await fetch(url, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Purge statement rejected by network security guards.");
      
      triggerToast("Asset removed from core profile maps successfully.", "success");
      inspectTargetClientPortfolio(selectedClient);
    } catch (err: any) { 
      triggerToast(err.message, "danger"); 
    }
  };

  useEffect(() => { if (token) pullMyAllocatedInvestorsList(); }, [token]);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1>Operational Servicing & Asset Matrix Desk</h1>
        <p className="text-sub">Full CRUD Lifecycle controls over user property layers and proxy microservice allocation logs.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Side: Assigned Clients Roster */}
        <div className="bg-[#111827] border border-[#374151] rounded-2xl p-5 space-y-4 shadow-xl">
          <h4 className="flex items-center gap-2 text-white font-bold"><UserCheck className="text-blue-400 w-4.5 h-4.5" /> Allocated Client Base Matrix</h4>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {allocatedInvestors.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono py-4 uppercase text-center tracking-wider">No investors assigned to this specialist.</div>
            ) : (
              allocatedInvestors.map((client, idx) => (
                <div key={client.user_id || idx} className={`p-3 border rounded-xl flex justify-between items-center ${selectedClient?.user_id === client.user_id ? "bg-blue-950/40 border-blue-500" : "bg-[#0B0F19] border-[#374151]"}`}>
                  <div>
                    <div className="text-xs font-bold text-white">{client.full_name}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">PAN Ref: {client.pan_number || "UNSET"}</div>
                  </div>
                  <button onClick={() => inspectTargetClientPortfolio(client)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-md">Audit</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Operations Panel */}
        <div className="xl:col-span-2 space-y-6">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Asset Forms Input Layer Block */}
              <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500" />
                <div className="flex justify-between border-b border-[#374151] pb-3 mb-4 items-center select-none">
                  <h3 className="text-sm font-mono text-blue-400">Log Asset Structure Context</h3>
                  <div className="flex bg-[#0B0F19] p-1 border border-[#374151] rounded-lg text-xs font-bold">
                    <button type="button" onClick={() => setActiveFormTab("property")} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${activeFormTab === "property" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"}`}><Building2 className="w-3.5 h-3.5" /> Property</button>
                    <button type="button" onClick={() => setActiveFormTab("equity")} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${activeFormTab === "equity" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}><TrendingUp className="w-3.5 h-3.5" /> Stocks</button>
                    <button type="button" onClick={() => setActiveFormTab("fund")} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${activeFormTab === "fund" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"}`}><Landmark className="w-3.5 h-3.5" /> Mutual Funds</button>
                  </div>
                </div>

                <form onSubmit={handleAssetSubmission} className="space-y-4">
                  {activeFormTab === "property" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" placeholder="Asset Identifier Name" required value={propertyName} onChange={e => setPropertyName(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white outline-none focus:border-amber-500" />
                      <input type="text" placeholder="Address Site Location" required value={address} onChange={e => setAddress(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white outline-none focus:border-amber-500" />
                      <input type="number" placeholder="Cost Purchase Price (INR)" required value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono outline-none focus:border-amber-500" />
                      <button type="submit" className="sm:col-span-3 py-2.5 bg-amber-600 font-bold text-xs text-white uppercase rounded-xl cursor-pointer hover:bg-amber-500 tracking-wider">Log Real Estate Asset</button>
                    </div>
                  )}

                  {activeFormTab === "equity" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" placeholder="Stock Symbol Ticker (e.g. INF)" required value={stockSymbol} onChange={e => setStockSymbol(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono uppercase focus:border-blue-500 outline-none" />
                      <input type="number" placeholder="Volume Unit Quantity" required value={equityQty} onChange={e => setEquityQty(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono focus:border-blue-500 outline-none" />
                      <input type="number" placeholder="Execution Average Price" required value={equityBuyPrice} onChange={e => setEquityBuyPrice(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono focus:border-blue-500 outline-none" />
                      <div className="sm:col-span-3 flex items-center gap-3 select-none">
                        <span className="text-xs font-mono text-slate-500">Settlement Exchange Base:</span>
                        {["NSE", "BSE"].map(ex => (
                          <button key={ex} type="button" onClick={() => setExchange(ex)} className={`px-4 py-1.5 border text-xs font-mono font-bold rounded-lg cursor-pointer transition-all ${exchange === ex ? "bg-blue-950 border-blue-500 text-blue-400 shadow-md" : "bg-[#0B0F19] border-[#374151] text-slate-500"}`}>{ex}</button>
                        ))}
                      </div>
                      <button type="submit" className="sm:col-span-3 py-2.5 bg-blue-600 font-bold text-xs text-white uppercase rounded-xl cursor-pointer hover:bg-blue-500 tracking-wider">Inject Broker Stock Over-Wire Trade</button>
                    </div>
                  )}

                  {activeFormTab === "fund" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" placeholder="Scheme Registry Code (e.g. SBI-BLUECHIP)" required value={schemeCode} onChange={e => setSchemeCode(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono uppercase focus:border-purple-500 outline-none" />
                      <input type="number" step="0.0001" placeholder="Allotted Shares Units" required value={mfUnits} onChange={e => setMfUnits(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono focus:border-purple-500 outline-none" />
                      <input type="number" placeholder="Lump-Sum Investment (INR)" required value={mfAmount} onChange={e => setMfAmount(e.target.value)} className="bg-[#0B0F19] border border-[#374151] text-xs py-2.5 px-3 rounded-lg text-white font-mono focus:border-purple-500 outline-none" />
                      <button type="submit" className="sm:col-span-3 py-2.5 bg-purple-600 font-bold text-xs text-white uppercase rounded-xl cursor-pointer hover:bg-purple-500 tracking-wider">Inject Mutual Fund Position Entry</button>
                    </div>
                  )}
                </form>
              </div>

              {/* Comprehensive Live Grid Tracker with CRUD Submissions */}
              <div className="bg-[#111827] border border-[#374151] rounded-2xl p-6 shadow-2xl space-y-6">
                
                {/* Real Estate CRUD Section */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-amber-500 mb-3 border-b border-[#374151] pb-1 uppercase select-none"><Building2 className="w-4 h-4 mr-1 inline" /> Managed Real Estate Assets Ledger</h4>
                  {(!portfolioData?.slices?.realEstate || portfolioData.slices.realEstate.length === 0) ? (
                    <div className="text-xs font-mono text-slate-600 pl-2">Zero physical rows verified locally.</div>
                  ) : (
                    portfolioData.slices.realEstate.map((prop: any) => {
                      const isEditing = editingRowId === prop.property_id;
                      return (
                        <div key={prop.property_id} className="p-3 bg-[#0B0F19] border border-[#374151] rounded-xl flex justify-between items-center mb-2 text-xs">
                          {isEditing ? (
                            <div className="flex gap-2 flex-1"><input value={fieldA} onChange={e=>setFieldA(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs flex-1" /><input value={fieldB} onChange={e=>setFieldB(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs flex-1" /><input value={fieldC} onChange={e=>setFieldC(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono w-24" /></div>
                          ) : (
                            <div>
                              <span className="font-bold text-white text-sm block">{prop.property_name} ({prop.current_status || 'OWNED'})</span>
                              <span className="text-slate-400 mt-0.5 block">{prop.address} // Total Value: ₹{prop.purchase_price}</span>
                            </div>
                          )}
                          <div className="flex gap-1 shrink-0 select-none">
                            {isEditing ? (
                              <button onClick={() => executeAssetUpdateRow("RE", prop.property_id)} className="text-emerald-400 p-1 cursor-pointer"><CheckCircle className="w-4 h-4" /></button>
                            ) : (
                              <button onClick={() => { setEditingRowId(prop.property_id); setFieldA(prop.property_name); setFieldB(prop.address); setFieldC(prop.purchase_price.toString()); setFieldD(prop.current_status); }} className="text-slate-400 p-1 cursor-pointer hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={() => executeAssetPurgeRow("RE", prop.property_id)} className="text-rose-400 p-1 cursor-pointer hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Stocks Proxy CRUD Section */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-blue-500 mb-3 border-b border-[#374151] pb-1 uppercase select-none"><TrendingUp className="w-4 h-4 mr-1 inline" /> Equity Holdings (Server 1 Wire Interface)</h4>
                  {(!portfolioData?.slices?.equity?.holdings || portfolioData.slices.equity.holdings.length === 0) ? (
                    <div className="text-xs font-mono text-slate-600 pl-2">Zero broker items identified on Server 1.</div>
                  ) : (
                    portfolioData.slices.equity.holdings.map((stk: any) => {
                      const isEditing = editingRowId === `stk-${stk.id}`;
                      return (
                        <div key={stk.id} className="p-3 bg-[#0B0F19] border border-[#374151] rounded-xl flex justify-between items-center mb-2 text-xs">
                          {isEditing ? (
                            <div className="flex gap-2 flex-1"><input value={fieldA} onChange={e=>setFieldA(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono uppercase" /><input value={fieldB} onChange={e=>setFieldB(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono" /><input value={fieldC} onChange={e=>setFieldC(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono" /></div>
                          ) : (
                            <div className="font-mono">
                              <span className="font-bold text-white text-sm block">{stk.stock_symbol}</span>
                              <span className="text-slate-400 mt-0.5 block">Volume: {stk.quantity} // Cost Base: ₹{stk.avg_buy_price} // CMP: ₹{stk.current_market_price}</span>
                            </div>
                          )}
                          <div className="flex gap-1 shrink-0 select-none">
                            {isEditing ? (
                              <button onClick={() => executeAssetUpdateRow("STK", stk.id)} className="text-emerald-400 p-1 cursor-pointer"><CheckCircle className="w-4 h-4" /></button>
                            ) : (
                              <button onClick={() => { setEditingRowId(`stk-${stk.id}`); setFieldA(stk.stock_symbol); setFieldB(stk.quantity.toString()); setFieldC(stk.avg_buy_price.toString()); }} className="text-slate-400 p-1 cursor-pointer hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={() => executeAssetPurgeRow("STK", stk.id)} className="text-rose-400 p-1 cursor-pointer hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Mutual Fund Proxy CRUD Section */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-purple-500 mb-3 border-b border-[#374151] pb-1 uppercase select-none"><Landmark className="w-4 h-4 mr-1 inline" /> Mutual Fund Balances (Server 2 Wire Interface)</h4>
                  {(!portfolioData?.slices?.mutualFunds?.positions || portfolioData.slices.mutualFunds.positions.length === 0) ? (
                    <div className="text-xs font-mono text-slate-600 pl-2">Zero clearing balances identified on Server 2.</div>
                  ) : (
                    portfolioData.slices.mutualFunds.positions.map((mf: any) => {
                      const isEditing = editingRowId === `mf-${mf.id}`;
                      return (
                        <div key={mf.id} className="p-3 bg-[#0B0F19] border border-[#374151] rounded-xl flex justify-between items-center mb-2 text-xs">
                          {isEditing ? (
                            <div className="flex gap-2 flex-1"><input value={fieldA} onChange={e=>setFieldA(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono" /><input value={fieldB} onChange={e=>setFieldB(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono" /><input value={fieldC} onChange={e=>setFieldC(e.target.value)} className="bg-slate-900 border border-blue-500 rounded p-1 text-white text-xs font-mono" /></div>
                          ) : (
                            <div className="font-mono">
                              <span className="font-bold text-white text-sm block">{mf.scheme_name || mf.scheme_code}</span>
                              <span className="text-slate-400 mt-0.5 block">Units Allotted: {mf.units} // Principal Capital: ₹{mf.invested_amount} // Valuation Value: ₹{mf.current_value}</span>
                            </div>
                          )}
                          <div className="flex gap-1 shrink-0 select-none">
                            {isEditing ? (
                              <button onClick={() => executeAssetUpdateRow("MF", mf.id)} className="text-emerald-400 p-1 cursor-pointer"><CheckCircle className="w-4 h-4" /></button>
                            ) : (
                              <button onClick={() => { setEditingRowId(`mf-${mf.id}`); setFieldA(mf.scheme_code); setFieldB(mf.units.toString()); setFieldC(mf.invested_amount.toString()); }} className="text-slate-400 p-1 cursor-pointer hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                            )}
                            <button onClick={() => executeAssetPurgeRow("MF", mf.id)} className="text-rose-400 p-1 cursor-pointer hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-12 border-2 border-dashed border-[#374151] rounded-2xl text-center text-xs font-mono text-slate-600 uppercase tracking-widest">
              <Briefcase className="w-6 h-6 text-blue-500 mx-auto mb-2 opacity-50 animate-pulse" /> Select an investor from the cluster matrix to boot active CRUD staging workflows.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}