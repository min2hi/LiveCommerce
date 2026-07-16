"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Users } from "@phosphor-icons/react";

import { buildApiUrl } from "@/lib/api";

// Types
interface Livestream {
  id: string;
  title: string;
  shopName?: string;
  username?: string;
  viewers: number;
  thumbnail?: string;
}

const MOCK_STREAMS: Livestream[] = [
  {
    id: "mock-stream-1",
    title: "Unboxing the new RTX 5090 Ti - Live Benchmarks",
    shopName: "PC Master Race",
    viewers: 12504,
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1470&auto=format&fit=crop",
  },
  {
    id: "mock-stream-2",
    title: "Sneaker Drop: Air Jordan 1 Travis Scott Edition",
    shopName: "HypeKicks",
    viewers: 8230,
    thumbnail: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1450&auto=format&fit=crop",
  },
  {
    id: "mock-stream-3",
    title: "Skincare Routine 101 - 50% Flash Sale Now!",
    shopName: "Glow Beauty",
    viewers: 3412,
    thumbnail: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?q=80&w=1471&auto=format&fit=crop",
  },
  {
    id: "mock-stream-4",
    title: "Keychron Q1 Pro Custom Build + Giveaway",
    shopName: "KeyCrafters",
    viewers: 5900,
    thumbnail: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1471&auto=format&fit=crop",
  },
];

export function LiveDirectory() {
  const [streams, setStreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(buildApiUrl("/livestreams/active"))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // If the backend has streams but no thumbnails, assign random ones for demo
          const enhancedData = data.map((stream: Livestream, index: number) => ({
            ...stream,
            thumbnail: stream.thumbnail || MOCK_STREAMS[index % MOCK_STREAMS.length].thumbnail,
            shopName: stream.shopName || stream.username || "Live Shop",
          }));
          setStreams(enhancedData);
        } else {
          setStreams(MOCK_STREAMS);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch active streams, using mock data", err);
        setStreams(MOCK_STREAMS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="w-full bg-[#0d0f14] py-16 border-b border-white/5 relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Channels
          </h2>
          <div className="flex gap-2">
             <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border border-white/5">Gaming</span>
             <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border border-white/5">Fashion</span>
             <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border border-white/5">Beauty</span>
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
                  className="group flex flex-col gap-3 cursor-pointer"
                >
                  {/* Thumbnail Container */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5">

                    <img 
                      src={stream.thumbnail} 
                      alt={stream.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Live Badge */}
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                      LIVE
                    </div>
                    {/* Viewers Badge */}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1.5 border border-white/10">
                      <Users size={12} weight="fill" className="text-zinc-300" />
                      {stream.viewers.toLocaleString()}
                    </div>
                    {/* Hover Overlay Play Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center backdrop-blur-md border border-cyan-400/30">
                          <div className="w-0 h-0 border-t-8 border-b-8 border-l-[14px] border-transparent border-l-white ml-1"></div>
                       </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex gap-3 px-1">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {stream.shopName?.charAt(0).toUpperCase() || "S"}
                    </div>
                    
                    <div className="flex flex-col overflow-hidden">
                      <h3 className="text-sm font-semibold text-white leading-tight truncate group-hover:text-cyan-400 transition-colors">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {stream.shopName}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                        {Math.floor(Math.random() * 10) + 1} Categories
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
