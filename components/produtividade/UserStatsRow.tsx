import React from 'react';
import type { PerUserStats } from './types';

export function formatRelative(iso: string | null): string {
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

export function roleLabel(role: string): string {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'DEVELOPER') return 'Developer';
  return 'Equipe';
}

interface UserStatsRowProps {
  user: PerUserStats;
  onUserClick?: (user: PerUserStats) => void;
}

export function UserStatsRow({ user, onUserClick }: UserStatsRowProps) {
  return (
    <tr
      className={`hover:bg-slate-50/50 transition-colors ${onUserClick ? 'cursor-pointer' : ''}`}
      onClick={onUserClick ? () => onUserClick(user) : undefined}
    >
      <td className="p-3 align-middle">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs overflow-hidden shrink-0">
            {user.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePictureUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              user.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex flex-col max-w-[140px] sm:max-w-[200px]">
            <span className="font-semibold text-brand-950 truncate">{user.name}</span>
            <span className="text-[10px] text-slate-500 truncate">
              {roleLabel(user.role)} · {user.email}
            </span>
          </div>
        </div>
      </td>
      <td className="p-3 align-middle text-right tabular-nums font-semibold text-brand-800">
        {user.totalActivity.toLocaleString('pt-PT')}
      </td>
      <td className="p-3 align-middle text-right tabular-nums">{user.messagesSent.toLocaleString('pt-PT')}</td>
      <td className="p-3 align-middle text-right tabular-nums text-slate-600">
        {user.messagesReceived.toLocaleString('pt-PT')}
      </td>
      <td className="p-3 align-middle text-right tabular-nums">{user.ticketsCreated.toLocaleString('pt-PT')}</td>
      <td className="p-3 align-middle text-right tabular-nums">{user.ticketsClosed.toLocaleString('pt-PT')}</td>
      <td className="p-3 align-middle text-right tabular-nums text-slate-600">
        {user.ticketsCancelled.toLocaleString('pt-PT')}
      </td>
      <td className="p-3 align-middle text-right text-slate-500 text-[11px] whitespace-nowrap">
        {formatRelative(user.lastActivityAt)}
      </td>
    </tr>
  );
}
