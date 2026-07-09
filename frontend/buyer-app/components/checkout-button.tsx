"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { Magnetic } from "@/components/ui/magnetic";

interface CheckoutButtonProps {
  productId: string;
}

export function CheckoutButton({ productId }: CheckoutButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rate_limited">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const getOrInitToken = async (): Promise<string | null> => {
    let token = localStorage.getItem("buyer_token");
    if (token) return token;

    setErrorMsg("Active session token not found.");
    return null;
  };

  const handleCheckout = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const token = await getOrInitToken();
      if (!token) {
        setStatus("error");
        setErrorMsg("AUTH FAILED");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }

      // Generate a unique idempotency key for this click
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const res = await fetch("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (res.status === 202 || res.status === 200) {
        setStatus("success");
      } else if (res.status === 429) {
        setStatus("rate_limited");
        setErrorMsg("TOO FAST");
      } else if (res.status === 409) {
        setStatus("error");
        setErrorMsg("OUT OF STOCK");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(errorData.error || "FAILED");
      }
    } catch (err) {
      console.error("[CheckoutButton] Checkout failed:", err);
      setStatus("error");
      setErrorMsg("NETWORK ERROR");
    }

    // Reset after 3 seconds for demo purposes
    setTimeout(() => {
      setStatus("idle");
    }, 3000);
  };

  const buttonContent = (
    <button
      onClick={handleCheckout}
      disabled={status === "loading" || status === "success"}
      className={twMerge(
        clsx(
          "w-full h-11 inline-flex items-center justify-center whitespace-nowrap rounded-full font-mono text-[11px] font-bold uppercase tracking-widest transition-all duration-300 pointer-events-auto cursor-pointer",
          "active:scale-[0.97] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
          {
            "bg-white text-zinc-950 hover:bg-zinc-100": status === "idle",
            "bg-zinc-900 text-transparent border border-zinc-800 pointer-events-none": status === "loading",
            "bg-emerald-500 text-zinc-950 pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.2)]": status === "success",
            "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]": status === "error" || status === "rate_limited",
          }
        )
      )}
    >
      {status === "idle" && "Initiate Checkout"}
      
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-6">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" style={{ animationDelay: "0ms" }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: "150ms" }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "300ms" }}></span>
        </div>
      )}
      
      {status === "success" && (
        <span className="flex items-center gap-1.5">
          <CheckCircle weight="bold" size={15} />
          Order Confirmed
        </span>
      )}
      
      {(status === "error" || status === "rate_limited") && (
        <span className="flex items-center gap-1.5">
          <XCircle weight="bold" size={15} />
          {errorMsg}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col gap-2.5 w-full relative">
      {status === "idle" ? (
        <Magnetic>{buttonContent}</Magnetic>
      ) : (
        buttonContent
      )}
      
      {/* Refined error messages */}
      {(status === "error" || status === "rate_limited") && (
        <p className="text-[10px] font-mono text-red-400/90 text-center uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
          {status === "error" ? `Transaction failed: ${errorMsg}` : "Rate limit: please wait"}
        </p>
      )}
    </div>
  );
}
