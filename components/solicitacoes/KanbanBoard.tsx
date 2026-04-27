import React from 'react';
import { Clock } from 'lucide-react';
import { Stage, Ticket } from './types';

interface KanbanBoardProps {
  isLoading: boolean;
  filteredStages: Stage[];
  searchTerm: string;
  onDragStart: (e: React.DragEvent, ticketId: string, sourceStageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStageId: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

export function KanbanBoard({ isLoading, filteredStages, searchTerm, onDragStart, onDragOver, onDrop, onTicketClick }: KanbanBoardProps) {
  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 md:px-8">
      <div className="flex h-full gap-5 items-start w-max pb-4 animate-in fade-in duration-700">
        {isLoading ? (
          <div className="w-[calc(100vw-300px)] flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin shadow-sm"></div>
              <span className="text-slate-500 font-medium text-sm">A carregar funil...</span>
            </div>
          </div>
        ) : filteredStages.length === 0 ? (
          <div className="w-[calc(100vw-300px)] flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
            </div>
            <h4 className="font-semibold text-slate-900 text-lg">Funil Vazio</h4>
            <p className="text-sm text-slate-500 mt-1">Configure as suas fases de atendimento para começar.</p>
          </div>
        ) : (
          filteredStages.map((stage) => (
            <div 
              key={stage.id} 
              className="w-[320px] bg-slate-100/50 rounded-xl flex flex-col max-h-full border border-slate-200 shadow-sm overflow-hidden shrink-0"
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
                  stage.tickets.map((ticket) => {
                    const pendingTicketTasks = ticket.tasks?.filter(t => !t.isCompleted) || [];
                    const hasOverdue = pendingTicketTasks.some(t => new Date(t.dueDate) < new Date());

                    return (
                    <div 
                      key={ticket.id} 
                      draggable 
                      onDragStart={(e) => onDragStart(e, ticket.id, stage.id)} 
                      onClick={() => onTicketClick(ticket)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors w-full overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded font-mono">OS-{ticket.id.split('-')[0].toUpperCase()}</span>
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
                  )})
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}