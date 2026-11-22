import React from 'react';

const variantConfig = {
  // Severities
  CRITICAL: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-sm shadow-rose-500/10',
  HIGH:     'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 shadow-sm shadow-orange-500/10',
  MEDIUM:   'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  LOW:      'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',

  // Statuses
  SUCCESS:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  FAILED:   'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  ACTIVE:   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  INACTIVE: 'bg-zinc-200/60 dark:bg-zinc-700/30 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600/30',

  // Roles
  ADMIN:    'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  USER:     'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',

  // Confidence
  CONFIDENCE_HIGH: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/15',
  CONFIDENCE_MEDIUM: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
  CONFIDENCE_LOW: 'bg-zinc-200/60 dark:bg-zinc-600/20 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600/40',

  // AI & Threat Intelligence Badges
  AI:       'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/20',
  GROK:     'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/20',
  ADVISORY: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40',
  DEFAULT:  'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
};

const dotColors = {
  CRITICAL: 'bg-rose-500 animate-pulse',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-400',
  LOW:      'bg-cyan-400',
  SUCCESS:  'bg-emerald-400',
  FAILED:   'bg-red-400',
  ACTIVE:   'bg-emerald-400',
  INACTIVE: 'bg-zinc-400',
  ADMIN:    'bg-purple-500',
  USER:     'bg-blue-500',
  CONFIDENCE_HIGH: 'bg-emerald-400',
  CONFIDENCE_MEDIUM: 'bg-amber-400',
  CONFIDENCE_LOW: 'bg-zinc-400',
  AI:       'bg-violet-400 animate-pulse',
  GROK:     'bg-violet-400 animate-pulse',
  ADVISORY: 'bg-blue-400',
  DEFAULT:  'bg-zinc-400',
};

export const Badge = ({
  children,
  variant,
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const normalizedVariant = (variant || children || 'DEFAULT').toString().toUpperCase();
  const style = variantConfig[normalizedVariant] || variantConfig.DEFAULT;
  const dotColor = dotColors[normalizedVariant] || dotColors.DEFAULT;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
    lg: 'text-sm px-3 py-1.5 rounded-lg',
  }[size] || 'text-xs px-2.5 py-1 rounded-full';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border font-mono tracking-wide ${style} ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
};

export default Badge;
