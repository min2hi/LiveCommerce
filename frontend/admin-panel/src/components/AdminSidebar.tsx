import { Database, Layout, Users, Gear, Tag } from "@phosphor-icons/react";

export function AdminSidebar() {
  const menuItems = [
    { icon: <Layout weight="bold" size={16} />, label: "Overview", active: false },
    { icon: <Database weight="bold" size={16} />, label: "Inventory", active: true },
    { icon: <Tag weight="bold" size={16} />, label: "Flash Sales", active: false },
    { icon: <Users weight="bold" size={16} />, label: "Accounts", active: false },
    { icon: <Gear weight="bold" size={16} />, label: "System", active: false },
  ];

  return (
    <aside className="w-16 md:w-56 h-[100dvh] bg-white border-r border-zinc-200/80 flex flex-col justify-between py-6 shrink-0">
      <div className="flex flex-col gap-8">
        
        {/* Brand Group */}
        <div className="px-4 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-zinc-950 flex items-center justify-center text-white font-bold text-[10px] font-mono">
            LC
          </div>
          <span className="hidden md:block font-bold text-zinc-950 text-xs uppercase tracking-widest font-mono">
            Console
          </span>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2">
          {menuItems.map((item, i) => (
            <button
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-all duration-200 w-full text-left relative focus:outline-none focus:ring-1 focus:ring-zinc-950 ${
                item.active
                  ? "text-zinc-950 font-bold"
                  : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
              }`}
            >
              {item.active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-zinc-950 rounded-full" />
              )}
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden md:block font-mono uppercase tracking-wider font-semibold">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
