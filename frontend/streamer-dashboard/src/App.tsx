import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { MetricsBentoGrid } from "./components/MetricsBentoGrid";
import { StreamerLoginPage } from "./components/StreamerLoginPage";
import { Copy, CheckCircle, Lightning, Warning, Sliders } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("streamer_token"));
  const [activeTab, setActiveTab] = useState<string>("Dashboard");

  const handleLogout = () => {
    localStorage.removeItem("streamer_token");
    setToken(null);
  };

  if (!token) {
    return (
      <StreamerLoginPage
        onLoginSuccess={(newToken) => {
          localStorage.setItem("streamer_token", newToken);
          setToken(newToken);
        }}
      />
    );
  }

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-[#06b6d4]/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "Dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              <MetricsBentoGrid />
            </motion.div>
          )}

          {activeTab === "Live Rooms" && (
            <motion.div
              key="live-rooms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  Live Stream Configurations
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Broadcasting RTMP credentials and telemetry nodes.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RTMP Credentials */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 rounded-2xl flex flex-col gap-4">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">Stream Server Credentials</span>
                  
                  {[
                    { key: "RTMP Server URL", val: "rtmp://localhost:1935/live" },
                    { key: "Stream Key", val: "cc9db567-1d5e-45a2-8544-c3a098f6718f" }
                  ].map((cred, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">{cred.key}</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={cred.val} 
                          className="flex-1 bg-black/60 border border-zinc-900 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
                        />
                        <button 
                          onClick={() => navigator.clipboard.writeText(cred.val)}
                          className="px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors active:scale-95 cursor-pointer flex items-center justify-center"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* RTMP Diagnostic */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 rounded-2xl flex flex-col gap-4">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">Broadcasting Nodes</span>
                  
                  <div className="flex flex-col gap-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Stream Status</span>
                      <span className="font-bold text-[#06b6d4] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse"></span>ACTIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Active Bitrate</span>
                      <span className="font-bold text-zinc-300">4,820 kbps (Stable)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Stream Duration</span>
                      <span className="font-bold text-zinc-300">01:42:15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Resolution</span>
                      <span className="font-bold text-zinc-300">1080p60 (Source)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "Inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  Shop Inventory
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  View shop catalog and adjust active streaming stock levels directly.
                </p>
              </div>

              <StreamerInventory />
            </motion.div>
          )}

          {activeTab === "AI Agent" && (
            <motion.div
              key="ai-agent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div>
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  AI Co-host configuration
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Personalize assistant instructions and tone mapping for the buyer stream player.
                </p>
              </div>

              <StreamerAIConfig />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Sub-component: Streamer Inventory manager
function StreamerInventory() {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<number>(0);
  const token = localStorage.getItem("streamer_token");

  const fetchProducts = () => {
    fetch("http://localhost:3000/api/products")
      .then((res) => res.json())
      .then((data: any[]) => {
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
        setErrorMsg("Failed to load inventory");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (prodId: string) => {
    if (!token) {
      setErrorMsg("Sync Live Node authentication required");
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/products/${prodId}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: editingStock }),
      });
      if (!res.ok) {
        throw new Error("Failed to synchronize inventory stock");
      }
      setEditingId(null);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message || "Request failed");
    }
  };

  if (loading) {
    return <div className="text-xs font-mono text-zinc-500">Loading catalog...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {errorMsg && (
        <div className="text-[10px] font-mono text-red-500 flex items-center gap-1.5 uppercase bg-red-950/20 p-3 border border-red-900/50 rounded-xl">
          <Warning size={14} weight="bold" />
          {errorMsg}
        </div>
      )}

      <div className="bg-[#09090b] border border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left font-mono border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-zinc-900 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <th className="p-4 pl-6">Product ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Flash Mode</th>
              <th className="p-4 pr-6 text-right">Adjustment</th>
            </tr>
          </thead>
          <tbody className="text-xs text-zinc-300 divide-y divide-zinc-900">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-900/20">
                <td className="p-4 pl-6 text-zinc-600 text-[10px]">{p.id}</td>
                <td className="p-4 font-bold text-white">{p.name}</td>
                <td className="p-4 text-zinc-400">${p.price.toFixed(2)}</td>
                <td className="p-4 font-bold text-zinc-200">
                  {editingId === p.id ? (
                    <input 
                      type="number" 
                      value={editingStock}
                      onChange={(e) => setEditingStock(parseInt(e.target.value, 10) || 0)}
                      className="w-16 bg-black border border-zinc-800 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    />
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    p.isFlashSale 
                      ? "bg-red-500/10 text-red-400 border border-red-900/55" 
                      : "bg-zinc-800/10 text-zinc-500 border border-zinc-900"
                  }`}>
                    <Lightning weight="fill" size={10} className={p.isFlashSale ? "text-red-400 animate-pulse" : "text-zinc-600"} />
                    {p.isFlashSale ? "ACTIVE" : "STANDBY"}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  {editingId === p.id ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleUpdateStock(p.id)}
                        className="px-3 py-1 bg-[#06b6d4] text-zinc-950 font-bold text-[9px] uppercase rounded-lg hover:bg-[#0891b2] cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-zinc-900 text-zinc-400 text-[9px] uppercase rounded-lg hover:bg-zinc-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setEditingStock(p.stock);
                      }}
                      className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[9px] font-bold uppercase rounded-lg cursor-pointer"
                    >
                      Edit Stock
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sub-component: AI Agent Configurator
function StreamerAIConfig() {
  const [prompt, setPrompt] = useState("Bạn là trợ lý mua sắm AI hào hứng và thân thiện. Nhiệm vụ của bạn là tư vấn nhiệt tình cho người mua hàng về các thông số sản phẩm tai nghe Sony WH-1000XM5. Nhấn mạnh vào công nghệ chống ồn đỉnh cao ANC và dải âm trầm siêu dày bass.");
  const [tone, setTone] = useState("Enthusiastic");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="bg-[#09090b] border border-zinc-900 p-6 rounded-2xl flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <Sliders size={16} className="text-[#06b6d4]" />
        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Co-host Parameters</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="ai-instructions" className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">System Instructions Prompt</label>
        <textarea 
          id="ai-instructions"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full bg-black/60 border border-zinc-900 rounded-lg p-3 text-xs font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Engagement Tone</span>
        <div className="flex gap-3">
          {["Enthusiastic", "Professional", "Casual", "Urgent"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTone(item)}
              className={`px-4 py-2 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                tone === item
                  ? "bg-[#06b6d4]/10 border-[#06b6d4] text-[#06b6d4]"
                  : "bg-black/40 border-zinc-900 text-zinc-500 hover:border-zinc-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-zinc-900 pt-4">
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#06b6d4] hover:bg-[#0891b2] text-zinc-950 font-bold text-xs uppercase font-mono rounded-lg transition-colors active:scale-95 cursor-pointer"
        >
          Save Configuration
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
            <CheckCircle size={14} weight="fill" />
            Config updated successfully!
          </span>
        )}
      </div>
    </form>
  );
}
