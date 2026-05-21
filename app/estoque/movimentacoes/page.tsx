'use client';

import Sidebar from '@/components/Sidebar';

export default function EstoqueMovimentacoesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-brand-950">Movimentações</h1>
        <p className="mt-2 text-sm text-slate-600">Entradas, saídas e transferências — em breve.</p>
      </main>
    </div>
  );
}
