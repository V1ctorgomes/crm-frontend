import React from 'react';

interface CloudflareCardProps {
  cfAccountId: string;
  setCfAccountId: (val: string) => void;
  cfBucket: string;
  setCfBucket: (val: string) => void;
  cfAccessKey: string;
  setCfAccessKey: (val: string) => void;
  cfSecretKey: string;
  setCfSecretKey: (val: string) => void;
  cfPublicUrl: string;
  setCfPublicUrl: (val: string) => void;
  isSavingProviders: boolean;
  handleSaveCf: () => void;
}

export function CloudflareCard({
  cfAccountId, setCfAccountId, cfBucket, setCfBucket, cfAccessKey, setCfAccessKey, 
  cfSecretKey, setCfSecretKey, cfPublicUrl, setCfPublicUrl, isSavingProviders, handleSaveCf
}: CloudflareCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" /></svg>
          </div>
          <div>
            <h3 className="font-semibold leading-none tracking-tight text-base">Cloudflare R2</h3>
            <p className="text-sm text-slate-500 mt-1">Armazenamento de Ficheiros na Nuvem</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border ${cfAccountId && cfBucket ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {cfAccountId && cfBucket ? 'Configurado' : 'Pendente'}
        </span>
      </div>
      
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none text-slate-700">URL Pública do Bucket (Public Endpoint)</label>
          <input 
            type="text" 
            value={cfPublicUrl} 
            onChange={e => setCfPublicUrl(e.target.value)} 
            placeholder="Ex: https://pub-12345.r2.dev" 
            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Account ID</label>
            <input type="text" value={cfAccountId} onChange={e => setCfAccountId(e.target.value)} placeholder="1234567890abcdef" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Bucket Name</label>
            <input type="text" value={cfBucket} onChange={e => setCfBucket(e.target.value)} placeholder="meu-crm-storage" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Access Key ID</label>
            <input type="text" value={cfAccessKey} onChange={e => setCfAccessKey(e.target.value)} placeholder="Chave de Acesso" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-slate-700">Secret Access Key</label>
            <input type="password" value={cfSecretKey} onChange={e => setCfSecretKey(e.target.value)} placeholder="••••••••••••••••" className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
        </div>
      </div>
      
      <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50 mt-auto rounded-b-xl flex justify-end items-center py-4">
        <button 
          onClick={handleSaveCf} 
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