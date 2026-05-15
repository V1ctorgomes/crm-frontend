import React from 'react';
import { Building2, FolderOpen } from 'lucide-react';
import { formatCnpjInput } from '@/lib/companies';
import { CompanyFolder } from './types';

interface CompanyFoldersGridProps {
  filteredFolders: CompanyFolder[];
  setSelectedCompany: (folder: CompanyFolder) => void;
}

/** Primeiro nível da árvore de Arquivos: pastas por empresa solicitante. */
export function CompanyFoldersGrid({ filteredFolders, setSelectedCompany }: CompanyFoldersGridProps) {
  if (filteredFolders.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center mt-4">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">Nenhuma pasta encontrada.</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            Os arquivos anexados nas OS aparecerão aqui, agrupados por empresa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
      {filteredFolders.map((folder) => {
        const isOrphan = !folder.company;
        const title = folder.company
          ? folder.company.tradeName?.trim() || folder.company.legalName
          : 'Sem empresa vinculada';
        const subtitle = folder.company
          ? formatCnpjInput(folder.company.cnpj)
          : 'OS sem empresa solicitante';

        const totalOs = folder.contacts.reduce((sum, c) => sum + c.tickets.length, 0);
        const totalContacts = folder.contacts.length;

        return (
          <div
            key={folder.company?.id || '__no_company__'}
            onClick={() => setSelectedCompany(folder)}
            className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col items-center text-center relative ${
              isOrphan
                ? 'border-amber-200 hover:border-amber-400 bg-amber-50/40'
                : 'border-slate-200 hover:border-brand-400'
            }`}
          >
            <div className="relative mb-4 mt-2">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-sm ${
                  isOrphan
                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                    : 'bg-brand-50 border-brand-100 text-brand-700'
                }`}
              >
                <Building2 className="w-9 h-9" strokeWidth={1.6} />
              </div>
              <div className="absolute -top-1 -right-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                {totalOs} OS
              </div>
            </div>
            <h3
              className={`font-semibold text-sm truncate w-full ${isOrphan ? 'text-amber-800' : 'text-slate-800'}`}
              title={title}
            >
              {title}
            </h3>
            <p className="text-[11px] font-mono text-slate-500 truncate w-full mt-0.5">{subtitle}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalContacts} {totalContacts === 1 ? 'contato' : 'contatos'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
