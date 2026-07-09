import React, { useState } from "react";
import { Sparkle, Key, Envelope } from "@phosphor-icons/react";
import { motion } from "motion/react";

interface StreamerLoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export function StreamerLoginPage({ onLoginSuccess }: StreamerLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("All parameters are required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Decode token to verify role
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        if (payload.role !== "STREAMER") {
          setErrorMsg("Access Denied: Account does not possess streamer role.");
          return;
        }

        onLoginSuccess(data.token);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Authentication parameters rejected.");
      }
    } catch (err) {
      console.error("[Streamer Login] Connection error:", err);
      setErrorMsg("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 relative overflow-hidden font-sans w-full">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 z-0 pointer-events-none"></div>

      <motion.div
        className="w-full max-w-[400px] bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl flex flex-col gap-8 z-10"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] uppercase tracking-widest font-mono font-bold">
            <Sparkle weight="fill" className="text-cyan-400 animate-pulse" size={14} />
            Streamer Control Cockpit
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Streamer Login</h2>
          <p className="text-xs text-zinc-400">Establish connection session using your streaming port.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Envelope size={12} />
              Streamer Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="streamer@livecommerce.com"
              className="h-11 bg-zinc-900/80 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 placeholder-zinc-600 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Key size={12} />
              Secret Passkey
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 bg-zinc-900/80 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 placeholder-zinc-600 transition-all font-medium"
            />
          </div>

          {errorMsg && (
            <p className="text-[10px] font-mono text-red-400 text-center uppercase tracking-wide">
              {errorMsg}
            </p>
          )}

          <motion.div
            whileTap={{ scale: 0.98 }}
            className="mt-2"
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full font-mono text-[11px] font-bold uppercase tracking-widest bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              {loading ? "Establishing Node..." : "Initiate Cockpit"}
            </button>
          </motion.div>
        </form>

        <div className="text-[9px] font-mono text-zinc-600 text-center uppercase tracking-wider">
          LIVECOMMERCE PLATFORM · SECURE STREAMER ENGINE
        </div>
      </motion.div>
    </div>
  );
}
