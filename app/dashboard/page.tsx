'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.replace('/login');
  };

  return (
    <div className="dash-container">
      <aside className="dash-sidebar">
        <div className="logo-container flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#22c55e] flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Suporte Imagem</span>
        </div>
        
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item active">
            <i className="bi bi-grid-fill"></i>
            <span>Overview</span>
          </Link>
          <Link href="/whatsapp" className="dash-nav-item">
            <i className="bi bi-chat-left-text-fill"></i>
            <span>WhatsApp</span>
          </Link>
        </nav>
        
        <div className="mt-auto mb-4 px-2">
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             Sistema Operacional
          </div>
          <button onClick={handleLogout} className="logout-btn w-full">
            <i className="bi bi-box-arrow-right"></i>
            <span>Terminar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <header>
          <h1 className="page-title">Métricas de Desempenho</h1>
          <p className="text-[#a1a1aa] text-sm">Acompanhamento em tempo real da infraestrutura.</p>
        </header>

        <div className="saas-grid">
          <div className="saas-card">
            <h3><i className="bi bi-people text-[#22c55e]"></i> Clientes Ativos</h3>
            <div className="value">1,284</div>
            <div className="mt-4 text-xs text-[#22c55e] font-medium">+12% vs último mês</div>
          </div>
          
          <div className="saas-card">
            <h3><i className="bi bi-server text-[#22c55e]"></i> Status da API</h3>
            <div className="value">99.9%</div>
            <div className="mt-4 text-xs text-[#a1a1aa] font-medium font-mono">{process.env.NEXT_PUBLIC_API_URL}</div>
          </div>
        </div>

        <section className="mt-8 border border-[#27272a] bg-[#121214] rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full border border-[#27272a] bg-[#09090b] flex items-center justify-center mb-6">
            <i className="bi bi-rocket-takeoff text-2xl text-[#22c55e]"></i>
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#fafafa]">Infraestrutura Conectada</h2>
          <p className="text-[#a1a1aa] text-sm max-w-md">
            O seu painel de controlo está agora otimizado para alta performance. Utilize o menu lateral para iniciar os atendimentos via WhatsApp.
          </p>
        </section>
      </main>
    </div>
  );
}