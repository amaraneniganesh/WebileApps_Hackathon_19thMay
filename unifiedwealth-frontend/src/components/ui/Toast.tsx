"use client";
import React from "react";
import { useWealthStore } from "@/store/useWealthStore";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

export const ToastNotification = () => {
  const { globalToastMessage, clearToast } = useWealthStore();
  if (!globalToastMessage) return null;

  const styleMatrix = 
    globalToastMessage.type === "success" ? "bg-emerald-950 border-emerald-500 text-emerald-200" :
    globalToastMessage.type === "danger" ? "bg-rose-950 border-rose-500 text-rose-200" : "bg-amber-950 border-amber-500 text-amber-200";

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all max-w-sm ${styleMatrix}`}>
      {globalToastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      <span className="text-sm font-medium">{globalToastMessage.text}</span>
      <button onClick={clearToast} className="p-1 hover:bg-white/10 rounded-lg ml-auto"><X className="w-4 h-4" /></button>
    </div>
  );
};