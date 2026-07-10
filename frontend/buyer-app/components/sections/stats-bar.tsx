"use client";

import React, { useEffect, useState, useRef } from "react";
import { Users, ShoppingBag } from "@phosphor-icons/react";

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
}

function AnimatedCounter({ from, to, duration = 2000, suffix = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo for ultra-smooth easing
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(ease * (to - from) + from);
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    if (ref.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            animationFrameId = requestAnimationFrame(step);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [from, to, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
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
          <Users size={16} className="text-[#a855f7]" />
          <span className="text-zinc-400 uppercase tracking-widest">Active Viewers:</span>
          <span className="font-bold text-white">
            <AnimatedCounter from={9500} to={12408} /> WATCHING
          </span>
        </div>

        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-[#06b6d4]" />
          <span className="text-zinc-400 uppercase tracking-widest">Deals Claimed:</span>
          <span className="font-bold text-white">
            <AnimatedCounter from={300} to={482} /> SECURED
          </span>
        </div>
      </div>
    </div>
  );
}
