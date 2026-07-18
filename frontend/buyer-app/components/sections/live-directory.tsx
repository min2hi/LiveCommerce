"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Users, Play } from "@phosphor-icons/react";

import { buildApiUrl } from "@/lib/api";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

// Types
interface Livestream {
  id: string;
  title: string;
  shopName?: string;
  username?: string;
  viewers: number;
  thumbnail?: string;
}

export function LiveDirectory() {
  const { data: streams = [], isLoading: loading } = useSWR<Livestream[]>(
    buildApiUrl("/livestreams/active"),
    fetcher,
    { revalidateOnFocus: false }
  );

  return (
    <section className="w-full bg-[#050505] py-24 border-b border-[#222] relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-[#222]">
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white uppercase">
            Live Channels
          </h2>
          <div className="flex gap-2">
             <span className="px-3.5 py-1.5 bg-[#111] border border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-widest hover:text-white hover:border-white cursor-pointer transition-colors rounded-full shadow-sm">Gaming</span>
             <span className="px-3.5 py-1.5 bg-[#111] border border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-widest hover:text-white hover:border-white cursor-pointer transition-colors rounded-full shadow-sm">Fashion</span>
             <span className="hidden sm:inline-flex px-3.5 py-1.5 bg-[#111] border border-[#333] text-[10px] font-bold text-[#888] uppercase tracking-widest hover:text-white hover:border-white cursor-pointer transition-colors rounded-full shadow-sm">Beauty</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {streams.map((stream, idx) => (
              <Link href={`/live/${stream.id}`} key={stream.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group flex flex-col gap-4 cursor-pointer"
                >
                  {/* Thumbnail Container */}
                  <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 border border-[#222] group-hover:border-white transition-colors rounded-xl shadow-lg flex items-center justify-center">
                    {stream.thumbnail ? (
                      <img 
                        src={stream.thumbnail} 
                        alt={stream.title} 
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                        <Play size={32} weight="fill" className="text-zinc-500 mb-2" />
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">No Signal</span>
                      </div>
                    )}
                    {/* Live Badge */}
                    <div className="absolute top-3 left-3 bg-white text-black text-[10px] font-black px-2.5 py-1 uppercase tracking-widest border border-white rounded-md shadow-md">
                      LIVE
                    </div>
                    {/* Viewers Badge */}
                    <div className="absolute bottom-3 right-3 bg-[#111] text-white text-[10px] font-bold px-2.5 py-1 flex items-center gap-1.5 border border-[#333] font-mono rounded-md shadow-md">
                      <Users size={12} weight="bold" className="text-[#888]" />
                      {stream.viewers.toLocaleString()}
                    </div>
                    {/* Hover Overlay Play Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                       <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-all duration-300 group-hover:bg-white group-hover:text-black shadow-2xl">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-current ml-1 transition-colors"></div>
                       </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex gap-3 px-1 items-start mt-1">
                    {/* Avatar */}
                    <div className="w-9 h-9 bg-white flex-shrink-0 flex items-center justify-center text-black font-black text-[10px] uppercase border border-white rounded-full shadow-sm">
                      {stream.shopName?.charAt(0).toUpperCase() || "S"}
                    </div>
                    
                    <div className="flex flex-col overflow-hidden w-full">
                      <h3 className="text-xs font-black text-white leading-tight uppercase tracking-tight group-hover:text-white transition-colors truncate">
                        {stream.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222]">
                        <p className="text-[10px] font-bold text-[#888] uppercase tracking-widest truncate">
                          @{stream.shopName}
                        </p>
                        <p className="text-[10px] text-[#666] font-mono">
                          {Math.floor(Math.random() * 10) + 1} CAT
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
        {!loading && (!streams || streams.length === 0) && (
          <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-[#333] rounded-2xl bg-[#0a0a0a]">
            <Play size={48} className="text-[#333] mb-4" weight="duotone" />
            <h3 className="text-xl font-bold text-white mb-2">Không có kênh nào đang phát sóng</h3>
            <p className="text-sm text-[#888] max-w-md">Hiện tại các Streamer đang nghỉ ngơi. Bạn hãy quay lại vào khung giờ vàng (20h tối) để săn sale nhé!</p>
          </div>
        )}
      </div>
    </section>
  );
}
