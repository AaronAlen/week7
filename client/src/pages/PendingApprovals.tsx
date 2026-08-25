import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { ApprovalItem } from '../types/index.ts';
import {
  CheckSquare,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Sparkles,
  AlertCircle,
  TrendingDown,
  Clock,
  Building2,
  DollarSign
} from 'lucide-react';

export const PendingApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingThread, setProcessingThread] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchApprovals = async () => {
    try {
      const res = await api.get<ApprovalItem[]>('/approvals?status=PENDING');
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

  const handleDecision = async (threadId: string, approved: boolean) => {
    setProcessingThread(threadId);
    setMessage('');
    setError('');

    // Optimistically remove from UI
    setApprovals(prev => prev.filter(item => item.threadId !== threadId));

    try {
      const res = await api.post('/approvals/approve', { threadId, approved });
      setMessage(res.data.message);
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit approval decision');
      fetchApprovals();
    } finally {
      setProcessingThread(null);
    }
  };

  const handleCancelApproval = async (approvalId: number) => {
    setMessage('');
    setError('');
    setApprovals(prev => prev.filter(item => item.id !== approvalId));

    try {
      const res = await api.delete(`/approvals/${approvalId}`);
      setMessage(res.data.message);
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel approval request');
      fetchApprovals();
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
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Human-in-the-Loop Approval Terminal</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ⚡ Groq AI Insights
            </span>
          </h1>
          <p className="text-sm text-slate-400">Review high-value purchase orders (&gt; $1,000) evaluated by Autonomous AI</p>
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
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Approval Queue is Clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No purchase orders currently require human review. All small batches (&le; $1,000) are handled autonomously.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {approvals.map((item) => {
            const req = item.restockRequest;
            const prod = req?.product;
            const isProcessing = processingThread === item.threadId;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden"
              >
                {/* Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase tracking-wider animate-pulse flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Approval Required (&gt; $1,000)</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">#{item.threadId}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Requested on {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Product & Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">{prod?.name || 'Product Details'}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span>SKU: <strong className="text-slate-200 font-mono">{prod?.sku}</strong></span>
                      <span>•</span>
                      <span>Supplier: <strong className="text-slate-200">{prod?.supplierName}</strong></span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase">On Hand</p>
                      <p className="text-base font-bold text-amber-400">{prod?.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase">Reorder Qty</p>
                      <p className="text-base font-bold text-blue-400">{req?.quantity}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase">Total Cost</p>
                      <p className="text-base font-bold text-emerald-400">
                        ${Number(req?.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 🤖 Groq AI Executive Insights Card */}
                <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950/80 to-slate-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Groq AI Autonomous Risk & Procurement Memo</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      Urgency: HIGH
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {req?.reason || `Stock level (${prod?.currentStock} units) is critically depleted below safety buffer (${prod?.safetyThreshold}). Procuring ${req?.quantity} units restores optimal target capacity (${prod?.targetStock}) and prevents imminent stockout.`}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleCancelApproval(item.id)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition"
                  >
                    Dismiss Request
                  </button>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleDecision(item.threadId, false)}
                      disabled={isProcessing}
                      className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Order</span>
                    </button>

                    <button
                      onClick={() => handleDecision(item.threadId, true)}
                      disabled={isProcessing}
                      className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Authorize & Dispatch PO</span>
                        </>
                      )}
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
