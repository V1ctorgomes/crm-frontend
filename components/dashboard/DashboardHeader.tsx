import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface DashboardHeaderProps {
  isInstanceConnected: boolean;
}

export function DashboardHeader({ isInstanceConnected }: DashboardHeaderProps) {
  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Acompanhe as métricas e o desempenho da sua operação.</p>
      </div>
      
      <div className="flex items-center gap-3">
         <div className="bg-white border border-slate-200 px-3 py-2 rounded-md shadow-sm flex items-center gap-2.5">
           <div className="relative flex h-2 w-2">
              {isInstanceConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isInstanceConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
           </div>
           <span className="text-xs font-medium text-slate-600">{isInstanceConnected ? 'API Conectada' : 'Desconectado'}</span>
         </div>
         <Link href="/solicitacoes" className="bg-slate-900 text-white px-4 py-2 rounded-md font-medium shadow hover:bg-slate-800 transition-colors text-sm flex items-center gap-2">
            Abrir Kanban <ExternalLink className="w-3.5 h-3.5" />
         </Link>
      </div>
    </header>
  );
}