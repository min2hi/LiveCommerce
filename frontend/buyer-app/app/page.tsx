import React from 'react';
import { Navbar } from '@/components/ui/navbar';
import { AsymmetricHero } from '@/components/hero/asymmetric-hero';
import { BentoGrid } from '@/components/grid/bento-grid';
import { StatsBar } from '@/components/sections/stats-bar';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Canvas3DBackground } from '@/components/ui/canvas-3d-background';

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#0d0f14]">
      <Canvas3DBackground accent="purple" />
      <div className="relative z-10">
        <Navbar />
        <AsymmetricHero />
        <StatsBar />
        <BentoGrid />
        <HowItWorks />
      </div>
    </div>
  );
}

