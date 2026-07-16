"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none z-0",
        className
      )}
    >
      {/* Multiple animated beam lines */}
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="beam-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="beam-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Diagonal beams */}
        {[
          { x1: 100, y1: -50, x2: 400, y2: 850, delay: 0 },
          { x1: 300, y1: -50, x2: 600, y2: 850, delay: 1.5 },
          { x1: 500, y1: -50, x2: 800, y2: 850, delay: 0.8 },
          { x1: 700, y1: -50, x2: 1000, y2: 850, delay: 2.2 },
          { x1: 900, y1: -50, x2: 1200, y2: 850, delay: 1.1 },
          { x1: 200, y1: -50, x2: 500, y2: 850, delay: 3 },
          { x1: 800, y1: -50, x2: 1100, y2: 850, delay: 0.5 },
        ].map((beam, i) => (
          <line
            key={i}
            x1={beam.x1}
            y1={beam.y1}
            x2={beam.x2}
            y2={beam.y2}
            stroke={i % 2 === 0 ? "url(#beam-gradient-1)" : "url(#beam-gradient-2)"}
            strokeWidth={i % 3 === 0 ? "1" : "0.5"}
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0;0.6;0"
              dur={`${4 + i * 0.5}s`}
              begin={`${beam.delay}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

        {/* Subtle horizontal glow lines */}
        {[200, 400, 600].map((y, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={y}
            x2="1200"
            y2={y}
            stroke="rgba(6, 182, 212, 0.03)"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[100px]" />
    </div>
  );
}
