import { useState, useEffect } from "react";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { motion } from "motion/react";

import { Magnetic } from "@/components/ui/magnetic";
import { buildApiUrl } from "../lib/api";

interface ProductFormProps {
  selectedProductId: string | null;
  onSuccess: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isFlashSale: boolean;
}

export function ProductForm({ selectedProductId, onSuccess }: ProductFormProps) {
  const [stock, setStock] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Sync stock input when selected product changes
  useEffect(() => {
    if (!selectedProductId) {
      setStock("0");
      setError("");
      setSuccessMsg("");
      return;
    }

    setSuccessMsg("");
    setError("");

    fetch(buildApiUrl("/products"))
      .then((res) => res.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.id === selectedProductId);
        if (found) {
          setStock(found.stock.toString());
        }
      })
      .catch((err) => {
        console.error("Failed to fetch product stock:", err);
        setError("Failed to fetch current stock.");
      });
  }, [selectedProductId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Please select a product first.");
      return;
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError("Stock allocation must be 0 units minimum.");
      return;
    }

    const token = localStorage.getItem("admin_token") || localStorage.getItem("streamer_token");
    if (!token) {
      setError("Not connected. Sync Console on the grid first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(buildApiUrl(`/products/${selectedProductId}/stock`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: parsedStock }),
      });

      if (res.ok) {
        setSuccessMsg("INVENTORY SYNCED");
        onSuccess();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to sync inventory.");
      }
    } catch (err) {
      console.error("[ProductForm] Sync failed:", err);
      setError("Network error syncing inventory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="bg-white border border-zinc-200/80 rounded-2xl p-6 w-full max-w-sm shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col gap-6"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[9px] uppercase tracking-widest font-mono font-bold">
          <SlidersHorizontal size={12} weight="bold" className="text-zinc-500" />
          Stream Config
        </div>
        <h3 className="text-base font-bold tracking-tight text-zinc-950">
          Configure Flash Sale
        </h3>
        <p className="text-xs text-zinc-500 font-normal leading-relaxed">
          Adjust inventory levels prior to starting active flash sale nodes on the commerce stream.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Label ABOVE, custom focus rings */}
        <div className="flex flex-col gap-2">
          <label htmlFor="stock-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 font-mono">
            Initial Stock Allocation
          </label>
          <input
            id="stock-input"
            type="number"
            disabled={!selectedProductId || loading}
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              if (error) setError("");
            }}
            className={`w-full h-10 px-4 text-xs border rounded-full bg-white transition-all font-mono focus:outline-none focus:ring-1 ${
              error 
                ? "border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500/50" 
                : "border-zinc-200 text-zinc-900 focus:ring-zinc-950 focus:border-zinc-950/50 placeholder-zinc-400"
            } disabled:opacity-50`}
            aria-invalid={!!error}
            aria-describedby={error ? "stock-error" : undefined}
          />
          {error && (
            <span id="stock-error" className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-wider pl-1">
              {error}
            </span>
          )}
          {successMsg && (
            <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider pl-1">
              {successMsg}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Magnetic range={30}>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!selectedProductId || loading}
              className="w-full h-10 bg-zinc-950 text-white rounded-full text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Syncing..." : "Update Inventory"}
            </motion.button>
          </Magnetic>
        </div>
      </form>
    </motion.div>
  );
}
