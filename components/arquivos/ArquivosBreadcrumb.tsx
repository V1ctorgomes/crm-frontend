import React from 'react';
import { FolderTree, ChevronRight, FolderOpen, FileBox } from 'lucide-react';
import { CustomerFolder, TicketFolder } from './types';

interface ArquivosBreadcrumbProps {
  selectedCustomer: CustomerFolder | null;
  setSelectedCustomer: (customer: CustomerFolder | null) => void;
  selectedTicket: TicketFolder | null;
  setSelectedTicket: (ticket: TicketFolder | null) => void;
  setPendingFile: (file: File | null) => void;
  setFolderSearchTerm: (val: string) => void;
}

export function ArquivosBreadcrumb({
  selectedCustomer, setSelectedCustomer, selectedTicket, setSelectedTicket, setPendingFile, setFolderSearchTerm
}: ArquivosBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm font-medium animate-in fade-in duration-500">
      <button 
        onClick={() => { setSelectedCustomer(null); setSelectedTicket(null); setPendingFile(null); setFolderSearchTerm(''); }} 
        className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md ${!selectedCustomer ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'}`}
      >
        <FolderTree className="w-4 h-4" />
        Raiz
      </button>
      
      {selectedCustomer && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <button 
            onClick={() => { setSelectedTicket(null); setPendingFile(null); }} 
            className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md truncate ${!selectedTicket ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'}`}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">{selectedCustomer.contact.name || selectedCustomer.contact.number}</span>
          </button>
        </>
      )}

      {selectedTicket && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm border shrink-0 ${
            selectedTicket.resolution === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : 
            selectedTicket.resolution === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' : 
            selectedTicket.isArchived ? 'bg-slate-100 text-slate-700 border-slate-200' : 
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <FileBox className="w-4 h-4" />
            OS {selectedTicket.id.split('-')[0].toUpperCase()}
            {selectedTicket.resolution === 'SUCCESS' ? ' (Ganho)' : selectedTicket.resolution === 'CANCELLED' ? ' (Cancelado)' : selectedTicket.isArchived ? ' (Encerrada)' : ''}
          </span>
        </>
      )}
    </nav>
  );
}