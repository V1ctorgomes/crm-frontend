import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Send, Inbox, Ticket as TicketIcon, CheckSquare, Ban } from 'lucide-react';
import type { TeamOverviewResponse } from './types';

interface KpiCardsProps {
  totals: TeamOverviewResponse['totals'];
  isLoading?: boolean;
}

type KpiTotalKey = Exclude<keyof TeamOverviewResponse['totals'], 'activeUsers' | 'openTickets'>;

type CardDef = {
  key: KpiTotalKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

type SectionDef = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  ring: string;
  items: CardDef[];
  /** número de colunas em sm+ */
  cols: 2 | 3;
};

const sections: SectionDef[] = [
  {
    id: 'comms',
    title: 'WhatsApp',
    subtitle: 'Mensagens no período',
    accent: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-500/15',
    cols: 2,
    items: [
      {
        key: 'messagesSent',
        label: 'Mensagens enviadas',
        shortLabel: 'Enviadas',
        icon: Send,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
      },
      {
        key: 'messagesReceived',
        label: 'Mensagens recebidas',
        shortLabel: 'Recebidas',
        icon: Inbox,
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-600',
      },
    ],
  },
  {
    id: 'os',
    title: 'Ordens de serviço',
    subtitle: 'Criadas e movimentação no período',
    accent: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-500/15',
    cols: 3,
    items: [
      {
        key: 'ticketsCreated',
        label: 'OS criadas',
        shortLabel: 'Criadas',
        icon: TicketIcon,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
      },
      {
        key: 'ticketsClosed',
        label: 'OS fechadas',
        shortLabel: 'Fechadas',
        icon: CheckSquare,
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
      },
      {
        key: 'ticketsCancelled',
        label: 'OS canceladas',
        shortLabel: 'Canceladas',
        icon: Ban,
        iconBg: 'bg-red-50',
        iconColor: 'text-red-600',
      },
    ],
  },
];

function innerGridClass(cols: 2 | 3): string {
  if (cols === 2) {
    return 'grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 flex-1 content-start';
  }
  return 'grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 flex-1 content-start';
}

export function KpiCards({ totals, isLoading }: KpiCardsProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 md:p-7 shadow-sm ring-1 ring-slate-900/[0.03]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 md:mb-7">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-brand-950 tracking-tight">Indicadores do período</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Resumo de WhatsApp e de ordens de serviço (fechadas excluem canceladas).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-6 auto-rows-fr">
        {sections.map((section) => (
          <article
            key={section.id}
            className={`flex h-full min-h-[180px] flex-col rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-4 sm:p-5 shadow-sm ring-1 ${section.ring}`}
          >
            <header className="flex items-start gap-3 mb-3 sm:mb-4 pb-3 border-b border-slate-100/90 shrink-0">
              <div
                className={`h-9 w-1 shrink-0 rounded-full bg-gradient-to-b ${section.accent}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-brand-950 leading-tight">{section.title}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{section.subtitle}</p>
              </div>
            </header>

            <div className={`${innerGridClass(section.cols)} min-h-0`}>
              {section.items.map((c) => {
                const Icon = c.icon;
                const value = totals[c.key];
                const display = isLoading ? null : Number(value).toLocaleString('pt-PT');
                return (
                  <div
                    key={c.key}
                    className="group flex min-h-[5.5rem] flex-col rounded-xl border border-slate-100 bg-white/90 p-3 sm:p-3.5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] sm:hidden font-semibold uppercase tracking-wide text-slate-500 truncate">
                        {c.shortLabel}
                      </span>
                      <span className="hidden sm:block text-[11px] font-medium text-slate-600 line-clamp-2 leading-snug flex-1 min-w-0 pr-1">
                        {c.label}
                      </span>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 ${c.iconBg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${c.iconColor}`} strokeWidth={2.25} />
                      </div>
                    </div>
                    <span
                      className={`mt-auto text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-brand-950 ${
                        isLoading ? 'animate-pulse text-slate-300' : ''
                      }`}
                    >
                      {isLoading ? '···' : display}
                    </span>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
