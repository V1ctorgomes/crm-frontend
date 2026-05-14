import React from 'react';
import { Users, Send, Inbox, Ticket as TicketIcon, CheckSquare, Layers } from 'lucide-react';
import type { TeamOverviewResponse } from './types';

interface KpiCardsProps {
  totals: TeamOverviewResponse['totals'];
  isLoading?: boolean;
}

const cards = [
  { key: 'activeUsers', label: 'Usuarios activos', icon: Users, color: 'text-brand-600' },
  { key: 'messagesSent', label: 'Mensagens enviadas', icon: Send, color: 'text-emerald-600' },
  { key: 'messagesReceived', label: 'Mensagens recebidas', icon: Inbox, color: 'text-sky-600' },
  { key: 'ticketsCreated', label: 'OS criadas', icon: TicketIcon, color: 'text-amber-600' },
  { key: 'ticketsArchived', label: 'OS fechadas', icon: CheckSquare, color: 'text-violet-600' },
  { key: 'openTickets', label: 'OS abertas (agora)', icon: Layers, color: 'text-slate-600' },
] as const;

export function KpiCards({ totals, isLoading }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const value = totals[c.key as keyof typeof totals];
        return (
          <div
            key={c.key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {c.label}
              </span>
              <Icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <span className="text-2xl font-bold text-brand-950 tabular-nums">
              {isLoading ? '—' : value.toLocaleString('pt-PT')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
