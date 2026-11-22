import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl bg-white/90 dark:bg-zinc-950/80 border border-zinc-200/90 dark:border-zinc-800/90 backdrop-blur-md shadow-sm dark:shadow-xl text-zinc-900 dark:text-zinc-100 transition-all duration-200 ${
        hoverEffect ? 'hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:-translate-y-0.5' : ''
      } ${glow ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/15' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`p-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-950/40 rounded-b-xl ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
