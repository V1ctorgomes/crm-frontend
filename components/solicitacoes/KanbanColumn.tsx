import React from 'react';
import { Building2, ChevronLeft, ChevronRight, Clock, UserRound } from 'lucide-react';
import { Stage, Ticket } from './types';
import { isTaskDueOnCalendarToday, isTaskOverdue } from '@/lib/solicitacoes-reminders';
import { formatCnpjInput } from '@/lib/companies';
import {
  KANBAN_PAGE_SIZE,
  clampStagePage,
  getVisibleTicketRange,
} from './kanban-board-utils';

interface KanbanColumnProps {
  stage: Stage;
  searchTerm: string;
  page: number;
  reminderGreenByTicketId: Record<string, number>;
  reminderRedByTicketId: Record<string, number>;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStageId: string) => void;
  onDragStart: (e: React.DragEvent, ticketId: string, sourceStageId: string) => void;
  onTicketClick: (ticket: Ticket) => void;
  onPageChange: (stageId: string, newPage: number) => void;
}

export function KanbanColumn({
  stage,
  searchTerm,
  page,
  reminderGreenByTicketId,
  reminderRedByTicketId,
  onDragOver,
  onDrop,
  onDragStart,
  onTicketClick,
  onPageChange,
}: KanbanColumnProps) {
  const total = stage.tickets.length;
  const clampedPage = clampStagePage(page, total);
  const { start, rangeLabel, totalPages } = getVisibleTicketRange(clampedPage, total);
  const visibleTickets = stage.tickets.slice(start, start + KANBAN_PAGE_SIZE);

  return (
    <div
      className="w-[320px] min-w-[320px] bg-slate-100/50 rounded-xl flex flex-col h-full min-h-0 max-h-full border border-slate-200 shadow-sm overflow-hidden shrink-0"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: stage.color }}></div>

      <div className="px-4 py-3 flex justify-between items-center shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></div>
          <h3 className="font-semibold text-slate-800 text-sm">{stage.name}</h3>
        </div>
        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200">
          {total}
        </span>
      </div>

      <div className="crm-thin-scrollbar p-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-3">
        {stage.tickets.length === 0 && searchTerm ? (
          <p className="text-xs text-slate-400 text-center mt-4 font-medium">Nenhum resultado nesta fase.</p>
        ) : (
          visibleTickets.map((ticket) => {
            const pendingTicketTasks = ticket.tasks?.filter((t) => !t.isCompleted) || [];
            const greenR = reminderGreenByTicketId[ticket.id] || 0;
            const redR = reminderRedByTicketId[ticket.id] || 0;
            const futurePendingCount = pendingTicketTasks.filter(
              (t) => !isTaskOverdue(t.dueDate) && !isTaskDueOnCalendarToday(t.dueDate),
            ).length;

            return (
              <div
                key={ticket.id}
                draggable
                onDragStart={(e) => onDragStart(e, ticket.id, stage.id)}
                onClick={() => onTicketClick(ticket)}
                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-brand-400 transition-colors w-full shrink-0 overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono">OS-{ticket.id.split('-')[0].toUpperCase()}</span>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {greenR > 0 && (
                      <span className="text-[10px] text-white bg-emerald-500 border border-emerald-600/30 px-1.5 py-0.5 rounded-full font-bold min-w-[1.125rem] flex items-center justify-center tabular-nums leading-none">
                        {greenR > 99 ? '99+' : greenR}
                      </span>
                    )}
                    {redR > 0 && (
                      <span className="text-[10px] text-white bg-red-500 border border-red-600/30 px-1.5 py-0.5 rounded-full font-bold min-w-[1.125rem] flex items-center justify-center tabular-nums leading-none">
                        {redR > 99 ? '99+' : redR}
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
                    {ticket.ticketType && <span className="bg-highlight/30 text-brand-900 text-[10px] font-bold px-1.5 py-0.5 rounded truncate border border-highlight-warm/80">{ticket.ticketType}</span>}
                    {ticket.customerType && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.customerType}</span>}
                    {ticket.marca && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.marca}</span>}
                    {ticket.modelo && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.modelo}</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {total > KANBAN_PAGE_SIZE && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-t border-slate-200">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={clampedPage <= 0}
            onClick={() => onPageChange(stage.id, Math.max(0, clampedPage - 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-medium text-slate-600 tabular-nums">
            {rangeLabel} de {total} · {clampedPage + 1}/{totalPages}
          </span>
          <button
            type="button"
            aria-label="Página seguinte"
            disabled={clampedPage >= totalPages - 1}
            onClick={() => onPageChange(stage.id, Math.min(totalPages - 1, clampedPage + 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
