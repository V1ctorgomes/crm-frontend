import React, { useEffect, useMemo, useState } from 'react';
import { Stage, Ticket } from './types';
import { KanbanColumn } from './KanbanColumn';
import { buildStageTicketSignature, clampPagesByStages } from './kanban-board-utils';

interface KanbanBoardProps {
  isLoading: boolean;
  filteredStages: Stage[];
  searchTerm: string;
  reminderGreenByTicketId?: Record<string, number>;
  reminderRedByTicketId?: Record<string, number>;
  onDragStart: (e: React.DragEvent, ticketId: string, sourceStageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStageId: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export function KanbanBoard({
  isLoading,
  filteredStages,
  searchTerm,
  reminderGreenByTicketId = {},
  reminderRedByTicketId = {},
  onDragStart,
  onDragOver,
  onDrop,
  onTicketClick,
}: KanbanBoardProps) {
  const [pageByStageId, setPageByStageId] = useState<Record<string, number>>({});

  const stageTicketSignature = useMemo(
    () => buildStageTicketSignature(filteredStages),
    [filteredStages],
  );

  useEffect(() => {
    setPageByStageId({});
  }, [searchTerm]);

  useEffect(() => {
    setPageByStageId((prev) => clampPagesByStages(prev, filteredStages));
  }, [stageTicketSignature, filteredStages]);

  const handlePageChange = (stageId: string, newPage: number) => {
    setPageByStageId((prev) => ({
      ...prev,
      [stageId]: newPage,
    }));
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 md:px-8 min-h-0">
      <div className="flex h-full min-h-0 gap-5 items-stretch w-max pb-4 animate-in fade-in duration-700">
        {isLoading ? (
          <div className="w-[calc(100vw-300px)] flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shadow-sm"></div>
              <span className="text-slate-500 font-medium text-sm">A carregar funil...</span>
            </div>
          </div>
        ) : filteredStages.length === 0 ? (
          <div className="w-[calc(100vw-300px)] flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
            </div>
            <h4 className="font-semibold text-brand-950 text-lg">Funil Vazio</h4>
            <p className="text-sm text-slate-500 mt-1">Configure as suas fases de atendimento para começar.</p>
          </div>
        ) : (
          filteredStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              searchTerm={searchTerm}
              page={pageByStageId[stage.id] ?? 0}
              reminderGreenByTicketId={reminderGreenByTicketId}
              reminderRedByTicketId={reminderRedByTicketId}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragStart={onDragStart}
              onTicketClick={onTicketClick}
              onPageChange={handlePageChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
