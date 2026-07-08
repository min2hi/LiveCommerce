import { Storefront, ChartLineUp, Package, ChatCircle, SignOut } from "@phosphor-icons/react";

export function Sidebar() {
  const menuItems = [
    { icon: <ChartLineUp weight="bold" size={18} />, label: "Dashboard", active: true },
    { icon: <Storefront weight="bold" size={18} />, label: "Live Rooms", active: false },
    { icon: <Package weight="bold" size={18} />, label: "Inventory", active: false },
    { icon: <ChatCircle weight="bold" size={18} />, label: "AI Agent", active: false },
  ];

  return (
    <aside className="w-16 md:w-60 h-[100dvh] bg-[#09090b] border-r border-zinc-900/60 flex flex-col justify-between py-6 shrink-0 transition-all duration-300">
      <div className="flex flex-col gap-10">
        
        {/* Brand Group */}
        <div className="px-4 md:px-6 flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-zinc-50 flex items-center justify-center text-zinc-950 font-bold text-[11px] font-mono tracking-tighter">
            LC
          </div>
          <span className="hidden md:block font-bold text-zinc-100 tracking-tight text-sm uppercase font-mono">
            Cockpit
          </span>
        </div>
        
        {/* Navigation - Restyled to avoid standard full-color block shapes */}
        <nav className="flex flex-col gap-1 px-3">
          {menuItems.map((item, i) => (
            <button
              key={i}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 w-full text-left relative focus:outline-none ${
                item.active
                  ? "text-neon-accent font-semibold"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30"
              }`}
            >
              {/* Refined vertical bar to indicate active state cleanly */}
              {item.active && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-neon-accent rounded-full" />
              )}
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden md:block text-xs uppercase tracking-wider font-mono font-medium">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="px-3">
        <button className="flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 w-full text-left text-zinc-600 hover:text-zinc-200 hover:bg-zinc-900/30">
          <SignOut weight="bold" size={18} className="shrink-0" />
          <span className="hidden md:block text-xs uppercase tracking-wider font-mono font-medium">
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}
