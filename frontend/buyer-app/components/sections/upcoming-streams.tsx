"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Bell, Check, ArrowRight, Info, CaretLeft, CaretRight } from "@phosphor-icons/react";
import useSWR from "swr";
import { buildApiUrl } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduledStream {
  id: string;
  shopId: string;
  title: string;
  description?: string;
  scheduledTime: string;
  bannerUrl?: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  shopName?: string;
}

export function UpcomingStreams() {
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});
  const { token } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340 + 16; // card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const { data: streams = [], isLoading: loading } = useSWR<ScheduledStream[]>(
    buildApiUrl("/scheduled-streams/upcoming"),
    fetcher,
    { fallbackData: [] }
  );

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [streams]);

  // Batch-check reminders when streams are loaded and token exists
  useEffect(() => {
    if (token && streams.length > 0) {
      streams.forEach((stream) => {
        if (remindedIds[stream.id] !== undefined) return; // already checked or set
        fetch(buildApiUrl(`/scheduled-streams/${stream.id}/remind/check`), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((status) => {
            if (status.isReminderSet) {
              setRemindedIds((prev) => ({ ...prev, [stream.id]: true }));
            } else {
              setRemindedIds((prev) => ({ ...prev, [stream.id]: false }));
            }
          })
          .catch(() => {});
      });
    }
  }, [token, streams]);

  const handleToggleReminder = async (streamId: string) => {
    if (!token) {
      setMessage("Vui lòng Đăng nhập để sử dụng tính năng Nhắc nhở!");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const isReminded = remindedIds[streamId];
    const method = isReminded ? "DELETE" : "POST";
    const url = buildApiUrl(`/scheduled-streams/${streamId}/remind`);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        setRemindedIds((prev) => ({
          ...prev,
          [streamId]: !isReminded,
        }));
      } else {
        const errorData = await res.json();
        console.error("Reminder update rejected:", errorData);
      }
    } catch (err) {
      console.error("Error toggling reminder:", err);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    return `${timeStr} - ${dateStr}`;
  };

  if (loading) {
    return (
      <section className="py-16 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="h-8 w-64 bg-zinc-800 rounded-md animate-pulse mb-4"></div>
        <div className="h-4 w-96 bg-zinc-800/60 rounded-md animate-pulse mb-8"></div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[300px] h-[380px] bg-zinc-900/50 rounded-2xl border border-white/5 animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </section>
    );
  }

  // Hide the section gracefully if no scheduled streams exist
  if (streams.length === 0) return null;

  return (
    <section className="py-20 border-t border-[#222] bg-[#050505] relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pb-6 border-b border-[#222]">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#888]">
              Live Commerce Network
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white uppercase">
              Upcoming Shows
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs text-[#666] font-bold uppercase tracking-widest mr-2">Swipe</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 border border-[#333] bg-[#0a0a0a] text-white flex items-center justify-center rounded-full hover:bg-white hover:text-black hover:border-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button 
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 border border-[#333] bg-[#0a0a0a] text-white flex items-center justify-center rounded-full hover:bg-white hover:text-black hover:border-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Slider Wrapper */}
        <div className="relative w-full">
          <div 
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4"
          >
            {streams.map((stream) => {
              const isReminded = remindedIds[stream.id];
              return (
                <div
                  key={stream.id}
                  className="w-[300px] md:w-[340px] flex-shrink-0 snap-start bg-[#0a0a0a] border border-[#222] hover:border-white transition-colors duration-300 group/card"
                >
                  {/* Banner Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                    {stream.bannerUrl ? (
                      <img
                        src={stream.bannerUrl}
                        alt={stream.title}
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover/card:opacity-100 group-hover/card:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center opacity-30 group-hover/card:opacity-60 transition-opacity z-10">
                        <Calendar size={32} weight="fill" className="text-zinc-500 mb-2" />
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Upcoming</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-white text-black px-2 py-1 text-[10px] font-black uppercase tracking-widest">
                      Scheduled
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col justify-between min-h-[200px]">
                    <div className="space-y-4">
                      <div className="text-[10px] font-mono font-bold text-white bg-[#111] border border-[#333] px-2 py-1 inline-block uppercase tracking-wider">
                        {formatTime(stream.scheduledTime)}
                      </div>
                      <h3 className="text-lg font-black text-white line-clamp-1 uppercase tracking-tight">
                        {stream.title}
                      </h3>
                      {stream.description && (
                        <p className="text-xs text-[#666] line-clamp-2 leading-relaxed font-medium">
                          {stream.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 flex items-center justify-between border-t border-[#222] mt-4">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#888]">
                        {stream.shopName ? `@${stream.shopName}` : "LIVE COMMERCE"}
                      </span>

                      <button
                        onClick={() => handleToggleReminder(stream.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${isReminded
                          ? "bg-white text-black"
                          : "bg-transparent text-white border border-[#444] hover:border-white hover:bg-white hover:text-black"
                          }`}
                      >
                        {isReminded ? (
                          <>
                            <Check size={14} weight="bold" />
                            Added
                          </>
                        ) : (
                          <>
                            <Bell size={14} weight="bold" />
                            Remind
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Toast Alert Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white text-black px-4 py-3 shadow-2xl border border-black"
            >
              <Info size={16} weight="bold" />
              <span className="text-xs font-black uppercase tracking-widest">{message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
