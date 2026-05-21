'use client';

import Sidebar from '@/components/Sidebar';
import { Package } from 'lucide-react';

export default function EstoqueDashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-canvas font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-[60px] md:pt-0 h-full overflow-y-auto">
        <div className="p-6 md:p-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-brand-950">Estoque — Visão geral</h1>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            Módulo de inventário da empresa. As funcionalidades de produtos, movimentações e inventário
            serão ligadas aqui conforme o sistema global for evoluindo.
          </p>
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Em construção — use o menu lateral para navegar entre as secções previstas.
          </div>
        </div>
      </main>
    </div>
  );
}
