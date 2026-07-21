"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PaperPlaneRight, Sparkle, X, Robot } from "@phosphor-icons/react";
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
      text: "Xin chào! Mình là Trợ lý Mua sắm ảo. Bạn cần tư vấn thông số kỹ thuật (gõ 'specs') hay kiểm tra số lượng tồn kho (gõ 'stock') của sản phẩm này? 😊",
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
        className="absolute right-4 bottom-[42%] md:right-6 md:bottom-6 w-11 h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] z-30 border border-white/10 backdrop-blur-md"
        aria-label="Toggle AI Assistant"
      >
        {showAiChat ? <X size={18} weight="bold" /> : <Sparkle size={18} weight="fill" />}
      </button>

      {/* Collapsible Floating AI Chat Assistant Panel */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15, scale: shouldReduceMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 15, scale: shouldReduceMotion ? 1 : 0.95 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 25 }}
            className="absolute inset-0 md:inset-auto md:right-6 md:bottom-20 w-full h-full md:w-[360px] md:h-[480px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l md:border border-white/10 md:rounded-xl flex flex-col overflow-hidden z-40 shadow-2xl"
          >
            {/* AI Panel Header */}
            <div className="px-4 py-3 bg-[#050505] border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                <Sparkle size={14} weight="fill" className="text-zinc-500" />
                SYSTEM / AI_ASSISTANT
              </div>
              <button
                onClick={() => setShowAiChat(false)}
                className="text-zinc-600 hover:text-white cursor-pointer transition-colors"
                aria-label="Close panel"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* AI Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none bg-transparent">
              <div className="flex flex-col gap-4">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${msg.isAi ? "" : "justify-end"}`}
                  >
                    {msg.isAi && (
                      <div className="w-5 h-5 rounded-[4px] bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                        <Sparkle size={10} weight="fill" className="text-zinc-400" />
                      </div>
                    )}

                    <div className={`flex flex-col ${msg.isAi ? "items-start" : "items-end"}`}>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
                        {msg.isAi ? "Assistant" : "You"}
                      </span>
                      <div className={`text-[14px] leading-relaxed max-w-[260px] px-4 py-3 rounded-xl ${msg.isAi
                        ? "bg-white/5 text-zinc-300 border border-white/[0.05] rounded-tl-none"
                        : "bg-zinc-800/80 text-white border border-white/10 rounded-tr-none"
                        }`}>
                        {msg.text || (
                          <span className="flex items-center gap-1 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "150ms" }}></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "300ms" }}></span>
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
            <div className="p-3 border-t border-white/[0.05] bg-[#050505]">
              <form onSubmit={handleSendAiMessage} className="flex gap-2 relative">
                <input
                  id="ai-chat-input"
                  type="text"
                  value={aiChatMessage}
                  onChange={(e) => setAiChatMessage(e.target.value)}
                  disabled={isAiLoading}
                  className="w-full bg-transparent border border-white/10 hover:border-white/20 focus:border-white/30 rounded-md pl-3 pr-10 py-3 text-[13px] text-white focus:outline-none transition-all font-mono placeholder-zinc-600 disabled:opacity-50"
                  placeholder={isAiLoading ? "Processing..." : "Ask something..."}
                />
                <button
                  type="submit"
                  aria-label="Send query"
                  className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-white hover:bg-zinc-200 text-black rounded-sm flex items-center justify-center transition-colors active:scale-95 disabled:opacity-20 cursor-pointer"
                  disabled={!aiChatMessage.trim() || isAiLoading}
                >
                  <PaperPlaneRight size={14} weight="fill" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
