import React from 'react';
import {
  Users,
  Send,
  Inbox,
  Image,
  Ticket as TicketIcon,
  CheckSquare,
  Layers,
  StickyNote,
  ListTodo,
  ListChecks,
  Paperclip,
  Building2,
  Trash2,
} from 'lucide-react';
import type { TeamOverviewResponse } from './types';

interface KpiCardsProps {
  totals: TeamOverviewResponse['totals'];
  isLoading?: boolean;
}

type CardDef = { key: keyof TeamOverviewResponse['totals']; label: string; icon: typeof Users; color: string };

const sections: { title: string; items: CardDef[] }[] = [
  {
    title: 'Comunicação (WhatsApp)',
    items: [
      { key: 'messagesSent', label: 'Mensagens enviadas', icon: Send, color: 'text-emerald-600' },
      { key: 'messagesReceived', label: 'Mensagens recebidas', icon: Inbox, color: 'text-sky-600' },
      { key: 'mediaMessagesSent', label: 'Mensagens com mídia (envio)', icon: Image, color: 'text-teal-600' },
    ],
  },
  {
    title: 'Ordens de serviço',
    items: [
      { key: 'ticketsCreated', label: 'OS criadas', icon: TicketIcon, color: 'text-amber-600' },
      { key: 'ticketsArchived', label: 'OS fechadas / arquivadas', icon: CheckSquare, color: 'text-violet-600' },
      { key: 'openTickets', label: 'OS em aberto (agora)', icon: Layers, color: 'text-slate-600' },
    ],
  },
  {
    title: 'Trabalho nas solicitações',
    items: [
      { key: 'notesAdded', label: 'Notas adicionadas', icon: StickyNote, color: 'text-orange-600' },
      { key: 'tasksCreated', label: 'Tarefas criadas', icon: ListTodo, color: 'text-indigo-600' },
      { key: 'tasksCompleted', label: 'Tarefas concluídas', icon: ListChecks, color: 'text-green-700' },
      { key: 'ticketFilesUploaded', label: 'Ficheiros na OS', icon: Paperclip, color: 'text-cyan-700' },
    ],
  },
  {
    title: 'Outros registos',
    items: [
      { key: 'companiesCreated', label: 'Empresas criadas', icon: Building2, color: 'text-blue-700' },
      { key: 'deletionsRecorded', label: 'Exclusões (auditoria)', icon: Trash2, color: 'text-red-600' },
      { key: 'activeUsers', label: 'Membros com actividade', icon: Users, color: 'text-brand-600' },
    ],
  },
];

export function KpiCards({ totals, isLoading }: KpiCardsProps) {
  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{section.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {section.items.map((c) => {
              const Icon = c.icon;
              const value = totals[c.key];
              return (
                <div
                  key={c.key}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-1.5 min-h-[88px]"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">
                      {c.label}
                    </span>
                    <Icon className={`h-4 w-4 shrink-0 ${c.color}`} />
                  </div>
                  <span className="text-xl font-bold text-brand-950 tabular-nums">
                    {isLoading ? '—' : Number(value).toLocaleString('pt-PT')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
