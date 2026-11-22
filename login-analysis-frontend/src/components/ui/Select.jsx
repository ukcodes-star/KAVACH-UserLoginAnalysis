import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  label,
  options = [],
  value,
  onChange,
  error,
  placeholder = 'Select option...',
  className = '',
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none rounded-lg bg-white dark:bg-zinc-950/80 border text-zinc-900 dark:text-zinc-100 text-sm transition-colors duration-150 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer ${
            Icon ? 'pl-9' : 'pl-3.5'
          } ${
            error
              ? 'border-rose-500 focus:border-rose-500'
              : 'border-zinc-300 dark:border-zinc-800 focus:border-cyan-500'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="" className="bg-white dark:bg-zinc-900 text-zinc-400">{placeholder}</option>}
          {options.map((opt) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const val = isObj ? opt.value : opt;
            const lbl = isObj ? opt.label : opt;
            return (
              <option key={val} value={val} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {lbl}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
