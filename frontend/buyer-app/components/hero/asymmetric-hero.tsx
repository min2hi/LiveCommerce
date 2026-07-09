"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Card3DHover } from "@/components/ui/card-3d-hover";
import { ArrowUpRight, Users, ChatCircleText, Broadcast } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  isSystem?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, user: "alex_g", text: "Is this setup available?" },
  { id: 2, user: "sarah.k", text: "Super low latency! Love the UI" },
  { id: 3, user: "shop_bot", text: "🔥 Hot Deal: 15% OFF for next 2 mins", isSystem: true },
  { id: 4, user: "david_m", text: "Just ordered the summer jacket! 🚀" },
  { id: 5, user: "emma_z", text: "Colors look so vibrant on stream." }
];

export function AsymmetricHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES.slice(0, 3));
  
  // Staggered load animation variants for hero contents
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 18,
      },
    },
  };

  // Simulate active stream chat feed
  useEffect(() => {
    let msgCounter = 6;
    const interval = setInterval(() => {
      const randomBase = INITIAL_MESSAGES[Math.floor(Math.random() * INITIAL_MESSAGES.length)];
      const nextMsg: ChatMessage = {
        id: msgCounter++,
        user: randomBase.user,
        text: randomBase.text,
        isSystem: randomBase.isSystem,
      };
      setMessages((prev) => {
        const updated = [...prev.slice(1), nextMsg];
        return updated;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // Subtle scroll-driven parallax for the image asset
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const yTranslate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#0d0f14] pt-28 pb-20 border-b border-white/5"
    >
      {/* Decorative clean background line to create editorial structure */}
      <div className="absolute top-0 bottom-0 left-[8%] md:left-[12%] w-[1px] bg-white/5 hidden md:block"></div>
      
      <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          
          {/* Column 1: Headline & Content (8 cols on desktop) */}
          <motion.div 
            className="md:col-span-8 flex flex-col justify-center pl-0 md:pl-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex items-center gap-2 mb-6" variants={itemVariants}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#a855f7] font-mono block font-bold">
                Live Commerce Network
              </span>
            </motion.div>

            {/* Asymmetric Typography - Styled with high-end editorial focus */}
            <motion.h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.98] text-white mb-8 select-none"
              variants={itemVariants}
            >
              <span className="block mb-2">The live</span>
              <span className="block font-normal italic text-[#a855f7] pl-4 md:pl-8">commerce</span>
              <span className="block">interface.</span>
            </motion.h1>

            <motion.p 
              className="text-base text-zinc-400 leading-relaxed max-w-[42ch] mb-12 font-normal"
              variants={itemVariants}
            >
              Experience zero-latency video streams, instant interactive chats, and atomic checkout options. Directly in your browser.
            </motion.p>

            <motion.div className="flex flex-wrap items-center gap-4" variants={itemVariants}>
              <Link href="/live/cc9db567-1d5e-45a2-8544-c3a098f6718f" passHref className="w-full sm:w-auto">
                <Button size="lg" className="w-full inline-flex items-center gap-2 group cursor-pointer bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white border-none shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:opacity-90">
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

          {/* Column 2: Parallax Media Container (4 cols on desktop) */}
          <div className="md:col-span-4 relative mt-8 md:mt-0 flex items-center justify-center">
            <motion.div
              style={{ y: yTranslate }}
              className="w-full max-w-[340px] md:max-w-none relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <Card3DHover className="relative w-full aspect-[3/4] bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden">
                <img
                  src="https://picsum.photos/seed/livecommerce-creative/800/1066"
                  alt="Minimalist designer showcasing tech stream"
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-[1.01]"
                  loading="eager"
                />
                
                {/* Livestream Overlay HUD (Top Left) */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ef4444] text-[9px] font-bold text-white uppercase tracking-wider font-mono">
                    <Broadcast size={10} className="animate-pulse" />
                    Live
                  </div>
                  <div className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-zinc-300 font-mono">
                    1080p60
                  </div>
                </div>

                {/* Livestream Overlay Viewer HUD (Top Right) */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-cyan-400 font-mono z-20">
                  <Users size={10} />
                  12,408 watching
                </div>

                {/* Refractive overlay simulating a clean lens border */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl pointer-events-none"></div>

                {/* Interactive Simulated Live Chat Feed Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 z-20">
                  <div className="max-h-[140px] flex flex-col justify-end gap-1.5 overflow-hidden pointer-events-none">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ type: "spring", stiffness: 120, damping: 15 }}
                          className={`flex items-start gap-1.5 px-3 py-1.5 rounded-lg text-[10px] backdrop-blur-md border ${
                            msg.isSystem 
                              ? "bg-[#a855f7]/20 border-[#a855f7]/25 text-[#c084fc]"
                              : "bg-black/45 border-white/5 text-zinc-200"
                          }`}
                        >
                          <ChatCircleText size={12} className="mt-0.5 flex-shrink-0 opacity-80" />
                          <div>
                            <span className={`font-mono font-bold mr-1.5 ${msg.isSystem ? "text-[#e9d5ff]" : "text-cyan-400"}`}>
                              {msg.user}:
                            </span>
                            <span>{msg.text}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Dark gradient shadow overlay at bottom for chat readability */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10"></div>
              </Card3DHover>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
