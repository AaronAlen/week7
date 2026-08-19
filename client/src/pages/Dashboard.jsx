import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { StockStatusBadge } from '../components/StatusBadge.jsx';
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
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [restocks, setRestocks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [prodRes, restockRes, appRes, txRes, logRes] = await Promise.all([
        api.get('/products'),
        api.get('/restocks'),
        api.get('/approvals?status=PENDING'),
        api.get('/inventory/transactions?limit=6'),
        api.get('/agent-logs?limit=6')
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

  const handleTriggerRestock = async (productId) => {
    setTriggeringId(productId);
    setMessage('');
    try {
      const res = await api.post('/restocks/trigger', { productId });
      setMessage(res.data.message);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to trigger restock');
    } finally {
      setTriggeringId(null);
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Inventory Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time telemetry & LangGraph agent orchestration</p>
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
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Package className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{products.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Items</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-3">{lowStockProducts.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><Clock className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-3">{approvals.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Restocks</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400"><RefreshCw className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-3">{restocks.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Value</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><DollarSign className="w-5 h-5" /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-3">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Low Stock Urgent Action Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-200">Attention Required: Low Stock Products</h2>
                <p className="text-xs text-amber-400/80">Stock levels fell below minimum safety threshold. Trigger agent restock workflow.</p>
              </div>
            </div>
            <Link to="/restocks" className="text-xs font-semibold text-amber-400 hover:underline flex items-center space-x-1">
              <span>View All Restocks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {lowStockProducts.map(p => {
              const reorderQty = p.targetStock - p.currentStock;
              const estCost = reorderQty * Number(p.unitCost);
              const isHighCost = estCost > 1000;

              return (
                <div key={p.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-slate-400">{p.sku}</span>
                      <StockStatusBadge status={p.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'} />
                    </div>
                    <h3 className="font-semibold text-white text-base leading-snug">{p.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-300">
                      <span>Stock: <strong className="text-amber-400">{p.currentStock}</strong> / {p.safetyThreshold}</span>
                      <span>Target: <strong>{p.targetStock}</strong></span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Est. Restock Cost: <strong className={isHighCost ? 'text-rose-400' : 'text-emerald-400'}>${estCost.toFixed(2)}</strong> {isHighCost ? '(Requires HITL)' : '(Auto Approval)'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleTriggerRestock(p.id)}
                    disabled={triggeringId === p.id}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${triggeringId === p.id ? 'animate-spin' : ''}`} />
                    <span>{triggeringId === p.id ? 'Agent Evaluating...' : 'Trigger Restock Agent'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid for Recent Activity Logs & Inventory Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              <span>Recent Inventory Transactions</span>
            </h3>
            <Link to="/inventory" className="text-xs text-blue-400 hover:underline">View All</Link>
          </div>

          <div className="space-y-2.5">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No recent transactions.</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{tx.product?.name || `Product #${tx.productId}`}</div>
                    <div className="text-slate-400 text-[11px]">{new Date(tx.createdAt).toLocaleString()} • Ref: {tx.referenceId}</div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${tx.type === 'SALE' ? 'text-rose-400' : tx.type === 'RESTOCK' ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {tx.type === 'SALE' ? '-' : '+'}{tx.quantity} units
                    </span>
                    <div className="text-slate-400 text-[11px]">Stock: {tx.previousStock} → {tx.newStock}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Agent Activity Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>LangGraph Agent Audit Telemetry</span>
            </h3>
            <Link to="/agent-logs" className="text-xs text-indigo-400 hover:underline">View Full Logs</Link>
          </div>

          <div className="space-y-2.5">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No agent logs recorded yet.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
