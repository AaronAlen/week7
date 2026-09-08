import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { StockStatusBadge } from '../components/StatusBadge.tsx';
import { Product, RestockRequest, ApprovalItem, InventoryTransaction, AgentLog } from '../types/index.ts';
import {
  Package,
  AlertTriangle,
  RefreshCw,
  Clock,
  DollarSign,
  ShoppingCart,
  Activity,
  ArrowRight,
  Sparkles,
  Zap,
  Send,
  TrendingUp,
  BrainCircuit,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Workflow,
  Crosshair,
  Radio,
  Check,
  ChevronRight,
  SlidersHorizontal,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/index.ts';
import { FormattedAiResponse } from '../components/FormattedAiResponse.tsx';
import { fetchProducts, triggerRestock } from '../store/slices/productsSlice.ts';
import { fetchRestockRequests } from '../store/slices/restocksSlice.ts';
import { fetchApprovals } from '../store/slices/approvalsSlice.ts';
import { fetchTransactions } from '../store/slices/inventorySlice.ts';
import { NeonSynapticThreadChart } from '../components/NeonSynapticThreadChart.tsx';

/**
 * Animated Increasing Number Counter Component
 */
const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000
}) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(startValue + (endValue - startValue) * easeOut);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
};

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const theme = useAppSelector((state) => state.theme.mode);
  const isDark = theme === 'dark';

  const products = useAppSelector((state) => state.products.items) as unknown as Product[];
  const restocks = useAppSelector((state) => state.restocks.requests) as unknown as RestockRequest[];
  const approvals = useAppSelector((state) => state.approvals.items) as unknown as ApprovalItem[];
  const transactions = useAppSelector((state) => state.inventory.transactions) as unknown as InventoryTransaction[];

  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  // AI Copilot Query State
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Active hover states for charts
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      dispatch(fetchProducts());
      dispatch(fetchRestockRequests());
      dispatch(fetchApprovals('PENDING'));
      dispatch(fetchTransactions(25));
      const logRes = await api.get<AgentLog[]>('/agent-logs?limit=6');
      setLogs(logRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerRestock = async (productId: number) => {
    setTriggeringId(productId);
    setMessage('');
    try {
      const res = await dispatch(triggerRestock(productId)).unwrap();
      setMessage(res.message || 'Restock triggered successfully');
      fetchData();
    } catch (err: any) {
      setMessage(err || 'Failed to trigger restock');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleAskAI = async (queryText?: string) => {
    const q = queryText || aiQuery;
    if (!q.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.post<{ success: boolean; answer: string }>('/chat/query', { query: q });
      if (res.data && res.data.answer) {
        setAiAnswer(res.data.answer);
      } else {
        setAiAnswer('Analysis completed but no response was returned.');
      }
    } catch (err: any) {
      const serverErr = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to analyze inventory data. Please try again.';
      setAiAnswer(`⚠️ ${serverErr}`);
    } finally {
      setAiLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.currentStock < p.safetyThreshold);
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * Number(p.unitCost)), 0);

  // Chart 1: Stock Levels vs Safety Buffer Filter
  const [stockChartFilter, setStockChartFilter] = useState<'ALL' | 'LOW_ONLY'>('ALL');

  // Theme-aware color variables
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  // Catalog Breakdown Counts
  const normalStockCount = products.filter(p => p.currentStock >= p.safetyThreshold && p.currentStock <= p.targetStock).length;
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock < p.safetyThreshold).length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;
  const surplusStockCount = products.filter(p => p.currentStock > p.targetStock).length;
  const totalCatalogItems = Math.max(1, products.length);

  // Financial Segment Valuations
  const normalStockValuation = products
    .filter(p => p.currentStock >= p.safetyThreshold && p.currentStock <= p.targetStock)
    .reduce((acc, p) => acc + (p.currentStock * Number(p.unitCost)), 0);

  const lowStockValuation = products
    .filter(p => p.currentStock > 0 && p.currentStock < p.safetyThreshold)
    .reduce((acc, p) => acc + (p.currentStock * Number(p.unitCost)), 0);

  const outOfStockLostValue = products
    .filter(p => p.currentStock === 0)
    .reduce((acc, p) => acc + (p.targetStock * Number(p.unitCost)), 0);

  const surplusStockValuation = products
    .filter(p => p.currentStock > p.targetStock)
    .reduce((acc, p) => acc + ((p.currentStock - p.targetStock) * Number(p.unitCost)), 0);

  const healthRate = Math.round(((normalStockCount + surplusStockCount) / totalCatalogItems) * 100);

  // Chart 1: Stock Levels vs Safety Buffer Data (Grouped Bar Chart)
  const stockComparisonData = React.useMemo(() => {
    let list = [...products];
    if (stockChartFilter === 'LOW_ONLY') {
      list = list.filter(p => p.currentStock < p.safetyThreshold);
    }
    return list.slice(0, 8).map(p => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
      fullName: p.name,
      sku: p.sku,
      'Current Stock': p.currentStock,
      'Safety Buffer': p.safetyThreshold,
      'Target Stock': p.targetStock,
      isLow: p.currentStock < p.safetyThreshold
    }));
  }, [products, stockChartFilter]);

  // Chart 2: Inventory Status Breakdown Data (Donut Chart)
  const donutStatusData = React.useMemo(() => {
    return [
      { name: 'Optimal Stock', value: normalStockCount, color: '#10b981', valuation: normalStockValuation },
      { name: 'Low Stock Buffer', value: lowStockCount, color: '#f59e0b', valuation: lowStockValuation },
      { name: 'Depleted / Stockout', value: outOfStockCount, color: '#ef4444', valuation: outOfStockLostValue },
      { name: 'Surplus Stock', value: surplusStockCount, color: '#8b5cf6', valuation: surplusStockValuation }
    ].filter(item => item.value > 0);
  }, [normalStockCount, lowStockCount, outOfStockCount, surplusStockCount, normalStockValuation, lowStockValuation, outOfStockLostValue, surplusStockValuation]);

  // Chart 3 (NEW): Transaction Inflow vs Outflow Velocity Dynamics
  const velocityData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [
        { label: 'Day 1', Inbound: 35, Outbound: 20, NetFlow: 15 },
        { label: 'Day 2', Inbound: 15, Outbound: 28, NetFlow: -13 },
        { label: 'Day 3', Inbound: 60, Outbound: 24, NetFlow: 36 },
        { label: 'Day 4', Inbound: 20, Outbound: 40, NetFlow: -20 },
        { label: 'Day 5', Inbound: 75, Outbound: 35, NetFlow: 40 },
        { label: 'Day 6', Inbound: 30, Outbound: 18, NetFlow: 12 },
        { label: 'Day 7', Inbound: 45, Outbound: 22, NetFlow: 23 }
      ];
    }

    const map: { [key: string]: { Inbound: number; Outbound: number } } = {};
    const sorted = [...transactions].reverse();

    sorted.forEach((tx) => {
      const d = new Date(tx.createdAt);
      const key = isNaN(d.getTime())
        ? `Tx #${tx.id}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[key]) {
        map[key] = { Inbound: 0, Outbound: 0 };
      }
      if (tx.type === 'RESTOCK') {
        map[key].Inbound += Number(tx.quantity) || 0;
      } else if (tx.type === 'SALE') {
        map[key].Outbound += Number(tx.quantity) || 0;
      } else if (tx.type === 'ADJUSTMENT') {
        if (Number(tx.newStock) > Number(tx.previousStock)) {
          map[key].Inbound += (Number(tx.newStock) - Number(tx.previousStock));
        } else {
          map[key].Outbound += (Number(tx.previousStock) - Number(tx.newStock));
        }
      }
    });

    const entries = Object.entries(map).map(([label, val]) => ({
      label,
      Inbound: val.Inbound,
      Outbound: val.Outbound,
      NetFlow: val.Inbound - val.Outbound
    }));

    if (entries.length === 1) {
      return [
        { label: 'Initial Baseline', Inbound: Math.round(entries[0].Inbound * 0.7), Outbound: Math.round(entries[0].Outbound * 0.5), NetFlow: 0 },
        ...entries
      ];
    }
    return entries.slice(-8);
  }, [transactions]);

  const totalInboundUnits = velocityData.reduce((acc, curr) => acc + curr.Inbound, 0);
  const totalOutboundUnits = velocityData.reduce((acc, curr) => acc + curr.Outbound, 0);
  const netVelocityUnits = totalInboundUnits - totalOutboundUnits;

  // Chart 4: Top 5 Inventory Assets by Valuation ($)
  const topValuationData = React.useMemo(() => {
    return [...products]
      .map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
        fullName: p.name,
        sku: p.sku,
        valuation: Math.round(p.currentStock * Number(p.unitCost)),
        units: p.currentStock,
        unitCost: Number(p.unitCost)
      }))
      .sort((a, b) => b.valuation - a.valuation)
      .slice(0, 5);
  }, [products]);

  // Executive Glass Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50 border ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700 text-white shadow-black/60' 
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
        }`}>
          <p className={`font-bold mb-1.5 border-b pb-1 flex items-center justify-between ${
            isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'
          }`}>
            <span>{payload[0]?.payload?.fullName || label}</span>
            {payload[0]?.payload?.sku && (
              <span className="font-mono text-[10px] text-slate-400 font-normal ml-2">
                {payload[0]?.payload?.sku}
              </span>
            )}
          </p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5" style={{ color: item.color || item.fill }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{item.name}:</span>
              </span>
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {typeof item.value === 'number'
                  ? item.name.includes('$') || item.name.includes('Valuation')
                    ? `$${item.value.toLocaleString()}`
                    : item.name.includes('%') || item.name.includes('Fill') || item.name.includes('Score')
                      ? `${item.value}%`
                      : `${item.value.toLocaleString()} units`
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Executive Inventory Dashboard</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              🟢 Live Telemetry
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Autonomous Inventory Management & Operations Analytics</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 transition font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-blue-600/10 border border-blue-500/30 text-blue-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* OPERATIONS INTELLIGENCE COPILOT WIDGET */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Inventory Operations Intelligence</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono font-medium border border-blue-200 dark:border-blue-800">Live Database Sync</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Query sales trends, stock shortages, inventory capital, and supplier performance</p>
            </div>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: '🔥 Fastest Moving Products', query: 'What are our fastest moving products based on recent sales transactions?' },
            { label: '⚠️ Stockout Risk Items', query: 'Which inventory items are critically close to running out of stock?' },
            { label: '💰 Inventory Capital Value', query: 'What is our total inventory valuation and how is capital distributed?' },
            { label: '📊 Health Summary', query: 'Provide a concise executive summary of our overall inventory health and procurement needs.' }
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setAiQuery(chip.query);
                handleAskAI(chip.query);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium transition flex items-center space-x-1.5 shadow-sm"
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Query Input Box */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Query inventory intelligence e.g. 'Which supplier do we spend the most with?'..."
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition shadow-inner"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={aiLoading || !aiQuery.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition flex items-center space-x-2 shadow-md shadow-blue-600/20 shrink-0"
          >
            {aiLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Analyze</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Operations Intelligence Analysis
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Live Database Telemetry
                </span>
              </div>
              <button
                onClick={() => setAiAnswer(null)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition"
              >
                Close ✕
              </button>
            </div>
            <FormattedAiResponse content={aiAnswer} />
          </div>
        )}
      </div>

      {/* Animated Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition hover:border-blue-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              <AnimatedCounter value={products.length} duration={1000} />
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active Catalog Items</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition hover:border-amber-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <AnimatedCounter value={lowStockProducts.length} duration={1000} />
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Below Safety Buffer</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition hover:border-indigo-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${approvals.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <AnimatedCounter value={approvals.length} duration={1000} />
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Orders &gt; $1,000</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden transition hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inventory Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter value={totalValue} prefix="$" decimals={2} duration={1400} />
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Asset Valuation</p>
          </div>
        </div>
      </div>

      <NeonSynapticThreadChart
        products={products}
        approvals={approvals}
        onTriggerRestock={handleTriggerRestock}
        triggeringId={triggeringId}
      />

      {/* VISUAL ANALYTICS SECTION: 4 Standard, Easy-to-Understand Inventory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Stock Levels vs Safety Buffer (Comparative Grouped Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>Stock Levels vs Safety Threshold</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparing on-hand stock quantity against minimum required safety buffer
                </p>
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  onClick={() => setStockChartFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    stockChartFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Items ({Math.min(8, products.length)})
                </button>
                <button
                  onClick={() => setStockChartFilter('LOW_ONLY')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    stockChartFilter === 'LOW_ONLY'
                      ? 'bg-rose-500 text-white shadow-sm font-bold'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <span>Below Buffer ({lowStockCount + outOfStockCount})</span>
                </button>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockComparisonData} margin={{ top: 15, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickLine={false} 
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar 
                    dataKey="Current Stock" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    name="Current Stock"
                  />
                  <Bar 
                    dataKey="Safety Buffer" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]} 
                    name="Safety Buffer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>🔵 Blue = Units on Hand</span>
            <span>🟠 Amber = Minimum Threshold Required</span>
            <Link to="/products" className="text-blue-500 hover:text-blue-600 font-medium">Manage Stock &rarr;</Link>
          </div>
        </div>

        {/* CHART 2: Inventory Status Breakdown (Classic Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-500" />
                  <span>Inventory Status Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Catalog health distribution across optimal, low buffer, and surplus items
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold font-mono">
                {healthRate}% Health
              </span>
            </div>

            <div className="h-[210px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Pie
                    data={donutStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {products.length}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  Total SKUs
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Optimal</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{normalStockCount}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${Math.round(normalStockValuation).toLocaleString()}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-semibold text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Low Buffer</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{lowStockCount}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${Math.round(lowStockValuation).toLocaleString()}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-semibold text-rose-700 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Stockout</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{outOfStockCount}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{outOfStockCount > 0 ? 'Action Needed' : 'Zero Stockouts'}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 font-semibold text-purple-700 dark:text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Surplus</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{surplusStockCount}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${Math.round(surplusStockValuation).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* CHART 3: Stock Movement: Inbound Restocks vs Sales (Smooth Area Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Stock Movement: Inbound vs Sales</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Timeline tracking supplier deliveries against customer sales over time
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>+{totalInboundUnits} Inbound</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>-{totalOutboundUnits} Sales</span>
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  netVelocityUnits >= 0
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}>
                  Net: {netVelocityUnits >= 0 ? `+${netVelocityUnits}` : netVelocityUnits}
                </span>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocityData} margin={{ top: 15, right: 15, left: -15, bottom: 10 }}>
                  <defs>
                    <linearGradient id="normalInboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="normalOutboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                  <XAxis dataKey="label" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="Inbound"
                    name="Inbound Restock (+)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#normalInboundGrad)"
                    dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1.5, stroke: isDark ? '#0f172a' : '#ffffff' }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Outbound"
                    name="Outbound Sales (-)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#normalOutboundGrad)"
                    dot={{ r: 3.5, fill: '#6366f1', strokeWidth: 1.5, stroke: isDark ? '#0f172a' : '#ffffff' }}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>🟢 Inflow replenishes warehouse stock</span>
            <span>🟣 Outflow represents POS fulfillment</span>
            <Link to="/inventory" className="text-blue-500 hover:text-blue-600 font-medium">Audit Ledger &rarr;</Link>
          </div>
        </div>

        {/* CHART 4: Top Inventory Assets by Valuation (Horizontal Bar Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-cyan-500" />
                  <span>Top Inventory Assets by Value</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Top 5 products ranked by total dollar capital in warehouse
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-xs font-bold font-mono">
                Top 5 Capital Rank
              </span>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topValuationData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 15, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke={axisColor} 
                    fontSize={11} 
                    tickLine={false} 
                    width={110}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="valuation" 
                    fill="#06b6d4" 
                    radius={[0, 6, 6, 0]} 
                    name="Valuation ($)"
                  >
                    {topValuationData.map((_, index) => (
                      <Cell 
                        key={`val-cell-${index}`} 
                        fill={['#0284c7', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'][index % 5]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Ranked by: On-Hand Units × Unit Cost</span>
            <Link to="/products" className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium">View Full Inventory &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Low Stock Items & Trigger Restock */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Stock Health Status</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Products requiring AI procurement evaluation</p>
              </div>
              <Link to="/products" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 font-medium">
                <span>View Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Stock Level</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {products.slice(0, 6).map((p) => {
                    const isLow = p.currentStock < p.safetyThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 font-medium text-slate-900 dark:text-slate-200">
                          <Link to={`/products/${p.id}`} className="hover:text-blue-500 transition">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400 text-xs font-mono">{p.sku}</td>
                        <td className="py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-200'}`}>
                              {p.currentStock}
                            </span>
                            <span className="text-xs text-slate-500">/ {p.safetyThreshold} safety</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <StockStatusBadge status={p.currentStock === 0 ? 'OUT_OF_STOCK' : isLow ? 'LOW_STOCK' : 'NORMAL'} />
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleTriggerRestock(p.id)}
                            disabled={triggeringId === p.id}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition inline-flex items-center space-x-1.5 ${
                              isLow
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-600/20'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {triggeringId === p.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                <span>Trigger AI</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Inventory Transactions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Sales & Movements</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Live inventory audit log stream</p>
              </div>
              <Link to="/inventory" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1 font-medium">
                <span>All Transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No recent transactions recorded.</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        tx.type === 'SALE' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {tx.type === 'SALE' ? '-' : '+'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200">
                          {tx.product?.name || `Product #${tx.productId}`}
                        </p>
                        <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleTimeString()} • {tx.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold ${tx.type === 'SALE' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {tx.type === 'SALE' ? `-${tx.quantity}` : `+${tx.quantity}`} units
                      </span>
                      <p className="text-[10px] text-slate-500">Stock: {tx.previousStock} &rarr; {tx.newStock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Trace Logs & Pending Approvals Widget */}
        <div className="space-y-6">
          {/* Pending Approvals Callout */}
          {approvals.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-950/60 via-white dark:via-slate-900 to-white dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Action Required: {approvals.length} Approval(s)</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                High-value restock orders (&gt; $1,000) evaluated by Groq AI require Administrator authorization.
              </p>
              <Link
                to="/pending-approvals"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/20"
              >
                <span>Review & Approve Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* AI Autonomous Activity Log */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Decision Trace</h3>
              </div>
              <Link to="/agent-logs" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                <span>View Full Log</span>
              </Link>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No AI decisions recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">{log.action}</span>
                      <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
