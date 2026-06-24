import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';
import type { PerUserStats } from './types';
import { UserStatsRow } from './UserStatsRow';

const PAGE_SIZE = 8;

type SortKey = keyof Pick<
  PerUserStats,
  | 'name'
  | 'totalActivity'
  | 'messagesSent'
  | 'messagesReceived'
  | 'ticketsCreated'
  | 'ticketsClosed'
  | 'ticketsCancelled'
  | 'lastActivityAt'
>;

interface UserStatsTableProps {
  rows: PerUserStats[];
  isLoading: boolean;
  onUserClick?: (user: PerUserStats) => void;
}

interface SortHeaderProps {
  k: SortKey;
  current: SortKey;
  asc: boolean;
  align?: 'left' | 'right';
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}

function SortHeader({ k, current, asc, align = 'left', onSort, children, className = '' }: SortHeaderProps) {
  const active = current === k;
  return (
    <th
      className={`h-12 px-2 align-middle font-medium text-slate-500 select-none whitespace-nowrap ${align === 'right' ? 'text-right' : ''} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
          active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'
        }`}
        title={typeof children === 'string' ? children : undefined}
      >
        {children}
        {active && (asc ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />)}
      </button>
    </th>
  );
}

export function UserStatsTable({ rows, isLoading, onUserClick }: UserStatsTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('totalActivity');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return sortAsc ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  const paged = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === 'name');
    }
    setPage(0);
  };

  const colCount = 8;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white text-brand-950 shadow-sm ring-1 ring-slate-200/60 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-950">Por membro</h3>
        <span className="text-[11px] font-medium text-slate-500">
          {rows.length} {rows.length === 1 ? 'membro' : 'membros'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <SortHeader k="name" current={sortKey} asc={sortAsc} onSort={toggleSort}>
                Membro
              </SortHeader>
              <SortHeader k="totalActivity" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                Total
              </SortHeader>
              <SortHeader k="messagesSent" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                Env.
              </SortHeader>
              <SortHeader k="messagesReceived" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                Rec.
              </SortHeader>
              <SortHeader k="ticketsCreated" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                OS+
              </SortHeader>
              <SortHeader k="ticketsClosed" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                OS ✓
              </SortHeader>
              <SortHeader k="ticketsCancelled" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                OS ✕
              </SortHeader>
              <SortHeader k="lastActivityAt" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">
                Última
              </SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={colCount} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <span className="text-slate-500 font-medium text-sm">A carregar equipe…</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="h-32 text-center text-slate-500 text-sm">
                  Nenhum dado no período seleccionado.
                </td>
              </tr>
            ) : (
              paged.map((u) => <UserStatsRow key={u.userId} user={u} onUserClick={onUserClick} />)
            )}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
    </div>
  );
}
