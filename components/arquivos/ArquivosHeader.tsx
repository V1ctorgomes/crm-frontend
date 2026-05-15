import React from 'react';
import { Search } from 'lucide-react';

interface ArquivosHeaderProps {
  /** Quando `true`, mostra o campo de busca (só faz sentido nas listas de pastas). */
  showSearch: boolean;
  /** Placeholder dinâmico (empresa vs. contato) para guiar a busca. */
  searchPlaceholder: string;
  folderSearchTerm: string;
  setFolderSearchTerm: (val: string) => void;
}

export function ArquivosHeader({
  showSearch,
  searchPlaceholder,
  folderSearchTerm,
  setFolderSearchTerm,
}: ArquivosHeaderProps) {
  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Arquivos & Anexos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Faça a gestão dos documentos técnicos e imagens das Ordens de Serviço — agrupados por empresa, contato e OS.
        </p>
      </div>

      {showSearch && (
        <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 h-10 w-full xl:w-[350px] shadow-sm focus-within:ring-2 focus-within:ring-brand-600/20 focus-within:border-brand-600 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-brand-950 placeholder:text-slate-400 placeholder:font-normal"
            value={folderSearchTerm}
            onChange={(e) => setFolderSearchTerm(e.target.value)}
          />
        </div>
      )}
    </header>
  );
}