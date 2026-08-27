import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api.ts';
import { ApprovalItem } from '../types/index.ts';
import {
  CheckSquare,
  Check,
  X,
  RefreshCw,
  Sparkles,
  AlertCircle,
  DollarSign,
  Send,
  Bot,
  Mail,
  Package
} from 'lucide-react';

interface RefundItem {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productId: number | null;
  amount: string | number;
  daysSincePurchase: number;
  reason: string;
  customerMessage: string;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  isAutoApproved: boolean;
  requiresHumanReview: boolean;
  aiReasoning: string;
  customerEmailDraft: string;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
  };
}

export const PendingApprovals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'restocks' | 'refunds'>('restocks');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Customer Email Draft & Dispatch State
  const [editableDrafts, setEditableDrafts] = useState<{ [key: number]: string }>({});
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [emailSuccessId, setEmailSuccessId] = useState<number | null>(null);

  // Helper to dynamically calculate height to show full content without inner scrolling
  const getEmailRows = (text?: string) => {
    if (!text) return 7;
    const lines = text.split('\n');
    const totalLines = lines.reduce((count, line) => {
      return count + Math.max(1, Math.ceil(line.length / 75));
    }, 0);
    return Math.max(totalLines + 1, 7);
  };

  // Simulation State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simDraft, setSimDraft] = useState('');
  const [simSendingEmail, setSimSendingEmail] = useState(false);
  const [simEmailStatus, setSimEmailStatus] = useState<string | null>(null);

  const [refundForm, setRefundForm] = useState({
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    amount: 175.0,
    daysSincePurchase: 14,
    reason: 'Damaged in transit',
    customerMessage: 'The package arrived completely crushed and the keyboard switches are broken.'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, refRes] = await Promise.all([
        api.get('/approvals'),
        api.get('/refunds?status=PENDING_APPROVAL')
      ]);
      setApprovals(appRes.data || []);
      setRefunds(refRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch pending approval queues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Restock Approval Handler
  const handleRestockDecision = async (threadId: string, approved: boolean) => {
    setProcessingId(threadId);
    setMessage('');
    setError('');
    setApprovals(prev => prev.filter(item => item.threadId !== threadId));

    try {
      let res;
      try {
        res = await api.post('/approvals/approve', { threadId, approved });
      } catch (firstErr: any) {
        if (firstErr.response?.status === 404) {
          res = await api.post('/approve-restock', { threadId, approved });
        } else {
          throw firstErr;
        }
      }
      setMessage(res?.data?.message || 'Approval decision recorded successfully.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit approval decision');
      fetchData();
    } finally {
      setProcessingId(null);
    }
  };

  // Refund Decision Handler
  const handleRefundDecision = async (refundId: number, decision: 'APPROVE' | 'REJECT') => {
    setProcessingId(refundId);
    setMessage('');
    setError('');
    setRefunds(prev => prev.filter(r => r.id !== refundId));

    try {
      const res = await api.post(`/refunds/${refundId}/decide`, { decision, notes: `Human review: ${decision}` });
      setMessage(res.data?.message || `Refund #${refundId} has been ${decision.toLowerCase()}d.`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit refund decision');
      fetchData();
    } finally {
      setProcessingId(null);
    }
  };

  // Dispatch Customer Support Email via Nodemailer for Queue Items
  const handleSendCustomerEmail = async (refundId: number, customerEmail: string, customerName: string, orderNumber: string) => {
    const targetRefund = refunds.find(r => r.id === refundId);
    const content = editableDrafts[refundId] !== undefined ? editableDrafts[refundId] : targetRefund?.customerEmailDraft;
    if (!content || !content.trim()) {
      setError('Email content cannot be empty.');
      return;
    }

    setSendingEmailId(refundId);
    setMessage('');
    setError('');
    try {
      await api.post(`/refunds/${refundId}/send-email`, {
        to: customerEmail,
        customerName,
        orderNumber,
        content
      });
      setMessage(`📧 Customer support email dispatched to ${customerEmail} via Nodemailer!`);
      setEmailSuccessId(refundId);
      setTimeout(() => setEmailSuccessId(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to dispatch customer email');
    } finally {
      setSendingEmailId(null);
    }
  };

  // Run AI Customer Support Refund Simulation
  const handleSimulateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimResult(null);
    setSimEmailStatus(null);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/refunds/process', {
        ...refundForm,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`
      });
      setSimResult(res.data);
      setSimDraft(res.data?.decision?.customerEmailDraft || res.data?.refund?.customerEmailDraft || '');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to simulate refund evaluation');
    } finally {
      setSimLoading(false);
    }
  };

  // Send Email directly from Simulation Modal
  const handleSendSimEmail = async () => {
    if (!simDraft.trim()) {
      alert('Email content cannot be empty.');
      return;
    }

    setSimSendingEmail(true);
    setSimEmailStatus(null);
    try {
      const orderNum = simResult?.refund?.orderNumber || simResult?.orderNumber || 'ORD-SUPPORT';
      await api.post('/refunds/send-email', {
        to: refundForm.customerEmail,
        customerName: refundForm.customerName,
        orderNumber: orderNum,
        content: simDraft
      });
      setSimEmailStatus(`✅ Email successfully dispatched to ${refundForm.customerEmail} via Nodemailer!`);
    } catch (err: any) {
      setSimEmailStatus(`❌ Failed to send email: ${err.response?.data?.error || err.message}`);
    } finally {
      setSimSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Executive Approvals Command Center</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              🛡️ Policy Governance
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Review, audit, and authorize high-value purchase orders and exception customer return claims.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRefundModal(true)}
            className="flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-xl text-xs border border-blue-500/30 font-medium transition"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Simulate Customer Claim</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('restocks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'restocks'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Restock Approvals (&gt; $1,000)</span>
          <span className="bg-slate-900/60 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {approvals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'refunds'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Customer Refund Claims (&gt; $150)</span>
          <span className="bg-slate-900/60 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {refunds.length}
          </span>
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: RESTOCK PROCUREMENT APPROVALS */}
      {activeTab === 'restocks' && (
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <CheckSquare className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Restock Queue is Clear</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No high-value purchase orders currently awaiting authorization. Restock requests &le; $1,000 are automatically processed according to inventory replenishment policy.
              </p>
            </div>
          ) : (
            approvals.map((item) => {
              const req = item.restockRequest;
              const prod = req?.product;
              const isProcessing = processingId === item.threadId;

              return (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-semibold">
                        Executive Approval Required
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Reference: {item.threadId.substring(0, 18)}...</span>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                      <p className="text-slate-500">Product Details</p>
                      <h4 className="text-sm font-bold text-white">{prod?.name || 'Unknown Product'}</h4>
                      <div className="flex items-center space-x-2 text-slate-400 font-mono">
                        <span>SKU: {prod?.sku || 'N/A'}</span>
                        <span>•</span>
                        <span>Unit Cost: ${Number(prod?.unitCost || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-1 flex items-center space-x-3 text-slate-300">
                        <span>Current Stock: <strong className="text-rose-600 dark:text-rose-400">{prod?.currentStock ?? 0}</strong></span>
                        <span>Safety Level: <strong className="text-amber-600 dark:text-amber-400">{prod?.safetyThreshold ?? 0}</strong></span>
                        <span>Target: <strong className="text-blue-600 dark:text-blue-400">{prod?.targetStock ?? 0}</strong></span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                      <p className="text-slate-500">Procurement Order Details</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-black text-white">${Number(req?.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-slate-400 font-medium">({req?.quantity || 0} units @ ${Number(prod?.unitCost || 0).toFixed(2)})</span>
                      </div>
                      <p className="text-amber-600 dark:text-amber-400 font-medium">⚠️ Exceeds $1,000 automated spending limit</p>
                      <p className="text-slate-400 text-[11px] pt-1">
                        Supplier: <span className="text-slate-200 font-semibold">{prod?.supplierName || 'Primary Vendor'}</span> ({prod?.supplierEmail || 'N/A'})
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Automated Restock Evaluation</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {req?.reason || `Stock (${prod?.currentStock} units) is below safety threshold (${prod?.safetyThreshold}). Procuring ${req?.quantity} units restores optimal target inventory.`}
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => handleRestockDecision(item.threadId, false)}
                      disabled={isProcessing}
                      className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
                    >
                      Reject Order
                    </button>
                    <button
                      onClick={() => handleRestockDecision(item.threadId, true)}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize & Dispatch PO</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER REFUND CLAIMS */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          {refunds.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <DollarSign className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Refund Queue is Clear</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No customer refund requests currently awaiting review. Claims &le; $150 within the 30-day window are auto-approved according to policy.
              </p>
            </div>
          ) : (
            refunds.map((ref) => {
              const isProcessing = processingId === ref.id;
              return (
                <div key={ref.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-semibold">
                        Refund Request: Order #{ref.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">Claim Amount: <strong className="text-emerald-600 dark:text-emerald-400">${Number(ref.amount).toFixed(2)}</strong></span>
                    </div>
                    <span className="text-xs text-slate-500">{ref.daysSincePurchase} days elapsed since purchase</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-slate-500">Customer Details</p>
                        <p className="font-semibold text-slate-200">{ref.customerName} ({ref.customerEmail})</p>
                        <p className="text-slate-400 mt-1">Reason: <span className="text-amber-600 dark:text-amber-300 font-medium">{ref.reason}</span></p>
                      </div>
                      <div>
                        <p className="text-slate-500">Customer Message</p>
                        <p className="text-slate-300 italic">"{ref.customerMessage}"</p>
                      </div>
                    </div>

                    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 space-y-2">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Policy Evaluation & Assessment</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed">{ref.aiReasoning}</p>
                      
                      {/* Editable Email Draft Section */}
                      <div className="pt-2 border-t border-indigo-500/20 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-indigo-700 dark:text-indigo-200 flex items-center space-x-1">
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                            <span>Proposed Customer Email Draft (Editable):</span>
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">{ref.customerEmail}</span>
                        </div>
                        {(() => {
                          const currentDraft = editableDrafts[ref.id] !== undefined ? editableDrafts[ref.id] : ref.customerEmailDraft || '';
                          return (
                            <textarea
                              rows={getEmailRows(currentDraft)}
                              value={currentDraft}
                              onChange={(e) => setEditableDrafts({ ...editableDrafts, [ref.id]: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs font-mono focus:border-blue-500 outline-none leading-relaxed overflow-hidden resize-y email-draft-box shadow-inner"
                              placeholder="Edit your customer support reply before sending..."
                            />
                          );
                        })()}
                        <div className="flex items-center justify-between pt-2">
                          <div className="text-[11px] font-medium">
                            {emailSuccessId === ref.id && <span className="text-emerald-400">✅ Email dispatched to {ref.customerEmail} via Nodemailer!</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendCustomerEmail(ref.id, ref.customerEmail, ref.customerName, ref.orderNumber)}
                            disabled={sendingEmailId === ref.id}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition"
                          >
                            <Mail className={`w-3.5 h-3.5 ${sendingEmailId === ref.id ? 'animate-spin' : ''}`} />
                            <span>{sendingEmailId === ref.id ? 'Sending Mail...' : 'Send Customer Email'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => handleRefundDecision(ref.id, 'REJECT')}
                      disabled={isProcessing}
                      className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
                    >
                      Decline Refund
                    </button>
                    <button
                      onClick={() => handleRefundDecision(ref.id, 'APPROVE')}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Issue Refund</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: TEST REFUND CLAIM */}
      {showRefundModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => { setShowRefundModal(false); setSimResult(null); }}>
          <div
            className="modal-card bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <span>Simulate Customer Return Claim</span>
              </h3>
              <button
                onClick={() => { setShowRefundModal(false); setSimResult(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {simResult ? (
              /* Simulation Result & Email Dispatch View */
              <div className="space-y-4 text-xs">
                <div className={`p-3.5 rounded-xl border ${
                  simResult.isAutoApproved 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}>
                  <div className="flex items-center justify-between mb-1 font-bold text-sm">
                    <span>Decision: {simResult.isAutoApproved ? 'AUTO-APPROVED' : 'ESCALATED FOR APPROVAL'}</span>
                    <span className="font-mono text-xs">Score: {(simResult.decision?.confidenceScore || 0.95) * 100}%</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {simResult.decision?.policyExplanation || simResult.refund?.aiReasoning}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>Editable Customer Email Response:</span>
                    </label>
                    <span className="text-slate-400 font-mono text-[11px]">To: {refundForm.customerEmail}</span>
                  </div>
                  <textarea
                    rows={getEmailRows(simDraft)}
                    value={simDraft}
                    onChange={(e) => setSimDraft(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3.5 text-xs font-mono outline-none focus:border-blue-500 leading-relaxed overflow-hidden resize-y email-draft-box shadow-inner"
                    placeholder="Customer email response draft..."
                  />
                </div>

                {simEmailStatus && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
                    {simEmailStatus}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSimResult(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition"
                  >
                    ← Back to Form
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSendSimEmail}
                      disabled={simSendingEmail}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
                    >
                      <Mail className={`w-3.5 h-3.5 ${simSendingEmail ? 'animate-spin' : ''}`} />
                      <span>{simSendingEmail ? 'Dispatching Mail...' : 'Send Email via Nodemailer'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowRefundModal(false); setSimResult(null); }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Simulation Input Form */
              <form onSubmit={handleSimulateRefund} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Customer Name</label>
                    <input
                      type="text"
                      value={refundForm.customerName}
                      onChange={(e) => setRefundForm({ ...refundForm, customerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Customer Email</label>
                    <input
                      type="email"
                      value={refundForm.customerEmail}
                      onChange={(e) => setRefundForm({ ...refundForm, customerEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Claim Amount ($)</label>
                    <input
                      type="number"
                      value={refundForm.amount}
                      onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Auto-limit: &le; $150</span>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Days Since Purchase</label>
                    <input
                      type="number"
                      value={refundForm.daysSincePurchase}
                      onChange={(e) => setRefundForm({ ...refundForm, daysSincePurchase: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Standard window: &le; 30 days</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Reason</label>
                  <input
                    type="text"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Customer Full Inquiry Message</label>
                  <textarea
                    rows={3}
                    value={refundForm.customerMessage}
                    onChange={(e) => setRefundForm({ ...refundForm, customerMessage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={simLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
                  >
                    {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Evaluate Claim</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
