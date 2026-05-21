'use client';

import Sidebar from '@/components/Sidebar';

export default function EstoqueProdutosPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-brand-950">Produtos</h1>
        <p className="mt-2 text-sm text-slate-600">Cadastro de produtos — em breve.</p>
      </main>
    </div>
  );
}
