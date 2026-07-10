"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValue, animate, useInView } from "motion/react";

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
}

function AnimatedCounter({ from, to, duration = 1.8, suffix = "" }: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, to, {
        duration: duration,
        ease: "easeOut",
        onUpdate: (latest) => {
          if (ref.current) {
            ref.current.textContent = Math.round(latest).toLocaleString() + suffix;
          }
        },
      });
      return controls.stop;
    }
  }, [count, to, duration, isInView, suffix]);

  return <span ref={ref}>{from.toLocaleString()}{suffix}</span>;
}

export function StatsBar() {
  return (
    <div className="w-full bg-[#161b27] text-white py-4 border-y border-white/5 relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col sm:flex-row justify-around items-center gap-4 text-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-zinc-400 uppercase tracking-widest">Platform Status:</span>
          <span className="font-bold text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">12 STREAMS ONLINE</span>
        </div>
        
        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 uppercase tracking-widest">Active Viewers:</span>
          <span className="font-bold text-white">
            <AnimatedCounter from={9500} to={12408} /> WATCHING
          </span>
        </div>

        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 uppercase tracking-widest">Deals Claimed:</span>
          <span className="font-bold text-white">
            <AnimatedCounter from={300} to={482} /> SECURED
          </span>
        </div>
      </div>
    </div>
  );
}
