import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { StockStatusBadge } from '../components/StatusBadge.jsx';
import {
  ArrowDownUp,
  ShoppingCart,
  Sliders,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [sellQty, setSellQty] = useState(1);
  const [refId, setRefId] = useState('POS-ORDER-101');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const fetchData = async () => {
    try {
      const [prodRes, txRes] = await Promise.all([
        api.get('/products'),
        api.get('/inventory/transactions?limit=50')
      ]);
      setProducts(prodRes.data);
      setTransactions(txRes.data);
      if (prodRes.data.length > 0 && !selectedProduct) {
        setSelectedProduct(prodRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSale = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await api.post('/inventory/sell', {
        productId: parseInt(selectedProduct),
        quantity: parseInt(sellQty),
        referenceId: refId
      });
      setMessage(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Sale transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const activeProduct = products.find(p => p.id.toString() === selectedProduct);

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
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Inventory Control & Sales Terminal</h1>
        <p className="text-sm text-slate-400">Record sales transactions, simulate stock reductions, and audit logs</p>
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

      {/* Sales Simulation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 text-blue-400" />
          <span>Simulate Product Sale (Stock Reduction)</span>
        </h2>

        <form onSubmit={handleSale} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.currentStock}) - {p.sku}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Quantity</label>
            <input
              type="number"
              min="1"
              max={activeProduct ? activeProduct.currentStock : 999}
              value={sellQty}
              onChange={(e) => setSellQty(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reference ID</label>
            <input
              type="text"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none font-mono"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting || !activeProduct || activeProduct.currentStock < sellQty}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-rose-600/20 disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{submitting ? 'Processing...' : 'Record Sale'}</span>
            </button>
          </div>
        </form>

        {activeProduct && (
          <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div>
              Selected: <strong className="text-white">{activeProduct.name}</strong> • Current Stock: <strong className="text-blue-400">{activeProduct.currentStock}</strong> • Safety Threshold: <strong>{activeProduct.safetyThreshold}</strong>
            </div>
            <StockStatusBadge status={activeProduct.stockStatus} />
          </div>
        )}
      </div>

      {/* Inventory Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <ArrowDownUp className="w-5 h-5 text-indigo-400" />
          <span>Audit Log: Inventory Transactions Table</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/70 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Transaction Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Stock Delta</th>
                <th className="px-4 py-3 rounded-r-xl">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 font-mono text-slate-500">#{tx.id}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-white">{tx.product?.name || `Product #${tx.productId}`}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.type === 'SALE' ? 'bg-rose-500/20 text-rose-300' :
                      tx.type === 'RESTOCK' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{tx.quantity}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-300">{tx.previousStock}</span>
                    <span className="text-slate-500 px-1">→</span>
                    <span className="font-mono font-bold text-blue-400">{tx.newStock}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{tx.referenceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
