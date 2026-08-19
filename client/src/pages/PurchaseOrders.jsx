import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { POStatusBadge } from '../components/StatusBadge.jsx';
import { FileText, RefreshCw, Mail } from 'lucide-react';

export const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Supplier Purchase Orders</h1>
          <p className="text-sm text-slate-400">Formal purchase orders generated and dispatched to suppliers</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/70 text-slate-400 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">PO ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3">Total Cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 font-mono font-bold text-blue-400">PO-{po.id}</td>
                  <td className="px-4 py-3 font-semibold text-white">{po.product?.name || `Product #${po.productId}`}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{po.supplierName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-500 inline" />
                      <span>{po.supplierEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-200">{po.quantity} units</td>
                  <td className="px-4 py-3 text-slate-300">${Number(po.unitCost).toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400">${Number(po.totalCost).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <POStatusBadge status={po.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">{new Date(po.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
