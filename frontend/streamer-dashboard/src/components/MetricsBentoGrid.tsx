import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendUp, Users, ShoppingCart, WarningCircle } from "@phosphor-icons/react";

export function MetricsBentoGrid() {
  const [orders, setOrders] = useState(1482);
  const [revenue, setRevenue] = useState(44460);
  const [pulse, setPulse] = useState(false);
  const [recentSales, setRecentSales] = useState<{ id: number; item: string; time: string }[]>([]);

  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("streamer_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Connect to SSE telemetry stream
  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      setIsConnecting(true);
      setErrorMsg(null);

      // Clear mockup values on real connection
      setOrders(0);
      setRevenue(0);
      setRecentSales([]);

      eventSource = new EventSource(`http://localhost:3000/api/sse/streamer?token=${token}`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setIsConnecting(false);
        eventSource?.close();
        setErrorMsg("Telemetry connection lost. Retrying in 5s...");
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };

      eventSource.addEventListener("order_confirmed", (e) => {
        try {
          const payload = JSON.parse(e.data);
          setOrders((prev) => prev + 1);
          setRevenue((prev) => prev + (payload.totalPrice || 0));
          setPulse(true);
          setTimeout(() => setPulse(false), 400);

          setRecentSales((prev) => {
            const newSale = {
              id: Date.now(),
              item: `$${payload.totalPrice} (...${payload.id.substring(payload.id.length - 6).toUpperCase()})`,
              time: new Date(payload.createdAt).toLocaleTimeString(),
            };
            return [newSale, ...prev].slice(0, 6);
          });
        } catch (parseErr) {
          console.error("Failed to parse order_confirmed payload:", parseErr);
        }
      });
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [token]);

  // Simulate SSE incoming order stream (only when no real token is present)
  useEffect(() => {
    if (token) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.45) {
        setOrders((prev) => prev + 1);
        setRevenue((prev) => prev + 299);
        setPulse(true);
        setTimeout(() => setPulse(false), 400);

        setRecentSales((prev) => {
          const newSale = { id: Date.now(), item: "Sony WH-1000XM5", time: new Date().toLocaleTimeString() };
          return [newSale, ...prev].slice(0, 6);
        });
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [token]);

  const handleQuickAuth = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      // 1. Try to login
      const loginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "streamer1@livecommerce.com", password: "password123" }),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        localStorage.setItem("streamer_token", data.token);
        setToken(data.token);
        return;
      }

      // 2. Register if login fails (likely user does not exist yet)
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
        throw new Error(regErr.error || "Failed to register default streamer.");
      }

      // 3. Retry login
      const retryLoginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "streamer1@livecommerce.com", password: "password123" }),
      });

      if (retryLoginRes.ok) {
        const data = await retryLoginRes.json();
        localStorage.setItem("streamer_token", data.token);
        setToken(data.token);
      } else {
        throw new Error("Failed to login after registering.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to authenticate.");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("streamer_token");
    setToken(null);
    setIsConnected(false);
    setOrders(1482); // Reset to simulated defaults
    setRevenue(44460);
    setRecentSales([]);
  };

  return (
    <div className="w-full flex-1 p-6 md:p-10 overflow-y-auto bg-[#09090b]">
      
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-zinc-50 uppercase">
            Live Stream Overview
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Telemetry console for "Premium Tech Flash Sale"
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {errorMsg && (
            <span className="text-[10px] font-mono text-red-500/80 uppercase">
              {errorMsg}
            </span>
          )}
          
          {token ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest font-mono rounded">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isConnected ? 'animate-pulse' : ''}`}></span>
                {isConnected ? "Telemetry: Live" : "Connecting..."}
              </div>
              <button 
                onClick={handleDisconnect}
                className="px-2.5 py-1 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 text-[10px] font-mono uppercase rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/20 border border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                Telemetry: Simulated
              </div>
              <button 
                onClick={handleQuickAuth}
                disabled={isConnecting}
                className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 text-[10px] font-bold uppercase tracking-widest font-mono rounded transition-all active:scale-[0.98]"
              >
                {isConnecting ? "Connecting..." : "Connect Live"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Cockpit Layout: High density 1px border grid, no generic background blocks */}
      <div className="border border-zinc-900 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
        
        {/* Metric 1: Revenue */}
        <motion.div 
          className="p-6 flex flex-col justify-between h-32 transition-colors duration-300 relative"
          animate={{ backgroundColor: pulse ? "rgba(34, 211, 238, 0.04)" : "rgba(9, 9, 11, 0)" }}
        >
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500">
            <span>Total Revenue</span>
            <TrendUp size={16} className={pulse ? "text-neon-accent" : "text-zinc-600"} weight="bold" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-mono font-bold tracking-tight text-zinc-50">
              ${revenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">+12.4%</span>
          </div>
        </motion.div>

        {/* Metric 2: Confirmed Orders */}
        <div className="p-6 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500">
            <span>Confirmed Orders</span>
            <ShoppingCart size={16} className="text-zinc-600" weight="bold" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-mono font-bold tracking-tight text-zinc-50">
              {orders.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 3: Concurrent Viewers */}
        <div className="p-6 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500">
            <span>Active Viewers</span>
            <Users size={16} className="text-zinc-600" weight="bold" />
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-mono font-bold tracking-tight text-zinc-50">
              12,408
            </span>
          </div>
        </div>

        {/* Metric 4: Stock Warning */}
        <div className="p-6 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500">
            <span>Inventory Alert</span>
            <WarningCircle size={16} className="text-red-500/80" weight="bold" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-red-500/90 uppercase tracking-wider">
                Sony XM5
              </span>
              <span className="text-lg font-mono font-bold text-zinc-300 mt-0.5">
                14 UNITS LEFT
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Lower Section: Telemetry Log */}
      <div className="mt-8 border border-zinc-900 rounded-lg overflow-hidden bg-[#09090b]">
        
        <div className="px-6 py-3 border-b border-zinc-900 flex justify-between items-center bg-[#0d0d11]">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Live Telemetry Stream
          </h3>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            SSE Connection Stable
          </span>
        </div>

        <div className="p-2 min-h-[220px]">
          <div className="flex flex-col gap-0.5">
            <AnimatePresence initial={false}>
              {recentSales.map((sale) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -6, backgroundColor: "rgba(34, 211, 238, 0.08)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "rgba(34, 211, 238, 0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex justify-between items-center px-4 py-2 hover:bg-zinc-900/20 transition-colors rounded"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                      Order Confirmed: {sale.item}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{sale.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {recentSales.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600 font-mono text-xs gap-2 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-ping"></span>
                <span>AWAITING INCOMING TELEMETRY...</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
