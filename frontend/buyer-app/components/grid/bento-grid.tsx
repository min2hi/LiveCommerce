"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Play, Users, Clock } from "@phosphor-icons/react";

const LIVE_ROOMS = [
  {
    id: "room-1",
    title: "Premium Tech Flash Sale",
    streamer: "TechGear",
    viewers: "12.4k",
    status: "LIVE",
    image: "https://picsum.photos/seed/techgear-live/600/400",
    variant: "hero",
  },
  {
    id: "room-2",
    title: "Minimalist Desk Setup",
    streamer: "Studio One",
    viewers: "8.2k",
    status: "LIVE",
    image: "https://picsum.photos/seed/studio-one/400/400",
    variant: "standard",
  },
  {
    id: "room-3",
    title: "Audio Enthusiast Hour",
    streamer: "SoundScape",
    viewers: "3.1k",
    status: "STARTING SOON",
    variant: "tinted", 
  },
  {
    id: "room-4",
    title: "Mechanical Keyboard Drops",
    streamer: "KeyCrafters",
    viewers: "4.5k",
    status: "LIVE",
    image: "https://picsum.photos/seed/keyboard/400/400",
    variant: "standard",
  },
];

export function BentoGrid() {
  const reduce = useReducedMotion();

  return (
    <section className="w-full bg-[#0d0f14] py-24 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        
        <div className="mb-12 flex items-baseline justify-between">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Featured Live Rooms
          </h2>
          <span className="text-xs font-mono font-semibold text-[#a855f7]/85 uppercase tracking-widest">
            {LIVE_ROOMS.length} Active Streams
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
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
                      : "bg-[#1c2236]/30 border-white/5 shadow-md hover:shadow-[0_0_24px_rgba(168,85,247,0.15)] hover:border-[#a855f7]/30"
                  }`}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Background Layer */}
                  {!isTinted && room.image && (
                    <>
                      <img
                        src={room.image}
                        alt={room.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/50 to-transparent"></div>
                    </>
                  )}

                  {/* Content Layer */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          room.status === "LIVE"
                            ? "bg-red-500 text-white"
                            : "bg-white/10 text-zinc-300"
                        }`}
                      >
                        {room.status === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1"></span>}
                        {room.status}
                      </span>
                      <span className={`inline-flex items-center text-xs font-mono font-medium ${isTinted ? "text-zinc-400" : "text-zinc-200"}`}>
                        {room.status === "LIVE" ? <Users className="mr-1 text-[#06b6d4]" weight="fill" /> : <Clock className="mr-1 text-[#a855f7]" weight="bold" />}
                        {room.viewers}
                      </span>
                    </div>

                    <h3 className={`text-xl md:text-2xl font-bold tracking-tight mb-1.5 ${isTinted ? "text-white" : "text-white"}`}>
                      {room.title}
                    </h3>
                    <p className={`text-xs font-medium ${isTinted ? "text-zinc-400" : "text-zinc-300"}`}>
                      by <span className="font-semibold">{room.streamer}</span>
                    </p>
                  </div>

                  {/* Hover Play Button (only for images) */}
                  {!isTinted && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#0d0f14]/40">
                      <div className="w-14 h-14 rounded-full bg-[#a855f7]/20 backdrop-blur-md flex items-center justify-center border border-[#a855f7]/30 text-white shadow-lg active:scale-95 transition-transform">
                        <Play size={24} weight="fill" className="text-[#a855f7]" />
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
