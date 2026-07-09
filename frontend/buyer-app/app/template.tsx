"use client";

import React from "react";
import { motion } from "motion/react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
      className="flex-1 flex flex-col"
    >
      {/* Premium page load-in indicator bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-zinc-900 z-[100] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      {children}
    </motion.div>
  );
}
