"use client";
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const PerformanceArea = ({ data }: { data: { timeline: string; capital: number }[] }) => {
  return (
    <div className="h-64 w-full bg-[#111827] rounded-xl p-4 border border-[#374151]">
      <div className="text-sub uppercase text-xs font-bold mb-2 tracking-wider">Historical Net Asset Valuation Growth Timeline</div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="glowColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="timeline" stroke="#475569" style={{ fontSize: "10px", fontFamily: "monospace" }} />
          <YAxis stroke="#475569" style={{ fontSize: "10px", fontFamily: "monospace" }} />
          <Tooltip contentStyle={{ backgroundColor: "#0B0F19", borderColor: "#374151", borderRadius: "8px" }} />
          <Area type="monotone" dataKey="capital" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#glowColor)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};