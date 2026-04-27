import React from 'react';
import { FileBox, File, Trash2 } from 'lucide-react';
import { CustomerFolder, TicketFolder } from './types';

interface TicketFoldersGridProps {
  selectedCustomer: CustomerFolder;
  setSelectedTicket: (ticket: TicketFolder) => void;
  handleDeleteTicket: (ticketId: string) => void;
}

export function TicketFoldersGrid({ selectedCustomer, setSelectedTicket, handleDeleteTicket }: TicketFoldersGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
      {selectedCustomer.tickets.map(ticket => (
        <div 
          key={ticket.id} 
          className={`bg-white border ${
            ticket.resolution === 'SUCCESS' ? 'border-green-200 bg-green-50/30 hover:border-green-400' : 
            ticket.resolution === 'CANCELLED' ? 'border-red-200 bg-red-50/30 hover:border-red-400' : 
            ticket.isArchived ? 'border-slate-200 bg-slate-50/50' : 
            'border-slate-200 hover:border-blue-400'
          } rounded-xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden cursor-pointer`}
          onClick={() => setSelectedTicket(ticket)}
        >
          <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${
                ticket.resolution === 'SUCCESS' ? 'bg-green-100 text-green-600 border-green-200' : 
                ticket.resolution === 'CANCELLED' ? 'bg-red-100 text-red-600 border-red-200' : 
                ticket.isArchived ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                'bg-slate-50 text-slate-600 border-slate-200'
              } group-hover:scale-105 transition-transform`}>
                <FileBox className="w-5 h-5" />
              </div>
              {ticket.isArchived && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border ${
                  ticket.resolution === 'SUCCESS' ? 'bg-green-100 text-green-700 border-green-200' : 
                  ticket.resolution === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' : 
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {ticket.resolution === 'SUCCESS' ? 'Ganho' : ticket.resolution === 'CANCELLED' ? 'Cancelado' : 'Encerrada'}
                </span>
              )}
            </div>
            
            {ticket.isArchived && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                className="w-8 h-8 shrink-0 rounded-md bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                title="Excluir OS Permanentemente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base">OS {ticket.id.split('-')[0].toUpperCase()}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1 truncate">{ticket.marca} {ticket.modelo}</p>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <File className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">{ticket.files.length} {ticket.files.length === 1 ? 'Anexo' : 'Anexos'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}