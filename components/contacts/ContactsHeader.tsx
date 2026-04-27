import React from 'react';

interface ContactsHeaderProps {
  totalContacts: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ContactsHeader({ totalContacts, searchTerm, onSearchChange }: ContactsHeaderProps) {
  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contactos</h1>
        <p className="text-slate-500 text-sm mt-1">Faça a gestão da sua base de clientes ({totalContacts} registados).</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full xl:w-[350px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input 
          type="text" 
          placeholder="Procurar por nome, número ou e-mail..." 
          className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  );
}