"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import useSWR from "swr";
import { CheckoutButton } from "../checkout-button";
import { PurchaseModal } from "../checkout/purchase-modal";
import { GlowingCard } from "../ui/card-hover-effect";
import { MovingBorder } from "../ui/moving-border";
import { buildApiUrl } from "@/lib/api";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isFlashSale: boolean;
  flashSaleEndTime?: string;
  imageUrl?: string;
}

interface ProductShowcaseProps {
  shopId?: string;
}

export function ProductShowcase({ shopId }: ProductShowcaseProps) {
  // SWR: fetch products ONCE on mount, then rely on SSE for updates (no more polling)
  const { data: products, mutate } = useSWR<Product[]>(
    buildApiUrl("/products"),
    fetcher,
    { revalidateOnFocus: false } // Disable polling entirely — SSE handles updates
  );

  const eventSourceRef = useRef<EventSource | null>(null);
  const [timeLeft, setTimeLeft] = useState("08:00");
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Stable callback to handle SSE stock_updated events
  const handleStockUpdate = useCallback(
    (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          productId: string;
          quantity: number;
        };

        // Optimistic UI update: decrement stock in cache without refetching
        mutate(
          (current) => {
            if (!current) return current;
            return current.map((p) =>
              p.id === payload.productId
                ? { ...p, stock: Math.max(0, p.stock - (payload.quantity || 1)) }
                : p
            );
          },
          { revalidate: false } // Don't refetch — trust the server push
        );
      } catch (err) {
        console.error("[ProductShowcase] Failed to parse stock_updated event:", err);
      }
    },
    [mutate]
  );

  // SSE Connection Lifecycle
  useEffect(() => {
    if (!shopId) return;

    const sseUrl = buildApiUrl(`/sse/buyer/${shopId}`);

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener("stock_updated", handleStockUpdate);

    es.onerror = () => {
      // EventSource auto-reconnects by default; just log it
      console.warn("[ProductShowcase] SSE connection error, will auto-reconnect...");
    };

    return () => {
      es.removeEventListener("stock_updated", handleStockUpdate);
      es.close();
      eventSourceRef.current = null;
    };
  }, [shopId, handleStockUpdate]);

  // Fallback to demo product if not found
  const product = products?.find((p) => p.isFlashSale || p.id === "d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782");
  
  useEffect(() => {
    if (!product?.flashSaleEndTime) {
      setTimeLeft("00:00");
      return;
    }

    const targetTime = new Date(product.flashSaleEndTime).getTime();
    
    const updateTime = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft("00:00");
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [product?.flashSaleEndTime]);
  
  const maxStock = 100;
  const currentStock = product ? product.stock : maxStock;
  const soldPercent = Math.max(0, Math.min(100, ((maxStock - currentStock) / maxStock) * 100));
  const remainingPercent = 100 - soldPercent;

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-cyan-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            Sản phẩm đang live
          </span>
          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
            Flash Sale
          </span>
        </div>

        {/* Product Image Showcase */}
        <GlowingCard className="w-full h-48 rounded-2xl border border-white/10 bg-zinc-900 mb-4 p-0 overflow-hidden relative">

          <img
            src={product?.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"}
            alt={product?.name || "Product"}
            className="w-full h-full object-cover rounded-2xl pointer-events-none"
          />
          <MovingBorder
            duration={3}
            borderRadius="0.375rem"
            containerClassName="absolute top-3 left-3 h-[22px] w-[64px]"
            borderClassName="bg-[radial-gradient(#ef4444_40%,transparent_60%)]"
            className="bg-red-500 text-white font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded-md flex items-center justify-center w-full h-full"
          >
            -33% OFF
          </MovingBorder>
        </GlowingCard>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">{product?.name || "Sony WH-1000XM5"}</h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-normal">{product?.description || "Tai nghe chống ồn chủ động đỉnh cao công nghệ từ Sony"}</p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2.5 mt-4">
          <span className="text-3xl font-mono font-bold text-cyan-400">${product?.price || 299}</span>
          <span className="text-sm font-mono text-zinc-500 line-through">${((product?.price || 299) * 1.5).toFixed(0)}</span>
        </div>

        {/* Stock Meter */}
        <div className="space-y-1.5 mt-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              Số lượng còn lại: <span className="text-white font-semibold">{currentStock === 0 ? "HẾT HÀNG" : `${currentStock} sản phẩm`}</span>
            </span>
            <span>Đã bán: {soldPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${remainingPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Button & Timer */}
      <div className="border-t border-white/5 pt-4 space-y-4">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>Thời gian ưu đãi còn:</span>
          <span className="text-white font-bold animate-pulse">{timeLeft}</span>
        </div>
        <CheckoutButton 
          onClick={() => setIsPurchaseModalOpen(true)} 
          disabled={currentStock === 0} 
        />
      </div>

      <PurchaseModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => setIsPurchaseModalOpen(false)} 
        product={product || null} 
      />
    </div>
  );
}
