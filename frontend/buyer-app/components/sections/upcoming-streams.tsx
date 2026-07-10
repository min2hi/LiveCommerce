"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Bell, Check, ArrowRight, Info } from "@phosphor-icons/react";

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
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("buyer_token");
    setToken(savedToken);

    // Fetch upcoming streams
    fetch("http://localhost:3000/api/scheduled-streams/upcoming")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch streams");
        return res.json();
      })
      .then((data: ScheduledStream[]) => {
        setStreams(data || []);
        setLoading(false);

        // If logged in, batch-check reminders
        if (savedToken && data.length > 0) {
          data.forEach((stream) => {
            fetch(`http://localhost:3000/api/scheduled-streams/${stream.id}/remind/check`, {
              headers: { Authorization: `Bearer ${savedToken}` },
            })
              .then((res) => res.json())
              .then((status) => {
                if (status.isReminderSet) {
                  setRemindedIds((prev) => ({ ...prev, [stream.id]: true }));
                }
              })
              .catch((err) => console.error("Error checking reminder:", err));
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load upcoming streams:", err);
        setLoading(false);
      });
  }, []);

  const handleToggleReminder = async (streamId: string) => {
    if (!token) {
      setMessage("Vui lòng Đăng nhập để sử dụng tính năng Nhắc nhở!");
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const isReminded = remindedIds[streamId];
    const method = isReminded ? "DELETE" : "POST";
    const url = `http://localhost:3000/api/scheduled-streams/${streamId}/remind`;

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
    <section className="py-16 border-t border-white/5 bg-zinc-950/20 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-cyan-400">
              Live Commerce Network
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Calendar size={28} className="text-cyan-400" />
              Lịch Phát Sóng Sắp Tới
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg">
              Đăng ký nhận thông báo để không bỏ lỡ các buổi livestream độc quyền cùng mã giảm giá cực khủng.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
            Kéo ngang để xem thêm
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Horizontal Slider Wrapper */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent scroll-smooth snap-x snap-mandatory">
            {streams.map((stream) => {
              const isReminded = remindedIds[stream.id];
              return (
                <div
                  key={stream.id}
                  className="w-[290px] md:w-[320px] flex-shrink-0 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden snap-start hover:border-cyan-500/30 transition-all duration-300 group shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
                >
                  {/* Banner Image */}
                  <div className="relative h-44 overflow-hidden bg-zinc-950">
                    <img
                      src={stream.bannerUrl || "https://picsum.photos/seed/default/600/400"}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[9px] font-semibold text-cyan-400 tracking-wider uppercase font-mono">
                      Sắp Diễn Ra
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col justify-between min-h-[190px]">
                    <div className="space-y-3">
                      <div className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 rounded px-2.5 py-0.5 inline-block">
                        {formatTime(stream.scheduledTime)}
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {stream.description || "Tham gia ngay để nhận hàng loạt ưu đãi hấp dẫn từ Streamer."}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] font-mono text-zinc-500">
                        @{stream.shopName || "TechStore"}
                      </span>

                      <button
                        onClick={() => handleToggleReminder(stream.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isReminded
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-white/5"
                        }`}
                      >
                        {isReminded ? (
                          <>
                            <Check size={13} weight="bold" />
                            Đã Nhắc
                          </>
                        ) : (
                          <>
                            <Bell size={13} />
                            Nhắc Tôi
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
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-cyan-950 border border-cyan-800 text-cyan-200 text-xs font-semibold px-4 py-3 rounded-full shadow-2xl backdrop-blur-xl"
            >
              <Info size={16} weight="fill" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
