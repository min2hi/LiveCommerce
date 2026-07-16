import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0d0f14] flex flex-col items-center justify-center w-full">
      <div className="relative flex items-center justify-center">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full w-24 h-24" />
        
        {/* Animated rings */}
        <div className="absolute w-16 h-16 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <div className="absolute w-12 h-12 border-2 border-blue-500/30 border-b-blue-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        
        {/* Center dot */}
        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_#fff]" />
      </div>
      
      {/* Loading text */}
      <div className="mt-8 flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-cyan-500">
        <span className="animate-pulse" style={{ animationDelay: "0ms" }}>L</span>
        <span className="animate-pulse" style={{ animationDelay: "100ms" }}>o</span>
        <span className="animate-pulse" style={{ animationDelay: "200ms" }}>a</span>
        <span className="animate-pulse" style={{ animationDelay: "300ms" }}>d</span>
        <span className="animate-pulse" style={{ animationDelay: "400ms" }}>i</span>
        <span className="animate-pulse" style={{ animationDelay: "500ms" }}>n</span>
        <span className="animate-pulse" style={{ animationDelay: "600ms" }}>g</span>
      </div>
    </div>
  );
}
