"use client";

import { useEffect } from "react";
import { buildApiUrl } from "@/lib/api";

export function NotificationManager() {
  useEffect(() => {
    // Request permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(console.error);
    }

    // Connect to global SSE for notifications (or a specific shop if we had context)
    const sseUrl = buildApiUrl(`/sse/buyer/global`); 
    const es = new EventSource(sseUrl);

    es.addEventListener("stream_starting", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (Notification.permission === "granted") {
          new Notification("Flash Sale Sắp Bắt Đầu!", {
            body: `${payload.shopName || "Một shop"} chuẩn bị lên sóng. Vào săn deal ngay!`,
            icon: payload.bannerUrl || "/favicon.ico",
          });
        }
      } catch (err) {
        console.error("Failed to parse notification payload", err);
      }
    });

    return () => {
      es.close();
    };
  }, []);

  return null;
}
