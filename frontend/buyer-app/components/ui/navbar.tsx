"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Bell, User, MagnifyingGlass, Storefront, DeviceMobile, Question } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("buyer_token");
    setHasToken(!!token);
  }, [pathname]);

  if (pathname.startsWith("/live")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#050505] text-[#e0e0e0] border-b border-white/[0.04] transition-all">
      {/* Main Navbar - Grid System & Invisible Borders */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-6 h-20 md:h-24 grid grid-cols-12 items-center gap-4">
          
          {/* Brand logo - Col 1 to 3 */}
          <Link href="/" className="col-span-4 md:col-span-3 flex items-center group">
            <span className="font-sans text-[24px] md:text-[26px] tracking-[-0.05em] transition-all duration-500">
              <span className="font-light text-zinc-400 group-hover:text-white transition-colors duration-500">Live</span>
              <strong className="font-extrabold bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">Commerce</strong>
              <span className="inline-block w-1.5 h-1.5 bg-zinc-300 rounded-full ml-1 mb-1 group-hover:bg-cyan-400 transition-colors duration-500 shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:shadow-[0_0_12px_rgba(34,211,238,0.8)]"></span>
            </span>
          </Link>

          {/* Search Bar - Col 4 to 8 - Wider and more prominent line */}
          <div className="col-span-6 md:col-span-6 flex justify-center px-4 hidden md:flex">
            <div className="w-full flex items-center border-b border-[#333] hover:border-[#666] pb-2 group focus-within:border-white transition-colors duration-300 relative">
              <MagnifyingGlass size={18} weight="light" className="text-[#666] group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="Search items, streams, creators..."
                className="w-full bg-transparent border-none pl-4 pr-12 text-[14px] text-white placeholder-[#555] focus:outline-none tracking-wide"
              />
              <span className="absolute right-0 text-[10px] text-[#444] uppercase tracking-widest font-bold hidden lg:block group-focus-within:text-white transition-colors">Enter ↵</span>
            </div>
          </div>

          {/* Actions - Col 9 to 12 - Icon Driven */}
          <div className="col-span-8 md:col-span-3 flex justify-end items-center gap-6 text-zinc-400">
          
            <button className="md:hidden text-zinc-400 hover:text-white transition-colors">
               <MagnifyingGlass size={24} weight="light" />
            </button>

            {/* Seller Center */}
            <Link href="/seller-center" className="hidden lg:flex hover:text-white transition-colors group relative" aria-label="Seller Center">
              <Storefront size={24} weight="light" />
            </Link>

            {/* Download App */}
            <Link href="/download" className="hidden lg:flex hover:text-white transition-colors group relative" aria-label="Download App">
              <DeviceMobile size={24} weight="light" />
            </Link>

            {/* Notifications */}
            <button className="hover:text-white transition-colors relative group" aria-label="Notifications">
              <Bell size={24} weight="light" />
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center border-2 border-[#050505]">5</span>
            </button>

            {/* Support/Help */}
            <Link href="/help" className="hidden md:flex hover:text-white transition-colors group relative" aria-label="Support">
              <Question size={24} weight="light" />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="hover:text-white transition-colors relative group" aria-label="Cart">
              <ShoppingCart size={24} weight="light" />
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center border-2 border-[#050505]">3</span>
            </Link>

            {/* User Profile */}
            {hasToken ? (
              <Link href="/user/profile" className="hover:text-white transition-colors" aria-label="Account">
                <User size={24} weight="light" />
              </Link>
            ) : (
              <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-[#999] hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/5">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
