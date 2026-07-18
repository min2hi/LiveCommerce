"use client";

import React, { useEffect } from "react";
import useSWR from "swr";
import { 
  User, Wallet, Ticket, Clock, Star, 
  Package, Truck, Receipt, CreditCard, Warning,
  VideoCamera, Heart, CaretRight, ShieldCheck
} from "@phosphor-icons/react";
import { buildApiUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem("buyer_token");
  if (!token) throw new Error("No token found");
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch user data");
  }
  return res.json();
};

export default function UserProfilePage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<UserProfile>(
    buildApiUrl("/users/profile"),
    fetcher
  );

  useEffect(() => {
    if (error?.message === "No token found" || error?.message === "Unauthorized") {
      router.push("/auth/login");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 w-full">
        <div className="h-32 bg-white/5 rounded-2xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-40 bg-white/5 rounded-2xl"></div>
          <div className="lg:col-span-4 h-40 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-red-900 bg-red-950/20 p-6 flex items-center gap-4 text-red-500 rounded-2xl">
        <Warning size={24} weight="bold" />
        <span className="text-sm font-bold uppercase tracking-widest">Failed to load profile</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =========================================
            LEFT COLUMN (Identity & Main Dashboards) 
            lg:col-span-8 (approx 66% width)
            ========================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* 1. User Identity Header (Compact) */}
          <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-6 flex items-center gap-6 shadow-sm relative overflow-hidden group hover:border-white/10 transition-colors">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex-shrink-0 flex items-center justify-center text-3xl font-black text-white shadow-xl">
              {data.username.charAt(0).toUpperCase()}
            </div>

            {/* Info & Stats */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight mb-1">{data.username}</h1>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-mono text-zinc-400">{data.email}</p>
                  <div className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full">
                    <ShieldCheck size={12} weight="fill" />
                    Verified
                  </div>
                </div>
              </div>

              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-lg font-bold text-white">124</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Following</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">12</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Followers</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Order Dashboard (Compact & Centered) */}
          <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-6 shadow-sm hover:border-white/10 transition-colors">
            <div className="flex justify-between items-end mb-6 pb-4 border-b border-white/[0.05]">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Đơn hàng của tôi</h2>
                <p className="text-xs text-zinc-500 mt-1">Theo dõi và quản lý giao dịch</p>
              </div>
              <Link href="/user/orders" className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors group">
                Xem lịch sử <CaretRight size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Icons container with justify-around to prevent stretching */}
            <div className="flex items-center justify-around px-2 md:px-10">
              <Link href="/user/orders?tab=to-pay" className="flex flex-col items-center gap-3 group">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <CreditCard size={28} weight="light" />
                  </div>
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#0a0a0a]">1</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 group-hover:text-white transition-colors text-center">Chờ thanh toán</span>
              </Link>
              
              <Link href="/user/orders?tab=to-ship" className="flex flex-col items-center gap-3 group">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <Package size={28} weight="light" />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 group-hover:text-white transition-colors text-center">Chờ lấy hàng</span>
              </Link>

              <Link href="/user/orders?tab=to-receive" className="flex flex-col items-center gap-3 group">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <Truck size={28} weight="light" />
                  </div>
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#0a0a0a]">2</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 group-hover:text-white transition-colors text-center">Đang giao</span>
              </Link>

              <Link href="/user/orders?tab=completed" className="flex flex-col items-center gap-3 group">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <Star size={28} weight="light" />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 group-hover:text-white transition-colors text-center">Đánh giá</span>
              </Link>
            </div>
          </div>
          
        </div>


        {/* =========================================
            RIGHT COLUMN (Assets & Live Utilities) 
            lg:col-span-4 (approx 33% width)
            ========================================= */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Wallet - Featured slightly taller */}
          <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wallet size={24} weight="light" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-500 mb-1">Ví LiveCommerce</p>
                <p className="text-xl font-bold text-white tracking-tight">1,500 <span className="text-sm font-medium text-zinc-400">Xu</span></p>
              </div>
            </div>
            <CaretRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>

          {/* Vouchers */}
          <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 flex items-center justify-center">
                <Ticket size={20} weight="light" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-500 mb-0.5">Kho Voucher</p>
                <p className="text-lg font-bold text-white tracking-tight">8 <span className="text-xs font-medium text-zinc-400">Mã giảm giá</span></p>
              </div>
            </div>
            <CaretRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>

          {/* Followed Channels */}
          <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 flex items-center justify-center">
                <Heart size={20} weight="light" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-500 mb-0.5">Kênh Theo Dõi</p>
                <p className="text-base font-bold text-white">45 Kênh</p>
              </div>
            </div>
            <CaretRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>

          {/* Watch History */}
          <div className="border border-white/5 bg-[#0a0a0a] rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 flex items-center justify-center">
                <VideoCamera size={20} weight="light" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-500 mb-0.5">Lịch sử xem Live</p>
                <p className="text-base font-bold text-white">128 Phiên</p>
              </div>
            </div>
            <CaretRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
          </div>

        </div>

      </div>

      {/* 4. Account Meta (Cleaned up at the very bottom) */}
      <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest pt-8 mt-8 border-t border-white/[0.02]">
        <span className="flex items-center gap-1.5"><Clock size={14} /> Member since: {new Date(data.createdAt).getFullYear()}</span>
        <span>•</span>
        <span>Role: {data.role}</span>
      </div>

    </div>
  );
}
