import React from 'react';

export function DeveloperHeader() {
  return (
    <header className="px-6 md:px-8 pt-8 md:pt-10 pb-6 flex flex-col shrink-0 z-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Developer Central</h1>
        <p className="text-slate-500 text-sm mt-1">Gestão de infraestrutura, APIs externas e conectividade.</p>
      </div>
    </header>
  );
}