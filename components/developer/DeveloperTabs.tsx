import React from 'react';

interface DeveloperTabsProps {
  activeTab: 'providers' | 'proxies' | 'catalogo';
  setActiveTab: (tab: 'providers' | 'proxies' | 'catalogo') => void;
}

export function DeveloperTabs({ activeTab, setActiveTab }: DeveloperTabsProps) {
  return (
    <div className="inline-flex h-auto min-h-10 flex-wrap items-center justify-start gap-1 rounded-lg bg-slate-100 p-1 text-slate-500 w-full sm:w-auto self-start">
      <button
        type="button"
        onClick={() => setActiveTab('providers')}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'providers' ? 'bg-white text-brand-950 shadow-sm' : 'hover:text-brand-950'}`}
      >
        Provedores de API
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('proxies')}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'proxies' ? 'bg-white text-brand-950 shadow-sm' : 'hover:text-brand-950'}`}
      >
        Rede de Proxies
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('catalogo')}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'catalogo' ? 'bg-white text-brand-950 shadow-sm' : 'hover:text-brand-950'}`}
      >
        Catálogo de OS
      </button>
    </div>
  );
}