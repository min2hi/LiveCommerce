"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gavel, Trophy, User, ArrowUpRight, WarningCircle } from "@phosphor-icons/react";

interface Auction {
  id: string;
  shopId: string;
  title: string;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  winnerId?: string;
}

interface Bid {
  userId: string;
  username: string;
  bidAmount: number;
}

export function AuctionWidget({ shopId }: { shopId: string }) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBidding, setIsBidding] = useState(false);

  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("buyer_token");
    setToken(savedToken);

    // Initial fetch for active auction
    fetch(`http://localhost:3000/api/auctions/active/${shopId}`)
      .then((res) => {
        if (!res.ok) throw new Error("No active auction");
        return res.json();
      })
      .then((data: Auction) => {
        setAuction(data);
        // Fetch recent bids
        return fetch(`http://localhost:3000/api/auctions/${data.id}/bids`);
      })
      .then((res) => res?.json())
      .then((bids: any[]) => {
        if (bids) {
          setRecentBids(
            bids.map((b) => ({
              userId: b.userId,
              username: "User", // Mock username if not joined
              bidAmount: b.bidAmount,
            }))
          );
        }
      })
      .catch(() => {
        // No active auction, ignore
      });

    // Setup SSE
    const eventSource = new EventSource(`http://localhost:3000/api/sse/stream?shopId=${shopId}`);
    sseRef.current = eventSource;

    eventSource.addEventListener("auction:started", (e) => {
      const data = JSON.parse(e.data);
      setAuction(data.auction);
      setRecentBids([]);
    });

    eventSource.addEventListener("auction:bid_placed", (e) => {
      const data = JSON.parse(e.data);
      setAuction((prev) =>
        prev && prev.id === data.auctionId
          ? { ...prev, currentPrice: data.bidAmount }
          : prev
      );
      setRecentBids((prev) => [
        {
          userId: data.userId,
          username: data.username || "Anonymous",
          bidAmount: data.bidAmount,
        },
        ...prev.slice(0, 4), // keep last 5
      ]);
    });

    eventSource.addEventListener("auction:ended", (e) => {
      const data = JSON.parse(e.data);
      setAuction((prev) =>
        prev && prev.id === data.auctionId
          ? { ...prev, status: "COMPLETED", winnerId: data.winnerId }
          : prev
      );
    });

    return () => {
      eventSource.close();
    };
  }, [shopId]);

  const handleBid = async () => {
    if (!auction || !token) {
      setError("Vui lòng đăng nhập để đấu giá");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const nextBid = Number(auction.currentPrice) + Number(auction.minIncrement);
    setIsBidding(true);

    try {
      const res = await fetch(`http://localhost:3000/api/auctions/${auction.id}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: nextBid }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Lỗi đặt giá");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsBidding(false);
    }
  };

  if (!auction || auction.status === "CANCELLED") return null;

  return (
    <AnimatePresence>
      {auction.status === "ACTIVE" && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="absolute top-20 right-6 w-72 bg-zinc-950/80 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.2)] z-40 overflow-hidden"
        >
          {/* Animated Glow Background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-red-500/10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />

          <div className="relative z-10 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gavel size={18} className="text-amber-400" weight="fill" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Live Auction
                </span>
              </div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>

            {/* Product Info */}
            <h3 className="text-sm font-bold text-white line-clamp-1">{auction.title}</h3>

            {/* Price Box */}
            <div className="bg-black/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-[10px] text-zinc-400 font-mono mb-1">CURRENT BID</span>
              <motion.div
                key={auction.currentPrice}
                initial={{ scale: 1.5, color: "#f59e0b" }}
                animate={{ scale: 1, color: "#ffffff" }}
                className="text-3xl font-black tracking-tight"
              >
                ${Number(auction.currentPrice).toLocaleString()}
              </motion.div>
            </div>

            {/* Leaderboard / Bids */}
            <div className="space-y-1.5 min-h-[60px] max-h-[100px] overflow-y-auto scrollbar-none">
              <AnimatePresence>
                {recentBids.map((bid, i) => (
                  <motion.div
                    key={`${bid.userId}-${bid.bidAmount}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between text-xs p-1.5 rounded ${
                      i === 0
                        ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/20"
                        : "text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {i === 0 ? <Trophy size={14} weight="fill" /> : <User size={14} />}
                      <span className="truncate max-w-[100px]">{bid.username}</span>
                    </div>
                    <span>${Number(bid.bidAmount).toLocaleString()}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recentBids.length === 0 && (
                <div className="text-xs text-zinc-500 text-center italic py-2">
                  Chưa có ai đặt giá. Hãy là người đầu tiên!
                </div>
              )}
            </div>

            {/* Action */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBid}
              disabled={isBidding}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white font-black text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              BID +${Number(auction.minIncrement).toLocaleString()}
              <ArrowUpRight size={16} weight="bold" />
            </motion.button>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold mt-1"
                >
                  <WarningCircle size={14} weight="fill" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {auction.status === "COMPLETED" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 p-8 rounded-3xl z-50 text-center shadow-[0_0_100px_rgba(245,158,11,0.3)]"
        >
          <Trophy size={48} className="text-amber-400 mx-auto mb-4" weight="duotone" />
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
            Auction Ended
          </h2>
          <p className="text-zinc-400 mb-6">
            Sản phẩm <span className="text-white font-bold">{auction.title}</span> đã được bán với giá:
          </p>
          <div className="text-5xl font-black text-amber-400 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            ${Number(auction.currentPrice).toLocaleString()}
          </div>
          <button
            onClick={() => setAuction(null)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-sm transition-colors"
          >
            Đóng
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
