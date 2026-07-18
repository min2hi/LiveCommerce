"use client";

import React, { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "@phosphor-icons/react";

export interface FloatingHeartsRef {
  spawnHearts: () => void;
}

export const FloatingHearts = forwardRef<FloatingHeartsRef, { className?: string }>(({ className = "" }, ref) => {
  const [hearts, setHearts] = useState<{ id: number; xOffset: number; size: number; color: string }[]>([]);

  const spawnHeart = useCallback(() => {
    const id = Date.now() + Math.random();
    const xOffset = Math.random() * 60 - 30; // -30px to +30px
    const size = Math.random() * 12 + 16; // 16px to 28px
    const colors = ["#ef4444", "#f43f5e", "#ec4899", "#d946ef", "#06b6d4"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    setHearts((prev) => [...prev, { id, xOffset, size, color }]);

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2500);
  }, []);

  useImperativeHandle(ref, () => ({
    spawnHearts: () => {
      const count = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < count; i++) {
        setTimeout(() => spawnHeart(), i * 150);
      }
    }
  }));

  return (
    <div className={`absolute bottom-24 right-10 md:bottom-32 md:right-32 z-20 pointer-events-none w-10 h-10 flex items-end justify-center ${className}`}>
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0], 
              y: -200 - Math.random() * 100, 
              x: heart.xOffset + (Math.random() * 40 - 20),
              scale: 1 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute"
            style={{ color: heart.color }}
          >
            <Heart size={heart.size} weight="fill" className="drop-shadow-md" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingHearts.displayName = "FloatingHearts";
