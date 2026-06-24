import React from 'react';
import { Building2, Clock, UserRound } from 'lucide-react';
import { Ticket } from './types';
import { isTaskDueOnCalendarToday, isTaskOverdue } from '@/lib/solicitacoes-reminders';
import { formatCnpjInput } from '@/lib/companies';

interface KanbanTicketCardProps {
  ticket: Ticket;
  stageId: string;
  reminderGreen: number;
  reminderRed: number;
  onDragStart: (e: React.DragEvent, ticketId: string, sourceStageId: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export function KanbanTicketCard({
  ticket,
  stageId,
  reminderGreen,
  reminderRed,
  onDragStart,
  onTicketClick,
}: KanbanTicketCardProps) {
  const pendingTicketTasks = ticket.tasks?.filter((t) => !t.isCompleted) || [];
  const futurePendingCount = pendingTicketTasks.filter(
    (t) => !isTaskOverdue(t.dueDate) && !isTaskDueOnCalendarToday(t.dueDate),
  ).length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id, stageId)}
      onClick={() => onTicketClick(ticket)}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-brand-400 transition-colors w-full shrink-0 overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono">
          OS-{ticket.id.split('-')[0].toUpperCase()}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {reminderGreen > 0 && (
            <span className="text-[10px] text-white bg-emerald-500 border border-emerald-600/30 px-1.5 py-0.5 rounded-full font-bold min-w-[1.125rem] flex items-center justify-center tabular-nums leading-none">
              {reminderGreen > 99 ? '99+' : reminderGreen}
            </span>
          )}
          {reminderRed > 0 && (
            <span className="text-[10px] text-white bg-red-500 border border-red-600/30 px-1.5 py-0.5 rounded-full font-bold min-w-[1.125rem] flex items-center justify-center tabular-nums leading-none">
              {reminderRed > 99 ? '99+' : reminderRed}
            </span>
          )}
          {futurePendingCount > 0 && (
            <span className="text-[10px] text-brand-600 bg-brand-50 border border-brand-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {futurePendingCount}
            </span>
          )}
          {(ticket.files || []).length > 0 && (
            <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              Anexo
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-700">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          {ticket.company ? (
            <>
              <h4 className="font-semibold text-brand-950 text-sm leading-tight truncate" title={ticket.company.legalName}>
                {ticket.company.tradeName?.trim() || ticket.company.legalName}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono truncate" title={formatCnpjInput(ticket.company.cnpj)}>
                {formatCnpjInput(ticket.company.cnpj)}
              </p>
            </>
          ) : (
            <>
              <h4 className="font-semibold text-amber-700 text-sm leading-tight truncate">Sem empresa vinculada</h4>
              <p className="text-[11px] text-amber-600 truncate">Vincule em Contatos para futuras OS.</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-50 border border-slate-100">
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
          {ticket.contact?.profilePictureUrl ? (
            <img src={ticket.contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />
          ) : (
            <UserRound className="w-3 h-3 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 flex items-baseline gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide shrink-0">Solicitante</span>
          <span className="text-xs font-medium text-slate-700 truncate" title={ticket.contact?.name || ticket.contactNumber}>
            {ticket.contact?.name || ticket.contactNumber}
          </span>
        </div>
      </div>

      {(ticket.marca || ticket.modelo || ticket.customerType || ticket.ticketType) && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
          {ticket.ticketType && (
            <span className="bg-highlight/30 text-brand-900 text-[10px] font-bold px-1.5 py-0.5 rounded truncate border border-highlight-warm/80">
              {ticket.ticketType}
            </span>
          )}
          {ticket.customerType && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.customerType}</span>
          )}
          {ticket.marca && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.marca}</span>
          )}
          {ticket.modelo && (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.modelo}</span>
          )}
        </div>
      )}
    </div>
  );
}
