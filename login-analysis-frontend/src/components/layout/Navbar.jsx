import React, { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  LogOut,
  Terminal,
  User as UserIcon,
  Search,
  Activity,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge, Button, KavachLogo } from '../ui';
import gsap from 'gsap';

export const Navbar = ({ onOpenWinston, aiStatus, onOpenAiChat }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const themeBtnRef = useRef(null);

  const handleBrandClick = () => {
    navigate(isAdmin ? '/dashboard' : '/anomalies');
  };

  const handleAiClick = () => {
    if (onOpenAiChat) {
      onOpenAiChat();
    }
    navigate('/ai');
  };

  const handleToggleTheme = () => {
    if (themeBtnRef.current) {
      gsap.timeline()
        .to(themeBtnRef.current, { rotation: isDark ? 180 : -180, scale: 0.8, duration: 0.15, ease: 'power2.in' })
        .to(themeBtnRef.current, { rotation: 0, scale: 1, duration: 0.25, ease: 'back.out(2)' });
    }
    toggleTheme();
  };

  const handleSearchClick = () => {
    navigate('/logs');
  };

  return (
    <header className="sticky top-0 z-50 w-full h-16 shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl shadow-xs transition-colors duration-200">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div
          onClick={handleBrandClick}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <KavachLogo size={26} variant="mark" />
          <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors uppercase">
            Kavach
          </span>
        </div>

        {/* Center: Quick Search / Command Palette Hint & Live Status */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs xl:max-w-md mx-2 sm:mx-4">
          <button
            onClick={handleSearchClick}
            type="button"
            className="w-full h-9 flex items-center justify-between px-3.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs transition-all group overflow-hidden"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-500 transition-colors shrink-0" />
              <span className="text-[11px] truncate whitespace-nowrap">Search telemetry, accounts, vectors...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-400 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Theme Toggle & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            ref={themeBtnRef}
            type="button"
            onClick={handleToggleTheme}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-all duration-150 active:scale-95 focus:outline-none"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Winston Console Launcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenWinston}
            icon={Terminal}
            className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/40 px-2.5 sm:px-3"
            title="Open Winston Telemetry Console"
          >
            <span className="hidden sm:inline text-xs">Telemetry</span>
          </Button>

          {/* User Profile Pill */}
          {user && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {user.username}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <Badge variant={user.role} size="sm">
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="relative w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <UserIcon className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              </div>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                icon={LogOut}
                className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5"
                title="Sign out"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
