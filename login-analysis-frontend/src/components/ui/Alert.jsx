import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const alertStyles = {
  info: {
    wrapper: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-200',
    icon: Info,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  warning: {
    wrapper: 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    wrapper: 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200',
    icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  success: {
    wrapper: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
};

export const Alert = ({
  type = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const config = alertStyles[type] || alertStyles.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm text-sm ${config.wrapper} ${className}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 -mr-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
