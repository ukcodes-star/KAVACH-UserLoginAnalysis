import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Skeleton from './Skeleton';

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon: EmptyIcon,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md shadow-sm dark:shadow-xl ${className}`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-100/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase font-medium tracking-wider text-zinc-600 dark:text-zinc-400">
          <tr>
            {columns.map((col, cIdx) => {
              const colKey = col.key || col.header || `col-${cIdx}`;
              const colLabel = col.label || col.header || '';
              const isSortable = col.sortable && onSort;
              const isSorted = sortBy === colKey;

              return (
                <th
                  key={colKey}
                  onClick={() => isSortable && onSort(colKey)}
                  className={`px-4 py-3.5 whitespace-nowrap ${
                    isSortable ? 'cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 select-none' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span>{colLabel}</span>
                    {isSortable && (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 font-sans">
          {loading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                {columns.map((col, cIdx) => (
                  <td key={col.key || cIdx} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  {EmptyIcon && <EmptyIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-600 stroke-1" />}
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={row.id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50' : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30'
                }`}
              >
                {columns.map((col, cIdx) => {
                  const colKey = col.key || col.header || `col-${cIdx}`;
                  let cellContent;

                  if (typeof col.render === 'function') {
                    cellContent = col.render(row[col.key], row);
                  } else if (typeof col.accessor === 'function') {
                    cellContent = col.accessor(row);
                  } else if (typeof col.accessor === 'string') {
                    cellContent = row[col.accessor] ?? '—';
                  } else if (col.key && row[col.key] !== undefined) {
                    cellContent = row[col.key] ?? '—';
                  } else {
                    cellContent = '—';
                  }

                  return (
                    <td
                      key={colKey}
                      className={`px-4 py-3.5 whitespace-nowrap text-zinc-700 dark:text-zinc-300 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
