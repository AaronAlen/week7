import React from 'react';
import { useAppSelector } from '../store/index.ts';
import { UserCheck, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

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
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl uppercase">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-bold border ${
              user.role === 'ADMIN'
                ? 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/40'
                : user.role === 'MANAGER'
                ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-500/40'
                : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
            }`}>
              Role: {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Role Permissions & Capabilities</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* ADMIN CARD */}
            <div className={`p-4 rounded-xl transition ${
              user.role === 'ADMIN' ? 'profile-role-admin' : 'profile-role-inactive'
            }`}>
              <strong className={`block text-sm mb-1.5 font-bold ${
                user.role === 'ADMIN' ? 'text-purple-900 dark:text-purple-300' : 'text-slate-700 dark:text-slate-400'
              }`}>
                ADMIN
              </strong>
              <p className={`leading-relaxed ${
                user.role === 'ADMIN' ? 'profile-card-desc' : 'profile-card-desc-inactive'
              }`}>
                Full access, Product CRUD, User creation, Restock approval, Receive stock.
              </p>
            </div>

            {/* MANAGER CARD */}
            <div className={`p-4 rounded-xl transition ${
              user.role === 'MANAGER' ? 'profile-role-manager' : 'profile-role-inactive'
            }`}>
              <strong className={`block text-sm mb-1.5 font-bold ${
                user.role === 'MANAGER' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-400'
              }`}>
                MANAGER
              </strong>
              <p className={`leading-relaxed ${
                user.role === 'MANAGER' ? 'profile-card-desc' : 'profile-card-desc-inactive'
              }`}>
                Product CRUD, Restock approval, Receive stock, Inventory adjustment.
              </p>
            </div>

            {/* STAFF CARD */}
            <div className={`p-4 rounded-xl transition ${
              user.role === 'STAFF' ? 'profile-role-staff' : 'profile-role-inactive'
            }`}>
              <strong className={`block text-sm mb-1.5 font-bold ${
                user.role === 'STAFF' ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-400'
              }`}>
                STAFF
              </strong>
              <p className={`leading-relaxed ${
                user.role === 'STAFF' ? 'profile-card-desc' : 'profile-card-desc-inactive'
              }`}>
                View catalog, Record sales, View transaction logs & chat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
