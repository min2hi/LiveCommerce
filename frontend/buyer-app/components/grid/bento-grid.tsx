"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Play, Users, Clock } from "@phosphor-icons/react";

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
  variant: "hero" | "standard" | "tinted";
}

const LIVE_ROOMS: LiveRoom[] = [
  {
    id: "room-1",
    title: "Premium Tech Flash Sale: Gamer Setups",
    streamer: "TechGear",
    avatar: "TG",
    viewers: "12.4k",
    status: "LIVE",
    duration: "02:14:05",
    category: "Gamer Setup",
    tags: ["#gadgets", "#sale"],
    image: "https://picsum.photos/seed/techgear-live/800/600",
    variant: "hero",
  },
  {
    id: "room-2",
    title: "Minimalist Desk Setups & Design Chat",
    streamer: "Studio One",
    avatar: "S1",
    viewers: "8.2k",
    status: "LIVE",
    duration: "01:42:18",
    category: "Design",
    tags: ["#minimalist", "#study"],
    image: "https://picsum.photos/seed/studio-one/500/500",
    variant: "standard",
  },
  {
    id: "room-3",
    title: "Audio Enthusiast Hour: Live Synthesizers",
    streamer: "SoundScape",
    avatar: "SS",
    viewers: "Starting Soon",
    status: "07:30 PM",
    category: "Music Production",
    tags: ["#synth", "#audio"],
    variant: "tinted", 
  },
  {
    id: "room-4",
    title: "Custom Mechanical Keyboard Drops",
    streamer: "KeyCrafters",
    avatar: "KC",
    viewers: "4.5k",
    status: "LIVE",
    duration: "03:05:12",
    category: "Hardware DIY",
    tags: ["#keyboard", "#diy"],
    image: "https://picsum.photos/seed/keyboard/500/500",
    variant: "standard",
  },
];

export function BentoGrid() {
  const reduce = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <section className="w-full bg-[#0d0f14] py-24 border-b border-white/5 relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        
        <div className="mb-12 flex items-baseline justify-between">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Featured Live Rooms
          </h2>
          <span className="text-xs font-mono font-semibold text-[#a855f7]/85 uppercase tracking-widest">
            {LIVE_ROOMS.filter(r => r.duration).length} Active Streams
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
          {LIVE_ROOMS.map((room, i) => {
            const isHero = room.variant === "hero";
            const isTinted = room.variant === "tinted";

            return (
              <Link
                href="/live/cc9db567-1d5e-45a2-8544-c3a098f6718f"
                key={room.id}
                className={`${isHero ? "md:col-span-2" : "md:col-span-1"} block cursor-pointer`}
              >
                <motion.div
                  className={`group relative w-full h-full overflow-hidden rounded-2xl flex flex-col justify-end p-6 border transition-all duration-300 ${
                    isTinted 
                      ? "bg-[#161b27] border-white/10 text-white shadow-sm" 
                      : "bg-[#1c2236]/20 border-white/5 shadow-md"
                  }`}
                  onMouseMove={handleMouseMove}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Spotlight Background Overlay */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
                    style={{
                      background: "radial-gradient(280px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(168, 85, 247, 0.08), transparent 80%)",
                    }}
                  />

                  {/* Spotlight Border Glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10 rounded-2xl"
                    style={{
                      background: "radial-gradient(180px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(168, 85, 247, 0.2), transparent 80%)",
                      boxShadow: "inset 0 0 0 1px rgba(168, 85, 247, 0.25)"
                    }}
                  />

                  {/* Background Image Layer */}
                  {!isTinted && room.image && (
                    <>
                      <img
                        src={room.image}
                        alt={room.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/55 to-transparent z-0"></div>
                    </>
                  )}

                  {/* Content Layer */}
                  <div className="relative z-10 w-full">
                    {/* Live & Metadata Badges */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                            room.duration
                              ? "bg-red-500 text-white"
                              : "bg-white/10 text-zinc-300"
                          }`}
                        >
                          {room.duration && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1"></span>}
                          {room.duration ? "LIVE" : "UPCOMING"}
                        </span>
                        
                        {room.duration && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-zinc-300 font-mono">
                            {room.duration}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center text-xs font-mono font-medium text-zinc-200">
                        {room.duration ? (
                          <>
                            <Users className="mr-1 text-[#06b6d4]" weight="fill" />
                            {room.viewers}
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 text-[#a855f7]" weight="bold" />
                            {room.status}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Category Label */}
                    <div className="mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#a855f7] bg-[#a855f7]/10 px-2.5 py-0.5 rounded-full border border-[#a855f7]/15">
                        {room.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white leading-tight">
                      {room.title}
                    </h3>

                    {/* Streamer Avatar & Name & Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#a855f7]/20 border border-[#a855f7]/30 flex items-center justify-center text-[10px] font-bold text-white font-mono">
                          {room.avatar}
                        </div>
                        <span className="text-xs font-medium text-zinc-300">
                          {room.streamer}
                        </span>
                      </div>

                      {/* Stream Tags */}
                      <div className="flex gap-1.5">
                        {room.tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hover Play Button (only for rooms with background images) */}
                  {!isTinted && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#0d0f14]/30 pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-[#a855f7]/20 backdrop-blur-md flex items-center justify-center border border-[#a855f7]/30 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play size={24} weight="fill" className="text-[#a855f7] ml-0.5" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
