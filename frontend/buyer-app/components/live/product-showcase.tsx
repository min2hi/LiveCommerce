"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Fire, ShoppingCart } from "@phosphor-icons/react";
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
  const [fomoToasts, setFomoToasts] = useState<{ id: string; timestamp: number }[]>([]);

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

        // Trigger FOMO Toast
        const toastId = `fomo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setFomoToasts((prev) => [...prev, { id: toastId, timestamp: Date.now() }]);

        // Auto remove toast after 3.5 seconds
        setTimeout(() => {
          setFomoToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 3500);

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

  const currentStock = product ? product.stock : 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 pb-0 flex flex-col gap-4">
        <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-cyan-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            Sản phẩm đang live
          </span>
          <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
            Flash Sale
          </span>
        </div>

        {/* Fomo Toasts Area */}
        <div className="absolute top-16 left-0 right-0 z-50 pointer-events-none flex flex-col gap-2 items-center px-4">
          <AnimatePresence>
            {fomoToasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-black/80 backdrop-blur-md border border-cyan-500/30 text-white px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center">
                  <Fire size={14} weight="fill" className="text-white" />
                </div>
                <span className="text-xs font-bold whitespace-nowrap tracking-wide">
                  Một khách hàng vừa chốt đơn!
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Product Image Showcase */}
        <GlowingCard className="w-full h-32 rounded-xl border border-white/10 bg-zinc-900 mb-3 p-0 overflow-hidden relative">

          {product?.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl pointer-events-none"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center opacity-80 pointer-events-none">
              <ShoppingCart size={32} className="text-zinc-600" />
            </div>
          )}
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
        <div className="space-y-1 mt-3">
          <h3 className="text-sm font-bold text-white tracking-tight">{product?.name || "Đang tải sản phẩm..."}</h3>
          <p className="text-[10px] text-zinc-400 leading-relaxed font-normal line-clamp-1">{product?.description || "Vui lòng chờ trong giây lát"}</p>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2.5 mt-4">
          <span className="text-3xl font-mono font-bold text-cyan-400">${product?.price || 0}</span>
          <span className="text-sm font-mono text-zinc-500 line-through">${((product?.price || 0) * 1.5).toFixed(0)}</span>
        </div>

        {/* Stock Meter */}
        <div className="space-y-1.5 mt-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              Số lượng còn lại: <span className="text-white font-semibold">{currentStock === 0 ? "HẾT HÀNG" : `${currentStock} sản phẩm`}</span>
            </span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: currentStock > 0 ? '100%' : '0%' }}
            ></div>
          </div>
        </div>
      </div>
      </div>

      {/* Action Button & Timer */}
      <div className="flex-shrink-0 border-t border-white/5 p-4 mt-4 bg-[#050505] space-y-4">
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
