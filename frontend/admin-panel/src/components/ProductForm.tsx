import React, { useState } from "react";

export function ProductForm() {
  const [stock, setStock] = useState("0");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(stock) < 1) {
      setError("Stock allocation must be 1 unit minimum.");
    } else {
      setError("");
      // API call placeholder
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded p-6 w-full max-w-sm">
      <div className="mb-6">
        <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-950">
          Configure Flash Sale
        </h3>
        <p className="text-xs text-zinc-500 font-normal mt-1">
          Adjust stock levels prior to pushing streams live.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Label ABOVE, custom high-contrast focus rings */}
        <div className="flex flex-col gap-2">
          <label htmlFor="stock-input" className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
            Initial Stock Allocation
          </label>
          <input
            id="stock-input"
            type="number"
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              if (error) setError("");
            }}
            className={`w-full px-3 py-2 text-xs border rounded bg-white transition-all duration-200 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 ${
              error ? "border-red-500 text-red-600 focus:ring-red-500" : "border-zinc-300 text-zinc-900"
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? "stock-error" : undefined}
          />
          {error && (
            <span id="stock-error" className="text-[10px] font-mono font-medium text-red-500 uppercase tracking-wider animate-in fade-in">
              {error}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <button
            type="submit"
            className="w-full bg-zinc-950 text-white py-2 rounded text-xs font-mono uppercase tracking-widest font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] active:translate-y-[0.5px]"
          >
            Update Inventory
          </button>
        </div>
      </form>
    </div>
  );
}
