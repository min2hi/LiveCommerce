import React from 'react';
import { Navbar } from '@/components/ui/navbar';
import { AsymmetricHero } from '@/components/hero/asymmetric-hero';
import { Spotlight } from '@/components/ui/spotlight';
import dynamic from 'next/dynamic';

const StatsBar = dynamic(() => import('@/components/sections/stats-bar').then(mod => mod.StatsBar));
const UpcomingStreams = dynamic(() => import('@/components/sections/upcoming-streams').then(mod => mod.UpcomingStreams));
const LampContainer = dynamic(() => import('@/components/ui/lamp').then(mod => mod.LampContainer));
const BentoGrid = dynamic(() => import('@/components/grid/bento-grid').then(mod => mod.BentoGrid));
const LiveDirectory = dynamic(() => import('@/components/sections/live-directory').then(mod => mod.LiveDirectory));

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#0d0f14]">
      {/* Aceternity Spotlight replaces Canvas3DBackground - lighter, more dramatic */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#06b6d4"
        />
        <Spotlight
          className="top-28 left-80 h-[80vh] w-[50vw]"
          fill="#06b6d4"
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10">
        <Navbar />
        <AsymmetricHero />
        <StatsBar />
        <UpcomingStreams />

        {/* Lamp section divider - dramatic lighting transition */}
        <LampContainer className="pt-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white text-center mb-2">
            Featured Live Rooms
          </h2>
          <p className="text-sm text-zinc-300 text-center max-w-md drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            Explore trending streams with real-time deals and flash auctions
          </p>
        </LampContainer>

        <BentoGrid />
        <LiveDirectory />
      </div>
    </div>
  );
}
