import React from 'react';
import Link from 'next/link';
import { User, MapPin, Receipt } from '@phosphor-icons/react/dist/ssr';
export const metadata = {
  title: 'Trung tâm người dùng | LiveCommerce',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 flex flex-col md:flex-row gap-8 md:gap-16">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-56 flex-shrink-0">
        <div className="md:sticky top-32">

          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#222]">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center font-bold">
              <User size={24} weight="bold" />
            </div>
            <div>
              <p className="text-[10px] text-[#888] font-mono uppercase tracking-widest">Account</p>
              <h2 className="text-lg font-black text-white uppercase tracking-tight truncate max-w-[120px]">Khách hàng</h2>
            </div>
          </div>

          <nav className="flex flex-col gap-1 border-l border-[#222]">
            <Link
              href="/user/profile"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#666] hover:text-white hover:bg-[#111] transition-colors border-l-2 border-transparent hover:border-white focus:border-white focus:text-white"
            >
              <User size={16} weight="bold" />
              Profile
            </Link>

            <Link
              href="/user/addresses"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#666] hover:text-white hover:bg-[#111] transition-colors border-l-2 border-transparent hover:border-white focus:border-white focus:text-white"
            >
              <MapPin size={16} weight="bold" />
              Addresses
            </Link>

            <Link
              href="/user/orders"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#666] hover:text-white hover:bg-[#111] transition-colors border-l-2 border-transparent hover:border-white focus:border-white focus:text-white"
            >
              <Receipt size={16} weight="bold" />
              Orders
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
