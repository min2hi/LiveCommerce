"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { CaretRight, CaretLeft } from "@phosphor-icons/react";
import { AuctionWidget } from "./ui/auction-widget";
import { LiveChat } from "./live/live-chat";
import { ProductShowcase } from "./live/product-showcase";
import { AiChatPanel } from "./live/ai-chat-panel";
import { FloatingHearts } from "./live/floating-hearts";
import { buildApiUrl } from "@/lib/api";

interface LiveStreamPlayerProps {
  streamId: string;
}

interface ActiveStream {
  id: string;
  title?: string;
  shop_name?: string;
  username?: string;
  viewers?: number;
  shopId?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LiveStreamPlayer({ streamId }: LiveStreamPlayerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const heartsRef = React.useRef<{ spawnHearts: () => void }>(null);

  // Use SWR for efficient fetching of live stream metadata
  const { data: activeStreams } = useSWR<ActiveStream[]>(
    buildApiUrl("/livestreams/active"),
    fetcher,
    { revalidateOnFocus: false }
  );

  let streamInfo = {
    title: "Sony WH-1000XM5 Deals",
    streamer: "TechGear Official",
    viewers: "12.4K",
    shopId: "a8762ee1-42d5-4c63-9a11-03e3e2875d92", // fallback demo shopId
  };

  if (activeStreams) {
    const active = activeStreams.find((s) => s.id === streamId);
    if (active) {
      streamInfo = {
        title: active.title || "Live Stream",
        streamer: active.shop_name || active.username || "Streamer",
        viewers: active.viewers ? `${(active.viewers / 1000).toFixed(1)}K` : "1.2K",
        shopId: active.shopId || streamInfo.shopId,
      };
    } else {
      const mock = [
        { id: "cc9db567-1d5e-45a2-8544-c3a098f6718f", title: "Sony WH-1000XM5 Deals", streamer: "TechGear Official", viewers: "12.4K", shopId: "a8762ee1-42d5-4c63-9a11-03e3e2875d92" },
        { id: "mock-stream-1", title: "Unboxing the new RTX 5090 Ti - Live Benchmarks", streamer: "PC Master Race", viewers: "12.5K", shopId: "mock-shop-1" },
        { id: "mock-stream-2", title: "Sneaker Drop: Air Jordan 1 Travis Scott Edition", streamer: "HypeKicks", viewers: "8.2K", shopId: "mock-shop-2" },
        { id: "mock-stream-3", title: "Skincare Routine 101 - 50% Flash Sale Now!", streamer: "Glow Beauty", viewers: "3.4K", shopId: "mock-shop-3" },
        { id: "mock-stream-4", title: "Keychron Q1 Pro Custom Build + Giveaway", streamer: "KeyCrafters", viewers: "5.9K", shopId: "mock-shop-4" },
      ].find((s) => s.id === streamId);

      if (mock) streamInfo = mock;
    }
  }

  return (
    <div className={`w-full h-[100dvh] bg-zinc-950 overflow-hidden flex flex-col md:grid md:grid-rows-1 transition-all duration-500 ease-in-out ${isSidebarOpen ? "md:grid-cols-[1fr_340px]" : "md:grid-cols-1"}`}>

      {/* Left Column: Video & Chat (Immersive) */}
      <div 
        className="group relative flex-1 md:h-full w-full bg-black overflow-hidden flex flex-col justify-end min-h-0"
        onDoubleClick={() => heartsRef.current?.spawnHearts()}
      >
        
        {/* Background Live Stream Feed */}
        <img
          src={`https://picsum.photos/seed/${streamId}/1920/1080`}
          alt="Live stream feed"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/30"></div>

        {/* Top Left: Streamer Info Panel */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-2 md:gap-3 bg-zinc-950/40 backdrop-blur-lg border border-white/10 rounded-full pl-2 pr-4 md:pr-5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/20">
            <img src={`https://picsum.photos/seed/avatar-${streamId}/100/100`} alt="Streamer" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white leading-none">@{streamInfo.streamer}</span>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              {streamInfo.viewers} VIEWERS
            </span>
          </div>
        </div>

        {/* Bottom Left: Public Stream Chat */}
        <div className="relative z-20 w-full max-w-[400px] h-[400px] p-4 md:p-6 pointer-events-none mt-auto">
          <LiveChat roomId={streamId} />
        </div>

        {/* Mobile-only Overlays (Hidden on Desktop) */}
        <div className="absolute top-20 left-4 right-4 md:hidden z-30 pointer-events-none flex flex-col gap-4">
          <div className="pointer-events-auto">
            <AuctionWidget shopId={streamInfo.shopId} />
          </div>
        </div>
        <div className="absolute top-[60%] left-0 right-0 bottom-0 md:hidden z-10 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 flex flex-col justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           <ProductShowcase shopId={streamInfo.shopId} />
        </div>

        {/* Desktop Sidebar Toggle (Theater Mode) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-l-lg items-center justify-center text-white/50 hover:text-white transition-all z-30 opacity-0 group-hover:opacity-100"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
        </button>

        {/* AI Chat Assistant */}
        <AiChatPanel shopId={streamInfo.shopId} />
        
        {/* Floating Hearts */}
        <FloatingHearts ref={heartsRef} />
      </div>

      {/* Right Column: Commercial Sidebar (Desktop Only) */}
      {isSidebarOpen && (
        <div className="hidden md:flex relative w-full h-full bg-[#050505] border-l border-white/[0.05] flex-col z-30 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] min-h-0">
        
        {/* Top Half: Auction Widget */}
        <div className="p-4 border-b border-white/[0.05] flex-shrink-0">
          <AuctionWidget shopId={streamInfo.shopId} />
        </div>

        {/* Bottom Half: Product Showcase */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <ProductShowcase shopId={streamInfo.shopId} />
        </div>

      </div>
      )}

    </div>
  );
}
