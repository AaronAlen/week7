import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserCheck, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <UserCheck className="w-6 h-6 text-blue-400" />
          <span>User Profile & Authorization Details</span>
        </h1>
        <p className="text-sm text-slate-400">Authenticated user context and role authorization status</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Role: {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <h3 className="font-semibold text-slate-200 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Role Permissions & Capabilities</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border ${user.role === 'ADMIN' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-slate-800/40 border-slate-800 text-slate-400'}`}>
              <strong className="block text-sm">ADMIN</strong>
              Full access, Product CRUD, User creation, Restock approval, Receive stock.
            </div>
            <div className={`p-3 rounded-xl border ${user.role === 'MANAGER' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-slate-800/40 border-slate-800 text-slate-400'}`}>
              <strong className="block text-sm">MANAGER</strong>
              Product CRUD, Restock approval, Receive stock, Inventory adjustment.
            </div>
            <div className={`p-3 rounded-xl border ${user.role === 'STAFF' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/40 border-slate-800 text-slate-400'}`}>
              <strong className="block text-sm">STAFF</strong>
              View catalog, Record sales, View transaction logs & chat.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
