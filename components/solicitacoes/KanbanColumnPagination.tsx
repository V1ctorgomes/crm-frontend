import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface KanbanColumnPaginationProps {
  stageId: string;
  clampedPage: number;
  totalPages: number;
  rangeLabel: string;
  total: number;
  onPageChange: (stageId: string, newPage: number) => void;
}

export function KanbanColumnPagination({
  stageId,
  clampedPage,
  totalPages,
  rangeLabel,
  total,
  onPageChange,
}: KanbanColumnPaginationProps) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-t border-slate-200">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={clampedPage <= 0}
        onClick={() => onPageChange(stageId, Math.max(0, clampedPage - 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-[11px] font-medium text-slate-600 tabular-nums">
        {rangeLabel} de {total} · {clampedPage + 1}/{totalPages}
      </span>
      <button
        type="button"
        aria-label="Página seguinte"
        disabled={clampedPage >= totalPages - 1}
        onClick={() => onPageChange(stageId, Math.min(totalPages - 1, clampedPage + 1))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
