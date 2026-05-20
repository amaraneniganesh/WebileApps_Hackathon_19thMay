"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Globe } from "lucide-react";

export const HeaderDash = () => {
  const { profile, logoutSession } = useAuth();

  return (
    <header className="h-16 bg-[#111827] border-b border-[#374151] px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-blue-500 animate-pulse" />
        <span className="text-xs font-mono text-[#64748B]">DIRECT CONNECTION // GATEWAY_PORT:5002</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#1F2937] px-3 py-1.5 rounded-lg border border-[#374151]">
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-[#CBD5E1]">{profile?.email}</span>
        </div>
        <button onClick={logoutSession} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>
    </header>
  );
};