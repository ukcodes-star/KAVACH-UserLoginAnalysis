import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

export const GrokAiBadge = ({
  live = false,
  model = 'grok-4-fast',
  className = '',
  onClick,
}) => {
  const displayModel = model ? model.replace(/-latest$/, '') : 'grok-4-fast';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
        live
          ? 'bg-violet-950/40 text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/20 hover:border-violet-400'
          : 'bg-slate-900/80 text-violet-400/90 border-slate-700/80 hover:border-violet-500/30'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
      <span className="font-mono font-semibold tracking-wide">
        {displayModel} {live ? '(Live)' : '(Simulated)'}
      </span>
      <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-violet-400'}`} />
    </div>
  );
};

export default GrokAiBadge;
