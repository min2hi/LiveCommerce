"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { useChat } from "@/hooks/use-chat";

interface LiveChatProps {
  roomId: string;
}

export function LiveChat({ roomId }: LiveChatProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 120, damping: 20 },
    },
  };

  const [chatMessage, setChatMessage] = useState("");
  const { messages, sendMessage } = useChat(roomId, [
    { id: 1, user: "Alice", text: "Wow, sản phẩm đẹp quá!" },
    { id: 2, user: "Bob", text: "Có chương trình giảm giá hay mã coupon gì không shop?" },
    { id: 3, user: "Charlotte", text: "Vừa đặt hàng xong, giao nhanh nha shop ơi!" },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessage(chatMessage, "You");
    setChatMessage("");
  };

  return (
    <div className="w-full h-full flex flex-col justify-end pointer-events-none">
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
            className="w-full bg-black/50 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-500 transition-all font-medium font-sans"
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
  );
}
