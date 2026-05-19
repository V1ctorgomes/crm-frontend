import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';
import type { PerUserStats } from './types';

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

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `há ${diffD} d`;
  return d.toLocaleDateString('pt-PT');
}

function roleLabel(role: string): string {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'DEVELOPER') return 'Developer';
  return 'Equipe';
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
              paged.map((u) => (
                <tr
                  key={u.userId}
                  className={`hover:bg-slate-50/50 transition-colors ${onUserClick ? 'cursor-pointer' : ''}`}
                  onClick={onUserClick ? () => onUserClick(u) : undefined}
                >
                  <td className="p-3 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs overflow-hidden shrink-0">
                        {u.profilePictureUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.profilePictureUrl}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col max-w-[140px] sm:max-w-[200px]">
                        <span className="font-semibold text-brand-950 truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {roleLabel(u.role)} · {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-middle text-right tabular-nums font-semibold text-brand-800">
                    {u.totalActivity.toLocaleString('pt-PT')}
                  </td>
                  <td className="p-3 align-middle text-right tabular-nums">{u.messagesSent.toLocaleString('pt-PT')}</td>
                  <td className="p-3 align-middle text-right tabular-nums text-slate-600">
                    {u.messagesReceived.toLocaleString('pt-PT')}
                  </td>
                  <td className="p-3 align-middle text-right tabular-nums">{u.ticketsCreated.toLocaleString('pt-PT')}</td>
                  <td className="p-3 align-middle text-right tabular-nums">{u.ticketsClosed.toLocaleString('pt-PT')}</td>
                  <td className="p-3 align-middle text-right tabular-nums text-slate-600">
                    {u.ticketsCancelled.toLocaleString('pt-PT')}
                  </td>
                  <td className="p-3 align-middle text-right text-slate-500 text-[11px] whitespace-nowrap">
                    {formatRelative(u.lastActivityAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={PAGE_SIZE} total={sorted.length} onPageChange={setPage} />
    </div>
  );
}
