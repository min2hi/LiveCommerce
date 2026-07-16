"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98] active:-translate-y-[1px]", // Tactile feedback
          {
            "bg-zinc-950 text-zinc-50 hover:bg-zinc-950/90": variant === "primary",
            "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80": variant === "secondary",
            "hover:bg-zinc-100 hover:text-zinc-900": variant === "ghost",
            "h-11 px-8 py-2": size === "default",
            "h-14 px-10 text-lg": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
