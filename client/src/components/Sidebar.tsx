import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../store/index.js';
import { UserRole } from '../types/index.ts';
import {
  LayoutDashboard,
  Package,
  ArrowDownUp,
  RefreshCw,
  CheckSquare,
  FileText,
  Activity,
  Users,
  MessageSquare,
  UserCheck,
  Award
} from 'lucide-react';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

export const Sidebar: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const links: SidebarLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/inventory', label: 'Sales & Inventory', icon: ArrowDownUp },
    { to: '/restocks', label: 'Restock Requests', icon: RefreshCw },
    { to: '/pending-approvals', label: 'Pending Approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
    { to: '/vendor-analysis', label: 'Supplier Intelligence', icon: Award, roles: ['ADMIN', 'MANAGER'] },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
    { to: '/agent-logs', label: 'Agent Activity Logs', icon: Activity },
    { to: '/chat', label: 'Real-Time Chat', icon: MessageSquare },
    { to: '/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
    { to: '/profile', label: 'Profile', icon: UserCheck }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 overflow-y-auto p-4 select-none">
      <nav className="space-y-1.5 flex-1">
        {links.map((link) => {
          if (link.roles && !hasRole(...link.roles)) return null;

          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">StockPilot AI v2.0</p>
        <p>Groq LLaMA 3.3 Autonomous Agent</p>
      </div>
    </aside>
  );
};
