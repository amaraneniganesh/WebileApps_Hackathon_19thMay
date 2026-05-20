"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const AssetAllocationPie = ({ data }: { data: { name: string; value: number }[] }) => {
  const COLOR_PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="h-64 w-full bg-[#111827] rounded-xl p-4 border border-[#374151]">
      <div className="text-sub uppercase text-xs font-bold mb-2 tracking-wider">Asset Concentration Allocation Mapping</div>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#0B0F19", borderColor: "#374151", borderRadius: "8px" }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};