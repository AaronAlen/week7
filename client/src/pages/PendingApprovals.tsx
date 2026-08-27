import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  ShieldAlert,
  DollarSign,
  Send,
  Lock,
  Unlock,
  Bot,
  Mail,
  HelpCircle,
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

interface FraudAlertItem {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productId: number | null;
  quantity: number;
  totalAmount: string | number;
  riskScore: string | number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  aiExplanation: string;
  status: 'PENDING_REVIEW' | 'CLEARED_RELEASED' | 'BLOCKED_CANCELLED';
  isFrozen: boolean;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
  };
}

export const PendingApprovals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'restocks' | 'refunds' | 'fraud'>('restocks');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Modals for testing AI agents
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [showFraudModal, setShowFraudModal] = useState<boolean>(false);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // Refund Simulation State
  const [refundForm, setRefundForm] = useState({
    orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    amount: 175,
    daysSincePurchase: 14,
    reason: 'Damaged in transit',
    customerMessage: 'My item arrived with severe exterior cracks and the box was torn. Requesting full refund.'
  });

  // Fraud Simulation State
  const [fraudForm, setFraudForm] = useState({
    orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: 'Robert Vance',
    customerEmail: 'robert@suspiciousmail.xyz',
    quantity: 85,
    totalAmount: 4250,
    shippingCountry: 'US',
    billingCountry: 'NG',
    paymentMethod: 'CREDIT_CARD'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restockRes, refundRes, fraudRes] = await Promise.all([
        api.get<ApprovalItem[]>('/approvals?status=PENDING').catch(() => ({ data: [] })),
        api.get<RefundItem[]>('/refunds?status=PENDING_APPROVAL').catch(() => ({ data: [] })),
        api.get<FraudAlertItem[]>('/fraud?status=PENDING_REVIEW').catch(() => ({ data: [] }))
      ]);
      setApprovals(restockRes.data);
      setRefunds(refundRes.data);
      setFraudAlerts(fraudRes.data);
    } catch (err) {
      console.error('Failed to fetch pending approval items', err);
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

  // Fraud Decision Handler
  const handleFraudDecision = async (alertId: number, decision: 'RELEASE' | 'CANCEL') => {
    setProcessingId(alertId);
    setMessage('');
    setError('');
    setFraudAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const res = await api.post(`/fraud/${alertId}/decide`, { decision, notes: `Risk review: ${decision}` });
      setMessage(res.data?.message || `Order fraud status updated to ${decision}.`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update fraud alert');
      fetchData();
    } finally {
      setProcessingId(null);
    }
  };

  // Run AI Customer Support Refund Simulation
  const handleSimulateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/refunds/process', refundForm);
      setShowRefundModal(false);
      if (res.data.isAutoApproved) {
        setMessage(`🤖 Refund Agent: Auto-Approved $${refundForm.amount} for Order #${refundForm.orderNumber} (Under $150 threshold & within policy).`);
      } else {
        setMessage(`🤖 Refund Agent: Escalated Order #${refundForm.orderNumber} to Manager Approval Queue ($${refundForm.amount} exceeds auto-limit or requires review).`);
      }
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to simulate refund agent');
    } finally {
      setSimLoading(false);
    }
  };

  // Run AI Operations Fraud Detection Simulation
  const handleSimulateFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/fraud/analyze', fraudForm);
      setShowFraudModal(false);
      if (res.data.isFrozen) {
        setMessage(`🛡️ Fraud Agent: ⚠️ FROZEN High-Risk Order #${res.data.orderNumber} (Risk Score: ${res.data.riskScore}). Escalated for Human Review.`);
      } else {
        setMessage(`🛡️ Fraud Agent: ✅ Cleared Safe Order #${res.data.orderNumber} (Risk Score: ${res.data.riskScore}). Auto-dispatched.`);
      }
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to simulate fraud agent');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Human-in-the-Loop AI Command Center</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ⚡ Groq LLaMA 3.3
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Monitor, audit, and authorize high-risk autonomous AI decisions across Procurement, Customer Support, and Fraud.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRefundModal(true)}
            className="flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-2 rounded-xl text-xs border border-blue-500/30 font-medium transition"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Test Refund Agent</span>
          </button>
          <button
            onClick={() => setShowFraudModal(true)}
            className="flex items-center space-x-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-2 rounded-xl text-xs border border-purple-500/30 font-medium transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Test Fraud Agent</span>
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

        <button
          onClick={() => setActiveTab('fraud')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'fraud'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Fraud & Risk Alerts (Score &ge; 0.70)</span>
          <span className="bg-slate-900/60 px-2 py-0.5 rounded-full text-[10px] font-mono">
            {fraudAlerts.length}
          </span>
        </button>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs flex items-center justify-between">
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
                No high-value restocks requiring manager authorization. Routine inventory orders (&le; $1,000) are auto-dispatched by the AI agent.
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
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>High-Value Purchase Order (&gt; $1,000)</span>
                      </span>
                      <span className="text-xs text-slate-500 font-mono">#{item.threadId}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{prod?.name || 'Product Restock'}</h3>
                      <p className="text-xs text-slate-400">SKU: <span className="text-slate-200 font-mono">{prod?.sku}</span> • Supplier: <span className="text-slate-200">{prod?.supplierName}</span></p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-3 text-center text-xs">
                      <div>
                        <p className="text-slate-500 uppercase text-[10px]">Stock</p>
                        <p className="font-bold text-amber-400">{prod?.currentStock}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[10px]">Reorder Qty</p>
                        <p className="font-bold text-blue-400">{req?.quantity}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase text-[10px]">Total Cost</p>
                        <p className="font-bold text-emerald-400">${Number(req?.totalCost || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-indigo-300 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Groq AI Procurement Memo</span>
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
                No customer refund requests currently awaiting review. Claims &le; $150 within 30-day policy are auto-refunded by the AI Support Agent.
              </p>
            </div>
          ) : (
            refunds.map((ref) => {
              const isProcessing = processingId === ref.id;
              return (
                <div key={ref.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        Refund Request: Order #{ref.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">Claim Amount: <strong className="text-emerald-400">${Number(ref.amount).toFixed(2)}</strong></span>
                    </div>
                    <span className="text-xs text-slate-500">{ref.daysSincePurchase} days elapsed since purchase</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-slate-500">Customer Details</p>
                        <p className="font-semibold text-slate-200">{ref.customerName} ({ref.customerEmail})</p>
                        <p className="text-slate-400 mt-1">Reason: <span className="text-amber-300 font-medium">{ref.reason}</span></p>
                      </div>
                      <div>
                        <p className="text-slate-500">Customer Message</p>
                        <p className="text-slate-300 italic">"{ref.customerMessage}"</p>
                      </div>
                    </div>

                    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 space-y-1.5">
                      <span className="font-bold text-indigo-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Groq AI Policy Evaluation</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed">{ref.aiReasoning}</p>
                      {ref.customerEmailDraft && (
                        <div className="pt-2 border-t border-indigo-500/20 text-[11px] text-slate-400">
                          <p className="font-semibold text-indigo-200 mb-1 flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>AI Generated Response Draft:</span>
                          </p>
                          <p className="bg-slate-950/80 p-2 rounded border border-slate-800 text-slate-300 font-mono whitespace-pre-wrap">{ref.customerEmailDraft}</p>
                        </div>
                      )}
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

      {/* TAB 3: FRAUD & OPERATIONS RISK ALERTS */}
      {activeTab === 'fraud' && (
        <div className="space-y-4">
          {fraudAlerts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Fraud Review Queue is Clear</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No transactions currently frozen for high risk. Normal orders (Risk Score &lt; 0.70) are autonomously approved for warehouse fulfillment.
              </p>
            </div>
          ) : (
            fraudAlerts.map((alert) => {
              const isProcessing = processingId === alert.id;
              const riskScore = Number(alert.riskScore);

              return (
                <div key={alert.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>FROZEN TRANSACTION: Order #{alert.orderNumber}</span>
                      </span>
                      <span className="text-xs text-slate-400">Total: <strong className="text-white">${Number(alert.totalAmount).toFixed(2)}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 font-mono font-bold border border-rose-500/30">
                        Risk Score: {riskScore.toFixed(2)} / 1.00 ({alert.riskLevel})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <p className="text-slate-500">Customer & Order</p>
                      <p className="font-semibold text-slate-200">{alert.customerName} ({alert.customerEmail})</p>
                      <p className="text-slate-400 mt-1">Quantity: <span className="text-white font-bold">{alert.quantity} units</span></p>
                    </div>
                    <div>
                      <p className="text-slate-500">Compounding Risk Factors</p>
                      <ul className="list-disc list-inside text-rose-300 space-y-0.5 mt-0.5">
                        {Array.isArray(alert.riskFactors) && alert.riskFactors.map((rf, idx) => (
                          <li key={idx}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-purple-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Groq AI Risk Analyst Summary</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{alert.aiExplanation}</p>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => handleFraudDecision(alert.id, 'CANCEL')}
                      disabled={isProcessing}
                      className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition"
                    >
                      Block & Cancel Order
                    </button>
                    <button
                      onClick={() => handleFraudDecision(alert.id, 'RELEASE')}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Verify & Release to Warehouse</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: TEST REFUND AI AGENT */}
      {showRefundModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div
            className="modal-card bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <span>Simulate Customer Support Refund Agent</span>
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  <span>Run Groq AI Agent</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: TEST FRAUD AI AGENT */}
      {showFraudModal && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowFraudModal(false)}>
          <div
            className="modal-card bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                <span>Simulate Operations Fraud Prevention Agent</span>
              </h3>
              <button
                onClick={() => setShowFraudModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateFraud} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Customer Name</label>
                  <input
                    type="text"
                    value={fraudForm.customerName}
                    onChange={(e) => setFraudForm({ ...fraudForm, customerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Customer Email</label>
                  <input
                    type="email"
                    value={fraudForm.customerEmail}
                    onChange={(e) => setFraudForm({ ...fraudForm, customerEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Order Quantity</label>
                  <input
                    type="number"
                    value={fraudForm.quantity}
                    onChange={(e) => setFraudForm({ ...fraudForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">High volume = elevated risk</span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Total Amount ($)</label>
                  <input
                    type="number"
                    value={fraudForm.totalAmount}
                    onChange={(e) => setFraudForm({ ...fraudForm, totalAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Shipping Country</label>
                  <input
                    type="text"
                    value={fraudForm.shippingCountry}
                    onChange={(e) => setFraudForm({ ...fraudForm, shippingCountry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Billing Country</label>
                  <input
                    type="text"
                    value={fraudForm.billingCountry}
                    onChange={(e) => setFraudForm({ ...fraudForm, billingCountry: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 outline-none focus:border-purple-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Mismatch triggers flag</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFraudModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simLoading}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition"
                >
                  {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Run Fraud Analysis</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
