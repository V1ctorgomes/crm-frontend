import React from 'react';

interface DeveloperTabsProps {
  activeTab: 'providers' | 'proxies';
  setActiveTab: (tab: 'providers' | 'proxies') => void;
}

export function DeveloperTabs({ activeTab, setActiveTab }: DeveloperTabsProps) {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 w-full sm:w-auto self-start">
      <button 
        onClick={() => setActiveTab('providers')}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'providers' ? 'bg-white text-brand-950 shadow-sm' : 'hover:text-brand-950'}`}
      >
        Provedores de API
      </button>
      <button 
        onClick={() => setActiveTab('proxies')}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${activeTab === 'proxies' ? 'bg-white text-brand-950 shadow-sm' : 'hover:text-brand-950'}`}
      >
        Rede de Proxies
      </button>
    </div>
  );
}