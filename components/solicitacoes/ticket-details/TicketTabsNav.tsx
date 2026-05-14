import React from 'react';
import { X } from 'lucide-react';
import type { Ticket } from '../types';

export type TicketDetailsTab = 'tasks' | 'notes' | 'files';

interface TicketTabsNavProps {
  ticket: Ticket;
  active: TicketDetailsTab;
  onChange: (tab: TicketDetailsTab) => void;
  onClose: () => void;
}

/** Cabeçalho com as três abas (Lembretes/Notas/Anexos) e botão fechar. */
export function TicketTabsNav({ ticket, active, onChange, onClose }: TicketTabsNavProps) {
  const tabClass = (id: TicketDetailsTab) =>
    `pb-3 font-medium text-sm transition-all border-b-2 ${
      active === id ? 'border-brand-600 text-brand-950' : 'border-transparent text-slate-500 hover:text-slate-800'
    }`;
  const pendingTasks = ticket.tasks?.filter((t) => !t.isCompleted).length || 0;
  const filesCount = (ticket.files || []).length;

  return (
    <div className="px-6 border-b border-slate-200 flex justify-between items-end shrink-0 pt-4">
      <div className="flex gap-6">
        <button onClick={() => onChange('tasks')} className={`${tabClass('tasks')} flex items-center gap-2`}>
          Lembretes
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              active === 'tasks' ? 'bg-slate-100 text-brand-950' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            {pendingTasks}
          </span>
        </button>
        <button onClick={() => onChange('notes')} className={tabClass('notes')}>
          Notas Internas
        </button>
        <button onClick={() => onChange('files')} className={`${tabClass('files')} flex items-center gap-2`}>
          Anexos
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              active === 'files' ? 'bg-slate-100 text-brand-950' : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            {filesCount}
          </span>
        </button>
      </div>
      <button onClick={onClose} className="mb-2 text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
