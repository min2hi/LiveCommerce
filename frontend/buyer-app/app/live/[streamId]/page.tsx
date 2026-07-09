"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { LiveStreamPlayer } from "@/components/live-stream-player";

export default function LiveRoomPage({ params }: { params: Promise<{ streamId: string }> }) {
  const router = useRouter();
  const { streamId } = use(params);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("buyer_token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="w-full h-[100dvh] bg-zinc-950 flex items-center justify-center font-mono text-zinc-500 text-xs">
        Verifying secure connection session...
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-zinc-950">
      <LiveStreamPlayer streamId={streamId} />
    </div>
  );
}
