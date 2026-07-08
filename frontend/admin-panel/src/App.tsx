import { AdminSidebar } from "./components/AdminSidebar";
import { ProductDataGrid } from "./components/ProductDataGrid";
import { ProductForm } from "./components/ProductForm";

export default function App() {
  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-zinc-100 text-zinc-950 font-sans selection:bg-zinc-200">
      <AdminSidebar />
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 h-full overflow-hidden">
        {/* Main Data Grid Area */}
        <div className="flex-1 min-w-0">
          <ProductDataGrid />
        </div>
        
        {/* Right Sidebar Form Area */}
        <div className="w-full md:w-80 shrink-0 overflow-y-auto pb-6">
          <ProductForm />
        </div>
      </main>
    </div>
  );
}
