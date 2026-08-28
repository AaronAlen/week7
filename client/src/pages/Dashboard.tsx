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
  BrainCircuit
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/index.ts';
import { FormattedAiResponse } from '../components/FormattedAiResponse.tsx';

export const Dashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [products, setProducts] = useState<Product[]>([]);
  const [restocks, setRestocks] = useState<RestockRequest[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  // AI Copilot Query State
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [prodRes, restockRes, appRes, txRes, logRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<RestockRequest[]>('/restocks'),
        api.get<ApprovalItem[]>('/approvals?status=PENDING'),
        api.get<InventoryTransaction[]>('/inventory/transactions?limit=6'),
        api.get<AgentLog[]>('/agent-logs?limit=6')
      ]);
      setProducts(prodRes.data);
      setRestocks(restockRes.data);
      setApprovals(appRes.data);
      setTransactions(txRes.data);
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
      const res = await api.post('/restocks/trigger', { productId });
      setMessage(res.data.message);
      fetchData();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to trigger restock');
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
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Executive Inventory Dashboard</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 Live Telemetry
            </span>
          </h1>
          <p className="text-sm text-slate-400">Autonomous Inventory Management & Operations Analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm border border-slate-700 transition"
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{products.length}</span>
            <p className="text-xs text-slate-400 mt-1">Active Catalog Items</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lowStockProducts.length}
            </span>
            <p className="text-xs text-slate-400 mt-1">Below Safety Buffer</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${approvals.length > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
              {approvals.length}
            </span>
            <p className="text-xs text-slate-400 mt-1">Orders &gt; $1,000</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <p className="text-xs text-slate-400 mt-1">Total Valuation</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Low Stock Items & Trigger Restock */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Stock Health Status</h3>
                <p className="text-xs text-slate-400">Products requiring AI procurement evaluation</p>
              </div>
              <Link to="/products" className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium">
                <span>View Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Stock Level</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.slice(0, 6).map((p) => {
                    const isLow = p.currentStock < p.safetyThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 font-medium text-slate-200">
                          <Link to={`/products/${p.id}`} className="hover:text-blue-400 transition">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-3.5 text-slate-400 text-xs font-mono">{p.sku}</td>
                        <td className="py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${isLow ? 'text-amber-400' : 'text-slate-200'}`}>
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
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Recent Sales & Movements</h3>
                <p className="text-xs text-slate-400">Live inventory audit log stream</p>
              </div>
              <Link to="/inventory" className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium">
                <span>All Transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No recent transactions recorded.</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        tx.type === 'SALE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {tx.type === 'SALE' ? '-' : '+'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-200">
                          {tx.product?.name || `Product #${tx.productId}`}
                        </p>
                        <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleTimeString()} • {tx.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold ${tx.type === 'SALE' ? 'text-rose-400' : 'text-emerald-400'}`}>
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
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Action Required: {approvals.length} Approval(s)</h4>
              </div>
              <p className="text-xs text-slate-300 mb-4">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-bold text-white">AI Decision Trace</h3>
              </div>
              <Link to="/agent-logs" className="text-xs text-blue-400 hover:text-blue-300">
                <span>View Full Log</span>
              </Link>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No AI decisions recorded yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-blue-400 font-mono">{log.action}</span>
                      <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{log.message}</p>
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
