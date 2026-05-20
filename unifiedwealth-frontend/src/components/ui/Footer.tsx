import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-[#111827] border-t border-[#374151] px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-[#64748B] font-mono gap-2">
      <div>&copy; 2026 Unified Wealth Intelligence Network Corp.</div>
      <div className="flex items-center gap-4">
        <span>SECURITY LEVEL: COMPLIANT RBAC</span>
        <span className="text-emerald-500">SYSTEM STATS: ONLINE</span>
      </div>
    </footer>
  );
};