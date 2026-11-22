import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  FileText,
  Users,
  History,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activePage, onSelectPage }) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Security Dashboard',
      icon: LayoutDashboard,
      adminOnly: true,
      badge: 'Live',
    },
    {
      id: 'anomalies',
      path: '/anomalies',
      label: 'Anomaly Intelligence',
      icon: ShieldAlert,
      adminOnly: false,
    },
    {
      id: 'risk',
      path: '/risk',
      label: 'Risk Assessment',
      icon: Activity,
      adminOnly: false,
    },
    {
      id: 'logs',
      path: '/logs',
      label: 'Login Telemetry',
      icon: FileText,
      adminOnly: false,
    },
    {
      id: 'users',
      path: '/users',
      label: 'User Directory',
      icon: Users,
      adminOnly: true,
    },
    {
      id: 'audit',
      path: '/audit',
      label: 'Audit Trail',
      icon: History,
      adminOnly: true,
    },
    {
      id: 'ai-copilot',
      path: '/ai',
      label: 'AI Threat Intelligence',
      icon: Bot,
      adminOnly: false,
      special: true,
      badge: 'AI',
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNavClick = (item) => {
    navigate(item.path);
    if (onSelectPage) {
      onSelectPage(item.id);
    }
  };

  return (
    <aside className="w-64 h-full shrink-0 border-r border-zinc-200 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto hidden md:flex transition-colors duration-200 select-none">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-500 font-semibold mb-2">
            Operations Center
          </p>
          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === '/dashboard' && location.pathname === '/') ||
                activePage === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? item.special
                        ? 'bg-violet-50 text-violet-800 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-500/40 shadow-sm'
                        : 'bg-zinc-900 text-white dark:bg-zinc-900 dark:text-cyan-400 border border-zinc-900 dark:border-cyan-500/30 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? item.special
                            ? 'text-violet-600 dark:text-violet-400'
                            : 'text-zinc-100 dark:text-cyan-400'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                          item.special
                            ? 'bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30'
                            : 'bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className={`w-3.5 h-3.5 ${item.special ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-200 dark:text-cyan-400'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
