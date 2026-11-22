import React from 'react';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: 'bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-sm active:scale-[0.97]',
  secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-800 active:scale-[0.97]',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20 active:scale-[0.97]',
  ghost: 'bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
  outline: 'bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 active:scale-[0.97]',
  ai: 'bg-gradient-to-r from-zinc-900 via-violet-900 to-zinc-900 hover:from-black hover:to-zinc-800 text-white dark:from-violet-600 dark:to-cyan-600 dark:hover:from-violet-500 dark:hover:to-cyan-500 shadow-md shadow-violet-500/15 active:scale-[0.97]',
  grok: 'bg-gradient-to-r from-zinc-900 via-violet-900 to-zinc-900 hover:from-black hover:to-zinc-800 text-white dark:from-violet-600 dark:to-cyan-600 dark:hover:from-violet-500 dark:hover:to-cyan-500 shadow-md shadow-violet-500/15 active:scale-[0.97]',
};

const sizeStyles = {
  xs: 'px-2 py-1 text-xs rounded-lg gap-1',
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold rounded-xl gap-2.5',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400/40 select-none ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${isDisabled ? 'opacity-50 cursor-not-allowed transform-none' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
