import React from 'react';
import { FolderOpen } from 'lucide-react';
import { CustomerFolder } from './types';

interface CustomerFoldersGridProps {
  filteredFolders: CustomerFolder[];
  setSelectedCustomer: (folder: CustomerFolder) => void;
}

export function CustomerFoldersGrid({ filteredFolders, setSelectedCustomer }: CustomerFoldersGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
      {filteredFolders.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center mt-4">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">Nenhuma pasta encontrada.</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">Os arquivos anexados nas OS aparecerão aqui.</p>
        </div>
      ) : (
        filteredFolders.map(folder => (
          <div 
            key={folder.contact.number} 
            onClick={() => setSelectedCustomer(folder)} 
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col items-center text-center relative"
          >
            <div className="relative mb-4 mt-2">
              <FolderOpen className="w-20 h-20 text-blue-500/90 group-hover:text-blue-500 transition-colors" strokeWidth={1.2} />
              <div className="absolute -top-1 -right-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                {folder.tickets.length} {folder.tickets.length === 1 ? 'OS' : 'OS'}
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 text-sm truncate w-full" title={folder.contact.name || folder.contact.number}>
              {folder.contact.name || folder.contact.number}
            </h3>
          </div>
        ))
      )}
    </div>
  );
}