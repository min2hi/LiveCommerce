"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "@phosphor-icons/react";
import { buildApiUrl } from "@/lib/api";

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
        const res = await fetch(buildApiUrl("/livestreams/active"));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: LiveStream[] = data.map((item: { id: string; shopName?: string; shopId: string; title: string; viewers: number; }) => ({
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
      className="relative w-full overflow-hidden bg-[#050505] pt-20 pb-24"
    >

      <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">

          {/* Column 1: Headline & Content (7 cols on desktop) */}
          <motion.div
            className="md:col-span-7 flex flex-col justify-center pl-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex items-center gap-3 mb-8" variants={itemVariants}>
              <div className="flex items-center gap-2 px-3 py-1.5 border border-[#333] bg-[#111] rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white font-mono font-bold">
                  Network Active
                </span>
              </div>
            </motion.div>

            {/* Brutalist Typography */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-[56px] sm:text-[72px] lg:text-[88px] font-sans font-black tracking-[-0.06em] leading-[0.9] text-white uppercase">
                Shop<br />
                <span className="text-[#444]">The Moment.</span>
              </h1>
            </motion.div>

            <motion.p
              className="text-sm text-[#888] leading-relaxed max-w-[42ch] mb-12 font-medium tracking-wide"
              variants={itemVariants}
            >
              Next-generation shopping architecture. Interactive showcases with sub-second latency and frictionless checkouts.
            </motion.p>

            <motion.div className="flex flex-wrap items-center gap-4" variants={itemVariants}>
              <Link href={streams[activeIndex] ? streams[activeIndex].link : "/"} className="w-full sm:w-auto block">
                <button className="w-full sm:w-auto h-14 px-8 bg-white text-black font-bold uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3 hover:bg-[#ccc] transition-colors border-none cursor-pointer rounded-full shadow-lg">
                  Enter Shows
                  <ArrowRight weight="bold" size={16} />
                </button>
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
                    className={`absolute top-0 left-0 w-full h-full bg-[#0a0a0a] rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xl group ${isActive
                      ? "border-white cursor-pointer"
                      : "border-[#333] cursor-pointer opacity-70 hover:opacity-100"
                      }`}
                  >
                    <Link href={stream.link} className={isActive ? "pointer-events-auto" : "pointer-events-none"}>
                      <div className="relative w-full h-full">
                        {isActive ? (
                          <video
                            src={stream.videoUrl}
                            className="w-full h-full object-cover select-none pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300 grayscale contrast-125"
                            autoPlay loop muted playsInline
                          />
                        ) : (
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="w-full h-full object-cover select-none pointer-events-none opacity-40 grayscale"
                            loading="lazy"
                          />
                        )}

                        {/* Brutalist Live Status Badge */}
                        <div className="absolute top-4 left-4 px-2.5 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
                          Live
                        </div>

                        {/* Viewers Badge */}
                        <div className="absolute top-4 right-4 px-2.5 py-1 bg-[#111] text-[#fff] text-[10px] font-bold font-mono border border-[#333] rounded-md shadow-sm">
                          {stream.viewers} watching
                        </div>

                        {/* Dynamic Bidding Deal Applied overlay */}
                        {isActive && stream.deal && (
                          <div className="absolute bottom-20 left-4 z-30">
                            <div className="bg-[#111] px-3 py-1.5 border border-[#333] flex items-center gap-2 rounded-md shadow-lg">
                              <span className="text-white font-mono font-bold text-[9px] md:text-[10px] tracking-widest uppercase">
                                {stream.deal}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Title and Streamer info */}
                        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#888] uppercase tracking-widest">@{stream.streamer}</span>
                          <span className="text-sm font-black text-white uppercase tracking-tight truncate">{stream.title}</span>
                        </div>

                        {/* Ambient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Editorial Registry List: Displays all 4 streams & titles clearly */}
            <div className="mt-8 flex flex-col w-[calc(100%-20px)] border border-[#222] rounded-xl overflow-hidden shadow-lg bg-[#050505]">
              {streams.map((stream, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={stream.id}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-full flex items-center justify-between p-4 border-b border-[#222] last:border-b-0 transition-colors cursor-pointer text-left ${isActive
                      ? "bg-[#111] text-white"
                      : "bg-transparent text-[#666] hover:text-white hover:bg-[#0a0a0a]"
                      }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {isActive ? (
                        <Play size={12} weight="fill" className="text-white" />
                      ) : (
                        <span className="font-mono text-[10px] font-bold">
                          0{idx + 1}
                        </span>
                      )}

                      <div className="flex flex-col min-w-0">
                        <span className={`text-[10px] uppercase tracking-widest font-bold leading-none mb-1.5 ${isActive ? "text-[#fff]" : "text-[#666]"}`}>
                          @{stream.streamer}
                        </span>
                        <span className={`text-xs uppercase tracking-tight truncate max-w-[160px] md:max-w-[200px] ${isActive ? "text-[#aaa] font-bold" : "text-[#555] font-medium"}`}>
                          {stream.title}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold ${isActive ? "text-white" : "text-[#444]"}`}>
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
