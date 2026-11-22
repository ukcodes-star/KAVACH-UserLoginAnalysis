import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) => {
  const start = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 py-3 ${className}`}>
      <div>
        Showing <span className="font-mono text-zinc-900 dark:text-zinc-200 font-semibold">{start}</span> to{' '}
        <span className="font-mono text-zinc-900 dark:text-zinc-200 font-semibold">{end}</span> of{' '}
        <span className="font-mono text-zinc-900 dark:text-zinc-200 font-semibold">{totalElements}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 0}
          onClick={() => onPageChange(currentPage - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 font-mono text-[11px] shadow-sm">
          {currentPage + 1} / {Math.max(totalPages, 1)}
        </span>

        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
          icon={ChevronRight}
          iconPosition="right"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
