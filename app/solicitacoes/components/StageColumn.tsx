import React from 'react';
import { Stage, Ticket } from '@/types';
import { TicketCard } from './TicketCard';

interface StageColumnProps {
  stage: Stage;
  searchTerm: string;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, ticketId: string, stageId: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export function StageColumn({ stage, searchTerm, onDragOver, onDrop, onDragStart, onTicketClick }: StageColumnProps) {
  return (
    <div 
      className="w-[320px] bg-slate-100/50 rounded-xl flex flex-col max-h-full border border-slate-200 shadow-sm overflow-hidden"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div className="h-1 w-full" style={{ backgroundColor: stage.color }}></div>
      
      <div className="px-4 py-3 flex justify-between items-center shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></div>
          <h3 className="font-semibold text-slate-800 text-sm">{stage.name}</h3>
        </div>
        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md border border-slate-200">
          {stage.tickets.length}
        </span>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 no-scrollbar">
        {stage.tickets.length === 0 && searchTerm ? (
          <p className="text-xs text-slate-400 text-center mt-4 font-medium">Nenhum resultado nesta fase.</p>
        ) : (
          stage.tickets.map((ticket) => (
            <TicketCard 
              key={ticket.id}
              ticket={ticket}
              stageId={stage.id}
              onDragStart={onDragStart}
              onClick={onTicketClick}
            />
          ))
        )}
      </div>
    </div>
  );
}