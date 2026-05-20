"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWealthStore } from "@/store/useWealthStore";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { loginSession } = useAuth();
  const { triggerToast } = useWealthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerToast("Please provide both your account email and security password.", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      // 🌐 DIRECT CALL: Directly targeted to the Server 3 Gateway interface, avoiding Next.js API route proxying
      const response = await fetch("http://localhost:5002/api/v1/core/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok || data.status !== "SUCCESS") {
        throw new Error(data.error || "Authentication signature rejected.");
      }
      triggerToast("Bearer Session Authenticated. Mounting your workspace...", "success");
      loginSession(data.token, data.profile);
    } catch (err: any) {
      triggerToast(err.message || "Failed to reach the validation server.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#111827] border border-[#374151] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-12 h-12 bg-blue-950 border border-blue-900 rounded-xl flex items-center justify-center text-blue-400 mb-2"><ShieldCheck className="w-6 h-6" /></div>
          <h2>System Control Portal</h2>
          <p className="text-sub text-sm">Direct Secure Bearer Token Gateway Verification Sequence</p>
        </div>
        <form onSubmit={executeLoginSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-sub uppercase tracking-wider">Account Email Reference</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="email" required placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#0B0F19] border border-[#374151] rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-sub uppercase tracking-wider">Security Access Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0B0F19] border border-[#374151] rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 mt-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Identity Session"}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-sub">
          No platform record? <Link href="/register" className="text-blue-400 hover:underline font-medium">Create user profile</Link>
        </div>
      </div>
    </main>
  );
}