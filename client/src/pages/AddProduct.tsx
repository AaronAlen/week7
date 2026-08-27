import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.ts';
import { ArrowLeft, Package, AlertCircle, Upload, Image as ImageIcon, X } from 'lucide-react';

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    currentStock: 20,
    safetyThreshold: 10,
    targetStock: 50,
    unitCost: 15.00,
    supplierName: '',
    supplierEmail: '',
    supplierPhone: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // 1. Create product record
      const res = await api.post<{ id: number }>('/products', formData);
      const newProductId = res.data.id;

      // 2. If an image file was selected, upload it immediately
      if (imageFile && newProductId) {
        const imgData = new FormData();
        imgData.append('image', imageFile);
        await api.post(`/products/${newProductId}/image`, imgData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Link to="/products" className="text-slate-400 hover:text-white transition text-sm flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Add New Inventory Product</h1>
          <p className="text-xs text-slate-400">Configure stock targets, reorder thresholds, supplier info, and product image</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Image Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Product Image</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center relative group">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full transition shadow"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="space-y-1">
                <label className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-xl border border-slate-700 cursor-pointer transition shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500">PNG, JPG, WebP up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ergonomic Office Chair"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none"
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
                placeholder="SKU-CHAIR-001"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the product..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none"
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
                placeholder="Global Supplies Ltd"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none"
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
                placeholder="orders@globalsupplies.com"
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none"
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
                className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Link to="/products" className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl">Cancel</Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {submitting ? 'Saving Product...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
