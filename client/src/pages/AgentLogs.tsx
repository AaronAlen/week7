import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { Activity, RefreshCw, Cpu } from 'lucide-react';

interface AgentLog {
  id: number;
  action: string;
  status: string;
  message: string;
  createdAt: string;
  productId?: number;
  product?: { name: string };
  restockRequestId?: number;
}

export const AgentLogs: React.FC = () => {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/agent-logs?limit=100');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load agent logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const cleanActionName = (action: string) => {
    return (action || '')
      .replace(/^GROQ_AI_/i, '')
      .replace(/^AI_/i, '')
      .replace(/_EVAL$/i, '_EVALUATION');
  };

  const cleanLogMessage = (msg: string) => {
    return (msg || '')
      .replace(/Groq AI/gi, 'System')
      .replace(/groq_ai/gi, 'system')
      .replace(/\bgroq\b/gi, 'StockPilot');
  };

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System & Operations Audit Trail</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Immutable chronological audit log of all system decisions, policy evaluations, and procurement authorizations</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Log Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No system audit logs found.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-slate-900 dark:text-white tracking-wide">{cleanActionName(log.action)}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.status === 'SUCCESS' || log.status === 'EVALUATION_COMPLETED' || log.status === 'AUTO_APPROVED' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                    log.status === 'PAUSED' || log.status === 'PAUSED_FOR_APPROVAL' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                    log.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' :
                    'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
              </div>

              <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-sans font-normal">{cleanLogMessage(log.message)}</p>

              <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                <span>Product: <strong className="text-slate-700 dark:text-slate-300">{log.product?.name || `ID #${log.productId || 'N/A'}`}</strong></span>
                {log.restockRequestId && <span>Restock Request: <strong className="text-slate-700 dark:text-slate-300">#{log.restockRequestId}</strong></span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
