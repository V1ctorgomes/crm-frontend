import React from 'react';
import { FolderTree, ChevronRight, FolderOpen, FileBox, Building2 } from 'lucide-react';
import { CompanyFolder, CustomerFolder, TicketFolder } from './types';

interface ArquivosBreadcrumbProps {
  selectedCompany: CompanyFolder | null;
  setSelectedCompany: (company: CompanyFolder | null) => void;
  selectedCustomer: CustomerFolder | null;
  setSelectedCustomer: (customer: CustomerFolder | null) => void;
  selectedTicket: TicketFolder | null;
  setSelectedTicket: (ticket: TicketFolder | null) => void;
  setPendingFile: (file: File | null) => void;
  setFolderSearchTerm: (val: string) => void;
}

export function ArquivosBreadcrumb({
  selectedCompany,
  setSelectedCompany,
  selectedCustomer,
  setSelectedCustomer,
  selectedTicket,
  setSelectedTicket,
  setPendingFile,
  setFolderSearchTerm,
}: ArquivosBreadcrumbProps) {
  const companyLabel = selectedCompany
    ? selectedCompany.company
      ? selectedCompany.company.tradeName?.trim() || selectedCompany.company.legalName
      : 'Sem empresa'
    : '';
  const isOrphanCompany = !!selectedCompany && !selectedCompany.company;

  return (
    <nav className="flex items-center gap-2 text-sm font-medium animate-in fade-in duration-500 flex-wrap">
      <button
        onClick={() => {
          setSelectedCompany(null);
          setSelectedCustomer(null);
          setSelectedTicket(null);
          setPendingFile(null);
          setFolderSearchTerm('');
        }}
        className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md ${
          !selectedCompany
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-brand-950 bg-white border border-slate-200'
        }`}
      >
        <FolderTree className="w-4 h-4" />
        Raiz
      </button>

      {selectedCompany && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setSelectedTicket(null);
              setPendingFile(null);
            }}
            className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md truncate max-w-[260px] ${
              !selectedCustomer
                ? isOrphanCompany
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-sm'
                  : 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                : 'text-slate-500 hover:bg-slate-100 hover:text-brand-950 bg-white border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{companyLabel}</span>
          </button>
        </>
      )}

      {selectedCustomer && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <button
            onClick={() => {
              setSelectedTicket(null);
              setPendingFile(null);
            }}
            className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-md truncate max-w-[260px] ${
              !selectedTicket
                ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100'
                : 'text-slate-500 hover:bg-slate-100 hover:text-brand-950 bg-white border border-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {selectedCustomer.contact.name || selectedCustomer.contact.number}
            </span>
          </button>
        </>
      )}

      {selectedTicket && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          <span
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm border shrink-0 ${
              selectedTicket.resolution === 'SUCCESS'
                ? 'bg-brand-50 text-brand-800 border-brand-200'
                : selectedTicket.resolution === 'CANCELLED'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : selectedTicket.isArchived
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-brand-50 text-brand-700 border-brand-200'
            }`}
          >
            <FileBox className="w-4 h-4" />
            OS {selectedTicket.id.split('-')[0].toUpperCase()}
            {selectedTicket.resolution === 'SUCCESS'
              ? ' (Ganho)'
              : selectedTicket.resolution === 'CANCELLED'
                ? ' (Cancelado)'
                : selectedTicket.isArchived
                  ? ' (Encerrada)'
                  : ''}
          </span>
        </>
      )}
    </nav>
  );
}
