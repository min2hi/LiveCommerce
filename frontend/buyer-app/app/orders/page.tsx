"use client";

import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { buildApiUrl } from "@/lib/api";
import { motion } from "motion/react";

interface Order {
  id: string;
  productId: string;
  shopId: string;
  quantity: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "FAILED" | "SHIPPED" | "DELIVERED";
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("buyer_token");
      if (!token) {
        setError("Vui lòng đăng nhập để xem đơn hàng.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(buildApiUrl("/orders"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Lỗi khi tải danh sách đơn hàng.");
        }
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin"></div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center gap-3 text-center max-w-sm">
          <WarningCircle size={32} className="text-red-400" />
          <h2 className="text-sm font-bold text-red-100 uppercase tracking-widest font-mono">Lỗi kết nối</h2>
          <p className="text-xs text-red-200/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100 font-sans selection:bg-cyan-500/30">
      <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-20 pt-10">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-400 text-[10px] uppercase tracking-widest font-mono font-bold">
            <Package size={14} weight="fill" />
            Quản lý tài khoản
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Lịch sử đơn hàng</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Theo dõi trạng thái giao dịch và các sản phẩm bạn đã chốt đơn từ các buổi Livestream.
          </p>
        </div>

        {/* List */}
        {orders.length === 0 ? (
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Package size={48} className="text-zinc-700" weight="thin" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-zinc-300">Chưa có đơn hàng nào</p>
              <p className="text-xs text-zinc-500">Bạn chưa mua bất kỳ sản phẩm nào từ các phiên live.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={order.id}
                className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 hover:bg-zinc-900/60 transition-colors"
              >
                {/* Visual Representation */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-800 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center border border-white/5">
                  <Package size={24} className="text-zinc-600" />
                  <div className="absolute top-1 right-1 w-5 h-5 bg-zinc-950/80 rounded-full flex items-center justify-center text-[9px] font-bold font-mono">
                    x{order.quantity}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-0.5 gap-4 sm:gap-0">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm font-bold text-zinc-100 font-mono break-all line-clamp-1" title={order.id}>
                        {order.id.split('-')[0].toUpperCase()}...{order.id.split('-').pop()?.substring(0, 4).toUpperCase()}
                      </h3>
                      <div className="text-sm font-bold text-cyan-400 font-mono whitespace-nowrap">
                        ${order.totalPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                      Shop: {order.shopId.substring(0,8)}...
                    </span>
                    
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider ${
                      order.status === 'CONFIRMED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : order.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : order.status === 'FAILED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {order.status === 'CONFIRMED' && <CheckCircle size={10} weight="fill" />}
                      {order.status === 'PENDING' && <Clock size={10} weight="fill" />}
                      {order.status === 'FAILED' && <WarningCircle size={10} weight="fill" />}
                      {order.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
