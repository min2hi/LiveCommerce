"use client";

import React from "react";
import { PlayCircle, ShieldCheck, Lightning } from "@phosphor-icons/react";
import { motion } from "motion/react";

const STEPS = [
  {
    icon: <PlayCircle size={32} className="text-zinc-900" />,
    title: "1. Join Live Streams",
    desc: "Browse featured channels and enter zero-latency stream rooms directly in your browser window.",
  },
  {
    icon: <Lightning size={32} className="text-zinc-900" />,
    title: "2. Trigger Instant Deals",
    desc: "Click checkout while the product is live on screen. Our atomic engine handles stock allocations securely.",
  },
  {
    icon: <ShieldCheck size={32} className="text-zinc-900" />,
    title: "3. Confirmed Orders",
    desc: "Transactions are processed asynchronously through RabbitMQ and updated instantly on the dashboards.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full bg-zinc-100 py-24 border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-16 text-center max-w-xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-mono mb-3 block font-bold">
            Workflow Logic
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-950">
            How LiveCommerce Operates
          </h2>
          <p className="text-sm text-zinc-500 mt-4 leading-relaxed">
            A modular backend engine synchronized with real-time SSE stream events for an instantaneous shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="bg-white p-8 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight mt-2">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[30ch]">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
