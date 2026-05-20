"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CoreDashboardSwitcherPage() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !profile) return;
    
    // Dynamic Role-Based Redirect Router Matrix
    const roles = profile.roles;
    if (roles.includes("ADMIN")) router.replace("/dashboard/admin");
    else if (roles.includes("RM")) router.replace("/dashboard/rm");
    else if (roles.includes("OPS")) router.replace("/dashboard/ops");
    else router.replace("/dashboard/viewer");
  }, [isAuthenticated, profile, router]);

  return (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="text-mono text-xs text-sub uppercase tracking-widest">Resolving Role Workspace Node...</span>
    </div>
  );
}