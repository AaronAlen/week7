import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StockStatusBadge } from '../components/StatusBadge.tsx';
import { Product } from '../types/index.ts';
import {
  Package,
  Plus,
  Search,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.tsx';
import { getImageUrl } from '../utils/imageUrl.ts';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const { hasRole } = useAuth();
  const socket = useSocket();

  const fetchProducts = async () => {
    try {
      const res = await api.get<Product[]>('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (socket) {
      socket.on('data_updated', fetchProducts);
      return () => { socket.off('data_updated', fetchProducts); };
    }
  }, [socket]);

  const handleImageUpload = async (productId: number) => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      await api.post(`/products/${productId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Product image uploaded successfully!');
      setSelectedFile(null);
      setUploadingId(null);
      fetchProducts();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Image upload failed');
    }
  };

  const handleTriggerRestock = async (productId: number) => {
    setTriggeringId(productId);
    setMessage('');
    try {
      const res = await api.post('/restocks/trigger', { productId });
      setMessage(res.data.message);
      fetchProducts();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to trigger restock');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setMessage(`Product '${name}' deleted.`);
      fetchProducts();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Product Catalog & Stock Management</h1>
          <p className="text-sm text-slate-400">View and manage inventory products, costs, and thresholds</p>
        </div>

        {hasRole('ADMIN', 'MANAGER') && (
          <Link
            to="/products/new"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        )}
      </div>

      {message && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-2xl flex items-center justify-between text-sm">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex items-center space-x-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or supplier..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          const isLow = p.currentStock < p.safetyThreshold;
          return (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.image ? (
                      <img src={getImageUrl(p.image) || ''} alt={p.name} className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <StockStatusBadge status={p.currentStock === 0 ? 'OUT_OF_STOCK' : isLow ? 'LOW_STOCK' : 'NORMAL'} />
                </div>

                <div>
                  <span className="text-xs font-mono text-blue-400 font-semibold">{p.sku}</span>
                  <h3 className="text-lg font-bold text-white leading-snug">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400">Current Stock:</span>
                    <p className="font-bold text-white text-sm">{p.currentStock} units</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Safety Threshold:</span>
                    <p className="font-semibold text-slate-300 text-sm">{p.safetyThreshold} units</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Stock:</span>
                    <p className="font-semibold text-slate-300 text-sm">{p.targetStock} units</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Unit Cost:</span>
                    <p className="font-bold text-emerald-400 text-sm">${Number(p.unitCost).toFixed(2)}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 pt-1">
                  Supplier: <strong className="text-slate-300">{p.supplierName}</strong> ({p.supplierEmail})
                  {p.supplierPhone && (
                    <span className="block text-[11px] text-slate-500 font-mono mt-0.5">📞 {p.supplierPhone}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                {p.currentStock < p.targetStock && (
                  <button
                    onClick={() => handleTriggerRestock(p.id)}
                    disabled={triggeringId === p.id}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${triggeringId === p.id ? 'animate-spin' : ''}`} />
                    <span>{triggeringId === p.id ? 'Evaluating Workflow...' : 'Trigger Restock Agent'}</span>
                  </button>
                )}

                {uploadingId === p.id ? (
                  <div className="bg-slate-800 p-2.5 rounded-xl space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e: any) => setSelectedFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-blue-600 file:text-white"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleImageUpload(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setUploadingId(null)}
                        className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between text-xs pt-1">
                  <Link to={`/products/${p.id}`} className="text-blue-400 hover:underline flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </Link>

                  {hasRole('ADMIN', 'MANAGER') && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setUploadingId(p.id)}
                        className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                        title="Upload Image"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Image</span>
                      </button>
                      <Link to={`/products/${p.id}/edit`} className="text-slate-400 hover:text-slate-200">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      {hasRole('ADMIN') && (
                        <button onClick={() => handleDelete(p.id, p.name)} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
