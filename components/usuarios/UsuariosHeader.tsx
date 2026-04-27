import React from 'react';

interface UsuariosHeaderProps {
  totalUsers: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewUser: () => void;
}

export function UsuariosHeader({ totalUsers, searchTerm, onSearchChange, onNewUser }: UsuariosHeaderProps) {
  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Equipa do Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Gira os utilizadores, permissões e contas de acesso ({totalUsers} no total).</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full sm:w-[300px] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 mr-2 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input 
            type="text" 
            placeholder="Procurar nome ou e-mail..." 
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button 
          onClick={onNewUser} 
          className="bg-slate-900 text-white px-4 h-10 rounded-md font-medium shadow hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Novo Utilizador
        </button>
      </div>
    </header>
  );
}