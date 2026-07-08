import { Lightning, Warning } from "@phosphor-icons/react";

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  status: "Active" | "Depleted" | "Draft";
}

const PRODUCTS: Product[] = [
  { id: "PROD-001", name: "Sony WH-1000XM5", price: "$299.00", stock: 14, status: "Active" },
  { id: "PROD-002", name: "Keychron Q1 Pro Mechanical", price: "$199.00", stock: 0, status: "Depleted" },
  { id: "PROD-003", name: "Herman Miller Embody", price: "$1,595.00", stock: 4, status: "Active" },
  { id: "PROD-004", name: "LG C3 OLED 42\"", price: "$899.00", stock: 8, status: "Active" },
];

export function ProductDataGrid() {
  return (
    <div className="bg-white border border-zinc-200 rounded overflow-hidden flex flex-col w-full h-full">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200/80 bg-white">
        <div>
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-950">
            Product Inventory
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            System catalogs and real-time statuses
          </p>
        </div>
        
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 text-white text-[10px] font-mono uppercase tracking-wider font-semibold rounded hover:bg-zinc-800 transition-colors active:scale-[0.98]">
          <Lightning weight="fill" size={12} className="text-yellow-400" />
          Create Flash Sale
        </button>
      </div>

      {/* Table Data View */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/50">
              <th className="py-3 px-5 text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">ID</th>
              <th className="py-3 px-5 text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">Name</th>
              <th className="py-3 px-5 text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 text-right">Price</th>
              <th className="py-3 px-5 text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 text-right">Stock</th>
              <th className="py-3 px-5 text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">Status</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-zinc-100">
            {PRODUCTS.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/30 transition-colors">
                <td className="py-3 px-5 font-mono text-[11px] text-zinc-400">{item.id}</td>
                <td className="py-3 px-5 text-xs font-bold text-zinc-900">{item.name}</td>
                <td className="py-3 px-5 text-right font-mono text-xs text-zinc-600">{item.price}</td>
                <td className="py-3 px-5 text-right">
                  <span className={`font-mono text-xs ${item.stock === 0 ? "text-red-500 font-bold flex items-center justify-end gap-1" : "text-zinc-900 font-medium"}`}>
                    {item.stock === 0 && <Warning size={12} weight="fill" className="text-red-500" />}
                    {item.stock}
                  </span>
                </td>
                <td className="py-3 px-5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 border rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                      item.status === "Active"
                        ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
                        : item.status === "Depleted"
                        ? "border-red-500/20 text-red-600 bg-red-500/5"
                        : "border-zinc-200 text-zinc-600 bg-zinc-50"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}
