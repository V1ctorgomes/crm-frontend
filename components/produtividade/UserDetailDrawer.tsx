'use client';

import React, { useEffect } from 'react';
import { X, Send, Inbox, Ticket as TicketIcon, CheckSquare } from 'lucide-react';
import type { PerUserStats } from './types';

interface UserDetailDrawerProps {
  user: PerUserStats | null;
  periodLabel: string;
  onClose: () => void;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

export function UserDetailDrawer({ user, periodLabel, onClose }: UserDetailDrawerProps) {
  useEffect(() => {
    if (!user) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, onClose]);

  if (!user) return null;

  const totalActions =
    user.messagesSent + user.messagesReceived + user.ticketsCreated + user.ticketsArchived;

  const stats = [
    { key: 'messagesSent', label: 'Mensagens enviadas', value: user.messagesSent, icon: Send, color: 'text-emerald-600' },
    { key: 'messagesReceived', label: 'Mensagens recebidas', value: user.messagesReceived, icon: Inbox, color: 'text-sky-600' },
    { key: 'ticketsCreated', label: 'OS criadas', value: user.ticketsCreated, icon: TicketIcon, color: 'text-amber-600' },
    { key: 'ticketsArchived', label: 'OS fechadas', value: user.ticketsArchived, icon: CheckSquare, color: 'text-violet-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-brand-950/45 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <header className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0">
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
            <div className="min-w-0">
              <h2 className="text-base font-bold text-brand-950 truncate">{user.name}</h2>
              <p className="text-xs text-slate-500 truncate">
                {user.role === 'ADMIN' ? 'Administrador' : 'Equipe'} · {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-md flex items-center justify-center text-slate-400 hover:text-brand-950 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-5 py-4 border-b border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Período
          </span>
          <p className="text-sm font-semibold text-brand-950 mt-0.5">{periodLabel}</p>
        </div>

        <div className="flex-1 overflow-y-auto crm-thin-scrollbar p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="rounded-lg border border-slate-200 p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {s.label}
                    </span>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <span className="text-xl font-bold text-brand-950 tabular-nums">
                    {s.value.toLocaleString('pt-PT')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-slate-200 p-4 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Resumo
            </span>
            <div className="text-sm text-slate-700 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total de ações</span>
                <span className="font-semibold tabular-nums">{totalActions.toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Última atividade</span>
                <span className="font-semibold text-[12px]">{formatDateTime(user.lastActivityAt)}</span>
              </div>
              {user.messagesReceived > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rácio enviadas / recebidas</span>
                  <span className="font-semibold tabular-nums">
                    {(user.messagesSent / Math.max(1, user.messagesReceived)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
