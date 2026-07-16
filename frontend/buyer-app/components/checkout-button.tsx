"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/ui/magnetic";
import { ShoppingCart } from "@phosphor-icons/react";

interface CheckoutButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function CheckoutButton({ onClick, disabled }: CheckoutButtonProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full relative">
      <Magnetic>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "w-full h-11 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono text-[11px] font-bold uppercase tracking-widest transition-all duration-300 pointer-events-auto cursor-pointer",
            "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-[0_0_20px_rgba(6,182,212,0.2)]",
            "active:scale-[0.97] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
            disabled && "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500 shadow-none pointer-events-none"
          )}
        >
          <ShoppingCart size={16} weight="fill" />
          MUA NGAY
        </button>
      </Magnetic>
    </div>
  );
}
