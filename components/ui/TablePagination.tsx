import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, pageSize, total, onPageChange }: TablePaginationProps) {
  if (total === 0 || total <= pageSize) return null;

  const totalPages = Math.ceil(total / pageSize);
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * pageSize + 1;
  const end = Math.min((safePage + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={safePage <= 0}
        onClick={() => onPageChange(safePage - 1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs font-medium text-slate-600 tabular-nums text-center flex-1 min-w-0">
        {start}–{end} de {total} · {safePage + 1}/{totalPages}
      </span>
      <button
        type="button"
        aria-label="Página seguinte"
        disabled={safePage >= totalPages - 1}
        onClick={() => onPageChange(safePage + 1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
