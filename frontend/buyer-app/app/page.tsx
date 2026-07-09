import React from 'react';
import { Navbar } from '@/components/ui/navbar';
import { AsymmetricHero } from '@/components/hero/asymmetric-hero';
import { BentoGrid } from '@/components/grid/bento-grid';
import { StatsBar } from '@/components/sections/stats-bar';
import { HowItWorks } from '@/components/sections/how-it-works';

export default function Home() {
  return (
    <>
      <Navbar />
      <AsymmetricHero />
      <StatsBar />
      <BentoGrid />
      <HowItWorks />
    </>
  );
}

