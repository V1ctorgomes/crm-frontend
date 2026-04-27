import React from 'react';

interface EvolutionCardProps {
  evoBaseUrl: string;
  setEvoBaseUrl: (val: string) => void;
  evoApiKey: string;
  setEvoApiKey: (val: string) => void;
  isSavingProviders: boolean;
  handleSaveEvo: () => void;
}

export function EvolutionCard({ 
  evoBaseUrl, setEvoBaseUrl, evoApiKey, setEvoApiKey, isSavingProviders, handleSaveEvo 
}: EvolutionCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
          </div>
          <div>
            <h3 className="font-semibold leading-none tracking-tight text-base">Evolution API v2</h3>
            <p className="text-sm text-slate-500 mt-1">Gateway Oficial do WhatsApp</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border ${evoBaseUrl && evoApiKey ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {evoBaseUrl && evoApiKey ? 'Configurado' : 'Pendente'}
        </span>
      </div>
      
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-slate-700">URL Base</label>
          <input 
            type="text" 
            value={evoBaseUrl} 
            onChange={e => setEvoBaseUrl(e.target.value)} 
            placeholder="https://api.suaempresa.com" 
            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-slate-700">Global API Key</label>
          <input 
            type="password" 
            value={evoApiKey} 
            onChange={e => setEvoApiKey(e.target.value)} 
            placeholder="••••••••••••••••" 
            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
          />
        </div>
      </div>
      <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50 mt-auto rounded-b-xl flex justify-end items-center py-4">
        <button 
          onClick={handleSaveEvo} 
          disabled={isSavingProviders} 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 disabled:opacity-50"
        >
          {isSavingProviders ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : null}
          {isSavingProviders ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </div>
  );
}