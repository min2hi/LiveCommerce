"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkle, User, Key, Envelope } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Canvas3DBackground } from "@/components/ui/canvas-3d-background";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role: "BUYER" }),
      });

      if (res.ok) {
        // Automatically login the user after registration
        const loginRes = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {
          const data = await loginRes.json();
          localStorage.setItem("buyer_token", data.token);
          router.push("/live/1");
        } else {
          router.push("/login");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Registration failed. Try a different email.");
      }
    } catch (err) {
      console.error("[Register] Connection failed:", err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex bg-zinc-950 text-zinc-100 relative overflow-hidden font-sans">
      
      {/* Dynamic 3D Node Mesh Background */}
      <Canvas3DBackground accent="cyan" />

      {/* Ambient Breathing Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px]"
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 30, -40, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]"
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 z-0 pointer-events-none"></div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Left Side: Creative Editorial Panel (Desktop only) */}
        <div className="hidden md:flex md:w-[45%] flex-col justify-between p-12 md:p-16">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft weight="bold" size={14} />
            Back to Home
          </Link>

          <div className="flex flex-col gap-6 max-w-[34ch]">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400 font-bold">
              Registration Portal
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-none text-white select-none">
              Deploy.<br />
              Observe.<br />
              <span className="italic font-normal text-zinc-400">Acquire.</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Create a buyer endpoint node to secure immediate priority access to live room flash sales.
            </p>
          </div>

          <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            LiveCommerce Platform - Secure Register Node
          </div>
        </div>

        {/* Right Side: Glassmorphism Register Panel */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-end md:pr-16 lg:pr-28 xl:pr-40 px-6 py-12 relative">
          
          {/* Mobile-only back button */}
          <div className="absolute top-8 left-6 md:hidden">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft weight="bold" size={14} />
              Home
            </Link>
          </div>

          <motion.div 
            className="w-full max-w-[400px] bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 20 }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase tracking-widest font-mono font-bold">
                <Sparkle weight="fill" className="text-cyan-400" size={14} />
                Deploy New Account
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Register</h2>
              <p className="text-xs text-zinc-400">Generate credentials to sync with the commerce cluster.</p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <User size={12} />
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="h-10.5 bg-zinc-900/60 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400/50 placeholder-zinc-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Envelope size={12} />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="buyer@livecommerce.com"
                  className="h-10.5 bg-zinc-900/60 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400/50 placeholder-zinc-600 transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Key size={12} />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10.5 bg-zinc-900/60 border border-white/5 rounded-full px-5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400/50 placeholder-zinc-600 transition-all font-medium"
                />
              </div>

              {errorMsg && (
                <p className="text-[10px] font-mono text-red-400 text-center uppercase tracking-wide">
                  {errorMsg}
                </p>
              )}

              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="mt-2"
              >
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-10.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-widest bg-white text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  {loading ? "Deploying Node..." : "Register Port"}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-xs text-zinc-400">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors hover:underline">
                Initialize session
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
