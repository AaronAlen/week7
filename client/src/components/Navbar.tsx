import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import { logout } from '../store/slices/authSlice.js';
import { toggleTheme } from '../store/slices/themeSlice.js';
import { LogOut, User as UserIcon, Cpu, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.ts';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const theme = useAppSelector((state) => state.theme.mode);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network failures on logout
    }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="navbar-header bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-2 text-blue-500 hover:text-blue-400 transition">
            <Cpu className="w-8 h-8 text-blue-500 animate-pulse" />
            <span className="text-xl font-bold tracking-tight logo-text text-white">Stock<span className="text-blue-500">Pilot</span></span>
          </Link>
          <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
            🟢 Enterprise Active
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => dispatch(toggleTheme())}
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
                onClick={handleLogout}
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
