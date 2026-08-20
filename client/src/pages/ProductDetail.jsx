import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { StockStatusBadge, RestockStatusBadge, POStatusBadge } from '../components/StatusBadge.jsx';
import {
  Package,
  ArrowLeft,
  RefreshCw,
  Edit,
  Upload,
  Clock,
  FileText,
  ShoppingCart,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState('');
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Failed to load product details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleTriggerRestock = async () => {
    setTriggering(true);
    setMessage('');
    try {
      const res = await api.post('/restocks/trigger', { productId: product.id });
      setMessage(res.data.message);
      fetchProduct();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to trigger restock');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Product not found.</p>
        <Link to="/products" className="text-blue-400 hover:underline mt-2 inline-block">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-400 hover:text-white transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        {hasRole('ADMIN', 'MANAGER') && (
          <Link
            to={`/products/${product.id}/edit`}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-sm border border-slate-700 transition"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Product</span>
          </Link>
        )}
      </div>

      {message && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-2xl flex items-center justify-between text-sm">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 h-48 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-12 h-12 text-slate-600" />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-blue-400 font-semibold">{product.sku}</span>
                <h1 className="text-2xl font-bold text-white tracking-tight">{product.name}</h1>
              </div>
              <StockStatusBadge status={product.stockStatus} />
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{product.description || 'No product description provided.'}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/60 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">Current Stock</span>
                <p className="text-lg font-bold text-white mt-0.5">{product.currentStock} units</p>
              </div>
              <div>
                <span className="text-slate-400">Safety Threshold</span>
                <p className="text-lg font-semibold text-slate-200 mt-0.5">{product.safetyThreshold} units</p>
              </div>
              <div>
                <span className="text-slate-400">Target Stock</span>
                <p className="text-lg font-semibold text-slate-200 mt-0.5">{product.targetStock} units</p>
              </div>
              <div>
                <span className="text-slate-400">Unit Cost</span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">${Number(product.unitCost).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400">
                Supplier: <strong className="text-slate-200">{product.supplierName}</strong> ({product.supplierEmail})
              </div>

              {product.currentStock < product.targetStock && (
                <button
                  onClick={handleTriggerRestock}
                  disabled={triggering}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
                  <span>{triggering ? 'Agent Evaluating...' : 'Trigger Restock Agent'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Restock Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            <span>Stock History</span>
          </h3>
          <div className="space-y-2">
            {product.transactions?.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No transactions recorded for this product.</p>
            ) : (
              product.transactions?.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-slate-300">{tx.type}</span>
                    <p className="text-[11px] text-slate-500">{new Date(tx.createdAt).toLocaleString()} • Ref: {tx.referenceId}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${tx.type === 'SALE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.type === 'SALE' ? '-' : '+'}{tx.quantity} units
                    </span>
                    <p className="text-[11px] text-slate-500">New: {tx.newStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Restock History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Restock Requests</span>
          </h3>
          <div className="space-y-2">
            {product.restockRequests?.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No restock requests generated.</p>
            ) : (
              product.restockRequests?.map(req => (
                <div key={req.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-slate-300">Request #{req.id} ({req.quantity} units)</span>
                    <p className="text-[11px] text-slate-500">{new Date(req.createdAt).toLocaleString()} • Total: ${Number(req.totalCost).toFixed(2)}</p>
                  </div>
                  <RestockStatusBadge status={req.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
