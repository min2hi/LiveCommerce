"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Play } from "@phosphor-icons/react";
import useSWR from "swr";
import { buildApiUrl } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";

interface LiveRoom {
  id: string;
  title: string;
  streamer: string;
  avatar: string;
  viewers: string;
  status: string;
  duration?: string;
  category: string;
  tags: string[];
  image?: string;
  variant: "hero" | "standard" | "wide" | "tinted";
}

export function BentoGrid() {
  const reduce = useReducedMotion();

  const { data, error } = useSWR(buildApiUrl("/livestreams/active"), fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const rooms = React.useMemo(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      return data.map((item: any, idx: number) => {
        const variant = idx === 0 ? "hero" : idx === 1 ? "standard" : idx === 2 ? "wide" : "tinted";
        return {
          id: item.id,
          title: item.title,
          streamer: item.shopName || `Shop ${item.shopId?.substring(0, 5) || ""}`,
          avatar: (item.shopName || "S").substring(0, 2).toUpperCase(),
          viewers: item.viewers >= 1000 ? (item.viewers / 1000).toFixed(1) + "k" : (item.viewers || 0).toString(),
          status: "LIVE",
          duration: "00:00:00", // Optional: Real duration can be calculated if backend provides start_time
          category: "Livestream",
          tags: ["#live", "#shop"],
          image: "",
          variant,
        } as LiveRoom;
      });
    }
    return [];
  }, [data]);

  return (
    <section id="trending-deals" className="w-full bg-[#050505] py-24 border-b border-[#222] relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-12 flex flex-col gap-2 pb-6 border-b border-[#222]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white uppercase">
              Featured Rooms
            </h2>
            <span className="text-[10px] font-mono font-bold text-[#888] uppercase tracking-widest bg-[#111] border border-[#333] px-2 py-1 rounded-md">
              {rooms.length} Active
            </span>
          </div>
          <p className="text-sm text-[#888] tracking-wide">
            Explore trending streams with real-time deals
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0a] rounded-2xl border border-[#222]">
            <Play size={48} className="text-[#333] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Active Streams</h3>
            <p className="text-[#666] text-sm text-center max-w-md">
              There are no livestreams happening right now. Please check back later or view upcoming scheduled drops.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
            {rooms.map((room, i) => {
              const isHero = room.variant === "hero";
              const isWide = room.variant === "wide";
              const isTinted = room.variant === "tinted";

              return (
                <Link
                  href={`/live/${room.id}`}
                  key={room.id}
                  className={`${(isHero || isWide) ? "md:col-span-2" : "md:col-span-1"} block cursor-pointer`}
                >
                  <motion.div
                    className={`group relative w-full h-full overflow-hidden rounded-2xl flex flex-col justify-end p-6 border transition-colors duration-300 ${isTinted
                        ? "bg-[#111] border-[#333] text-white hover:border-white"
                        : "bg-[#0a0a0a] border-[#222] hover:border-white"
                      }`}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {!isTinted && room.image && (
                      <>
                        <img
                          src={room.image}
                          alt={room.title}
                          className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-0"></div>
                      </>
                    )}

                    <div className="relative z-10 w-full">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="bg-white text-black flex items-center justify-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
                            LIVE
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#888]">
                          {room.viewers} VIEWERS
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#888] bg-[#111] px-2.5 py-1 border border-[#333] rounded-md shadow-sm">
                          {room.category}
                        </span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 text-white leading-none">
                        {room.title}
                      </h3>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-[#222]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-white flex items-center justify-center text-[10px] font-black text-black uppercase rounded-full shadow-sm">
                            {room.avatar}
                          </div>
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                            @{room.streamer}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {room.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#666] bg-[#111] border border-[#333] px-2 py-0.5 rounded-md shadow-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {!isTinted && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-all duration-300 group-hover:bg-white group-hover:text-black shadow-2xl">
                          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-current ml-1.5 transition-colors"></div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
