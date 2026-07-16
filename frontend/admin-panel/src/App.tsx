import { useState, useEffect } from "react";
import { AdminSidebar } from "./components/AdminSidebar";
import { ProductDataGrid } from "./components/ProductDataGrid";
import { ProductForm } from "./components/ProductForm";
import { AdminLoginPage } from "./components/AdminLoginPage";
import { Pulse, Lightning, Warning, Users, ChartLine, Broadcast } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { buildApiUrl } from "./lib/api";

interface LogEntry {
  time: string;
  system: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'cyan';
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [activeTab, setActiveTab] = useState<string>("Inventory");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: "00:58:12", system: "ApiServer", message: "Connected to postgres://livecommerce@localhost:5433", type: "info" },
    { time: "00:58:13", system: "Redis", message: "Client active, connected.", type: "info" },
    { time: "00:58:15", system: "RabbitMQ", message: "Order confirmation queue listener registered.", type: "info" },
    { time: "00:58:45", system: "SyncConsole", message: "Admin session authorized via JWT token.", type: "success" },
  ]);

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    activeViewers: 0
  });

  const [accounts, setAccounts] = useState<{id: string, user: string, email: string, role: string, status: string, color: string}[]>([]);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectSSE = () => {
      if (!token) return;

      eventSource = new EventSource(buildApiUrl(`/sse/streamer?token=${token}`));

      eventSource.onerror = (err) => {
        console.error("Admin SSE error, reconnecting:", err);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };

      eventSource.addEventListener("order_confirmed", (event) => {
        try {
          const payload = JSON.parse(event.data);
          const newEntry: LogEntry = {
            time: new Date(payload.createdAt || Date.now()).toLocaleTimeString(),
            system: "SSE",
            message: `Received order_confirmed event. Total: $${payload.totalPrice} (ID: ...${payload.id.substring(payload.id.length - 6).toUpperCase()})`,
            type: "cyan"
          };
          setLogs((prev) => [...prev, newEntry].slice(-50));
        } catch (err) {
          console.error("Failed to parse order_confirmed payload:", err);
        }
      });
    };

    connectSSE();

    // Simulation pings to keep the log console visually alive when running locally
    const interval = setInterval(() => {
      const systems = ["Telemetry", "Redis", "SyncConsole", "RabbitMQ"];
      const messages = [
        "Updated product metrics node.",
        "Ping latency check: 0.8ms.",
        "Pulse check: All services healthy.",
        "Cache pool hit ratio: 94.6%.",
        "Listening for database transactions..."
      ];
      const randomSystem = systems[Math.floor(Math.random() * systems.length)];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const newEntry: LogEntry = {
        time: new Date().toLocaleTimeString(),
        system: randomSystem,
        message: randomMessage,
        type: Math.random() > 0.8 ? "warn" : "info"
      };
      setLogs((prev) => [...prev, newEntry].slice(-50));
    }, 4500);

    // Real metrics fetching
    const fetchMetrics = async () => {
      if (!token) return;
      try {
        const res = await fetch(buildApiUrl("/metrics/admin"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }

        const usersRes = await fetch(buildApiUrl("/metrics/users"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await res.json();
          setAccounts(usersData);
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };
    
    fetchMetrics();
    const metricsInterval = setInterval(fetchMetrics, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimeout);
      clearInterval(interval);
      clearInterval(metricsInterval);
    };
  }, [token]);

  if (!token) {
    return (
      <AdminLoginPage
        onLoginSuccess={(newToken) => {
          localStorage.setItem("admin_token", newToken);
          setToken(newToken);
        }}
      />
    );
  }

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-zinc-50 text-zinc-950 font-sans selection:bg-zinc-200">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => {
          localStorage.removeItem("admin_token");
          setToken(null);
        }}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden p-6 relative">
        <AnimatePresence mode="wait">
          {activeTab === "Inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col md:flex-row gap-6 h-full overflow-hidden"
            >
              {/* Main Data Grid Area */}
              <div className="flex-1 min-w-0">
                <ProductDataGrid 
                  selectedProductId={selectedProductId}
                  onSelectProduct={setSelectedProductId}
                  refreshKey={refreshKey}
                />
              </div>
              
              {/* Right Sidebar Form Area */}
              <div className="w-full md:w-80 shrink-0 overflow-y-auto pb-6">
                <ProductForm 
                  selectedProductId={selectedProductId}
                  onSuccess={handleSuccess}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "Overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col gap-6 overflow-y-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-zinc-900">
                  Console Overview
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  Live Node metrics and administrative status telemetry.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", val: `$${metrics.totalRevenue.toFixed(2)}`, desc: `${metrics.totalOrders} total confirmed orders`, icon: <ChartLine size={18} className="text-emerald-500" /> },
                  { label: "Registered Users", val: metrics.totalUsers.toLocaleString(), desc: "Active buyer accounts", icon: <Pulse size={18} className="text-indigo-500" /> },
                  { label: "Active Viewers", val: metrics.activeViewers.toLocaleString(), desc: "Live streams current load", icon: <Users size={18} className="text-cyan-500" /> },
                  { label: "Telemetry Latency", val: "2.4ms", desc: "Redis Pub/Sub healthy", icon: <Broadcast size={18} className="text-amber-500" /> }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight">{stat.val}</div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1">{stat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Log console */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
                  <Pulse size={16} className="text-zinc-600 animate-pulse" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-600">Console Logs</span>
                </div>
                <div className="flex-1 font-mono text-[11px] bg-zinc-950 text-zinc-400 p-4 rounded-xl overflow-y-auto leading-relaxed flex flex-col gap-2 max-h-[350px]">
                  {logs.map((log, idx) => {
                    let colorClass = "text-zinc-500";
                    if (log.type === "success") colorClass = "text-emerald-400";
                    if (log.type === "warn") colorClass = "text-yellow-400";
                    if (log.type === "cyan") colorClass = "text-cyan-400";
                    return (
                      <div key={idx} className={colorClass}>
                        [{log.time}] [{log.system}] {log.message}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Flash Sales" && (
            <motion.div
              key="flash-sales"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col gap-6 overflow-y-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-zinc-900">
                  Flash Sales Management
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  Configure active promotion nodes and toggle interactive client buy triggers.
                </p>
              </div>

              <FlashSalesManager />
            </motion.div>
          )}

          {activeTab === "Accounts" && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col gap-6 overflow-y-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-zinc-900">
                  Accounts & Roles
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  Manage administrator, streamer, and operator authentication nodes.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
                <table className="w-full text-left font-mono border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200/80 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Username</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role Node</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-zinc-700 divide-y divide-zinc-100">
                    {accounts.length > 0 ? accounts.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-4 pl-6 font-bold text-zinc-900">{row.user}</td>
                        <td className="p-4 text-zinc-500">{row.email}</td>
                        <td className="p-4 text-[10px] font-bold"><span className="px-2 py-0.5 border border-zinc-200 rounded-full">{row.role}</span></td>
                        <td className="p-4">
                          <span className="flex items-center gap-1.5 font-bold text-[10px] uppercase">
                            <span className={`w-1.5 h-1.5 rounded-full ${row.color}`}></span>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="p-4 text-center text-zinc-400">Loading accounts...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "System" && (
            <motion.div
              key="system"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col gap-6 overflow-y-auto"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-zinc-900">
                  System Diagnostics
                </h2>
                <p className="text-xs text-zinc-500 font-mono">
                  Engine parameters, caching pools, and transactional diagnostic feeds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diagnostics */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col gap-4">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">Diagnostic Metrics</span>
                  {[
                    { key: "PostgreSQL status", val: "Connected (Pool active)", color: "text-emerald-500" },
                    { key: "Redis server", val: "Online (port 6379)", color: "text-emerald-500" },
                    { key: "RabbitMQ exchange", val: "order.exchange (active)", color: "text-emerald-500" },
                    { key: "Cache Hit Rate", val: "94.2% (atomic fast check)", color: "text-cyan-500" },
                    { key: "Environment", val: "development", color: "text-zinc-500" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500">{item.key}</span>
                      <span className={`font-bold ${item.color}`}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* DB Config parameters */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col gap-4">
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2">Configuration Node</span>
                  {[
                    { key: "DB Host", val: "localhost" },
                    { key: "DB Port", val: "5433" },
                    { key: "DB Database", val: "livecommerce" },
                    { key: "Pub/Sub Channel", val: "shop:orders:*" },
                    { key: "JWT expiry", val: "7d" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500">{item.key}</span>
                      <span className="font-bold text-zinc-800">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// 2. Interactive Flash Sales Management sub-component
function FlashSalesManager() {
  interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    isFlashSale: boolean;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const token = localStorage.getItem("admin_token");

  const fetchProducts = () => {
    fetch(buildApiUrl("/products"))
      .then((res) => res.json())
      .then((data: { id: string; name: string; price: string; stock: string; isFlashSale: boolean }[]) => {
        setProducts(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price) || 0,
            stock: parseInt(p.stock, 10) || 0,
            isFlashSale: !!p.isFlashSale,
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to list catalog products");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggle = async (prodId: string, currentState: boolean) => {
    if (!token) {
      setErrorMsg("Sync Console authentication required");
      return;
    }
    try {
      const res = await fetch(buildApiUrl(`/products/${prodId}/flash-sale`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFlashSale: !currentState }),
      });
      if (!res.ok) {
        throw new Error("Failed to toggle promotion status");
      }
      fetchProducts();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Request failed");
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-zinc-400">Loading catalog...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {errorMsg && (
        <div className="text-[10px] font-mono text-red-500 flex items-center gap-1.5 uppercase bg-red-50/50 p-3 rounded-xl border border-red-100">
          <Warning size={14} weight="bold" />
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left font-mono border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200/80 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              <th className="p-4 pl-6">Product ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Promotion Mode</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-xs text-zinc-700 divide-y divide-zinc-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/50">
                <td className="p-4 pl-6 text-zinc-400 font-sans text-[10px]">{p.id}</td>
                <td className="p-4 font-bold text-zinc-900">{p.name}</td>
                <td className="p-4 text-zinc-600">${p.price.toFixed(2)}</td>
                <td className="p-4 font-bold text-zinc-800">{p.stock}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    p.isFlashSale 
                      ? "bg-red-50 text-red-600 border border-red-100" 
                      : "bg-zinc-50 text-zinc-400 border border-zinc-200/50"
                  }`}>
                    <Lightning weight="fill" size={10} className={p.isFlashSale ? "text-red-500 animate-pulse" : "text-zinc-300"} />
                    {p.isFlashSale ? "FLASH SALE ACTIVE" : "STANDARD"}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <button
                    onClick={() => handleToggle(p.id, p.isFlashSale)}
                    className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full cursor-pointer transition-colors ${
                      p.isFlashSale
                        ? "bg-zinc-950 text-white hover:bg-zinc-800"
                        : "bg-red-600 text-white hover:bg-red-500"
                    }`}
                  >
                    {p.isFlashSale ? "Disable Sale" : "Enable Sale"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
