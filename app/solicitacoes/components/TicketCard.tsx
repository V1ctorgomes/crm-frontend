import React from 'react';
import { Clock } from 'lucide-react';
import { Ticket } from '@/types';

interface TicketCardProps {
  ticket: Ticket;
  stageId: string;
  onDragStart: (e: React.DragEvent, ticketId: string, stageId: string) => void;
  onClick: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, stageId, onDragStart, onClick }: TicketCardProps) {
  const pendingTicketTasks = ticket.tasks?.filter(t => !t.isCompleted) || [];
  const hasOverdue = pendingTicketTasks.some(t => new Date(t.dueDate) < new Date());

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, ticket.id, stageId)} 
      onClick={() => onClick(ticket)}
      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors w-full overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono">
          OS-{ticket.id.split('-')[0].toUpperCase()}
        </span>
        <div className="flex gap-1.5">
          {pendingTicketTasks.length > 0 && (
            <span className={`text-[10px] ${hasOverdue ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-blue-50 border-blue-100'} border px-1.5 py-0.5 rounded font-medium flex items-center gap-1`}>
              <Clock className="w-3 h-3" />
              {pendingTicketTasks.length}
            </span>
          )}
          {(ticket.files || []).length > 0 && (
            <span className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              Anexo
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
           {ticket.contact?.profilePictureUrl ? (
              <img src={ticket.contact.profilePictureUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="" />
           ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-slate-400"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
           )}
        </div>
        <h4 className="font-semibold text-slate-800 text-sm truncate">{ticket.contact?.name || ticket.contactNumber}</h4>
      </div>

      {(ticket.marca || ticket.modelo || ticket.customerType || ticket.ticketType) && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100">
          {ticket.ticketType && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded truncate border border-blue-100">{ticket.ticketType}</span>}
          {ticket.customerType && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.customerType}</span>}
          {ticket.marca && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.marca}</span>}
          {ticket.modelo && <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded truncate">{ticket.modelo}</span>}
        </div>
      )}
    </div>
  );
}