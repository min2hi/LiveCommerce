import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowRight } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Giỏ hàng | LiveCommerce',
};

export default function CartPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Soft Brutalist Icon Container */}
        <div className="w-32 h-32 bg-[#050505] border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,211,238,0.1)] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
          <ShoppingCart size={48} weight="light" className="text-zinc-500" />
          
          {/* Decorative Elements */}
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-400">
            0
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
          Giỏ hàng trống
        </h1>
        
        <p className="text-zinc-400 text-sm leading-relaxed mb-10 max-w-xs">
          Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các phiên Live để săn deal cực sốc ngay!
        </p>

        <Link 
          href="/" 
          className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
        >
          Khám phá ngay
          <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
