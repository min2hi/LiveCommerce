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
  shopName?: string;
  username?: string;
  viewers?: number;
  shopId?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LiveStreamPlayer({ streamId }: LiveStreamPlayerProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const heartsRef = React.useRef<{ spawnHearts: () => void }>(null);

  // Use SWR for efficient fetching of live stream metadata
  const { data: activeStreams, isLoading } = useSWR<ActiveStream[]>(
    buildApiUrl("/livestreams/active"),
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="w-full h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-mono tracking-widest text-sm">LOADING STREAM...</p>
      </div>
    );
  }

  const active = activeStreams?.find((s) => s.id === streamId);
  
  if (!active) {
    return (
      <div className="w-full h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center text-white p-6">
        <div className="text-zinc-600 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216ZM168,152a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,152Zm0-32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,120Zm-32,64a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h32A8,8,0,0,1,136,184Z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Stream Offline</h2>
        <p className="text-zinc-400 text-center max-w-md">The broadcast you are looking for has ended or does not exist.</p>
        <a href="/" className="mt-8 px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-zinc-200 transition-colors">Return Home</a>
      </div>
    );
  }

  const streamInfo = {
    title: active.title || "Live Stream",
    streamer: active.shopName || active.username || "Streamer",
    viewers: active.viewers ? `${(active.viewers / 1000).toFixed(1)}K` : "1.2K",
    shopId: active.shopId || "default-shop",
  };

  return (
    <div className={`w-full h-[100dvh] bg-zinc-950 overflow-hidden flex flex-col md:grid md:grid-rows-1 transition-all duration-500 ease-in-out ${isSidebarOpen ? "md:grid-cols-[1fr_340px]" : "md:grid-cols-1"}`}>

      {/* Left Column: Video & Chat (Immersive) */}
      <div 
        className="group relative flex-1 md:h-full w-full bg-black overflow-hidden flex flex-col justify-end min-h-0"
        onDoubleClick={() => heartsRef.current?.spawnHearts()}
      >
        
        {/* Background Live Stream Feed */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center opacity-85">
           <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 256 256" className="text-zinc-600/50 mb-4"><path d="M228.23,104.4l-31-15.5A72.18,72.18,0,0,0,128,24a72.19,72.19,0,0,0-69.25,64.9L27.77,104.4A15.93,15.93,0,0,0,16,118.7v65.65a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V118.7A15.93,15.93,0,0,0,228.23,104.4ZM128,40a56,56,0,0,1,53.28,38.65,16,16,0,0,0-9-5.14,13.67,13.67,0,0,0-10.42,3A15.42,15.42,0,0,0,156,88.46V104H100V88.46a15.42,15.42,0,0,0-5.83-12,13.67,13.67,0,0,0-10.42-3,16,16,0,0,0-9,5.14A56,56,0,0,1,128,40ZM32,184.35V118.7l26.91-13.46A21,21,0,0,1,64,104a29.85,29.85,0,0,1,20,7.67v64.66H32Zm200-65.65v65.65H172V111.67a29.85,29.85,0,0,1,20-7.67,21,21,0,0,1,5.09,1.24Z"></path></svg>
           <span className="text-zinc-600/50 font-mono tracking-widest text-sm uppercase">Live Feed Offline</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/30"></div>

        {/* Top Left: Streamer Info Panel */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-2 md:gap-3 bg-zinc-950/40 backdrop-blur-lg border border-white/10 rounded-full pl-2 pr-4 md:pr-5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs uppercase">{streamInfo.streamer.substring(0, 1)}</span>
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
        <div className="absolute bottom-[40%] md:bottom-0 left-0 z-20 w-full max-w-[400px] h-[35vh] md:h-[400px] p-4 md:p-6 pointer-events-none">
          <LiveChat roomId={streamId} />
        </div>

        {/* Mobile-only Overlays (Hidden on Desktop) */}
        <div className="absolute top-20 left-4 right-4 md:hidden z-30 pointer-events-none flex flex-col gap-4">
          <div className="pointer-events-auto">
            <AuctionWidget shopId={streamInfo.shopId} />
          </div>
        </div>
        <div className="absolute top-[60%] left-0 right-0 bottom-0 md:hidden z-30 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-4 flex flex-col justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
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
