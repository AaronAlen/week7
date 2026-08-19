import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, User as UserIcon, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition">
            <Cpu className="w-8 h-8 text-blue-500 animate-pulse" />
            <span className="text-xl font-bold tracking-tight text-white">Stock<span className="text-blue-500">Pilot</span></span>
          </Link>
          <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            LangGraph HITL v1.0
          </span>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-200">{user.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-1 text-sm bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
