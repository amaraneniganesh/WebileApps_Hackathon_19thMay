"use client";
import React from "react";
import { Sidenavbar } from "@/components/ui/Sidenavbar";
import { HeaderDash } from "@/components/ui/HeaderDash";
import { Footer } from "@/components/ui/Footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19]">
      <Sidenavbar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <HeaderDash />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto pb-12">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}