import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  CheckSquare,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingThread, setProcessingThread] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals?status=PENDING');
      setApprovals(res.data);
    } catch (err) {
      console.error('Failed to load pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (threadId, approved) => {
    setProcessingThread(threadId);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/approve-restock', { threadId, approved });
      setMessage(res.data.message);
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit approval decision');
    } finally {
      setProcessingThread(null);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Human-in-the-Loop Approval Terminal</h1>
          <p className="text-sm text-slate-400">Review purchase orders exceeding $1000 threshold and command LangGraph workflow</p>
        </div>
        <button
          onClick={fetchApprovals}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
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

      {approvals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">No Pending Approvals</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All purchase order restock requests under $1000 have been automatically processed, and no high-value orders require human review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {approvals.map((item) => {
            const req = item.restockRequest;
            const prod = req?.product;

            return (
              <div key={item.id} className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  LANGGRAPH HITL PAUSE
                </div>

                {/* Warning Banner */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-300">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-200 text-sm">Cost Exceeds Automatic Threshold ($1,000)</h4>
                    <p className="mt-0.5 text-amber-300/80">
                      This purchase order exceeds the automatic approval limit of $1000. Administrator approval is required before Nodemailer dispatches the supplier purchase order.
                    </p>
                  </div>
                </div>

                {/* Product & Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-mono">Restock Request #{req?.id}</span>
                    <h3 className="text-lg font-bold text-white leading-snug">{prod?.name}</h3>
                    <p className="text-slate-400">SKU: <span className="font-mono text-blue-400">{prod?.sku}</span></p>
                    <div className="pt-2 text-slate-300">
                      Supplier: <strong className="text-white">{prod?.supplierName}</strong> ({prod?.supplierEmail})
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400">Current Stock</span>
                      <p className="font-bold text-amber-400 text-sm">{prod?.currentStock} units</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Safety Threshold</span>
                      <p className="font-semibold text-slate-200 text-sm">{prod?.safetyThreshold} units</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Target Stock</span>
                      <p className="font-semibold text-slate-200 text-sm">{prod?.targetStock} units</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Reorder Quantity</span>
                      <p className="font-bold text-blue-400 text-sm">{req?.quantity} units</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-700">
                      <span className="text-slate-400">Unit Cost: ${Number(prod?.unitCost).toFixed(2)}</span>
                      <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                        Total Cost: ${Number(req?.totalCost).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-500">
                    Thread ID: <span className="text-slate-400">{item.threadId}</span>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleDecision(item.threadId, false)}
                      disabled={processingThread === item.threadId}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>{processingThread === item.threadId ? 'Rejecting...' : 'Reject Order'}</span>
                    </button>

                    <button
                      onClick={() => handleDecision(item.threadId, true)}
                      disabled={processingThread === item.threadId}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{processingThread === item.threadId ? 'Resuming Agent...' : 'Approve & Send PO'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
