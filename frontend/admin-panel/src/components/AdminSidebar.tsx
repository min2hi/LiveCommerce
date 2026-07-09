"use client";

import { Database, Layout, Users, Gear, Tag } from "@phosphor-icons/react";
import { motion } from "motion/react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

export function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { icon: <Layout weight="bold" size={15} />, label: "Overview" },
    { icon: <Database weight="bold" size={15} />, label: "Inventory" },
    { icon: <Tag weight="bold" size={15} />, label: "Flash Sales" },
    { icon: <Users weight="bold" size={15} />, label: "Accounts" },
    { icon: <Gear weight="bold" size={15} />, label: "System" },
  ];

  return (
    <aside className="w-16 md:w-56 h-[100dvh] bg-white border-r border-zinc-200/80 flex flex-col justify-between py-6 shrink-0 z-20">
      <div className="flex flex-col gap-10">
        
        {/* Brand Group */}
        <div className="px-5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-zinc-950 flex items-center justify-center text-white font-bold text-[10px] font-mono shadow-sm">
            LC
          </div>
          <span className="hidden md:block font-bold text-zinc-950 text-xs uppercase tracking-widest font-mono">
            Console
          </span>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {menuItems.map((item, i) => {
            const isActive = activeTab === item.label;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange(item.label)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-xs transition-all w-full text-left relative focus:outline-none cursor-pointer ${
                  isActive
                    ? "text-zinc-950 font-bold bg-zinc-50"
                    : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {isActive && (
                  <motion.span 
                    className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-950 rounded-full" 
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden md:block font-mono uppercase tracking-wider font-bold text-[10px]">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {onLogout && (
        <div className="px-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-full text-xs text-red-500 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left focus:outline-none cursor-pointer"
          >
            <span className="shrink-0">🚪</span>
            <span className="hidden md:block font-mono uppercase tracking-wider font-bold text-[10px]">
              Logout
            </span>
          </motion.button>
        </div>
      )}
    </aside>
  );
}
