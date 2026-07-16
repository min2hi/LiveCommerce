"use client";

import React from "react";
import useSWR from "swr";
import { AuctionWidget } from "./ui/auction-widget";
import { LiveChat } from "./live/live-chat";
import { ProductShowcase } from "./live/product-showcase";
import { AiChatPanel } from "./live/ai-chat-panel";
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
    <div className="relative w-full h-[100dvh] bg-zinc-950 overflow-hidden flex items-center justify-center">

      {/* Background Live Stream Feed */}

      <img
        src={`https://picsum.photos/seed/${streamId}/1920/1080`}
        alt="Live stream feed"
        className="absolute inset-0 w-full h-full object-cover opacity-75 grayscale-[15%] contrast-[105%]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40"></div>

      {/* Live Auction Widget Overlay */}
      <AuctionWidget shopId={streamInfo.shopId} />

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
      <div className="absolute left-4 bottom-[42%] right-16 md:right-auto md:left-6 md:bottom-6 w-auto md:w-full max-w-none md:max-w-[360px] h-[250px] md:h-[320px] flex flex-col justify-end z-20 pointer-events-none">
        <LiveChat roomId={streamId} />
      </div>

      {/* Right Side: Active Product Column */}
      <div className="absolute left-0 right-0 bottom-0 top-[60%] md:top-6 md:bottom-6 md:left-auto md:right-6 w-full md:max-w-[380px] bg-zinc-950/80 md:bg-zinc-950/40 backdrop-blur-xl border-t md:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-t-3xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between z-10">
        <ProductShowcase shopId={streamInfo.shopId} />
      </div>

      {/* AI Chat Assistant */}
      <AiChatPanel shopId={streamInfo.shopId} />

    </div>
  );
}
