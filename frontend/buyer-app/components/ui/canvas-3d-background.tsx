"use client";

import React from "react";

interface Canvas3DBackgroundProps {
  accent?: "emerald" | "cyan" | "purple" | "none";
  centerX?: number;
  centerY?: number;
}

export function Canvas3DBackground({ accent = "none", centerX = 0.5 }: Canvas3DBackgroundProps) {
  // Determine gradient color based on accent
  let accentColor1 = "rgba(6, 182, 212, 0.04)"; // default cyan
  let accentColor2 = "rgba(6, 182, 212, 0.02)";

  if (accent === "emerald") {
    accentColor1 = "rgba(16, 185, 129, 0.04)";
    accentColor2 = "rgba(16, 185, 129, 0.02)";
  } else if (accent === "purple") {
    accentColor1 = "rgba(168, 85, 247, 0.04)";
    accentColor2 = "rgba(168, 85, 247, 0.02)";
  } else if (accent === "none") {
    accentColor1 = "transparent";
    accentColor2 = "transparent";
  }

  // Adjust positioning based on centerX
  const centerPercent = `${Math.round(centerX * 100)}%`;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#08090d] pointer-events-none z-0">
      {/* Editorial Grid overlay */}
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
      {/* Sleek radial gradient highlights */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at ${centerPercent} 20%, ${accentColor1}, transparent 50%),
            radial-gradient(circle at 80% 80%, ${accentColor2}, transparent 50%)
          `
        }}
      />
    </div>
  );
}
