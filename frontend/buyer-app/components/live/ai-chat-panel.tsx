"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PaperPlaneRight, Sparkle, X, Robot } from "@phosphor-icons/react";
import { SparklesCore } from "../ui/sparkles";
import { buildApiUrl } from "@/lib/api";

interface AiChatPanelProps {
  shopId: string;
  productId?: string;
}

export function AiChatPanel({ shopId, productId = "d3b4a9cf-5a5d-47b0-b332-e6a7ea5af782" }: AiChatPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  const [showAiChat, setShowAiChat] = useState(false);
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
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll AI assistant chat
  useEffect(() => {
    if (showAiChat) {
      aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, showAiChat]);

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
      const res = await fetch(buildApiUrl("/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          shopId,
          productId,
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
      console.warn("[AI Stream] Failed to fetch stream:", err instanceof Error ? err.message : err);
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
    <>
      {/* Floating AI Chat Assistant Trigger Bubble */}
      <button
        onClick={() => setShowAiChat(!showAiChat)}
        className="absolute right-4 bottom-[42%] md:right-[412px] md:bottom-6 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-zinc-950 flex items-center justify-center transition-all cursor-pointer shadow-lg z-30 hover:scale-105 active:scale-95 border border-white/10"
        aria-label="Toggle AI Assistant"
      >
        {showAiChat ? <X size={20} weight="bold" /> : <Robot size={22} weight="fill" />}
      </button>

      {/* Collapsible Floating AI Chat Assistant Panel */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15, scale: shouldReduceMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 15, scale: shouldReduceMotion ? 1 : 0.95 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 25 }}
            className="absolute inset-0 md:inset-auto md:right-[412px] md:bottom-20 w-full h-full md:w-[340px] md:h-[400px] bg-zinc-900/95 md:bg-zinc-900/90 backdrop-blur-xl md:border border-white/10 shadow-2xl md:rounded-2xl flex flex-col overflow-hidden z-40"
          >
            {/* AI Panel Header */}
            <div className="relative px-4 py-3 bg-zinc-950/60 border-b border-cyan-500/20 flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 z-0">
                <SparklesCore
                  background="transparent"
                  minSize={0.4}
                  maxSize={1}
                  particleDensity={150}
                  className="w-full h-full"
                  particleColor="#06b6d4"
                />
              </div>
              <div className="relative z-10 flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
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
    </>
  );
}
