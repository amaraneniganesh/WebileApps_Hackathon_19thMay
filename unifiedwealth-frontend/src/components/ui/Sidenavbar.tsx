"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, TrendingUp, Landmark, Building2, Settings } from "lucide-react";

export const Sidenavbar = () => {
  const { profile } = useAuth();
  const pathname = usePathname();
  const currentRoles = profile?.roles || [];

  const links = [
    { label: "Overview Matrix", path: "/dashboard", roles: ["VIEWER", "RM", "OPS", "ADMIN"], icon: LayoutDashboard },
    { label: "Equity Portal", path: "/dashboard/equity", roles: ["VIEWER"], icon: TrendingUp },
    { label: "Mutual Funds", path: "/dashboard/funds", roles: ["VIEWER"], icon: Landmark },
    { label: "Real Estate", path: "/dashboard/properties", roles: ["VIEWER"], icon: Building2 },
    { label: "Admin Core", path: "/dashboard/admin", roles: ["ADMIN"], icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 h-screen sticky top-0 hidden md:flex flex-col z-20 shadow-2xl">
      <div className="p-6 border-b border-slate-800">
        <div className="text-md font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">QUANTCORE TERMINAL</div>
      </div>
      <nav className="flex-1 p-4 space-y-1.5">
        {links.map((link) => {
          if (!link.roles.some((role) => currentRoles.includes(role))) return null;
          const isActive = pathname === link.path;
          const Icon = link.icon;
          return (
            <Link key={link.path} href={link.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}>
              <Icon className="w-4 h-4 shrink-0 text-blue-400" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <div className="text-xs font-bold text-white truncate">{profile?.name}</div>
        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{profile?.roles[0]} Node</div>
      </div>
    </aside>
  );
};