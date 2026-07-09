"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PaperPlaneRight, UserCircle, Storefront, Sparkle } from "@phosphor-icons/react";
import { CheckoutButton } from "./checkout-button";

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
  const [activeTab, setActiveTab] = useState<"chat" | "ai">("chat");

  // Public Stream Chat State
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, user: "Alice", text: "Wow, looks amazing!" },
    { id: 2, user: "Bob", text: "Is there any discount?" },
    { id: 3, user: "Charlotte", text: "Just ordered one!" },
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

  // Auto scroll
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiMessages, activeTab]);

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

      {/* Top Left: Streamer Info Panel */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-zinc-950/40 backdrop-blur-lg border border-white/10 rounded-full pl-2 pr-5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/20">
          <img src={`https://picsum.photos/seed/avatar-${streamId}/100/100`} alt="Streamer" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white leading-none">TechGear Official</span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            12.4K VIEWERS
          </span>
        </div>
      </div>

      {/* Right Overlay Panel: Chat & Flash Sale */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[380px] p-6 flex flex-col justify-end gap-5 z-10 pointer-events-none">
        
        {/* Flash Sale Product Card */}
        <motion.div 
          className="bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-2xl p-5 flex flex-col gap-3 pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase tracking-widest font-mono">
            <Storefront weight="fill" className="text-emerald-400" size={14} />
            Active Flash Sale
          </div>
          
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{product?.name || "Sony WH-1000XM5"}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{product?.description || "Industry-leading noise canceling headphones"}</p>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-bold text-emerald-400">${product?.price || 299}</span>
            <span className="text-xs font-mono text-zinc-500 line-through">${(product?.price || 299) * 1.33 | 0}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-white/5 pt-2">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>
              STOCK: <span className="text-white font-semibold">{product ? (product.stock === 0 ? "OUT OF STOCK" : `${product.stock} LEFT`) : "100 LEFT"}</span>
            </span>
            <span>ENDS IN: <span className="text-white font-semibold">08:00</span></span>
          </div>

          <CheckoutButton productId={product?.id || "d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782"} />
        </motion.div>

        {/* Chat / AI Tabbed Panel */}
        <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-2xl flex flex-col h-80 pointer-events-auto overflow-hidden">
          
          {/* Tab Selection */}
          <div className="flex border-b border-white/5 bg-zinc-950/60 text-[10px] font-mono font-bold tracking-wider shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-center transition-colors uppercase cursor-pointer ${
                activeTab === "chat"
                  ? "text-emerald-400 border-b border-emerald-500 bg-white/5"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Stream Chat
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-3 text-center transition-colors uppercase flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "ai"
                  ? "text-cyan-400 border-b border-cyan-500 bg-white/5"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Sparkle size={10} weight="fill" className={activeTab === "ai" ? "animate-pulse" : ""} />
              AI Assistant
            </button>
          </div>

          {/* Tab 1: Public Stream Chat */}
          {activeTab === "chat" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-3.5"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id} 
                        variants={itemVariants}
                        layout
                        className="flex gap-2.5 items-start"
                      >
                        <UserCircle size={18} weight="fill" className="text-zinc-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-zinc-400">{msg.user}</span>
                          <span className="text-xs text-white leading-snug mt-0.5">{msg.text}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </motion.div>
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-white/5 bg-zinc-950/20">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                  <label htmlFor="chat-input" className="sr-only">Message the room</label>
                  <input
                    id="chat-input"
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-600 transition-all font-medium font-sans"
                    placeholder="Message the stream..."
                  />
                  <button 
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 aspect-square bg-white text-zinc-950 hover:bg-zinc-200 rounded-full flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                    disabled={!chatMessage.trim()}
                    aria-label="Send message"
                  >
                    <PaperPlaneRight size={14} weight="fill" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: AI Shopping Assistant */}
          {activeTab === "ai" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 scrollbar-none bg-zinc-950/20">
                <div className="flex flex-col gap-3.5">
                  {aiMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2.5 items-start ${msg.isAi ? "" : "flex-row-reverse"}`}
                    >
                      {msg.isAi ? (
                        <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                          <Sparkle size={10} weight="fill" className="text-white" />
                        </div>
                      ) : (
                        <UserCircle size={18} weight="fill" className="text-cyan-400 shrink-0 mt-0.5" />
                      )}
                      
                      <div className={`flex flex-col ${msg.isAi ? "" : "items-end"}`}>
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {msg.isAi ? "AI Shopping Assistant" : "You"}
                        </span>
                        <div className={`text-xs leading-snug mt-1 max-w-[240px] px-3.5 py-2.5 rounded-2xl ${
                          msg.isAi 
                            ? "bg-zinc-900/80 border border-white/5 text-white shadow-sm"
                            : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-200"
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

              {/* AI Chat Input */}
              <div className="p-3 border-t border-white/5 bg-zinc-950/20">
                <form onSubmit={handleSendAiMessage} className="flex gap-2 relative">
                  <label htmlFor="ai-chat-input" className="sr-only">Ask the assistant</label>
                  <input
                    id="ai-chat-input"
                    type="text"
                    value={aiChatMessage}
                    onChange={(e) => setAiChatMessage(e.target.value)}
                    disabled={isAiLoading}
                    className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    placeholder={isAiLoading ? "AI is processing..." : "Ask product specs or stock..."}
                  />
                  <button 
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 aspect-square bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-full flex items-center justify-center transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-cyan-500 cursor-pointer"
                    disabled={!aiChatMessage.trim() || isAiLoading}
                    aria-label="Send query"
                  >
                    <PaperPlaneRight size={14} weight="fill" />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
