"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PaperPlaneRight, Sparkle, X, Robot } from "@phosphor-icons/react";
import { CheckoutButton } from "./checkout-button";
import { AuctionWidget } from "./ui/auction-widget";

interface LiveStreamPlayerProps {
  streamId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  },
};

export function LiveStreamPlayer({ streamId }: LiveStreamPlayerProps) {
  // Collapsible AI Chat Overlay State
  const [showAiChat, setShowAiChat] = useState(false);

  // Dynamic Stream Metadata State
  const [streamInfo, setStreamInfo] = useState<{
    title: string;
    streamer: string;
    viewers: string;
  }>({
    title: "Sony WH-1000XM5 Deals",
    streamer: "TechGear Official",
    viewers: "12.4K",
  });

  // Public Stream Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, user: "Alice", text: "Wow, sản phẩm đẹp quá!" },
    { id: 2, user: "Bob", text: "Có chương trình giảm giá hay mã coupon gì không shop?" },
    { id: 3, user: "Charlotte", text: "Vừa đặt hàng xong, giao nhanh nha shop ơi!" },
  ]);

  // AI Assistant State
  const [aiChatMessage, setAiChatMessage] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      id: 1,
      user: "AI Assistant",
      text: "Xin chào! Mình là Trợ lý Mua sắm ảo. Bạn cần mình tư vấn thông số kỹ thuật (gõ 'specs') hay số lượng tồn kho (gõ 'stock') của tai nghe Sony WH-1000XM5? 😊",
      isAi: true,
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [product, setProduct] = useState<{
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    isFlashSale: boolean;
  } | null>(null);

  // Fetch dynamic active stream metadata
  useEffect(() => {
    fetch("http://localhost:3000/api/livestreams/active")
      .then((res) => res.json())
      .then((data: any[]) => {
        const active = data.find((s) => s.id === streamId);
        if (active) {
          setStreamInfo({
            title: active.title || "Live Stream",
            streamer: active.shop_name || active.username || "Streamer",
            viewers: active.viewers ? `${(active.viewers / 1000).toFixed(1)}K` : "1.2K",
          });
        } else {
          // Fallback check matching mock streams
          const mock = [
            { id: "cc9db567-1d5e-45a2-8544-c3a098f6718f", title: "Sony WH-1000XM5 Deals", streamer: "TechGear Official", viewers: "12.4K" },
            { id: "stream-2", title: "Unboxing Studio Gear", streamer: "SoundLab Live", viewers: "8.2K" },
            { id: "stream-3", title: "RTX 5090 Showcase", streamer: "GamerSetups", viewers: "19.5K" },
            { id: "stream-4", title: "Custom Keyboard Build", streamer: "KeyCrafters", viewers: "4.5K" },
          ].find((s) => s.id === streamId);
          if (mock) {
            setStreamInfo(mock);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stream details:", err);
      });
  }, [streamId]);

  useEffect(() => {
    const fetchStock = () => {
      fetch("http://localhost:3000/api/products")
        .then((res) => res.json())
        .then((data: any[]) => {
          const found = data.find((p) => p.id === "d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782" || p.isFlashSale);
          if (found) {
            setProduct(found);
          }
        })
        .catch((err) => console.error("Failed to fetch product:", err));
    };

    fetchStock();
    const interval = setInterval(fetchStock, 3000);
    return () => clearInterval(interval);
  }, []);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto scroll AI assistant chat
  useEffect(() => {
    if (showAiChat) {
      aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, showAiChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), user: "You", text: chatMessage },
    ]);
    setChatMessage("");
  };

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatMessage.trim() || isAiLoading) return;

    const userText = aiChatMessage.trim();
    setAiChatMessage("");
    setIsAiLoading(true);

    // 1. Add User Message
    const userMsgId = Date.now();
    setAiMessages((prev) => [
      ...prev,
      { id: userMsgId, user: "You", text: userText, isAi: false },
    ]);

    // Format history
    const history = aiMessages
      .slice(1) // skip the initial greeting
      .map((msg) => ({
        role: msg.isAi ? ("assistant" as const) : ("user" as const),
        content: msg.text,
      }));

    try {
      // 2. Call backend streaming AI endpoint
      const res = await fetch("http://localhost:3000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          shopId: "cc9db567-1d5e-45a2-8544-c3a098f6718f", // Default seeded shop ID
          productId: "d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782", // Default Sony product ID
          history,
        }),
      });

      if (!res.body) throw new Error("No response body");

      // 3. Setup streaming reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const assistantMsgId = Date.now() + 1;

      // Add empty assistant response bubble
      setAiMessages((prev) => [
        ...prev,
        { id: assistantMsgId, user: "AI Assistant", text: "", isAi: true },
      ]);

      let accumulatedText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const token = decoder.decode(value, { stream: true });
        accumulatedText += token;

        // Update assistant message with stream content
        setAiMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
          )
        );
      }
    } catch (err) {
      console.error("[AI Stream] Failed to fetch stream:", err);
      setAiMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          user: "AI Assistant",
          text: "Xin lỗi bạn, kết nối trợ lý AI gặp lỗi. Vui lòng thử lại sau!",
          isAi: true,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-zinc-950 overflow-hidden flex items-center justify-center">

      {/* Background Live Stream Feed */}
      <img
        src={`https://picsum.photos/seed/${streamId}/1920/1080`}
        alt="Live stream feed"
        className="absolute inset-0 w-full h-full object-cover opacity-75 grayscale-[15%] contrast-[105%]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40"></div>

      {/* Live Auction Widget Overlay */}
      <AuctionWidget shopId="a8762ee1-42d5-4c63-9a11-03e3e2875d92" />

      {/* Top Left: Streamer Info Panel */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-zinc-950/40 backdrop-blur-lg border border-white/10 rounded-full pl-2 pr-5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/20">
          <img src={`https://picsum.photos/seed/avatar-${streamId}/100/100`} alt="Streamer" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white leading-none">@{streamInfo.streamer}</span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {streamInfo.viewers} VIEWERS
          </span>
        </div>
      </div>

      {/* Bottom Left: Public Stream Chat (Transparent overlay on top of video) */}
      <div className="absolute left-6 bottom-6 w-full max-w-[360px] h-[320px] flex flex-col justify-end z-20 pointer-events-none">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-2 mb-3 scrollbar-none flex flex-col justify-end pointer-events-auto bg-gradient-to-t from-zinc-950/60 to-transparent rounded-xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  variants={itemVariants}
                  layout
                  className="text-xs bg-black/35 backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-xl w-fit max-w-[90%] leading-relaxed shadow-sm"
                >
                  <span className="font-mono font-bold text-cyan-400 mr-1.5">{msg.user}:</span>
                  <span className="text-zinc-200">{msg.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </motion.div>
        </div>

        {/* Chat Input */}
        <div className="p-1 pointer-events-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <label htmlFor="chat-input" className="sr-only">Message the room</label>
            <input
              id="chat-input"
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="w-full bg-black/50 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-500 transition-all font-medium font-sans"
              placeholder="Gửi bình luận..."
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-white text-zinc-950 hover:bg-zinc-200 rounded-full flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
              disabled={!chatMessage.trim()}
              aria-label="Send message"
            >
              <PaperPlaneRight size={12} weight="fill" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Side: Active Product Column */}
      <div className="absolute right-6 top-6 bottom-6 w-full max-w-[380px] bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-3xl p-6 flex flex-col justify-between z-10">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sản phẩm đang live
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
              Flash Sale
            </span>
          </div>

          {/* Product Image Showcase */}
          <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 relative mb-4">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60"
              alt="Sony WH-1000XM5"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-red-500 text-white font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded-md shadow-md animate-pulse">
              -33% OFF
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{product?.name || "Sony WH-1000XM5"}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">{product?.description || "Tai nghe chống ồn chủ động đỉnh cao công nghệ từ Sony"}</p>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2.5 mt-4">
            <span className="text-3xl font-mono font-bold text-emerald-400">${product?.price || 299}</span>
            <span className="text-sm font-mono text-zinc-500 line-through">${(product?.price || 299) * 1.5 | 0}</span>
          </div>

          {/* Stock Meter */}
          <div className="space-y-1.5 mt-4">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                Số lượng còn lại: <span className="text-white font-semibold">{product ? (product.stock === 0 ? "HẾT HÀNG" : `${product.stock} sản phẩm`) : "100 sản phẩm"}</span>
              </span>
              <span>Đã bán: {100 - (product?.stock || 100)}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${product ? (product.stock / 100) * 100 : 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Button & Timer */}
        <div className="border-t border-white/5 pt-4 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>Thời gian ưu đãi còn:</span>
            <span className="text-white font-bold animate-pulse">08:00</span>
          </div>
          <CheckoutButton productId={product?.id || "d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782"} />
        </div>
      </div>

      {/* Floating AI Chat Assistant Trigger Bubble */}
      <button
        onClick={() => setShowAiChat(!showAiChat)}
        className="absolute right-[412px] bottom-6 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 flex items-center justify-center transition-all cursor-pointer shadow-lg z-20 hover:scale-105 active:scale-95 border border-white/10"
        aria-label="Toggle AI Assistant"
      >
        {showAiChat ? <X size={20} weight="bold" /> : <Robot size={22} weight="fill" />}
      </button>

      {/* Collapsible Floating AI Chat Assistant Panel */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 25 }}
            className="absolute right-[412px] bottom-20 w-[340px] h-[400px] bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-20"
          >
            {/* AI Panel Header */}
            <div className="px-4 py-3 bg-zinc-950/60 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Sparkle size={14} weight="fill" className="animate-pulse text-cyan-400" />
                Trợ lý mua sắm AI
              </div>
              <button
                onClick={() => setShowAiChat(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Close panel"
              >
                <X size={14} />
              </button>
            </div>

            {/* AI Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none bg-zinc-950/20">
              <div className="flex flex-col gap-3.5">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 items-start ${msg.isAi ? "" : "justify-end"}`}
                  >
                    {msg.isAi && (
                      <div className="w-[18px] h-[18px] rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                        <Sparkle size={10} weight="fill" className="text-cyan-400" />
                      </div>
                    )}

                    <div className={`flex flex-col ${msg.isAi ? "" : "items-end"}`}>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {msg.isAi ? "AI Assistant" : "You"}
                      </span>
                      <div className={`text-xs leading-snug mt-1 max-w-[240px] px-3.5 py-2.5 rounded-2xl ${msg.isAi
                          ? "bg-zinc-800/80 border border-white/5 text-zinc-200"
                          : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
                        }`}>
                        {msg.text || (
                          <span className="flex items-center gap-1 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "0ms" }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "300ms" }}></span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={aiEndRef} />
              </div>
            </div>

            {/* AI Input Box */}
            <div className="p-3 border-t border-white/5 bg-zinc-950/20">
              <form onSubmit={handleSendAiMessage} className="flex gap-2 relative">
                <label htmlFor="ai-chat-input" className="sr-only">Ask the assistant</label>
                <input
                  id="ai-chat-input"
                  type="text"
                  value={aiChatMessage}
                  onChange={(e) => setAiChatMessage(e.target.value)}
                  disabled={isAiLoading}
                  className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                  placeholder={isAiLoading ? "Đang xử lý..." : "Hỏi về thông số, kho hàng..."}
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-full flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-cyan-500 cursor-pointer"
                  disabled={!aiChatMessage.trim() || isAiLoading}
                  aria-label="Send query"
                >
                  <PaperPlaneRight size={12} weight="fill" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
