import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendUp, Users, ShoppingCart, Broadcast } from "@phosphor-icons/react";
import { buildApiUrl } from "../lib/api";

export function MetricsBentoGrid() {
  const [orders, setOrders] = useState(1482);
  const [revenue, setRevenue] = useState(44460);
  const [pulse, setPulse] = useState(false);
  const [activeViewers, setActiveViewers] = useState(0);

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
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectSSE = () => {
      setIsConnecting(true);
      setErrorMsg(null);

      // Fetch initial metrics
      fetch(buildApiUrl("/metrics/streamer"), {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load initial metrics");
        return res.json();
      })
      .then((data) => {
        setOrders(data.totalOrders || 0);
        setRevenue(data.totalRevenue || 0);
        setActiveViewers(data.activeViewers || 0);
      })
      .catch((err) => {
        console.error("Failed to fetch initial telemetry stats:", err);
        setOrders(0);
        setRevenue(0);
        setActiveViewers(0);
      });

      eventSource = new EventSource(buildApiUrl(`/sse/streamer?token=${token}`));

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
          if (payload.event === 'stock_updated') {
            // Do something or ignore
          } else if (payload.event === 'order_confirmed' || payload.totalPrice) {
            setOrders((prev) => prev + 1);
            setRevenue((prev) => prev + (payload.totalPrice || 0));
            setPulse(true);
            setTimeout(() => setPulse(false), 400);
          }
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
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [token]);

  const handleQuickAuth = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      // 1. Try to login
      const loginRes = await fetch(buildApiUrl("/auth/login"), {
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

      // 2. Register if login fails
      const registerRes = await fetch(buildApiUrl("/auth/register"), {
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
      const retryLoginRes = await fetch(buildApiUrl("/auth/login"), {
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
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error).message || "Failed to authenticate.");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("streamer_token");
    setToken(null);
    setOrders(1482); // Reset to simulated defaults
    setRevenue(44460);
    setActiveViewers(0);
  };

  return (
    <div className="w-full flex-1 p-6 md:p-10 overflow-y-auto bg-[#09090b] relative">
      {/* Background radial ambient lights for dark tech depth */}
      <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-900/60 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono tracking-[0.2em] uppercase font-bold">
            <Broadcast size={14} className="animate-pulse" />
            Telemetry Console
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 mt-1">
            Live Stream Overview
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Node-telemetry cluster monitoring "Premium Tech Flash Sale"
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
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider font-mono rounded-full">
                <span className={`w-1 h-1 rounded-full bg-emerald-500 ${isConnected ? 'animate-pulse' : ''}`}></span>
                {isConnected ? "Telemetry: Active" : "Connecting..."}
              </div>
              <button 
                onClick={handleDisconnect}
                className="px-3.5 py-1.5 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 text-[9px] font-bold font-mono uppercase rounded-full transition-all active:scale-[0.98] cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[9px] font-bold uppercase tracking-wider font-mono rounded-full">
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                Simulated Link
              </div>
              <button 
                onClick={handleQuickAuth}
                disabled={isConnecting}
                className="px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 text-[9px] font-bold uppercase tracking-wider font-mono rounded-full transition-all active:scale-[0.98] cursor-pointer"
              >
                {isConnecting ? "Connecting..." : "Sync Live Node"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Cockpit Layout: High density 1px border grid */}
      <div className="border border-zinc-900 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-900 bg-black/20 backdrop-blur-md relative z-10">
        
        {/* Metric 1: Revenue */}
        <motion.div 
          className="p-6 flex flex-col justify-between h-36 transition-colors duration-300 relative group"
          animate={{ backgroundColor: pulse ? "rgba(34, 211, 238, 0.04)" : "rgba(9, 9, 11, 0)" }}
        >
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
            <span>Total Revenue</span>
            <TrendUp size={16} className={pulse ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400 transition-colors"} weight="bold" />
          </div>
          <div className="flex flex-col gap-1 mt-4">
            <span className="text-3xl font-mono font-bold tracking-tight text-zinc-50">
              ${revenue.toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider mt-1">
              +12.4% vs last interval
            </span>
          </div>
        </motion.div>

        {/* Metric 2: Confirmed Orders */}
        <div className="p-6 flex flex-col justify-between h-36 group">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
            <span>Confirmed Orders</span>
            <ShoppingCart size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" weight="bold" />
          </div>
          <div className="flex flex-col mt-4">
            <span className="text-3xl font-mono font-bold tracking-tight text-zinc-50">
              {orders.toLocaleString()}
            </span>
            <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-wider mt-1">
              Atomic transaction queue
            </span>
          </div>
        </div>

        {/* Metric 3: Concurrent Viewers */}
        <div className="p-6 flex flex-col justify-between h-36 group">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
            <span>Active Viewers</span>
            <Users size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" weight="bold" />
          </div>
          <div className="flex flex-col mt-4">
            <span className="text-3xl font-mono font-bold tracking-tight text-zinc-50">
              {activeViewers.toLocaleString()}
            </span>
            <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase tracking-wider mt-1">
              Active socket connections
            </span>
          </div>
        </div>
      </div>
      {/* Lower Section: Telemetry Log */}
      <div className="mt-8 border border-zinc-900 rounded-2xl overflow-hidden bg-black/20 backdrop-blur-md relative z-10">
        
        <div className="px-6 py-4 border-b border-zinc-900/60 flex justify-between items-center bg-[#0c0c0e]/40">
          <div className="flex items-center gap-2">
            <Broadcast size={14} className="text-zinc-500" />
            <h3 className="text-xs font-bold font-mono tracking-widest text-zinc-400 uppercase">
              Live Telemetry Stream
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
            Node Feed Stable
          </span>
        </div>

        <div className="p-4 min-h-[140px] max-h-[400px] overflow-y-auto">
          <div className="flex flex-col gap-1">
              <div className="flex flex-col items-center justify-center h-24 text-zinc-600 font-mono text-xs gap-3 select-none">
                <span className="w-2 h-2 rounded-full bg-zinc-700 animate-ping"></span>
                <span className="uppercase tracking-widest text-[10px] font-bold text-zinc-500">
                  Awaiting incoming telemetry packets...
                </span>
              </div>
          </div>
        </div>

      </div>

    </div>
  );
}
