"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "motion/react";

import { Magnetic } from "@/components/ui/magnetic";

export function Navbar() {
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);
  const [visible, setVisible] = useState(true);
  const { scrollY } = useScroll();

  useEffect(() => {
    const token = localStorage.getItem("buyer_token");
    setHasToken(!!token);
  }, [pathname]);

  // Floating navbar: hide on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    const direction = current - previous;

    if (current < 100) {
      setVisible(true);
    } else if (direction < -5) {
      setVisible(true);
    } else if (direction > 5) {
      setVisible(false);
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("buyer_token");
    setHasToken(false);
    window.location.reload();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.header
        className="fixed top-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl h-14 bg-[#0d0f14]/85 border border-white/10 backdrop-blur-md rounded-full z-50 flex items-center justify-between px-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 260,
          damping: 25,
        }}
      >
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-[#0d0f14] font-bold text-[10px] font-mono transition-transform group-hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            LC
          </div>
          <span className="font-bold text-xs uppercase tracking-widest text-white font-mono">
            LiveCommerce
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          <Link
            href="/live/cc9db567-1d5e-45a2-8544-c3a098f6718f"
            className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            Live Rooms
          </Link>
          <a
            href="/#trending-deals"
            className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            Trending Deals
          </a>
        </nav>

        {/* Action CTA */}
        <div className="flex items-center gap-3">
          {hasToken ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold uppercase tracking-wider font-mono rounded-full shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Connected
              </span>
              <Magnetic range={30}>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-white text-zinc-950 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors active:scale-95 cursor-pointer shadow-sm"
                >
                  Logout
                </button>
              </Magnetic>
            </div>
          ) : (
            <Link href="/login">
              <Magnetic range={30}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-1.5 bg-cyan-500 text-zinc-950 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                >
                  Sign In
                </motion.button>
              </Magnetic>
            </Link>
          )}
        </div>
      </motion.header>
    </AnimatePresence>
  );
}
