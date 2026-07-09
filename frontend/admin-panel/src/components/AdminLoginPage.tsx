import React, { useState } from "react";
import { Sparkle, Key, Envelope } from "@phosphor-icons/react";
import { motion } from "motion/react";

interface AdminLoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Fill in all parameters.");
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
        if (payload.role !== "ADMIN") {
          setErrorMsg("Access Denied: Insufficient authorization role.");
          return;
        }

        onLoginSuccess(data.token);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Authentication credentials rejected.");
      }
    } catch (err) {
      console.error("[Admin Login] Connection error:", err);
      setErrorMsg("Connection to auth server failed.");
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
          <div className="flex items-center gap-1.5 text-amber-500 text-[10px] uppercase tracking-widest font-mono font-bold">
            <Sparkle weight="fill" className="text-amber-500 animate-pulse" size={14} />
            Admin Control Center
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Console Sign In</h2>
          <p className="text-xs text-zinc-400">Provide admin credentials to access system telemetry.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Envelope size={12} />
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@livecommerce.com"
              className="h-11 bg-zinc-900/80 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-zinc-600 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Key size={12} />
              Master Key
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 bg-zinc-900/80 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-zinc-600 transition-all font-medium"
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
              className="w-full h-11 rounded-full font-mono text-[11px] font-bold uppercase tracking-widest bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              {loading ? "Authenticating Node..." : "Establish Access"}
            </button>
          </motion.div>
        </form>

        <div className="text-[9px] font-mono text-zinc-600 text-center uppercase tracking-wider">
          LIVECOMMERCE PLATFORM · SECURE CONSOLE
        </div>
      </motion.div>
    </div>
  );
}
