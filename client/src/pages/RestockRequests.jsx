import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { RestockStatusBadge } from '../components/StatusBadge.jsx';
import {
  RefreshCw,
  PackageCheck,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const RestockRequests = () => {
  const [restocks, setRestocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { hasRole } = useAuth();

  const fetchRestocks = async () => {
    try {
      const res = await api.get('/restocks');
      setRestocks(res.data);
    } catch (err) {
      console.error('Failed to fetch restocks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestocks();
  }, []);

  const handleReceiveStock = async (restockRequestId) => {
    setActionId(restockRequestId);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/restocks/${restockRequestId}/receive`);
      setMessage(res.data.message);
      fetchRestocks();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to receive stock');
    } finally {
      setActionId(null);
    }
  };

  const handleRetryRestock = async (restockRequestId) => {
    setActionId(restockRequestId);
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/restocks/${restockRequestId}/retry`);
      setMessage('Restock agent re-triggered successfully.');
      fetchRestocks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to retry restock request');
    } finally {
      setActionId(null);
    }
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Restock Workflows & Order Tracking</h1>
          <p className="text-sm text-slate-400">Track agent purchase orders, receive supplier stock, or manual retry</p>
        </div>
        <button
          onClick={fetchRestocks}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/70 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">ID</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Human Review?</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">PO Details</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {restocks.map((r) => {
                const po = r.purchaseOrder;
                const canReceive = po && po.status === 'SENT' && hasRole('ADMIN', 'MANAGER');
                const canRetry = (r.status === 'REJECTED' || r.status === 'CANCELLED') && hasRole('ADMIN', 'MANAGER');

                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono text-slate-500">#{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{r.product?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{r.product?.sku}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-400">{r.quantity} units</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">${Number(r.totalCost).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {r.requiresHumanReview ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                          YES (&gt; $1000)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          NO (Auto)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RestockStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {po ? `PO #${po.id} [${po.status}]` : 'No PO generated'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canReceive && (
                        <button
                          onClick={() => handleReceiveStock(r.id)}
                          disabled={actionId === r.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition inline-flex items-center space-x-1 disabled:opacity-50"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>{actionId === r.id ? 'Receiving...' : 'Receive Stock'}</span>
                        </button>
                      )}

                      {canRetry && (
                        <button
                          onClick={() => handleRetryRestock(r.id)}
                          disabled={actionId === r.id}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition inline-flex items-center space-x-1 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{actionId === r.id ? 'Retrying...' : 'Retry Restock'}</span>
                        </button>
                      )}

                      {!canReceive && !canRetry && (
                        <span className="text-slate-600 text-[11px] font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
