'use client';

import React from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import './dashboard.css';

export default function DashboardPage() {
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
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Visão Geral</h1>
            <p className="text-slate-500 mt-1 font-medium">{today}</p>
          </div>
          
          <Link 
            href="/whatsapp" 
            className="bg-[#1FA84A] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-all shadow-sm flex items-center gap-2 w-fit no-underline"
          >
            <i className="bi bi-chat-dots-fill"></i>
            Abrir WhatsApp
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <i className="bi bi-people-fill text-2xl text-blue-500"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Total de Contactos</p>
              <h3 className="text-3xl font-black text-slate-800">1,248</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <i className="bi bi-send-check-fill text-2xl text-[#1FA84A]"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Mensagens</p>
              <h3 className="text-3xl font-black text-slate-800">8,592</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <i className="bi bi-cloud-check-fill text-2xl text-orange-500"></i>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Nuvem R2</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-800">1.2 <span className="text-lg text-slate-500 font-bold">GB</span></h3>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Status do Servidor</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-green-600 uppercase">Operacional</span>
            </div>
          </div>
          
          <div className="p-10 flex flex-col items-center justify-center text-center text-slate-400">
            <i className="bi bi-activity text-5xl mb-4 text-slate-200"></i>
            <p className="font-medium text-slate-600">O sistema está a processar dados em tempo real.</p>
            <div className="mt-6 flex gap-8 text-sm font-medium">
              <div className="flex items-center gap-2"><i className="bi bi-check2-circle text-green-500"></i> Evolution API: OK</div>
              <div className="flex items-center gap-2"><i className="bi bi-check2-circle text-green-500"></i> Cloudflare R2: OK</div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}