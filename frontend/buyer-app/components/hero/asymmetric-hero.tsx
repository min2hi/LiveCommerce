"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface LiveStream {
  id: string;
  streamer: string;
  title: string;
  viewers: string;
  videoUrl: string;
  thumbnailUrl: string;
  deal?: string;
  link: string;
}

const FEATURED_STREAMS: LiveStream[] = [
  {
    id: "techgear",
    streamer: "TechGear Official",
    title: "Sony WH-1000XM5 Deals",
    viewers: "12.4K",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-keyboard-keys-in-detail-close-up-43105-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=60",
    deal: "Live Deal: 15% OFF Applied",
    link: "/live/d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782",
  },
  {
    id: "soundlab",
    streamer: "SoundLab Live",
    title: "Unboxing Studio Gear",
    viewers: "8.2K",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-41315-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=60",
    deal: "Live Coupon: $20 Applied",
    link: "/live/soundlab",
  },
  {
    id: "gamersetups",
    streamer: "GamerSetups",
    title: "RTX 5090 Showcase",
    viewers: "19.5K",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-next-to-a-computer-keyboard-43152-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=60",
    deal: "Flash Sale: RTX Bundle",
    link: "/live/gamersetups",
  },
  {
    id: "keycrafters",
    streamer: "KeyCrafters",
    title: "Custom Keyboard Build",
    viewers: "4.5K",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-keyboard-keys-in-detail-close-up-43105-large.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=60",
    deal: "10% OFF Switch Sets",
    link: "/live/keycrafters",
  },
];

