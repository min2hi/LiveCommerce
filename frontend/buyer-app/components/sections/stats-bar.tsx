"use client";

import React from "react";
import { Users, ShoppingBag } from "@phosphor-icons/react";

export function StatsBar() {
  return (
    <div className="w-full bg-[#161b27] text-white py-4 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col sm:flex-row justify-around items-center gap-4 text-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-zinc-400 uppercase tracking-widest">System Status:</span>
          <span className="font-bold text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]">LIVE TELEMETRY</span>
        </div>
        
        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <Users size={16} className="text-[#a855f7]" />
          <span className="text-zinc-400 uppercase tracking-widest">Active Viewers:</span>
          <span className="font-bold text-white">12,408 CONNECTED</span>
        </div>

        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-[#06b6d4]" />
          <span className="text-zinc-400 uppercase tracking-widest">Completed Deals:</span>
          <span className="font-bold text-white">13 CONFIRMED</span>
        </div>
      </div>
    </div>
  );
}
