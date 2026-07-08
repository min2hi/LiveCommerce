import { Sidebar } from "./components/Sidebar";
import { MetricsBentoGrid } from "./components/MetricsBentoGrid";

export default function App() {
  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-neon-accent/30">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MetricsBentoGrid />
      </main>
    </div>
  );
}
