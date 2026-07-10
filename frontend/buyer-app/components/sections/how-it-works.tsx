"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";

const STEPS = [
  {
    phase: "Discover",
    title: "Browse Active Live Streams",
    desc: "Scan through a curated list of live video feeds featuring creators, tech reviewers, and brands showing off products in real time.",
  },
  {
    phase: "Interact",
    title: "Bid and Secure Live Deals",
    desc: "Watch live auctions, interact in real-time chat rooms, and trigger flash-discount deals directly from the video dashboard.",
  },
  {
    phase: "Purchase",
    title: "Instant One-Click Checkout",
    desc: "Complete your orders securely in milliseconds. Our streamlined payment system processes transactions without interrupting the stream.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full bg-[#0d0f14] py-28 border-b border-white/5 relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Asymmetric Intro */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-mono block font-bold mb-4">
                The Protocol
              </span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.05] mb-6">
                Redefining the buyer experience.
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-[36ch] mb-8 font-normal">
                LiveCommerce combines high-definition media streams with a real-time transactional database, bringing instant bidding and purchase power to the web.
              </p>
            </div>
            
            {/* Visual Callout or Link */}
            <div className="hidden lg:block">
              <Link href="/live/cc9db567-1d5e-45a2-8544-c3a098f6718f" className="group inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors">
                <span>View Live Streams</span>
                <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Staggered list items instead of 3 equal columns */}
          <div className="lg:col-span-7 flex flex-col divide-y divide-white/5 border-t border-b border-white/5">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                className="py-8 flex flex-col md:flex-row gap-6 md:gap-12 items-start justify-between group"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {/* Step Metadata */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <span className="text-[9px] font-mono font-bold text-cyan-400/50 uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-400/5 border border-cyan-400/10">
                    {step.phase}
                  </span>
                </div>

                {/* Step content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2 group-hover:text-cyan-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-[48ch]">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
