import React from 'react';
import { Plus } from 'lucide-react';

interface ContactsHeaderProps {
  /** Contactos individuais (exclui grupos @g.us). */
  totalIndividualContacts: number;
  totalGroups: number;
  totalCompanies: number;
  isCompaniesTab: boolean;
  isGroupsTab: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateCompany: () => void;
}

export function ContactsHeader({
  totalIndividualContacts,
  totalGroups,
  totalCompanies,
  isCompaniesTab,
  isGroupsTab,
  searchTerm,
  onSearchChange,
  onCreateCompany,
}: ContactsHeaderProps) {
  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">
          {isCompaniesTab ? 'Empresas' : isGroupsTab ? 'Grupos WhatsApp' : 'Contatos'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isCompaniesTab
            ? `Directório global de empresas que pode vincular aos contatos (${totalCompanies} registadas).`
            : isGroupsTab
              ? `Grupos com conversa no CRM — classifique como cliente ou colaborador (${totalGroups} registados).`
              : `Faça a gestão da sua base de contactos individuais (${totalIndividualContacts} registados).`}
        </p>
      </div>

      <div className="flex items-center gap-3 w-full xl:w-auto">
        <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 flex-1 xl:w-[350px] shadow-sm focus-within:ring-2 focus-within:ring-brand-600/20 focus-within:border-brand-600 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder={
              isCompaniesTab
                ? 'Procurar por razão social, nome fantasia ou CNPJ...'
                : isGroupsTab
                  ? 'Procurar por nome do grupo ou id…'
                  : 'Procurar por nome, número ou e-mail...'
            }
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-brand-950 placeholder:text-slate-400 placeholder:font-normal"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {isCompaniesTab && (
          <button
            onClick={onCreateCompany}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Adicionar Empresa
          </button>
        )}
      </div>
    </header>
  );
}
