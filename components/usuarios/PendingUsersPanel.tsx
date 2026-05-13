import React from 'react';
import { UserCheck, Loader2 } from 'lucide-react';
import type { User } from './types';

interface PendingUsersPanelProps {
  users: User[];
  approvingId: string | null;
  onApprove: (userId: string) => void;
}

export function PendingUsersPanel({ users, approvingId, onApprove }: PendingUsersPanelProps) {
  if (users.length === 0) {
    return (
      <div className="mx-6 md:mx-8 mb-4 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-500">
        Nenhum pedido de acesso aguarda aprovação.
      </div>
    );
  }

  return (
    <div className="mx-6 md:mx-8 mb-6 rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-amber-200/80 bg-amber-100/50 px-4 py-3">
        <UserCheck className="h-5 w-5 text-amber-800 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-amber-950">Aguardam aprovação</h2>
          <p className="text-xs text-amber-900/80">
            Estes utilizadores criaram conta pelo ecrã de login. Aprove para poderem entrar no CRM.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-amber-100">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-white/90"
          >
            <div className="min-w-0">
              <p className="font-semibold text-brand-950 truncate">{u.name}</p>
              <p className="text-xs text-slate-600 truncate">{u.email}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Pedido em{' '}
                {u.createdAt
                  ? new Date(u.createdAt).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>
            <button
              type="button"
              disabled={approvingId === u.id}
              onClick={() => onApprove(u.id)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {approvingId === u.id ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  A aprovar…
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Aprovar acesso
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
