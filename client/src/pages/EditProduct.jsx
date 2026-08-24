import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api.js';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    currentStock: 0,
    safetyThreshold: 10,
    targetStock: 50,
    unitCost: 0,
    supplierName: '',
    supplierEmail: '',
    supplierPhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setFormData({
          name: res.data.name,
          description: res.data.description || '',
          sku: res.data.sku,
          currentStock: res.data.currentStock,
          safetyThreshold: res.data.safetyThreshold,
          targetStock: res.data.targetStock,
          unitCost: Number(res.data.unitCost),
          supplierName: res.data.supplierName,
          supplierEmail: res.data.supplierEmail,
          supplierPhone: res.data.supplierPhone || ''
        });
      })
      .catch(err => setError('Failed to load product details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/products/${id}`, formData);
      navigate(`/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Link to={`/products/${id}`} className="text-slate-400 hover:text-white transition text-sm flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Details</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Edit Product #{id}</h1>
          <p className="text-xs text-slate-400">Update stock parameters, thresholds, and supplier info</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Code</label>
              <input
                type="text"
                required
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Stock</label>
              <input
                type="number"
                required
                min="0"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Safety Threshold</label>
              <input
                type="number"
                required
                min="1"
                name="safetyThreshold"
                value={formData.safetyThreshold}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Stock</label>
              <input
                type="number"
                required
                min="1"
                name="targetStock"
                value={formData.targetStock}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                name="unitCost"
                value={formData.unitCost}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Name</label>
              <input
                type="text"
                required
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Email</label>
              <input
                type="email"
                required
                name="supplierEmail"
                value={formData.supplierEmail}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Phone (SMS)</label>
              <input
                type="text"
                name="supplierPhone"
                value={formData.supplierPhone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2800"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Link to={`/products/${id}`} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl">Cancel</Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
