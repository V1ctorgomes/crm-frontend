import React from 'react';
import { Stage, Ticket } from './types';
import {
  KANBAN_PAGE_SIZE,
  clampStagePage,
  getVisibleTicketRange,
} from './kanban-board-utils';
import { KanbanTicketCard } from './KanbanTicketCard';
import { KanbanColumnPagination } from './KanbanColumnPagination';

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
          visibleTickets.map((ticket) => (
            <KanbanTicketCard
              key={ticket.id}
              ticket={ticket}
              stageId={stage.id}
              reminderGreen={reminderGreenByTicketId[ticket.id] || 0}
              reminderRed={reminderRedByTicketId[ticket.id] || 0}
              onDragStart={onDragStart}
              onTicketClick={onTicketClick}
            />
          ))
        )}
      </div>

      {total > KANBAN_PAGE_SIZE && (
        <KanbanColumnPagination
          stageId={stage.id}
          clampedPage={clampedPage}
          totalPages={totalPages}
          rangeLabel={rangeLabel}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
