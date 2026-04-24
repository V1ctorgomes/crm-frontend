'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DeveloperPage() {
  const today = new Date().toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      
      {/* Menu Lateral Fixo */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 pt-[80px] md:pt-10">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Developer</h1>
            <p className="text-slate-500 mt-1 font-medium">{today}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Recursos de API & Integrações</h2>
            </div>
            
            <p className="text-slate-600 mb-6 font-medium">
              Bem-vindo ao painel de administração técnica. A partir desta área poderá gerir chaves de acesso, configurar webhooks da Evolution API e verificar os logs do sistema.
            </p>
            
            <div className="p-10 border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-300 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.492-3.396m-2.492 3.396L9.5 17.25m0 0l-1.125-1.125m1.125 1.125l-1.125-1.125m-3-3l1.125 1.125m0 0l1.125-1.125m-1.125 1.125v-3.75M9.5 17.25A4.5 4.5 0 015 12.75v-3.75M17.25 5.25a2.25 2.25 0 012.25 2.25v3.75A4.5 4.5 0 0115 15.75m-6-10.5l-3 3m0 0l3 3m-3-3h10.5" />
              </svg>
              <h3 className="text-slate-800 font-bold mb-1">Módulo em Desenvolvimento</h3>
              <p className="text-sm text-slate-500 max-w-md">
                A interface para gestão de credenciais do backend e configuração de rotas está a ser preparada para ser integrada.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}