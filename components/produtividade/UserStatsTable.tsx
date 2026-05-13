import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';
import type { PerUserStats } from './types';

const PAGE_SIZE = 8;

type SortKey = keyof Pick<
  PerUserStats,
  'name' | 'messagesSent' | 'messagesReceived' | 'ticketsCreated' | 'ticketsArchived' | 'lastActivityAt'
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
}

function SortHeader({ k, current, asc, align = 'left', onSort, children }: SortHeaderProps) {
  const active = current === k;
  return (
    <th className={`h-12 px-4 align-middle font-medium text-slate-500 select-none ${align === 'right' ? 'text-right' : ''}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
          active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {children}
        {active && (asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
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

export function UserStatsTable({ rows, isLoading, onUserClick }: UserStatsTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('messagesSent');
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
      setSortAsc(false);
    }
    setPage(0);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white text-brand-950 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-950">Por utilizador</h3>
        <span className="text-[11px] font-medium text-slate-500">
          {rows.length} {rows.length === 1 ? 'membro' : 'membros'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <SortHeader k="name" current={sortKey} asc={sortAsc} onSort={toggleSort}>Membro</SortHeader>
              <SortHeader k="messagesSent" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">Enviadas</SortHeader>
              <SortHeader k="messagesReceived" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">Recebidas</SortHeader>
              <SortHeader k="ticketsCreated" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">OS criadas</SortHeader>
              <SortHeader k="ticketsArchived" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">OS fechadas</SortHeader>
              <SortHeader k="lastActivityAt" current={sortKey} asc={sortAsc} onSort={toggleSort} align="right">Última atividade</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <span className="text-slate-500 font-medium text-sm">A carregar equipa…</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-32 text-center text-slate-500 text-sm">
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
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
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
                      <div className="flex flex-col max-w-[160px] sm:max-w-[260px]">
                        <span className="font-semibold text-brand-950 truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {u.role === 'ADMIN' ? 'Administrador' : 'Equipa'} · {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-right tabular-nums">{u.messagesSent.toLocaleString('pt-PT')}</td>
                  <td className="p-4 align-middle text-right tabular-nums text-slate-500">
                    {u.messagesReceived.toLocaleString('pt-PT')}
                  </td>
                  <td className="p-4 align-middle text-right tabular-nums">{u.ticketsCreated.toLocaleString('pt-PT')}</td>
                  <td className="p-4 align-middle text-right tabular-nums">{u.ticketsArchived.toLocaleString('pt-PT')}</td>
                  <td className="p-4 align-middle text-right text-slate-500 text-[12px]">
                    {formatRelative(u.lastActivityAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={page}
        pageSize={PAGE_SIZE}
        total={sorted.length}
        onPageChange={setPage}
      />
    </div>
  );
}
