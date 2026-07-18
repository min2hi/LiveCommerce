"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Play, Bell } from "@phosphor-icons/react";
import { buildApiUrl } from "@/lib/api";

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

const LIVE_ROOMS: LiveRoom[] = [
  {
    id: "techgear",
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
    id: "soundlab",
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
    id: "upcoming-1",
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
    id: "keycrafters",
    title: "Custom Mechanical Keyboard Drops",
    streamer: "KeyCrafters",
    avatar: "KC",
    viewers: "4.5k",
    status: "LIVE",
    duration: "03:05:12",
    category: "Hardware DIY",
    tags: ["#keyboard", "#diy"],
    image: "https://picsum.photos/seed/keyboard/800/600",
    variant: "wide",
  },
];

export function BentoGrid() {
  const reduce = useReducedMotion();
  const [rooms, setRooms] = useState<LiveRoom[]>(LIVE_ROOMS);

  // Local state for live bids
  const [bids, setBids] = useState<Record<string, number>>({
    "techgear": 240,
    "soundlab": 110,
    "keycrafters": 85,
  });

  // Local state for which room recently got a new bid (for flash animation)
  const [activeBidFlash, setActiveBidFlash] = useState<string | null>(null);

  // Local state for upcoming drop countdown seconds (e.g. 2 hours 14 mins 5 secs = 8045 seconds)
  const [countdownSeconds, setCountdownSeconds] = useState(8045);

  // Local state for Remind Me alerts
  const [remindedRooms, setRemindedRooms] = useState<string[]>([]);

  // Fetch active streams on mount
  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        const res = await fetch(buildApiUrl("/livestreams/active"));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: LiveRoom[] = data.map((item: { id: string; title: string; shopName?: string; shopId: string; viewers: number; }, idx: number) => {
              const variant = idx === 0 ? "hero" : idx === 1 ? "standard" : idx === 2 ? "wide" : "tinted";
              return {
                id: item.id,
                title: item.title,
                streamer: item.shopName || `Shop ${item.shopId.substring(0, 5)}`,
                avatar: (item.shopName || "S").substring(0, 2).toUpperCase(),
                viewers: item.viewers >= 1000 ? (item.viewers / 1000).toFixed(1) + "k" : item.viewers.toString(),
                status: "LIVE",
                duration: "00:00:00", // Will be incremented or placeholder
                category: "Hardware DIY",
                tags: ["#live", "#shop"],
                image: `https://picsum.photos/seed/${item.id}/800/600`,
                variant,
              };
            });
            setRooms(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch active streams:", err);
      }
    };
    fetchActiveStreams();
  }, []);

  // Periodically increment random bids to simulate active bidding
  useEffect(() => {
    const interval = setInterval(() => {
      if (rooms.length === 0) return;
      const liveRooms = rooms.filter(r => r.duration);
      if (liveRooms.length === 0) return;
      const targetRoom = liveRooms[Math.floor(Math.random() * liveRooms.length)].id;
      const increments = [5, 10, 15, 20];
      const increment = increments[Math.floor(Math.random() * increments.length)];

      setBids((prev) => ({
        ...prev,
        [targetRoom]: (prev[targetRoom] || 100) + increment,
      }));

      // Trigger visual flash
      setActiveBidFlash(targetRoom);
      setTimeout(() => {
        setActiveBidFlash(null);
      }, 800);
    }, 3000);

    return () => clearInterval(interval);
  }, [rooms]);

  // Tick down the countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 8045));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, "0")}h : ${m.toString().padStart(2, "0")}m : ${s.toString().padStart(2, "0")}s`;
  };

  const toggleReminder = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRemindedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  return (
    <section id="trending-deals" className="w-full bg-[#050505] py-24 border-b border-[#222] relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        <div className="mb-12 flex flex-col gap-2 pb-6 border-b border-[#222]">
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white uppercase">
              Featured Rooms
            </h2>
            <span className="text-[10px] font-mono font-bold text-[#888] uppercase tracking-widest bg-[#111] border border-[#333] px-2 py-1 rounded-md">
              {rooms.filter(r => r.duration).length} Active
            </span>
          </div>
          <p className="text-sm text-[#888] tracking-wide">
            Explore trending streams with real-time deals and flash auctions
          </p>
        </div>

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
                  {/* Background Image Layer */}
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

                  {/* Content Layer */}
                  <div className="relative z-10 w-full">
                    {/* Live & Metadata Badges */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {room.duration ? (
                          <div className="bg-white text-black flex items-center justify-center px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
                            LIVE
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 border border-[#444] bg-[#111] text-[10px] font-bold uppercase tracking-widest text-[#888] rounded-md shadow-sm">
                            UPCOMING
                          </span>
                        )}

                        {room.duration && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111] text-[10px] font-bold text-white border border-[#333] font-mono rounded-md shadow-sm">
                            {room.duration}
                          </span>
                        )}

                        {room.duration && (
                          <motion.span
                            animate={activeBidFlash === room.id ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.3 }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black font-mono tracking-widest uppercase transition-colors duration-300 rounded-md shadow-sm ${activeBidFlash === room.id
                                ? "bg-white text-black border border-white"
                                : "bg-[#111] text-white border border-[#333]"
                              }`}
                          >
                            BID: ${bids[room.id] || 0}
                          </motion.span>
                        )}

                        {!room.duration && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#111] border border-[#333] text-[10px] font-bold text-white font-mono rounded-md shadow-sm">
                            {formatCountdown(countdownSeconds)}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#888]">
                        {room.duration ? (
                          <>
                            {room.viewers} VIEWERS
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => toggleReminder(e, room.id)}
                              className={`px-4 py-1.5 border transition-colors cursor-pointer flex items-center justify-center z-20 font-black rounded-full shadow-md ${remindedRooms.includes(room.id)
                                  ? "bg-white text-black border-white"
                                  : "bg-[#111] border-[#333] text-white hover:border-white"
                                }`}
                              title={remindedRooms.includes(room.id) ? "Reminder Set" : "Notify Me"}
                            >
                              <Bell size={12} weight="bold" className="mr-1" />
                              {remindedRooms.includes(room.id) ? "ADDED" : "REMIND"}
                            </button>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Category Label */}
                    <div className="mb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#888] bg-[#111] px-2.5 py-1 border border-[#333] rounded-md shadow-sm">
                        {room.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 text-white leading-none">
                      {room.title}
                    </h3>

                    {/* Streamer Avatar & Name & Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-[#222]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white flex items-center justify-center text-[10px] font-black text-black uppercase rounded-full shadow-sm">
                          {room.avatar}
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                          @{room.streamer}
                        </span>
                      </div>

                      {/* Stream Tags */}
                      <div className="flex gap-1.5">
                        {room.tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#666] bg-[#111] border border-[#333] px-2 py-0.5 rounded-md shadow-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hover Play Button */}
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
      </div>
    </section>
  );
}
