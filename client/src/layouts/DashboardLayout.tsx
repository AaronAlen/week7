import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { useAppSelector } from '../store/index.ts';

export const DashboardLayout: React.FC = () => {
  const theme = useAppSelector((state) => state.theme.mode);
  const isDark = theme === 'dark';

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main id="main-content-scroll" className={`flex-1 p-6 md:p-8 overflow-y-auto transition-colors duration-200 ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
