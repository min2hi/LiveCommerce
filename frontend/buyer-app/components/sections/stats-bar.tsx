"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValue, animate, useInView } from "motion/react";
import { MovingBorder } from "@/components/ui/moving-border";
import useSWR from "swr";
import { buildApiUrl } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";

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
  const { data: metrics } = useSWR(
    buildApiUrl("/metrics/public"),
    fetcher,
    { refreshInterval: 10000, fallbackData: { totalStreams: 0, totalViewers: 0, totalDeals: 0 } }
  );

  return (
    <div className="w-full relative z-20 px-4 md:px-8 -mt-8">
      <MovingBorder
        duration={6}
        borderRadius="1rem"
        containerClassName="mx-auto max-w-5xl"
        borderClassName="bg-[radial-gradient(#06b6d4_40%,transparent_60%)]"
        className="w-full py-4 px-6 flex flex-col sm:flex-row justify-around items-center gap-4 text-center font-mono text-xs bg-[#161b27]/80 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-zinc-400 uppercase tracking-widest">Platform Status:</span>
          <span className="font-bold text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
            <AnimatedCounter from={0} to={metrics.totalStreams || 0} /> STREAMS ONLINE
          </span>
        </div>

        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 uppercase tracking-widest">Active Viewers:</span>
          <span className="font-bold text-white">
            <AnimatedCounter from={0} to={metrics.totalViewers || 0} /> WATCHING
          </span>
        </div>

        <div className="h-px w-8 bg-white/10 sm:h-4 sm:w-px"></div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400 uppercase tracking-widest">Deals Claimed:</span>
          <span className="font-bold text-white">
            <AnimatedCounter from={0} to={metrics.totalDeals || 0} /> SECURED
          </span>
        </div>
      </MovingBorder>
    </div>
  );
}
