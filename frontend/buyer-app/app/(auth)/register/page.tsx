"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-[100dvh] flex flex-col bg-[#fafafa] relative overflow-hidden">
      {/* Editorial layout lines */}
      <div className="absolute top-0 bottom-0 left-[8%] md:left-[12%] w-[1px] bg-zinc-200/50 hidden md:block"></div>
      
      {/* Back button */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8 pt-8 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft weight="bold" size={14} />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[400px] bg-white border border-zinc-200/60 rounded-2xl p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase tracking-widest font-mono font-bold">
              <Sparkle weight="fill" className="text-emerald-500" size={14} />
              Create Account
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Join LiveCommerce</h2>
            <p className="text-xs text-zinc-500">Sign up to buy products and chat with AI assistants instantly.</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">Username</label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="h-10 bg-zinc-50 border border-zinc-200 rounded-full px-4 text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-400 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@livecommerce.com"
                className="h-10 bg-zinc-50 border border-zinc-200 rounded-full px-4 text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-400 transition-all font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 bg-zinc-50 border border-zinc-200 rounded-full px-4 text-xs text-zinc-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-400 transition-all font-medium"
              />
            </div>

            {errorMsg && (
              <p className="text-[11px] font-mono text-red-500 text-center uppercase tracking-wide">
                {errorMsg}
              </p>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-10 rounded-full font-mono text-[11px] font-bold uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 transition-all active:scale-[0.98] cursor-pointer mt-2"
            >
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-zinc-950 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