export function AsymmetricHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [streams, setStreams] = useState<LiveStream[]>(FEATURED_STREAMS);
  const [activeIndex, setActiveIndex] = useState(0);

  // Staggered load animation variants for hero contents
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  // Fetch active streams from backend database
  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/livestreams/active");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: LiveStream[] = data.map((item: any) => ({
              id: item.id,
              streamer: item.shopName || `Shop ${item.shopId.substring(0, 5)}`,
              title: item.title,
              viewers: item.viewers >= 1000 ? (item.viewers / 1000).toFixed(1) + "K" : item.viewers.toString(),
              videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-keyboard-keys-in-detail-close-up-43105-large.mp4",
              thumbnailUrl: `https://picsum.photos/seed/${item.id}/800/600`,
              deal: "Live Deal: 15% OFF Applied",
              link: `/live/${item.id}`,
            }));
            setStreams(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch active streams:", err);
      }
    };
    fetchActiveStreams();
  }, []);

  // Auto-cycle deck every 5 seconds (5000ms)
  useEffect(() => {
    if (streams.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % streams.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [streams]);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#0d0f14] pt-28 pb-24 border-b border-white/5"
    >
      {/* Decorative clean background line to create editorial structure */}
      <div className="absolute top-0 bottom-0 left-[8%] md:left-[12%] w-[1px] bg-white/5 hidden md:block"></div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">

          {/* Column 1: Headline & Content (7 cols on desktop) */}
          <motion.div
            className="md:col-span-7 flex flex-col justify-center pl-0 md:pl-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex items-center gap-2 mb-6" variants={itemVariants}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-mono block font-bold">
                Live Commerce Network
              </span>
            </motion.div>

            {/* Asymmetric Typography - Styled with high-end editorial focus */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.98] text-white mb-8 select-none"
              variants={itemVariants}
            >
              <span className="block mb-2">The live</span>
              <span className="block font-normal italic text-cyan-400 pl-4 md:pl-8">commerce</span>
              <span className="block">interface.</span>
            </motion.h1>

            <motion.p
              className="text-base text-zinc-400 leading-relaxed max-w-[42ch] mb-12 font-normal"
              variants={itemVariants}
            >
              Experience high-definition video streams, real-time interactive chats, and one-click instant checkouts. Directly in your browser.
            </motion.p>

            <motion.div className="flex flex-wrap items-center gap-4" variants={itemVariants}>
              <Link href={streams[activeIndex] ? streams[activeIndex].link : "/"} passHref className="w-full sm:w-auto">
                <Button size="lg" className="w-full inline-flex items-center gap-2 group cursor-pointer bg-cyan-500 text-zinc-950 font-semibold border-none hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  Enter Live Rooms
                  <ArrowUpRight
                    weight="bold"
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Column 2: Dynamic Interactive Livestream Card Stack & Registry List */}
          <div className="md:col-span-5 relative mt-12 md:mt-0 w-full max-w-[340px] md:max-w-[460px] mx-auto md:mx-0 flex flex-col justify-start">
            
            {/* Visual Card Stack */}
            <div className="relative w-full h-[212px] md:h-[288px]">
              {streams.map((stream, idx) => {
                // Calculate position relative to activeIndex
                const offset = (idx - activeIndex + streams.length) % streams.length;
                const isActive = offset === 0;

                // Render top 3 stacked cards for depth and optimum rendering speed
                if (offset > 2) return null;

                return (
                  <motion.div
                    key={stream.id}
                    style={{
                      originX: 0.5,
                      originY: 0.5,
                    }}
                    animate={{
                      x: offset * 18,
                      y: offset * 18,
                      scale: 1 - offset * 0.05,
                      zIndex: 30 - offset,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 150,
                      damping: 20,
                    }}
                    onClick={() => setActiveIndex(idx)}
                    className={`absolute top-0 left-0 w-full h-full bg-[#181c25] rounded-2xl border transition-all duration-300 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group ${
                      isActive 
                        ? "border-white/10 hover:border-cyan-500/50 cursor-pointer" 
                        : "border-white/5 cursor-pointer opacity-85 hover:opacity-100"
                    }`}
                  >
                    <Link href={stream.link} className={isActive ? "pointer-events-auto" : "pointer-events-none"}>
                      <div className="relative w-full h-full">
                        {/* Lazy load Video only on the top/focused card for 60fps performance */}
                        {isActive ? (
                          <video
                            src={stream.videoUrl}
                            className="w-full h-full object-cover select-none pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                            autoPlay loop muted playsInline
                          />
                        ) : (
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="w-full h-full object-cover select-none pointer-events-none opacity-40"
                            loading="lazy"
                          />
                        )}

                        {/* Live Status Badge */}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-zinc-300 font-mono border border-white/10 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Live
                        </div>

                        {/* Viewers Badge */}
                        <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-zinc-300 font-mono border border-white/10">
                          {stream.viewers} watching
                        </div>

                        {/* Dynamic Bidding Deal Applied overlay (only for active card) */}
                        {isActive && stream.deal && (
                          <div className="absolute bottom-16 left-4 z-30">
                            <div className="bg-[#0b0d10]/95 px-3 py-1.5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center gap-2 border border-cyan-500/30 backdrop-blur-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                              <span className="text-cyan-400 font-mono font-bold text-[9px] md:text-[10px] tracking-wider uppercase">
                                {stream.deal}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Title and Streamer info */}
                        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-0.5">
                          <span className="text-xs font-mono font-bold text-cyan-400">@{stream.streamer}</span>
                          <span className="text-sm font-semibold text-white truncate">{stream.title}</span>
                        </div>

                        {/* Ambient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Editorial Registry List: Displays all 4 streams & titles clearly */}
            <div className="mt-8 flex flex-col gap-2 w-[calc(100%-20px)]">
              {streams.map((stream, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={stream.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                      isActive 
                        ? "bg-cyan-500/[0.03] border-cyan-500/20 text-white shadow-[0_4px_12px_rgba(6,182,212,0.03)]" 
                        : "bg-[#181c25]/10 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#181c25]/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`font-mono text-[10px] font-bold ${isActive ? "text-cyan-400" : "text-zinc-700"}`}>
                        0{idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold leading-none mb-1 ${isActive ? "text-cyan-400" : "text-zinc-400"}`}>
                          @{stream.streamer}
                        </span>
                        <span className={`text-[10px] leading-none truncate max-w-[160px] md:max-w-[200px] ${isActive ? "text-zinc-300 font-medium" : "text-zinc-600"}`}>
                          {stream.title}
                        </span>
                      </div>
                    </div>
                    
                    <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 px-2 py-1 rounded-md ${
                      isActive ? "text-cyan-400 bg-cyan-500/10" : "text-zinc-600 bg-zinc-800/10"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${isActive ? "bg-cyan-400 animate-pulse" : "bg-zinc-600"}`}></span>
                      {stream.viewers}
                    </span>
                  </button>
                );
              })}
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
}
