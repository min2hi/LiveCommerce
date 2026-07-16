"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, CreditCard, Money, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { buildApiUrl } from "@/lib/api";

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDetails | null;
}

export function PurchaseModal({ isOpen, onClose, product }: PurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [status, setStatus] = useState<"idle" | "loading" | "waiting" | "success" | "error" | "rate_limited">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMsg("");
      setRetryCount(0);
    }
  }, [isOpen]);

  const getOrInitToken = async (): Promise<string | null> => {
    const token = localStorage.getItem("buyer_token");
    if (token) return token;
    return null;
  };

  const attemptCheckout = async (token: string, idempotencyKey: string, currentRetry = 0) => {
    if (!product) return;
    try {
      const res = await fetch(buildApiUrl("/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (res.status === 202 || res.status === 200) {
        setStatus("success");
        // Auto close after 3 seconds on success
        setTimeout(() => onClose(), 3000);
      } else if (res.status === 429) {
        if (currentRetry < 5) {
          setStatus("waiting");
          setRetryCount(currentRetry + 1);
          const delay = Math.pow(2, currentRetry) * 500;
          setTimeout(() => attemptCheckout(token, idempotencyKey, currentRetry + 1), delay);
        } else {
          setStatus("rate_limited");
          setErrorMsg("Hệ thống đang quá tải, vui lòng thử lại sau.");
          setTimeout(() => setStatus("idle"), 4000);
        }
      } else if (res.status === 409) {
        setStatus("error");
        setErrorMsg("Rất tiếc, sản phẩm đã hết hàng.");
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(errorData.error || "Giao dịch thất bại.");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch (err) {
      console.error("[PurchaseModal] Checkout failed:", err);
      setStatus("error");
      setErrorMsg("Lỗi kết nối mạng.");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const handlePlaceOrder = async () => {
    if (status === "loading" || status === "waiting" || status === "success") return;
    setStatus("loading");
    setErrorMsg("");

    const token = await getOrInitToken();
    if (!token) {
      setStatus("error");
      setErrorMsg("Vui lòng đăng nhập để mua hàng.");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await attemptCheckout(token, idempotencyKey, 0);
  };

  if (!product) return null;

  const shippingFee = 15;
  const total = product.price + shippingFee;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={status !== "loading" && status !== "waiting" ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-[400px] z-[51] bg-zinc-950 border border-white/10 rounded-t-3xl md:rounded-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle size={80} className="text-cyan-400 mb-6" weight="fill" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Đặt Hàng Thành Công!</h2>
                <p className="text-zinc-400 text-sm">Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-900/50">
                  <h2 className="text-lg font-bold text-white tracking-tight">Xác nhận đơn hàng</h2>
                  <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                    <X size={20} weight="bold" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-none">
                  {/* Product Summary */}
                  <div className="flex gap-4 p-3 bg-zinc-900 rounded-2xl border border-white/5">
                    <img 
                      src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80"} 
                      alt={product.name} 
                      className="w-20 h-20 object-cover rounded-xl bg-zinc-800"
                    />
                    <div className="flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1">Phân loại: Mặc định</p>
                      <span className="text-lg font-mono font-bold text-cyan-400 mt-1">${product.price}</span>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Địa chỉ nhận hàng</h4>
                    <div className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                      <MapPin size={20} className="text-zinc-400 mt-0.5 shrink-0" weight="fill" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Huy Nguyễn (0987.654.321)</span>
                        <span className="text-xs text-zinc-400 mt-1 leading-relaxed">Tòa nhà Bitexco, Số 2 Hải Triều, Quận 1, TP. Hồ Chí Minh</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phương thức thanh toán</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("cod")}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                          paymentMethod === "cod" ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Money size={28} weight={paymentMethod === "cod" ? "duotone" : "regular"} className="mb-2" />
                        <span className="text-xs font-bold">Thanh toán (COD)</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                          paymentMethod === "card" ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <CreditCard size={28} weight={paymentMethod === "card" ? "duotone" : "regular"} className="mb-2" />
                        <span className="text-xs font-bold">Thẻ tín dụng</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Tạm tính (1 sản phẩm)</span>
                      <span className="font-mono">${product.price}</span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Phí giao hàng</span>
                      <span className="font-mono">${shippingFee}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                      <span>Tổng cộng</span>
                      <span className="font-mono text-cyan-400">${total}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 md:p-6 bg-zinc-950 border-t border-white/5">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={status === "loading" || status === "waiting"}
                    className={`w-full py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] flex justify-center items-center gap-2 ${
                      status === "error" || status === "rate_limited"
                        ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                        : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {status === "idle" && "CHỐT ĐƠN NGAY"}
                    {status === "loading" && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    )}
                    {status === "waiting" && `HỆ THỐNG ĐANG XỬ LÝ (${retryCount}/5)`}
                    {(status === "error" || status === "rate_limited") && (
                      <>
                        <WarningCircle size={18} weight="fill" />
                        {errorMsg}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
