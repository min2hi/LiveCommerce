import React from 'react';
import { AsymmetricHero } from '@/components/hero/asymmetric-hero';
import dynamic from 'next/dynamic';

const StatsBar = dynamic(() => import('@/components/sections/stats-bar').then(mod => mod.StatsBar));
const UpcomingStreams = dynamic(() => import('@/components/sections/upcoming-streams').then(mod => mod.UpcomingStreams));
const BentoGrid = dynamic(() => import('@/components/grid/bento-grid').then(mod => mod.BentoGrid));
const LiveDirectory = dynamic(() => import('@/components/sections/live-directory').then(mod => mod.LiveDirectory));

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#050505]">
      <div className="relative z-10">
        <AsymmetricHero />
        <StatsBar />
        <UpcomingStreams />
        <BentoGrid />
        <LiveDirectory />
      </div>
    </div>
  );
}
