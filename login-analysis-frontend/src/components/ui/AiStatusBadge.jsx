import React from 'react';
import { Cpu } from 'lucide-react';

export const AiStatusBadge = ({ live = true, onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-all duration-200 cursor-pointer ${
        live
          ? 'bg-zinc-100 dark:bg-zinc-900/90 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10 hover:border-emerald-500/60 hover:scale-105 active:scale-95'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
      } ${className}`}
      title={live ? 'AI Neural Threat Engine Active' : 'AI Offline / Simulation Mode'}
    >
      <span className="relative flex h-2 w-2">
        {live && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            live ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'
          }`}
        />
      </span>
      <span className="flex items-center gap-1.5">
        <Cpu className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        <span className="text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold tracking-wide">
          {live ? 'Online' : 'Offline'}
        </span>
      </span>
    </button>
  );
};

export const GrokAiBadge = AiStatusBadge;
export default AiStatusBadge;
