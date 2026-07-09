import { useState, useEffect } from "react";
import { Lightning, Warning, MagnifyingGlass, Broadcast } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  status: "Active" | "Depleted" | "Draft";
}

interface BackendProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  isFlashSale: boolean;
}

interface ProductDataGridProps {
  selectedProductId: string | null;
  onSelectProduct: (id: string | null) => void;
  refreshKey: number;
}

export function ProductDataGrid({ selectedProductId, onSelectProduct, refreshKey }: ProductDataGridProps) {
  const [filter, setFilter] = useState<"All" | "Active" | "Depleted">("All");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync token state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token") || localStorage.getItem("streamer_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch products from backend
  const fetchProducts = () => {
    fetch("http://localhost:3000/api/products")
      .then((res) => res.json())
      .then((data: BackendProduct[]) => {
        const mapped: Product[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          price: `$${p.price.toFixed(2)}`,
          stock: p.stock,
          status: p.stock === 0 ? "Depleted" : p.isFlashSale ? "Active" : "Draft",
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshKey, token]);

  const handleQuickAuth = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const loginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "streamer1@livecommerce.com", password: "password123" }),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
        return;
      }

      const registerRes = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "streamer1",
          email: "streamer1@livecommerce.com",
          password: "password123",
          role: "streamer",
        }),
      });

      if (!registerRes.ok) {
        const regErr = await registerRes.json();
        throw new Error(regErr.error || "Failed to register streamer.");
      }

      const retryLoginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "streamer1@livecommerce.com", password: "password123" }),
      });

      if (retryLoginRes.ok) {
        const data = await retryLoginRes.json();
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
      } else {
        throw new Error("Authentication failed after registration.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to authenticate console.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    onSelectProduct(null);
  };

  const handleToggleFlashSale = async () => {
    if (!selectedProductId) return;
    if (!token) {
      setErrorMsg("Please sync console first.");
      return;
    }

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    if (!selectedProduct) return;

    // If stock is 0, we can't toggle active flash sale
    const willBeActive = selectedProduct.status !== "Active";

    try {
      const res = await fetch(`http://localhost:3000/api/products/${selectedProductId}/flash-sale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ isFlashSale: willBeActive }),
      });

      if (res.ok) {
        fetchProducts();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || "Failed to toggle flash sale.");
      }
    } catch (err) {
      console.error("Failed to toggle flash sale:", err);
      setErrorMsg("Network error toggling flash sale.");
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesFilter = filter === "All" || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex flex-col w-full h-full shadow-[0_5px_20px_rgba(0,0,0,0.02)]">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 p-6 border-b border-zinc-100 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400">
              Control Panel
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950 mt-1">
              Product Inventory
            </h2>
            <p className="text-xs text-zinc-500 font-normal mt-0.5">
              System catalogs, pricing matrices, and real-time node statuses.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleFlashSale}
                  disabled={!selectedProductId}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-950 text-white text-[10px] font-mono uppercase tracking-widest font-bold rounded-full hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Lightning weight="fill" size={12} className="text-yellow-400" />
                  Toggle Flash Sale
                </button>
                <button 
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 border border-zinc-200 hover:border-red-200 text-zinc-500 hover:text-red-500 text-[9px] font-bold font-mono uppercase rounded-full transition-all active:scale-[0.98] cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={handleQuickAuth}
                disabled={isConnecting}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 text-[9px] font-bold uppercase tracking-wider font-mono rounded-full transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <Broadcast size={11} className={isConnecting ? "animate-spin" : ""} />
                {isConnecting ? "Syncing..." : "Sync Console"}
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="text-[10px] font-mono text-red-500 flex items-center gap-1.5 uppercase pl-1">
            <Warning size={14} weight="bold" />
            {errorMsg}
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2 pt-2 border-t border-zinc-50">
          <div className="flex bg-zinc-100 p-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 w-full sm:w-auto">
            {(["All", "Active", "Depleted"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "hover:text-zinc-950"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <MagnifyingGlass size={13} weight="bold" />
            </span>
            <input
              type="text"
              placeholder="Search product ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Data View */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="py-3 px-6 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-400">ID</th>
              <th className="py-3 px-6 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-400">Name</th>
              <th className="py-3 px-6 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-400 text-right">Price</th>
              <th className="py-3 px-6 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-400 text-right">Stock</th>
              <th className="py-3 px-6 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-400">Status</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-zinc-50">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelectProduct(item.id)}
                  className={`hover:bg-zinc-50/40 transition-colors group cursor-pointer ${
                    selectedProductId === item.id ? "bg-zinc-50/80 border-l-2 border-zinc-950" : ""
                  }`}
                >
                  <td className="py-3.5 px-6 font-mono text-[11px] text-zinc-400 font-medium">{item.id}</td>
                  <td className="py-3.5 px-6 text-xs font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono text-xs text-zinc-600 font-semibold">{item.price}</td>
                  <td className="py-3.5 px-6 text-right">
                    <span className={`font-mono text-xs ${item.stock === 0 ? "text-red-500 font-bold flex items-center justify-end gap-1" : "text-zinc-900 font-semibold"}`}>
                      {item.stock === 0 && <Warning size={12} weight="fill" className="text-red-500" />}
                      {item.stock}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${
                        item.status === "Active"
                          ? "border-emerald-500/10 text-emerald-600 bg-emerald-500/5"
                          : item.status === "Depleted"
                          ? "border-red-500/10 text-red-600 bg-red-500/5"
                          : "border-zinc-200 text-zinc-500 bg-zinc-100"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center font-mono text-xs text-zinc-400 select-none">
                  NO PRODUCTS MATCH THE FILTER PARAMETERS.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
}
