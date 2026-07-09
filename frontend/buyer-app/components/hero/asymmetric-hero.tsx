"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Card3DHover } from "@/components/ui/card-3d-hover";
import { ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function AsymmetricHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subtle scroll-driven parallax for the image asset
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const yTranslate = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#0d0f14] pt-28 pb-20 border-b border-white/5"
    >
      {/* Decorative clean background line to create editorial structure */}
      <div className="absolute top-0 bottom-0 left-[8%] md:left-[12%] w-[1px] bg-white/5 hidden md:block"></div>
      
      <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          
          {/* Column 2: Headline & Content (8 cols on desktop) */}
          <div className="md:col-span-8 flex flex-col justify-center pl-0 md:pl-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#a855f7] font-mono block font-bold">
                Live Commerce Network
              </span>
            </div>

            {/* Asymmetric Typography - Styled with high-end editorial focus */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.98] text-white mb-8 select-none">
              <span className="block mb-2">The live</span>
              <span className="block font-normal italic text-[#a855f7] pl-4 md:pl-8">commerce</span>
              <span className="block">interface.</span>
            </h1>

            <p className="text-base text-zinc-400 leading-relaxed max-w-[42ch] mb-12 font-normal">
              Experience zero-latency video streams, instant interactive chats, and atomic checkout options. Directly in your browser.
            </p>

            <div className="flex flex-wrap items-center gap-4">
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
            </div>
          </div>

          {/* Column 3: Parallax Media Container (4 cols on desktop) */}
          <div className="md:col-span-4 relative mt-8 md:mt-0 flex items-center justify-center">
            <motion.div
              style={{ y: yTranslate }}
              className="w-full max-w-[340px] md:max-w-none"
            >
              <Card3DHover className="relative w-full aspect-[3/4] bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5">
                <img
                  src="https://picsum.photos/seed/livecommerce-creative/800/1066"
                  alt="Minimalist designer showcasing tech stream"
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-[1.01]"
                  loading="eager"
                />
                {/* Refractive overlay simulating a clean lens border */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl"></div>
              </Card3DHover>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
