import React from "react";
import { LiveStreamPlayer } from "@/components/live-stream-player";

export default async function LiveRoomPage({ params }: { params: Promise<{ streamId: string }> }) {
  const { streamId } = await params;
  
  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-zinc-950">
      <LiveStreamPlayer streamId={streamId} />
    </div>
  );
}
