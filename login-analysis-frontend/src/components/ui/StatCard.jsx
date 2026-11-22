import React, { useEffect, useRef } from 'react';
import Card from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { animateNumberCounter } from '../../utils/animations';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  color = 'cyan', // 'cyan' | 'rose' | 'amber' | 'emerald' | 'violet'
  glow = false,
  className = '',
  onClick,
}) => {
  const numberRef = useRef(null);

  useEffect(() => {
    if (numberRef.current && typeof value === 'number') {
      animateNumberCounter(numberRef.current, value, 0.8);
    }
  }, [value]);

  const colorThemes = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10',
      glow: 'shadow-cyan-500/10 border-cyan-500/30',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/10',
      glow: 'shadow-rose-500/10 border-rose-500/30',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10',
      glow: 'shadow-amber-500/10 border-amber-500/30',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10',
      glow: 'shadow-emerald-500/10 border-emerald-500/30',
    },
    violet: {
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm shadow-violet-500/10',
      glow: 'shadow-violet-500/10 border-violet-500/30',
    },
  }[color] || {
    border: 'hover:border-zinc-300 dark:hover:border-zinc-700',
    iconBg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    glow: '',
  };

  return (
    <Card
      onClick={onClick}
      className={`p-5 transition-all duration-200 ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${colorThemes.border} ${
        glow ? colorThemes.glow : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span
              ref={numberRef}
              className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              {value}
            </span>
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-medium ${
                  trendDirection === 'up'
                    ? 'text-rose-600 dark:text-rose-400'
                    : trendDirection === 'down'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {trendDirection === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                {trendDirection === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl shadow-md shrink-0 ${colorThemes.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
