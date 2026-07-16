"use client";

import React, { useId, useMemo, useState, useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface SparklesCoreProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
  speed?: number;
}

export function SparklesCore({
  id,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 40,
  className,
  particleColor = "#06b6d4",
  speed = 1,
}: SparklesCoreProps) {
  const generatedId = useId();
  const sparkleId = id || generatedId;
  const reduce = useReducedMotion();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate sparkle particles as CSS-animated divs (no Canvas API = lighter)
  const particles = useMemo(() => {
    if (!isMounted || reduce) return [];
    return Array.from({ length: particleDensity }, (_, i) => {
      const size = Math.random() * (maxSize - minSize) + minSize;
      return {
        id: `${sparkleId}-${i}`,
        size,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: (Math.random() * 2 + 1) / speed,
        delay: Math.random() * 2,
        opacity: Math.random() * 0.5 + 0.3,
      };
    });
  }, [sparkleId, minSize, maxSize, particleDensity, speed, reduce, isMounted]);

  if (!isMounted || reduce) {
    return <div className={cn("relative w-full h-full", className)} style={{ background }} />;
  }

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden", className)}
      style={{ background }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-pulse"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: particleColor,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 3}px ${particleColor}`,
          }}
        />
      ))}
    </div>
  );
}
