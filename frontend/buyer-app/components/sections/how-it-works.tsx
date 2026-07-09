"use client";

import React from "react";
import { PlayCircle, ShieldCheck, Lightning } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Magnetic } from "@/components/ui/magnetic";

const STEPS = [
  {
    icon: <PlayCircle size={32} className="text-[#a855f7]" />,
    title: "Join Live Rooms",
    desc: "Browse featured channels and enter zero-latency stream rooms directly in your browser window.",
  },
  {
    icon: <Lightning size={32} className="text-[#a855f7]" />,
    title: "Trigger Instant Deals",
    desc: "Click checkout while the product is live on screen. Our atomic engine handles stock allocations securely.",
  },
  {
    icon: <ShieldCheck size={32} className="text-[#a855f7]" />,
    title: "Confirmed Orders",
    desc: "Transactions are processed asynchronously through RabbitMQ and updated instantly on the dashboards.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full bg-[#0d0f14] py-24 border-b border-white/5 relative z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-16 text-center max-w-xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#a855f7]/85 font-mono mb-3 block font-bold">
            Workflow Logic
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            How LiveCommerce Operates
          </h2>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
            A modular backend engine synchronized with real-time SSE stream events for an instantaneous shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="bg-[#1c2236]/20 p-8 rounded-2xl border border-white/5 shadow-md flex flex-col items-center text-center gap-4 hover:border-[#a855f7]/30 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              whileHover={{ y: -8, transition: { type: "spring" as const, stiffness: 120, damping: 15 } }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-16 h-16 relative">
                <Magnetic range={45}>
                  <div className="w-16 h-16 rounded-full bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/30 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                    {step.icon}
                  </div>
                </Magnetic>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-2">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[30ch]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
