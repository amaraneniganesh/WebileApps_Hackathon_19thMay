"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Cpu, Activity, ArrowRight } from "lucide-react";

export default function MarketingLandingPage() {
  return (
    <main className="min-screen bg-[#0B0F19] text-white flex flex-col justify-between overflow-x-hidden selection:bg-blue-500/30">
      <header className="px-6 h-20 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-white/5">
        <span className="font-bold tracking-tight text-xl bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">PLATFORM CORE</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-blue-400 transition-colors py-2 px-4">Portal Connection</Link>
          <Link href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 transition-colors py-2 px-4 rounded-xl shadow-lg shadow-blue-500/20">Self Registration</Link>
        </div>
      </header>
      <section className="max-w-5xl mx-auto w-full px-6 py-24 text-center flex flex-col items-center gap-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-950/50 border border-blue-900/60 rounded-full text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5 animate-pulse" /> Direct Downstream Integration Server 3
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl">Unified Wealth Data Normalized Intelligence Platform</motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-sub text-lg sm:text-xl max-w-2xl">Aggregate inconsistent data payloads across equity nodes, mutual fund accounts, and internal physical real estate modules into a secure operational view[cite: 4, 11, 16].</motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex gap-4 mt-4">
          <Link href="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 font-semibold px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/20 group">Launch System Control Console <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
        </motion.div>
      </section>
      <section className="max-w-6xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
        {[
          { icon: Cpu, title: "Payload Normalization", desc: "Transforms varied downstream payload configurations into a clean, uniform query matrix[cite: 11, 23]." },
          { icon: Shield, title: "Role Enforced Gateway", desc: "Applies strict context-aware RBAC security mapping rules directly inside Server 3[cite: 43]." },
          { icon: Activity, title: "Telemetry Audit Trailing", desc: "Background interceptors record and lock every single user interaction for real-time compliance auditing[cite: 44]." }
        ].map((feat, index) => (
          <div key={index} className="bg-[#111827] border border-[#374151] p-6 rounded-2xl flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-950 rounded-xl flex items-center justify-center border border-blue-900/50 text-blue-400"><feat.icon className="w-5 h-5" /></div>
            <h3 className="text-base font-bold text-white mt-2">{feat.title}</h3>
            <p className="text-sm text-sub">{feat.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}