import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { LogOut, User as UserIcon, ShieldAlert, Cpu, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar-header bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition">
            <Cpu className="w-8 h-8 text-blue-500 animate-pulse" />
            <span className="text-xl font-bold tracking-tight logo-text text-white">Stock<span className="text-blue-500">Pilot</span></span>
          </Link>
          <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            LangGraph
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition flex items-center space-x-1.5 text-xs font-medium theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline text-amber-300">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline text-indigo-400">Dark Mode</span>
              </>
            )}
          </button>

          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 user-badge">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-200 user-name">{user.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30">
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 transition logout-btn"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline text-white">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
