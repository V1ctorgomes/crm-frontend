import React from 'react';
import Link from 'next/link';

export function NoInstancesView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center animate-in fade-in">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Nenhuma Instância Conectada</h2>
      <p className="text-slate-500 mb-6 max-w-md text-sm">Para começar a enviar e receber mensagens com os seus clientes, você precisa primeiro criar e conectar uma instância do WhatsApp.</p>
      <Link href="/configuracoes" className="bg-slate-900 text-white px-6 py-2.5 rounded-md font-medium hover:bg-slate-800 transition-all flex items-center gap-2">
        Ir para Configurações
      </Link>
    </div>
  );
}